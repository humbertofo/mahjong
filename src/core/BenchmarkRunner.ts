import { BoardEngine } from './BoardEngine';
import { ALL_LAYOUTS } from './layouts';
import { BoardRenderer } from '../render/BoardRenderer';
import { diagnosticLogger, BenchmarkResult, BenchmarkPhaseDetail } from './DiagnosticLogger';

export interface BenchmarkProgressCallback {
  (percentage: number, statusText: string): void;
}

/**
 * Simulador Zen e Executor de Benchmark Automatizado
 * Executa estresse de ciclo de vida completo em segundo plano:
 * - Carregamento matemático e retropropagação de fases (36 a 120 peças)
 * - Rasterização gráfica e pré-aquecimento de sprites e chanfros Z
 * - Simulação de jogadas reais (match de pares) e medição de frame-times
 * - Auditoria de pressão de memória JS Heap
 */
export class BenchmarkRunner {
  private static isRunning: boolean = false;

  public static getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Executa a bateria de benchmark automatizado nas 4 fases canônicas
   */
  public static async runBenchmark(
    renderer: BoardRenderer,
    onProgress?: BenchmarkProgressCallback
  ): Promise<BenchmarkResult> {
    if (this.isRunning) {
      throw new Error('Benchmark já está em execução.');
    }
    this.isRunning = true;

    const initialHeapBytes = (performance as any)?.memory?.usedJSHeapSize || 0;
    const testLevelIndices = [0, 7, 24, 41]; // Fase 1 (36), Fase 8 (44), Fase 25 (80), Fase 42 (120)
    const phaseDetails: BenchmarkPhaseDetail[] = [];
    const frameTimes: number[] = [];

    let totalLoadMs = 0;
    let totalEngineGenMs = 0;
    let totalPrewarmMs = 0;

    try {
      for (let step = 0; step < testLevelIndices.length; step++) {
        const levelIdx = testLevelIndices[step];
        const layout = ALL_LAYOUTS[levelIdx] || ALL_LAYOUTS[0];
        const pctBase = Math.round((step / testLevelIndices.length) * 100);

        if (onProgress) {
          onProgress(pctBase, `Testando Fase ${levelIdx + 1}: ${layout.name} (${layout.slots.length} peças)...`);
        }

        // 1. Cronometragem da Geração Matemática do Tabuleiro (Retropropagação)
        const tStartLoad = performance.now();
        const t0 = performance.now();
        const engine = new BoardEngine(layout, levelIdx);
        const engineGenMs = performance.now() - t0;

        // 2. Cronometragem do Pré-Aquecimento das Texturas Offscreen e Relevos Z
        const t1 = performance.now();
        renderer.setLevelIndex(levelIdx);
        renderer.setEngine(engine);
        const prewarmMs = performance.now() - t1;
        const phaseLoadMs = performance.now() - tStartLoad;

        totalLoadMs += phaseLoadMs;
        totalEngineGenMs += engineGenMs;
        totalPrewarmMs += prewarmMs;

        // 3. Simulação de 6 Jogadas Reais Consecutivas com Medição de Frame
        const matchDurations: number[] = [];
        const matchesToSimulate = Math.min(6, Math.floor(layout.slots.length / 4));

        for (let m = 0; m < matchesToSimulate; m++) {
          const hint = engine.getHintPair();
          if (!hint) break;

          const t1Tile = engine.getTiles().find((t) => t.id === hint.tile1Id);
          const t2Tile = engine.getTiles().find((t) => t.id === hint.tile2Id);

          if (t1Tile && t2Tile) {
            const startFrame = performance.now();
            engine.selectTile(t1Tile.id);
            engine.selectTile(t2Tile.id);
            renderer.requestRender();

            // Mede a duração do processamento do frame
            const frameMs = performance.now() - startFrame;
            matchDurations.push(frameMs);
            frameTimes.push(frameMs);
          }

          // Pequena pausa assíncrona (16ms) para simular o intervalo VSYNC natural
          await new Promise((resolve) => setTimeout(resolve, 16));
        }

        const avgMatchFrameMs = matchDurations.length > 0
          ? Number((matchDurations.reduce((a, b) => a + b, 0) / matchDurations.length).toFixed(2))
          : 1.5;

        phaseDetails.push({
          levelIndex: levelIdx,
          layoutName: layout.name,
          tilesCount: layout.slots.length,
          loadMs: Number(phaseLoadMs.toFixed(2)),
          prewarmMs: Number(prewarmMs.toFixed(2)),
          avgMatchFrameMs,
        });

        // Breve intervalo entre fases para permitir limpeza de microtarefas
        await new Promise((resolve) => setTimeout(resolve, 30));
      }

      const count = testLevelIndices.length;
      const avgLoadTimeMs = Number((totalLoadMs / count).toFixed(2));
      const avgEngineGenMs = Number((totalEngineGenMs / count).toFixed(2));
      const avgPrewarmMs = Number((totalPrewarmMs / count).toFixed(2));

      const allFrames = frameTimes.length > 0 ? frameTimes : [2.0];
      const sumFrames = allFrames.reduce((a, b) => a + b, 0);
      const avgFrameMs = Number((sumFrames / allFrames.length).toFixed(2));
      const minFrameMs = Number(Math.min(...allFrames).toFixed(2));
      const maxFrameMs = Number(Math.max(...allFrames).toFixed(2));

      const simulatedFps = Math.min(60, Math.round(1000 / Math.max(avgFrameMs, 16.67)));

      const finalHeapBytes = (performance as any)?.memory?.usedJSHeapSize || 0;
      const heapDeltaMB = initialHeapBytes > 0 && finalHeapBytes > 0
        ? Number(((finalHeapBytes - initialHeapBytes) / 1048576).toFixed(2))
        : 0;

      // Classificação Zen de Performance
      let grade: 'S' | 'A' | 'B' | 'C' = 'S';
      if (avgFrameMs > 16.6 || avgLoadTimeMs > 400) {
        grade = 'C';
      } else if (avgFrameMs > 10.0 || avgLoadTimeMs > 250) {
        grade = 'B';
      } else if (avgFrameMs > 5.0 || avgLoadTimeMs > 120) {
        grade = 'A';
      } else {
        grade = 'S';
      }

      const summary = `Classificação [${grade}]: Carga Média ${avgLoadTimeMs}ms (Prewarm: ${avgPrewarmMs}ms) | Gameplay ${avgFrameMs}ms/frame (${simulatedFps} FPS)`;

      const result: BenchmarkResult = {
        executedAt: new Date().toISOString(),
        phasesTested: count,
        avgLoadTimeMs,
        avgEngineGenMs,
        avgPrewarmMs,
        avgFrameMs,
        minFrameMs,
        maxFrameMs,
        simulatedFps,
        heapDeltaMB,
        grade,
        summary,
        phaseDetails,
      };

      diagnosticLogger.recordBenchmarkResult(result);

      if (onProgress) {
        onProgress(100, `Benchmark concluído com nota ${grade}!`);
      }

      return result;
    } finally {
      this.isRunning = false;
    }
  }
}
