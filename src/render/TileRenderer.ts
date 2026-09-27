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

  // 🌊 Família Marinha / Oceano & Pescador (Azul Turquesa)
  dolphin:   { borderColor: '#06B6D4', badge: '🐚', name: 'Oceano' },
  shell:     { borderColor: '#06B6D4', badge: '🐚', name: 'Oceano' },
  fish:      { borderColor: '#06B6D4', badge: '🐟', name: 'Pescador' },
  cat:       { borderColor: '#06B6D4', badge: '🐟', name: 'Pescador' },

  // 🌿 Família do Brejo / Lagoa (Verde Esmeralda)
  frog:      { borderColor: '#10B981', badge: '🍃', name: 'Brejo' },
  ladybug:   { borderColor: '#10B981', badge: '🍃', name: 'Brejo' },

  // 🍎 Família do Pomar (Rubi Suave)
  hedgehog:  { borderColor: '#F43F5E', badge: '🍎', name: 'Pomar' },
  apple:     { borderColor: '#F43F5E', badge: '🍎', name: 'Pomar' },

  // 🦎 Camaleão Coringa (Arco-Íris Holográfico)
  chameleon: { borderColor: 'rainbow', badge: '✨', name: 'Coringa' },
};

const ALL_ANIMALS: AnimalValue[] = [
  'cat', 'dog', 'rabbit', 'fish', 'bird', 'butterfly', 'turtle', 'frog',
  'bee', 'elephant', 'lion', 'fox', 'monkey', 'panda', 'penguin', 'duck',
  'snail', 'ladybug', 'bear', 'squirrel', 'dolphin', 'hedgehog',
  'banana', 'acorn', 'shell', 'apple', 'honeycomb', 'chameleon',
];

export interface AtlasUV {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

export class TileRenderer {
  private cache: Map<string, HTMLCanvasElement> = new Map();
  private desaturateCache: Map<string, string> = new Map();
  private dpr: number = 1;
  private dims: TileDimensions = { tileWidth: 56, tileHeight: 74, tileDepth: 7 };
  private dimBlockedTiles: boolean = true;
  public useEmojiMode: boolean = true;

  // Master Texture Atlas (Sprite Sheet Unificado em GPU)
  private masterAtlas: HTMLCanvasElement | null = null;
  private atlasCoords: Map<AnimalValue, AtlasUV> = new Map();

  private cachedGlyphFontSize: number = 0;
  private cachedGlyphFont: string = '';

  constructor() {
    this.dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 3) : 1;
    this.buildMasterAtlas();
  }

  public setDimensions(dims: TileDimensions): void {
    if (
      this.dims.tileWidth !== dims.tileWidth ||
      this.dims.tileHeight !== dims.tileHeight ||
      this.dims.tileDepth !== dims.tileDepth
    ) {
      this.dims = dims;
      this.clearCache();
      this.buildMasterAtlas();
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
      this.buildMasterAtlas();
    }
  }

  public clearCache(): void {
    this.cache.clear();
    this.desaturateCache.clear();
    this.atlasCoords.clear();
    this.masterAtlas = null;
    this.cachedGlyphFont = '';
  }

  public buildMasterAtlas(): HTMLCanvasElement {
    const cw = this.dims.tileWidth - 4;
    const ch = this.dims.tileHeight - 4;
    const cellW = Math.round(cw * this.dpr);
    const cellH = Math.round(ch * this.dpr);

    const cols = 8;
    const rows = 4;
    const totalW = cols * cellW;
    const totalH = rows * cellH;

    if (!this.masterAtlas) {
      this.masterAtlas = document.createElement('canvas');
    }
    this.masterAtlas.width = totalW;
    this.masterAtlas.height = totalH;

    const g = this.masterAtlas.getContext('2d');
    if (!g) return this.masterAtlas;

    this.atlasCoords.clear();

    const badgeSize = Math.max(9, Math.round(cw * 0.22));
    const badgeFont = `${badgeSize}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", "Android Emoji", sans-serif`;

    for (let i = 0; i < ALL_ANIMALS.length; i++) {
      const animal = ALL_ANIMALS[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const sx = col * cellW;
      const sy = row * cellH;

      this.atlasCoords.set(animal, { sx, sy, sw: cellW, sh: cellH });

      g.save();
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.translate(sx, sy);
      g.scale(this.dpr, this.dpr);

      this.drawAnimalGlyph(g, animal, cw, ch, 0, 0);

      const syn = SYNERGY_FAMILIES[animal];
      if (syn && syn.badge) {
        const bx = cw - Math.round(cw * 0.16);
        const by = Math.round(ch * 0.16);

        g.save();
        g.font = badgeFont;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(syn.badge, bx, by);
        g.restore();
      }

      g.restore();
    }

    return this.masterAtlas;
  }

  public getAtlasUV(animal: AnimalValue): AtlasUV | null {
    if (!this.masterAtlas || this.atlasCoords.size === 0) {
      this.buildMasterAtlas();
    }
    return this.atlasCoords.get(animal) || null;
  }

  private getDimmedColor(hex: string): string {
    let cached = this.desaturateCache.get(hex);
    if (!cached) {
      cached = this.desaturate(hex, 0.5);
      this.desaturateCache.set(hex, cached);
    }
    return cached;
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
    animationOffsetY: number = 0,
    scaleXFactor: number = 1,
    alpha: number = 1,
    animTime: number = 0
  ): void {
    const { tileWidth, tileHeight, tileDepth } = this.dims;
    const yOffset = tile.isSelected ? -8 + animationOffsetY : animationOffsetY;

    // Recuo de 2px (inset) para criar sulco tátil entre pedras vizinhas
    const inset = 2;
    const faceW = tileWidth - inset * 2;
    const faceH = tileHeight - inset * 2;
    const x = screenX + inset;
    const y = screenY + yOffset + inset;
    const z = tile.position.z;

    ctx.save();

    if (alpha < 1) {
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    }
    if (scaleXFactor !== 1) {
      ctx.translate(x + faceW / 2, y + faceH / 2);
      ctx.scale(scaleXFactor, 1);
      ctx.translate(-(x + faceW / 2), -(y + faceH / 2));
    }

    // 1. SOMBRAS PROJETADAS EM CAMADAS (Z-DEPTH CAST SHADOW)
    // Sombra 1: Contato imediato com a mesa/peça inferior (escura e próxima)
    const contactDist = 2 + z * 3 + (tile.isSelected ? 8 : 0);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    this.drawRoundedRect(ctx, x + contactDist * 0.45, y + contactDist * 0.75, faceW, faceH, 10);
    ctx.fill();

    // Sombra 2: Penumbra difusa suave (amplia e expande quanto maior a elevação Z)
    if (z > 0 || tile.isSelected) {
      const diffuseDist = 5 + z * 7 + (tile.isSelected ? 12 : 0);
      const spread = 2 + z * 3;
      ctx.fillStyle = z >= 2 ? 'rgba(0, 0, 0, 0.24)' : 'rgba(0, 0, 0, 0.16)';
      this.drawRoundedRect(
        ctx,
        x + diffuseDist * 0.5 - spread / 2,
        y + diffuseDist * 0.8 - spread / 2,
        faceW + spread,
        faceH + spread,
        12
      );
      ctx.fill();
    }

    // 2. BASE 3D DA PEDRA (CORPO DE MARFIM + BASE DE JADE VERDE NOBRE)
    const dX = Math.round(tileDepth * 0.65);
    const dY = Math.round(tileDepth * 0.65);

    // --- FACE LATERAL DIREITA ---
    const ivorySplitY = y + Math.round(faceH * 0.62);

    // Topo de Marfim da lateral direita
    const gradRightIvory = ctx.createLinearGradient(x + faceW, y, x + faceW + dX, y + faceH);
    gradRightIvory.addColorStop(0, '#FAF6EE');
    gradRightIvory.addColorStop(0.5, '#EAE2D2');
    gradRightIvory.addColorStop(1, '#D8CFBC');

    ctx.fillStyle = gradRightIvory;
    ctx.beginPath();
    ctx.moveTo(x + faceW, y + 6);
    ctx.lineTo(x + faceW + dX, y + 6 + dY);
    ctx.lineTo(x + faceW + dX, ivorySplitY + dY);
    ctx.lineTo(x + faceW, ivorySplitY);
    ctx.closePath();
    ctx.fill();

    // Fundo de Jade da lateral direita (base clássica de Mahjong)
    const gradRightJade = ctx.createLinearGradient(x + faceW, ivorySplitY, x + faceW + dX, y + faceH + dY);
    gradRightJade.addColorStop(0, '#0F766E');
    gradRightJade.addColorStop(1, '#044E46');

    ctx.fillStyle = gradRightJade;
    ctx.beginPath();
    ctx.moveTo(x + faceW, ivorySplitY);
    ctx.lineTo(x + faceW + dX, ivorySplitY + dY);
    ctx.lineTo(x + faceW + dX, y + faceH + dY - 4);
    ctx.lineTo(x + faceW, y + faceH);
    ctx.closePath();
    ctx.fill();

    // Filete de separação entre marfim e jade
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + faceW, ivorySplitY);
    ctx.lineTo(x + faceW + dX, ivorySplitY + dY);
    ctx.stroke();

    // --- FACE LATERAL INFERIOR ---
    const ivoryBottomH = dY * 0.62;

    // Seção Marfim inferior
    const gradBottomIvory = ctx.createLinearGradient(x, y + faceH, x, y + faceH + ivoryBottomH);
    gradBottomIvory.addColorStop(0, '#D6CCBD');
    gradBottomIvory.addColorStop(1, '#BFB3A0');

    ctx.fillStyle = gradBottomIvory;
    ctx.beginPath();
    ctx.moveTo(x + 6, y + faceH);
    ctx.lineTo(x + 6 + dX * 0.62, y + faceH + ivoryBottomH);
    ctx.lineTo(x + faceW + dX * 0.62, y + faceH + ivoryBottomH);
    ctx.lineTo(x + faceW, y + faceH);
    ctx.closePath();
    ctx.fill();

    // Seção Jade inferior
    const gradBottomJade = ctx.createLinearGradient(x, y + faceH + ivoryBottomH, x, y + faceH + dY);
    gradBottomJade.addColorStop(0, '#09534C');
    gradBottomJade.addColorStop(1, '#022E29');

    ctx.fillStyle = gradBottomJade;
    ctx.beginPath();
    ctx.moveTo(x + 6 + dX * 0.62, y + faceH + ivoryBottomH);
    ctx.lineTo(x + 6 + dX, y + faceH + dY);
    ctx.lineTo(x + faceW + dX, y + faceH + dY);
    ctx.lineTo(x + faceW + dX * 0.62, y + faceH + ivoryBottomH);
    ctx.closePath();
    ctx.fill();

    // Contorno da lateral 3D
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x + faceW, y + 6);
    ctx.lineTo(x + faceW + dX, y + 6 + dY);
    ctx.lineTo(x + faceW + dX, y + faceH + dY);
    ctx.lineTo(x + 6 + dX, y + faceH + dY);
    ctx.lineTo(x + 6, y + faceH);
    ctx.stroke();

    // 3. FACE PRINCIPAL DA PEDRA
    const palette = ANIMAL_PALETTE[tile.value as AnimalValue] || ANIMAL_PALETTE.cat;
    let bgColor = isFree ? palette.bg : this.getDimmedColor(palette.bg);

    // Ajuste de luminosidade por nível Z: Peças mais altas recebem mais luz ambiente
    if (z === 1 && isFree) {
      bgColor = this.lighten(bgColor, 0.05);
    } else if (z >= 2 && isFree) {
      bgColor = this.lighten(bgColor, 0.10);
    }

    ctx.fillStyle = bgColor;
    this.drawRoundedRect(ctx, x, y, faceW, faceH, 8);
    ctx.fill();

    // 4. CHANFRO TÁTIL 3D (SPECULAR BEVEL HIGHLIGHT)
    ctx.save();
    // Borda superior e esquerda com reflexo de luz
    ctx.strokeStyle = z >= 1 ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.78)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x + 7, y + 1.2);
    ctx.lineTo(x + faceW - 7, y + 1.2);
    ctx.moveTo(x + 1.2, y + 7);
    ctx.lineTo(x + 1.2, y + faceH - 7);
    ctx.stroke();

    // Borda inferior e direita interna com sombra de chanfro
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.22)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x + faceW - 1.2, y + 7);
    ctx.lineTo(x + faceW - 1.2, y + faceH - 7);
    ctx.moveTo(x + 7, y + faceH - 1.2);
    ctx.lineTo(x + faceW - 7, y + faceH - 1.2);
    ctx.stroke();
    ctx.restore();

    // 5. MOLDURA E CONTORNO EXTERNO (DELIMITAÇÃO NÍTIDA COM CARTAS VIZINHAS)
    const syn = SYNERGY_FAMILIES[tile.value as AnimalValue];
    if (syn) {
      if (syn.borderColor === 'rainbow') {
        const cycle = animTime > 0 ? (animTime / 1400) % 1 : 0;
        const angle = cycle * Math.PI * 2;
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        const grad = ctx.createLinearGradient(
          x + faceW * (0.5 - cosA * 0.5),
          y + faceH * (0.5 - sinA * 0.5),
          x + faceW * (0.5 + cosA * 0.5),
          y + faceH * (0.5 + sinA * 0.5)
        );
        grad.addColorStop(0, '#FFD700');
        grad.addColorStop(0.33, '#00E676');
        grad.addColorStop(0.66, '#00B0FF');
        grad.addColorStop(1, '#E040FB');
        ctx.lineWidth = 2.6;
        ctx.strokeStyle = grad;
      } else {
        ctx.lineWidth = 2.4;
        ctx.strokeStyle = isFree ? syn.borderColor : '#94A3B8';
      }
      this.drawRoundedRect(ctx, x, y, faceW, faceH, 8);
      ctx.stroke();
    } else {
      // Peça neutra: contorno nítido que demarca o limite mesmo entre peças da mesma cor
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = isFree ? 'rgba(71, 85, 105, 0.65)' : '#94A3B8';
      this.drawRoundedRect(ctx, x, y, faceW, faceH, 8);
      ctx.stroke();
    }

    // 6. SELECIONADA — BORDA DOURADA BRILHANTE COM PULSO DE RESPIRAÇÃO
    if (tile.isSelected) {
      const pulse = animTime > 0 ? Math.sin(animTime / 180) * 1.2 : 0;
      ctx.lineWidth = 3.6 + pulse;
      ctx.strokeStyle = '#F59E0B';
      this.drawRoundedRect(ctx, x - 1, y - 1, faceW + 2, faceH + 2, 9);
      ctx.stroke();
      ctx.lineWidth = 1.2 + Math.max(0, pulse * 0.6);
      ctx.strokeStyle = `rgba(255, 215, 0, ${0.45 + pulse * 0.15})`;
      this.drawRoundedRect(ctx, x - 3, y - 3, faceW + 6, faceH + 6, 11);
      ctx.stroke();
    }

    // 7. DICA — AURA ESMERALDA PULSANTE
    if (tile.isHinted) {
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = '#10B981';
      this.drawRoundedRect(ctx, x - 2, y - 2, faceW + 4, faceH + 4, 10);
      ctx.stroke();
    }

    // 8. GLIFO DO ANIMAL E MICRO-BADGE (MASTER TEXTURE ATLAS)
    const uv = this.getAtlasUV(tile.value as AnimalValue);
    if (uv && this.masterAtlas) {
      if (!isFree && this.dimBlockedTiles) {
        ctx.globalAlpha = 0.76;
        ctx.drawImage(this.masterAtlas, uv.sx, uv.sy, uv.sw, uv.sh, x, y, faceW, faceH);
        ctx.globalAlpha = 1.0;
      } else {
        ctx.drawImage(this.masterAtlas, uv.sx, uv.sy, uv.sw, uv.sh, x, y, faceW, faceH);
      }
    } else {
      const face = this.getOrGenerateTileFace(tile);
      if (!isFree && this.dimBlockedTiles) {
        ctx.globalAlpha = 0.76;
        ctx.drawImage(face, x, y, faceW, faceH);
        ctx.globalAlpha = 1.0;
      } else {
        ctx.drawImage(face, x, y, faceW, faceH);
      }
    }

    // 8.1. CAMADAS E OVERLAYS ESPECIAIS (Gelo, Cipó, Rocha, Casulo, Baú, Espelho)
    this.drawSpecialOverlay(ctx, tile, x, y, faceW, faceH, isFree);

    // 9. INDICADOR DE NÍVEL / ANDAR (ACESSIBILIDADE VISUAL PARA Z >= 1)
    if (z >= 1) {
      const badgeH = Math.max(13, Math.round(faceH * 0.16));
      const badgeW = Math.max(17, Math.round(faceW * 0.26));
      const bx = x + 3.5;
      const by = y + 3.5;

      ctx.save();
      // Mini-chip elegante translúcido
      ctx.fillStyle = z >= 2 ? 'rgba(217, 119, 6, 0.92)' : 'rgba(15, 23, 42, 0.75)';
      this.drawRoundedRect(ctx, bx, by, badgeW, badgeH, 4);
      ctx.fill();

      // Borda do mini-chip
      ctx.strokeStyle = z >= 2 ? '#FEF3C7' : 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Rótulo: ▲2 ou ▲3
      const fontSize = Math.max(9, Math.round(badgeH * 0.72));
      ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`▲${z + 1}`, bx + badgeW / 2, by + badgeH / 2 + 0.5);
      ctx.restore();
    }

    ctx.restore();
  }

  public getOrGenerateTileFace(tile: PlacedTile): HTMLCanvasElement {
    const key = `${tile.value}_${this.dims.tileWidth}_${this.dims.tileHeight}`;
    let cached = this.cache.get(key);
    if (cached) return cached;

    const cw = this.dims.tileWidth - 4;
    const ch = this.dims.tileHeight - 4;
    const off = document.createElement('canvas');
    off.width = Math.round(cw * this.dpr);
    off.height = Math.round(ch * this.dpr);
    const g = off.getContext('2d');
    if (!g) return off;

    g.scale(this.dpr, this.dpr);
    this.drawAnimalGlyph(g, tile.value as AnimalValue, cw, ch, 0, 0);

    // Micro-badge de sinergia pré-renderizado no cache offscreen
    const syn = SYNERGY_FAMILIES[tile.value as AnimalValue];
    if (syn && syn.badge) {
      const badgeSize = Math.max(9, Math.round(cw * 0.22));
      const bx = cw - Math.round(cw * 0.16);
      const by = Math.round(ch * 0.16);

      g.save();
      g.font = `${badgeSize}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", "Android Emoji", sans-serif`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(syn.badge, bx, by);
      g.restore();
    }

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

    if (this.cachedGlyphFontSize !== fontSize) {
      this.cachedGlyphFontSize = fontSize;
      this.cachedGlyphFont = `${fontSize}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", "Android Emoji", sans-serif`;
    }

    g.save();
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = this.cachedGlyphFont;

    g.fillText(emoji, cx, cy);
    g.restore();
  }

  // =========================================================================
  // OVERLAYS DE PEÇAS ESPECIAIS (Gelo, Cipó, Rocha, Casulo, Baú, Espelho)
  // =========================================================================

  private drawSpecialOverlay(
    ctx: CanvasRenderingContext2D,
    tile: PlacedTile,
    x: number,
    y: number,
    w: number,
    h: number,
    isFree: boolean
  ): void {
    if (!tile.specialType || tile.specialType === 'normal' || tile.specialType === 'chameleon') return;

    ctx.save();
    const badgeSize = Math.max(12, Math.round(w * 0.28));
    const font = `${badgeSize}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;

    switch (tile.specialType) {
      case 'ice': {
        // Overlay de gelo cristalino translúcido com brilho ciano
        ctx.fillStyle = isFree ? 'rgba(186, 230, 253, 0.40)' : 'rgba(147, 197, 253, 0.55)';
        this.drawRoundedRect(ctx, x, y, w, h, 8);
        ctx.fill();

        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 1.8;
        this.drawRoundedRect(ctx, x, y, w, h, 8);
        ctx.stroke();

        ctx.font = font;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.fillText('❄️', x + w - 3, y + 3);
        break;
      }
      case 'vines': {
        // Moldura de cipós verde floresta com folhas
        ctx.strokeStyle = '#15803D';
        ctx.lineWidth = 2.4;
        this.drawRoundedRect(ctx, x, y, w, h, 8);
        ctx.stroke();

        ctx.font = font;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.fillText('🌿', x + w - 3, y + 3);
        break;
      }
      case 'rock': {
        // Rocha ancestral sólida
        ctx.fillStyle = 'rgba(71, 85, 105, 0.35)';
        this.drawRoundedRect(ctx, x, y, w, h, 8);
        ctx.fill();

        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2.5;
        this.drawRoundedRect(ctx, x, y, w, h, 8);
        ctx.stroke();

        ctx.font = font;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.fillText('🪨', x + w - 3, y + 3);
        break;
      }
      case 'cocoon': {
        // Casulo dourado místico
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 2.2;
        this.drawRoundedRect(ctx, x, y, w, h, 8);
        ctx.stroke();

        ctx.font = font;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.fillText('🥚', x + w - 3, y + 3);
        break;
      }
      case 'chest': {
        // Baú da fortuna dourado
        ctx.strokeStyle = '#EAB308';
        ctx.lineWidth = 2.4;
        this.drawRoundedRect(ctx, x, y, w, h, 8);
        ctx.stroke();

        ctx.font = font;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.fillText('🎁', x + w - 3, y + 3);
        break;
      }
      case 'mirror': {
        // Espelho místico com moldura prateada cintilante
        const grad = ctx.createLinearGradient(x, y, x + w, y + h);
        grad.addColorStop(0, '#E2E8F0');
        grad.addColorStop(0.5, '#94A3B8');
        grad.addColorStop(1, '#CBD5E1');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2.6;
        this.drawRoundedRect(ctx, x, y, w, h, 8);
        ctx.stroke();

        ctx.font = font;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.fillText('🪞', x + w - 3, y + 3);
        break;
      }
    }
    ctx.restore();
  }

  // =========================================================================
  // UTILITÁRIOS
  // =========================================================================

  private lighten(color: string, factor: number): string {
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      const nr = Math.min(255, Math.round(r + (255 - r) * factor));
      const ng = Math.min(255, Math.round(g + (255 - g) * factor));
      const nb = Math.min(255, Math.round(b + (255 - b) * factor));
      return `rgb(${nr},${ng},${nb})`;
    }
    return color;
  }

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
