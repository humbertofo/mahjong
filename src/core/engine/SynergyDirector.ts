import {
  PlacedTile,
  SynergyResult,
  ClimateEffectResult,
  TileBiome,
  TileMutationRecord,
  MatchPair,
} from '../types';
import { ANIMAL_BIOMES, getBiomeForAnimal } from '../nature/biomes';
import { SpecialTileRules } from '../nature/specialTiles/SpecialTileRules';
import { SynergyRegistry } from '../nature/synergies/SynergyRegistry';
import { ClimateEvaluator } from '../nature/climates/ClimateEvaluator';

// Reexportação para total retrocompatibilidade
export { ANIMAL_BIOMES, getBiomeForAnimal };

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  FACHADA DO SUBSISTEMA DA NATUREZA (SYNERGY DIRECTOR FACADE)
 *  Delega para os submódulos especializados em src/core/nature/:
 *  - biomes.ts (habitats e fauna)
 *  - SpecialTileRules.ts (peças especiais e mutações)
 *  - SynergyRegistry.ts (registro declarativo de sinergias)
 *  - ClimateEvaluator.ts (orquestração dos 7 climas atmosféricos)
 * ═══════════════════════════════════════════════════════════════════════════
 */
export class SynergyDirector {
  public static resolveChameleonMirror(
    m1: PlacedTile,
    m2: PlacedTile,
    allTiles: PlacedTile[],
    onInvalidateCache: () => void
  ): TileMutationRecord | null {
    return SpecialTileRules.resolveChameleonMirror(m1, m2, allTiles, onInvalidateCache);
  }

  public static evaluateSynergy(
    t1: PlacedTile,
    t2: PlacedTile,
    getActiveBoardTiles: () => PlacedTile[],
    onShuffleRemaining: () => void,
    tray: PlacedTile[] = []
  ): SynergyResult | null {
    return SynergyRegistry.evaluate(t1, t2, getActiveBoardTiles, onShuffleRemaining, tray);
  }

  public static isTheatrical(synergy: SynergyResult | null | undefined): boolean {
    return SynergyRegistry.isTheatrical(synergy);
  }

  public static evaluateClimate(
    t1: PlacedTile,
    recentBiomeMatches: TileBiome[],
    tray: PlacedTile[],
    streak: number,
    getActiveBoardTiles: () => PlacedTile[],
    getHintPair: () => MatchPair | null,
    getFreeTiles: () => PlacedTile[],
    onAddHarmony: (pts: number) => void
  ): ClimateEffectResult | null {
    return ClimateEvaluator.evaluate(
      t1,
      recentBiomeMatches,
      tray,
      streak,
      getActiveBoardTiles,
      getHintPair,
      getFreeTiles,
      onAddHarmony
    );
  }
}
