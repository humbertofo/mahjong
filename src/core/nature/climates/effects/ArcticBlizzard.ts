import { PlacedTile, ClimateEffectResult, MatchPair } from '../../../types';
import { canMatch } from '../../../deck';

export class ArcticBlizzard {
  public static evaluate(
    biome: string,
    recentBiomeMatches: string[],
    getActiveBoardTiles: () => PlacedTile[],
    getHintPair: () => MatchPair | null
  ): ClimateEffectResult | null {
    if (biome === 'arctic') {
      const arcticMatches = recentBiomeMatches.filter((b) => b === 'arctic').length;
      if (arcticMatches >= 2) {
        const affectedBoardTiles: PlacedTile[] = [];
        const hint = getHintPair();
        if (hint) {
          const p1 = getActiveBoardTiles().find((t) => t.id === hint.tile1Id);
          const p2 = getActiveBoardTiles().find((t) => t.id === hint.tile2Id);
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
            ? 'O sopro congelante serena o tabuleiro e colheu um par completo com pureza!'
            : 'O ar puro dos picos nevados refrescou sua mente zen (+1 Dica)!',
          affectedBoardTiles: affectedBoardTiles.length > 0 ? affectedBoardTiles : undefined,
          rechargedTool: 'hint',
        };
      }
    }
    return null;
  }
}
