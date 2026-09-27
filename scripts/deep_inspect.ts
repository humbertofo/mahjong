import * as fs from 'fs';
import * as path from 'path';

interface Finding {
  category: 'DEAD_CODE' | 'INCOHERENCE' | 'DOM_MISMATCH' | 'GAP';
  file: string;
  description: string;
}

const findings: Finding[] = [];

// 1. Check DOM IDs between index.html and UI files
const htmlContent = fs.readFileSync('index.html', 'utf-8');
const idMatches = htmlContent.matchAll(/id=["']([A-Za-z0-9_-]+)["']/g);
const htmlIds = new Set<string>();
for (const m of idMatches) {
  htmlIds.add(m[1]);
}

const uiFiles = [
  'src/ui/UIManager.ts',
  'src/ui/HUDController.ts',
  'src/ui/TrayAnimator.ts',
  'src/ui/NatureFeedbackController.ts',
  'src/ui/modals/LevelsModal.ts',
  'src/ui/modals/SettingsModal.ts',
  'src/ui/modals/GameEndModals.ts',
  'src/main.ts',
];

const tsReferencedIds = new Set<string>();
for (const f of uiFiles) {
  if (!fs.existsSync(f)) continue;
  const content = fs.readFileSync(f, 'utf-8');
  const getElMatches = content.matchAll(/(?:getElementById|querySelector)\(['"]#?([A-Za-z0-9_-]+)['"]\)/g);
  for (const m of getElMatches) {
    const id = m[1];
    tsReferencedIds.add(id);
    if (!htmlIds.has(id) && !id.startsWith('.') && !id.includes(' ')) {
      // Se não existe no HTML estático e não é gerado dinamicamente
      findings.push({
        category: 'DOM_MISMATCH',
        file: f,
        description: `Código busca ID '#${id}' que NÃO existe em index.html!`,
      });
    }
  }
}

// 2. Check for unused private methods or unused fields in UI / Engine classes
function getAllTsFiles(dir: string): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...getAllTsFiles(p));
    else if (entry.isFile() && entry.name.endsWith('.ts')) results.push(p);
  }
  return results;
}

const allTs = getAllTsFiles(path.resolve('src'));

for (const file of allTs) {
  const content = fs.readFileSync(file, 'utf-8');
  const relPath = path.relative(process.cwd(), file).replace(/\\/g, '/');

  // Check private methods: private myMethod(...)
  const privMethods = content.matchAll(/private\s+(?:async\s+)?([A-Za-z0-9_]+)\s*\(/g);
  for (const m of privMethods) {
    const name = m[1];
    if (name === 'constructor') continue;
    // Check references count inside file
    const regex = new RegExp(`\\b${name}\\b`, 'g');
    const matches = content.match(regex);
    if (matches && matches.length === 1) {
      findings.push({
        category: 'DEAD_CODE',
        file: relPath,
        description: `Método privado 'private ${name}()' nunca é chamado dentro do próprio arquivo!`,
      });
    }
  }

  // Check for TODOs or FIXMEs or commented-out blocks
  const lines = content.split('\n');
  lines.forEach((l, idx) => {
    if (l.includes('TODO:') || l.includes('FIXME:')) {
      findings.push({
        category: 'GAP',
        file: `${relPath}:${idx + 1}`,
        description: `Comentário pendente encontrado: ${l.trim()}`,
      });
    }
  });
}

// 3. Check SoundManager audio assets vs usage
const soundManagerContent = fs.readFileSync('src/audio/SoundManager.ts', 'utf-8');
// Check Web Audio API synthesizer methods
const sfxMethods = soundManagerContent.matchAll(/public\s+(play[A-Za-z0-9_]+)\s*\(/g);
for (const m of sfxMethods) {
  const methodName = m[1];
  let usedCount = 0;
  for (const file of allTs) {
    if (file.endsWith('SoundManager.ts')) continue;
    const c = fs.readFileSync(file, 'utf-8');
    if (c.includes(methodName)) {
      usedCount++;
    }
  }
  if (usedCount === 0) {
    findings.push({
      category: 'DEAD_CODE',
      file: 'src/audio/SoundManager.ts',
      description: `Método de som '${methodName}()' nunca é chamado no jogo!`,
    });
  }
}

// 4. Check for Audio Timbre integration gap
const hasTimbreInAudio = soundManagerContent.includes('timbre');
if (!hasTimbreInAudio) {
  findings.push({
    category: 'INCOHERENCE',
    file: 'src/audio/SoundManager.ts',
    description: 'TileEntityConfig define timbres de áudio por peça, mas SoundManager não possui suporte a timbres temáticos para enriquecer o som!',
  });
}

console.log('========================================================================');
console.log(`🔍 RESULTADOS DA VARREDURA PROFUNDA (${findings.length} achados):`);
console.log('========================================================================\n');

findings.forEach((f) => {
  console.log(`[${f.category}] ${f.file} -> ${f.description}`);
});

console.log('\n========================================================================');
