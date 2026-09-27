import { PlacedTile, ClimateEffectResult } from '../../../types';
import { SpecialTileRules } from '../../specialTiles/SpecialTileRules';

export class AtmosphericGales {
  public static evaluateAutumn(
    biome: string,
    val: string,
    recentBiomeMatches: string[],
    getActiveBoardTiles: () => PlacedTile[]
  ): ClimateEffectResult | null {
    const forestGardenCount = recentBiomeMatches.filter((b) => b === 'forest' || b === 'garden').length;
    if ((biome === 'forest' || val === 'acorn' || val === 'apple' || val === 'hedgehog') && forestGardenCount >= 2) {
      const active = getActiveBoardTiles();
      const cutCount = SpecialTileRules.cutVineTiles(active);

      return {
        climate: 'autumn_gale',
        icon: '🍂',
        title: 'Outono Dourado!',
        description: cutCount > 0
          ? 'O vendaval cortou todas as vinhas e restaurou +1 Misturar 🔀!'
          : 'Folhas douradas rodopiam pelo bosque e restauram +1 Misturar 🔀!',
        rechargedTool: 'shuffle',
      };
    }
    return null;
  }

  public static evaluateSpring(
    biome: string,
    val: string,
    recentBiomeMatches: string[],
    getActiveBoardTiles: () => PlacedTile[],
    onAddHarmony: (pts: number) => void
  ): ClimateEffectResult | null {
    const gardenCount = recentBiomeMatches.filter((b) => b === 'garden').length;
    if ((biome === 'garden' || val === 'butterfly' || val === 'bee' || val === 'ladybug') && gardenCount >= 2) {
      const active = getActiveBoardTiles();
      const hatchedCount = SpecialTileRules.hatchCocoonTiles(active, onAddHarmony);

      return {
        climate: 'spring_breeze',
        icon: '🌸',
        title: 'Brisa da Primavera!',
        description: hatchedCount > 0
          ? 'Pétalas florais chocaram os casulos da mesa (+1 Dica 💡)!'
          : 'Pétalas florais sopram sobre a mesa e restauram +1 Dica 💡!',
        rechargedTool: 'hint',
      };
    }
    return null;
  }

  public static evaluateFullMoon(
    streak: number,
    getFreeTiles: () => PlacedTile[]
  ): ClimateEffectResult | null {
    if (streak >= 4 && (streak % 2 === 0)) {
      const freeTiles = getFreeTiles();
      for (const t of freeTiles) {
        t.isHinted = true;
      }
      return {
        climate: 'full_moon',
        icon: '🌕',
        title: 'Noite de Lua Cheia!',
        description: 'Vaga-lumes iluminam a floresta e revelam todos os pares livres!',
      };
    }
    return null;
  }

  public static evaluateZenStorm(streak: number): ClimateEffectResult | null {
    if (streak >= 3 && Math.random() < 0.6) {
      return {
        climate: 'zen_storm',
        icon: '🌧️',
        title: 'Tempestade Zen!',
        description: 'Um raio místico iluminou o horizonte e restaurou +1 Marreta 🔨!',
        rechargedTool: 'hammer',
      };
    }
    return null;
  }
}
