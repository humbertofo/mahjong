import { BoardEngine } from '../core/BoardEngine';
import { PlacedTile, ThemeType } from '../core/types';
import { TileRenderer, TileDimensions } from './TileRenderer';
import { soundManager } from '../audio/SoundManager';
import { hapticManager } from '../audio/HapticManager';
import confetti from 'canvas-confetti';

export interface BoardRendererCallbacks {
  onTileClick?: (tile: PlacedTile, isFree: boolean) => void;
  onBlockedTileClick?: (tile: PlacedTile, isBlockedFromAbove: boolean) => void;
  onMatchSuccess?: (pair: [PlacedTile, PlacedTile]) => void;
  onBoardCleared?: () => void;
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
  private isDirty: boolean = true;
  private animatingUntil: number = 0;
  public isInputLocked: boolean = false;

  constructor(
    canvas: HTMLCanvasElement,
    engine: BoardEngine,
    callbacks: BoardRendererCallbacks = {}
  ) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Não foi possível obter o contexto 2D do Canvas');
    this.ctx = context;
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

  public requestRender(): void {
    this.isDirty = true;
  }

  public triggerAnimation(durationMs: number = 4000): void {
    this.animatingUntil = Math.max(this.animatingUntil, performance.now() + durationMs);
  }

  public setEngine(engine: BoardEngine): void {
    this.engine = engine;
    this.handleResize();
    this.requestRender();
    if (this.callbacks.onStateChanged) {
      this.callbacks.onStateChanged();
    }
  }

  public setTheme(theme: ThemeType): void {
    this.theme = theme;
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

    this.calculateAutoFit(width, height);
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

      const isAnimating = timestamp < this.animatingUntil;
      if (this.isDirty || isAnimating) {
        this.render();
        this.isDirty = false;
      }

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  private render(): void {
    const viewW = this.canvas.width / this.dpr;
    const viewH = this.canvas.height / this.dpr;

    // 1. Desenhar Fundo da Mesa com textura
    this.drawBackground(viewW, viewH);

    // 2. Ordenar as peças ativas do tabuleiro
    const activeTiles = this.engine.getActiveBoardTiles();
    activeTiles.sort((a, b) => {
      if (a.position.z !== b.position.z) {
        return a.position.z - b.position.z;
      }
      if (a.position.y !== b.position.y) {
        return a.position.y - b.position.y;
      }
      return a.position.x - b.position.x;
    });

    const { tileWidth, tileHeight, tileDepth } = {
      tileWidth: Math.round(this.baseTileWidth * this.scale),
      tileHeight: Math.round(this.baseTileHeight * this.scale),
      tileDepth: Math.max(4, Math.round(this.baseTileDepth * this.scale)),
    };

    activeTiles.forEach((tile) => {
      const screenX = this.offsetX + (tile.position.x / 2) * tileWidth - tile.position.z * (tileDepth * 0.4);
      const screenY = this.offsetY + (tile.position.y / 2) * tileHeight - tile.position.z * (tileDepth * 0.8);

      const isFree = this.engine.isTileFree(tile);

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
    });
  }

  private drawBackground(w: number, h: number): void {
    const g = this.ctx;

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

  private initEvents(): void {
    // Touch e Click unificados
    const handlePointerDown = (clientX: number, clientY: number) => {
      const rect = this.canvas.getBoundingClientRect();
      const clickX = clientX - rect.left;
      const clickY = clientY - rect.top;

      this.processClickAt(clickX, clickY);
    };

    this.canvas.addEventListener('pointerdown', (e) => {
      handlePointerDown(e.clientX, e.clientY);
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

    const { tileWidth, tileHeight, tileDepth } = {
      tileWidth: Math.round(this.baseTileWidth * this.scale),
      tileHeight: Math.round(this.baseTileHeight * this.scale),
      tileDepth: Math.max(4, Math.round(this.baseTileDepth * this.scale)),
    };

    const activeTiles = this.engine.getActiveBoardTiles();

    // Ordena do topo para a base (Z decrescente) para pegar a peça superior primeiro
    const sorted = [...activeTiles].sort((a, b) => b.position.z - a.position.z);

    let clickedTile: PlacedTile | null = null;
    let clickTileScreenX = 0;
    let clickTileScreenY = 0;

    for (const tile of sorted) {
      const sx = this.offsetX + (tile.position.x / 2) * tileWidth - tile.position.z * (tileDepth * 0.4);
      const sy = this.offsetY + (tile.position.y / 2) * tileHeight - tile.position.z * (tileDepth * 0.8) + (tile.isSelected ? -6 : 0);

      if (
        px >= sx &&
        px <= sx + tileWidth &&
        py >= sy &&
        py <= sy + tileHeight
      ) {
        clickedTile = tile;
        clickTileScreenX = sx;
        clickTileScreenY = sy;
        break; // Achou a peça mais ao topo sob o dedo
      }
    }

    if (!clickedTile) return;

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

    // Se a bandeja já estiver cheia, bloquear imediatamente com som
    if (this.engine.getTray().length >= this.engine.getMaxTraySlots()) {
      soundManager.playBlockedSound();
      return;
    }

    if (this.callbacks.onTileFlightToTray) {
      clickedTile.inTray = true;
      this.requestRender();

      this.callbacks.onTileFlightToTray(
        clickedTile,
        clickTileScreenX,
        clickTileScreenY,
        tileWidth,
        tileHeight,
        () => {
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

      if (this.engine.isVictory()) {
        soundManager.playVictoryFanfare();
        hapticManager.impactVictory();
        this.triggerVictoryCelebration();

        if (this.callbacks.onBoardCleared) {
          this.callbacks.onBoardCleared();
        }
      }
    } else if (result.action === 'added') {
      soundManager.playTileClick();
      hapticManager.impactLight();
    } else if (result.action === 'tray_full') {
      soundManager.playBlockedSound();
    }

    if (this.callbacks.onStateChanged) {
      this.callbacks.onStateChanged();
    }
    this.requestRender();
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
        o.position.x === tile.position.x - 2 &&
        Math.abs(o.position.y - tile.position.y) < 2
    );

    // Peça à direita
    const hasRight = activeTiles.some(
      (o) =>
        o.id !== tile.id &&
        o.position.z === tile.position.z &&
        o.position.x === tile.position.x + 2 &&
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
