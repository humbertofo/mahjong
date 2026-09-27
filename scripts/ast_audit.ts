import * as fs from 'fs';
import * as path from 'path';
import ts from 'typescript';

const ROOT_SRC = path.resolve('src');

function getAllTsFiles(dir: string): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllTsFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      results.push(fullPath);
    }
  }
  return results;
}

const filePaths = getAllTsFiles(ROOT_SRC);

// Build TS Program for deep AST and typecheck
const configPath = ts.findConfigFile('./', ts.sys.fileExists, 'tsconfig.json');
const configFile = ts.readConfigFile(configPath!, ts.sys.readFile);
const parsedCommandLine = ts.parseJsonConfigFileContent(
  configFile.config,
  ts.sys,
  path.dirname(configPath!)
);

const program = ts.createProgram({
  rootNames: parsedCommandLine.fileNames,
  options: parsedCommandLine.options,
});

const checker = program.getTypeChecker();

interface ParameterGap {
  file: string;
  line: number;
  paramName: string;
  reason: string;
}

interface ExportAudit {
  file: string;
  name: string;
  isUsedOutside: boolean;
}

const parameterGaps: ParameterGap[] = [];
const allExports: { file: string; name: string }[] = [];
const importedSymbols = new Set<string>();

for (const sourceFile of program.getSourceFiles()) {
  if (sourceFile.isDeclarationFile || !sourceFile.fileName.includes('src')) continue;
  const relPath = path.relative(process.cwd(), sourceFile.fileName).replace(/\\/g, '/');

  ts.forEachChild(sourceFile, function visit(node) {
    // Check parameters starting with _
    if (ts.isParameter(node)) {
      const name = node.name.getText(sourceFile);
      if (name.startsWith('_')) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        parameterGaps.push({
          file: relPath,
          line: line + 1,
          paramName: name,
          reason: 'Parâmetro prefixado com _ (possível gap ou funcionalidade desativada)',
        });
      }
    }

    // Check imports
    if (ts.isImportDeclaration(node)) {
      const importClause = node.importClause;
      if (importClause) {
        if (importClause.name) {
          importedSymbols.add(importClause.name.text);
        }
        if (importClause.namedBindings) {
          if (ts.isNamedImports(importClause.namedBindings)) {
            for (const el of importClause.namedBindings.elements) {
              importedSymbols.add((el.propertyName || el.name).text);
            }
          }
        }
      }
    }

    // Check exports
    if (ts.isExportDeclaration(node)) {
      if (node.exportClause && ts.isNamedExports(node.exportClause)) {
        for (const el of node.exportClause.elements) {
          allExports.push({ file: relPath, name: el.name.text });
        }
      }
    } else if (
      (ts.isFunctionDeclaration(node) ||
        ts.isClassDeclaration(node) ||
        ts.isInterfaceDeclaration(node) ||
        ts.isTypeAliasDeclaration(node) ||
        ts.isEnumDeclaration(node)) &&
      node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) &&
      node.name
    ) {
      allExports.push({ file: relPath, name: node.name.text });
    } else if (ts.isVariableStatement(node) && node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) {
      for (const decl of node.declarationList.declarations) {
        if (ts.isIdentifier(decl.name)) {
          allExports.push({ file: relPath, name: decl.name.text });
        }
      }
    }

    ts.forEachChild(node, visit);
  });
}

console.log('========================================================================');
console.log('🔬 AUDITORIA AST DO TYPESCRIPT (src/)');
console.log('========================================================================\n');

console.log(`⚠️ PARÂMETROS IGNORADOS COM _ (${parameterGaps.length}):`);
parameterGaps.forEach((p) => {
  console.log(`  - ${p.file}:${p.line} -> ${p.paramName}`);
});

// Check exports used outside their own file
const unusedExports: { file: string; name: string }[] = [];
for (const exp of allExports) {
  if (exp.file === 'src/main.ts' || exp.file.includes('index.ts')) continue;
  if (!importedSymbols.has(exp.name)) {
    unusedExports.push(exp);
  }
}

console.log(`\n📦 EXPORTS NÃO IMPORTADOS POR NENHUM OUTRO ARQUIVO (${unusedExports.length}):`);
unusedExports.forEach((u) => {
  console.log(`  - ${u.file} -> ${u.name}`);
});

console.log('\n========================================================================');
