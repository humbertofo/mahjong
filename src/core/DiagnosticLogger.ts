import { soundManager } from '../audio/SoundManager';

export interface FrameSample {
  timestamp: number;
  deltaMs: number; // Intervalo VSYNC desde o último quadro renderizado
  boardMs: number;
  fxMs: number;
  totalMs: number;
  activeTiles: number;
  isSlow: boolean; // > 16.6ms (dropped 60 FPS)
  isJanky: boolean; // > 33.3ms (dropped 30 FPS)
  tags?: string;
}

export interface LongTaskRecord {
  timestamp: number;
  durationMs: number;
  startTime: number;
}

export interface GameEventRecord {
  timestamp: number;
  category: string;
  action: string;
  data?: any;
}

export interface ErrorRecord {
  timestamp: number;
  message: string;
  stack?: string;
  type: string;
}

export interface PhaseLoadMetric {
  levelIndex: number;
  layoutId: string;
  layoutName: string;
  tilesCount: number;
  engineGenMs: number;
  tilePrewarmMs: number;
  uiSetupMs: number;
  totalLoadMs: number;
  timestamp: number;
}

export interface BenchmarkPhaseDetail {
  levelIndex: number;
  layoutName: string;
  tilesCount: number;
  loadMs: number;
  prewarmMs: number;
  avgMatchFrameMs: number;
  totalMovesExecuted: number;
  victory: boolean;
  shufflesUsed: number;
}

export interface BenchmarkResult {
  executedAt: string;
  phasesTested: number;
  fullGamesCleared: number;
  totalMovesSimulated: number;
  avgLoadTimeMs: number;
  avgEngineGenMs: number;
  avgPrewarmMs: number;
  avgFrameMs: number;
  minFrameMs: number;
  maxFrameMs: number;
  simulatedFps: number;
  heapDeltaMB: number;
  grade: 'S' | 'A' | 'B' | 'C';
  summary: string;
  phaseDetails: BenchmarkPhaseDetail[];
}

export class DiagnosticLogger {
  private static instance: DiagnosticLogger | null = null;

  // Capacidade dos buffers circulares para zero pressão de memória
  private readonly MAX_FRAMES = 500;
  private readonly MAX_EVENTS = 200;
  private readonly MAX_LONG_TASKS = 100;
  private readonly MAX_ERRORS = 50;
  private readonly MAX_PHASE_LOADS = 25;

  private frameBuffer: FrameSample[] = [];
  private eventBuffer: GameEventRecord[] = [];
  private longTaskBuffer: LongTaskRecord[] = [];
  private errorBuffer: ErrorRecord[] = [];
  private phaseLoadBuffer: PhaseLoadMetric[] = [];
  private lastBenchmarkResult: BenchmarkResult | null = null;

  private isEnabled: boolean = true;
  private performanceObserver: PerformanceObserver | null = null;
  private batteryInfo: { levelPct: number; charging: boolean } | null = null;
  private lastFrameTimestamp: number = 0;
  private storageInfo: { usageMB: number; quotaMB: number; persisted: boolean } | null = null;
  private lifecycleStats = {
    hiddenCount: 0,
    totalBackgroundMs: 0,
    lastHiddenAt: 0,
    wasDiscarded: false,
  };
  private touchStats = {
    totalTaps: 0,
    freeTileTaps: 0,
    blockedTileTaps: 0,
    missTaps: 0,
  };

  private constructor() {
    this.initErrorInterception();
    this.initLongTaskObserver();
    this.initBatteryMonitoring();
    this.initStorageMonitoring();
    this.initLifecycleMonitoring();
  }

  private initBatteryMonitoring(): void {
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any).getBattery?.().then((b: any) => {
        const update = () => {
          this.batteryInfo = {
            levelPct: Math.round(b.level * 100),
            charging: b.charging,
          };
        };
        update();
        b.addEventListener('levelchange', update);
        b.addEventListener('chargingchange', update);
      }).catch(() => {});
    }
  }

  private initStorageMonitoring(): void {
    if (typeof navigator !== 'undefined' && navigator.storage?.estimate) {
      Promise.all([
        navigator.storage.estimate().catch(() => null),
        navigator.storage.persisted ? navigator.storage.persisted().catch(() => false) : Promise.resolve(false),
      ]).then(([est, persisted]) => {
        if (est) {
          this.storageInfo = {
            usageMB: est.usage ? Number((est.usage / 1048576).toFixed(2)) : 0,
            quotaMB: est.quota ? Number((est.quota / 1048576).toFixed(2)) : 0,
            persisted: !!persisted,
          };
        }
      }).catch(() => {});
    }
  }

  private initLifecycleMonitoring(): void {
    if (typeof document === 'undefined') return;

    this.lifecycleStats.wasDiscarded = (document as any).wasDiscarded || false;

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.lifecycleStats.hiddenCount++;
        this.lifecycleStats.lastHiddenAt = performance.now();
      } else if (this.lifecycleStats.lastHiddenAt > 0) {
        this.lifecycleStats.totalBackgroundMs += Math.round(performance.now() - this.lifecycleStats.lastHiddenAt);
        this.lifecycleStats.lastHiddenAt = 0;
      }
    });
  }

  public recordTouch(isFree: boolean): void {
    this.touchStats.totalTaps++;
    if (isFree) {
      this.touchStats.freeTileTaps++;
    } else {
      this.touchStats.blockedTileTaps++;
    }
  }

  public recordTouchMiss(): void {
    this.touchStats.totalTaps++;
    this.touchStats.missTaps++;
  }

  public updateStoragePersistence(persisted: boolean): void {
    if (this.storageInfo) {
      this.storageInfo.persisted = persisted;
    }
  }

  public static getInstance(): DiagnosticLogger {
    if (!DiagnosticLogger.instance) {
      DiagnosticLogger.instance = new DiagnosticLogger();
    }
    return DiagnosticLogger.instance;
  }

  private initErrorInterception(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('error', (event: ErrorEvent) => {
      this.recordError(event.message || 'Window Error', event.error?.stack, 'uncaught_error');
    });

    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message = typeof reason === 'string' ? reason : (reason?.message || 'Unhandled Rejection');
      const stack = reason?.stack;
      this.recordError(message, stack, 'unhandled_rejection');
    });
  }

  private initLongTaskObserver(): void {
    if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') return;

    try {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (let i = 0; i < entries.length; i++) {
          const entry = entries[i];
          this.recordLongTask(entry.duration, entry.startTime);
        }
      });
      this.performanceObserver.observe({ entryTypes: ['longtask'] });
    } catch {
      // Entrada 'longtask' não suportada neste WebView/browser
    }
  }

  public recordFrame(sample: {
    boardMs: number;
    fxMs: number;
    activeTiles: number;
    tags?: string;
  }): void {
    if (!this.isEnabled) return;

    const now = performance.now();
    const deltaMs = this.lastFrameTimestamp > 0 ? Number((now - this.lastFrameTimestamp).toFixed(2)) : 16.67;
    this.lastFrameTimestamp = now;

    const totalMs = sample.boardMs + sample.fxMs;
    const isSlow = totalMs > 16.6;
    const isJanky = totalMs > 33.3;

    const entry: FrameSample = {
      timestamp: Math.round(now),
      deltaMs,
      boardMs: Number(sample.boardMs.toFixed(2)),
      fxMs: Number(sample.fxMs.toFixed(2)),
      totalMs: Number(totalMs.toFixed(2)),
      activeTiles: sample.activeTiles,
      isSlow,
      isJanky,
      tags: sample.tags,
    };

    if (this.frameBuffer.length >= this.MAX_FRAMES) {
      this.frameBuffer.shift();
    }
    this.frameBuffer.push(entry);
  }

  public recordEvent(category: string, action: string, data?: any): void {
    if (!this.isEnabled) return;

    const entry: GameEventRecord = {
      timestamp: Math.round(performance.now()),
      category,
      action,
      data,
    };

    if (this.eventBuffer.length >= this.MAX_EVENTS) {
      this.eventBuffer.shift();
    }
    this.eventBuffer.push(entry);
  }

  public recordLongTask(durationMs: number, startTime: number): void {
    const entry: LongTaskRecord = {
      timestamp: Math.round(performance.now()),
      durationMs: Number(durationMs.toFixed(2)),
      startTime: Number(startTime.toFixed(2)),
    };

    if (this.longTaskBuffer.length >= this.MAX_LONG_TASKS) {
      this.longTaskBuffer.shift();
    }
    this.longTaskBuffer.push(entry);
  }

  public recordError(message: string, stack?: string, type: string = 'error'): void {
    if (message && message.toLowerCase().includes('plugin is not implemented')) {
      return;
    }

    const entry: ErrorRecord = {
      timestamp: Math.round(performance.now()),
      message,
      stack,
      type,
    };

    if (this.errorBuffer.length >= this.MAX_ERRORS) {
      this.errorBuffer.shift();
    }
    this.errorBuffer.push(entry);
  }

  public recordPhaseLoad(sample: PhaseLoadMetric): void {
    if (!this.isEnabled) return;
    if (this.phaseLoadBuffer.length >= this.MAX_PHASE_LOADS) {
      this.phaseLoadBuffer.shift();
    }
    this.phaseLoadBuffer.push(sample);
  }

  public recordBenchmarkResult(result: BenchmarkResult): void {
    this.lastBenchmarkResult = result;
  }

  public getLastBenchmarkResult(): BenchmarkResult | null {
    return this.lastBenchmarkResult;
  }

  public getPhaseLoadingSummary(): Record<string, any> {
    const list = this.phaseLoadBuffer;
    if (list.length === 0) {
      return { totalRecorded: 0, status: 'no_data' };
    }
    let sumTotal = 0;
    let sumEngine = 0;
    let sumPrewarm = 0;
    let sumUi = 0;
    let fastest = Infinity;
    let slowest = 0;

    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      sumTotal += item.totalLoadMs;
      sumEngine += item.engineGenMs;
      sumPrewarm += item.tilePrewarmMs;
      sumUi += item.uiSetupMs;
      if (item.totalLoadMs < fastest) fastest = item.totalLoadMs;
      if (item.totalLoadMs > slowest) slowest = item.totalLoadMs;
    }

    const count = list.length;
    return {
      totalRecorded: count,
      avgTotalLoadMs: Number((sumTotal / count).toFixed(2)),
      avgEngineGenMs: Number((sumEngine / count).toFixed(2)),
      avgTilePrewarmMs: Number((sumPrewarm / count).toFixed(2)),
      avgUiSetupMs: Number((sumUi / count).toFixed(2)),
      fastestLoadMs: Number(fastest.toFixed(2)),
      slowestLoadMs: Number(slowest.toFixed(2)),
    };
  }

  public getPerformanceStats(): {
    totalFrames: number;
    avgFrameMs: number;
    maxFrameMs: number;
    p95FrameMs: number;
    slowFrames: number;
    slowFramesPct: number;
    jankyFrames: number;
    jankyFramesPct: number;
    longTasksCount: number;
    estimatedRefreshRateHz: number;
  } {
    const frames = this.frameBuffer;
    const count = frames.length;
    if (count === 0) {
      return {
        totalFrames: 0,
        avgFrameMs: 0,
        maxFrameMs: 0,
        p95FrameMs: 0,
        slowFrames: 0,
        slowFramesPct: 0,
        jankyFrames: 0,
        jankyFramesPct: 0,
        longTasksCount: this.longTaskBuffer.length,
        estimatedRefreshRateHz: 60,
      };
    }

    let sum = 0;
    let max = 0;
    let slow = 0;
    let janky = 0;
    const totals: number[] = [];

    for (let i = 0; i < count; i++) {
      const f = frames[i];
      sum += f.totalMs;
      if (f.totalMs > max) max = f.totalMs;
      if (f.isSlow) slow++;
      if (f.isJanky) janky++;
      totals.push(f.totalMs);
    }

    totals.sort((a, b) => a - b);
    const p95Index = Math.min(totals.length - 1, Math.floor(totals.length * 0.95));
    const p95 = totals[p95Index] || 0;

    return {
      totalFrames: count,
      avgFrameMs: Number((sum / count).toFixed(2)),
      maxFrameMs: Number(max.toFixed(2)),
      p95FrameMs: Number(p95.toFixed(2)),
      slowFrames: slow,
      slowFramesPct: Number(((slow / count) * 100).toFixed(1)),
      jankyFrames: janky,
      jankyFramesPct: Number(((janky / count) * 100).toFixed(1)),
      longTasksCount: this.longTaskBuffer.length,
      estimatedRefreshRateHz: this.estimateDisplayRefreshRate(),
    };
  }

  private estimateDisplayRefreshRate(): number {
    const frames = this.frameBuffer;
    if (frames.length < 10) return 60;
    const intervals: number[] = [];
    for (let i = 1; i < frames.length; i++) {
      const dt = frames[i].timestamp - frames[i - 1].timestamp;
      if (dt > 4 && dt < 45) {
        intervals.push(dt);
      }
    }
    if (intervals.length < 8) return 60;
    intervals.sort((a, b) => a - b);
    const median = intervals[Math.floor(intervals.length / 2)];
    if (median <= 9.5) return 120;
    if (median <= 13) return 90;
    return 60;
  }

  private getGpuDiagnostics(): Record<string, any> {
    if (typeof document === 'undefined') return { supported: false };
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
      if (!gl) return { supported: false, reason: 'webgl_not_available' };
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      const unmaskedRenderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : null;
      const unmaskedVendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : null;
      const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
      const renderer = gl.getParameter(gl.RENDERER);
      const vendor = gl.getParameter(gl.VENDOR);
      return {
        supported: true,
        unmaskedRenderer: unmaskedRenderer || renderer || 'unknown',
        unmaskedVendor: unmaskedVendor || vendor || 'unknown',
        maxTextureSize: maxTextureSize || 0,
      };
    } catch (e: any) {
      return { supported: false, error: e?.message || 'probe_failed' };
    }
  }

  public getDeviceMetadata(): Record<string, any> {
    if (typeof window === 'undefined') return {};

    const boardCanvas = document.getElementById('board-canvas') as HTMLCanvasElement | null;
    const fxCanvas = document.getElementById('fx-canvas') as HTMLCanvasElement | null;

    const perfMem = (performance as any)?.memory;
    const nav = navigator as any;

    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      devicePixelRatio: window.devicePixelRatio || 1,
      screen: {
        width: window.screen.width,
        height: window.screen.height,
        availWidth: window.screen.availWidth,
        availHeight: window.screen.availHeight,
      },
      screenOrientation: window.screen?.orientation?.type || 'unknown',
      viewport: {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
      },
      boardCanvasSize: boardCanvas
        ? {
            width: boardCanvas.width,
            height: boardCanvas.height,
            clientWidth: boardCanvas.clientWidth,
            clientHeight: boardCanvas.clientHeight,
          }
        : null,
      fxCanvasSize: fxCanvas
        ? {
            width: fxCanvas.width,
            height: fxCanvas.height,
            clientWidth: fxCanvas.clientWidth,
            clientHeight: fxCanvas.clientHeight,
          }
        : null,
      gpu: this.getGpuDiagnostics(),
      audio: soundManager.getDiagnostics(),
      hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
      deviceMemoryGB: nav?.deviceMemory || 'unknown',
      battery: this.batteryInfo || 'unavailable',
      storage: this.storageInfo || 'unavailable',
      lifecycle: {
        hiddenCount: this.lifecycleStats.hiddenCount,
        totalBackgroundMs: this.lifecycleStats.totalBackgroundMs,
        wasDiscarded: this.lifecycleStats.wasDiscarded,
      },
      network: {
        online: typeof navigator !== 'undefined' ? navigator.onLine : true,
        effectiveType: nav?.connection?.effectiveType || 'unknown',
        saveData: nav?.connection?.saveData || false,
      },
      touchErgonomics: this.touchStats,
      jsHeap: perfMem
        ? {
            usedMB: Number((perfMem.usedJSHeapSize / 1048576).toFixed(2)),
            totalMB: Number((perfMem.totalJSHeapSize / 1048576).toFixed(2)),
            limitMB: Number((perfMem.jsHeapSizeLimit / 1048576).toFixed(2)),
          }
        : 'unavailable',
      capabilities: {
        webShare: typeof navigator !== 'undefined' && !!navigator.share,
        clipboard: typeof navigator !== 'undefined' && !!navigator.clipboard,
        wakeLock: typeof navigator !== 'undefined' && 'wakeLock' in navigator,
      },
    };
  }

  public generateFullReport(): Record<string, any> {
    return {
      app: 'Mahjong Solitaire Offline',
      version: '1.0.1',
      reportGeneratedAt: new Date().toISOString(),
      telemetryHint:
        this.frameBuffer.length === 0
          ? 'Nenhum frame de partida gravado ainda. Para coletar métricas de animação (deal, shuffle, sinergias e eliminação de pares), inicie uma fase, faça algumas jogadas e abra as configurações.'
          : `Coleta ativa: ${this.frameBuffer.length} quadros analisados.`,
      device: this.getDeviceMetadata(),
      performanceSummary: this.getPerformanceStats(),
      phaseLoading: {
        lastLoad: this.phaseLoadBuffer[this.phaseLoadBuffer.length - 1] || null,
        history: this.phaseLoadBuffer,
        summary: this.getPhaseLoadingSummary(),
      },
      benchmark: this.lastBenchmarkResult,
      longTasks: this.longTaskBuffer,
      recentFrames: this.frameBuffer,
      recentEvents: this.eventBuffer,
      errors: this.errorBuffer,
    };
  }

  public exportAsJson(): string {
    return JSON.stringify(this.generateFullReport(), null, 2);
  }

  public exportAsBlob(): Blob {
    const jsonStr = this.exportAsJson();
    return new Blob([jsonStr], { type: 'application/json' });
  }

  public async shareLogs(): Promise<{ success: boolean; method: string; message: string }> {
    const jsonStr = this.exportAsJson();
    const stats = this.getPerformanceStats();
    const fileName = `mahjong-perf-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const blob = new Blob([jsonStr], { type: 'application/json' });

    const summaryText = `🀄 Mahjong Solitaire - Relatório de Performance\n` +
      `Quadros analisados: ${stats.totalFrames} | Média: ${stats.avgFrameMs}ms | Pico: ${stats.maxFrameMs}ms\n` +
      `Frames lentos (>16ms): ${stats.slowFrames} (${stats.slowFramesPct}%)\n` +
      `Long Tasks detectadas: ${stats.longTasksCount}`;

    // 1. Tentar compartilhamento nativo de arquivo via Web Share API
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        const file = new File([blob], fileName, { type: 'application/json' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'Mahjong Solitaire - Diagnóstico',
            text: summaryText,
            files: [file],
          });
          return { success: true, method: 'native_file_share', message: 'Relatório compartilhado com sucesso!' };
        }
      } catch (e: any) {
        if (e?.name === 'AbortError') {
          return { success: false, method: 'cancelled', message: 'Compartilhamento cancelado.' };
        }
        // Se falhar o envio de arquivo, tenta compartilhar como texto
      }

      try {
        await navigator.share({
          title: 'Mahjong Solitaire - Diagnóstico',
          text: `${summaryText}\n\n---\nDados Brutos (JSON):\n${jsonStr.slice(0, 15000)}...`,
        });
        return { success: true, method: 'native_text_share', message: 'Texto de diagnóstico compartilhado com sucesso!' };
      } catch (e: any) {
        if (e?.name === 'AbortError') {
          return { success: false, method: 'cancelled', message: 'Compartilhamento cancelado.' };
        }
      }
    }

    // 2. Fallback: Download automático do arquivo .json
    try {
      this.downloadLogsFile(fileName);
      return { success: true, method: 'download', message: 'Arquivo baixado na pasta de Downloads!' };
    } catch {
      // 3. Fallback final: Copiar para área de transferência
      const copied = await this.copyLogsToClipboard();
      if (copied) {
        return { success: true, method: 'clipboard', message: 'Relatório copiado para a Área de Transferência!' };
      }
      return { success: false, method: 'failed', message: 'Não foi possível compartilhar ou salvar os logs.' };
    }
  }

  public async copyLogsToClipboard(): Promise<boolean> {
    try {
      const jsonStr = this.exportAsJson();
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(jsonStr);
        return true;
      }
      // Fallback para input temporário
      const textarea = document.createElement('textarea');
      textarea.value = jsonStr;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    } catch {
      return false;
    }
  }

  public downloadLogsFile(filename?: string): void {
    const fileName = filename || `mahjong-perf-${Date.now()}.json`;
    const blob = this.exportAsBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  public clearLogs(): void {
    this.frameBuffer = [];
    this.eventBuffer = [];
    this.longTaskBuffer = [];
    this.errorBuffer = [];
  }
}

export const diagnosticLogger = DiagnosticLogger.getInstance();
