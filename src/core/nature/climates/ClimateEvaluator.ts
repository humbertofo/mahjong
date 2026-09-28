import { PlacedTile, ClimateEffectResult, TileBiome, MatchPair } from '../../types';
import { getBiomeForAnimal } from '../biomes';
import { OceanSurge } from './effects/OceanSurge';
import { HeatWave } from './effects/HeatWave';
import { ArcticBlizzard } from './effects/ArcticBlizzard';
import { AtmosphericGales } from './effects/AtmosphericGales';

export class ClimateEvaluator {
  /**
   * Avalia a invocação de Climas da Natureza.
   * Climas Elementares disparam EXCLUSIVAMENTE via Trinca Sagrada (isTrinca = true),
   * garantindo intencionalidade, raridade épica e eliminando ativações acidentais.
   */
  public static evaluate(
    t1: PlacedTile,
    _recentBiomeMatches: TileBiome[],
    tray: PlacedTile[],
    streak: number,
    getActiveBoardTiles: () => PlacedTile[],
    getHintPair: () => MatchPair | null,
    getFreeTiles: () => PlacedTile[],
    onAddHarmony: (pts: number) => void,
    isTrinca: boolean = false
  ): ClimateEffectResult | null {
    if (isTrinca) {
      const biome = getBiomeForAnimal(t1.value);
      if (biome === 'water') {
        return OceanSurge.execute(tray, getActiveBoardTiles, getHintPair);
      }
      if (biome === 'savanna') {
        return HeatWave.execute(getActiveBoardTiles, getHintPair);
      }
      if (biome === 'arctic') {
        return ArcticBlizzard.execute(getActiveBoardTiles, getHintPair);
      }
      if (biome === 'forest') {
        return AtmosphericGales.executeAutumn(getActiveBoardTiles);
      }
      if (biome === 'garden') {
        return AtmosphericGales.executeSpring(getActiveBoardTiles, onAddHarmony);
      }
      // Seres Místicos / Mythic
      return AtmosphericGales.executeZenStorm();
    }

    // Noite de Lua Cheia: disparada apenas em sequências altas de maestria zen (streak >= 6)
    const fullMoon = AtmosphericGales.evaluateFullMoon(streak, getFreeTiles);
    if (fullMoon) return fullMoon;

    return null;
  }
}
