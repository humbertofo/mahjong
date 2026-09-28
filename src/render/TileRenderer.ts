import { PlacedTile, AnimalValue } from '../core/types';
import {
  SynergyFamily,
  SYNERGY_FAMILIES,
  ANIMAL_HELPER_INDEX,
} from '../core/nature/synergies/SynergyFamilies';
import { TileRegistry } from '../core/nature/tiles';

export type { SynergyFamily };
export { SYNERGY_FAMILIES, ANIMAL_HELPER_INDEX };

export interface TileDimensions {
  tileWidth: number;
  tileHeight: number;
  tileDepth: number;
}

export interface AtlasUV {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

export class TileRenderer {
  private cache: Map<string, HTMLCanvasElement> = new Map();
  private desaturateCache: Map<string, string> = new Map();
  private lightenCache: Map<string, string> = new Map();
  private dpr: number = 1;
  private dims: TileDimensions = { tileWidth: 56, tileHeight: 74, tileDepth: 7 };
  private dimBlockedTiles: boolean = true;
  private showHelperNumbers: boolean = true;
  public useEmojiMode: boolean = true;

  // Master Texture Atlas (Sprite Sheet Unificado em GPU) com Bake On-Demand
  private masterAtlas: HTMLCanvasElement | null = null;
  private atlasCoords: Map<AnimalValue, AtlasUV> = new Map();
  private static animalIndexMap: Map<AnimalValue, number> | null = null;

  // Cache de Superfície 3D Completa da Peça (Bake On-Demand de Corpo + Chanfros + Face)
  private tileSpriteCache: Map<string, HTMLCanvasElement> = new Map();

  private cachedGlyphFontSize: number = 0;
  private cachedGlyphFont: string = '';

  constructor() {
    this.dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2.0) : 1;
  }

  public setDpr(dpr: number): void {
    if (this.dpr !== dpr) {
      this.dpr = dpr;
      this.clearCache();
      this.initMasterAtlas();
    }
  }

  private static getAnimalIndex(animal: AnimalValue): number {
    if (!TileRenderer.animalIndexMap) {
      TileRenderer.animalIndexMap = new Map();
      const all = TileRegistry.getAll();
      for (let i = 0; i < all.length; i++) {
        TileRenderer.animalIndexMap.set(all[i].value, i);
      }
    }
    return TileRenderer.animalIndexMap.get(animal) ?? -1;
  }

  public setDimensions(dims: TileDimensions): void {
    if (
      !this.masterAtlas ||
      this.dims.tileWidth !== dims.tileWidth ||
      this.dims.tileHeight !== dims.tileHeight
    ) {
      this.dims = dims;
      this.clearCache();
      this.initMasterAtlas();
    } else {
      this.dims = dims;
    }
  }

  public setOptions(showHelperNumbers: boolean, dimBlockedTiles: boolean, useEmojiMode?: boolean): void {
    let changed = false;
    if (this.showHelperNumbers !== showHelperNumbers) {
      this.showHelperNumbers = showHelperNumbers;
      changed = true;
    }
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
      this.initMasterAtlas();
    }
  }

  public clearCache(): void {
    this.cache.clear();
    this.desaturateCache.clear();
    this.lightenCache.clear();
    this.atlasCoords.clear();
    this.tileSpriteCache.clear();
    this.cachedGlyphFont = '';
    this.cachedGlyphFontSize = 0;
  }

  /**
   * Aloca e dimensiona a superfície do Master Atlas offscreen instantaneamente (< 0.1ms).
   * Inclui margem de segurança (gutter) entre as células para garantir zero sangramento (bleeding) entre peças.
   */
  public initMasterAtlas(): HTMLCanvasElement {
    const totalTiles = TileRegistry.getAll().length;
    const pad = 4;
    const cw = this.dims.tileWidth - 4;
    const ch = this.dims.tileHeight - 4;
    const cellW = Math.round((cw + pad) * this.dpr);
    const cellH = Math.round((ch + pad) * this.dpr);

    const cols = 8;
    const rows = Math.max(4, Math.ceil(totalTiles / cols));
    const totalW = cols * cellW;
    const totalH = rows * cellH;

    if (!this.masterAtlas) {
      this.masterAtlas = document.createElement('canvas');
    }
    if (this.masterAtlas.width !== totalW || this.masterAtlas.height !== totalH) {
      this.masterAtlas.width = totalW;
      this.masterAtlas.height = totalH;
    } else {
      const g = this.masterAtlas.getContext('2d');
      g?.clearRect(0, 0, totalW, totalH);
    }

    this.atlasCoords.clear();
    return this.masterAtlas;
  }

  /**
   * Renderiza os glifos dos animais, badges de sinergia e chips de numerais de acessibilidade
   * no Master Atlas em lote com clipping estrito e margem de isolamento por célula.
   */
  public prewarmTiles(animals: AnimalValue[]): void {
    if (!this.masterAtlas) {
      this.initMasterAtlas();
    }
    const unbaked: { animal: AnimalValue; sx: number; sy: number }[] = [];
    const pad = 4;
    const cols = 8;
    const cw = this.dims.tileWidth - 4;
    const ch = this.dims.tileHeight - 4;
    const cellW = Math.round((cw + pad) * this.dpr);
    const cellH = Math.round((ch + pad) * this.dpr);
    const sw = Math.round(cw * this.dpr);
    const sh = Math.round(ch * this.dpr);

    for (let i = 0; i < animals.length; i++) {
      const animal = animals[i];
      if (!this.atlasCoords.has(animal)) {
        const idx = TileRenderer.getAnimalIndex(animal);
        if (idx >= 0) {
          const col = idx % cols;
          const row = Math.floor(idx / cols);
          const sx = col * cellW;
          const sy = row * cellH;
          this.atlasCoords.set(animal, { sx, sy, sw, sh });
          unbaked.push({ animal, sx, sy });
        }
      }
    }

    if (unbaked.length === 0) return;

    const g = this.masterAtlas!.getContext('2d');
    if (!g) return;

    const emojiFontSize = Math.round(cw * 0.70);
    const emojiFont = `${emojiFontSize}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", "Android Emoji", sans-serif`;
    const badgeSize = Math.max(10, Math.round(cw * 0.22));
    const badgeFont = `${badgeSize}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", "Android Emoji", sans-serif`;

    for (let i = 0; i < unbaked.length; i++) {
      const item = unbaked[i];
      g.save();
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.translate(item.sx, item.sy);
      g.scale(this.dpr, this.dpr);

      // CLIPPING ESTRITO ÚNICO POR CÉLULA
      g.beginPath();
      g.rect(0, 0, cw, ch);
      g.clip();

      // 1. Glifo Principal do Animal / Emoji
      g.font = emojiFont;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      const emoji = TileRegistry.getEmoji(item.animal);
      g.fillText(emoji, cw / 2, ch * 0.49);

      // 2. Badge de Sinergia
      const syn = SYNERGY_FAMILIES[item.animal];
      if (syn && syn.badge) {
        g.font = badgeFont;
        const bx = cw - Math.round(cw * 0.16);
        const by = Math.round(ch * 0.16);
        g.fillText(syn.badge, bx, by);
      }

      // 3. Chip de Numeral Arábico de Acessibilidade
      if (this.showHelperNumbers) {
        const helperNum = TileRegistry.getHelperIndex(item.animal);
        if (helperNum !== undefined) {
          const isThreeDigits = helperNum.length >= 3;
          const numH = Math.max(11, Math.round(ch * 0.15));
          const numW = Math.max(isThreeDigits ? 18 : 13, Math.round(cw * (isThreeDigits ? 0.28 : 0.20)));
          const nx = 3.5;
          const ny = ch - numH - 3.5;

          g.fillStyle = 'rgba(255, 255, 255, 0.94)';
          this.drawRoundedRect(g, nx, ny, numW, numH, 3.5);
          g.fill();

          g.strokeStyle = 'rgba(71, 85, 105, 0.45)';
          g.lineWidth = 0.8;
          g.stroke();

          const numFontSize = Math.max(isThreeDigits ? 7.5 : 8.5, Math.round(numH * (isThreeDigits ? 0.64 : 0.72)));
          g.font = `bold ${numFontSize}px system-ui, -apple-system, sans-serif`;
          g.fillStyle = '#0F172A';
          g.fillText(helperNum, nx + numW / 2, ny + numH / 2 + 0.5);
        }
      }

      g.restore();
    }

    // Pré-aquece os sprites 3D completos em GPU (Livre e Bloqueada, Z=0) para zero lag no primeiro toque
    for (let i = 0; i < animals.length; i++) {
      this.getOrGenerateTileSprite(animals[i], true, 0);
      this.getOrGenerateTileSprite(animals[i], false, 0);
    }
  }

  public bakeAnimalSlot(animal: AnimalValue): AtlasUV | null {
    if (!this.masterAtlas) {
      this.initMasterAtlas();
    }
    const cached = this.atlasCoords.get(animal);
    if (cached) return cached;
    this.prewarmTiles([animal]);
    return this.atlasCoords.get(animal) || null;
  }

  public buildMasterAtlas(): HTMLCanvasElement {
    this.initMasterAtlas();
    const allAnimals = TileRegistry.getAll().map((t) => t.value);
    this.prewarmTiles(allAnimals);
    return this.masterAtlas!;
  }

  public getAtlasUV(animal: AnimalValue): AtlasUV | null {
    if (!this.masterAtlas) {
      this.initMasterAtlas();
    }
    const cached = this.atlasCoords.get(animal);
    if (cached) return cached;
    this.prewarmTiles([animal]);
    return this.atlasCoords.get(animal) || null;
  }

  private getDimmedColor(hex: string): string {
    let cached = this.desaturateCache.get(hex);
    if (!cached) {
      cached = this.darkenAndDesaturate(hex, 0.28, 0.45);
      this.desaturateCache.set(hex, cached);
    }
    return cached;
  }

  private darkenAndDesaturate(hex: string, darkenFactor: number, desaturateFactor: number): string {
    let r = 255, g = 255, b = 255;
    if (hex.startsWith('#')) {
      r = parseInt(hex.slice(1, 3), 16);
      g = parseInt(hex.slice(3, 5), 16);
      b = parseInt(hex.slice(5, 7), 16);
    }
    const gray = Math.round(r * 0.299 + g * 0.587 + b * 0.114);
    const nr = Math.round(r + (gray - r) * desaturateFactor);
    const ng = Math.round(g + (gray - g) * desaturateFactor);
    const nb = Math.round(b + (gray - b) * desaturateFactor);
    const finalR = Math.max(0, Math.round(nr * (1 - darkenFactor)));
    const finalG = Math.max(0, Math.round(ng * (1 - darkenFactor)));
    const finalB = Math.max(0, Math.round(nb * (1 - darkenFactor)));
    return `rgb(${finalR},${finalG},${finalB})`;
  }

  // =========================================================================
  // CACHE DE CORPO 3D + FACE DAS PEÇAS (HARDWARE BLIT VIA GPU)
  // =========================================================================

  public getOrGenerateTileSprite(
    animal: AnimalValue,
    isFree: boolean,
    z: number
  ): HTMLCanvasElement {
    const zClamped = Math.min(Math.max(0, z), 2);
    const key = `${animal}_${isFree ? '1' : '0'}_${zClamped}_${this.dims.tileWidth}_${this.dims.tileHeight}_${this.showHelperNumbers}_${this.dimBlockedTiles}`;
    let cached = this.tileSpriteCache.get(key);
    if (cached) return cached;

    const { tileWidth, tileHeight, tileDepth } = this.dims;
    const inset = 2;
    const faceW = tileWidth - inset * 2;
    const faceH = tileHeight - inset * 2;
    const dX = Math.round(tileDepth * 0.65);
    const dY = Math.round(tileDepth * 0.65);
    const pad = 1;
    const spriteLogicalW = faceW + dX + pad;
    const spriteLogicalH = faceH + dY + pad;

    const off = document.createElement('canvas');
    off.width = Math.ceil(spriteLogicalW * this.dpr);
    off.height = Math.ceil(spriteLogicalH * this.dpr);
    const g = off.getContext('2d');
    if (!g) return off;

    g.scale(this.dpr, this.dpr);

    const x = 0;
    const y = 0;

    // --- FACE LATERAL DIREITA ---
    const ivorySplitY = y + Math.round(faceH * 0.62);

    // Topo de Marfim da lateral direita
    g.fillStyle = isFree || !this.dimBlockedTiles ? '#EAE2D2' : '#B8B0A2';
    g.beginPath();
    g.moveTo(x + faceW, y + 6);
    g.lineTo(x + faceW + dX, y + 6 + dY);
    g.lineTo(x + faceW + dX, ivorySplitY + dY);
    g.lineTo(x + faceW, ivorySplitY);
    g.closePath();
    g.fill();

    // Fundo de Jade da lateral direita (base clássica de Mahjong)
    g.fillStyle = isFree || !this.dimBlockedTiles ? '#09534C' : '#05332E';
    g.beginPath();
    g.moveTo(x + faceW, ivorySplitY);
    g.lineTo(x + faceW + dX, ivorySplitY + dY);
    g.lineTo(x + faceW + dX, y + faceH + dY - 4);
    g.lineTo(x + faceW, y + faceH);
    g.closePath();
    g.fill();

    // Filete de separação entre marfim e jade
    g.strokeStyle = 'rgba(0, 0, 0, 0.18)';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(x + faceW, ivorySplitY);
    g.lineTo(x + faceW + dX, ivorySplitY + dY);
    g.stroke();

    // --- FACE LATERAL INFERIOR ---
    const ivoryBottomH = dY * 0.62;

    // Seção Marfim inferior
    g.fillStyle = isFree || !this.dimBlockedTiles ? '#D0C5B4' : '#9E9484';
    g.beginPath();
    g.moveTo(x + 6, y + faceH);
    g.lineTo(x + 6 + dX * 0.62, y + faceH + ivoryBottomH);
    g.lineTo(x + faceW + dX * 0.62, y + faceH + ivoryBottomH);
    g.lineTo(x + faceW, y + faceH);
    g.closePath();
    g.fill();

    // Seção Jade inferior
    g.fillStyle = isFree || !this.dimBlockedTiles ? '#033B34' : '#02241F';
    g.beginPath();
    g.moveTo(x + 6 + dX * 0.62, y + faceH + ivoryBottomH);
    g.lineTo(x + 6 + dX, y + faceH + dY);
    g.lineTo(x + faceW + dX, y + faceH + dY);
    g.lineTo(x + faceW + dX * 0.62, y + faceH + ivoryBottomH);
    g.closePath();
    g.fill();

    // Contorno da lateral 3D
    g.strokeStyle = isFree || !this.dimBlockedTiles ? 'rgba(15, 23, 42, 0.35)' : 'rgba(15, 23, 42, 0.55)';
    g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(x + faceW, y + 6);
    g.lineTo(x + faceW + dX, y + 6 + dY);
    g.lineTo(x + faceW + dX, y + faceH + dY);
    g.lineTo(x + 6 + dX, y + faceH + dY);
    g.lineTo(x + 6, y + faceH);
    g.stroke();

    // 3. FACE PRINCIPAL DA PEDRA
    const palette = TileRegistry.getPalette(animal);
    let bgColor = isFree || !this.dimBlockedTiles ? palette.bg : this.getDimmedColor(palette.bg);

    if (zClamped === 1 && isFree) {
      bgColor = this.lighten(bgColor, 0.05);
    } else if (zClamped >= 2 && isFree) {
      bgColor = this.lighten(bgColor, 0.10);
    }

    g.fillStyle = bgColor;
    this.drawRoundedRect(g, x, y, faceW, faceH, 8);
    g.fill();

    // 4. CHANFRO TÁTIL 3D (SPECULAR BEVEL HIGHLIGHT)
    if (isFree || !this.dimBlockedTiles) {
      g.strokeStyle = zClamped >= 1 ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.78)';
    } else {
      g.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    }
    g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(x + 7, y + 1.2);
    g.lineTo(x + faceW - 7, y + 1.2);
    g.moveTo(x + 1.2, y + 7);
    g.lineTo(x + 1.2, y + faceH - 7);
    g.stroke();

    // Borda inferior e direita interna com sombra de chanfro
    g.strokeStyle = 'rgba(71, 85, 105, 0.22)';
    g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(x + faceW - 1.2, y + 7);
    g.lineTo(x + faceW - 1.2, y + faceH - 7);
    g.moveTo(x + 7, y + faceH - 1.2);
    g.lineTo(x + faceW - 7, y + faceH - 1.2);
    g.stroke();

    // 5. MOLDURA E CONTORNO EXTERNO
    const syn = SYNERGY_FAMILIES[animal];
    if (syn) {
      if (syn.borderColor === 'rainbow') {
        if (isFree || !this.dimBlockedTiles) {
          const grad = g.createLinearGradient(x, y, x + faceW, y + faceH);
          grad.addColorStop(0, '#FFD700');
          grad.addColorStop(0.33, '#00E676');
          grad.addColorStop(0.66, '#00B0FF');
          grad.addColorStop(1, '#E040FB');
          g.lineWidth = 2.6;
          g.strokeStyle = grad;
        } else {
          g.lineWidth = 1.6;
          g.strokeStyle = 'rgba(100, 116, 139, 0.70)';
        }
      } else {
        g.lineWidth = isFree ? 2.4 : 1.6;
        g.strokeStyle = isFree ? syn.borderColor : (this.dimBlockedTiles ? 'rgba(100, 116, 139, 0.65)' : syn.borderColor);
      }
      this.drawRoundedRect(g, x, y, faceW, faceH, 8);
      g.stroke();
    } else {
      g.lineWidth = isFree ? 1.4 : 1.2;
      g.strokeStyle = isFree ? 'rgba(71, 85, 105, 0.65)' : (this.dimBlockedTiles ? 'rgba(100, 116, 139, 0.55)' : 'rgba(71, 85, 105, 0.65)');
      this.drawRoundedRect(g, x, y, faceW, faceH, 8);
      g.stroke();
    }

    // 6. GLIFO DO ANIMAL, BADGE E NÚMERO (DO MASTER ATLAS)
    const uv = this.getAtlasUV(animal);
    if (uv && this.masterAtlas) {
      g.drawImage(this.masterAtlas, uv.sx, uv.sy, uv.sw, uv.sh, x, y, faceW, faceH);
    } else {
      this.drawAnimalGlyph(g, animal, faceW, faceH, x, y);
    }

    // 7. ESCURECIMENTO TÁTIL DE PEÇAS BLOQUEADAS (JÁ PRÉ-ASSADO)
    if (!isFree && this.dimBlockedTiles) {
      g.fillStyle = 'rgba(15, 23, 42, 0.35)';
      this.drawRoundedRect(g, x, y, faceW, faceH, 8);
      g.fill();
    }

    this.tileSpriteCache.set(key, off);
    return off;
  }

  // =========================================================================
  // MAIN DRAW ENTRY POINT (ULTRA-OTIMIZADO - GPU HARDWARE BLIT)
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

    const needsTransform = scaleXFactor !== 1 || alpha < 1;
    if (needsTransform) {
      ctx.save();
      if (alpha < 1) {
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      }
      if (scaleXFactor !== 1) {
        ctx.translate(x + faceW / 2, y + faceH / 2);
        ctx.scale(scaleXFactor, 1);
        ctx.translate(-(x + faceW / 2), -(y + faceH / 2));
      }
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

    // 2. HARDWARE TEXTURE BLIT DO CORPO 3D + FACE DA PEDRA (ASSADO EM GPU)
    const animal = tile.value as AnimalValue;
    const tileSprite = this.getOrGenerateTileSprite(animal, isFree, z);
    const dX = Math.round(tileDepth * 0.65);
    const dY = Math.round(tileDepth * 0.65);
    const spriteLogicalW = faceW + dX + 1;
    const spriteLogicalH = faceH + dY + 1;
    ctx.drawImage(tileSprite, x, y, spriteLogicalW, spriteLogicalH);

    // 3. SELECIONADA — BORDA DOURADA BRILHANTE COM CONTORNO NÍTIDO
    if (tile.isSelected) {
      const pulse = animTime > 0 ? Math.sin(animTime / 180) * 0.8 : 0;
      ctx.lineWidth = 3.8 + Math.max(0, pulse);
      ctx.strokeStyle = '#F59E0B';
      this.drawRoundedRect(ctx, x - 1, y - 1, faceW + 2, faceH + 2, 9);
      ctx.stroke();
      ctx.lineWidth = 1.4 + Math.max(0, pulse * 0.5);
      ctx.strokeStyle = `rgba(255, 215, 0, ${0.45 + Math.max(0, pulse * 0.15)})`;
      this.drawRoundedRect(ctx, x - 3, y - 3, faceW + 6, faceH + 6, 11);
      ctx.stroke();
    }

    // 4. DICA — AURA ESMERALDA PULSANTE
    if (tile.isHinted) {
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = '#10B981';
      this.drawRoundedRect(ctx, x - 2, y - 2, faceW + 4, faceH + 4, 10);
      ctx.stroke();
    }

    // 5. CAMADAS E OVERLAYS ESPECIAIS (Gelo, Cipó, Rocha, Casulo, Baú, Espelho)
    this.drawSpecialOverlay(ctx, tile, x, y, faceW, faceH, isFree);

    if (needsTransform) {
      ctx.restore();
    }
  }

  public getOrGenerateTileFace(tile: PlacedTile): HTMLCanvasElement {
    const key = `${tile.value}_${this.dims.tileWidth}_${this.dims.tileHeight}_${this.showHelperNumbers}`;
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
      const badgeSize = Math.max(11, Math.round(cw * 0.28));
      const bx = cw - Math.round(cw * 0.18);
      const by = Math.round(ch * 0.18);

      g.save();
      g.font = `${badgeSize}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", "Android Emoji", sans-serif`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(syn.badge, bx, by);
      g.restore();
    }

    if (this.showHelperNumbers) {
      const helperNum = TileRegistry.getHelperIndex(tile.value as AnimalValue);
      if (helperNum !== undefined) {
        const isThreeDigits = helperNum.length >= 3;
        const numH = Math.max(12, Math.round(ch * 0.16));
        const numW = Math.max(isThreeDigits ? 19 : 14, Math.round(cw * (isThreeDigits ? 0.30 : 0.22)));
        const nx = 3.5;
        const ny = ch - numH - 3.5;

        g.save();
        g.fillStyle = 'rgba(255, 255, 255, 0.94)';
        this.drawRoundedRect(g, nx, ny, numW, numH, 3.5);
        g.fill();

        g.strokeStyle = 'rgba(71, 85, 105, 0.45)';
        g.lineWidth = 0.8;
        g.stroke();

        const numFontSize = Math.max(isThreeDigits ? 7.5 : 8.5, Math.round(numH * (isThreeDigits ? 0.64 : 0.72)));
        g.font = `bold ${numFontSize}px system-ui, -apple-system, sans-serif`;
        g.fillStyle = '#0F172A';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(helperNum, nx + numW / 2, ny + numH / 2 + 0.5);
        g.restore();
      }
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
    const emoji = TileRegistry.getEmoji(animal);
    const cx = offsetX + cw / 2;
    const cy = offsetY + ch * 0.49;
    const fontSize = Math.max(14, Math.round(cw * 0.70));

    if (this.cachedGlyphFontSize !== fontSize || !this.cachedGlyphFont) {
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

  /**
   * Renderiza um card completo de peça com alta resolução e proporções perfeitamente calibradas
   * para os slots da bandeja (Tray) e flyers de animação, independente do zoom do tabuleiro da fase.
   */
  public renderTrayCard(
    canvas: HTMLCanvasElement,
    tile: PlacedTile,
    w: number = 62,
    h: number = 82
  ): void {
    const dpr = this.dpr;
    const targetW = Math.round(w * dpr);
    const targetH = Math.round(h * dpr);

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, targetW, targetH);
    ctx.scale(dpr, dpr);

    const pad = 1.5;
    const cardW = w - pad * 2;
    const cardH = h - pad * 2;

    // 1. Corpo / Fundo da Peça de Marfim Suave
    ctx.fillStyle = '#FFFFFF';
    this.drawRoundedRect(ctx, pad, pad, cardW, cardH, 7);
    ctx.fill();

    // 2. Borda Temática de Sinergia (ou contorno nítido suave)
    const syn = SYNERGY_FAMILIES[tile.value as AnimalValue];
    if (syn) {
      if (syn.borderColor === 'rainbow') {
        const grad = ctx.createLinearGradient(pad, pad, cardW, cardH);
        grad.addColorStop(0, '#FFD700');
        grad.addColorStop(0.33, '#00E676');
        grad.addColorStop(0.66, '#00B0FF');
        grad.addColorStop(1, '#E040FB');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2.4;
      } else {
        ctx.strokeStyle = syn.borderColor;
        ctx.lineWidth = 2.4;
      }
    } else {
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 1.2;
    }
    this.drawRoundedRect(ctx, pad, pad, cardW, cardH, 7);
    ctx.stroke();

    // 3. Glifo Central do Animal (Grande, Nítido e Proeminente para Idosos)
    const cw = cardW - 2;
    const ch = cardH - 2;
    const glyphFontSize = Math.round(cw * 0.70); // ~39px para slot 62px
    ctx.save();
    ctx.font = `${glyphFontSize}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", "Android Emoji", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const emoji = TileRegistry.getEmoji(tile.value as AnimalValue);
    ctx.fillText(emoji, pad + 1 + cw / 2, pad + 1 + ch * 0.49);
    ctx.restore();

    // 4. Micro-badge de Sinergia no Canto Superior Direito
    if (syn && syn.badge) {
      const badgeSize = Math.max(12, Math.round(cw * 0.28));
      const bx = pad + 1 + cw - Math.round(cw * 0.16);
      const by = pad + 1 + Math.round(ch * 0.16);

      ctx.save();
      ctx.font = `${badgeSize}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", "Android Emoji", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(syn.badge, bx, by);
      ctx.restore();
    }

    // 5. Chip de Numeral Arábico de Acessibilidade no Canto Inferior Esquerdo
    if (this.showHelperNumbers) {
      const helperNum = TileRegistry.getHelperIndex(tile.value as AnimalValue);
      if (helperNum !== undefined) {
        const isThreeDigits = helperNum.length >= 3;
        const numH = Math.max(12, Math.round(ch * 0.16));
        const numW = Math.max(isThreeDigits ? 19 : 14, Math.round(cw * (isThreeDigits ? 0.30 : 0.22)));
        const nx = pad + 2.5;
        const ny = pad + 1 + ch - numH - 2.5;

        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
        this.drawRoundedRect(ctx, nx, ny, numW, numH, 3.5);
        ctx.fill();

        ctx.strokeStyle = 'rgba(71, 85, 105, 0.45)';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        const numFontSize = Math.max(isThreeDigits ? 7.5 : 8.5, Math.round(numH * (isThreeDigits ? 0.64 : 0.72)));
        ctx.font = `bold ${numFontSize}px system-ui, -apple-system, sans-serif`;
        ctx.fillStyle = '#0F172A';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(helperNum, nx + numW / 2, ny + numH / 2 + 0.5);
        ctx.restore();
      }
    }

    // 6. Overlays de Peças Especiais (se houver)
    this.drawSpecialOverlay(ctx, tile, pad, pad, cardW, cardH, true);

    ctx.restore();
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
    const hasSpecialType = tile.specialType && tile.specialType !== 'normal' && tile.specialType !== 'chameleon';
    const hasElementalSeal = !!tile.elementalSeal;
    const hasElementalKey = !!tile.elementalKey;
    const hasMist = !!tile.isMisty;

    if (!hasSpecialType && !hasElementalSeal && !hasElementalKey && !hasMist) return;

    ctx.save();
    const badgeSize = Math.max(12, Math.round(w * 0.28));
    const font = `${badgeSize}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;

    // 🌫️ Mecânica C: Névoa dos Picos (Mist & Canopy Shadow)
    if (tile.isMisty) {
      ctx.fillStyle = 'rgba(241, 245, 249, 0.90)';
      this.drawRoundedRect(ctx, x, y, w, h, 8);
      ctx.fill();

      ctx.strokeStyle = 'rgba(203, 213, 225, 0.85)';
      ctx.lineWidth = 1.6;
      this.drawRoundedRect(ctx, x, y, w, h, 8);
      ctx.stroke();

      ctx.font = `${Math.max(14, Math.round(w * 0.42))}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🌫️', x + w / 2, y + h / 2);
    }

    // 🔮 Mecânica F: Cúpula Rúnica de Selo Elemental
    if (tile.elementalSeal) {
      const sealColors: Record<string, { stroke: string; fill: string; rune: string }> = {
        fire:  { stroke: '#EF4444', fill: 'rgba(239, 68, 68, 0.28)', rune: '🔥' },
        water: { stroke: '#0EA5E9', fill: 'rgba(14, 165, 233, 0.28)', rune: '💧' },
        earth: { stroke: '#10B981', fill: 'rgba(16, 185, 129, 0.28)', rune: '🌿' },
        air:   { stroke: '#A855F7', fill: 'rgba(168, 85, 247, 0.28)', rune: '💨' },
      };
      const seal = sealColors[tile.elementalSeal] || sealColors.fire;

      ctx.fillStyle = seal.fill;
      this.drawRoundedRect(ctx, x, y, w, h, 8);
      ctx.fill();

      ctx.strokeStyle = seal.stroke;
      ctx.lineWidth = 2.2;
      this.drawRoundedRect(ctx, x, y, w, h, 8);
      ctx.stroke();

      ctx.font = font;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText(seal.rune, x + w - 3, y + 3);

      ctx.font = `${Math.max(10, Math.round(badgeSize * 0.65))}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('🔒', x + 3, y + 3);
    }

    // 🗝️ Chave Mística Elemental
    if (tile.elementalKey) {
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 2.2;
      this.drawRoundedRect(ctx, x, y, w, h, 8);
      ctx.stroke();

      ctx.font = font;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText('🗝️', x + 3, y + h - 3);
    }

    if (tile.specialType && tile.specialType !== 'normal' && tile.specialType !== 'chameleon') {
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
        // Casulo dourado místico com indicador de impactos restantes
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 2.4;
        this.drawRoundedRect(ctx, x, y, w, h, 8);
        ctx.stroke();

        ctx.font = font;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.fillText('🥚', x + w - 3, y + 3);

        const hits = tile.cocoonHits ?? 2;
        if (hits === 1) {
          // Casulo trincado/rachado: desenha linhas de trinca douradas no corpo da pedra
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.9)';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(x + w * 0.45, y + h * 0.35);
          ctx.lineTo(x + w * 0.55, y + h * 0.5);
          ctx.lineTo(x + w * 0.48, y + h * 0.65);
          ctx.stroke();

          // Badge de rachadura (1/2)
          ctx.font = `bold ${Math.max(9, Math.round(badgeSize * 0.65))}px sans-serif`;
          ctx.fillStyle = '#D97706';
          ctx.textAlign = 'right';
          ctx.textBaseline = 'bottom';
          ctx.fillText('1/2', x + w - 4, y + h - 4);
        } else if (hits >= 2) {
          ctx.font = `bold ${Math.max(9, Math.round(badgeSize * 0.65))}px sans-serif`;
          ctx.fillStyle = '#B45309';
          ctx.textAlign = 'right';
          ctx.textBaseline = 'bottom';
          ctx.fillText('2/2', x + w - 4, y + h - 4);
        }
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
        ctx.strokeStyle = '#94A3B8';
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
    }
    ctx.restore();
  }

  // =========================================================================
  // UTILITÁRIOS
  // =========================================================================

  private lighten(color: string, factor: number): string {
    const key = `${color}_${factor}`;
    let cached = this.lightenCache.get(key);
    if (cached) return cached;

    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      const nr = Math.min(255, Math.round(r + (255 - r) * factor));
      const ng = Math.min(255, Math.round(g + (255 - g) * factor));
      const nb = Math.min(255, Math.round(b + (255 - b) * factor));
      cached = `rgb(${nr},${ng},${nb})`;
    } else {
      cached = color;
    }
    this.lightenCache.set(key, cached);
    return cached;
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
