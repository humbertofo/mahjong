import { PlacedTile, MoveHistoryItem } from '../types';

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
  private readonly maxTraySlots: number = 4;

  public getTray(): PlacedTile[] {
    return this.tray;
  }

  public getMaxTraySlots(): number {
    return this.maxTraySlots;
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

    // Se houver peças na bandeja, desfaz a última adição à bandeja
    if (this.tray.length > 0) {
      for (let i = history.length - 1; i >= 0; i--) {
        const item = history[i];
        if (item.actionType === 'tray_add' && item.tile) {
          const trayTile = this.tray.find((t) => t.id === item.tile!.id);
          if (trayTile) {
            history.splice(i, 1);
            trayTile.inTray = false;
            trayTile.isRemoved = false;
            trayTile.isSelected = false;
            trayTile.isHinted = false;
            this.tray = this.tray.filter((t) => t.id !== trayTile.id);
            onInvalidateCache();
            return { success: true, type: 'tile_restored', tile: trayTile };
          }
        }
      }
    }

    // Se a bandeja está vazia, desfaz o último par combinado
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

      // Reverter transmutações (Camaleão Espelho, Onda de Calor)
      if (lastItem.mutations) {
        for (const mut of lastItem.mutations) {
          mut.tile.value = mut.prevValue;
          mut.tile.label = mut.prevLabel;
          mut.tile.suit = mut.prevSuit;
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
