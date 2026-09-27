import { PlacedTile, ClimateEffectResult, MatchPair } from '../../../types';
import { canMatch } from '../../../deck';

export class OceanSurge {
  public static evaluate(
    biome: string,
    recentBiomeMatches: string[],
    tray: PlacedTile[],
    getActiveBoardTiles: () => PlacedTile[],
    getHintPair: () => MatchPair | null
  ): ClimateEffectResult | null {
    if (biome !== 'water' && tray.length < 2) return null;

    const waterMatches = recentBiomeMatches.filter((b) => b === 'water').length;
    if (waterMatches >= 2 || (tray.length >= 2 && Math.random() < 0.6)) {
      const clearedTray: PlacedTile[] = [];
      const affectedBoardTiles: PlacedTile[] = [];
      const remainingTray: PlacedTile[] = [];
      const tilesToProcess = [...tray];

      for (const t of tilesToProcess) {
        const partner = getActiveBoardTiles().find(
          (b) => !b.isRemoved && !b.inTray && canMatch(b, t)
        );
        if (partner) {
          t.isRemoved = true;
          t.inTray = false;
          partner.isRemoved = true;
          clearedTray.push(t);
          affectedBoardTiles.push(partner);
        } else {
          remainingTray.push(t);
        }
      }
      tray.length = 0;
      tray.push(...remainingTray);

      let eliminatedBoardPairs: [PlacedTile, PlacedTile] | undefined;
      const hint = getHintPair();
      if (hint && Math.random() < 0.5) {
        const p1 = getActiveBoardTiles().find((t) => t.id === hint.tile1Id);
        const p2 = getActiveBoardTiles().find((t) => t.id === hint.tile2Id);
        if (p1 && p2 && p1 !== p2 && canMatch(p1, p2)) {
          p1.isRemoved = true;
          p2.isRemoved = true;
          eliminatedBoardPairs = [p1, p2];
        }
      }

      return {
        climate: 'ocean_surge',
        icon: '🌊',
        title: 'Maré Alta Purificadora!',
        description: 'As ondas do oceano lavaram e esvaziaram a bandeja com segurança zen!',
        clearedTrayTiles: clearedTray,
        affectedBoardTiles: affectedBoardTiles.length > 0 ? affectedBoardTiles : undefined,
        eliminatedBoardPairs,
      };
    }

    return null;
  }
}
