import { PlacedTile, TileMutationRecord, ClimateEffectResult } from '../../types';

export class SpecialTileRules {
  /**
   * Resolve a transmutação espelho do Camaleão garantindo bijeção estrita e preservação de par
   */
  public static resolveChameleonMirror(
    m1: PlacedTile,
    m2: PlacedTile,
    allTiles: PlacedTile[],
    onInvalidateCache: () => void
  ): TileMutationRecord | null {
    let chameleon: PlacedTile | null = null;
    let target: PlacedTile | null = null;

    if (m1.value === 'chameleon' && m2.value !== 'chameleon') {
      chameleon = m1;
      target = m2;
    } else if (m2.value === 'chameleon' && m1.value !== 'chameleon') {
      chameleon = m2;
      target = m1;
    }

    if (!chameleon || !target) return null;

    const otherChameleon = allTiles.find(
      (t) => !t.isRemoved && t.id !== chameleon!.id && t.value === 'chameleon'
    );

    if (otherChameleon) {
      const record: TileMutationRecord = {
        tile: otherChameleon,
        prevValue: otherChameleon.value,
        prevLabel: otherChameleon.label,
        prevSuit: otherChameleon.suit,
      };
      otherChameleon.value = target.value;
      otherChameleon.label = target.label;
      otherChameleon.suit = target.suit;
      onInvalidateCache();
      return record;
    }
    return null;
  }

  /**
   * Baú da Fortuna 🎁: ao combinar um baú, sorteia uma ferramenta para recarregar
   */
  public static checkAndOpenChest(
    m1: PlacedTile,
    m2: PlacedTile
  ): ClimateEffectResult | null {
    if (m1.specialType === 'chest' || m2.specialType === 'chest') {
      const tools: ('hammer' | 'shuffle' | 'hint')[] = ['hammer', 'shuffle', 'hint'];
      const awardedTool = tools[Math.floor(Math.random() * tools.length)];
      return {
        climate: 'zen_storm',
        icon: '🎁',
        title: 'Baú da Fortuna Aberto!',
        description: `Você abriu um Baú Dourado e recebeu +1 ${awardedTool === 'hammer' ? 'Marreta 🔨' : awardedTool === 'hint' ? 'Dica 💡' : 'Misturar 🔀'}!`,
        rechargedTool: awardedTool,
      };
    }
    return null;
  }

  /**
   * Derrete peças de gelo na mesa tornando-as normais
   */
  public static thawIceTiles(activeTiles: PlacedTile[]): number {
    const iceTiles = activeTiles.filter((t) => t.specialType === 'ice');
    for (const ice of iceTiles) {
      ice.specialType = 'normal';
    }
    return iceTiles.length;
  }

  /**
   * Corta vinhas de cipó que prendiam peças
   */
  public static cutVineTiles(activeTiles: PlacedTile[]): number {
    const vineTiles = activeTiles.filter((t) => t.specialType === 'vines');
    for (const vine of vineTiles) {
      vine.specialType = 'normal';
    }
    return vineTiles.length;
  }

  /**
   * Choca casulos revelando as peças interiores e concedendo harmonia
   */
  public static hatchCocoonTiles(
    activeTiles: PlacedTile[],
    onAddHarmony: (pts: number) => void
  ): number {
    const cocoonTiles = activeTiles.filter((t) => t.specialType === 'cocoon');
    for (const coc of cocoonTiles) {
      coc.specialType = 'normal';
      onAddHarmony(100);
    }
    return cocoonTiles.length;
  }

  /**
   * Transmuta uma peça para Camaleão Coringa místico (usado na 4ª peça da Trinca Sagrada)
   */
  public static transmuteToChameleon(
    target: PlacedTile,
    onInvalidateCache: () => void
  ): TileMutationRecord {
    const record: TileMutationRecord = {
      tile: target,
      prevValue: target.value,
      prevLabel: target.label,
      prevSuit: target.suit,
    };
    target.value = 'chameleon';
    target.label = '🦎 Camaleão';
    target.suit = 'mythic';
    target.specialType = 'chameleon';
    onInvalidateCache();
    return record;
  }
}
