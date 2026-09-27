import { PlacedTile, ClimateEffectResult, TileBiome, MatchPair } from '../../types';
import { getBiomeForAnimal } from '../biomes';
import { OceanSurge } from './effects/OceanSurge';
import { HeatWave } from './effects/HeatWave';
import { ArcticBlizzard } from './effects/ArcticBlizzard';
import { AtmosphericGales } from './effects/AtmosphericGales';

export class ClimateEvaluator {
  public static evaluate(
    t1: PlacedTile,
    recentBiomeMatches: TileBiome[],
    tray: PlacedTile[],
    streak: number,
    getActiveBoardTiles: () => PlacedTile[],
    getHintPair: () => MatchPair | null,
    getFreeTiles: () => PlacedTile[],
    onAddHarmony: (pts: number) => void
  ): ClimateEffectResult | null {
    const biome = getBiomeForAnimal(t1.value);

    // 1. MARÉ ALTA PURIFICADORA 🌊 (Prioridade máxima de alívio ergonômico de bandeja)
    const ocean = OceanSurge.evaluate(biome, recentBiomeMatches, tray, getActiveBoardTiles, getHintPair);
    if (ocean) return ocean;

    // 2. ONDA DE CALOR ☀️
    const heat = HeatWave.evaluate(biome, recentBiomeMatches, getActiveBoardTiles, getHintPair);
    if (heat) return heat;

    // 3. NEVASCA ÁRTICA ❄️
    const arctic = ArcticBlizzard.evaluate(biome, recentBiomeMatches, getActiveBoardTiles, getHintPair);
    if (arctic) return arctic;

    // 4. OUTONO DOURADO 🍂
    const autumn = AtmosphericGales.evaluateAutumn(biome, t1.value, recentBiomeMatches, getActiveBoardTiles);
    if (autumn) return autumn;

    // 5. BRISA DA PRIMAVERA 🌸
    const spring = AtmosphericGales.evaluateSpring(biome, t1.value, recentBiomeMatches, getActiveBoardTiles, onAddHarmony);
    if (spring) return spring;

    // 6. NOITE DE LUA CHEIA 🌕
    const fullMoon = AtmosphericGales.evaluateFullMoon(streak, getFreeTiles);
    if (fullMoon) return fullMoon;

    // 7. TEMPESTADE ZEN 🌧️
    const storm = AtmosphericGales.evaluateZenStorm(streak);
    if (storm) return storm;

    return null;
  }
}
