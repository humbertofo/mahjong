import { PlacedTile, ClimateEffectResult, TileMutationRecord, MatchPair } from '../../../types';
import { SpecialTileRules } from '../../specialTiles/SpecialTileRules';

export class HeatWave {
  public static evaluate(
    biome: string,
    recentBiomeMatches: string[],
    getActiveBoardTiles: () => PlacedTile[],
    getHintPair: () => MatchPair | null
  ): ClimateEffectResult | null {
    if (biome === 'savanna' && recentBiomeMatches.filter((b) => b === 'savanna').length >= 2) {
      const hint = getHintPair();
      let mutations: TileMutationRecord[] | undefined;
      if (hint) {
        const p1 = getActiveBoardTiles().find((t) => t.id === hint.tile1Id);
        const p2 = getActiveBoardTiles().find((t) => t.id === hint.tile2Id);
        if (p1 && p2) {
          mutations = [
            { tile: p1, prevValue: p1.value, prevLabel: p1.label, prevSuit: p1.suit },
            { tile: p2, prevValue: p2.value, prevLabel: p2.label, prevSuit: p2.suit },
          ];
          p1.value = 'chameleon';
          p1.label = '🦎 Camaleão';
          p2.value = 'chameleon';
          p2.label = '🦎 Camaleão';
        }
      }

      const active = getActiveBoardTiles();
      const thawedCount = SpecialTileRules.thawIceTiles(active);

      return {
        climate: 'heat_wave',
        icon: '☀️',
        title: 'Onda de Calor Solar!',
        description: thawedCount > 0
          ? 'O calor da savana derreteu o gelo e transformou um par em Camaleões!'
          : 'O calor da savana transformou um par em Camaleões Coringa!',
        mutations,
      };
    }

    return null;
  }
}
