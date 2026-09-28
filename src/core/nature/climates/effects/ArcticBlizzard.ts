import { PlacedTile, ClimateEffectResult, MatchPair } from '../../../types';
import { canMatch } from '../../../deck';

export class ArcticBlizzard {
  /**
   * Executa a Nevasca Ártica:
   * - O sopro congelante colhe determinísticamente um par livre do tabuleiro
   * - Recarrega +1 Dica 💡 garantida
   */
  public static execute(
    getActiveBoardTiles: () => PlacedTile[],
    getHintPair: () => MatchPair | null
  ): ClimateEffectResult {
    const affectedBoardTiles: PlacedTile[] = [];
    const hint = getHintPair();
    if (hint) {
      const activeBoard = getActiveBoardTiles();
      const p1 = activeBoard.find((t) => t.id === hint.tile1Id);
      const p2 = activeBoard.find((t) => t.id === hint.tile2Id);
      if (p1 && p2 && p1 !== p2 && canMatch(p1, p2)) {
        p1.isRemoved = true;
        p2.isRemoved = true;
        affectedBoardTiles.push(p1, p2);
      }
    }

    return {
      climate: 'arctic_blizzard',
      icon: '❄️',
      title: 'Nevasca Ártica!',
      description: affectedBoardTiles.length > 0
        ? 'A Trinca Polar invocou a Nevasca Ártica! O sopro de gelo colheu um par completo com pureza zen (+1 Dica 💡)!'
        : 'A Trinca Polar invocou o ar puro dos picos nevados e refrescou sua mente (+1 Dica 💡)!',
      affectedBoardTiles: affectedBoardTiles.length > 0 ? affectedBoardTiles : undefined,
      rechargedTool: 'hint',
    };
  }

  public static evaluate(
    biome: string,
    _recentBiomeMatches: string[],
    getActiveBoardTiles: () => PlacedTile[],
    getHintPair: () => MatchPair | null,
    isTrinca: boolean = false
  ): ClimateEffectResult | null {
    if (!isTrinca || biome !== 'arctic') return null;
    return this.execute(getActiveBoardTiles, getHintPair);
  }
}
