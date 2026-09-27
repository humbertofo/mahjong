import * as fs from 'fs';
import * as path from 'path';

export interface GraphNode {
  path: string;
  relativePath: string;
  lines: number;
  sizeBytes: number;
  dependencies: string[];       // Arquivos que este nó importa (forward)
  dependents: string[];         // Arquivos que importam este nó (reverse / blast radius direto)
  transitiveDependents: string[]; // Todos os arquivos afetados em cascata (blast radius total)
  blastRadiusScore: number;     // % do projeto afetado
  riskLevel: 'BAIXO' | 'MÉDIO' | 'ALTO' | 'CRÍTICO';
  isOrphan: boolean;            // Se não é importado por ninguém e não é entry point
  isMonolith: boolean;          // Se possui mais de 1.000 linhas
}

export interface GraphCodeReport {
  timestamp: string;
  totalFiles: number;
  totalLines: number;
  monoliths: { file: string; lines: number; sizeKb: string }[];
  orphans: string[];
  cycles: string[][];
  nodes: Record<string, GraphNode>;
}

export class GraphCode {
  private rootDir: string;
  private nodes: Map<string, GraphNode> = new Map();
  private entryPoints = new Set(['src/main.ts', 'src/index.css', 'index.html']);

  constructor(rootDir: string = 'src') {
    this.rootDir = path.resolve(rootDir);
  }

  private walkFiles(dir: string): string[] {
    let results: string[] = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const full = path.join(dir, file);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
          results = results.concat(this.walkFiles(full));
        }
      } else if (file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.css')) {
        results.push(full);
      }
    }
    return results;
  }

  private resolveImport(sourceFile: string, importPath: string): string | null {
    if (!importPath.startsWith('.')) return null; // Ignora pacotes de node_modules

    const sourceDir = path.dirname(sourceFile);
    const resolvedBase = path.normalize(path.join(sourceDir, importPath));

    const candidates = [
      resolvedBase,
      resolvedBase + '.ts',
      resolvedBase + '.js',
      path.join(resolvedBase, 'index.ts'),
      path.join(resolvedBase, 'index.js')
    ];

    for (const cand of candidates) {
      if (fs.existsSync(cand) && !fs.statSync(cand).isDirectory()) {
        return path.resolve(cand);
      }
    }
    return null;
  }

  public analyze(): GraphCodeReport {
    const filePaths = this.walkFiles(this.rootDir);

    // 1. Inicializar nós
    filePaths.forEach((fp) => {
      const abs = path.resolve(fp);
      const rel = path.relative(process.cwd(), abs).replace(/\\/g, '/');
      const content = fs.readFileSync(abs, 'utf-8');
      const lines = content.split('\n').length;
      const sizeBytes = fs.statSync(abs).size;

      this.nodes.set(abs, {
        path: abs,
        relativePath: rel,
        lines,
        sizeBytes,
        dependencies: [],
        dependents: [],
        transitiveDependents: [],
        blastRadiusScore: 0,
        riskLevel: 'BAIXO',
        isOrphan: false,
        isMonolith: lines >= 1000
      });
    });

    // 2. Extrair dependências (Imports/Exports)
    this.nodes.forEach((node, absPath) => {
      const content = fs.readFileSync(absPath, 'utf-8');
      const importRegex = /(?:import|export)\s+(?:[\w*\s{},]*\s+from\s+)?['"]([^'"]+)['"]/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        const resolved = this.resolveImport(absPath, importPath);
        if (resolved && this.nodes.has(resolved) && resolved !== absPath) {
          if (!node.dependencies.includes(resolved)) {
            node.dependencies.push(resolved);
          }
          const depNode = this.nodes.get(resolved)!;
          if (!depNode.dependents.includes(absPath)) {
            depNode.dependents.push(absPath);
          }
        }
      }
    });

    // 3. Calcular Blast Radius Transitivo (Fechamento Transitivo em Grafo Reverso)
    this.nodes.forEach((node, absPath) => {
      const visited = new Set<string>();
      const queue = [...node.dependents];

      while (queue.length > 0) {
        const current = queue.shift()!;
        if (!visited.has(current)) {
          visited.add(current);
          const currNode = this.nodes.get(current);
          if (currNode) {
            for (const next of currNode.dependents) {
              if (!visited.has(next)) queue.push(next);
            }
          }
        }
      }

      node.transitiveDependents = Array.from(visited);
      const total = this.nodes.size;
      node.blastRadiusScore = Math.round((node.transitiveDependents.length / total) * 100);

      // Classificação de risco
      if (node.blastRadiusScore >= 40) {
        node.riskLevel = 'CRÍTICO';
      } else if (node.blastRadiusScore >= 20) {
        node.riskLevel = 'ALTO';
      } else if (node.blastRadiusScore >= 5) {
        node.riskLevel = 'MÉDIO';
      } else {
        node.riskLevel = 'BAIXO';
      }

      // Detecção de órfãos
      if (node.dependents.length === 0 && !this.entryPoints.has(node.relativePath) && !node.relativePath.includes('/pipeline/')) {
        node.isOrphan = true;
      }
    });

    // 4. Detecção de Ciclos de Dependência (Tarjan ou DFS Simples)
    const cycles: string[][] = [];
    const visitedGlobal = new Set<string>();
    const recStack = new Set<string>();

    const dfsCycle = (current: string, pathStack: string[]) => {
      visitedGlobal.add(current);
      recStack.add(current);
      pathStack.push(current);

      const currNode = this.nodes.get(current);
      if (currNode) {
        for (const neighbor of currNode.dependencies) {
          if (!visitedGlobal.has(neighbor)) {
            dfsCycle(neighbor, pathStack);
          } else if (recStack.has(neighbor)) {
            const cycleStart = pathStack.indexOf(neighbor);
            const cycle = pathStack.slice(cycleStart).map(p => this.nodes.get(p)?.relativePath || p);
            cycle.push(this.nodes.get(neighbor)?.relativePath || neighbor);
            cycles.push(cycle);
          }
        }
      }

      recStack.delete(current);
      pathStack.pop();
    };

    this.nodes.forEach((_, p) => {
      if (!visitedGlobal.has(p)) {
        dfsCycle(p, []);
      }
    });

    // 5. Compilar Relatório
    const monoliths = Array.from(this.nodes.values())
      .filter(n => n.isMonolith)
      .map(n => ({
        file: n.relativePath,
        lines: n.lines,
        sizeKb: (n.sizeBytes / 1024).toFixed(1) + ' KB'
      }))
      .sort((a, b) => b.lines - a.lines);

    const orphans = Array.from(this.nodes.values())
      .filter(n => n.isOrphan)
      .map(n => n.relativePath)
      .sort();

    const nodesObj: Record<string, GraphNode> = {};
    let totalLines = 0;
    this.nodes.forEach((n, p) => {
      totalLines += n.lines;
      nodesObj[n.relativePath] = {
        ...n,
        dependencies: n.dependencies.map(d => this.nodes.get(d)?.relativePath || d),
        dependents: n.dependents.map(d => this.nodes.get(d)?.relativePath || d),
        transitiveDependents: n.transitiveDependents.map(d => this.nodes.get(d)?.relativePath || d)
      };
    });

    return {
      timestamp: new Date().toISOString(),
      totalFiles: this.nodes.size,
      totalLines,
      monoliths,
      orphans,
      cycles,
      nodes: nodesObj
    };
  }

  public printQuery(targetQuery: string): void {
    const report = this.analyze();
    const matches = Object.keys(report.nodes).filter(k => k.toLowerCase().includes(targetQuery.toLowerCase()));

    if (matches.length === 0) {
      console.log(`❌ Nenhum arquivo encontrado correspondente a: "${targetQuery}"`);
      return;
    }

    matches.forEach(m => {
      const n = report.nodes[m];
      console.log('========================================================================');
      console.log(`📍 ANÁLISE DE BLAST RADIUS: ${n.relativePath}`);
      console.log('========================================================================');
      console.log(`  • Linhas de código:  ${n.lines}`);
      console.log(`  • Nível de Risco:    ${n.riskLevel} (${n.blastRadiusScore}% da codebase)`);
      console.log(`  • É Monólito?       ${n.isMonolith ? 'SIM (requer desmembramento)' : 'Não'}`);
      console.log(`  • É Órfão?          ${n.isOrphan ? 'SIM (código morto)' : 'Não'}`);
      console.log(`\n  📦 Dependências Diretas (${n.dependencies.length} arquivos que ele consome):`);
      if (n.dependencies.length === 0) console.log('     (nenhuma)');
      else n.dependencies.forEach(d => console.log(`     -> ${d}`));

      console.log(`\n  💥 Blast Radius Direto (${n.dependents.length} arquivos que o importam diretamente):`);
      if (n.dependents.length === 0) console.log('     (nenhum)');
      else n.dependents.forEach(d => console.log(`     <- ${d}`));

      console.log(`\n  🌊 Blast Radius Transitivo Total (${n.transitiveDependents.length} arquivos afetados em cascata):`);
      if (n.transitiveDependents.length === 0) console.log('     (nenhum impacto cascata)');
      else n.transitiveDependents.forEach(d => console.log(`     ⚡ [IMPACTO] ${d}`));
      console.log('');
    });
  }

  public printAudit(): void {
    const report = this.analyze();
    console.log('========================================================================');
    console.log('🛡️ AUDITORIA DE SAÚDE DA CODEBASE & ARQUITETURA GRAPHCODE');
    console.log('========================================================================\n');
    console.log(`Total de arquivos mapeados: ${report.totalFiles}`);
    console.log(`Total de linhas de código:  ${report.totalLines}\n`);

    console.log('🏛️ 1. MONÓLITOS DETECTADOS (> 1.000 LINHAS):');
    if (report.monoliths.length === 0) {
      console.log('   ✅ Nenhum monólito encontrado!');
    } else {
      report.monoliths.forEach(m => {
        console.log(`   ⚠️ [MONÓLITO] ${m.lines.toString().padStart(6)} linhas | ${m.sizeKb.padStart(9)} | ${m.file}`);
      });
    }

    console.log('\n💀 2. ARQUIVOS ÓRFÃOS / CÓDIGO MORTO (0 DEPENDENTES):');
    if (report.orphans.length === 0) {
      console.log('   ✅ Nenhum arquivo órfão encontrado!');
    } else {
      report.orphans.forEach(o => {
        console.log(`   🗑️ [ÓRFÃO] ${o}`);
      });
    }

    console.log('\n🔄 3. CICLOS DE DEPENDÊNCIA:');
    if (report.cycles.length === 0) {
      console.log('   ✅ Nenhum ciclo circular detectado (Grafo é um DAG perfeito)!');
    } else {
      report.cycles.forEach((c, idx) => {
        console.log(`   ❌ Ciclo ${idx + 1}: ${c.join(' -> ')}`);
      });
    }

    console.log('\n🔥 4. TOP 5 ARQUIVOS COM MAIOR BLAST RADIUS (CRÍTICOS PARA ALTERAÇÕES):');
    const sortedByRadius = Object.values(report.nodes).sort((a, b) => b.transitiveDependents.length - a.transitiveDependents.length);
    sortedByRadius.slice(0, 5).forEach((n, i) => {
      console.log(`   ${i + 1}. [${n.riskLevel}] ${n.relativePath} -> Impacta ${n.transitiveDependents.length} arquivos (${n.blastRadiusScore}% do sistema)`);
    });
    console.log('\n========================================================================');
  }

  public saveJson(outputPath: string): void {
    const report = this.analyze();
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`💾 Grafo de dependências e Blast Radius salvo em: ${outputPath}`);
  }
}

// Execução CLI direta
const args = process.argv.slice(2);
const gc = new GraphCode('src');

if (args.includes('--save')) {
  gc.saveJson('.agent/graphcode.json');
} else if (args.includes('--audit') || args.length === 0) {
  gc.printAudit();
  gc.saveJson('.agent/graphcode.json');
} else {
  const query = args[0];
  gc.printQuery(query);
}
