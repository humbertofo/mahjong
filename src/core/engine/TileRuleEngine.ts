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
    if (n === 0) return freeSet;

    // 1. Constrói o mapa de coordenadas espaciais O(1) e descobre maxZ
    let maxZ = 0;
    const coordMap = new Map<string, PlacedTile>();
    for (let i = 0; i < n; i++) {
      const t = activeTiles[i];
      coordMap.set(`${t.position.z}:${t.position.x},${t.position.y}`, t);
      if (t.position.z > maxZ) {
        maxZ = t.position.z;
      }
    }

    // 2. Avalia cada peça com verificações O(1) de vizinhança espacial
    for (let i = 0; i < n; i++) {
      const tile = activeTiles[i];
      const tx = tile.position.x;
      const ty = tile.position.y;
      const tz = tile.position.z;

      // 1. Checar se existe peça acima cobrindo (|dx| < 2 e |dy| < 2 em qualquer z > tz)
      let hasTileAbove = false;
      if (tz < maxZ) {
        for (let z = tz + 1; z <= maxZ; z++) {
          for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
              if (coordMap.has(`${z}:${tx + dx},${ty + dy}`)) {
                hasTileAbove = true;
                break;
              }
            }
            if (hasTileAbove) break;
          }
          if (hasTileAbove) break;
        }
      }

      if (hasTileAbove) {
        continue;
      }

      // 2. Checar bloqueio lateral no mesmo nível Z (|dy| < 2 e dx in [-2, -1] ou [1, 2])
      let hasLeftNeighbor = false;
      for (let dx = -2; dx <= -1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (coordMap.has(`${tz}:${tx + dx},${ty + dy}`)) {
            hasLeftNeighbor = true;
            break;
          }
        }
        if (hasLeftNeighbor) break;
      }

      let hasRightNeighbor = false;
      for (let dx = 1; dx <= 2; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (coordMap.has(`${tz}:${tx + dx},${ty + dy}`)) {
            hasRightNeighbor = true;
            break;
          }
        }
        if (hasRightNeighbor) break;
      }

      // Se for rocha ancestral, só é liberada se ambos os lados estiverem desimpedidos
      if (tile.specialType === 'rock' && (hasLeftNeighbor || hasRightNeighbor)) {
        continue;
      }

      // Se estiver enredada por vinhas da selva, não está livre para saque direto
      if (tile.specialType === 'vines') {
        continue;
      }

      // Se estiver protegida por Selo Elemental (Mecânica F), fica bloqueada até o par chave ser quebrado
      if (tile.elementalSeal) {
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
