import { PlacedTile } from '../core/types';
import { TileDimensions } from './TileRenderer';

export class ViewportCamera {
  public dpr: number = 1;
  public scale: number = 1;
  public offsetX: number = 0;
  public offsetY: number = 0;

  // Dimensões base da grade — ampliadas para toque confortável
  public baseTileWidth: number = 66;
  public baseTileHeight: number = 88;
  public baseTileDepth: number = 9;

  constructor() {
    this.updateDpr();
  }

  public updateDpr(): void {
    // DPR travado em no máximo 2.0 para equilibrar nitidez Retina com -55% de consumo de VRAM e GPU no Android
    this.dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2.0) : 1;
  }

  public getTileDimensions(): TileDimensions {
    return {
      tileWidth: Math.round(this.baseTileWidth * this.scale),
      tileHeight: Math.round(this.baseTileHeight * this.scale),
      tileDepth: Math.max(4, Math.round(this.baseTileDepth * this.scale)),
    };
  }

  /**
   * Calcula o melhor fator de zoom e centralização para as peças ficarem o maior possível na tela
   */
  public calculateAutoFit(viewW: number, viewH: number, activeTiles: PlacedTile[]): TileDimensions | null {
    if (activeTiles.length === 0) return null;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    let maxZ = 0;

    activeTiles.forEach((t) => {
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
    // Em retrato, o topo acomoda o HUD superior + Bandeja sub-hud + Pílula flutuante Trinca (122px)
    // A base acomoda a barra inferior de ações e badges (~89px + 15px respiro seguro = 104px)
    const topMargin = isPortrait ? 122 : 54;
    const bottomMargin = isPortrait ? 104 : 64;
    const sideMargin = isPortrait ? 10 : 64;

    const availW = Math.max(100, viewW - sideMargin * 2);
    const availH = Math.max(100, viewH - topMargin - bottomMargin);

    const scaleX = availW / (gridCols * this.baseTileWidth + maxZ * this.baseTileDepth);
    const scaleY = availH / (gridRows * this.baseTileHeight + maxZ * this.baseTileDepth);

    // Zoom ideal ampliado com as novas margens compactas
    this.scale = Math.min(scaleX, scaleY, isPortrait ? 2.8 : 1.8);

    const dims = this.getTileDimensions();

    const totalBoardW = gridCols * dims.tileWidth;
    const totalBoardH = gridRows * dims.tileHeight;

    this.offsetX = Math.round((viewW - totalBoardW) / 2 - (minX / 2) * dims.tileWidth);
    this.offsetY = Math.round(topMargin + (availH - totalBoardH) / 2 - (minY / 2) * dims.tileHeight);

    return dims;
  }

  public getTileScreenCoords(tile: PlacedTile): { x: number; y: number; width: number; height: number } {
    const { tileWidth, tileHeight, tileDepth } = this.getTileDimensions();

    const zShiftX = tile.position.z * Math.round(tileDepth * 0.55);
    const zShiftY = tile.position.z * Math.round(tileDepth * 1.10);
    const x = this.offsetX + (tile.position.x / 2) * tileWidth - zShiftX;
    const y = this.offsetY + (tile.position.y / 2) * tileHeight - zShiftY + (tile.isSelected ? -8 : 0);
    return { x, y, width: tileWidth, height: tileHeight };
  }

  public getTileViewportCoords(
    tile: PlacedTile,
    rect: DOMRect,
    canvasLogicalWidth: number,
    canvasLogicalHeight: number
  ): { left: number; top: number; width: number; height: number } {
    const coords = this.getTileScreenCoords(tile);
    const scaleX = rect.width / canvasLogicalWidth;
    const scaleY = rect.height / canvasLogicalHeight;
    return {
      left: rect.left + coords.x * scaleX,
      top: rect.top + coords.y * scaleY,
      width: coords.width * scaleX,
      height: coords.height * scaleY,
    };
  }

  public getTileAtScreenPos(
    px: number,
    py: number,
    activeTiles: PlacedTile[]
  ): { tile: PlacedTile; sx: number; sy: number } | null {
    const { tileWidth, tileHeight, tileDepth } = this.getTileDimensions();
    const len = activeTiles.length;
    let bestHit: { tile: PlacedTile; sx: number; sy: number } | null = null;
    let maxZ = -Infinity;

    // Itera de trás para frente no array pré-ordenado por Z sem alocar arrays nem disparar GC
    for (let i = len - 1; i >= 0; i--) {
      const tile = activeTiles[i];
      if (bestHit && tile.position.z < maxZ) {
        break;
      }

      const zShiftX = tile.position.z * Math.round(tileDepth * 0.55);
      const zShiftY = tile.position.z * Math.round(tileDepth * 1.10);
      const sx = this.offsetX + (tile.position.x / 2) * tileWidth - zShiftX;
      const sy = this.offsetY + (tile.position.y / 2) * tileHeight - zShiftY + (tile.isSelected ? -8 : 0);

      if (
        px >= sx &&
        px <= sx + tileWidth &&
        py >= sy &&
        py <= sy + tileHeight
      ) {
        if (tile.position.z > maxZ) {
          maxZ = tile.position.z;
          bestHit = { tile, sx, sy };
        }
      }
    }
    return bestHit;
  }
}
