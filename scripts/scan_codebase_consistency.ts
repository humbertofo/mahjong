import * as fs from 'fs';
import * as path from 'path';
import { CATALOG_50_LAYOUTS } from '../src/core/layouts/index';

console.log('========================================================================');
console.log('🔍 ANÁLISE DE CONSISTÊNCIA ARQUITETURAL E CÓDIGO MORTO');
console.log('========================================================================\n');

// 1. Verificar integridade das 50 fases
console.log(`Verificando 50 fases em CATALOG_50_LAYOUTS...`);
if (CATALOG_50_LAYOUTS.length !== 50) {
  console.error(`❌ ERRO: CATALOG_50_LAYOUTS tem ${CATALOG_50_LAYOUTS.length} fases (esperado: 50)`);
} else {
  console.log(`✅ [OK] Exatamente 50 fases no catálogo.`);
}

let phaseGaps = 0;
CATALOG_50_LAYOUTS.forEach((layout, idx) => {
  if (!layout.id || !layout.name || !layout.slots || layout.slots.length === 0) {
    console.error(`❌ Fase ${idx + 1} incompleta: id=${layout.id}, name=${layout.name}`);
    phaseGaps++;
  }
  if (layout.slots.length % 2 !== 0) {
    console.error(`❌ Fase ${idx + 1} (${layout.name}) tem número ÍMPAR de peças: ${layout.slots.length}!`);
    phaseGaps++;
  }
});
if (phaseGaps === 0) {
  console.log(`✅ [OK] Todas as 50 fases têm identificadores válidos e número PAR de peças.`);
}

// 2. LocalStorage leaks
function getAllFiles(dir: string): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...getAllFiles(p));
    else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.js'))) results.push(p);
  }
  return results;
}

const allTs = getAllFiles(path.resolve('src'));
let storageLeaks = 0;
for (const f of allTs) {
  if (f.includes('StorageManager.ts') || f.includes('LiveUpdateManager.ts')) continue;
  const content = fs.readFileSync(f, 'utf-8');
  if (content.includes('localStorage.')) {
    console.warn(`⚠️ [STORAGE LEAK] ${f} acessa localStorage diretamente sem passar por StorageManager!`);
    storageLeaks++;
  }
}
if (storageLeaks === 0) {
  console.log(`✅ [OK] Zero vazamentos de localStorage: acesso 100% encapsulado em StorageManager e LiveUpdateManager.`);
}

// 3. Verificação de type casts perigosos: 'as any' ou 'as unknown as'
let typeCasts = 0;
for (const f of allTs) {
  const content = fs.readFileSync(f, 'utf-8');
  const lines = content.split('\n');
  lines.forEach((l, idx) => {
    if (l.includes('as unknown as') || l.includes('as any')) {
      const rel = path.relative(process.cwd(), f).replace(/\\/g, '/');
      console.warn(`⚠️ [TYPE CAST ARRISCADO] ${rel}:${idx + 1} -> ${l.trim()}`);
      typeCasts++;
    }
  });
}
if (typeCasts === 0) {
  console.log(`✅ [OK] Zero type casts arriscados ('as any' ou 'as unknown as').`);
}

// 4. Verificação de sons órfãos não conectados em UIManager / BoardRenderer
console.log('\n========================================================================');
