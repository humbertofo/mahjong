import {
  BoardLayout,
  PlacedTile,
  TileDefinition,
  MatchPair,
  MoveHistoryItem,
} from './types';
import { createAnimalDeck, canMatch } from './deck';

export interface TileSelectionResult {
  action: 'added' | 'matched' | 'tray_full' | 'invalid';
  matchedPair?: [PlacedTile, PlacedTile];
  tile?: PlacedTile;
  tray: PlacedTile[];
  isTrayFullWarning?: boolean;
}

export class BoardEngine {
  private tiles: PlacedTile[] = [];
  private tray: PlacedTile[] = [];
  private history: MoveHistoryItem[] = [];
  private layout: BoardLayout;
  private readonly maxTraySlots: number = 4;

  constructor(layout: BoardLayout) {
    this.layout = layout;
    this.generateBoard();
  }

  public getLayout(): BoardLayout {
    return this.layout;
  }

  public getTiles(): PlacedTile[] {
    return this.tiles;
  }

  public getTray(): PlacedTile[] {
    return this.tray;
  }

  public getMaxTraySlots(): number {
    return this.maxTraySlots;
  }

  public getActiveBoardTiles(): PlacedTile[] {
    return this.tiles.filter((t) => !t.isRemoved && !t.inTray);
  }

  public getRemainingCount(): number {
    return this.getActiveBoardTiles().length + this.tray.length;
  }

  public getHistoryLength(): number {
    return this.history.length;
  }

  /**
   * Verifica se uma peça na mesa está livre para ser tocada e enviada à bandeja
   */
  public isTileFree(tile: PlacedTile): boolean {
    if (tile.isRemoved || tile.inTray) return false;

    const activeTiles = this.getActiveBoardTiles();

    // 1. Checar se existe peça acima cobrindo
    const hasTileAbove = activeTiles.some((other) => {
      if (other.id === tile.id) return false;
      if (other.position.z <= tile.position.z) return false;
      const xOverlap = Math.abs(other.position.x - tile.position.x) < 2;
      const yOverlap = Math.abs(other.position.y - tile.position.y) < 2;
      return xOverlap && yOverlap;
    });

    if (hasTileAbove) {
      return false;
    }

    // 2. Checar bloqueio lateral no mesmo nível Z
    const hasLeftNeighbor = activeTiles.some((other) => {
      if (other.id === tile.id) return false;
      if (other.position.z !== tile.position.z) return false;
      const isLeft = other.position.x === tile.position.x - 2;
      const yOverlap = Math.abs(other.position.y - tile.position.y) < 2;
      return isLeft && yOverlap;
    });

    const hasRightNeighbor = activeTiles.some((other) => {
      if (other.id === tile.id) return false;
      if (other.position.z !== tile.position.z) return false;
      const isRight = other.position.x === tile.position.x + 2;
      const yOverlap = Math.abs(other.position.y - tile.position.y) < 2;
      return isRight && yOverlap;
    });

    // Pelo menos um lado livre (esquerda ou direita)
    return !hasLeftNeighbor || !hasRightNeighbor;
  }

  public getFreeTiles(): PlacedTile[] {
    return this.getActiveBoardTiles().filter((t) => this.isTileFree(t));
  }

  /**
   * Toque em uma peça: envia para a bandeja de 4 slots e verifica combinação imediata
   */
  public selectTile(tileId: string): TileSelectionResult {
    const tile = this.tiles.find((t) => t.id === tileId);
    if (!tile || tile.isRemoved || tile.inTray || !this.isTileFree(tile)) {
      return { action: 'invalid', tray: [...this.tray] };
    }

    // Se a bandeja já está com 4 peças cheias, não cabe mais
    if (this.tray.length >= this.maxTraySlots) {
      return { action: 'tray_full', tray: [...this.tray], isTrayFullWarning: true };
    }

    // Remove do tabuleiro e move para a bandeja
    tile.inTray = true;
    tile.isSelected = false;
    tile.isHinted = false;
    this.tray.push(tile);

    // Registra no histórico para desfazer
    this.history.push({
      tile: { ...tile },
      fromBoardToTrayIndex: this.tray.length - 1,
    });

    // Checar se formou um par idêntico dentro da bandeja
    const matchingIdx = this.tray.findIndex(
      (t) => t.id !== tile.id && canMatch(t, tile)
    );

    if (matchingIdx !== -1) {
      const match1 = this.tray[matchingIdx];
      const match2 = tile;

      // Ambas as peças saem da bandeja e são eliminadas definitivamente
      match1.isRemoved = true;
      match1.inTray = false;
      match2.isRemoved = true;
      match2.inTray = false;

      // Remove os dois elementos da bandeja
      this.tray = this.tray.filter((t) => t.id !== match1.id && t.id !== match2.id);

      return {
        action: 'matched',
        matchedPair: [match1, match2],
        tray: [...this.tray],
      };
    }

    // Não formou par: agrupa pedras semelhantes lado a lado na bandeja (conforme PRD _sort_tray_by_suit)
    this.sortTray();

    const isFull = this.tray.length >= this.maxTraySlots;
    return {
      action: 'added',
      tile,
      tray: [...this.tray],
      isTrayFullWarning: isFull,
    };
  }

  private sortTray(): void {
    this.tray.sort((a, b) => String(a.value).localeCompare(String(b.value)));
  }

  /**
   * Dica Inteligente:
   * Prioridade 1: Aponta uma peça livre na mesa que combina com uma peça já na bandeja!
   * Prioridade 2: Aponta duas peças livres na mesa que combinam entre si.
   */
  public getHintPair(): MatchPair | null {
    const free = this.getFreeTiles();

    // 1. Verificar se há peça na mesa que combina com algo que já está na bandeja
    for (const trayTile of this.tray) {
      const matchOnBoard = free.find((b) => canMatch(b, trayTile));
      if (matchOnBoard) {
        return { tile1Id: matchOnBoard.id, tile2Id: trayTile.id };
      }
    }

    // 2. Verificar se há dois blocos livres na mesa
    for (let i = 0; i < free.length; i++) {
      for (let j = i + 1; j < free.length; j++) {
        if (canMatch(free[i], free[j])) {
          return { tile1Id: free[i].id, tile2Id: free[j].id };
        }
      }
    }

    return null;
  }

  /**
   * Desfaz o envio da última peça à bandeja, devolvendo-a à mesa
   */
  public undo(): boolean {
    if (this.tray.length === 0) return false;

    const lastMove = this.history.pop();
    if (!lastMove) return false;

    const trayTile = this.tray.find((t) => t.id === lastMove.tile.id);
    if (trayTile) {
      trayTile.inTray = false;
      trayTile.isRemoved = false;
      trayTile.isSelected = false;
      trayTile.isHinted = false;
      this.tray = this.tray.filter((t) => t.id !== trayTile.id);
      return true;
    }

    return false;
  }

  /**
   * Marreta (Hammer): Remove 1 peça da bandeja (e sua parceira correspondente na mesa)
   * mantendo a paridade do tabuleiro e evitando peças órfãs.
   */
  public hammerRemove(tileId: string): boolean {
    const fromTray = this.tray.find((t) => t.id === tileId);
    if (fromTray) {
      fromTray.isRemoved = true;
      fromTray.inTray = false;
      this.tray = this.tray.filter((t) => t.id !== tileId);

      // Elimina o par correspondente na mesa (ou restante) para manter solvabilidade do baralho
      const partner = this.getActiveBoardTiles().find((t) => canMatch(t, fromTray));
      if (partner) {
        partner.isRemoved = true;
      }

      // Limpa histórico para evitar desfazer para peça destruída
      this.history = this.history.filter(
        (h) => h.tile.id !== fromTray.id && (!partner || h.tile.id !== partner.id)
      );

      return true;
    }

    const fromBoard = this.getActiveBoardTiles().find((t) => t.id === tileId && this.isTileFree(t));
    if (fromBoard) {
      fromBoard.isRemoved = true;
      const partner = this.getActiveBoardTiles().find((t) => canMatch(t, fromBoard));
      if (partner) {
        partner.isRemoved = true;
      }
      this.history = this.history.filter(
        (h) => h.tile.id !== fromBoard.id && (!partner || h.tile.id !== partner.id)
      );
      return true;
    }

    return false;
  }

  /**
   * Reembaralha as peças ativas restantes na mesa
   */
  public shuffleRemaining(): boolean {
    const active = this.getActiveBoardTiles();
    if (active.length < 2) return false;

    const tileDefs: TileDefinition[] = active.map((t) => ({
      id: t.id,
      suit: t.suit,
      value: t.value,
      label: t.label,
    }));

    // Fisher-Yates
    for (let i = tileDefs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tileDefs[i], tileDefs[j]] = [tileDefs[j], tileDefs[i]];
    }

    for (let i = 0; i < active.length; i++) {
      active[i].suit = tileDefs[i].suit;
      active[i].value = tileDefs[i].value;
      active[i].label = tileDefs[i].label;
    }

    return true;
  }

  public isVictory(): boolean {
    return this.getActiveBoardTiles().length === 0 && this.tray.length === 0;
  }

  /**
   * Monta o tabuleiro com pares solucionáveis
   */
  private generateBoard(): void {
    const slots = this.layout.slots;
    const totalSlots = slots.length;
    const deck = createAnimalDeck();

    // Seleciona pares suficientes
    const pairsNeeded = totalSlots / 2;
    const selectedPairs: [TileDefinition, TileDefinition][] = [];

    // Embaralhar o deck de base
    const shuffledDeck = [...deck].sort(() => Math.random() - 0.5);

    let pairCount = 0;
    for (let i = 0; i < shuffledDeck.length - 1 && pairCount < pairsNeeded; i += 2) {
      selectedPairs.push([shuffledDeck[i], { ...shuffledDeck[i], id: `${shuffledDeck[i].id}_copy` }]);
      pairCount++;
    }

    // Planifica os pares para os slots
    const allPieces: TileDefinition[] = [];
    selectedPairs.forEach(([p1, p2]) => {
      allPieces.push(p1, p2);
    });
    allPieces.sort(() => Math.random() - 0.5);

    this.tiles = slots.map((s, idx) => {
      const def = allPieces[idx % allPieces.length];
      return {
        id: `tile-${idx}`,
        suit: def.suit,
        value: def.value,
        label: def.label,
        position: { x: s.x, y: s.y, z: s.z },
        isRemoved: false,
        isSelected: false,
        isHinted: false,
        inTray: false,
      };
    });

    this.tray = [];
    this.history = [];
  }
}
