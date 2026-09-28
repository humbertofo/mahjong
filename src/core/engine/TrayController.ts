import { PlacedTile, MoveHistoryItem } from '../types';
import { TileTraits } from '../nature/tiles/TileTraits';

export interface UndoResult {
  success: boolean;
  type?: 'tile_restored' | 'pair_restored';
  tile?: PlacedTile;
  pair?: [PlacedTile, PlacedTile];
  secondaryTiles?: PlacedTile[];
  rechargedTool?: 'hammer' | 'shuffle' | 'hint' | 'undo';
}

export class TrayController {
  private tray: PlacedTile[] = [];
  private maxTraySlots: number = 4;

  public getTray(): PlacedTile[] {
    return this.tray;
  }

  public getMaxTraySlots(): number {
    return this.maxTraySlots;
  }

  public setMaxTraySlots(slots: number): void {
    this.maxTraySlots = Math.max(3, Math.min(6, slots));
  }

  public clearTray(): void {
    this.tray = [];
  }

  public setTray(tiles: PlacedTile[]): void {
    this.tray = tiles;
  }

  public addTile(tile: PlacedTile): void {
    tile.inTray = true;
    tile.isSelected = false;
    tile.isHinted = false;
    this.tray.push(tile);
  }

  public removeTiles(ids: Set<string>): void {
    this.tray = this.tray.filter((t) => !ids.has(t.id));
  }

  public sortTray(): void {
    this.tray.sort((a, b) => String(a.value).localeCompare(String(b.value)));
  }

  /**
   * Predação na Bandeja (Mecânica D):
   * Quando uma peça entra na bandeja e há interação predador x presa,
   * o predador consome a presa, liberando o slot imediatamente!
   */
  public checkPredation(newTile: PlacedTile): {
    predator: PlacedTile;
    prey: PlacedTile;
    wasNewTilePredator: boolean;
  } | null {
    // 1. O novo tile é um predador que consome uma presa já existente na bandeja?
    if (TileTraits.isPredator(newTile.value)) {
      const prey = this.tray.find(
        (t) => t.id !== newTile.id && TileTraits.canPrey(newTile.value, t.value)
      );
      if (prey) {
        prey.isRemoved = true;
        prey.inTray = false;
        this.tray = this.tray.filter((t) => t.id !== prey.id);
        return { predator: newTile, prey, wasNewTilePredator: true };
      }
    }

    // 2. O novo tile é uma presa e já existe um predador na bandeja esperando?
    if (TileTraits.isPrey(newTile.value)) {
      const predator = this.tray.find(
        (t) => t.id !== newTile.id && TileTraits.canPrey(t.value, newTile.value)
      );
      if (predator) {
        newTile.isRemoved = true;
        newTile.inTray = false;
        this.tray = this.tray.filter((t) => t.id !== newTile.id);
        return { predator, prey: newTile, wasNewTilePredator: false };
      }
    }

    return null;
  }

  /**
   * Resgate Cósmico Zen: se o tabuleiro esvaziou mas restou qualquer peça na bandeja,
   * a floresta purifica a bandeja com Harmonia (+200 pts) e conclui a onda com segurança total!
   */
  public checkAndResolveCosmicRescue(
    activeBoardTilesCount: number,
    onInvalidateCache: () => void,
    onAddHarmony: (pts: number) => void
  ): PlacedTile[] | null {
    onInvalidateCache();
    if (activeBoardTilesCount === 0 && this.tray.length > 0) {
      const rescued = [...this.tray];
      for (const t of rescued) {
        t.isRemoved = true;
        t.inTray = false;
        t.inSynergyAction = false;
      }
      this.tray = [];
      onAddHarmony(rescued.length * 200);
      onInvalidateCache();
      return rescued;
    }
    return null;
  }

  /**
   * Resgate Zen: alivia a bandeja devolvendo a peça mais antiga suavemente ao tabuleiro
   */
  public zenRescue(onInvalidateCache: () => void): PlacedTile | null {
    if (this.tray.length === 0) return null;
    const rescued = this.tray.shift()!;
    rescued.inTray = false;
    rescued.isRemoved = false;
    rescued.isSelected = false;
    rescued.isHinted = false;
    onInvalidateCache();
    return rescued;
  }

  public undoSpecificTrayTile(
    tileId: string,
    history: MoveHistoryItem[],
    onInvalidateCache: () => void
  ): UndoResult {
    const trayTile = this.tray.find((t) => t.id === tileId);
    if (!trayTile) return { success: false };

    // Remove do histórico a adição desta peça
    const histIdx = history.findIndex(
      (h) => h.actionType === 'tray_add' && h.tile && h.tile.id === tileId
    );
    if (histIdx !== -1) {
      history.splice(histIdx, 1);
    }

    trayTile.inTray = false;
    trayTile.isRemoved = false;
    trayTile.isSelected = false;
    trayTile.isHinted = false;
    trayTile.inSynergyAction = false;
    trayTile.inSynergyPulled = false;
    this.tray = this.tray.filter((t) => t.id !== tileId);
    onInvalidateCache();
    return { success: true, type: 'tile_restored', tile: trayTile };
  }

  public undo(
    history: MoveHistoryItem[],
    getHarmonyScore: () => number,
    onSubtractHarmony: (pts: number) => void,
    onInvalidateCache: () => void
  ): UndoResult {
    if (history.length === 0) return { success: false };

    // Desfaz estritamente a última ação registrada no histórico
    const lastItem = history.pop();
    if (!lastItem) return { success: false };

    if (lastItem.actionType === 'matched_pair' && lastItem.matchedPair) {
      const [m1, m2] = lastItem.matchedPair;
      m1.isRemoved = false;
      m1.inTray = false;
      m1.isSelected = false;
      m1.isHinted = false;
      m1.inSynergyAction = false;
      m1.inSynergyPulled = false;

      m2.isRemoved = false;
      m2.inTray = false;
      m2.isSelected = false;
      m2.isHinted = false;
      m2.inSynergyAction = false;
      m2.inSynergyPulled = false;

      // Reverter peças secundárias dissolvidas por sinergias ou climas
      if (lastItem.secondaryRemovedTiles) {
        for (const sec of lastItem.secondaryRemovedTiles) {
          sec.isRemoved = false;
          sec.inTray = false;
          sec.isSelected = false;
          sec.isHinted = false;
          sec.inSynergyAction = false;
          sec.inSynergyPulled = false;
        }
      }

      // Reverter transmutações (Camaleão Espelho, Onda de Calor, Trinca)
      if (lastItem.mutations) {
        for (const mut of lastItem.mutations) {
          mut.tile.value = mut.prevValue;
          mut.tile.label = mut.prevLabel;
          mut.tile.suit = mut.prevSuit;
          if (mut.prevValue !== 'chameleon') {
            mut.tile.specialType = 'normal';
          }
        }
      }

      // Reverter quebra de selos elementais (Mecânica F)
      if (lastItem.unsealedTiles && lastItem.unsealedElement) {
        for (const unsealed of lastItem.unsealedTiles) {
          unsealed.elementalSeal = lastItem.unsealedElement;
        }
      }

      // Reverter dissipação de névoa (Mecânica C)
      if (lastItem.clearedMistTiles) {
        for (const misty of lastItem.clearedMistTiles) {
          misty.isMisty = true;
        }
      }

      if (lastItem.pointsAwarded && getHarmonyScore() >= lastItem.pointsAwarded) {
        onSubtractHarmony(lastItem.pointsAwarded);
      }
      onInvalidateCache();
      return {
        success: true,
        type: 'pair_restored',
        pair: [m1, m2],
        secondaryTiles: lastItem.secondaryRemovedTiles,
        rechargedTool: lastItem.rechargedTool,
      };
    } else if (lastItem.actionType === 'trio_match' && lastItem.trioTile) {
      const t = lastItem.trioTile;
      t.isRemoved = false;
      t.inTray = false;
      t.isSelected = false;
      t.isHinted = false;
      t.inSynergyAction = false;
      t.inSynergyPulled = false;

      // Reverter peças secundárias dissolvidas por climas
      if (lastItem.secondaryRemovedTiles) {
        for (const sec of lastItem.secondaryRemovedTiles) {
          sec.isRemoved = false;
          sec.inTray = false;
          sec.isSelected = false;
          sec.isHinted = false;
          sec.inSynergyAction = false;
          sec.inSynergyPulled = false;
        }
      }

      // Reverter mutação da 4ª peça (Camaleão volta a ser o animal original)
      if (lastItem.mutations) {
        for (const mut of lastItem.mutations) {
          mut.tile.value = mut.prevValue;
          mut.tile.label = mut.prevLabel;
          mut.tile.suit = mut.prevSuit;
          if (mut.prevValue !== 'chameleon') {
            mut.tile.specialType = 'normal';
          }
        }
      }

      if (lastItem.pointsAwarded && getHarmonyScore() >= lastItem.pointsAwarded) {
        onSubtractHarmony(lastItem.pointsAwarded);
      }
      onInvalidateCache();
      return {
        success: true,
        type: 'tile_restored',
        tile: t,
        secondaryTiles: lastItem.secondaryRemovedTiles,
        rechargedTool: lastItem.rechargedTool,
      };
    } else if (lastItem.actionType === 'predation' && lastItem.predatorTile && lastItem.preyTile) {
      const predator = lastItem.predatorTile;
      const prey = lastItem.preyTile;

      if (lastItem.wasNewTilePredator) {
        // O predador era o novo tile: sai da bandeja e volta à mesa
        predator.inTray = false;
        predator.isRemoved = false;
        predator.isSelected = false;
        predator.isHinted = false;
        this.tray = this.tray.filter((t) => t.id !== predator.id);

        // A presa volta para a bandeja
        prey.inTray = true;
        prey.isRemoved = false;
        prey.isSelected = false;
        prey.isHinted = false;
        this.tray.push(prey);
      } else {
        // A presa era o novo tile: volta à mesa
        prey.inTray = false;
        prey.isRemoved = false;
        prey.isSelected = false;
        prey.isHinted = false;
        // O predador já estava na bandeja e permanece nela
      }

      if (lastItem.pointsAwarded && getHarmonyScore() >= lastItem.pointsAwarded) {
        onSubtractHarmony(lastItem.pointsAwarded);
      }
      onInvalidateCache();
      return {
        success: true,
        type: 'tile_restored',
        tile: lastItem.wasNewTilePredator ? predator : prey,
      };
    } else if (lastItem.actionType === 'tray_add' && lastItem.tile) {
      const trayTile = this.tray.find((t) => t.id === lastItem.tile!.id);
      if (trayTile) {
        trayTile.inTray = false;
        trayTile.isRemoved = false;
        trayTile.isSelected = false;
        trayTile.isHinted = false;
        trayTile.inSynergyAction = false;
        trayTile.inSynergyPulled = false;
        this.tray = this.tray.filter((t) => t.id !== trayTile.id);
        onInvalidateCache();
        return { success: true, type: 'tile_restored', tile: trayTile };
      }
    }

    return { success: false };
  }
}
