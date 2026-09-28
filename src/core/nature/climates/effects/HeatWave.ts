import { PlacedTile, ClimateEffectResult, MatchPair } from '../../../types';
import { SpecialTileRules } from '../../specialTiles/SpecialTileRules';

export class HeatWave {
  /**
   * Executa a Onda de Calor Solar da Savana:
   * - Derrete todas as pedras de gelo presentes no tabuleiro
   * - Recarrega +1 Marreta 🔨 garantida (sem RNG)
   */
  public static execute(
    getActiveBoardTiles: () => PlacedTile[],
    _getHintPair: () => MatchPair | null
  ): ClimateEffectResult {
    const active = getActiveBoardTiles();
    const thawedCount = SpecialTileRules.thawIceTiles(active);

    return {
      climate: 'heat_wave',
      icon: '☀️',
      title: 'Onda de Calor Solar!',
      description: thawedCount > 0
        ? `A Trinca da Savana invocou o Sol Radiante! O calor derreteu ${thawedCount} pedra(s) de gelo e restaurou +1 Marreta 🔨!`
        : 'A Trinca da Savana invocou o Sol Radiante! A energia solar purificou o tabuleiro e restaurou +1 Marreta 🔨!',
      rechargedTool: 'hammer',
    };
  }

  public static evaluate(
    biome: string,
    _recentBiomeMatches: string[],
    getActiveBoardTiles: () => PlacedTile[],
    getHintPair: () => MatchPair | null,
    isTrinca: boolean = false
  ): ClimateEffectResult | null {
    if (!isTrinca || biome !== 'savanna') return null;
    return this.execute(getActiveBoardTiles, getHintPair);
  }
}
