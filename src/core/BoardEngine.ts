import {
  BoardLayout,
  PlacedTile,
  TileDefinition,
  MatchPair,
  MoveHistoryItem,
  LayoutSlot,
  WaveInfo,
  SynergyResult,
  ClimateEffectResult,
  TileBiome,
  AnimalValue,
} from './types';
import { createAnimalDeck, canMatch } from './deck';

export interface TileSelectionResult {
  action: 'added' | 'matched' | 'tray_full' | 'invalid';
  matchedPair?: [PlacedTile, PlacedTile];
  tile?: PlacedTile;
  tray: PlacedTile[];
  isTrayFullWarning?: boolean;
  synergy?: SynergyResult;
  climateTriggered?: ClimateEffectResult;
  waveCleared?: boolean;
  waveInfo?: WaveInfo;
}

// Mapeamento de cada animal para seu bioma elementar da natureza
const ANIMAL_BIOMES: Record<AnimalValue, TileBiome> = {
  // Água
  fish: 'water',
  turtle: 'water',
  duck: 'water',
  dolphin: 'water',
  shell: 'water',

  // Floresta / Vento
  bird: 'forest',
  butterfly: 'forest',
  fox: 'forest',
  squirrel: 'forest',
  acorn: 'forest',
  panda: 'forest',

  // Savana / Calor
  lion: 'savanna',
  elephant: 'savanna',
  monkey: 'savanna',
  cat: 'savanna',
  dog: 'savanna',
  banana: 'savanna',

  // Ártico / Frio
  penguin: 'arctic',
  bear: 'arctic',

  // Jardim / Primavera
  rabbit: 'garden',
  frog: 'garden',
  snail: 'garden',
  ladybug: 'garden',
  apple: 'garden',
  bee: 'garden',
  honeycomb: 'garden',
  hedgehog: 'garden',

  // Peça Coringa Mística
  chameleon: 'forest',
};

export class BoardEngine {
  private tiles: PlacedTile[] = [];
  private tray: PlacedTile[] = [];
  private history: MoveHistoryItem[] = [];
  private layout: BoardLayout;
  private readonly maxTraySlots: number = 4;

  // Estado Multi-Wave (Fases em Ondas para manter peças gigantescas no celular)
  private waves: LayoutSlot[][] = [];
  private currentWaveIndex: number = 0;

  // Estado Climático & Sinergias
  private recentBiomeMatches: TileBiome[] = [];
  private consecutiveMatchesStreak: number = 0;

  constructor(layout: BoardLayout) {
    this.layout = layout;
    this.initWaves();
    this.generateCurrentWave();
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

  // ─── Lógica de Ondas (Multi-Wave) ──────────────────────────────────────────

  public getCurrentWave(): number {
    return this.currentWaveIndex + 1;
  }

  public getTotalWaves(): number {
    return this.waves.length;
  }

  public hasMoreWaves(): boolean {
    return this.currentWaveIndex < this.waves.length - 1;
  }

  public isWaveCleared(): boolean {
    return this.getActiveBoardTiles().length === 0;
  }

  public getWaveInfo(): WaveInfo {
    return {
      currentWave: this.getCurrentWave(),
      totalWaves: this.getTotalWaves(),
      remainingInWave: this.getActiveBoardTiles().length,
    };
  }

  /**
   * Avança para a próxima onda da fase mantendo ou esvaziando a bandeja com bônus
   */
  public advanceToNextWave(): boolean {
    if (!this.hasMoreWaves()) return false;

    this.currentWaveIndex++;
    // Esvazia suavemente qualquer peça da bandeja com bônus zen entre ondas
    this.tray.forEach((t) => {
      t.isRemoved = true;
      t.inTray = false;
    });
    this.tray = [];
    this.history = [];

    this.generateCurrentWave();
    return true;
  }

  /**
   * Particiona layouts com muitas peças em 2 ou 3 ondas de 36 a 44 peças,
   * garantindo peças sempre grandes (55-65px) na tela do smartphone!
   */
  private initWaves(): void {
    if (this.layout.waves && this.layout.waves.length > 0) {
      this.waves = this.layout.waves.map((w) => w.slots);
      return;
    }

    const allSlots = [...this.layout.slots];
    const total = allSlots.length;

    // Se a fase tem 44 ou menos peças, cabe perfeitamente em 1 única tela
    if (total <= 44) {
      this.waves = [allSlots];
      return;
    }

    // Ordenar slots priorizando peças mais altas (topo Z) para a primeira onda
    // e a base/fundação para a segunda e terceira ondas
    const sortedByZ = [...allSlots].sort((a, b) => b.z - a.z);

    if (total <= 88) {
      // 2 Ondas balanceadas com número par de peças
      const half = Math.floor(total / 4) * 2;
      const wave1 = sortedByZ.slice(0, half);
      const wave2 = sortedByZ.slice(half);
      this.waves = [wave1, wave2];
    } else {
      // 3 Ondas para fases épicas (ex: 144 peças em 3 ondas de 48 peças)
      const part1 = Math.floor(total / 6) * 2;
      const part2 = Math.floor(total / 6) * 2;
      const wave1 = sortedByZ.slice(0, part1);
      const wave2 = sortedByZ.slice(part1, part1 + part2);
      const wave3 = sortedByZ.slice(part1 + part2);
      this.waves = [wave1, wave2, wave3];
    }
  }

  // ─── Verificação de Liberdade de Peça ──────────────────────────────────────

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

    return !hasLeftNeighbor || !hasRightNeighbor;
  }

  public getFreeTiles(): PlacedTile[] {
    return this.getActiveBoardTiles().filter((t) => this.isTileFree(t));
  }

  // ─── Toque e Seleção de Peças ─────────────────────────────────────────────

  public selectTile(tileId: string): TileSelectionResult {
    const tile = this.tiles.find((t) => t.id === tileId);
    if (!tile || tile.isRemoved || tile.inTray || !this.isTileFree(tile)) {
      return { action: 'invalid', tray: [...this.tray] };
    }

    if (this.tray.length >= this.maxTraySlots) {
      return { action: 'tray_full', tray: [...this.tray], isTrayFullWarning: true };
    }

    // Move para a bandeja
    tile.inTray = true;
    tile.isSelected = false;
    tile.isHinted = false;
    this.tray.push(tile);

    this.history.push({
      tile: { ...tile },
      fromBoardToTrayIndex: this.tray.length - 1,
    });

    // Checar se formou combinação com alguma peça já na bandeja
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

      this.tray = this.tray.filter((t) => t.id !== match1.id && t.id !== match2.id);

      this.consecutiveMatchesStreak++;
      const biome = ANIMAL_BIOMES[match1.value] || 'forest';
      this.recentBiomeMatches.push(biome);
      if (this.recentBiomeMatches.length > 4) {
        this.recentBiomeMatches.shift();
      }

      // 1. Detectar Sinergia Cruzada
      const synergy = this.evaluateSynergy(match1, match2);

      // 2. Detectar Clima da Natureza (se aplicável)
      const climateTriggered = this.evaluateClimate(match1, match2);

      const waveCleared = this.isWaveCleared();

      return {
        action: 'matched',
        matchedPair: [match1, match2],
        tray: [...this.tray],
        synergy: synergy || undefined,
        climateTriggered: climateTriggered || undefined,
        waveCleared,
        waveInfo: this.getWaveInfo(),
      };
    }

    // Não formou par: agrupa na bandeja
    this.sortTray();

    const isFull = this.tray.length >= this.maxTraySlots;
    return {
      action: 'added',
      tile,
      tray: [...this.tray],
      isTrayFullWarning: isFull,
      waveInfo: this.getWaveInfo(),
    };
  }

  private sortTray(): void {
    this.tray.sort((a, b) => String(a.value).localeCompare(String(b.value)));
  }

  // ─── Avaliação de Sinergias da Natureza ───────────────────────────────────

  private evaluateSynergy(t1: PlacedTile, t2: PlacedTile): SynergyResult | null {
    const v1 = t1.value;
    const v2 = t2.value;

    // Camaleão Coringa
    if (v1 === 'chameleon' || v2 === 'chameleon') {
      return {
        type: 'wildcard_chameleon',
        title: '🦎 Camaleão Holográfico!',
        description: 'A peça coringa se adaptou e completou a combinação.',
        bonusScore: 150,
      };
    }

    // Abelha + Mel
    if ((v1 === 'bee' && v2 === 'honeycomb') || (v1 === 'honeycomb' && v2 === 'bee')) {
      // Enxame Dourado: se tiver peças sobrando na bandeja, limpa 1 peça órfã
      let clearedTrayTiles: PlacedTile[] = [];
      if (this.tray.length > 0) {
        const orphan = this.tray.pop()!;
        orphan.isRemoved = true;
        orphan.inTray = false;
        clearedTrayTiles.push(orphan);
      }
      return {
        type: 'bee_honey',
        title: '🐝🍯 Enxame Dourado!',
        description: 'O aroma do mel doce atraiu a abelhinha e abriu espaço.',
        bonusScore: 250,
        clearedTrayTiles,
      };
    }

    // Urso + Mel ou Urso + Peixe
    if ((v1 === 'bear' && (v2 === 'honeycomb' || v2 === 'fish')) ||
        ((v1 === 'honeycomb' || v1 === 'fish') && v2 === 'bear')) {
      // Banquete do Urso: remove 1 peça vizinha bloqueadora na mesa
      const free = this.getFreeTiles();
      let affectedBoardTiles: PlacedTile[] = [];
      if (free.length > 0) {
        const target = free[Math.floor(Math.random() * free.length)];
        target.isRemoved = true;
        affectedBoardTiles.push(target);
      }
      return {
        type: 'bear_feast',
        title: '🐻 Banquete do Urso!',
        description: 'O grande urso saboreou seu banquete e desobstruiu o caminho!',
        bonusScore: 300,
        affectedBoardTiles,
      };
    }

    // Macaco + Banana
    if ((v1 === 'monkey' && v2 === 'banana') || (v1 === 'banana' && v2 === 'monkey')) {
      this.shuffleRemaining();
      return {
        type: 'monkey_banana',
        title: '🐒🍌 Salto na Copa!',
        description: 'O macaco saltou alegremente entre as árvores e reorganizou as peças!',
        bonusScore: 200,
      };
    }

    // Esquilo + Noz
    if ((v1 === 'squirrel' && v2 === 'acorn') || (v1 === 'acorn' && v2 === 'squirrel')) {
      let clearedTrayTiles: PlacedTile[] = [];
      if (this.tray.length > 0) {
        const stored = this.tray.shift()!;
        stored.isRemoved = true;
        stored.inTray = false;
        clearedTrayTiles.push(stored);
      }
      return {
        type: 'squirrel_acorn',
        title: '🐿️🌰 Reserva Secreta!',
        description: 'O esquilo recolheu sua noz e guardou a peça na toca segura!',
        bonusScore: 200,
        clearedTrayTiles,
      };
    }

    // Sapo + Insetos
    if ((v1 === 'frog' && (v2 === 'ladybug' || v2 === 'bee')) ||
        ((v1 === 'ladybug' || v1 === 'bee') && v2 === 'frog')) {
      return {
        type: 'frog_tongue',
        title: '🐸 Língua Certeira!',
        description: 'O sapinho saltou com agilidade zen e capturou seu par!',
        bonusScore: 220,
      };
    }

    // Golfinho + Concha
    if ((v1 === 'dolphin' && v2 === 'shell') || (v1 === 'shell' && v2 === 'dolphin')) {
      return {
        type: 'dolphin_sonar',
        title: '🐬🐚 Eco Sonar!',
        description: 'As ondas sonoras do golfinho iluminaram o mar sereno!',
        bonusScore: 200,
      };
    }

    // Ouriço + Maçã
    if ((v1 === 'hedgehog' && v2 === 'apple') || (v1 === 'apple' && v2 === 'hedgehog')) {
      return {
        type: 'hedgehog_apple',
        title: '🦔🍎 Espinho Coletor!',
        description: 'O ouriço carregou a maçã suculenta com seus espinhos macios!',
        bonusScore: 250,
      };
    }

    return null;
  }

  // ─── Avaliação dos 7 Climas da Natureza ────────────────────────────────────

  private evaluateClimate(t1: PlacedTile, _t2: PlacedTile): ClimateEffectResult | null {
    const biome = ANIMAL_BIOMES[t1.value] || 'forest';

    // 1. MARÉ ALTA PURIFICADORA 🌊 (Prioridade máxima de alívio ergonômico)
    // Se o jogador combinou água OU se a bandeja estava perigosamente cheia (3 peças)
    if (biome === 'water' || this.tray.length >= 2) {
      // Chance de ativar quando ocorrem 2 matches de água ou bandeja sob pressão
      const waterMatches = this.recentBiomeMatches.filter((b) => b === 'water').length;
      if (waterMatches >= 2 || (this.tray.length >= 2 && Math.random() < 0.6)) {
        // Lava e esvazia COMPLETAMENTE os 3 slots da bandeja!
        const clearedTray = [...this.tray];
        this.tray.forEach((t) => {
          t.isRemoved = true;
          t.inTray = false;
        });
        this.tray = [];

        // Chance de 50% de eliminar mais 1 par livre da mesa!
        let eliminatedBoardPairs: [PlacedTile, PlacedTile] | undefined;
        const hint = this.getHintPair();
        if (hint && Math.random() < 0.5) {
          const p1 = this.getActiveBoardTiles().find((t) => t.id === hint.tile1Id);
          const p2 = this.getActiveBoardTiles().find((t) => t.id === hint.tile2Id);
          if (p1 && p2) {
            p1.isRemoved = true;
            p2.isRemoved = true;
            eliminatedBoardPairs = [p1, p2];
          }
        }

        return {
          climate: 'ocean_surge',
          icon: '🌊',
          title: 'Maré Alta Purificadora!',
          description: 'As ondas do oceano lavaram e limparam toda a sua bandeja!',
          clearedTrayTiles: clearedTray,
          eliminatedBoardPairs,
        };
      }
    }

    // 2. ONDA DE CALOR ☀️
    if (biome === 'savanna' && this.recentBiomeMatches.filter((b) => b === 'savanna').length >= 2) {
      // Transforma uma peça livre da mesa em Camaleão Coringa!
      const free = this.getFreeTiles();
      if (free.length > 0) {
        const candidate = free[Math.floor(Math.random() * free.length)];
        candidate.value = 'chameleon';
        candidate.label = '🦎 Camaleão';
      }
      return {
        climate: 'heat_wave',
        icon: '☀️',
        title: 'Onda de Calor Solar!',
        description: 'O calor da savana fez brotar um Camaleão Coringa no tabuleiro!',
      };
    }

    // 3. TEMPESTADE ZEN 🌧️
    if (this.consecutiveMatchesStreak >= 4) {
      this.consecutiveMatchesStreak = 0;
      return {
        climate: 'zen_storm',
        icon: '🌧️',
        title: 'Tempestade Zen!',
        description: 'Um raio místico restaurou +1 carga de Marreta!',
        rechargedTool: 'hammer',
      };
    }

    return null;
  }

  // ─── Dicas e Ferramentas ──────────────────────────────────────────────────

  public getHintPair(): MatchPair | null {
    const free = this.getFreeTiles();

    // 1. Prioridade: combina com o que está na bandeja
    for (const trayTile of this.tray) {
      const matchOnBoard = free.find((b) => canMatch(b, trayTile));
      if (matchOnBoard) {
        return { tile1Id: matchOnBoard.id, tile2Id: trayTile.id };
      }
    }

    // 2. Combinação entre duas peças livres da mesa
    for (let i = 0; i < free.length; i++) {
      for (let j = i + 1; j < free.length; j++) {
        if (canMatch(free[i], free[j])) {
          return { tile1Id: free[i].id, tile2Id: free[j].id };
        }
      }
    }

    return null;
  }

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

  public hammerRemove(tileId: string): boolean {
    const fromTray = this.tray.find((t) => t.id === tileId);
    if (fromTray) {
      fromTray.isRemoved = true;
      fromTray.inTray = false;
      this.tray = this.tray.filter((t) => t.id !== tileId);

      const partner = this.getActiveBoardTiles().find((t) => canMatch(t, fromTray));
      if (partner) {
        partner.isRemoved = true;
      }

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

  public shuffleRemaining(): boolean {
    const active = this.getActiveBoardTiles();
    if (active.length < 2) return false;

    const tileDefs: TileDefinition[] = active.map((t) => ({
      id: t.id,
      suit: t.suit,
      value: t.value,
      label: t.label,
    }));

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
    return this.isWaveCleared() && !this.hasMoreWaves() && this.tray.length === 0;
  }

  // ─── Geração de Tabuleiro / Onda ──────────────────────────────────────────

  private generateCurrentWave(): void {
    const slots = this.waves[this.currentWaveIndex] || this.layout.slots;
    const totalSlots = slots.length;
    const deck = createAnimalDeck();

    const pairsNeeded = Math.ceil(totalSlots / 2);
    const selectedPairs: [TileDefinition, TileDefinition][] = [];

    // Embaralhar o deck
    const shuffledDeck = [...deck].sort(() => Math.random() - 0.5);

    let pairCount = 0;
    for (let i = 0; i < shuffledDeck.length - 1 && pairCount < pairsNeeded; i += 2) {
      selectedPairs.push([shuffledDeck[i], { ...shuffledDeck[i], id: `${shuffledDeck[i].id}_w${this.currentWaveIndex}` }]);
      pairCount++;
    }

    // Inserir com chance controlada uma sinergia ou camaleão por onda
    if (pairCount > 4 && Math.random() < 0.7) {
      const chameleonDef: TileDefinition = {
        id: `animal-chameleon-wave-${this.currentWaveIndex}`,
        suit: 'animal',
        value: 'chameleon',
        label: '🦎 Camaleão',
      };
      selectedPairs[0] = [chameleonDef, { ...chameleonDef, id: `${chameleonDef.id}_pair` }];
    }

    const allPieces: TileDefinition[] = [];
    selectedPairs.forEach(([p1, p2]) => {
      allPieces.push(p1, p2);
    });
    allPieces.sort(() => Math.random() - 0.5);

    this.tiles = slots.map((s, idx) => {
      const def = allPieces[idx % allPieces.length];
      return {
        id: `tile-w${this.currentWaveIndex}-${idx}`,
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
  }
}
