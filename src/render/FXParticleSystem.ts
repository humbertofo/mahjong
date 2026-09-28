import { ClimateType, PlacedTile } from '../core/types';

export interface ClimateParticle {
  x: number;
  y: number;
  speedX: number;
  speedY: number;
  size: number;
  alpha: number;
  char?: string;
  color?: string;
}

export interface DissolveEffect {
  active: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  startTime: number;
  duration: number;
  color: string;
}

export interface BlockArrowEffect {
  active: boolean;
  direction: 'left' | 'right' | 'up';
  x: number;
  y: number;
  startTime: number;
  duration: number;
}

export interface EmojiPopEffect {
  active: boolean;
  emoji: string;
  x: number;
  y: number;
  startTime: number;
  duration: number;
}

export class FXParticleSystem {
  private fxCanvas: HTMLCanvasElement | null = null;
  private fxCtx: CanvasRenderingContext2D | null = null;
  private dpr: number = 1;

  // Canvas estático compartilhado offscreen para sprites de emoji (Zero createElement em runtime)
  private static sharedSpriteCanvas: HTMLCanvasElement | null = null;
  private static sharedSpriteCtx: CanvasRenderingContext2D | null = null;

  // Efeitos Climáticos da Natureza (Partículas Zen em Object Pool)
  private activeClimate: ClimateType | null = null;
  private climateTimer: number = 0;
  private climateSpriteCache: HTMLCanvasElement | null = null;
  private climateParticlePool: ClimateParticle[] = [];
  private activeClimateCount: number = 0;

  // Object Pools pré-alocados para eliminar Garbage Collection em runtime
  private dissolvePool: DissolveEffect[] = [];
  private arrowPool: BlockArrowEffect[] = [];
  private popPool: EmojiPopEffect[] = [];

  constructor(fxCanvas?: HTMLCanvasElement | null, dpr: number = 1) {
    this.dpr = dpr;
    const fx = fxCanvas || (typeof document !== 'undefined' ? (document.getElementById('fx-canvas') as HTMLCanvasElement | null) : null);
    if (fx) {
      this.fxCanvas = fx;
      this.fxCtx = fx.getContext('2d', { alpha: true });
    }

    // Pré-aloca pool de 32 partículas climáticas
    for (let i = 0; i < 32; i++) {
      this.climateParticlePool.push({
        x: 0,
        y: 0,
        speedX: 0,
        speedY: 0,
        size: 20,
        alpha: 1,
        color: '',
      });
    }

    // Pré-aloca pool de 16 efeitos de dissolução
    for (let i = 0; i < 16; i++) {
      this.dissolvePool.push({
        active: false,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        startTime: 0,
        duration: 250,
        color: '#F59E0B',
      });
    }

    // Pré-aloca pool de 6 setas de bloqueio
    for (let i = 0; i < 6; i++) {
      this.arrowPool.push({
        active: false,
        direction: 'up',
        x: 0,
        y: 0,
        startTime: 0,
        duration: 1200,
      });
    }

    // Pré-aloca pool de 8 pops de emoji
    for (let i = 0; i < 8; i++) {
      this.popPool.push({
        active: false,
        emoji: '✨',
        x: 0,
        y: 0,
        startTime: 0,
        duration: 850,
      });
    }
  }

  public setDpr(dpr: number): void {
    this.dpr = dpr;
  }

  public getFxCanvas(): HTMLCanvasElement | null {
    return this.fxCanvas;
  }

  public getFxCtx(): CanvasRenderingContext2D | null {
    return this.fxCtx;
  }

  public hasActiveEffects(isShuffling: boolean): boolean {
    if (this.climateTimer > 0 || isShuffling) return true;
    for (let i = 0; i < this.dissolvePool.length; i++) {
      if (this.dissolvePool[i].active) return true;
    }
    for (let i = 0; i < this.arrowPool.length; i++) {
      if (this.arrowPool[i].active) return true;
    }
    for (let i = 0; i < this.popPool.length; i++) {
      if (this.popPool[i].active) return true;
    }
    return false;
  }

  public triggerLocalMatchDissolve(
    coords: { x: number; y: number; width: number; height: number },
    color: string = '#F59E0B'
  ): void {
    const now = performance.now();
    let slot = this.dissolvePool.find((d) => !d.active);
    if (!slot) {
      let oldestIdx = 0;
      let oldestAge = -1;
      for (let i = 0; i < this.dissolvePool.length; i++) {
        const age = now - this.dissolvePool[i].startTime;
        if (age > oldestAge) {
          oldestAge = age;
          oldestIdx = i;
        }
      }
      slot = this.dissolvePool[oldestIdx];
    }
    slot.active = true;
    slot.x = coords.x;
    slot.y = coords.y;
    slot.width = coords.width;
    slot.height = coords.height;
    slot.startTime = now;
    slot.duration = 250;
    slot.color = color;
  }

  public triggerClimateEffect(
    climate: ClimateType,
    viewW: number,
    viewH: number,
    onFullMoonExpire?: () => void
  ): void {
    this.activeClimate = climate;
    this.climateTimer = 150; // ~2.5s dinâmico
    const count = Math.min(28, this.climateParticlePool.length);
    this.activeClimateCount = count;

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

    if (char && typeof document !== 'undefined') {
      if (!FXParticleSystem.sharedSpriteCanvas) {
        FXParticleSystem.sharedSpriteCanvas = document.createElement('canvas');
        FXParticleSystem.sharedSpriteCanvas.width = 72;
        FXParticleSystem.sharedSpriteCanvas.height = 72;
        FXParticleSystem.sharedSpriteCtx = FXParticleSystem.sharedSpriteCanvas.getContext('2d');
      }
      const spriteCanvas = FXParticleSystem.sharedSpriteCanvas;
      const sCtx = FXParticleSystem.sharedSpriteCtx;
      if (sCtx) {
        sCtx.clearRect(0, 0, spriteCanvas.width, spriteCanvas.height);
        sCtx.save();
        sCtx.scale(this.dpr, this.dpr);
        sCtx.font = '24px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", "Android Emoji", sans-serif';
        sCtx.textAlign = 'center';
        sCtx.textBaseline = 'middle';
        sCtx.fillText(char, 18, 18);
        sCtx.restore();
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

      const p = this.climateParticlePool[i];
      p.x = Math.random() * viewW;
      p.y = Math.random() * viewH;
      p.speedX = speedX;
      p.speedY = speedY;
      p.size = Math.random() * 10 + 16;
      p.alpha = Math.random() * 0.5 + 0.5;
      p.char = char;
      p.color = baseColor;
    }

    if (climate === 'full_moon' && onFullMoonExpire) {
      setTimeout(onFullMoonExpire, 5000);
    }
  }

  public renderFX(
    fallbackCanvas: HTMLCanvasElement,
    fallbackCtx: CanvasRenderingContext2D,
    animTime: number,
    shuffleStartTime: number,
    shuffleDuration: number
  ): void {
    const targetCanvas = this.fxCanvas || fallbackCanvas;
    const targetCtx = this.fxCtx || fallbackCtx;
    const viewW = targetCanvas.width / this.dpr;
    const viewH = targetCanvas.height / this.dpr;

    if (this.fxCtx) {
      this.fxCtx.clearRect(0, 0, viewW, viewH);
    }

    // Redemoinho zen de luz durante o Shuffle
    const elapsedShuffle = animTime - shuffleStartTime;
    if (elapsedShuffle >= 0 && elapsedShuffle < shuffleDuration) {
      const p = Math.max(0, Math.min(1, elapsedShuffle / shuffleDuration));
      const radius = Math.max(0, p * Math.max(viewW, viewH) * 0.55);
      if (radius > 0.1) {
        const alpha = Math.max(0, Math.sin(p * Math.PI) * 0.75);
        const cx = viewW / 2;
        const cy = viewH / 2;
        targetCtx.save();
        targetCtx.strokeStyle = `rgba(245, 158, 11, ${alpha})`;
        targetCtx.lineWidth = 3.5;
        targetCtx.beginPath();
        targetCtx.arc(cx, cy, radius, 0, Math.PI * 2);
        targetCtx.stroke();
        targetCtx.restore();
      }
    }

    // Partículas de dissolução local de peças combinadas (Zero-Alloc Object Pool)
    const now = performance.now();
    for (let i = 0; i < this.dissolvePool.length; i++) {
      const d = this.dissolvePool[i];
      if (!d.active) continue;

      const elapsed = Math.max(0, now - d.startTime);
      const progress = Math.max(0, Math.min(1, elapsed / d.duration));
      if (progress >= 1) {
        d.active = false;
        continue;
      }

      const cx = d.x + d.width / 2;
      const cy = d.y + d.height / 2;
      const radius = Math.max(0.1, (d.width / 2) * (0.7 + progress * 0.6));
      const alpha = Math.max(0, 1 - progress);

      targetCtx.save();
      targetCtx.beginPath();
      targetCtx.arc(cx, cy, radius, 0, Math.PI * 2);
      targetCtx.strokeStyle = d.color || `rgba(251, 191, 36, ${alpha * 0.8})`;
      targetCtx.lineWidth = Math.max(0.1, 3 * (1 - progress));
      targetCtx.stroke();

      targetCtx.fillStyle = d.color || `rgba(255, 255, 255, ${alpha})`;
      targetCtx.beginPath();
      for (let a = 0; a < 8; a++) {
        const ang = (a * Math.PI) / 4 + progress * 0.6;
        const dist = radius * (0.6 + progress * 0.6);
        const px = cx + Math.cos(ang) * dist;
        const py = cy + Math.sin(ang) * dist;
        const sparkRadius = Math.max(0.1, 2.5 * (1 - progress));
        targetCtx.moveTo(px + sparkRadius, py);
        targetCtx.arc(px, py, sparkRadius, 0, Math.PI * 2);
      }
      targetCtx.fill();
      targetCtx.restore();
    }

    // Setas indicadoras de bloqueio em Canvas nativo (Zero-Alloc Object Pool)
    for (let i = 0; i < this.arrowPool.length; i++) {
      const arrow = this.arrowPool[i];
      if (!arrow.active) continue;

      const elapsed = now - arrow.startTime;
      const progress = Math.min(1, Math.max(0, elapsed / arrow.duration));
      if (progress >= 1) {
        arrow.active = false;
        continue;
      }

      const alpha = progress < 0.7 ? 1.0 : Math.max(0, (1 - progress) / 0.3);
      const pulse = Math.sin(progress * Math.PI * 4) * 2;

      targetCtx.save();
      targetCtx.translate(arrow.x, arrow.y + pulse);
      targetCtx.globalAlpha = alpha;
      targetCtx.fillStyle = '#0F172A';
      targetCtx.strokeStyle = '#FFFFFF';
      targetCtx.lineWidth = 2.5;
      targetCtx.lineJoin = 'round';
      targetCtx.beginPath();
      if (arrow.direction === 'up') {
        targetCtx.moveTo(0, -14);
        targetCtx.lineTo(10, 2);
        targetCtx.lineTo(5, 2);
        targetCtx.lineTo(5, 14);
        targetCtx.lineTo(-5, 14);
        targetCtx.lineTo(-5, 2);
        targetCtx.lineTo(-10, 2);
      } else if (arrow.direction === 'left') {
        targetCtx.moveTo(-14, 0);
        targetCtx.lineTo(2, -10);
        targetCtx.lineTo(2, -5);
        targetCtx.lineTo(14, -5);
        targetCtx.lineTo(14, 5);
        targetCtx.lineTo(2, 5);
        targetCtx.lineTo(2, 10);
      } else { // right
        targetCtx.moveTo(14, 0);
        targetCtx.lineTo(-2, -10);
        targetCtx.lineTo(-2, -5);
        targetCtx.lineTo(-14, -5);
        targetCtx.lineTo(-14, 5);
        targetCtx.lineTo(-2, 5);
        targetCtx.lineTo(-2, 10);
      }
      targetCtx.closePath();
      targetCtx.fill();
      targetCtx.stroke();
      targetCtx.restore();
    }

    // Popups de emojis de celebração de match em Canvas (Zero-Alloc Object Pool)
    let hasDrawnPopHeader = false;
    for (let i = 0; i < this.popPool.length; i++) {
      const pop = this.popPool[i];
      if (!pop.active) continue;

      const elapsed = now - pop.startTime;
      const progress = Math.min(1, Math.max(0, elapsed / pop.duration));
      if (progress >= 1) {
        pop.active = false;
        continue;
      }

      if (!hasDrawnPopHeader) {
        targetCtx.save();
        targetCtx.font = '32px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
        targetCtx.textAlign = 'center';
        targetCtx.textBaseline = 'middle';
        hasDrawnPopHeader = true;
      }

      const alpha = Math.max(0, 1 - progress);
      const floatY = pop.y - progress * 45;
      const scale = 0.8 + Math.sin(progress * Math.PI) * 0.4;

      targetCtx.save();
      targetCtx.translate(pop.x, floatY);
      targetCtx.scale(scale, scale);
      targetCtx.globalAlpha = alpha;
      targetCtx.fillText(pop.emoji, 0, 0);
      targetCtx.restore();
    }
    if (hasDrawnPopHeader) {
      targetCtx.restore();
    }

    this.updateAndDrawClimateParticles(viewW, viewH, targetCtx);
  }

  public updateAndDrawClimateParticles(
    w: number,
    h: number,
    g: CanvasRenderingContext2D = this.fxCtx!
  ): void {
    if (this.climateTimer <= 0 || !this.activeClimate) return;

    this.climateTimer--;
    const fade = Math.min(1, this.climateTimer / 45);
    const sprite = this.climateSpriteCache;

    for (let i = 0; i < this.activeClimateCount; i++) {
      const p = this.climateParticlePool[i];
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
        const pRadius = Math.max(0.1, p.size / 4);
        g.beginPath();
        g.arc(p.x, p.y, pRadius, 0, Math.PI * 2);
        g.fill();
      }
    }
    g.globalAlpha = 1.0;

    if (this.climateTimer <= 0) {
      this.activeClimate = null;
      this.activeClimateCount = 0;
      this.climateSpriteCache = null;
    }
  }

  public clearFX(): void {
    if (this.fxCtx && this.fxCanvas) {
      const viewW = this.fxCanvas.width / this.dpr;
      const viewH = this.fxCanvas.height / this.dpr;
      this.fxCtx.clearRect(0, 0, viewW, viewH);
    }
  }

  public showBlockArrows(
    tile: PlacedTile,
    sx: number,
    sy: number,
    tw: number,
    th: number,
    hasTileAbove: boolean,
    activeTiles: PlacedTile[],
    _canvasRect?: DOMRect,
    _canvasLogicalWidth?: number,
    _canvasLogicalHeight?: number
  ): void {
    // Desativa setas anteriores sem desalocar objetos
    for (let i = 0; i < this.arrowPool.length; i++) {
      this.arrowPool[i].active = false;
    }

    const tileCenterX = sx + tw / 2;
    const tileCenterY = sy + th / 2;
    const tileLeft = sx;
    const tileRight = sx + tw;
    const tileTop = sy;

    const hasLeft = activeTiles.some(
      (o) =>
        o.id !== tile.id &&
        o.position.z === tile.position.z &&
        o.position.x < tile.position.x &&
        tile.position.x - o.position.x <= 2 &&
        Math.abs(o.position.y - tile.position.y) < 2
    );

    const hasRight = activeTiles.some(
      (o) =>
        o.id !== tile.id &&
        o.position.z === tile.position.z &&
        o.position.x > tile.position.x &&
        tile.position.x - o.position.x <= 2 &&
        Math.abs(o.position.y - tile.position.y) < 2
    );

    const now = performance.now();
    const duration = 1200;
    let arrowIdx = 0;

    if (hasTileAbove && arrowIdx < this.arrowPool.length) {
      const a = this.arrowPool[arrowIdx++];
      a.active = true;
      a.direction = 'up';
      a.x = tileCenterX;
      a.y = tileTop - 16;
      a.startTime = now;
      a.duration = duration;
    }
    if (hasLeft && arrowIdx < this.arrowPool.length) {
      const a = this.arrowPool[arrowIdx++];
      a.active = true;
      a.direction = 'left';
      a.x = tileLeft - 16;
      a.y = tileCenterY;
      a.startTime = now;
      a.duration = duration;
    }
    if (hasRight && arrowIdx < this.arrowPool.length) {
      const a = this.arrowPool[arrowIdx++];
      a.active = true;
      a.direction = 'right';
      a.x = tileRight + 16;
      a.y = tileCenterY;
      a.startTime = now;
      a.duration = duration;
    }
  }

  public showMatchPop(canvasRect?: DOMRect): void {
    const emojis = ['❤️', '🌟', '✨', '🎉', '💖'];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];

    const viewW = this.fxCanvas ? this.fxCanvas.width / this.dpr : (canvasRect?.width || 360);
    const viewH = this.fxCanvas ? this.fxCanvas.height / this.dpr : (canvasRect?.height || 640);
    const x = viewW / 2 + (Math.random() - 0.5) * 60;
    const y = viewH / 2;

    const now = performance.now();
    let slot = this.popPool.find((p) => !p.active);
    if (!slot) {
      let oldestIdx = 0;
      let oldestAge = -1;
      for (let i = 0; i < this.popPool.length; i++) {
        const age = now - this.popPool[i].startTime;
        if (age > oldestAge) {
          oldestAge = age;
          oldestIdx = i;
        }
      }
      slot = this.popPool[oldestIdx];
    }

    slot.active = true;
    slot.emoji = emoji;
    slot.x = x;
    slot.y = y;
    slot.startTime = now;
    slot.duration = 850;
  }

  public triggerVictoryCelebration(): void {
    // Unificado: a celebração com partículas agora é orquestrada centralmente pelo GameEndModals
  }
}
