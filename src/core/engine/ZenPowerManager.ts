import { PlacedTile, MatchPair, TileDefinition, MoveHistoryItem } from '../types';
import { canMatch } from '../deck';
import { TrayController } from './TrayController';
import { SynergyDirector } from './SynergyDirector';

export class ZenPowerManager {
  public static getHintPair(freeTiles: PlacedTile[], tray: PlacedTile[]): MatchPair | null {
    // 1. Prioridade: combina com o que está na bandeja
    for (const trayTile of tray) {
      const matchOnBoard = freeTiles.find((b) => canMatch(b, trayTile));
      if (matchOnBoard) {
        return { tile1Id: matchOnBoard.id, tile2Id: trayTile.id };
      }
    }

    // 2. Combinação entre duas peças livres da mesa
    for (let i = 0; i < freeTiles.length; i++) {
      for (let j = i + 1; j < freeTiles.length; j++) {
        if (canMatch(freeTiles[i], freeTiles[j])) {
          return { tile1Id: freeTiles[i].id, tile2Id: freeTiles[j].id };
        }
      }
    }

    return null;
  }

  public static shuffleRemaining(
    activeTiles: PlacedTile[],
    onInvalidateCache: () => void
  ): boolean {
    if (activeTiles.length < 2) return false;

    const tileDefs: TileDefinition[] = activeTiles.map((t) => ({
      id: t.id,
      suit: t.suit,
      value: t.value,
      label: t.label,
    }));

    for (let i = tileDefs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tileDefs[i], tileDefs[j]] = [tileDefs[j], tileDefs[i]];
    }

    for (let i = 0; i < activeTiles.length; i++) {
      activeTiles[i].suit = tileDefs[i].suit;
      activeTiles[i].value = tileDefs[i].value;
      activeTiles[i].label = tileDefs[i].label;
    }

    onInvalidateCache();
    return true;
  }

  public static isDeadlocked(
    tray: PlacedTile[],
    maxTraySlots: number,
    freeTiles: PlacedTile[]
  ): boolean {
    if (tray.length < maxTraySlots) return false;

    // 1. Checa se existe par dentro da própria bandeja
    for (let i = 0; i < tray.length; i++) {
      for (let j = i + 1; j < tray.length; j++) {
        if (canMatch(tray[i], tray[j])) return false;
      }
    }

    // 2. Checa se alguma peça livre da mesa combina com qualquer peça da bandeja
    for (const trayTile of tray) {
      if (freeTiles.some((b) => canMatch(b, trayTile))) return false;
    }

    return true;
  }

  public static hammerRemove(
    tileId: string,
    trayController: TrayController,
    getActiveBoardTiles: () => PlacedTile[],
    allTiles: PlacedTile[],
    isTileFree: (tile: PlacedTile) => boolean,
    getHistory: () => MoveHistoryItem[],
    setHistory: (h: MoveHistoryItem[]) => void,
    onInvalidateCache: () => void,
    checkAndResolveCosmicRescue: () => PlacedTile[] | null
  ): boolean {
    const tray = trayController.getTray();
    const fromTray = tray.find((t) => t.id === tileId);

    if (fromTray) {
      fromTray.isRemoved = true;
      fromTray.inTray = false;
      trayController.removeTiles(new Set([tileId]));

      let partner = getActiveBoardTiles().find((t) => canMatch(t, fromTray));
      if (!partner) {
        partner = tray.find((t) => canMatch(t, fromTray));
        if (partner) {
          trayController.removeTiles(new Set([partner.id]));
        }
      }
      if (partner) {
        partner.isRemoved = true;
        partner.inTray = false;
        SynergyDirector.resolveChameleonMirror(fromTray, partner, allTiles, onInvalidateCache);
      }

      setHistory(
        getHistory().filter((h) => {
          if (h.tile && (h.tile.id === fromTray.id || (partner && h.tile.id === partner.id))) return false;
          if (h.matchedPair && (h.matchedPair[0].id === fromTray.id || h.matchedPair[1].id === fromTray.id || (partner && (h.matchedPair[0].id === partner.id || h.matchedPair[1].id === partner.id)))) return false;
          return true;
        })
      );

      onInvalidateCache();
      checkAndResolveCosmicRescue();
      return true;
    }

    const fromBoard = getActiveBoardTiles().find((t) => t.id === tileId && isTileFree(t));
    if (fromBoard) {
      fromBoard.isRemoved = true;
      let partner = getActiveBoardTiles().find((t) => canMatch(t, fromBoard));
      if (!partner) {
        partner = tray.find((t) => canMatch(t, fromBoard));
        if (partner) {
          trayController.removeTiles(new Set([partner.id]));
        }
      }
      if (partner) {
        partner.isRemoved = true;
        partner.inTray = false;
        SynergyDirector.resolveChameleonMirror(fromBoard, partner, allTiles, onInvalidateCache);
      }
      setHistory(
        getHistory().filter((h) => {
          if (h.tile && (h.tile.id === fromBoard.id || (partner && h.tile.id === partner.id))) return false;
          if (h.matchedPair && (h.matchedPair[0].id === fromBoard.id || h.matchedPair[1].id === fromBoard.id || (partner && (h.matchedPair[0].id === partner.id || h.matchedPair[1].id === partner.id)))) return false;
          return true;
        })
      );
      onInvalidateCache();
      checkAndResolveCosmicRescue();
      return true;
    }

    return false;
  }
}
