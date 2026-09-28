export interface FrameSample {
  timestamp: number;
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

export class DiagnosticLogger {
  private static instance: DiagnosticLogger | null = null;

  // Capacidade dos buffers circulares para zero pressão de memória
  private readonly MAX_FRAMES = 500;
  private readonly MAX_EVENTS = 200;
  private readonly MAX_LONG_TASKS = 100;
  private readonly MAX_ERRORS = 50;

  private frameBuffer: FrameSample[] = [];
  private eventBuffer: GameEventRecord[] = [];
  private longTaskBuffer: LongTaskRecord[] = [];
  private errorBuffer: ErrorRecord[] = [];

  private isEnabled: boolean = true;
  private performanceObserver: PerformanceObserver | null = null;

  private constructor() {
    this.initErrorInterception();
    this.initLongTaskObserver();
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

    const totalMs = sample.boardMs + sample.fxMs;
    const isSlow = totalMs > 16.6;
    const isJanky = totalMs > 33.3;

    const entry: FrameSample = {
      timestamp: Math.round(performance.now()),
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
    };
  }

  public getDeviceMetadata(): Record<string, any> {
    if (typeof window === 'undefined') return {};

    const boardCanvas = document.getElementById('board-canvas') as HTMLCanvasElement | null;
    const fxCanvas = document.getElementById('fx-canvas') as HTMLCanvasElement | null;

    const perfMem = (performance as any)?.memory;

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
      hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
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
      device: this.getDeviceMetadata(),
      performanceSummary: this.getPerformanceStats(),
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
