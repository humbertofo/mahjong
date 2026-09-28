import { PlacedTile, ClimateEffectResult, MatchPair } from '../../../types';
import { canMatch } from '../../../deck';

export class OceanSurge {
  /**
   * Executa a Maré Alta Purificadora:
   * - Lava peças presas na bandeja casando com parceiros livres na mesa
   * - Colhe um par livre de hint com 100% de garantia (sem RNG)
   * - Concede +1 Dica 💡
   */
  public static execute(
    tray: PlacedTile[],
    getActiveBoardTiles: () => PlacedTile[],
    getHintPair: () => MatchPair | null
  ): ClimateEffectResult {
    const clearedTray: PlacedTile[] = [];
    const affectedBoardTiles: PlacedTile[] = [];
    const remainingTray: PlacedTile[] = [];
    const tilesToProcess = [...tray];
    const activeBoard = getActiveBoardTiles();

    for (const t of tilesToProcess) {
      const partner = activeBoard.find(
        (b) => !b.isRemoved && !b.inTray && canMatch(b, t)
      );
      if (partner) {
        t.isRemoved = true;
        t.inTray = false;
        partner.isRemoved = true;
        clearedTray.push(t);
        affectedBoardTiles.push(partner);
      } else {
        remainingTray.push(t);
      }
    }
    tray.length = 0;
    tray.push(...remainingTray);

    let eliminatedBoardPairs: [PlacedTile, PlacedTile] | undefined;
    const hint = getHintPair();
    if (hint) {
      const p1 = activeBoard.find((t) => t.id === hint.tile1Id);
      const p2 = activeBoard.find((t) => t.id === hint.tile2Id);
      if (p1 && p2 && p1 !== p2 && canMatch(p1, p2)) {
        p1.isRemoved = true;
        p2.isRemoved = true;
        eliminatedBoardPairs = [p1, p2];
      }
    }

    return {
      climate: 'ocean_surge',
      icon: '🌊',
      title: 'Maré Alta Purificadora!',
      description: 'A Trinca de Água invocou a Maré Alta! Ondas límpidas purificaram a mesa e colheram um par livre (+1 Dica 💡)!',
      clearedTrayTiles: clearedTray,
      affectedBoardTiles: affectedBoardTiles.length > 0 ? affectedBoardTiles : undefined,
      eliminatedBoardPairs,
      rechargedTool: 'hint',
    };
  }

  public static evaluate(
    biome: string,
    _recentBiomeMatches: string[],
    tray: PlacedTile[],
    getActiveBoardTiles: () => PlacedTile[],
    getHintPair: () => MatchPair | null,
    isTrinca: boolean = false
  ): ClimateEffectResult | null {
    if (!isTrinca || biome !== 'water') return null;
    return this.execute(tray, getActiveBoardTiles, getHintPair);
  }
}
