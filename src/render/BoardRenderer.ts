import { BoardEngine } from '../core/BoardEngine';
import { PlacedTile, ThemeType, SynergyResult, ClimateEffectResult, ClimateType } from '../core/types';
import { canMatch } from '../core/deck';
import { TileRenderer, TileDimensions } from './TileRenderer';
import { SynergyAnimator } from './SynergyAnimator';
import { soundManager } from '../audio/SoundManager';
import { hapticManager } from '../audio/HapticManager';
import confetti from 'canvas-confetti';

export interface BoardRendererCallbacks {
  onTileClick?: (tile: PlacedTile, isFree: boolean) => void;
  onBlockedTileClick?: (tile: PlacedTile, isBlockedFromAbove: boolean) => void;
  onMatchSuccess?: (pair: [PlacedTile, PlacedTile]) => void;
  onBoardCleared?: () => void;
  onWaveCleared?: (currentWave: number, totalWaves: number) => void;
  onSynergyTriggered?: (synergy: SynergyResult) => void;
  onClimateTriggered?: (climate: ClimateEffectResult) => void;
  onTileLongPress?: (tile: PlacedTile) => void;
  onStateChanged?: () => void;
  onTileFlightToTray?: (
    tile: PlacedTile,
    startX: number,
    startY: number,
    width: number,
    height: number,
    onArrival: () => void
  ) => void;
}

export class BoardRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private engine: BoardEngine;
  private tileRenderer: TileRenderer;
  private callbacks: BoardRendererCallbacks;

  private theme: ThemeType = 'mist-emerald';
  private dpr: number = 1;
  private scale: number = 1;
  private offsetX: number = 0;
  private offsetY: number = 0;

  // Dimensões base da grade — ampliadas para toque confortável (Samsung A12)
  private baseTileWidth: number = 66;
  private baseTileHeight: number = 88;
  private baseTileDepth: number = 7;

  // Controle de animação e economia de bateria (MediaTek Helio P35)
  private isRunning: boolean = true;
  private animTime: number = 0;
  private isBoardDirty: boolean = true;
  private isFxActive: boolean = false;
  private animatingUntil: number = 0;
  public isInputLocked: boolean = false;
  private pendingTilesInFlight: number = 0;
  private synergyAnimator: SynergyAnimator = new SynergyAnimator();

  // Camada Dinâmica de Efeitos (Dual-Layer FX Canvas)
  private fxCanvas: HTMLCanvasElement | null = null;
  private fxCtx: CanvasRenderingContext2D | null = null;

  // Efeitos Climáticos da Natureza (Partículas Zen)
  private activeClimate: ClimateType | null = null;
  private climateTimer: number = 0;
  private climateSpriteCache: HTMLCanvasElement | null = null;
  private climateParticles: Array<{
    x: number;
    y: number;
    speedX: number;
    speedY: number;
    size: number;
    alpha: number;
    char?: string;
    color?: string;
  }> = [];

  // Fundo em Cache de Alta Performance (Hardware Blit)
  private bgCanvas: HTMLCanvasElement | null = null;
  private sortedTilesCache: PlacedTile[] | null = null;

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

    // Detectar fx-canvas sobreposto para arquitetura Dual-Layer
    const fx = fxCanvas || (typeof document !== 'undefined' ? (document.getElementById('fx-canvas') as HTMLCanvasElement | null) : null);
    if (fx) {
      this.fxCanvas = fx;
      this.fxCtx = fx.getContext('2d', { alpha: true });
    }

    this.engine = engine;
    this.callbacks = callbacks;
    this.tileRenderer = new TileRenderer();

    this.dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 3) : 1;

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

  public requestRender(): void {
    this.isBoardDirty = true;
    this.sortedTilesCache = null;
  }

  public triggerAnimation(durationMs: number = 4000): void {
    this.animatingUntil = Math.max(this.animatingUntil, performance.now() + durationMs);
  }

  public keepAnimating(durationMs: number): void {
    this.triggerAnimation(durationMs);
  }

  public setEngine(engine: BoardEngine): void {
    this.engine = engine;
    this.sortedTilesCache = null;
    this.handleResize();
    this.requestRender();
    if (this.callbacks.onStateChanged) {
      this.callbacks.onStateChanged();
    }
  }

  public setTheme(theme: ThemeType): void {
    this.theme = theme;
    const viewW = this.canvas.width / this.dpr;
    const viewH = this.canvas.height / this.dpr;
    if (viewW > 0 && viewH > 0) {
      this.renderBackgroundCache(viewW, viewH);
    }
    this.requestRender();
  }

  public setTileOptions(showHelpers: boolean, dimBlocked: boolean, useEmojiMode?: boolean): void {
    this.tileRenderer.setOptions(showHelpers, dimBlocked, useEmojiMode);
    this.requestRender();
  }

  public destroy(): void {
    this.isRunning = false;
  }

  public handleResize(): void {
    const parent = this.canvas.parentElement;
    if (!parent) return;

    const width = parent.clientWidth;
    const height = parent.clientHeight;

    this.canvas.width = width * this.dpr;
    this.canvas.height = height * this.dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(this.dpr, this.dpr);

    if (this.fxCanvas) {
      this.fxCanvas.width = width * this.dpr;
      this.fxCanvas.height = height * this.dpr;
      this.fxCanvas.style.width = `${width}px`;
      this.fxCanvas.style.height = `${height}px`;

      this.fxCtx?.setTransform(1, 0, 0, 1, 0, 0);
      this.fxCtx?.scale(this.dpr, this.dpr);
    }

    this.renderBackgroundCache(width, height);
    this.calculateAutoFit(width, height);
  }

  private renderBackgroundCache(w: number, h: number): void {
    if (!this.bgCanvas) {
      this.bgCanvas = document.createElement('canvas');
    }
    this.bgCanvas.width = Math.round(w * this.dpr);
    this.bgCanvas.height = Math.round(h * this.dpr);
    const g = this.bgCanvas.getContext('2d');
    if (!g) return;

    g.scale(this.dpr, this.dpr);
    this.drawBackgroundTo(g, w, h);
  }

  /**
   * Calcula o melhor fator de zoom e centralização para as peças ficarem o maior possível na tela
   */
  private calculateAutoFit(viewW: number, viewH: number): void {
    const tiles = this.engine.getActiveBoardTiles();
    if (tiles.length === 0) return;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    let maxZ = 0;

    tiles.forEach((t) => {
      if (t.position.x < minX) minX = t.position.x;
      if (t.position.x > maxX) maxX = t.position.x;
      if (t.position.y < minY) minY = t.position.y;
      if (t.position.y > maxY) maxY = t.position.y;
      if (t.position.z > maxZ) maxZ = t.position.z;
    });

    const gridCols = (maxX - minX + 2) / 2;
    const gridRows = (maxY - minY + 2) / 2;

    const isPortrait = viewH > viewW;
    // Margens adaptativas otimizadas:
    // Em retrato, o topo acomoda o HUD inline + Bandeja compacta (~104px)
    // A base acomoda os 4 botões compactos (~68px)
    const topMargin = isPortrait ? 104 : 52;
    const bottomMargin = isPortrait ? 68 : 64;
    const sideMargin = isPortrait ? 6 : 64;

    const availW = Math.max(100, viewW - sideMargin * 2);
    const availH = Math.max(100, viewH - topMargin - bottomMargin);

    const scaleX = availW / (gridCols * this.baseTileWidth + maxZ * this.baseTileDepth);
    const scaleY = availH / (gridRows * this.baseTileHeight + maxZ * this.baseTileDepth);

    // Zoom ideal ampliado com as novas margens compactas
    this.scale = Math.min(scaleX, scaleY, isPortrait ? 2.8 : 1.8);

    const curTileW = Math.round(this.baseTileWidth * this.scale);
    const curTileH = Math.round(this.baseTileHeight * this.scale);
    const curTileD = Math.max(4, Math.round(this.baseTileDepth * this.scale));

    const dims: TileDimensions = {
      tileWidth: curTileW,
      tileHeight: curTileH,
      tileDepth: curTileD,
    };
    this.tileRenderer.setDimensions(dims);

    const totalBoardW = gridCols * curTileW;
    const totalBoardH = gridRows * curTileH;

    this.offsetX = Math.round((viewW - totalBoardW) / 2 - (minX / 2) * curTileW);
    this.offsetY = Math.round(topMargin + (availH - totalBoardH) / 2 - (minY / 2) * curTileH);
    this.requestRender();
  }

  private startLoop(): void {
    const loop = (timestamp: number) => {
      if (!this.isRunning) return;
      this.animTime = timestamp;

      // 1. Camada da Mesa Estática: Redesenha apenas quando necessário
      const hasHinted = this.engine.getTiles().some((t) => t.isHinted && !t.isRemoved);
      if (this.isBoardDirty || hasHinted) {
        this.isBoardDirty = false;
        this.renderBoard();
      }

      // 2. Camada Dinâmica FX: Partículas climáticas e Sinergias cênicas
      const isFxAnimating =
        timestamp < this.animatingUntil ||
        this.climateTimer > 0 ||
        this.synergyAnimator.hasActiveAnimations();

      if (isFxAnimating) {
        this.isFxActive = true;
        this.renderFX();
      } else if (this.isFxActive) {
        this.clearFX();
        this.isFxActive = false;
      }

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  private renderBoard(): void {
    const viewW = this.canvas.width / this.dpr;
    const viewH = this.canvas.height / this.dpr;

    // 1. Desenhar Fundo da Mesa em Cache (Hardware Blit < 0.1ms)
    if (this.bgCanvas) {
      this.ctx.drawImage(this.bgCanvas, 0, 0, viewW, viewH);
    } else {
      this.drawBackgroundTo(this.ctx, viewW, viewH);
    }

    // 2. Obter peças ativas do tabuleiro ordenadas (com cache de ordenação)
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

    const tileWidth = Math.round(this.baseTileWidth * this.scale);
    const tileHeight = Math.round(this.baseTileHeight * this.scale);
    const tileDepth = Math.max(4, Math.round(this.baseTileDepth * this.scale));

    const freeTileIds = this.engine.getFreeTileIds();
    const len = activeTiles.length;

    for (let i = 0; i < len; i++) {
      const tile = activeTiles[i];
      if (tile.inSynergyPulled) continue;
      const screenX = this.offsetX + (tile.position.x / 2) * tileWidth - tile.position.z * (tileDepth * 0.4);
      const screenY = this.offsetY + (tile.position.y / 2) * tileHeight - tile.position.z * (tileDepth * 0.8);

      const isFree = freeTileIds.has(tile.id);

      let animOffset = 0;
      if (tile.isHinted) {
        animOffset = Math.sin(this.animTime / 180) * 3;
      }

      this.tileRenderer.drawTile(
        this.ctx,
        tile,
        screenX,
        screenY,
        isFree,
        animOffset
      );
    }

    // Fallback caso fxCanvas não esteja disponível no DOM
    if (!this.fxCtx) {
      this.updateAndDrawClimateParticles(viewW, viewH, this.ctx);
      this.synergyAnimator.render(this.ctx, performance.now());
    }
  }

  private renderFX(): void {
    const targetCanvas = this.fxCanvas || this.canvas;
    const targetCtx = this.fxCtx || this.ctx;
    const viewW = targetCanvas.width / this.dpr;
    const viewH = targetCanvas.height / this.dpr;

    if (this.fxCtx) {
      this.fxCtx.clearRect(0, 0, viewW, viewH);
    }

    this.updateAndDrawClimateParticles(viewW, viewH, targetCtx);
    this.synergyAnimator.render(targetCtx, performance.now());
  }

  private clearFX(): void {
    if (this.fxCtx && this.fxCanvas) {
      const viewW = this.fxCanvas.width / this.dpr;
      const viewH = this.fxCanvas.height / this.dpr;
      this.fxCtx.clearRect(0, 0, viewW, viewH);
    }
  }

  private drawBackgroundTo(g: CanvasRenderingContext2D, w: number, h: number): void {
    if (this.theme === 'mist-emerald' || this.theme === 'felt-green') {
      // Fundo dos prints: Verde esmeralda profundo com silhueta de montanhas zen
      const grad = g.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#0E483F'); // Topo esmeralda
      grad.addColorStop(0.5, '#0A332C');
      grad.addColorStop(1, '#051E1A'); // Base escura
      g.fillStyle = grad;
      g.fillRect(0, 0, w, h);

      // Montanhas ao longe
      g.fillStyle = 'rgba(3, 20, 16, 0.4)';
      g.beginPath();
      g.moveTo(0, h);
      g.lineTo(0, h * 0.72);
      g.quadraticCurveTo(w * 0.25, h * 0.62, w * 0.5, h * 0.75);
      g.quadraticCurveTo(w * 0.75, h * 0.82, w, h * 0.68);
      g.lineTo(w, h);
      g.closePath();
      g.fill();

      // Montanhas em primeiro plano
      g.fillStyle = 'rgba(2, 14, 11, 0.65)';
      g.beginPath();
      g.moveTo(0, h);
      g.lineTo(0, h * 0.82);
      g.quadraticCurveTo(w * 0.35, h * 0.76, w * 0.65, h * 0.86);
      g.quadraticCurveTo(w * 0.85, h * 0.80, w, h * 0.88);
      g.lineTo(w, h);
      g.closePath();
      g.fill();
    } else if (this.theme === 'wood-dark') {
      // Madeira Nobre / Mogno
      const grad = g.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#361D15');
      grad.addColorStop(0.5, '#28140D');
      grad.addColorStop(1, '#1A0C08');
      g.fillStyle = grad;
      g.fillRect(0, 0, w, h);
    } else if (this.theme === 'zen-dark') {
      // Jardim Zen Noturno (OLED dark com tom safira)
      const grad = g.createRadialGradient(w / 2, h / 2, 100, w / 2, h / 2, Math.max(w, h) * 0.7);
      grad.addColorStop(0, '#1E252E');
      grad.addColorStop(1, '#0F1216');
      g.fillStyle = grad;
      g.fillRect(0, 0, w, h);
    } else {
      // Linho Claro
      const grad = g.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#F5EFEB');
      grad.addColorStop(1, '#E6DCCF');
      g.fillStyle = grad;
      g.fillRect(0, 0, w, h);
    }
  }

  private getTileAtScreenPos(px: number, py: number): { tile: PlacedTile; sx: number; sy: number } | null {
    const { tileWidth, tileHeight, tileDepth } = {
      tileWidth: Math.round(this.baseTileWidth * this.scale),
      tileHeight: Math.round(this.baseTileHeight * this.scale),
      tileDepth: Math.max(4, Math.round(this.baseTileDepth * this.scale)),
    };

    const activeTiles = this.engine.getActiveBoardTiles();
    const sorted = [...activeTiles].sort((a, b) => b.position.z - a.position.z);

    for (const tile of sorted) {
      const sx = this.offsetX + (tile.position.x / 2) * tileWidth - tile.position.z * (tileDepth * 0.4);
      const sy = this.offsetY + (tile.position.y / 2) * tileHeight - tile.position.z * (tileDepth * 0.8) + (tile.isSelected ? -6 : 0);

      if (
        px >= sx &&
        px <= sx + tileWidth &&
        py >= sy &&
        py <= sy + tileHeight
      ) {
        return { tile, sx, sy };
      }
    }
    return null;
  }

  public getTileScreenCoords(tile: PlacedTile): { x: number; y: number; width: number; height: number } {
    const { tileWidth, tileHeight, tileDepth } = {
      tileWidth: Math.round(this.baseTileWidth * this.scale),
      tileHeight: Math.round(this.baseTileHeight * this.scale),
      tileDepth: Math.max(4, Math.round(this.baseTileDepth * this.scale)),
    };

    const x = this.offsetX + (tile.position.x / 2) * tileWidth - tile.position.z * (tileDepth * 0.4);
    const y = this.offsetY + (tile.position.y / 2) * tileHeight - tile.position.z * (tileDepth * 0.8) + (tile.isSelected ? -6 : 0);
    return { x, y, width: tileWidth, height: tileHeight };
  }

  private initEvents(): void {
    let longPressTimer: ReturnType<typeof setTimeout> | null = null;
    let isLongPressTriggered = false;
    let startX = 0;
    let startY = 0;

    const clearTimer = () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    };

    this.canvas.addEventListener('pointerdown', (e) => {
      clearTimer();
      isLongPressTriggered = false;
      const rect = this.canvas.getBoundingClientRect();
      startX = e.clientX - rect.left;
      startY = e.clientY - rect.top;

      const hit = this.getTileAtScreenPos(startX, startY);
      if (hit) {
        longPressTimer = setTimeout(() => {
          isLongPressTriggered = true;
          hapticManager.impactMedium();
          if (this.callbacks.onTileLongPress) {
            this.callbacks.onTileLongPress(hit.tile);
          }
        }, 400);
      }
    });

    this.canvas.addEventListener('pointermove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;
      if (Math.hypot(currentX - startX, currentY - startY) > 12) {
        clearTimer();
      }
    });

    this.canvas.addEventListener('pointerup', (e) => {
      clearTimer();
      if (isLongPressTriggered) return;
      const rect = this.canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      this.processClickAt(clickX, clickY);
    });

    this.canvas.addEventListener('pointercancel', () => {
      clearTimer();
    });

    window.addEventListener('resize', () => {
      this.handleResize();
    });
  }

  /**
   * Processa o toque na tela buscando a peça mais alta clicada
   */
  private processClickAt(px: number, py: number): void {
    if (this.isInputLocked) return;

    const { tileWidth, tileHeight } = {
      tileWidth: Math.round(this.baseTileWidth * this.scale),
      tileHeight: Math.round(this.baseTileHeight * this.scale),
    };

    const hit = this.getTileAtScreenPos(px, py);
    if (!hit) return;

    const clickedTile = hit.tile;
    const clickTileScreenX = hit.sx;
    const clickTileScreenY = hit.sy;

    const isFree = this.engine.isTileFree(clickedTile);

    if (this.callbacks.onTileClick) {
      this.callbacks.onTileClick(clickedTile, isFree);
    }

    if (!isFree) {
      soundManager.playBlockedSound();
      hapticManager.impactLight();

      const hasTileAbove = this.engine.getActiveBoardTiles().some(
        (o) =>
          o.id !== clickedTile!.id &&
          o.position.z > clickedTile!.position.z &&
          Math.abs(o.position.x - clickedTile!.position.x) < 2 &&
          Math.abs(o.position.y - clickedTile!.position.y) < 2
      );

      // Mostrar setas pretas indicando onde estão as peças bloqueadoras
      this.showBlockArrows(clickedTile, clickTileScreenX, clickTileScreenY, tileWidth, tileHeight, hasTileAbove);
      if (this.callbacks.onBlockedTileClick) {
        this.callbacks.onBlockedTileClick(clickedTile, hasTileAbove);
      }
      return;
    }

    // Se a bandeja + peças em voo já atingiram a capacidade, bloquear imediatamente com som
    if (this.engine.getTray().length + this.pendingTilesInFlight >= this.engine.getMaxTraySlots()) {
      soundManager.playBlockedSound();
      return;
    }

    // Peças de atores teatrais (Sapo, Gato, Urso, Golfinho) permanecem no tabuleiro durante a animação cênica!
    const matchingTrayTile = this.engine.getTray().find((t) => canMatch(t, clickedTile));
    const isTheatricalActor = matchingTrayTile && (
      clickedTile.value === 'frog' || clickedTile.value === 'cat' ||
      clickedTile.value === 'bear' || clickedTile.value === 'dolphin'
    );

    if (isTheatricalActor) {
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
      soundManager.playMatchSuccess();
      hapticManager.impactMedium();
      // Pop de match no centro da tela
      this.showMatchPop();

      if (this.callbacks.onMatchSuccess) {
        this.callbacks.onMatchSuccess(result.matchedPair);
      }

      // 1. Sinergia da Natureza ativada
      if (result.synergy) {
        this.triggerSynergyAnimation(result.synergy, clickedTile, result.matchedPair);
        if (this.callbacks.onSynergyTriggered) {
          this.callbacks.onSynergyTriggered(result.synergy);
        }
      }

      // 2. Clima da Natureza disparado
      if (result.climateTriggered) {
        this.triggerClimateEffect(result.climateTriggered.climate);
        if (this.callbacks.onClimateTriggered) {
          this.callbacks.onClimateTriggered(result.climateTriggered);
        }
      }

      // 3. Fim de Fase vs Fim de Onda intermediária
      // 3. Fim de Fase vs Fim de Onda intermediária (após matches imediatos sem cena teatral)
      const isTheatrical = result.synergy && (
        result.synergy.type === 'frog_tongue' ||
        result.synergy.type === 'cat_paw' ||
        result.synergy.type === 'bear_feast' ||
        result.synergy.type === 'dolphin_sonar'
      );

      if (!isTheatrical) {
        if (this.engine.isVictory()) {
          soundManager.playVictoryFanfare();
          hapticManager.impactVictory();
          this.triggerVictoryCelebration();

          if (this.callbacks.onBoardCleared) {
            this.callbacks.onBoardCleared();
          }
        } else if (result.waveCleared && this.engine.hasMoreWaves()) {
          // Celebração da onda intermediária!
          soundManager.playMatchSuccess();
          confetti({
            particleCount: 40,
            spread: 55,
            origin: { y: 0.6 },
            colors: ['#10B981', '#F59E0B', '#3B82F6', '#EC4899'],
          });

          if (this.callbacks.onWaveCleared) {
            this.callbacks.onWaveCleared(this.engine.getCurrentWave(), this.engine.getTotalWaves());
          }
        }
      }
    } else if (result.action === 'added') {
      soundManager.playTileClick();
      hapticManager.impactLight();

      // Checar se o tabuleiro esvaziou ao adicionar a última peça à bandeja (ou via resgate cósmico)
      if (this.engine.isVictory()) {
        soundManager.playVictoryFanfare();
        hapticManager.impactVictory();
        this.triggerVictoryCelebration();
        if (this.callbacks.onBoardCleared) {
          this.callbacks.onBoardCleared();
        }
      } else if (result.waveCleared && this.engine.hasMoreWaves()) {
        soundManager.playMatchSuccess();
        confetti({
          particleCount: 40,
          spread: 55,
          origin: { y: 0.6 },
          colors: ['#10B981', '#F59E0B', '#3B82F6', '#EC4899'],
        });
        if (this.callbacks.onWaveCleared) {
          this.callbacks.onWaveCleared(this.engine.getCurrentWave(), this.engine.getTotalWaves());
        }
      }
    } else if (result.action === 'tray_full') {
      soundManager.playBlockedSound();
    }

    if (this.callbacks.onStateChanged) {
      this.callbacks.onStateChanged();
    }
    this.requestRender();
  }

  /**
   * Dispara a animação cênica teatral da sinergia correspondente (Língua do Sapo, Patada, etc.)
   * Mantém a peça de origem e o alvo visíveis até o final da cena, dissolvendo ambos juntos!
   */
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

      // Remover duplicatas garantindo finalização atômica
      const seenIds = new Set<string>();
      const uniqueTiles: PlacedTile[] = [];
      for (const t of tilesToDissolve) {
        if (!seenIds.has(t.id)) {
          seenIds.add(t.id);
          uniqueTiles.push(t);
        }
      }
      this.engine.finalizeSynergyMatch(uniqueTiles);

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
        this.triggerVictoryCelebration();
        if (this.callbacks.onBoardCleared) {
          this.callbacks.onBoardCleared();
        }
      } else if (this.engine.isWaveCleared() && this.engine.hasMoreWaves()) {
        soundManager.playMatchSuccess();
        confetti({
          particleCount: 40,
          spread: 55,
          origin: { y: 0.6 },
          colors: ['#10B981', '#F59E0B', '#3B82F6', '#EC4899'],
        });
        if (this.callbacks.onWaveCleared) {
          this.callbacks.onWaveCleared(this.engine.getCurrentWave(), this.engine.getTotalWaves());
        }
      }
    };

    if (synergy.type === 'frog_tongue') {
      soundManager.playFrogTongue();
      hapticManager.impactMedium();
      this.isInputLocked = true;

      // Identifica o sapo (origem da língua) e a presa (joaninha / abelha)
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
      this.isBoardDirty = true;
    } else if (synergy.type === 'cat_paw') {
      soundManager.playCatPaw();
      hapticManager.impactLight();
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
      this.isBoardDirty = true;
    } else if (synergy.type === 'bear_feast') {
      soundManager.playBearClaw();
      hapticManager.impactMedium();
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
      this.isBoardDirty = true;
    } else if (synergy.type === 'dolphin_sonar') {
      soundManager.playDolphinSonar();
      hapticManager.impactLight();
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
      this.isBoardDirty = true;
    }
  }

  /** Ativa o efeito visual de clima por 4.5 segundos com partículas atmosféricas */
  public triggerClimateEffect(climate: ClimateType): void {
    this.activeClimate = climate;
    this.climateTimer = 150; // ~2.5s dinâmico e responsivo
    const viewW = this.canvas.width / this.dpr;
    const viewH = this.canvas.height / this.dpr;

    this.climateParticles = [];
    const count = 28;

    let char: string | undefined;
    let baseColor = 'rgba(255, 255, 255, 0.7)';

    if (climate === 'ocean_surge') {
      baseColor = 'rgba(56, 189, 248, 0.75)';
      char = '💧';
    } else if (climate === 'heat_wave') {
      baseColor = 'rgba(251, 191, 36, 0.6)';
      char = '✨';
    } else if (climate === 'spring_breeze') {
      baseColor = 'rgba(244, 114, 182, 0.7)';
      char = '🌸';
    } else if (climate === 'full_moon') {
      baseColor = 'rgba(250, 204, 21, 0.8)';
      char = '✨';
    } else if (climate === 'arctic_blizzard') {
      baseColor = 'rgba(186, 230, 253, 0.8)';
      char = '❄️';
    } else if (climate === 'autumn_gale') {
      baseColor = 'rgba(245, 158, 11, 0.8)';
      char = '🍂';
    } else if (climate === 'zen_storm') {
      baseColor = 'rgba(129, 140, 248, 0.8)';
      char = '⚡';
    }

    // Pré-renderizar sprite único em canvas offscreen (zero parsing de fonte por frame!)
    if (char) {
      const spriteCanvas = document.createElement('canvas');
      const sSize = Math.round(36 * this.dpr);
      spriteCanvas.width = sSize;
      spriteCanvas.height = sSize;
      const sCtx = spriteCanvas.getContext('2d');
      if (sCtx) {
        sCtx.scale(this.dpr, this.dpr);
        sCtx.font = '24px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", "Android Emoji", sans-serif';
        sCtx.textAlign = 'center';
        sCtx.textBaseline = 'middle';
        sCtx.fillText(char, 18, 18);
      }
      this.climateSpriteCache = spriteCanvas;
    } else {
      this.climateSpriteCache = null;
    }

    for (let i = 0; i < count; i++) {
      let speedX = (Math.random() - 0.5) * 2;
      let speedY = Math.random() * 3 + 2;

      if (climate === 'ocean_surge') {
        speedY = Math.random() * 4 + 3.5;
      } else if (climate === 'heat_wave') {
        speedY = -(Math.random() * 3.5 + 2);
      } else if (climate === 'spring_breeze') {
        speedX = Math.random() * 3.5 + 2.5;
        speedY = Math.random() * 2 + 1;
      } else if (climate === 'full_moon') {
        speedX = (Math.random() - 0.5) * 2;
        speedY = (Math.random() - 0.5) * 2;
      } else if (climate === 'arctic_blizzard') {
        speedX = (Math.random() - 0.5) * 3;
        speedY = Math.random() * 4.5 + 3;
      } else if (climate === 'autumn_gale') {
        speedX = Math.random() * 4 + 2.5;
        speedY = Math.random() * 2.5 + 1.2;
      } else if (climate === 'zen_storm') {
        speedX = (Math.random() - 0.5) * 1;
        speedY = Math.random() * 6 + 4;
      }

      this.climateParticles.push({
        x: Math.random() * viewW,
        y: Math.random() * viewH,
        speedX,
        speedY,
        size: Math.random() * 10 + 16,
        alpha: Math.random() * 0.5 + 0.5,
        char,
        color: baseColor,
      });
    }

    if (climate === 'full_moon') {
      setTimeout(() => {
        this.engine.getTiles().forEach((t) => (t.isHinted = false));
        this.requestRender();
      }, 5000);
    }

    this.isBoardDirty = true;
  }

  private updateAndDrawClimateParticles(
    w: number,
    h: number,
    g: CanvasRenderingContext2D = this.fxCtx || this.ctx
  ): void {
    if (this.climateTimer <= 0 || !this.activeClimate) return;

    this.climateTimer--;
    const fade = Math.min(1, this.climateTimer / 45);
    const sprite = this.climateSpriteCache;

    for (let i = 0; i < this.climateParticles.length; i++) {
      const p = this.climateParticles[i];
      p.x += p.speedX;
      p.y += p.speedY;

      if (p.x < -30) p.x = w + 15;
      if (p.x > w + 30) p.x = -15;
      if (p.y > h + 30) p.y = -15;
      if (p.y < -30) p.y = h + 15;

      g.globalAlpha = p.alpha * fade;
      if (sprite) {
        const sz = p.size;
        g.drawImage(sprite, p.x - sz / 2, p.y - sz / 2, sz, sz);
      } else {
        g.fillStyle = p.color || 'white';
        g.beginPath();
        g.arc(p.x, p.y, p.size / 4, 0, Math.PI * 2);
        g.fill();
      }
    }
    g.globalAlpha = 1.0;

    if (this.climateTimer <= 0) {
      this.activeClimate = null;
      this.climateParticles = [];
      this.climateSpriteCache = null;
    }
  }

  /** Setas pretas de alto contraste indicando em qual direção há peças bloqueando */
  private showBlockArrows(
    tile: PlacedTile,
    sx: number, sy: number,
    tw: number, th: number,
    hasTileAbove: boolean
  ): void {
    // Remover quaisquer setas ativas para não acumular na tela
    document.querySelectorAll('.block-arrow').forEach((a) => a.remove());

    const rect = this.canvas.getBoundingClientRect();
    const scaleX = rect.width / (this.canvas.width / this.dpr);
    const scaleY = rect.height / (this.canvas.height / this.dpr);

    const tileCenterX = rect.left + (sx + tw / 2) * scaleX;
    const tileCenterY = rect.top + (sy + th / 2) * scaleY;
    const tileLeft = rect.left + sx * scaleX;
    const tileRight = rect.left + (sx + tw) * scaleX;
    const tileTop = rect.top + sy * scaleY;

    const activeTiles = this.engine.getActiveBoardTiles();

    // Peça à esquerda
    const hasLeft = activeTiles.some(
      (o) =>
        o.id !== tile.id &&
        o.position.z === tile.position.z &&
        o.position.x < tile.position.x &&
        tile.position.x - o.position.x <= 2 &&
        Math.abs(o.position.y - tile.position.y) < 2
    );

    // Peça à direita
    const hasRight = activeTiles.some(
      (o) =>
        o.id !== tile.id &&
        o.position.z === tile.position.z &&
        o.position.x > tile.position.x &&
        o.position.x - tile.position.x <= 2 &&
        Math.abs(o.position.y - tile.position.y) < 2
    );

    const arrows: HTMLElement[] = [];

    const createArrowEl = (direction: 'left' | 'right' | 'up', posX: number, posY: number) => {
      const el = document.createElement('div');
      el.className = `block-arrow arrow-${direction}`;
      el.style.left = `${posX}px`;
      el.style.top = `${posY}px`;

      let pathD = '';
      if (direction === 'left') {
        // Seta preta grossa apontando para a esquerda (◄=) em direção à peça vizinha
        pathD = 'M 30 14 L 16 14 L 16 8 L 4 18 L 16 28 L 16 22 L 30 22 Z';
      } else if (direction === 'right') {
        // Seta preta grossa apontando para a direita (=►) em direção à peça vizinha
        pathD = 'M 6 14 L 20 14 L 20 8 L 32 18 L 20 28 L 20 22 L 6 22 Z';
      } else {
        // Seta preta grossa apontando para cima (▲) em direção à peça superior
        pathD = 'M 14 30 L 14 16 L 8 16 L 18 4 L 28 16 L 22 16 L 22 30 Z';
      }

      el.innerHTML = `
        <svg width="40" height="40" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="${pathD}" fill="#000000" stroke="#ffffff" stroke-width="2.5" stroke-linejoin="round" />
        </svg>
      `;
      document.body.appendChild(el);
      arrows.push(el);
    };

    if (hasTileAbove) {
      createArrowEl('up', tileCenterX - 20, tileTop - 26);
    }
    if (hasLeft) {
      createArrowEl('left', tileLeft - 26, tileCenterY - 20);
    }
    if (hasRight) {
      createArrowEl('right', tileRight - 14, tileCenterY - 20);
    }

    setTimeout(() => {
      arrows.forEach((a) => {
        a.classList.add('fade-out');
        setTimeout(() => a.remove(), 250);
      });
    }, 1400);
  }

  /** Emoji voa para cima no centro da tela ao combinar par */
  private showMatchPop(): void {
    const emojis = ['❤️', '🌟', '✨', '🎉', '💖'];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    const rect = this.canvas.getBoundingClientRect();

    const el = document.createElement('div');
    el.className = 'match-pop';
    el.textContent = emoji;
    el.style.left = `${rect.left + rect.width / 2 - 20 + (Math.random() - 0.5) * 60}px`;
    el.style.top  = `${rect.top + rect.height / 2}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 950);
  }

  private triggerVictoryCelebration(): void {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#EC4899'],
    });

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      });
    }, 250);
  }
}
