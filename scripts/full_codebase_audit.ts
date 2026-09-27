import * as fs from 'fs';
import * as path from 'path';

interface AuditReport {
  filesAnalyzed: number;
  totalLines: number;
  monoliths: { file: string; lines: number; sizeKb: number }[];
  unusedExports: { file: string; exportedSymbol: string }[];
  ignoredParameters: { file: string; line: number; param: string }[];
  anyTypeUsages: { file: string; line: number; text: string }[];
  unreferencedFiles: string[];
  settingsGaps: string[];
}

const ROOT = path.resolve('src');

function getAllFiles(dir: string): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllFiles(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.css') || entry.name.endsWith('.html'))) {
      results.push(fullPath);
    }
  }
  return results;
}

const allFiles = getAllFiles(ROOT);
console.log(`Analyzing ${allFiles.length} files in src/...`);

const report: AuditReport = {
  filesAnalyzed: allFiles.length,
  totalLines: 0,
  monoliths: [],
  unusedExports: [],
  ignoredParameters: [],
  anyTypeUsages: [],
  unreferencedFiles: [],
  settingsGaps: [],
};

// 1. Analyze lines and monoliths
for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf-8');
  const lines = content.split('\n');
  report.totalLines += lines.length;
  const relPath = path.relative(process.cwd(), file).replace(/\\/g, '/');
  const sizeKb = Math.round(fs.statSync(file).size / 1024 * 10) / 10;

  if (lines.length > 700) {
    report.monoliths.push({ file: relPath, lines: lines.length, sizeKb });
  }

  // Check for ignored parameters (_param)
  lines.forEach((lineText, idx) => {
    const match = lineText.match(/(?:function\s+\w+|\w+)\s*\([^)]*(_\w+)[^)]*\)/);
    if (match && !lineText.includes('//') && !file.endsWith('.d.ts')) {
      report.ignoredParameters.push({
        file: relPath,
        line: idx + 1,
        param: match[1],
      });
    }

    // Check for explicit 'any' types
    if (lineText.match(/:\s*any\b|\bas\s+any\b/) && !file.endsWith('.test.ts') && !file.endsWith('.spec.ts')) {
      report.anyTypeUsages.push({
        file: relPath,
        line: idx + 1,
        text: lineText.trim(),
      });
    }
  });
}

// 2. Build import/export graph to detect unused exports
const fileContents = new Map<string, string>();
const exportsByFile = new Map<string, string[]>();

for (const file of allFiles) {
  if (!file.endsWith('.ts')) continue;
  const content = fs.readFileSync(file, 'utf-8');
  fileContents.set(file, content);

  // Match exported classes, interfaces, types, functions, consts, enums
  const exportMatches = content.matchAll(/export\s+(?:default\s+)?(?:class|interface|type|function|const|enum)\s+([A-Za-z0-9_]+)/g);
  const exports: string[] = [];
  for (const m of exportMatches) {
    exports.push(m[1]);
  }
  exportsByFile.set(file, exports);
}

// Check which exported symbols are never referenced in any other file
for (const [file, symbols] of exportsByFile.entries()) {
  const relPath = path.relative(process.cwd(), file).replace(/\\/g, '/');
  // Skip index barrel files if they only re-export, or main.ts
  if (relPath === 'src/main.ts') continue;

  for (const sym of symbols) {
    let referencedCount = 0;
    for (const [otherFile, otherContent] of fileContents.entries()) {
      if (otherFile === file) continue;
      // Regex check for word boundary of the symbol
      const regex = new RegExp(`\\b${sym}\\b`);
      if (regex.test(otherContent)) {
        referencedCount++;
      }
    }

    if (referencedCount === 0) {
      report.unusedExports.push({ file: relPath, exportedSymbol: sym });
    }
  }
}

// Output Results
console.log('\n========================================================================');
console.log('📊 RELATÓRIO DE AUDITORIA COMPLETA DA CODEBASE (SRC/)');
console.log('========================================================================\n');

console.log(`Total de arquivos: ${report.filesAnalyzed}`);
console.log(`Total de linhas:   ${report.totalLines}\n`);

console.log(`🏛️ MONÓLITOS / ARQUIVOS EXTENSOS (> 700 LINHAS): [${report.monoliths.length}]`);
report.monoliths.sort((a, b) => b.lines - a.lines).forEach(m => {
  console.log(`  - [${m.lines}L | ${m.sizeKb}KB] ${m.file}`);
});

console.log(`\n⚠️ PARÂMETROS IGNORADOS / DESATIVADOS (_param): [${report.ignoredParameters.length}]`);
report.ignoredParameters.forEach(p => {
  console.log(`  - ${p.file}:${p.line} -> '${p.param}'`);
});

console.log(`\n🚨 USOS DE 'any' EXPLICITO NA CODEBASE: [${report.anyTypeUsages.length}]`);
report.anyTypeUsages.forEach(a => {
  console.log(`  - ${a.file}:${a.line} -> ${a.text}`);
});

console.log(`\n📦 EXPORTS NÃO REFERENCIADOS EM NENHUM OUTRO ARQUIVO: [${report.unusedExports.length}]`);
report.unusedExports.forEach(e => {
  console.log(`  - ${e.file} -> '${e.exportedSymbol}'`);
});

console.log('\n========================================================================');
