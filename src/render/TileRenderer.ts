import { PlacedTile, AnimalValue } from '../core/types';

export interface TileDimensions {
  tileWidth: number;
  tileHeight: number;
  tileDepth: number;
}

// Paleta de cores — bg diferente para cada animal, sem duplicatas
const ANIMAL_PALETTE: Record<AnimalValue, { bg: string; accent: string; dark: string }> = {
  cat:       { bg: '#FFF3E0', accent: '#FF8F00', dark: '#E65100' },
  dog:       { bg: '#E8F5E9', accent: '#D7995B', dark: '#5D4037' },
  rabbit:    { bg: '#FCE4EC', accent: '#E91E63', dark: '#880E4F' },
  fish:      { bg: '#E3F2FD', accent: '#1976D2', dark: '#0D47A1' },
  bird:      { bg: '#E8EAF6', accent: '#3949AB', dark: '#1A237E' },
  butterfly: { bg: '#F3E5F5', accent: '#9C27B0', dark: '#4A148C' },
  turtle:    { bg: '#E0F2F1', accent: '#00897B', dark: '#004D40' },
  frog:      { bg: '#F1F8E9', accent: '#43A047', dark: '#1B5E20' },
  bee:       { bg: '#FFFDE7', accent: '#FFB300', dark: '#212121' },
  elephant:  { bg: '#EDE7F6', accent: '#7E57C2', dark: '#311B92' },
  lion:      { bg: '#FFF8E1', accent: '#FFB300', dark: '#BF6000' },
  fox:       { bg: '#FBE9E7', accent: '#F4511E', dark: '#BF360C' },
  monkey:    { bg: '#EFEBE9', accent: '#A1662F', dark: '#4E342E' },
  panda:     { bg: '#FAFAFA', accent: '#212121', dark: '#000000' },
  penguin:   { bg: '#E1F5FE', accent: '#0288D1', dark: '#01579B' },
  duck:      { bg: '#E0F7FA', accent: '#00ACC1', dark: '#1B5E20' },
  snail:     { bg: '#FFF9C4', accent: '#F57F17', dark: '#4E342E' },
  ladybug:   { bg: '#FFEBEE', accent: '#C62828', dark: '#B71C1C' },

  // Novos Animais
  bear:      { bg: '#EFEBE9', accent: '#795548', dark: '#3E2723' },
  squirrel:  { bg: '#FFF3E0', accent: '#E65100', dark: '#BF360C' },
  dolphin:   { bg: '#E0F7FA', accent: '#0097A7', dark: '#006064' },
  hedgehog:  { bg: '#F5EBE6', accent: '#8D6E63', dark: '#4E342E' },

  // Adereços e Elementos Naturais
  banana:    { bg: '#FFFDE7', accent: '#FBC02D', dark: '#F57F17' },
  acorn:     { bg: '#EFEBE9', accent: '#8D6E63', dark: '#4E342E' },
  shell:     { bg: '#EDE7F6', accent: '#7E57C2', dark: '#4527A0' },
  apple:     { bg: '#FFEBEE', accent: '#E53935', dark: '#B71C1C' },
  honeycomb: { bg: '#FFF8E1', accent: '#FFA000', dark: '#FF6F00' },

  // Peça Coringa
  chameleon: { bg: '#E8F5E9', accent: '#00E676', dark: '#00B0FF' },
};

const EMOJIS_MAP: Record<AnimalValue, string> = {
  cat: '🐱', dog: '🐶', rabbit: '🐰', fish: '🐟',
  bird: '🐦', butterfly: '🦋', turtle: '🐢', frog: '🐸',
  bee: '🐝', elephant: '🐘', lion: '🦁', fox: '🦊',
  monkey: '🐒', panda: '🐼', penguin: '🐧', duck: '🦆',
  snail: '🐌', ladybug: '🐞',
  bear: '🐻', squirrel: '🐿️', dolphin: '🐬', hedgehog: '🦔',
  banana: '🍌', acorn: '🌰', shell: '🐚', apple: '🍎', honeycomb: '🍯',
  chameleon: '🦎',
};

export interface SynergyFamily {
  borderColor: string;
  badge: string;
  name: string;
}

export const SYNERGY_FAMILIES: Partial<Record<AnimalValue, SynergyFamily>> = {
  // 🍯 Família do Mel / Doce (Amarelo Âmbar)
  bee:       { borderColor: '#F59E0B', badge: '🍯', name: 'Mel' },
  bear:      { borderColor: '#F59E0B', badge: '🍯', name: 'Mel' },
  honeycomb: { borderColor: '#F59E0B', badge: '🍯', name: 'Mel' },

  // 🍌 Família da Fruta / Copa (Amarelo Solar)
  monkey:    { borderColor: '#FACC15', badge: '🍌', name: 'Fruta' },
  banana:    { borderColor: '#FACC15', badge: '🍌', name: 'Fruta' },

  // 🌰 Família das Nozes / Toca (Marrom Avelã)
  squirrel:  { borderColor: '#B45309', badge: '🌰', name: 'Noz' },
  acorn:     { borderColor: '#B45309', badge: '🌰', name: 'Noz' },

  // 🌊 Família Marinha / Oceano (Azul Turquesa)
  dolphin:   { borderColor: '#06B6D4', badge: '🐚', name: 'Oceano' },
  shell:     { borderColor: '#06B6D4', badge: '🐚', name: 'Oceano' },
  fish:      { borderColor: '#06B6D4', badge: '🐚', name: 'Oceano' },

  // 🌿 Família do Brejo / Lagoa (Verde Esmeralda)
  frog:      { borderColor: '#10B981', badge: '🍃', name: 'Brejo' },
  ladybug:   { borderColor: '#10B981', badge: '🍃', name: 'Brejo' },

  // 🍎 Família do Pomar (Rubi Suave)
  hedgehog:  { borderColor: '#F43F5E', badge: '🍎', name: 'Pomar' },
  apple:     { borderColor: '#F43F5E', badge: '🍎', name: 'Pomar' },

  // 🦎 Camaleão Coringa (Arco-Íris Holográfico)
  chameleon: { borderColor: 'rainbow', badge: '✨', name: 'Coringa' },
};

export class TileRenderer {
  private cache: Map<string, HTMLCanvasElement> = new Map();
  private dpr: number = 1;
  private dims: TileDimensions = { tileWidth: 56, tileHeight: 74, tileDepth: 7 };
  private dimBlockedTiles: boolean = true;
  public useEmojiMode: boolean = true;

  constructor() {
    this.dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 3) : 1;
  }

  public setDimensions(dims: TileDimensions): void {
    if (
      this.dims.tileWidth !== dims.tileWidth ||
      this.dims.tileHeight !== dims.tileHeight ||
      this.dims.tileDepth !== dims.tileDepth
    ) {
      this.dims = dims;
      this.clearCache();
    }
  }

  public setOptions(_showHelperNumbers: boolean, dimBlockedTiles: boolean, useEmojiMode?: boolean): void {
    let changed = false;
    if (this.dimBlockedTiles !== dimBlockedTiles) {
      this.dimBlockedTiles = dimBlockedTiles;
      changed = true;
    }
    if (useEmojiMode !== undefined && this.useEmojiMode !== useEmojiMode) {
      this.useEmojiMode = useEmojiMode;
      changed = true;
    }
    if (changed) {
      this.clearCache();
    }
  }

  public clearCache(): void {
    this.cache.clear();
  }

  // =========================================================================
  // MAIN DRAW ENTRY POINT (ULTRA-OTIMIZADO - ZERO OFFSCREEN CANVAS POR TILE)
  // =========================================================================

  public drawTile(
    ctx: CanvasRenderingContext2D,
    tile: PlacedTile,
    screenX: number,
    screenY: number,
    isFree: boolean,
    animationOffsetY: number = 0
  ): void {
    const { tileWidth, tileHeight, tileDepth } = this.dims;
    const yOffset = tile.isSelected ? -6 + animationOffsetY : animationOffsetY;
    const x = screenX;
    const y = screenY + yOffset;

    const palette = ANIMAL_PALETTE[tile.value as AnimalValue] || ANIMAL_PALETTE.cat;

    ctx.save();

    // 1. Sombra projetada
    const shadowDist = (tile.position.z + 1) * 3.5 + (tile.isSelected ? 7 : 0);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    this.drawRoundedRect(ctx, x + shadowDist * 0.6, y + shadowDist, tileWidth, tileHeight, 9);
    ctx.fill();

    // 2. Base 3D lateral (direita)
    ctx.fillStyle = '#1A2A3A';
    ctx.beginPath();
    ctx.moveTo(x + tileWidth - 2, y + 8);
    ctx.lineTo(x + tileWidth + tileDepth, y + 8 + tileDepth);
    ctx.lineTo(x + tileWidth + tileDepth, y + tileHeight + tileDepth - 4);
    ctx.lineTo(x + tileWidth - 2, y + tileHeight);
    ctx.closePath();
    ctx.fill();

    // Lateral inferior
    ctx.fillStyle = '#0F1E2C';
    ctx.beginPath();
    ctx.moveTo(x + 8, y + tileHeight - 2);
    ctx.lineTo(x + 8 + tileDepth, y + tileHeight + tileDepth);
    ctx.lineTo(x + tileWidth + tileDepth, y + tileHeight + tileDepth);
    ctx.lineTo(x + tileWidth - 2, y + tileHeight - 2);
    ctx.closePath();
    ctx.fill();

    // 3. Borda de separação
    ctx.fillStyle = '#CBD5E1';
    this.drawRoundedRect(ctx, x + 2, y + 2, tileWidth - 2, tileHeight - 2, 8);
    ctx.fill();

    // 4. Face principal
    const bgColor = isFree ? palette.bg : this.desaturate(palette.bg, 0.5);
    ctx.fillStyle = bgColor;
    this.drawRoundedRect(ctx, x, y, tileWidth - 2, tileHeight - 2, 8);
    ctx.fill();

    // Moldura Temática da Família de Sinergia ou Clássica
    const syn = SYNERGY_FAMILIES[tile.value as AnimalValue];
    if (syn) {
      if (syn.borderColor === 'rainbow') {
        const grad = ctx.createLinearGradient(x, y, x + tileWidth, y + tileHeight);
        grad.addColorStop(0, '#FFD700');
        grad.addColorStop(0.33, '#00E676');
        grad.addColorStop(0.66, '#00B0FF');
        grad.addColorStop(1, '#E040FB');
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = grad;
        this.drawRoundedRect(ctx, x, y, tileWidth - 2, tileHeight - 2, 8);
        ctx.stroke();
      } else {
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = isFree ? syn.borderColor : '#94A3B8';
        this.drawRoundedRect(ctx, x, y, tileWidth - 2, tileHeight - 2, 8);
        ctx.stroke();
      }
    } else {
      // Peça clássica / neutra
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = isFree ? palette.accent + '55' : '#C0CBDA';
      this.drawRoundedRect(ctx, x, y, tileWidth - 2, tileHeight - 2, 8);
      ctx.stroke();
    }

    // 5. Selecionada — borda dourada brilhante
    if (tile.isSelected) {
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = '#F59E0B';
      this.drawRoundedRect(ctx, x - 1, y - 1, tileWidth, tileHeight, 9);
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255,215,0,0.4)';
      this.drawRoundedRect(ctx, x - 3, y - 3, tileWidth + 4, tileHeight + 4, 11);
      ctx.stroke();
    }

    // 6. Dica — aura esmeralda pulsante
    if (tile.isHinted) {
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = '#10B981';
      this.drawRoundedRect(ctx, x - 2, y - 2, tileWidth + 2, tileHeight + 2, 9);
      ctx.stroke();
    }

    // 7. Glifo do animal / elemento desenhado diretamente (alta performance sem recriar canvas)
    const cw = tileWidth - 2;
    const ch = tileHeight - 2;
    if (!isFree && this.dimBlockedTiles) {
      ctx.globalAlpha = 0.78;
      this.drawAnimalGlyph(ctx, tile.value as AnimalValue, cw, ch, x, y);
      ctx.globalAlpha = 1.0;
    } else {
      this.drawAnimalGlyph(ctx, tile.value as AnimalValue, cw, ch, x, y);
    }

    // 8. Micro-Badge de Sinergia no canto superior direito para leitura imediata por idosos
    if (syn && syn.badge) {
      const badgeSize = Math.max(9, Math.round(cw * 0.22));
      const bx = x + cw - Math.round(cw * 0.16);
      const by = y + Math.round(ch * 0.16);

      ctx.save();
      ctx.font = `${badgeSize}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", "Android Emoji", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (!isFree && this.dimBlockedTiles) {
        ctx.globalAlpha = 0.55;
      }
      ctx.fillText(syn.badge, bx, by);
      ctx.restore();
    }

    ctx.restore();
  }

  public getOrGenerateTileFace(tile: PlacedTile): HTMLCanvasElement {
    const key = `${tile.value}_${this.dims.tileWidth}_${this.dims.tileHeight}`;
    let cached = this.cache.get(key);
    if (cached) return cached;

    const cw = this.dims.tileWidth - 2;
    const ch = this.dims.tileHeight - 2;
    const off = document.createElement('canvas');
    off.width = Math.round(cw * this.dpr);
    off.height = Math.round(ch * this.dpr);
    const g = off.getContext('2d');
    if (!g) return off;

    g.scale(this.dpr, this.dpr);
    this.drawAnimalGlyph(g, tile.value as AnimalValue, cw, ch, 0, 0);

    this.cache.set(key, off);
    return off;
  }

  // =========================================================================
  // RENDERIZADOR DE ANIMAIS (EMOJIS) DIRETO NO CONTEXTO
  // =========================================================================

  public drawAnimalGlyph(
    g: CanvasRenderingContext2D,
    animal: AnimalValue,
    cw: number,
    ch: number,
    offsetX: number = 0,
    offsetY: number = 0
  ): void {
    const emoji = EMOJIS_MAP[animal] || '🐾';
    const cx = offsetX + cw / 2;
    const cy = offsetY + ch * 0.48;
    const fontSize = Math.round(cw * 0.62);

    g.save();
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = `${fontSize}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", "Android Emoji", sans-serif`;

    g.shadowColor = 'rgba(0, 0, 0, 0.16)';
    g.shadowBlur = 4;
    g.shadowOffsetY = 2;

    g.fillText(emoji, cx, cy);
    g.restore();
  }

  // =========================================================================
  // UTILITÁRIOS
  // =========================================================================

  private desaturate(hex: string, factor: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const gray = Math.round(r * 0.3 + g * 0.59 + b * 0.11);
    const nr = Math.round(r + (gray - r) * factor);
    const ng = Math.round(g + (gray - g) * factor);
    const nb = Math.round(b + (gray - b) * factor);
    return `rgb(${nr},${ng},${nb})`;
  }

  private drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    w: number, h: number,
    r: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}
