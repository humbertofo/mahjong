import { BoardEngine } from '../core/BoardEngine';
import { SynergyDirector } from '../core/engine/SynergyDirector';
import { PlacedTile, ThemeType, SynergyResult, ClimateEffectResult, ClimateType, AnimalValue, TimeOfDay } from '../core/types';
import { canMatch } from '../core/deck';
import { TileRegistry } from '../core/nature/tiles';
import { TileRenderer } from './TileRenderer';
import { SynergyAnimator } from './SynergyAnimator';
import { ViewportCamera } from './ViewportCamera';
import { BoardAnimator } from './BoardAnimator';
import { FXParticleSystem } from './FXParticleSystem';
import { soundManager } from '../audio/SoundManager';
import { hapticManager } from '../audio/HapticManager';
import { diagnosticLogger } from '../core/DiagnosticLogger';

export interface BoardRendererCallbacks {
  onTileClick?: (tile: PlacedTile, isFree: boolean) => void;
  onBlockedTileClick?: (tile: PlacedTile, isBlockedFromAbove: boolean) => void;
  onMatchSuccess?: (pair: [PlacedTile, PlacedTile]) => void;
  onBoardCleared?: () => void;
  onWaveCleared?: (currentWave: number, totalWaves: number) => void;
  onSynergyTriggered?: (synergy: SynergyResult) => void;
  onClimateTriggered?: (climate: ClimateEffectResult) => void;
  onTileLongPress?: (tile: PlacedTile) => void;
  onCosmicRescue?: (rescuedTiles: PlacedTile[]) => void;
  onTrioMatched?: (trioTile: PlacedTile) => void;
  onStateChanged?: () => void;
  onTileFlightToTray?: (
    tile: PlacedTile,
    startX: number,
    startY: number,
    width: number,
    height: number,
    onArrival: () => void
  ) => void;
  onDeadlocked?: (isTrayFull: boolean) => void;
  onVinesEntangled?: (tile: PlacedTile) => void;
  onPredation?: (predation: { predator: PlacedTile; prey: PlacedTile; bonusHarmony: number }) => void;
  onTimeOfDayChanged?: (newTime: TimeOfDay) => void;
  onCocoonCracked?: (tile: PlacedTile) => void;
  onCocoonHatched?: (tile: PlacedTile) => void;
  onElementalSealed?: (tile: PlacedTile) => void;
  onElementalUnsealed?: (unsealedTiles: PlacedTile[]) => void;
}

export class BoardRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private engine: BoardEngine;
  private tileRenderer: TileRenderer;
  private callbacks: BoardRendererCallbacks;

  // Submódulos especialistas
  private camera: ViewportCamera = new ViewportCamera();
  private animator: BoardAnimator = new BoardAnimator();
  private fx: FXParticleSystem;
  private synergyAnimator: SynergyAnimator = new SynergyAnimator();

  private theme: ThemeType = 'mist-emerald';

  // Controle de animação e economia de bateria (Zero CPU/GPU ociosa)
  private isRunning: boolean = true;
  private animTime: number = 0;
  private isBoardDirty: boolean = true;
  private isFxActive: boolean = false;
  private animatingUntil: number = 0;
  private rafId: number | null = null;
  private loopBound: ((timestamp: number) => void) | null = null;
  public isInputLocked: boolean = false;
  private pendingTilesInFlight: number = 0;
  private lastClickTime: number = 0;

  // Fundo em Cache de Alta Performance (Hardware Blit)
  private bgCanvas: HTMLCanvasElement | null = null;
  private bgCacheKey: string = '';
  private sortedTilesCache: PlacedTile[] | null = null;
  private isPaused: boolean = true;
  private currentLevelIndex: number = 0;

  constructor(
    canvas: HTMLCanvasElement,
    engine: BoardEngine,
    callbacks: BoardRendererCallbacks = {},
    fxCanvas?: HTMLCanvasElement | null
  ) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Não foi possível obter o contexto 2D do Canvas');
    this.ctx = context;

    this.fx = new FXParticleSystem(fxCanvas, this.camera.dpr);
    this.engine = engine;
    this.callbacks = callbacks;
    this.tileRenderer = new TileRenderer();

    this.initEvents();
    this.handleResize();
    this.startLoop();
  }

  public getTileRenderer(): TileRenderer {
    return this.tileRenderer;
  }

  public getSynergyAnimator(): SynergyAnimator {
    return this.synergyAnimator;
  }

  public wakeLoop(): void {
    if (this.rafId !== null || !this.isRunning || this.isPaused || !this.loopBound) return;
    this.rafId = requestAnimationFrame(this.loopBound);
  }

  public requestRender(): void {
    this.isBoardDirty = true;
    this.sortedTilesCache = null;
    this.wakeLoop();
  }

  public triggerAnimation(durationMs: number = 4000): void {
    this.animatingUntil = Math.max(this.animatingUntil, performance.now() + durationMs);
    this.wakeLoop();
  }

  public keepAnimating(durationMs: number): void {
    this.triggerAnimation(durationMs);
  }

  public prewarmActiveTiles(): void {
    const active = this.engine.getActiveBoardTiles();
    const seen = new Set<string>();
    const animalsToPrewarm: AnimalValue[] = [];
    for (let i = 0; i < active.length; i++) {
      const v = active[i].value as AnimalValue;
      if (!seen.has(v)) {
        seen.add(v);
        animalsToPrewarm.push(v);
      }
    }
    this.tileRenderer.prewarmTiles(animalsToPrewarm);
  }

  public setEngine(engine: BoardEngine): void {
    this.engine = engine;
    this.sortedTilesCache = null;
    this.handleResize();
    this.prewarmActiveTiles();
    this.requestRender();
    if (this.callbacks.onStateChanged) {
      this.callbacks.onStateChanged();
    }
  }

  public setLevelIndex(index: number): void {
    if (this.currentLevelIndex !== index) {
      this.currentLevelIndex = index;
      this.bgCacheKey = ''; // Invalida o cache para que o novo cenário seja gerado no redimensionamento
      const viewW = this.canvas.width / this.camera.dpr;
      const viewH = this.canvas.height / this.camera.dpr;
      if (viewW > 0 && viewH > 0 && !this.engine) {
        this.renderBackgroundCache(viewW, viewH);
        this.requestRender();
      }
    }
  }

  public setTheme(theme: ThemeType): void {
    this.theme = theme;
    const viewW = this.canvas.width / this.camera.dpr;
    const viewH = this.canvas.height / this.camera.dpr;
    if (viewW > 0 && viewH > 0) {
      this.renderBackgroundCache(viewW, viewH);
    }
    this.requestRender();
  }

  public setTileOptions(showHelpers: boolean, dimBlocked: boolean, useEmojiMode?: boolean): void {
    this.tileRenderer.setOptions(showHelpers, dimBlocked, useEmojiMode);
    this.requestRender();
  }

  public pause(): void {
    this.isPaused = true;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  public resume(): void {
    if (this.isPaused) {
      this.isPaused = false;
      this.handleResize();
      this.requestRender();
    }
  }

  public getIsPaused(): boolean {
    return this.isPaused;
  }

  public destroy(): void {
    this.isRunning = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  public handleResize(): void {
    const parent = this.canvas.parentElement;
    if (!parent) return;

    const width = parent.clientWidth;
    const height = parent.clientHeight;
    if (width <= 0 || height <= 0) return;

    this.camera.updateDpr();
    const dpr = this.camera.dpr;
    this.tileRenderer.setDpr(dpr);
    this.fx.setDpr(dpr);

    const targetW = Math.round(width * dpr);
    const targetH = Math.round(height * dpr);

    if (this.canvas.width !== targetW || this.canvas.height !== targetH) {
      this.canvas.width = targetW;
      this.canvas.height = targetH;
      this.canvas.style.width = `${width}px`;
      this.canvas.style.height = `${height}px`;

      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.scale(dpr, dpr);
      diagnosticLogger.recordEvent('render', 'canvas_resize', { targetW, targetH, cssWidth: width, cssHeight: height, dpr });
    }

    const fxCanvas = this.fx.getFxCanvas();
    if (fxCanvas) {
      if (fxCanvas.width !== targetW || fxCanvas.height !== targetH) {
        fxCanvas.width = targetW;
        fxCanvas.height = targetH;
        fxCanvas.style.width = `${width}px`;
        fxCanvas.style.height = `${height}px`;

        const fxCtx = this.fx.getFxCtx();
        fxCtx?.setTransform(1, 0, 0, 1, 0, 0);
        fxCtx?.scale(dpr, dpr);
      }
    }

    this.renderBackgroundCache(width, height);
    const dims = this.camera.calculateAutoFit(width, height, this.engine.getActiveBoardTiles());
    if (dims) {
      this.tileRenderer.setDimensions(dims);
    }
    this.requestRender();
  }

  private renderBackgroundCache(w: number, h: number): void {
    if (w <= 0 || h <= 0) return;
    const targetW = Math.round(w * this.camera.dpr);
    const targetH = Math.round(h * this.camera.dpr);
    const worldIdx = Math.floor(Math.max(0, Math.min(this.currentLevelIndex, 49)) / 5);
    const key = `${targetW}x${targetH}_${this.theme}_${worldIdx}`;

    if (this.bgCanvas && this.bgCacheKey === key) {
      return;
    }
    this.bgCacheKey = key;

    if (!this.bgCanvas) {
      this.bgCanvas = document.createElement('canvas');
    }
    if (this.bgCanvas.width !== targetW || this.bgCanvas.height !== targetH) {
      this.bgCanvas.width = targetW;
      this.bgCanvas.height = targetH;
    }
    const g = this.bgCanvas.getContext('2d');
    if (!g) return;

    g.setTransform(1, 0, 0, 1, 0, 0);
    g.scale(this.camera.dpr, this.camera.dpr);
    this.drawBackgroundTo(g, w, h);
  }

  private startLoop(): void {
    this.loopBound = (timestamp: number) => {
      this.rafId = null;
      if (!this.isRunning || this.isPaused) return;

      this.animTime = timestamp;

      const isShuffling = this.animator.isShuffling(timestamp);
      const isDealing = this.animator.isDealing(timestamp);
      const isTimeAnimating = timestamp < this.animatingUntil;

      // Animação de salto da dica apenas durante o tempo ativo da dica
      let hasActiveHint = false;
      if (isTimeAnimating) {
        const tiles = this.engine.getTiles();
        const nTiles = tiles.length;
        for (let i = 0; i < nTiles; i++) {
          const t = tiles[i];
          if (!t.isRemoved && t.isHinted) {
            hasActiveHint = true;
            break;
          }
        }
      }

      let boardDuration = 0;
      let fxDuration = 0;

      if (this.isBoardDirty || hasActiveHint || isShuffling || isDealing) {
        this.isBoardDirty = false;
        const startB = performance.now();
        this.renderBoard();
        boardDuration = performance.now() - startB;
      }

      const isFxAnimating =
        isTimeAnimating ||
        this.fx.hasActiveEffects(isShuffling) ||
        this.synergyAnimator.hasActiveAnimations();

      if (isFxAnimating) {
        this.isFxActive = true;
        const startFx = performance.now();
        this.renderFX();
        fxDuration = performance.now() - startFx;
      } else if (this.isFxActive) {
        this.fx.clearFX();
        this.isFxActive = false;
      }

      if (boardDuration > 0 || fxDuration > 0) {
        const tags = [
          isDealing ? 'deal' : '',
          isShuffling ? 'shuffle' : '',
          hasActiveHint ? 'hint' : '',
          isFxAnimating ? 'fx' : '',
        ].filter(Boolean).join(',');

        diagnosticLogger.recordFrame({
          boardMs: boardDuration,
          fxMs: fxDuration,
          activeTiles: this.engine.getActiveBoardTiles().length,
          tags: tags || 'idle',
        });
      }

      const shouldContinue =
        this.isBoardDirty ||
        isShuffling ||
        isDealing ||
        hasActiveHint ||
        isFxAnimating ||
        isTimeAnimating;

      if (shouldContinue) {
        this.wakeLoop();
      }
    };

    this.wakeLoop();
  }

  private renderBoard(): void {
    const viewW = this.canvas.width / this.camera.dpr;
    const viewH = this.canvas.height / this.camera.dpr;

    if (this.bgCanvas) {
      this.ctx.drawImage(this.bgCanvas, 0, 0, viewW, viewH);
    } else {
      this.drawBackgroundTo(this.ctx, viewW, viewH);
    }

    const timeOfDay = this.engine.getTimeOfDay();
    if (timeOfDay === 'twilight') {
      this.ctx.fillStyle = 'rgba(245, 158, 11, 0.05)';
      this.ctx.fillRect(0, 0, viewW, viewH);
    } else if (timeOfDay === 'night') {
      this.ctx.fillStyle = 'rgba(30, 27, 75, 0.12)';
      this.ctx.fillRect(0, 0, viewW, viewH);
    }

    if (!this.sortedTilesCache) {
      const active = this.engine.getActiveBoardTiles();
      active.sort((a, b) => {
        if (a.position.z !== b.position.z) {
          return a.position.z - b.position.z;
        }
        if (a.position.y !== b.position.y) {
          return a.position.y - b.position.y;
        }
        return a.position.x - b.position.x;
      });
      this.sortedTilesCache = active;
    }
    const activeTiles = this.sortedTilesCache;

    const { tileWidth, tileHeight, tileDepth } = this.camera.getTileDimensions();
    const freeTileIds = this.engine.getFreeTileIds();
    const len = activeTiles.length;
    const isShuffling = this.animator.isShuffling(this.animTime);
    const isDealing = this.animator.isDealing(this.animTime);
    const shuffleScaleX = isShuffling ? this.animator.getShuffleScaleX(this.animTime) : 1;
    const dealZCache = isDealing
      ? [
          this.animator.getDealParams(this.animTime, 0),
          this.animator.getDealParams(this.animTime, 1),
          this.animator.getDealParams(this.animTime, 2),
          this.animator.getDealParams(this.animTime, 3),
          this.animator.getDealParams(this.animTime, 4),
          this.animator.getDealParams(this.animTime, 5),
        ]
      : null;

    for (let i = 0; i < len; i++) {
      const tile = activeTiles[i];
      if (tile.inSynergyPulled || tile.inFlight) continue;
      const zShiftX = tile.position.z * Math.round(tileDepth * 0.55);
      const zShiftY = tile.position.z * Math.round(tileDepth * 1.10);
      const screenX = this.camera.offsetX + (tile.position.x / 2) * tileWidth - zShiftX;
      const screenY = this.camera.offsetY + (tile.position.y / 2) * tileHeight - zShiftY;

      const isFree = freeTileIds.has(tile.id);

      let animOffset = 0;
      if (tile.isHinted && this.animTime < this.animatingUntil) {
        animOffset = Math.sin(this.animTime / 180) * 3;
      }

      let dealAlpha = 1;
      if (dealZCache) {
        const deal = dealZCache[Math.min(tile.position.z, 5)];
        dealAlpha = deal.dealAlpha;
        animOffset += deal.animOffset;
      }

      this.tileRenderer.drawTile(
        this.ctx,
        tile,
        screenX,
        screenY,
        isFree,
        animOffset,
        shuffleScaleX,
        dealAlpha,
        this.animTime
      );
    }

    if (!this.fx.getFxCtx()) {
      this.fx.updateAndDrawClimateParticles(viewW, viewH, this.ctx);
      this.synergyAnimator.render(this.ctx, performance.now());
    }
  }

  private renderFX(): void {
    this.fx.renderFX(
      this.canvas,
      this.ctx,
      this.animTime,
      this.animator.getShuffleStartTime(),
      this.animator.getShuffleDuration()
    );
    const targetCtx = this.fx.getFxCtx() || this.ctx;
    this.synergyAnimator.render(targetCtx, performance.now());
  }

  private drawBackgroundTo(g: CanvasRenderingContext2D, w: number, h: number): void {
    if (this.theme === 'mist-emerald') {
      const worldIdx = Math.floor(Math.max(0, Math.min(this.currentLevelIndex, 49)) / 5);
      switch (worldIdx) {
        case 0:
          this.drawLotusPondScenery(g, w, h);
          break;
        case 1:
          this.drawAncientForestScenery(g, w, h);
          break;
        case 2:
          this.drawGlacialValleyScenery(g, w, h);
          break;
        case 3:
          this.drawBambooGroveScenery(g, w, h);
          break;
        case 4:
          this.drawMountainSanctuaryScenery(g, w, h);
          break;
        case 5:
          this.drawAncientRiversScenery(g, w, h);
          break;
        case 6:
          this.drawMirrorRealmScenery(g, w, h);
          break;
        case 7:
          this.drawSavannaSecretsScenery(g, w, h);
          break;
        case 8:
          this.drawCelestialPeaksScenery(g, w, h);
          break;
        case 9:
        default:
          this.drawCelestialTempleScenery(g, w, h);
          break;
      }
    } else if (this.theme === 'felt-green') {
      this.drawFeltGreenScenery(g, w, h);
    } else if (this.theme === 'wood-dark') {
      this.drawWoodDarkScenery(g, w, h);
    } else if (this.theme === 'zen-dark') {
      this.drawZenDarkScenery(g, w, h);
    } else {
      this.drawParchmentScenery(g, w, h);
    }

    // Vinheta central suave de alto contraste para máxima legibilidade das peças (Padrão WCAG AA)
    const vig = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.28, w / 2, h / 2, Math.max(w, h) * 0.72);
    if (this.theme === 'parchment') {
      vig.addColorStop(0, 'rgba(74, 52, 38, 0.05)');
      vig.addColorStop(0.65, 'rgba(74, 52, 38, 0.16)');
      vig.addColorStop(1, 'rgba(40, 26, 18, 0.38)');
    } else {
      vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vig.addColorStop(0.58, 'rgba(0, 0, 0, 0.20)');
      vig.addColorStop(1, 'rgba(0, 0, 0, 0.65)');
    }
    g.fillStyle = vig;
    g.fillRect(0, 0, w, h);
  }

  /**
   * Bioma 1 (Fases 1–10): Jardim Zen & Lagoa das Lótus
   * Água calma translúcida, vitórias-régias e flores de lótus enquadrando as margens laterais seguras.
   */
  private drawLotusPondScenery(g: CanvasRenderingContext2D, w: number, h: number): void {
    const bg = g.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#07261e');
    bg.addColorStop(0.5, '#041c15');
    bg.addColorStop(1, '#02100c');
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);

    const topSafe = Math.max(115, h * 0.13);
    const bottomSafe = Math.max(115, h * 0.13);

    // Ondulações suaves de água (Ripples elípticos ultra-suaves nas laterais)
    const ripples = [
      { x: w * 0.10, y: topSafe + 70, rx: 75, ry: 26 },
      { x: w * 0.10, y: topSafe + 70, rx: 125, ry: 42 },
      { x: w * 0.90, y: h - bottomSafe - 70, rx: 80, ry: 28 },
      { x: w * 0.90, y: h - bottomSafe - 70, rx: 130, ry: 46 },
    ];
    g.lineWidth = 1.2;
    ripples.forEach((r) => {
      g.strokeStyle = 'rgba(52, 211, 153, 0.05)';
      g.beginPath();
      g.ellipse(r.x, r.y, r.rx, r.ry, 0, 0, Math.PI * 2);
      g.stroke();
    });

    // Vitórias-régias / Folhas de Lótus emoldurando as margens laterais
    const drawLilyPad = (cx: number, cy: number, r: number, angle: number) => {
      g.save();
      g.translate(cx, cy);
      g.rotate(angle);
      g.beginPath();
      g.arc(0, 0, r, 0.32, Math.PI * 2 - 0.32);
      g.lineTo(0, 0);
      g.closePath();

      const padGrad = g.createRadialGradient(0, 0, 4, 0, 0, r);
      padGrad.addColorStop(0, '#064e3b');
      padGrad.addColorStop(0.85, '#04382a');
      padGrad.addColorStop(1, '#02241b');
      g.fillStyle = padGrad;
      g.fill();

      g.strokeStyle = 'rgba(52, 211, 153, 0.35)';
      g.lineWidth = 1.4;
      g.stroke();

      // Nervuras botânicas delicadas
      g.strokeStyle = 'rgba(167, 243, 208, 0.18)';
      g.lineWidth = 0.8;
      for (let a = 0.7; a < Math.PI * 2 - 0.6; a += 0.75) {
        g.beginPath();
        g.moveTo(0, 0);
        g.lineTo(Math.cos(a) * (r * 0.88), Math.sin(a) * (r * 0.88));
        g.stroke();
      }
      g.restore();
    };

    drawLilyPad(w * 0.04, topSafe + 35, 42, 0.35);
    drawLilyPad(w * 0.05, h - bottomSafe - 30, 46, -0.4);
    drawLilyPad(w * 0.96, topSafe + 55, 38, 1.6);
    drawLilyPad(w * 0.95, h - bottomSafe - 45, 44, -1.2);

    // Flor de Lótus Graciosa nos cantos seguros
    const drawLotus = (cx: number, cy: number, scale: number) => {
      g.save();
      g.translate(cx, cy);
      g.scale(scale, scale);
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        const petalGrad = g.createLinearGradient(0, 0, Math.cos(a) * 12, Math.sin(a) * 12);
        petalGrad.addColorStop(0, 'rgba(251, 207, 232, 0.7)');
        petalGrad.addColorStop(1, 'rgba(244, 114, 182, 0.35)');
        g.fillStyle = petalGrad;
        g.beginPath();
        g.ellipse(Math.cos(a) * 8, Math.sin(a) * 8, 7, 3.5, a, 0, Math.PI * 2);
        g.fill();
      }
      // Miolo dourado
      g.fillStyle = '#fde047';
      g.beginPath();
      g.arc(0, 0, 4.5, 0, Math.PI * 2);
      g.fill();
      g.restore();
    };

    drawLotus(w * 0.07, h - bottomSafe - 50, 0.95);
    drawLotus(w * 0.93, topSafe + 70, 0.85);

    // Pétalas dispersas na água (margens livres)
    const drawPetal = (px: number, py: number, rot: number) => {
      g.save();
      g.translate(px, py);
      g.rotate(rot);
      g.fillStyle = 'rgba(244, 114, 182, 0.24)';
      g.beginPath();
      g.ellipse(0, 0, 5, 2.5, 0, 0, Math.PI * 2);
      g.fill();
      g.restore();
    };
    drawPetal(w * 0.08, topSafe + 110, 0.6);
    drawPetal(w * 0.92, h - bottomSafe - 100, -0.4);
    drawPetal(w * 0.06, h * 0.50, 1.2);
    drawPetal(w * 0.94, h * 0.48, -0.8);
  }

  /**
   * Bioma 2 (Fases 11–20): Vale das Criaturas & Bosque de Bambu
   * Hastes de bambu esguias nos cantos extremos e folhas que emolduram a tela sem tocar peças ou controles.
   */
  private drawBambooGroveScenery(g: CanvasRenderingContext2D, w: number, h: number): void {
    const bg = g.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#06231b');
    bg.addColorStop(0.55, '#041913');
    bg.addColorStop(1, '#020e0a');
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);

    const topSafe = Math.max(115, h * 0.13);
    const bottomSafe = Math.max(115, h * 0.13);

    // Névoa e colinas suaves ao fundo
    g.fillStyle = 'rgba(6, 36, 26, 0.45)';
    g.beginPath();
    g.moveTo(0, h);
    g.lineTo(0, h * 0.74);
    g.quadraticCurveTo(w * 0.35, h * 0.66, w * 0.65, h * 0.75);
    g.quadraticCurveTo(w * 0.85, h * 0.80, w, h * 0.72);
    g.lineTo(w, h);
    g.closePath();
    g.fill();

    // Hastes orgânicas de bambu na extrema margem (não interferem nas peças)
    const drawStalk = (x: number, stalkW: number, isLeft: boolean) => {
      const grad = g.createLinearGradient(x - stalkW / 2, 0, x + stalkW / 2, 0);
      grad.addColorStop(0, '#053e2f');
      grad.addColorStop(0.5, '#0d7a5b');
      grad.addColorStop(1, '#042e23');
      g.fillStyle = grad;
      g.fillRect(x - stalkW / 2, 0, stalkW, h);

      // Nós e folhas do bambu estritamente na zona segura (sem colidir com HUD nem botões)
      for (let y = topSafe + 30; y < h - bottomSafe - 15; y += 80) {
        g.strokeStyle = 'rgba(167, 243, 208, 0.4)';
        g.lineWidth = 1.8;
        g.beginPath();
        g.moveTo(x - stalkW / 2 - 2, y);
        g.lineTo(x + stalkW / 2 + 2, y);
        g.stroke();

        // Folhas lanceoladas graciosas e contidas
        const dir = isLeft ? 1 : -1;
        g.fillStyle = 'rgba(52, 211, 153, 0.38)';
        g.beginPath();
        g.moveTo(x + (dir * stalkW) / 2, y);
        g.quadraticCurveTo(x + dir * 20, y - 8, x + dir * 32, y - 2);
        g.quadraticCurveTo(x + dir * 18, y + 6, x + (dir * stalkW) / 2, y);
        g.fill();

        // Segunda folha menor
        g.beginPath();
        g.moveTo(x + (dir * stalkW) / 2, y + 2);
        g.quadraticCurveTo(x + dir * 16, y + 10, x + dir * 26, y + 16);
        g.quadraticCurveTo(x + dir * 12, y + 14, x + (dir * stalkW) / 2, y + 2);
        g.fill();
      }
    };

    drawStalk(w * 0.015, 10, true);
    drawStalk(w * 0.985, 12, false);

    // Folhas de bambu flutuando suavemente nas margens
    g.fillStyle = 'rgba(52, 211, 153, 0.18)';
    [
      { x: w * 0.08, y: topSafe + 80, rot: 0.4 },
      { x: w * 0.92, y: topSafe + 120, rot: -0.6 },
      { x: w * 0.07, y: h - bottomSafe - 90, rot: 0.8 },
      { x: w * 0.93, y: h - bottomSafe - 60, rot: -0.3 },
    ].forEach((lf) => {
      g.save();
      g.translate(lf.x, lf.y);
      g.rotate(lf.rot);
      g.beginPath();
      g.moveTo(-14, 0);
      g.quadraticCurveTo(0, -4, 14, 0);
      g.quadraticCurveTo(0, 4, -14, 0);
      g.fill();
      g.restore();
    });
  }

  /**
   * Bioma 3 (Fases 21–30): Labirintos & Santuários da Montanha
   * Picos crepusculares em camadas (estilo pintura tradicional Shan Shui),
   * bruma mística e lua serena posicionada com halo místico suave no ombro superior.
   */
  private drawMountainSanctuaryScenery(g: CanvasRenderingContext2D, w: number, h: number): void {
    const bg = g.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#1c1024');
    bg.addColorStop(0.45, '#261424');
    bg.addColorStop(0.75, '#180c1b');
    bg.addColorStop(1, '#09050c');
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);

    const topSafe = Math.max(115, h * 0.13);
    const bottomSafe = Math.max(115, h * 0.13);

    // Lua Cheia Serena no ombro superior esquerdo livre (sem colidir com HUD nem com as peças)
    const mx = w * 0.15;
    const my = topSafe + 25;
    const moonGlow = g.createRadialGradient(mx, my, 4, mx, my, 40);
    moonGlow.addColorStop(0, 'rgba(254, 240, 138, 0.30)');
    moonGlow.addColorStop(0.45, 'rgba(254, 240, 138, 0.10)');
    moonGlow.addColorStop(1, 'rgba(254, 240, 138, 0)');
    g.fillStyle = moonGlow;
    g.beginPath();
    g.arc(mx, my, 40, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = '#fef9c3';
    g.beginPath();
    g.arc(mx, my, 11, 0, Math.PI * 2);
    g.fill();

    // Cordilheiras em aquarela Shan Shui com névoa suave
    // Cordilheira 1: Cumes Distantes no Horizonte
    g.fillStyle = 'rgba(74, 38, 54, 0.40)';
    g.beginPath();
    g.moveTo(0, h * 0.60);
    g.lineTo(w * 0.22, h * 0.50);
    g.lineTo(w * 0.48, h * 0.56);
    g.lineTo(w * 0.74, h * 0.48);
    g.lineTo(w, h * 0.54);
    g.lineTo(w, h);
    g.lineTo(0, h);
    g.closePath();
    g.fill();

    // Cordilheira 2: Picos Intermediários Envoltos em Névoa
    g.fillStyle = 'rgba(38, 18, 32, 0.65)';
    g.beginPath();
    g.moveTo(0, h * 0.72);
    g.lineTo(w * 0.32, h * 0.64);
    g.lineTo(w * 0.62, h * 0.70);
    g.lineTo(w * 0.88, h * 0.63);
    g.lineTo(w, h * 0.68);
    g.lineTo(w, h);
    g.lineTo(0, h);
    g.closePath();
    g.fill();

    // Silhuetas de Pinheiros Orientais (Matsu) estritamente nas margens laterais livres
    const drawPineBranch = (px: number, py: number, scale: number) => {
      g.save();
      g.translate(px, py);
      g.scale(scale, scale);
      g.fillStyle = '#0a040b';
      // Pequeno tronco curvo
      g.beginPath();
      g.moveTo(0, 0);
      g.quadraticCurveTo(4, -8, 8, -14);
      g.lineTo(9, -14);
      g.quadraticCurveTo(5, -8, 1, 0);
      g.fill();
      // Agulhas em leque
      [-12, -4, 4, 12].forEach((ox) => {
        g.beginPath();
        g.ellipse(8 + ox * 0.5, -14, 8, 3.5, -0.3, 0, Math.PI * 2);
        g.fill();
      });
      g.restore();
    };

    drawPineBranch(w * 0.06, topSafe + (h - topSafe - bottomSafe) * 0.45, 0.65);
    drawPineBranch(w * 0.94, topSafe + (h - topSafe - bottomSafe) * 0.55, 0.75);
  }

  /**
   * Bioma 4 (Fases 31–40): Grandes Estruturas & Floresta Ancestral
   * Atmosfera majestosa de floresta profunda com feixes de luz solar filtrada (Komorebi),
   * folhagens enquadrando as bordas e vaga-lumes dourados suaves.
   */
  private drawAncientForestScenery(g: CanvasRenderingContext2D, w: number, h: number): void {
    const bg = g.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#07211a');
    bg.addColorStop(0.5, '#0a2c23');
    bg.addColorStop(1, '#03140e');
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);

    const topSafe = Math.max(115, h * 0.13);
    const bottomSafe = Math.max(115, h * 0.13);

    // Feixes de Luz Solar Filtrada da Floresta (Komorebi)
    const drawSunbeam = (x1: number, x2: number, wTop: number, wBottom: number) => {
      g.save();
      const beamGrad = g.createLinearGradient(x1, 0, x2, h * 0.85);
      beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.045)');
      beamGrad.addColorStop(0.45, 'rgba(167, 243, 208, 0.025)');
      beamGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
      g.fillStyle = beamGrad;
      g.beginPath();
      g.moveTo(x1 - wTop / 2, 0);
      g.lineTo(x1 + wTop / 2, 0);
      g.lineTo(x2 + wBottom / 2, h * 0.85);
      g.lineTo(x2 - wBottom / 2, h * 0.85);
      g.closePath();
      g.fill();
      g.restore();
    };

    drawSunbeam(w * 0.20, w * 0.45, 45, 90);
    drawSunbeam(w * 0.38, w * 0.68, 35, 75);
    drawSunbeam(w * 0.55, w * 0.88, 50, 110);

    // Dossel Arbóreo nos ombros superiores livres (abaixo do HUD)
    const drawCanopyLeaves = (isLeft: boolean) => {
      g.save();
      const originX = isLeft ? 0 : w;
      const dir = isLeft ? 1 : -1;
      g.translate(originX, topSafe);

      // Galho principal suave
      g.strokeStyle = 'rgba(4, 28, 20, 0.6)';
      g.lineWidth = 10;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(0, 0);
      g.quadraticCurveTo(dir * (w * 0.15), 10, dir * (w * 0.22), 45);
      g.stroke();

      // Folhagens em camadas orgânicas
      const leafClusters = [
        { x: dir * (w * 0.06), y: 14, rx: 26, ry: 14, rot: 0.2 },
        { x: dir * (w * 0.14), y: 24, rx: 32, ry: 16, rot: -0.15 },
        { x: dir * (w * 0.20), y: 40, rx: 28, ry: 15, rot: 0.3 },
      ];

      leafClusters.forEach((cl) => {
        const lfGrad = g.createRadialGradient(cl.x, cl.y, 4, cl.x, cl.y, cl.rx);
        lfGrad.addColorStop(0, 'rgba(16, 185, 129, 0.22)');
        lfGrad.addColorStop(0.7, 'rgba(5, 46, 34, 0.38)');
        lfGrad.addColorStop(1, 'rgba(3, 24, 18, 0)');
        g.fillStyle = lfGrad;
        g.beginPath();
        g.ellipse(cl.x, cl.y, cl.rx, cl.ry, cl.rot, 0, Math.PI * 2);
        g.fill();
      });

      g.restore();
    };

    drawCanopyLeaves(true);
    drawCanopyLeaves(false);

    // Samambaias e Folhas Silvestres no Rodapé Seguro (acima dos botões de ação)
    const drawFernFrond = (cx: number, cy: number, length: number, angle: number) => {
      g.save();
      g.translate(cx, cy);
      g.rotate(angle);
      g.fillStyle = 'rgba(4, 30, 22, 0.45)';
      for (let i = 0; i < length; i += 8) {
        const frondW = Math.sin((i / length) * Math.PI) * 14;
        g.beginPath();
        g.ellipse(0, -i, frondW, 3, 0, 0, Math.PI * 2);
        g.fill();
      }
      g.restore();
    };

    drawFernFrond(w * 0.04, h - bottomSafe - 10, 60, 0.35);
    drawFernFrond(w * 0.96, h - bottomSafe - 10, 65, -0.38);

    // Vaga-lumes Vivos da Floresta Ancestral nas margens laterais desimpedidas
    const fireflies = [
      { x: w * 0.08, y: topSafe + 90, r: 2.2, aura: 16 },
      { x: w * 0.06, y: h * 0.50, r: 1.8, aura: 14 },
      { x: w * 0.92, y: topSafe + 110, r: 2.4, aura: 18 },
      { x: w * 0.94, y: h * 0.48, r: 2.0, aura: 15 },
      { x: w * 0.08, y: h - bottomSafe - 50, r: 2.5, aura: 18 },
      { x: w * 0.92, y: h - bottomSafe - 60, r: 2.1, aura: 16 },
    ];

    fireflies.forEach((ff) => {
      const halo = g.createRadialGradient(ff.x, ff.y, 0, ff.x, ff.y, ff.aura);
      halo.addColorStop(0, 'rgba(254, 240, 138, 0.42)');
      halo.addColorStop(0.35, 'rgba(167, 243, 208, 0.18)');
      halo.addColorStop(1, 'rgba(16, 185, 129, 0)');
      g.fillStyle = halo;
      g.beginPath();
      g.arc(ff.x, ff.y, ff.aura, 0, Math.PI * 2);
      g.fill();

      g.fillStyle = '#fef08a';
      g.beginPath();
      g.arc(ff.x, ff.y, ff.r, 0, Math.PI * 2);
      g.fill();
    });
  }

  /**
   * Bioma 5 (Fases 41–50): Cume Celestial & Templo dos Mestres
   * Céu estrelado profundo de safira/violeta, nebulosas douradas e nuvens sagradas orientais nas laterais.
   */
  private drawCelestialTempleScenery(g: CanvasRenderingContext2D, w: number, h: number): void {
    const bg = g.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#0c0f28');
    bg.addColorStop(0.5, '#171132');
    bg.addColorStop(1, '#080514');
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);

    const topSafe = Math.max(115, h * 0.13);
    const bottomSafe = Math.max(115, h * 0.13);

    // Nebulosa Cósmica Dourada e Ametista no centro
    const neb1 = g.createRadialGradient(w * 0.5, h * 0.45, 10, w * 0.5, h * 0.45, Math.min(w, h) * 0.55);
    neb1.addColorStop(0, 'rgba(245, 158, 11, 0.06)');
    neb1.addColorStop(0.5, 'rgba(168, 85, 247, 0.045)');
    neb1.addColorStop(1, 'rgba(0, 0, 0, 0)');
    g.fillStyle = neb1;
    g.fillRect(0, 0, w, h);

    // Estrelas cintilantes celestiais distribuídas nas margens laterais e ombros livres
    const stars = [
      { x: w * 0.08, y: topSafe + 20, r: 1.8, sparkle: true },
      { x: w * 0.16, y: topSafe + 50, r: 1.4, sparkle: false },
      { x: w * 0.84, y: topSafe + 25, r: 2.2, sparkle: true },
      { x: w * 0.92, y: topSafe + 60, r: 1.5, sparkle: false },
      { x: w * 0.06, y: h * 0.45, r: 1.6, sparkle: false },
      { x: w * 0.94, y: h * 0.52, r: 2.0, sparkle: true },
      { x: w * 0.08, y: h - bottomSafe - 70, r: 1.5, sparkle: false },
      { x: w * 0.92, y: h - bottomSafe - 80, r: 1.8, sparkle: false },
    ];

    stars.forEach((s) => {
      g.fillStyle = '#fef08a';
      g.beginPath();
      g.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      g.fill();

      if (s.sparkle) {
        g.strokeStyle = 'rgba(254, 240, 138, 0.40)';
        g.lineWidth = 1;
        const spLen = s.r * 3.5;
        g.beginPath();
        g.moveTo(s.x - spLen, s.y);
        g.lineTo(s.x + spLen, s.y);
        g.moveTo(s.x, s.y - spLen);
        g.lineTo(s.x, s.y + spLen);
        g.stroke();
      }
    });

    // Nuvens Sagradas Orientais com Filetes de Ouro (Auspicious Clouds) nas laterais inferiores seguras
    const drawCloudScroll = (cx: number, cy: number, scale: number) => {
      g.save();
      g.translate(cx, cy);
      g.scale(scale, scale);

      g.fillStyle = 'rgba(22, 14, 38, 0.85)';
      g.beginPath();
      g.arc(0, 0, 32, 0, Math.PI * 2);
      g.arc(24, 5, 22, 0, Math.PI * 2);
      g.arc(-22, 7, 20, 0, Math.PI * 2);
      g.arc(44, 12, 16, 0, Math.PI * 2);
      g.fill();

      // Filete dourado suave na borda superior
      g.strokeStyle = 'rgba(245, 158, 11, 0.35)';
      g.lineWidth = 1.5;
      g.beginPath();
      g.arc(0, 0, 32, Math.PI * 0.9, Math.PI * 1.9);
      g.stroke();
      g.beginPath();
      g.arc(24, 5, 22, Math.PI * 1.1, Math.PI * 1.9);
      g.stroke();
      g.beginPath();
      g.arc(-22, 7, 20, Math.PI * 0.8, Math.PI * 1.6);
      g.stroke();

      g.restore();
    };

    drawCloudScroll(w * 0.08, h - bottomSafe - 25, 0.9);
    drawCloudScroll(w * 0.92, h - bottomSafe - 30, 0.95);
  }



  /**
   * Mundo 3 (Fases 11–15): Vale Glacial & Aurora Boreal
   * Tons gélidos de safira e ciano, icebergs estilizados e o véu luminoso da aurora boreal.
   */
  private drawGlacialValleyScenery(g: CanvasRenderingContext2D, w: number, h: number): void {
    const bg = g.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#081d28');
    bg.addColorStop(0.5, '#0b2636');
    bg.addColorStop(1, '#040f17');
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);

    const topSafe = Math.max(115, h * 0.13);
    const bottomSafe = Math.max(115, h * 0.13);

    // Faixa curva translúcida da Aurora Boreal no topo
    const aurora = g.createLinearGradient(0, topSafe * 0.5, w, topSafe * 1.5);
    aurora.addColorStop(0, 'rgba(56, 189, 248, 0.02)');
    aurora.addColorStop(0.35, 'rgba(52, 211, 153, 0.08)');
    aurora.addColorStop(0.7, 'rgba(56, 189, 248, 0.09)');
    aurora.addColorStop(1, 'rgba(168, 85, 247, 0.03)');
    g.fillStyle = aurora;
    g.beginPath();
    g.moveTo(0, topSafe * 0.8);
    g.quadraticCurveTo(w * 0.4, topSafe * 0.3, w * 0.75, topSafe * 0.9);
    g.quadraticCurveTo(w * 0.9, topSafe * 1.2, w, topSafe * 0.7);
    g.lineTo(w, topSafe * 1.6);
    g.quadraticCurveTo(w * 0.6, topSafe * 1.1, 0, topSafe * 1.5);
    g.closePath();
    g.fill();

    // Silhuetas angulares de cumes nevados ao fundo
    g.fillStyle = 'rgba(11, 38, 54, 0.45)';
    g.beginPath();
    g.moveTo(0, h * 0.75);
    g.lineTo(w * 0.2, h * 0.62);
    g.lineTo(w * 0.45, h * 0.72);
    g.lineTo(w * 0.78, h * 0.58);
    g.lineTo(w, h * 0.68);
    g.lineTo(w, h);
    g.lineTo(0, h);
    g.closePath();
    g.fill();

    // Cristais de gelo nas margens
    const drawIceCrystal = (cx: number, cy: number, r: number) => {
      g.save();
      g.translate(cx, cy);
      g.strokeStyle = 'rgba(186, 230, 253, 0.28)';
      g.lineWidth = 1.2;
      for (let i = 0; i < 3; i++) {
        g.beginPath();
        g.moveTo(0, -r);
        g.lineTo(0, r);
        g.stroke();
        g.rotate(Math.PI / 3);
      }
      g.restore();
    };
    drawIceCrystal(w * 0.07, topSafe + 50, 10);
    drawIceCrystal(w * 0.93, topSafe + 65, 12);
    drawIceCrystal(w * 0.06, h - bottomSafe - 60, 11);
    drawIceCrystal(w * 0.94, h - bottomSafe - 75, 13);
  }



  /**
   * Mundo 6 (Fases 26–30): Rios Ancestrais & Pontes Fluviais
   * Azul cobalto aquático, curvaturas suaves de pontes em arco e carpas nadando.
   */
  private drawAncientRiversScenery(g: CanvasRenderingContext2D, w: number, h: number): void {
    const bg = g.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#061d33');
    bg.addColorStop(0.5, '#092744');
    bg.addColorStop(1, '#030e1a');
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);

    const topSafe = Math.max(115, h * 0.13);
    const bottomSafe = Math.max(115, h * 0.13);

    // Ondulações concêntricas de correnteza nas laterais
    g.lineWidth = 1.1;
    [
      { cx: w * 0.08, cy: topSafe + 60, rx: 60, ry: 20 },
      { cx: w * 0.92, cy: topSafe + 90, rx: 70, ry: 22 },
      { cx: w * 0.09, cy: h - bottomSafe - 60, rx: 75, ry: 24 },
      { cx: w * 0.91, cy: h - bottomSafe - 80, rx: 65, ry: 20 },
    ].forEach((rip) => {
      g.strokeStyle = 'rgba(56, 189, 248, 0.07)';
      g.beginPath();
      g.ellipse(rip.cx, rip.cy, rip.rx, rip.ry, 0, 0, Math.PI * 2);
      g.stroke();
    });

    // Silhuetas de Carpas Koi estilizadas nas margens
    const drawKoi = (cx: number, cy: number, rot: number) => {
      g.save();
      g.translate(cx, cy);
      g.rotate(rot);
      g.fillStyle = 'rgba(249, 115, 22, 0.28)';
      g.beginPath();
      g.ellipse(0, 0, 14, 5, 0, 0, Math.PI * 2);
      g.fill();
      // Cauda
      g.beginPath();
      g.moveTo(-12, 0);
      g.lineTo(-20, -5);
      g.lineTo(-17, 0);
      g.lineTo(-20, 5);
      g.closePath();
      g.fill();
      g.restore();
    };

    drawKoi(w * 0.07, topSafe + 110, 0.8);
    drawKoi(w * 0.93, h - bottomSafe - 70, -1.2);
  }

  /**
   * Mundo 7 (Fases 31–35): Reino dos Espelhos & Salão de Mármore
   * Violeta imperial, ametista nobre e reflexos prismáticos de luz.
   */
  private drawMirrorRealmScenery(g: CanvasRenderingContext2D, w: number, h: number): void {
    const bg = g.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#1f102e');
    bg.addColorStop(0.5, '#2b1440');
    bg.addColorStop(1, '#0e0617');
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);

    const topSafe = Math.max(115, h * 0.13);
    const bottomSafe = Math.max(115, h * 0.13);

    // Reflexos prismáticos verticais em degradê ametista
    const prism = g.createLinearGradient(0, 0, w, 0);
    prism.addColorStop(0, 'rgba(168, 85, 247, 0.05)');
    prism.addColorStop(0.2, 'rgba(251, 191, 36, 0.02)');
    prism.addColorStop(0.8, 'rgba(251, 191, 36, 0.02)');
    prism.addColorStop(1, 'rgba(168, 85, 247, 0.05)');
    g.fillStyle = prism;
    g.fillRect(0, 0, w, h);

    // Mandalas de espelho octogonais nos cantos superiores
    const drawMirrorMandala = (cx: number, cy: number, r: number) => {
      g.save();
      g.translate(cx, cy);
      g.strokeStyle = 'rgba(233, 213, 255, 0.22)';
      g.lineWidth = 1.2;
      for (let i = 0; i < 4; i++) {
        g.strokeRect(-r, -r, r * 2, r * 2);
        g.rotate(Math.PI / 4);
      }
      g.restore();
    };

    drawMirrorMandala(w * 0.07, topSafe + 40, 12);
    drawMirrorMandala(w * 0.93, topSafe + 40, 12);
    drawMirrorMandala(w * 0.07, h - bottomSafe - 40, 14);
    drawMirrorMandala(w * 0.93, h - bottomSafe - 40, 14);
  }

  /**
   * Mundo 8 (Fases 36–40): Savana dos Segredos & Pôr do Sol
   * Âmbar, ouro velho e o pôr do sol avermelhado da savana africana.
   */
  private drawSavannaSecretsScenery(g: CanvasRenderingContext2D, w: number, h: number): void {
    const bg = g.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#2b1708');
    bg.addColorStop(0.5, '#3d200a');
    bg.addColorStop(1, '#120903');
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);

    const topSafe = Math.max(115, h * 0.13);
    const bottomSafe = Math.max(115, h * 0.13);

    // Brilho solar quente no horizonte
    const sunGrad = g.createRadialGradient(w * 0.5, h * 0.65, 10, w * 0.5, h * 0.65, Math.min(w, h) * 0.5);
    sunGrad.addColorStop(0, 'rgba(234, 88, 12, 0.08)');
    sunGrad.addColorStop(0.5, 'rgba(217, 119, 6, 0.04)');
    sunGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    g.fillStyle = sunGrad;
    g.fillRect(0, 0, w, h);

    // Silhueta da copa de acácia no ombro superior
    const drawAcacia = (cx: number, cy: number, scale: number) => {
      g.save();
      g.translate(cx, cy);
      g.scale(scale, scale);
      g.fillStyle = 'rgba(20, 10, 4, 0.55)';
      // Copa plana em camadas
      g.beginPath();
      g.ellipse(0, 0, 35, 8, 0, 0, Math.PI * 2);
      g.fill();
      g.beginPath();
      g.ellipse(8, -5, 25, 6, 0, 0, Math.PI * 2);
      g.fill();
      g.restore();
    };

    drawAcacia(w * 0.08, topSafe + 35, 0.85);
    drawAcacia(w * 0.92, topSafe + 50, 0.75);

    // Gramíneas da savana no rodapé seguro
    g.strokeStyle = 'rgba(217, 119, 6, 0.22)';
    g.lineWidth = 1.2;
    for (let x = w * 0.04; x <= w * 0.12; x += 10) {
      g.beginPath();
      g.moveTo(x, h - bottomSafe);
      g.quadraticCurveTo(x + 5, h - bottomSafe - 18, x + 8, h - bottomSafe - 24);
      g.stroke();
    }
    for (let x = w * 0.88; x <= w * 0.96; x += 10) {
      g.beginPath();
      g.moveTo(x, h - bottomSafe);
      g.quadraticCurveTo(x - 5, h - bottomSafe - 18, x - 8, h - bottomSafe - 24);
      g.stroke();
    }
  }

  /**
   * Mundo 9 (Fases 41–45): Cumes Celestiais & Ventos Sagrados
   * Azul índigo cósmico, montanhas em névoa e a presença mítica do Dragão e da Águia.
   */
  private drawCelestialPeaksScenery(g: CanvasRenderingContext2D, w: number, h: number): void {
    const bg = g.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#121633');
    bg.addColorStop(0.5, '#1b214a');
    bg.addColorStop(1, '#060714');
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);

    const topSafe = Math.max(115, h * 0.13);
    const bottomSafe = Math.max(115, h * 0.13);

    // Vórtice sutil de vento circular nos céus
    g.strokeStyle = 'rgba(147, 197, 253, 0.07)';
    g.lineWidth = 1.2;
    g.beginPath();
    g.arc(w * 0.5, topSafe + 60, 80, 0, Math.PI * 1.6);
    g.stroke();

    // Picos de montanhas flutuantes nas laterais
    g.fillStyle = 'rgba(10, 14, 38, 0.65)';
    g.beginPath();
    g.moveTo(0, h * 0.7);
    g.lineTo(w * 0.15, h * 0.58);
    g.lineTo(w * 0.35, h * 0.72);
    g.lineTo(w * 0.65, h * 0.60);
    g.lineTo(w * 0.85, h * 0.55);
    g.lineTo(w, h * 0.68);
    g.lineTo(w, h);
    g.lineTo(0, h);
    g.closePath();
    g.fill();

    // Nuvens orientais celestiais nas pontas inferiores
    g.fillStyle = 'rgba(27, 33, 74, 0.55)';
    g.beginPath();
    g.arc(w * 0.07, h - bottomSafe - 30, 20, 0, Math.PI * 2);
    g.arc(w * 0.12, h - bottomSafe - 25, 16, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.arc(w * 0.93, h - bottomSafe - 30, 20, 0, Math.PI * 2);
    g.arc(w * 0.88, h - bottomSafe - 25, 16, 0, Math.PI * 2);
    g.fill();
  }

  /**
   * Tema Alternativo: Feltro Verde Nobre (Clássico de Tabuleiro)
   */
  private drawFeltGreenScenery(g: CanvasRenderingContext2D, w: number, h: number): void {
    const bg = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.7);
    bg.addColorStop(0, '#0d4a3b');
    bg.addColorStop(0.7, '#073227');
    bg.addColorStop(1, '#041e17');
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);

    // Moldura perimetral dupla com filete dourado clássico arredondado
    const pad = 14;
    g.strokeStyle = 'rgba(245, 158, 11, 0.20)';
    g.lineWidth = 1.5;
    g.beginPath();
    g.roundRect(pad, pad, w - pad * 2, h - pad * 2, 16);
    g.stroke();

    g.strokeStyle = 'rgba(245, 158, 11, 0.10)';
    g.lineWidth = 1;
    g.beginPath();
    g.roundRect(pad + 4, pad + 4, w - (pad + 4) * 2, h - (pad + 4) * 2, 12);
    g.stroke();
  }

  /**
   * Tema Alternativo: Madeira Nobre Mogno
   */
  private drawWoodDarkScenery(g: CanvasRenderingContext2D, w: number, h: number): void {
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#321912');
    grad.addColorStop(0.5, '#22100b');
    grad.addColorStop(1, '#150906');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);

    // Luz acetinada central no tampo de madeira nobre
    const sheen = g.createRadialGradient(w / 2, h / 2, 30, w / 2, h / 2, Math.max(w, h) * 0.6);
    sheen.addColorStop(0, 'rgba(245, 158, 11, 0.04)');
    sheen.addColorStop(1, 'rgba(0, 0, 0, 0)');
    g.fillStyle = sheen;
    g.fillRect(0, 0, w, h);

    // Veios longitudinais verticais suaves (evita cortes horizontais sob as peças)
    g.strokeStyle = 'rgba(255, 255, 255, 0.018)';
    g.lineWidth = 1.5;
    for (let x = 30; x < w; x += 45) {
      g.beginPath();
      g.moveTo(x, 0);
      g.quadraticCurveTo(x + 12, h * 0.5, x - 6, h);
      g.stroke();
    }
  }

  /**
   * Tema Alternativo: Ardósia Zen Noturna
   */
  private drawZenDarkScenery(g: CanvasRenderingContext2D, w: number, h: number): void {
    const grad = g.createRadialGradient(w / 2, h / 2, 80, w / 2, h / 2, Math.max(w, h) * 0.7);
    grad.addColorStop(0, '#1c222a');
    grad.addColorStop(0.65, '#12151b');
    grad.addColorStop(1, '#090b0e');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
  }

  /**
   * Tema Alternativo: Pergaminho Claro com Tatami Zen de Alto Contraste
   */
  private drawParchmentScenery(g: CanvasRenderingContext2D, w: number, h: number): void {
    const grad = g.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#f5efeb');
    grad.addColorStop(1, '#e4d8c7');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);

    // Esteira central de bambu/linho sutil para contraste seguro das peças de marfim branco
    const topSafe = Math.max(115, h * 0.13);
    const bottomSafe = Math.max(115, h * 0.13);
    const matPad = 12;
    const matW = w - matPad * 2;
    const matH = h - topSafe - bottomSafe + 20;

    g.fillStyle = 'rgba(64, 43, 27, 0.06)';
    g.beginPath();
    g.roundRect(matPad, topSafe - 10, matW, matH, 14);
    g.fill();

    g.strokeStyle = 'rgba(120, 80, 50, 0.18)';
    g.lineWidth = 1.2;
    g.stroke();
  }

  public getTileScreenCoords(tile: PlacedTile): { x: number; y: number; width: number; height: number } {
    return this.camera.getTileScreenCoords(tile);
  }

  public getTileViewportCoords(tile: PlacedTile): { left: number; top: number; width: number; height: number } {
    return this.camera.getTileViewportCoords(
      tile,
      this.canvas.getBoundingClientRect(),
      this.canvas.width / this.camera.dpr,
      this.canvas.height / this.camera.dpr
    );
  }

  public triggerLocalMatchDissolve(coords: { x: number; y: number; width: number; height: number }, color: string = '#F59E0B'): void {
    this.fx.triggerLocalMatchDissolve(coords, color);
    this.keepAnimating(280);
    this.requestRender();
  }

  public triggerShuffleAnimation(durationMs: number = 500): void {
    this.animator.triggerShuffleAnimation(durationMs);
    this.animatingUntil = Math.max(this.animatingUntil, performance.now() + durationMs + 100);
    this.requestRender();
  }

  public triggerDealAnimation(durationMs: number = 420): void {
    this.animator.triggerDealAnimation(durationMs);
    this.animatingUntil = Math.max(this.animatingUntil, performance.now() + durationMs + 100);
    this.requestRender();
  }

  private initEvents(): void {
    let longPressTimer: ReturnType<typeof setTimeout> | null = null;
    let isLongPressTriggered = false;
    let startX = 0;
    let startY = 0;
    let cachedRect: DOMRect | null = null;

    const clearTimer = () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    };

    this.canvas.addEventListener('pointerdown', (e) => {
      clearTimer();
      isLongPressTriggered = false;
      cachedRect = this.canvas.getBoundingClientRect();
      startX = e.clientX - cachedRect.left;
      startY = e.clientY - cachedRect.top;

      const hit = this.camera.getTileAtScreenPos(startX, startY, this.engine.getActiveBoardTiles());
      if (hit) {
        longPressTimer = setTimeout(() => {
          isLongPressTriggered = true;
          hapticManager.impactMedium();
          if (this.callbacks.onTileLongPress) {
            this.callbacks.onTileLongPress(hit.tile);
          }
        }, 400);
      }
    }, { passive: true });

    this.canvas.addEventListener('pointermove', (e) => {
      const rect = cachedRect || this.canvas.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;
      if (Math.hypot(currentX - startX, currentY - startY) > 12) {
        clearTimer();
      }
    }, { passive: true });

    this.canvas.addEventListener('pointerup', (e) => {
      clearTimer();
      if (isLongPressTriggered) {
        cachedRect = null;
        return;
      }
      const rect = cachedRect || this.canvas.getBoundingClientRect();
      cachedRect = null;
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      this.processClickAt(clickX, clickY);
    }, { passive: true });

    this.canvas.addEventListener('pointercancel', () => {
      clearTimer();
      cachedRect = null;
    }, { passive: true });

    let resizeRafId: number | null = null;
    window.addEventListener('resize', () => {
      if (resizeRafId !== null) return;
      resizeRafId = requestAnimationFrame(() => {
        resizeRafId = null;
        this.handleResize();
      });
    }, { passive: true });
  }

  private processClickAt(px: number, py: number): void {
    if (this.isInputLocked) return;

    const now = performance.now();
    if (now - this.lastClickTime < 110) return;
    this.lastClickTime = now;

    const { tileWidth, tileHeight } = this.camera.getTileDimensions();
    const hit = this.camera.getTileAtScreenPos(px, py, this.engine.getActiveBoardTiles());
    if (!hit) {
      diagnosticLogger.recordTouchMiss();
      if (this.engine.isWaveCleared() && this.engine.hasMoreWaves()) {
        if (this.callbacks.onWaveCleared) {
          this.callbacks.onWaveCleared(this.engine.getCurrentWave(), this.engine.getTotalWaves());
        }
      }
      return;
    }

    const clickedTile = hit.tile;
    const clickTileScreenX = hit.sx;
    const clickTileScreenY = hit.sy;
    const isFree = this.engine.isTileFree(clickedTile);
    diagnosticLogger.recordTouch(isFree);

    if (this.callbacks.onTileClick) {
      this.callbacks.onTileClick(clickedTile, isFree);
    }

    if (!isFree) {
      soundManager.playBlockedSound();
      hapticManager.impactWarning();

      const hasTileAbove = this.engine.getActiveBoardTiles().some(
        (o) =>
          o.id !== clickedTile!.id &&
          o.position.z > clickedTile!.position.z &&
          Math.abs(o.position.x - clickedTile!.position.x) < 2 &&
          Math.abs(o.position.y - clickedTile!.position.y) < 2
      );

      this.fx.showBlockArrows(
        clickedTile,
        clickTileScreenX,
        clickTileScreenY,
        tileWidth,
        tileHeight,
        hasTileAbove,
        this.engine.getActiveBoardTiles()
      );
      this.keepAnimating(1200);

      if (this.callbacks.onBlockedTileClick) {
        this.callbacks.onBlockedTileClick(clickedTile, hasTileAbove);
      }
      return;
    }

    const willMatchWithTray = this.engine.getTray().some((t) => canMatch(t, clickedTile));
    if (!willMatchWithTray && this.engine.getTray().length + this.pendingTilesInFlight >= this.engine.getMaxTraySlots()) {
      soundManager.playBlockedSound();
      hapticManager.impactWarning();
      return;
    }

    const matchingTrayTile = this.engine.getTray().find((t) => canMatch(t, clickedTile));
    const isTheatricalActor = matchingTrayTile && (
      clickedTile.value === 'frog' || clickedTile.value === 'cat' ||
      clickedTile.value === 'bear' || clickedTile.value === 'dolphin'
    );

    if (isTheatricalActor || clickedTile.specialType === 'ice' || clickedTile.specialType === 'rock') {
      this.executeTileSelection(clickedTile);
      return;
    }

    if (this.callbacks.onTileFlightToTray) {
      clickedTile.inTray = true;
      this.pendingTilesInFlight++;
      this.requestRender();

      this.callbacks.onTileFlightToTray(
        clickedTile,
        clickTileScreenX,
        clickTileScreenY,
        tileWidth,
        tileHeight,
        () => {
          this.pendingTilesInFlight = Math.max(0, this.pendingTilesInFlight - 1);
          clickedTile.inTray = false;
          this.executeTileSelection(clickedTile);
        }
      );
    } else {
      this.executeTileSelection(clickedTile);
    }
  }

  private executeTileSelection(clickedTile: PlacedTile): void {
    const result = this.engine.selectTile(clickedTile.id);

    if (result.action === 'matched' && result.matchedPair) {
      const timbre = TileRegistry.getAudioTimbre(clickedTile.value);
      soundManager.playMatchSuccess(timbre);
      hapticManager.impactMedium();
      this.fx.showMatchPop(this.canvas.getBoundingClientRect());

      const tileCoords = this.getTileScreenCoords(clickedTile);
      const clickedVfx = TileRegistry.getVfx(clickedTile.value);
      this.triggerLocalMatchDissolve(tileCoords, clickedVfx.color);

      const otherTile = result.matchedPair.find((t) => t.id !== clickedTile.id);
      if (otherTile && !otherTile.inTray) {
        const otherCoords = this.getTileScreenCoords(otherTile);
        const otherVfx = TileRegistry.getVfx(otherTile.value);
        this.triggerLocalMatchDissolve(otherCoords, otherVfx.color);
      }

      if (this.callbacks.onMatchSuccess) {
        this.callbacks.onMatchSuccess(result.matchedPair);
      }

      if (result.synergy) {
        this.triggerSynergyAnimation(result.synergy, clickedTile, result.matchedPair);
        if (this.callbacks.onSynergyTriggered) {
          this.callbacks.onSynergyTriggered(result.synergy);
        }
      }

      if (result.climateTriggered) {
        soundManager.playSynergyBonus();
        this.triggerClimateEffect(result.climateTriggered.climate);
        if (this.callbacks.onClimateTriggered) {
          this.callbacks.onClimateTriggered(result.climateTriggered);
        }
      }

      if (result.cosmicRescue && result.cosmicRescue.length > 0) {
        if (this.callbacks.onCosmicRescue) {
          this.callbacks.onCosmicRescue(result.cosmicRescue);
        }
      }

      if (result.prunedVineTiles && result.prunedVineTiles.length > 0) {
        soundManager.playVineCut();
        for (const vt of result.prunedVineTiles) {
          const coords = this.getTileScreenCoords(vt);
          this.triggerLocalMatchDissolve(coords, '#16A34A');
        }
      } else if (result.vinesCutCount && result.vinesCutCount > 0) {
        soundManager.playVineCut();
      }

      if (result.mutations && result.mutations.length > 0) {
        for (const mut of result.mutations) {
          const coords = this.getTileScreenCoords(mut.tile);
          if (mut.tile.value === 'chameleon') {
            soundManager.playCocoonHatch();
            this.triggerLocalMatchDissolve(coords, '#10B981');
          } else {
            soundManager.playMirrorReflect();
            this.triggerLocalMatchDissolve(coords, '#38BDF8');
          }
        }
      }

      if (result.crackedCocoons && result.crackedCocoons.length > 0) {
        soundManager.playIceCrack();
        for (const ct of result.crackedCocoons) {
          const coords = this.getTileScreenCoords(ct);
          this.triggerLocalMatchDissolve(coords, '#F59E0B');
          this.callbacks.onCocoonCracked?.(ct);
        }
      }

      if (result.hatchedCocoons && result.hatchedCocoons.length > 0) {
        soundManager.playCocoonHatch();
        for (const ht of result.hatchedCocoons) {
          const coords = this.getTileScreenCoords(ht);
          this.triggerLocalMatchDissolve(coords, '#10B981');
          this.callbacks.onCocoonHatched?.(ht);
        }
      }

      if (result.unsealedTiles && result.unsealedTiles.length > 0) {
        soundManager.playSealBreak();
        hapticManager.impactMedium();
        for (const st of result.unsealedTiles) {
          const coords = this.getTileScreenCoords(st);
          this.triggerLocalMatchDissolve(coords, '#A855F7');
        }
        this.callbacks.onElementalUnsealed?.(result.unsealedTiles);
      }

      if (result.clearedMistTiles && result.clearedMistTiles.length > 0) {
        soundManager.playMistDissipate();
        for (const mt of result.clearedMistTiles) {
          const coords = this.getTileScreenCoords(mt);
          this.triggerLocalMatchDissolve(coords, '#CBD5E1');
        }
      }

      if (result.timeOfDayChanged && result.timeOfDay) {
        this.callbacks.onTimeOfDayChanged?.(result.timeOfDay);
      }

      if (result.nocturnalVisionPair) {
        this.triggerAnimation(6000);
        this.requestRender();
      }

      const isTheatrical = SynergyDirector.isTheatrical(result.synergy);

      if (!isTheatrical) {
        if (this.engine.isVictory()) {
          soundManager.playVictoryFanfare();
          hapticManager.impactVictory();
          if (this.callbacks.onBoardCleared) {
            this.callbacks.onBoardCleared();
          }
        } else if (result.waveCleared && this.engine.hasMoreWaves()) {
          soundManager.playWaveSuccess();
          if (this.callbacks.onWaveCleared) {
            this.callbacks.onWaveCleared(this.engine.getCurrentWave(), this.engine.getTotalWaves());
          }
        }
      }
    } else if (result.action === 'added') {
      const timbre = TileRegistry.getAudioTimbre(clickedTile.value);
      soundManager.playTileClick(timbre);
      hapticManager.impactLight();

      if (result.cosmicRescue && result.cosmicRescue.length > 0) {
        if (this.callbacks.onCosmicRescue) {
          this.callbacks.onCosmicRescue(result.cosmicRescue);
        }
      }

      if (this.engine.isVictory()) {
        soundManager.playVictoryFanfare();
        hapticManager.impactVictory();
        if (this.callbacks.onBoardCleared) {
          this.callbacks.onBoardCleared();
        }
      } else if (result.waveCleared && this.engine.hasMoreWaves()) {
        soundManager.playMatchSuccess();
        if (this.callbacks.onWaveCleared) {
          this.callbacks.onWaveCleared(this.engine.getCurrentWave(), this.engine.getTotalWaves());
        }
      }

      if (result.isDeadlocked && this.callbacks.onDeadlocked) {
        this.callbacks.onDeadlocked(true);
      }
    } else if (result.action === 'tray_full') {
      soundManager.playBlockedSound();
      if (result.isDeadlocked && this.callbacks.onDeadlocked) {
        this.callbacks.onDeadlocked(true);
      }
    } else if (result.action === 'special_action') {
      if (result.specialEffect === 'ice_cracked') {
        soundManager.playIceCrack();
        hapticManager.impactLight();
        const coords = this.getTileScreenCoords(clickedTile);
        this.triggerLocalMatchDissolve(coords, '#38BDF8');
      } else if (result.specialEffect === 'rock_crushed') {
        soundManager.playHammerSmash();
        hapticManager.impactMedium();
        const coords = this.getTileScreenCoords(clickedTile);
        this.triggerLocalMatchDissolve(coords, '#64748B');
      } else if (result.specialEffect === 'vines_entangled') {
        soundManager.playVineRustle();
        hapticManager.impactLight();
        if (this.callbacks.onVinesEntangled) {
          this.callbacks.onVinesEntangled(clickedTile);
        }
      } else if (result.specialEffect === 'predation' && result.predationResult) {
        soundManager.playPredationStrike();
        hapticManager.impactMedium();
        const coords = this.getTileScreenCoords(clickedTile);
        this.triggerLocalMatchDissolve(coords, '#DC2626');
        if (this.callbacks.onPredation) {
          this.callbacks.onPredation(result.predationResult);
        }
      } else if (result.specialEffect === 'elemental_sealed') {
        soundManager.playBlockedSound();
        hapticManager.impactWarning();
        if (this.callbacks.onElementalSealed) {
          this.callbacks.onElementalSealed(clickedTile);
        }
      }
    } else if (result.action === 'trio_matched' && result.trioTile) {
      soundManager.playSynergyBonus();
      hapticManager.impactHeavy();
      this.fx.showMatchPop(this.canvas.getBoundingClientRect());

      const tileCoords = this.getTileScreenCoords(result.trioTile);
      this.triggerLocalMatchDissolve(tileCoords, '#F59E0B');

      if (result.mutations && result.mutations.length > 0) {
        for (const mut of result.mutations) {
          const coords = this.getTileScreenCoords(mut.tile);
          soundManager.playCocoonHatch();
          this.triggerLocalMatchDissolve(coords, '#10B981');
        }
      }

      if (result.climateTriggered) {
        this.triggerClimateEffect(result.climateTriggered.climate);
        if (this.callbacks.onClimateTriggered) {
          this.callbacks.onClimateTriggered(result.climateTriggered);
        }
      }

      if (this.callbacks.onTrioMatched) {
        this.callbacks.onTrioMatched(result.trioTile);
      }

      if (result.cosmicRescue && result.cosmicRescue.length > 0) {
        if (this.callbacks.onCosmicRescue) {
          this.callbacks.onCosmicRescue(result.cosmicRescue);
        }
      }

      if (this.engine.isVictory()) {
        soundManager.playVictoryFanfare();
        hapticManager.impactVictory();
        if (this.callbacks.onBoardCleared) {
          this.callbacks.onBoardCleared();
        }
      } else if (result.waveCleared && this.engine.hasMoreWaves()) {
        soundManager.playWaveSuccess();
        if (this.callbacks.onWaveCleared) {
          this.callbacks.onWaveCleared(this.engine.getCurrentWave(), this.engine.getTotalWaves());
        }
      }
    }

    if (this.callbacks.onStateChanged) {
      this.callbacks.onStateChanged();
    }
    this.requestRender();
  }

  public triggerSynergyAnimation(
    synergy: SynergyResult,
    initiatorTile: PlacedTile,
    matchedPair?: [PlacedTile, PlacedTile]
  ): void {
    const onSceneComplete = () => {
      const tilesToDissolve: PlacedTile[] = [initiatorTile];
      if (matchedPair) {
        tilesToDissolve.push(matchedPair[0], matchedPair[1]);
      }
      if (synergy.affectedBoardTiles) {
        tilesToDissolve.push(...synergy.affectedBoardTiles);
      }
      if (synergy.clearedTrayTiles) {
        tilesToDissolve.push(...synergy.clearedTrayTiles);
      }

      const seenIds = new Set<string>();
      const uniqueTiles: PlacedTile[] = [];
      for (const t of tilesToDissolve) {
        if (!seenIds.has(t.id)) {
          seenIds.add(t.id);
          uniqueTiles.push(t);
        }
      }
      const rescued = this.engine.finalizeSynergyMatch(uniqueTiles);
      if (rescued && rescued.length > 0) {
        if (this.callbacks.onCosmicRescue) {
          this.callbacks.onCosmicRescue(rescued);
        }
      }

      soundManager.playMatchSuccess();
      this.isInputLocked = false;
      this.keepAnimating(400);
      this.requestRender();
      if (this.callbacks.onStateChanged) {
        this.callbacks.onStateChanged();
      }

      if (this.engine.isVictory()) {
        soundManager.playVictoryFanfare();
        hapticManager.impactVictory();
        if (this.callbacks.onBoardCleared) {
          this.callbacks.onBoardCleared();
        }
      } else if (this.engine.isWaveCleared() && this.engine.hasMoreWaves()) {
        soundManager.playWaveSuccess();
        if (this.callbacks.onWaveCleared) {
          this.callbacks.onWaveCleared(this.engine.getCurrentWave(), this.engine.getTotalWaves());
        }
      }
    };

    if (synergy.type === 'frog_tongue') {
      this.isInputLocked = true;

      const frogTile = (initiatorTile.value === 'frog' && !initiatorTile.isRemoved)
        ? initiatorTile
        : (matchedPair?.find((t) => t.value === 'frog' && !t.isRemoved) || initiatorTile);
      const otherPairTile = matchedPair?.find((t) => t.id !== frogTile.id && !t.isRemoved);
      const targetTile = synergy.affectedBoardTiles?.[0] || otherPairTile || synergy.clearedTrayTiles?.[0];

      const frogCoords = this.getTileScreenCoords(frogTile);
      const startX = frogCoords.x + frogCoords.width / 2;
      const startY = frogCoords.y + frogCoords.height / 2;

      let targetX = startX;
      let targetY = startY - 140;

      if (targetTile) {
        const targetCoords = this.getTileScreenCoords(targetTile);
        targetX = targetCoords.x + targetCoords.width / 2;
        targetY = targetCoords.y + targetCoords.height / 2;
      }

      this.synergyAnimator.triggerFrogTongue(
        startX,
        startY,
        targetX,
        targetY,
        targetTile,
        onSceneComplete
      );
      this.requestRender();
    } else if (synergy.type === 'cat_paw') {
      this.isInputLocked = true;

      const catTile = (initiatorTile.value === 'cat' && !initiatorTile.isRemoved)
        ? initiatorTile
        : (matchedPair?.find((t) => t.value === 'cat' && !t.isRemoved) || initiatorTile);
      const catCoords = this.getTileScreenCoords(catTile);
      const startX = catCoords.x + catCoords.width / 2;
      const startY = catCoords.y + catCoords.height / 2;

      const otherPairTile = matchedPair?.find((t) => t.id !== catTile.id && !t.isRemoved);
      const targetTile = synergy.affectedBoardTiles?.[0] || otherPairTile;
      let targetX = startX;
      let targetY = startY;
      if (targetTile) {
        const targetCoords = this.getTileScreenCoords(targetTile);
        targetX = targetCoords.x + targetCoords.width / 2;
        targetY = targetCoords.y + targetCoords.height / 2;
      }

      this.synergyAnimator.triggerCatPaw(targetX, targetY, onSceneComplete);
      this.requestRender();
    } else if (synergy.type === 'bear_feast') {
      this.isInputLocked = true;

      const bearTile = (initiatorTile.value === 'bear' && !initiatorTile.isRemoved)
        ? initiatorTile
        : (matchedPair?.find((t) => t.value === 'bear' && !t.isRemoved) || initiatorTile);
      const bearCoords = this.getTileScreenCoords(bearTile);
      const startX = bearCoords.x + bearCoords.width / 2;
      const startY = bearCoords.y + bearCoords.height / 2;

      const otherPairTile = matchedPair?.find((t) => t.id !== bearTile.id && !t.isRemoved);
      const targetTile = synergy.affectedBoardTiles?.[0] || otherPairTile;
      let targetX = startX;
      let targetY = startY;
      if (targetTile) {
        const targetCoords = this.getTileScreenCoords(targetTile);
        targetX = targetCoords.x + targetCoords.width / 2;
        targetY = targetCoords.y + targetCoords.height / 2;
      }

      this.synergyAnimator.triggerBearClaw(targetX, targetY, onSceneComplete);
      this.requestRender();
    } else if (synergy.type === 'dolphin_sonar') {
      this.isInputLocked = true;

      const dolphinTile = (initiatorTile.value === 'dolphin' && !initiatorTile.isRemoved)
        ? initiatorTile
        : (matchedPair?.find((t) => t.value === 'dolphin' && !t.isRemoved) || initiatorTile);
      const dolphinCoords = this.getTileScreenCoords(dolphinTile);
      const startX = dolphinCoords.x + dolphinCoords.width / 2;
      const startY = dolphinCoords.y + dolphinCoords.height / 2;

      const otherPairTile = matchedPair?.find((t) => t.id !== dolphinTile.id && !t.isRemoved);
      const targetTile = synergy.affectedBoardTiles?.[0] || otherPairTile;
      let targetX = startX + 90;
      let targetY = startY - 90;
      if (targetTile) {
        const targetCoords = this.getTileScreenCoords(targetTile);
        targetX = targetCoords.x + targetCoords.width / 2;
        targetY = targetCoords.y + targetCoords.height / 2;
      }

      this.synergyAnimator.triggerDolphinSonar(startX, startY, targetX, targetY, onSceneComplete);
      this.requestRender();
    } else if (synergy.type === 'bee_honey') {
      this.isInputLocked = true;
      const coords = this.getTileScreenCoords(initiatorTile || matchedPair?.[0]!);
      const startX = coords.x + coords.width / 2;
      const startY = coords.y + coords.height / 2;
      const targetTile = synergy.affectedBoardTiles?.[0] || matchedPair?.[1];
      const targetCoords = targetTile ? this.getTileScreenCoords(targetTile) : coords;
      const targetX = targetCoords.x + targetCoords.width / 2;
      const targetY = targetCoords.y + targetCoords.height / 2;
      this.synergyAnimator.triggerBeeSwarm(startX, startY, targetX, targetY, onSceneComplete);
      this.requestRender();
    } else if (synergy.type === 'monkey_banana') {
      this.isInputLocked = true;
      const coords = this.getTileScreenCoords(initiatorTile || matchedPair?.[0]!);
      const startX = coords.x + coords.width / 2;
      const startY = coords.y + coords.height / 2;
      const targetX = this.canvas.width / (2 * this.camera.dpr);
      const targetY = this.canvas.height / (2 * this.camera.dpr);
      this.synergyAnimator.triggerMonkeyJump(startX, startY, targetX, targetY, onSceneComplete);
      this.requestRender();
    } else if (synergy.type === 'penguin_slide') {
      this.isInputLocked = true;
      const coords = this.getTileScreenCoords(initiatorTile || matchedPair?.[0]!);
      const startX = coords.x + coords.width / 2;
      const startY = coords.y + coords.height / 2;
      const targetTile = synergy.affectedBoardTiles?.[0] || matchedPair?.[1];
      const targetCoords = targetTile ? this.getTileScreenCoords(targetTile) : coords;
      const targetX = targetCoords.x + targetCoords.width / 2;
      const targetY = targetCoords.y + targetCoords.height / 2;
      this.synergyAnimator.triggerPenguinSlide(startX, startY, targetX, targetY, onSceneComplete);
      this.requestRender();
    } else if (synergy.type === 'panda_zen') {
      this.isInputLocked = true;
      const coords = this.getTileScreenCoords(initiatorTile || matchedPair?.[0]!);
      const targetX = coords.x + coords.width / 2;
      const targetY = coords.y + coords.height / 2;
      this.synergyAnimator.triggerPandaZen(targetX, targetY, onSceneComplete);
      this.requestRender();
    } else if (synergy.type === 'elephant_crush') {
      this.isInputLocked = true;
      const coords = this.getTileScreenCoords(initiatorTile || matchedPair?.[0]!);
      const targetX = coords.x + coords.width / 2;
      const targetY = coords.y + coords.height / 2;
      this.synergyAnimator.triggerElephantCrush(targetX, targetY, onSceneComplete);
      this.requestRender();
    } else {
      let theme: import('./SynergyAnimator').SynergyTheme = 'zen';
      if (synergy.type === 'squirrel_acorn') theme = 'nut';
      else if (synergy.type === 'hedgehog_apple') theme = 'orchard';
      else if (synergy.type === 'wildcard_chameleon') theme = 'chameleon';
      else if (synergy.type === 'turtle_shield') theme = 'shield';
      else if (synergy.type === 'rabbit_hop') theme = 'rabbit';
      else if (synergy.type === 'fox_trail') theme = 'fox';
      else if (synergy.type === 'dog_cat_harmony') theme = 'friends';
      else if (synergy.type === 'butterfly_flap') theme = 'butterfly';
      else if (synergy.type === 'duck_splash') theme = 'duck';
      else if (synergy.type === 'lion_roar') theme = 'lion';
      else if (synergy.type === 'bird_swoop') theme = 'bird';
      else if (synergy.type === 'snail_zen') theme = 'snail';
      else if (synergy.type === 'floral_harmony') theme = 'butterfly';
      else if (synergy.type === 'marine_abyss') theme = 'shield';
      else if (synergy.type === 'mythic_harmony') theme = 'chameleon';
      else if (synergy.type === 'nature_harmony') theme = 'zen';

      const actorTile = initiatorTile || matchedPair?.[0];
      const coords = actorTile
        ? this.getTileScreenCoords(actorTile)
        : { x: this.canvas.width / (2 * this.camera.dpr), y: this.canvas.height / (2 * this.camera.dpr), width: 60, height: 80 };
      const targetX = coords.x + coords.width / 2;
      const targetY = coords.y + coords.height / 2;

      this.isInputLocked = true;
      this.synergyAnimator.triggerMicroBurst(targetX, targetY, theme, onSceneComplete);
      this.keepAnimating(450);
      this.requestRender();
    }
  }

  public triggerClimateEffect(climate: ClimateType): void {
    const viewW = this.canvas.width / this.camera.dpr;
    const viewH = this.canvas.height / this.camera.dpr;
    if (climate === 'full_moon') {
      this.keepAnimating(5000);
    }
    this.fx.triggerClimateEffect(climate, viewW, viewH, () => {
      this.engine.getTiles().forEach((t) => (t.isHinted = false));
      this.requestRender();
    });
    this.requestRender();
  }
}
