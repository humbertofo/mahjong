import { PlacedTile, ClimateEffectResult } from '../../../types';
import { canMatch } from '../../../deck';
import { SpecialTileRules } from '../../specialTiles/SpecialTileRules';

export class AtmosphericGales {
  /**
   * Executa o Vendaval de Outono (Floresta):
   * - Corta todas as vinhas e cipós presentes no tabuleiro
   * - Restaura +1 Misturar 🔀 garantido
   */
  public static executeAutumn(
    getActiveBoardTiles: () => PlacedTile[]
  ): ClimateEffectResult {
    const active = getActiveBoardTiles();
    const cutCount = SpecialTileRules.cutVineTiles(active);

    return {
      climate: 'autumn_gale',
      icon: '🍂',
      title: 'Outono Dourado!',
      description: cutCount > 0
        ? `A Trinca da Floresta invocou o Vendaval de Outono! O vento cortou ${cutCount} vinha(s) e restaurou +1 Misturar 🔀!`
        : 'A Trinca da Floresta invocou folhas douradas rodopiantes que restauraram +1 Misturar 🔀!',
      rechargedTool: 'shuffle',
    };
  }

  /**
   * Executa a Brisa da Primavera (Jardim):
   * - Choca casulos místico no tabuleiro concedendo harmonia
   * - Restaura +1 Dica 💡 garantida
   */
  public static executeSpring(
    getActiveBoardTiles: () => PlacedTile[],
    onAddHarmony: (pts: number) => void
  ): ClimateEffectResult {
    const active = getActiveBoardTiles();
    const hatchedCount = SpecialTileRules.hatchCocoonTiles(active, onAddHarmony);

    return {
      climate: 'spring_breeze',
      icon: '🌸',
      title: 'Brisa da Primavera!',
      description: hatchedCount > 0
        ? `A Trinca do Jardim invocou a Brisa da Primavera! Pétalas florais chocaram ${hatchedCount} casulo(s) (+1 Dica 💡)!`
        : 'A Trinca do Jardim soprou pétalas florais sobre a mesa e restaurou +1 Dica 💡!',
      rechargedTool: 'hint',
    };
  }

  /**
   * Executa a Tempestade Zen (Seres Místicos / Dragão / Fênix):
   * - Restaura +1 Marreta 🔨 garantida (sem RNG)
   */
  public static executeZenStorm(): ClimateEffectResult {
    return {
      climate: 'zen_storm',
      icon: '🌧️',
      title: 'Tempestade Zen!',
      description: 'A Trinca Mística invocou um raio cósmico no horizonte e restaurou +1 Marreta 🔨!',
      rechargedTool: 'hammer',
    };
  }

  /**
   * Avaliação de Noite de Lua Cheia (Vaga-lumes):
   * Disparada apenas em sequências altas de maestria zen (streak >= 6).
   * Revela APENAS 1 PAR livre ao invés de todos, guiando o jogador com serenidade e sem confusão ocular.
   */
  public static evaluateFullMoon(
    streak: number,
    getFreeTiles: () => PlacedTile[]
  ): ClimateEffectResult | null {
    if (streak >= 6 && streak % 3 === 0) {
      const freeTiles = getFreeTiles();
      // Limpa qualquer dica residual para foco visual absoluto
      freeTiles.forEach((t) => (t.isHinted = false));

      for (let i = 0; i < freeTiles.length; i++) {
        for (let j = i + 1; j < freeTiles.length; j++) {
          if (canMatch(freeTiles[i], freeTiles[j])) {
            freeTiles[i].isHinted = true;
            freeTiles[j].isHinted = true;
            const pairName = freeTiles[i].label;
            return {
              climate: 'full_moon',
              icon: '🌕',
              title: 'Vaga-lumes da Lua Cheia!',
              description: `Vaga-lumes iluminam com serenidade o par de ${pairName}!`,
            };
          }
        }
      }
    }
    return null;
  }
}
