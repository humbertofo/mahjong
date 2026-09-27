import { PlacedTile } from '../types';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  MOTOR DE REGRAS ESPACIAIS 2.5D (LIBERDADE DE PEÇAS & SOBREPOSIÇÕES Z)
 *  Calcula em O(N) com early-exit a liberdade lateral e superior das pedras
 * ═══════════════════════════════════════════════════════════════════════════
 */
export class TileRuleEngine {
  /**
   * Retorna o conjunto de IDs de todas as peças livres para interação.
   */
  public static computeFreeTileIds(activeTiles: PlacedTile[]): Set<string> {
    const freeSet = new Set<string>();
    const n = activeTiles.length;

    for (let i = 0; i < n; i++) {
      const tile = activeTiles[i];
      let hasTileAbove = false;

      // 1. Checar se existe peça acima cobrindo
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const other = activeTiles[j];
        if (other.position.z > tile.position.z) {
          if (
            Math.abs(other.position.x - tile.position.x) < 2 &&
            Math.abs(other.position.y - tile.position.y) < 2
          ) {
            hasTileAbove = true;
            break; // Já coberta por cima, não está livre!
          }
        }
      }

      if (hasTileAbove) {
        continue;
      }

      // 2. Checar bloqueio lateral no mesmo nível Z
      let hasLeftNeighbor = false;
      let hasRightNeighbor = false;

      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const other = activeTiles[j];
        if (other.position.z !== tile.position.z) continue;

        if (Math.abs(other.position.y - tile.position.y) < 2) {
          if (other.position.x < tile.position.x && (tile.position.x - other.position.x) <= 2) {
            hasLeftNeighbor = true;
          } else if (other.position.x > tile.position.x && (other.position.x - tile.position.x) <= 2) {
            hasRightNeighbor = true;
          }

          if (hasLeftNeighbor && hasRightNeighbor) {
            break; // Bloqueada em ambos os lados!
          }
        }
      }

      // Se for rocha ancestral, só é liberada se ambos os lados estiverem desimpedidos
      if (tile.specialType === 'rock' && (hasLeftNeighbor || hasRightNeighbor)) {
        continue;
      }

      if (!hasLeftNeighbor || !hasRightNeighbor) {
        freeSet.add(tile.id);
      }
    }

    return freeSet;
  }

  public static isTileFree(tile: PlacedTile, freeTileIds: Set<string>): boolean {
    if (tile.isRemoved || tile.inTray) return false;
    return freeTileIds.has(tile.id);
  }

  public static getFreeTiles(activeTiles: PlacedTile[], freeTileIds: Set<string>): PlacedTile[] {
    return activeTiles.filter((t) => freeTileIds.has(t.id));
  }
}
