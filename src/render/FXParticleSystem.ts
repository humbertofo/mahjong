import { ClimateType, PlacedTile } from '../core/types';
import confetti from 'canvas-confetti';

export class FXParticleSystem {
  private fxCanvas: HTMLCanvasElement | null = null;
  private fxCtx: CanvasRenderingContext2D | null = null;
  private dpr: number = 1;

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

  // Partículas de dissolução local de peças combinadas
  private activeDissolves: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    startTime: number;
    duration: number;
    color?: string;
  }> = [];

  constructor(fxCanvas?: HTMLCanvasElement | null, dpr: number = 1) {
    this.dpr = dpr;
    const fx = fxCanvas || (typeof document !== 'undefined' ? (document.getElementById('fx-canvas') as HTMLCanvasElement | null) : null);
    if (fx) {
      this.fxCanvas = fx;
      this.fxCtx = fx.getContext('2d', { alpha: true });
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
    return (
      this.climateTimer > 0 ||
      this.activeDissolves.length > 0 ||
      isShuffling
    );
  }

  public triggerLocalMatchDissolve(
    coords: { x: number; y: number; width: number; height: number },
    color: string = '#F59E0B'
  ): void {
    this.activeDissolves.push({
      x: coords.x,
      y: coords.y,
      width: coords.width,
      height: coords.height,
      startTime: performance.now(),
      duration: 250,
      color,
    });
  }

  public triggerClimateEffect(
    climate: ClimateType,
    viewW: number,
    viewH: number,
    onFullMoonExpire?: () => void
  ): void {
    this.activeClimate = climate;
    this.climateTimer = 150; // ~2.5s dinâmico
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

    // Partículas de dissolução local de peças combinadas
    if (this.activeDissolves.length > 0) {
      const now = performance.now();
      for (let i = this.activeDissolves.length - 1; i >= 0; i--) {
        const d = this.activeDissolves[i];
        const elapsed = Math.max(0, now - d.startTime);
        const progress = Math.max(0, Math.min(1, elapsed / d.duration));
        if (progress >= 1) {
          this.activeDissolves.splice(i, 1);
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
        for (let a = 0; a < 8; a++) {
          const ang = (a * Math.PI) / 4 + progress * 0.6;
          const dist = radius * (0.6 + progress * 0.6);
          const px = cx + Math.cos(ang) * dist;
          const py = cy + Math.sin(ang) * dist;
          const sparkRadius = Math.max(0.1, 2.5 * (1 - progress));
          targetCtx.beginPath();
          targetCtx.arc(px, py, sparkRadius, 0, Math.PI * 2);
          targetCtx.fill();
        }
        targetCtx.restore();
      }
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
        const pRadius = Math.max(0.1, p.size / 4);
        g.beginPath();
        g.arc(p.x, p.y, pRadius, 0, Math.PI * 2);
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
    canvasRect: DOMRect,
    canvasLogicalWidth: number,
    canvasLogicalHeight: number
  ): void {
    document.querySelectorAll('.block-arrow').forEach((a) => a.remove());

    const scaleX = canvasRect.width / canvasLogicalWidth;
    const scaleY = canvasRect.height / canvasLogicalHeight;

    const tileCenterX = canvasRect.left + (sx + tw / 2) * scaleX;
    const tileCenterY = canvasRect.top + (sy + th / 2) * scaleY;
    const tileLeft = canvasRect.left + sx * scaleX;
    const tileRight = canvasRect.left + (sx + tw) * scaleX;
    const tileTop = canvasRect.top + sy * scaleY;

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
        pathD = 'M 30 14 L 16 14 L 16 8 L 4 18 L 16 28 L 16 22 L 30 22 Z';
      } else if (direction === 'right') {
        pathD = 'M 6 14 L 20 14 L 20 8 L 32 18 L 20 28 L 20 22 L 6 22 Z';
      } else {
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

  public showMatchPop(canvasRect: DOMRect): void {
    const emojis = ['❤️', '🌟', '✨', '🎉', '💖'];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];

    const el = document.createElement('div');
    el.className = 'match-pop';
    el.textContent = emoji;
    el.style.left = `${canvasRect.left + canvasRect.width / 2 - 20 + (Math.random() - 0.5) * 60}px`;
    el.style.top  = `${canvasRect.top + canvasRect.height / 2}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 950);
  }

  public triggerVictoryCelebration(): void {
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#EC4899'],
    });
  }
}
