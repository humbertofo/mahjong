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

export interface UndoResult {
  success: boolean;
  type?: 'tile_restored' | 'pair_restored';
  tile?: PlacedTile;
  pair?: [PlacedTile, PlacedTile];
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

  // Cache de alta performance para 60 FPS
  private cachedFreeTileIds: Set<string> | null = null;
  private cachedActiveTiles: PlacedTile[] | null = null;

  // Estado Multi-Wave (Fases em Ondas para manter peças gigantescas no celular)
  private waves: LayoutSlot[][] = [];
  private currentWaveIndex: number = 0;

  // Estado Climático, Sinergias & Pontuação de Harmonia
  private recentBiomeMatches: TileBiome[] = [];
  private consecutiveMatchesStreak: number = 0;
  private harmonyScore: number = 0;

  constructor(layout: BoardLayout) {
    this.layout = layout;
    this.initWaves();
    this.generateCurrentWave();
  }

  public invalidateCache(): void {
    this.cachedFreeTileIds = null;
    this.cachedActiveTiles = null;
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
    if (this.cachedActiveTiles) {
      return this.cachedActiveTiles;
    }
    this.cachedActiveTiles = this.tiles.filter((t) => !t.isRemoved && !t.inTray);
    return this.cachedActiveTiles;
  }

  public getRemainingCount(): number {
    return this.getActiveBoardTiles().length + this.tray.length;
  }

  public getHistoryLength(): number {
    return this.history.length;
  }

  public getHarmonyScore(): number {
    return this.harmonyScore;
  }

  public resetHarmonyScore(): void {
    this.harmonyScore = 0;
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
    return this.getActiveBoardTiles().length === 0 && this.tray.length === 0;
  }

  /**
   * Resgate Cósmico Zen: se o tabuleiro esvaziou mas restou qualquer peça na bandeja,
   * a floresta purifica a bandeja com Harmonia (+200 pts) e conclui a onda com segurança total!
   */
  public checkAndResolveCosmicRescue(): PlacedTile[] | null {
    if (this.getActiveBoardTiles().length === 0 && this.tray.length > 0) {
      const rescued = [...this.tray];
      for (const t of rescued) {
        t.isRemoved = true;
        t.inTray = false;
        t.inSynergyAction = false;
      }
      this.tray = [];
      this.harmonyScore += rescued.length * 200;
      this.invalidateCache();
      return rescued;
    }
    return null;
  }

  /**
   * Conclui a remoção definitiva das peças que estavam participando de animações cênicas teatrais
   */
  public finalizeSynergyMatch(tiles: PlacedTile[]): void {
    for (const t of tiles) {
      t.isRemoved = true;
      t.inSynergyAction = false;
      t.inSynergyPulled = false;
      t.inTray = false;
      t.isSelected = false;
    }
    this.invalidateCache();
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

    // Garantir estritamente paridade par em cada onda (zero peças órfãs)
    for (let i = 0; i < this.waves.length; i++) {
      if (this.waves[i].length % 2 !== 0) {
        this.waves[i] = this.waves[i].slice(0, this.waves[i].length - 1);
      }
    }
  }

  // ─── Verificação de Liberdade de Peça com Cache ──────────────────────────

  /**
   * Retorna o conjunto de IDs de todas as peças atualmente livres para clique/seleção.
   * Executa em O(N) com early-exit e guarda o resultado em cache para 60 FPS contínuos.
   */
  public getFreeTileIds(): Set<string> {
    if (this.cachedFreeTileIds) {
      return this.cachedFreeTileIds;
    }

    const activeTiles = this.getActiveBoardTiles();
    const freeSet = new Set<string>();
    const n = activeTiles.length;

    for (let i = 0; i < n; i++) {
      const tile = activeTiles[i];
      let hasTileAbove = false;

      // 1. Checar se existe peça acima cobrindo
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const other = activeTiles[j];
        if (other.position.z > tile.position.z) {
          if (
            Math.abs(other.position.x - tile.position.x) < 2 &&
            Math.abs(other.position.y - tile.position.y) < 2
          ) {
            hasTileAbove = true;
            break; // Já coberta por cima, não está livre!
          }
        }
      }

      if (hasTileAbove) {
        continue;
      }

      // 2. Checar bloqueio lateral no mesmo nível Z
      let hasLeftNeighbor = false;
      let hasRightNeighbor = false;

      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const other = activeTiles[j];
        if (other.position.z !== tile.position.z) continue;

        if (Math.abs(other.position.y - tile.position.y) < 2) {
          if (other.position.x < tile.position.x && (tile.position.x - other.position.x) <= 2) {
            hasLeftNeighbor = true;
          } else if (other.position.x > tile.position.x && (other.position.x - tile.position.x) <= 2) {
            hasRightNeighbor = true;
          }

          if (hasLeftNeighbor && hasRightNeighbor) {
            break; // Bloqueada em ambos os lados!
          }
        }
      }

      if (!hasLeftNeighbor || !hasRightNeighbor) {
        freeSet.add(tile.id);
      }
    }

    this.cachedFreeTileIds = freeSet;
    return freeSet;
  }

  public isTileFree(tile: PlacedTile): boolean {
    if (tile.isRemoved || tile.inTray) return false;
    return this.getFreeTileIds().has(tile.id);
  }

  public getFreeTiles(): PlacedTile[] {
    const freeIds = this.getFreeTileIds();
    return this.getActiveBoardTiles().filter((t) => freeIds.has(t.id));
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
    this.invalidateCache();

    // Checar se formou combinação com alguma peça já na bandeja
    const matchingIdx = this.tray.findIndex(
      (t) => t.id !== tile.id && canMatch(t, tile)
    );

    if (matchingIdx !== -1) {
      const match1 = this.tray[matchingIdx];
      const match2 = tile;

      // 1. Resolver Camaleão Espelho (garante conservação bijeção estrita de pares)
      this.resolveChameleonMirror(match1, match2);

      // Ambas as peças saem da bandeja
      this.tray = this.tray.filter((t) => t.id !== match1.id && t.id !== match2.id);

      this.consecutiveMatchesStreak++;
      const biome = ANIMAL_BIOMES[match1.value] || 'forest';
      this.recentBiomeMatches.push(biome);
      if (this.recentBiomeMatches.length > 4) {
        this.recentBiomeMatches.shift();
      }

      // 2. Detectar Sinergia da Natureza
      const synergy = this.evaluateSynergy(match1, match2);

      const isTheatrical = synergy && (
        synergy.type === 'frog_tongue' ||
        synergy.type === 'cat_paw' ||
        synergy.type === 'bear_feast' ||
        synergy.type === 'dolphin_sonar'
      );

      if (isTheatrical) {
        // match2 é a peça recém-clicada no tabuleiro que atua no efeito teatral!
        match2.inSynergyAction = true;
        match2.isRemoved = false;
        match2.inTray = false;

        // match1 veio da bandeja, portanto já não está mais fisicamente na mesa
        match1.isRemoved = true;
        match1.inTray = false;
        match1.inSynergyAction = false;

        if (synergy.affectedBoardTiles) {
          synergy.affectedBoardTiles.forEach((t) => {
            t.inSynergyAction = true;
            t.isRemoved = false;
            t.inTray = false;
          });
        }
      } else {
        match1.isRemoved = true;
        match1.inTray = false;
        match2.isRemoved = true;
        match2.inTray = false;
        if (synergy?.affectedBoardTiles) {
          synergy.affectedBoardTiles.forEach((t) => {
            t.isRemoved = true;
            t.inTray = false;
          });
        }
      }
      this.invalidateCache();

      // 3. Detectar Clima da Natureza (se aplicável)
      const climateTriggered = this.evaluateClimate(match1, match2);

      // 4. Pontos de Harmonia Zen
      let pointsAwarded = 100;
      if (synergy?.bonusScore) pointsAwarded += synergy.bonusScore;
      if (climateTriggered) pointsAwarded += 200;
      this.harmonyScore += pointsAwarded;

      // Registra o par combinado no histórico para permitir Desfazer completo
      this.history.push({
        actionType: 'matched_pair',
        matchedPair: [match1, match2],
        pointsAwarded,
      });

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

    // Não formou par: registra adição à bandeja e agrupa
    this.history.push({
      actionType: 'tray_add',
      tile: { ...tile },
      fromBoardToTrayIndex: this.tray.length - 1,
    });

    this.sortTray();

    // Se a mesa esvaziou, acionar resgate cósmico para prevenir qualquer softlock
    this.checkAndResolveCosmicRescue();

    const isFull = this.tray.length >= this.maxTraySlots;
    const waveCleared = this.isWaveCleared();

    return {
      action: 'added',
      tile,
      tray: [...this.tray],
      isTrayFullWarning: isFull,
      waveCleared,
      waveInfo: this.getWaveInfo(),
    };
  }

  private resolveChameleonMirror(m1: PlacedTile, m2: PlacedTile): void {
    let chameleon: PlacedTile | null = null;
    let target: PlacedTile | null = null;

    if (m1.value === 'chameleon' && m2.value !== 'chameleon') {
      chameleon = m1;
      target = m2;
    } else if (m2.value === 'chameleon' && m1.value !== 'chameleon') {
      chameleon = m2;
      target = m1;
    }

    if (!chameleon || !target) return;

    // Encontra o outro camaleão que ainda está no jogo
    const otherChameleon = this.tiles.find(
      (t) => !t.isRemoved && t.id !== chameleon!.id && t.value === 'chameleon'
    );

    if (otherChameleon) {
      // O camaleão espelho se transmuta para se tornar o par idêntico de target!
      otherChameleon.value = target.value;
      otherChameleon.label = target.label;
      otherChameleon.suit = target.suit;
      this.invalidateCache();
    }
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
    if ((v1 === 'bee' && v2 === 'honeycomb') || (v1 === 'honeycomb' && v2 === 'bee') || (v1 === 'bee' && v2 === 'bee')) {
      let affectedBoardTiles: PlacedTile[] = [];
      const active = this.getActiveBoardTiles();
      const h1 = active.find((t) => t.value === 'honeycomb');
      if (h1) {
        const h2 = active.find((t) => t !== h1 && t.value === 'honeycomb');
        if (h2) {
          affectedBoardTiles.push(h1, h2);
        }
      }
      return {
        type: 'bee_honey',
        title: '🐝🍯 Enxame Dourado!',
        description: affectedBoardTiles.length > 0
          ? 'O enxame de abelhas colheu o par de mel com segurança!'
          : 'O enxame de abelhas reorganizou o jardim com doçura!',
        bonusScore: 250,
        affectedBoardTiles,
      };
    }

    // Urso + Mel ou Urso + Peixe
    if ((v1 === 'bear' && (v2 === 'honeycomb' || v2 === 'fish')) ||
        ((v1 === 'honeycomb' || v1 === 'fish') && v2 === 'bear') ||
        (v1 === 'bear' && v2 === 'bear')) {
      let affectedBoardTiles: PlacedTile[] = [];
      const active = this.getActiveBoardTiles();
      const p1 = active.find((t) => t.value === 'fish' || t.value === 'honeycomb');
      if (p1) {
        const p2 = active.find((t) => t !== p1 && t.value === p1.value);
        if (p2) {
          affectedBoardTiles.push(p1, p2);
        }
      }
      return {
        type: 'bear_feast',
        title: '🐻 Banquete do Urso!',
        description: affectedBoardTiles.length > 0
          ? 'O urso saboreou seu banquete e devorou um par completo do tabuleiro!'
          : 'O urso saboreou seu banquete e concedeu energia zen!',
        bonusScore: 300,
        affectedBoardTiles,
      };
    }

    // Macaco + Banana
    if ((v1 === 'monkey' && v2 === 'banana') || (v1 === 'banana' && v2 === 'monkey') || (v1 === 'monkey' && v2 === 'monkey')) {
      this.shuffleRemaining();
      return {
        type: 'monkey_banana',
        title: '🐒🍌 Salto na Copa!',
        description: 'O macaco saltou alegremente entre as árvores e reorganizou as peças!',
        bonusScore: 200,
      };
    }

    // Esquilo + Noz
    if ((v1 === 'squirrel' && v2 === 'acorn') || (v1 === 'acorn' && v2 === 'squirrel') || (v1 === 'squirrel' && v2 === 'squirrel')) {
      let affectedBoardTiles: PlacedTile[] = [];
      const active = this.getActiveBoardTiles();
      const a1 = active.find((t) => t.value === 'acorn');
      if (a1) {
        const a2 = active.find((t) => t !== a1 && t.value === 'acorn');
        if (a2) {
          affectedBoardTiles.push(a1, a2);
        }
      }
      return {
        type: 'squirrel_acorn',
        title: '🐿️🌰 Reserva Secreta!',
        description: affectedBoardTiles.length > 0
          ? 'O esquilo recolheu o par de nozes completo para sua toca!'
          : 'O esquilo abriu espaço na sua bandeja com agilidade!',
        bonusScore: 200,
        affectedBoardTiles,
      };
    }

    // Sapo + Joaninha OU Sapo + Sapo: Língua Elástica
    if ((v1 === 'frog' && v2 === 'ladybug') ||
        (v1 === 'ladybug' && v2 === 'frog') ||
        (v1 === 'frog' && v2 === 'frog')) {
      let affectedBoardTiles: PlacedTile[] = [];
      const active = this.getActiveBoardTiles();
      const insectA = active.find((t) => t.value === 'ladybug' || t.value === 'bee');
      if (insectA) {
        const insectB = active.find((t) => t !== insectA && t.value === insectA.value);
        if (insectB) {
          affectedBoardTiles.push(insectA, insectB);
        }
      }

      return {
        type: 'frog_tongue',
        title: '🐸 Língua Ágil!',
        description: affectedBoardTiles.length > 0
          ? 'O sapo esticou a língua elástica e capturou o inseto no tabuleiro!'
          : 'O sapinho saltou com agilidade zen pela lagoa!',
        bonusScore: 240,
        affectedBoardTiles,
      };
    }

    // Gato + Peixe OU Gato + Gato: Pata Ágil
    if ((v1 === 'cat' && v2 === 'fish') || (v1 === 'fish' && v2 === 'cat') || (v1 === 'cat' && v2 === 'cat')) {
      let affectedBoardTiles: PlacedTile[] = [];
      const active = this.getActiveBoardTiles();
      const fishA = active.find((t) => t.value === 'fish');
      if (fishA) {
        const fishB = active.find((t) => t !== fishA && t.value === 'fish');
        if (fishB) {
          affectedBoardTiles.push(fishA, fishB);
        }
      }
      return {
        type: 'cat_paw',
        title: '🐱 Pata Ágil!',
        description: affectedBoardTiles.length > 0
          ? 'O gato deu uma patada rápida e pescou um par de peixes!'
          : 'O gato ronronou suavemente e energizou o tabuleiro!',
        bonusScore: 220,
        affectedBoardTiles,
      };
    }

    // Golfinho + Concha OU Golfinho + Golfinho: Eco Sonar
    if ((v1 === 'dolphin' && v2 === 'shell') || (v1 === 'shell' && v2 === 'dolphin') || (v1 === 'dolphin' && v2 === 'dolphin')) {
      let affectedBoardTiles: PlacedTile[] = [];
      const active = this.getActiveBoardTiles();
      const shellA = active.find((t) => t.value === 'shell');
      if (shellA) {
        const shellB = active.find((t) => t !== shellA && t.value === 'shell');
        if (shellB) {
          affectedBoardTiles.push(shellA, shellB);
        }
      }
      return {
        type: 'dolphin_sonar',
        title: '🐬 Eco Sonar!',
        description: affectedBoardTiles.length > 0
          ? 'O eco sonar das profundezas resgatou um par de conchas!'
          : 'As ondas sonoras do golfinho iluminaram o mar sereno!',
        bonusScore: 220,
        affectedBoardTiles,
      };
    }

    // Ouriço + Maçã OU Ouriço + Ouriço: Rolamento Coletor
    if ((v1 === 'hedgehog' && v2 === 'apple') || (v1 === 'apple' && v2 === 'hedgehog') || (v1 === 'hedgehog' && v2 === 'hedgehog')) {
      let affectedBoardTiles: PlacedTile[] = [];
      const active = this.getActiveBoardTiles();
      const appleA = active.find((t) => t.value === 'apple');
      if (appleA) {
        const appleB = active.find((t) => t !== appleA && t.value === 'apple');
        if (appleB) {
          affectedBoardTiles.push(appleA, appleB);
        }
      }
      return {
        type: 'hedgehog_apple',
        title: '🦔 Espinho Coletor!',
        description: affectedBoardTiles.length > 0
          ? 'O ouriço rolou pelo pomar e espetou um par de maçãs doces!'
          : 'O ouriço aconchegou-se em paz entre as folhas secas!',
        bonusScore: 240,
        affectedBoardTiles,
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
      const waterMatches = this.recentBiomeMatches.filter((b) => b === 'water').length;
      if (waterMatches >= 2 || (this.tray.length >= 2 && Math.random() < 0.6)) {
        const clearedTray: PlacedTile[] = [];
        const affectedBoardTiles: PlacedTile[] = [];
        const tilesToProcess = [...this.tray];
        this.tray = [];

        for (const t of tilesToProcess) {
          const partner = this.getActiveBoardTiles().find(
            (b) => !b.isRemoved && !b.inTray && canMatch(b, t)
          );
          if (partner) {
            t.isRemoved = true;
            t.inTray = false;
            partner.isRemoved = true;
            clearedTray.push(t);
            affectedBoardTiles.push(partner);
          } else {
            t.inTray = false;
            t.isRemoved = false;
          }
        }

        let eliminatedBoardPairs: [PlacedTile, PlacedTile] | undefined;
        const hint = this.getHintPair();
        if (hint && Math.random() < 0.5) {
          const p1 = this.getActiveBoardTiles().find((t) => t.id === hint.tile1Id);
          const p2 = this.getActiveBoardTiles().find((t) => t.id === hint.tile2Id);
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
    }

    // 2. ONDA DE CALOR ☀️
    if (biome === 'savanna' && this.recentBiomeMatches.filter((b) => b === 'savanna').length >= 2) {
      const hint = this.getHintPair();
      if (hint) {
        const p1 = this.getActiveBoardTiles().find((t) => t.id === hint.tile1Id);
        const p2 = this.getActiveBoardTiles().find((t) => t.id === hint.tile2Id);
        if (p1 && p2) {
          p1.value = 'chameleon';
          p1.label = '🦎 Camaleão';
          p2.value = 'chameleon';
          p2.label = '🦎 Camaleão';
        }
      }
      return {
        climate: 'heat_wave',
        icon: '☀️',
        title: 'Onda de Calor Solar!',
        description: 'O calor da savana transformou um par em Camaleões Coringa!',
      };
    }

    // 3. NEVASCA ÁRTICA ❄️
    if (biome === 'arctic') {
      const arcticMatches = this.recentBiomeMatches.filter((b) => b === 'arctic').length;
      if (arcticMatches >= 2) {
        let affectedBoardTiles: PlacedTile[] = [];
        const hint = this.getHintPair();
        if (hint) {
          const p1 = this.getActiveBoardTiles().find((t) => t.id === hint.tile1Id);
          const p2 = this.getActiveBoardTiles().find((t) => t.id === hint.tile2Id);
          if (p1 && p2 && p1 !== p2 && canMatch(p1, p2)) {
            p1.isRemoved = true;
            p2.isRemoved = true;
            affectedBoardTiles = [p1, p2];
          }
        }
        return {
          climate: 'arctic_blizzard',
          icon: '❄️',
          title: 'Nevasca Ártica!',
          description: affectedBoardTiles.length > 0
            ? 'O sopro congelante serena o tabuleiro e colheu um par completo com pureza!'
            : 'O ar puro dos picos nevados refrescou sua mente zen (+1 Dica)!',
          affectedBoardTiles: affectedBoardTiles.length > 0 ? affectedBoardTiles : undefined,
          rechargedTool: 'hint',
        };
      }
    }

    // 4. OUTONO DOURADO 🍂
    const forestGardenCount = this.recentBiomeMatches.filter((b) => b === 'forest' || b === 'garden').length;
    if ((biome === 'forest' || t1.value === 'acorn' || t1.value === 'apple' || t1.value === 'hedgehog') && forestGardenCount >= 2) {
      return {
        climate: 'autumn_gale',
        icon: '🍂',
        title: 'Outono Dourado!',
        description: 'Folhas douradas rodopiam pelo bosque e restauram +1 Misturar 🔀!',
        rechargedTool: 'shuffle',
      };
    }

    // 5. BRISA DA PRIMAVERA 🌸
    const gardenCount = this.recentBiomeMatches.filter((b) => b === 'garden').length;
    if ((biome === 'garden' || t1.value === 'butterfly' || t1.value === 'bee' || t1.value === 'ladybug') && gardenCount >= 2) {
      return {
        climate: 'spring_breeze',
        icon: '🌸',
        title: 'Brisa da Primavera!',
        description: 'Pétalas florais sopram sobre a mesa e restauram +1 Dica 💡!',
        rechargedTool: 'hint',
      };
    }

    // 6. NOITE DE LUA CHEIA 🌕
    if (this.consecutiveMatchesStreak >= 4 && (this.consecutiveMatchesStreak % 2 === 0)) {
      const freeTiles = this.getFreeTiles();
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

    // 7. TEMPESTADE ZEN 🌧️
    if (this.consecutiveMatchesStreak >= 3 && Math.random() < 0.6) {
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

  public undo(): UndoResult {
    if (this.history.length === 0) return { success: false };

    // Se houver peças na bandeja, desfaz a última adição à bandeja
    if (this.tray.length > 0) {
      for (let i = this.history.length - 1; i >= 0; i--) {
        const item = this.history[i];
        if (item.actionType === 'tray_add' && item.tile) {
          const trayTile = this.tray.find((t) => t.id === item.tile!.id);
          if (trayTile) {
            this.history.splice(i, 1);
            trayTile.inTray = false;
            trayTile.isRemoved = false;
            trayTile.isSelected = false;
            trayTile.isHinted = false;
            this.tray = this.tray.filter((t) => t.id !== trayTile.id);
            this.invalidateCache();
            return { success: true, type: 'tile_restored', tile: trayTile };
          }
        }
      }
    }

    // Se a bandeja está vazia, desfaz o último par combinado
    const lastItem = this.history.pop();
    if (!lastItem) return { success: false };

    if (lastItem.actionType === 'matched_pair' && lastItem.matchedPair) {
      const [m1, m2] = lastItem.matchedPair;
      m1.isRemoved = false;
      m1.inTray = false;
      m1.isSelected = false;
      m1.isHinted = false;

      m2.isRemoved = false;
      m2.inTray = false;
      m2.isSelected = false;
      m2.isHinted = false;

      if (lastItem.pointsAwarded && this.harmonyScore >= lastItem.pointsAwarded) {
        this.harmonyScore -= lastItem.pointsAwarded;
      }
      this.invalidateCache();
      return { success: true, type: 'pair_restored', pair: [m1, m2] };
    } else if (lastItem.actionType === 'tray_add' && lastItem.tile) {
      const trayTile = this.tray.find((t) => t.id === lastItem.tile!.id);
      if (trayTile) {
        trayTile.inTray = false;
        trayTile.isRemoved = false;
        trayTile.isSelected = false;
        trayTile.isHinted = false;
        this.tray = this.tray.filter((t) => t.id !== trayTile.id);
        this.invalidateCache();
        return { success: true, type: 'tile_restored', tile: trayTile };
      }
    }

    return { success: false };
  }

  public hammerRemove(tileId: string): boolean {
    const fromTray = this.tray.find((t) => t.id === tileId);
    if (fromTray) {
      fromTray.isRemoved = true;
      fromTray.inTray = false;
      this.tray = this.tray.filter((t) => t.id !== tileId);

      let partner = this.getActiveBoardTiles().find((t) => canMatch(t, fromTray));
      if (!partner) {
        partner = this.tray.find((t) => canMatch(t, fromTray));
        if (partner) {
          this.tray = this.tray.filter((t) => t.id !== partner!.id);
        }
      }
      if (partner) {
        partner.isRemoved = true;
        partner.inTray = false;
        this.resolveChameleonMirror(fromTray, partner);
      }

      this.history = this.history.filter((h) => {
        if (h.tile && (h.tile.id === fromTray.id || (partner && h.tile.id === partner.id))) return false;
        if (h.matchedPair && (h.matchedPair[0].id === fromTray.id || h.matchedPair[1].id === fromTray.id || (partner && (h.matchedPair[0].id === partner.id || h.matchedPair[1].id === partner.id)))) return false;
        return true;
      });

      this.checkAndResolveCosmicRescue();
      this.invalidateCache();
      return true;
    }

    const fromBoard = this.getActiveBoardTiles().find((t) => t.id === tileId && this.isTileFree(t));
    if (fromBoard) {
      fromBoard.isRemoved = true;
      let partner = this.getActiveBoardTiles().find((t) => canMatch(t, fromBoard));
      if (!partner) {
        partner = this.tray.find((t) => canMatch(t, fromBoard));
        if (partner) {
          this.tray = this.tray.filter((t) => t.id !== partner!.id);
        }
      }
      if (partner) {
        partner.isRemoved = true;
        partner.inTray = false;
        this.resolveChameleonMirror(fromBoard, partner);
      }
      this.history = this.history.filter((h) => {
        if (h.tile && (h.tile.id === fromBoard.id || (partner && h.tile.id === partner.id))) return false;
        if (h.matchedPair && (h.matchedPair[0].id === fromBoard.id || h.matchedPair[1].id === fromBoard.id || (partner && (h.matchedPair[0].id === partner.id || h.matchedPair[1].id === partner.id)))) return false;
        return true;
      });
      this.checkAndResolveCosmicRescue();
      this.invalidateCache();
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

    this.invalidateCache();
    return true;
  }

  public isVictory(): boolean {
    return this.isWaveCleared() && !this.hasMoreWaves() && this.tray.length === 0;
  }

  /**
   * Checa se o tabuleiro entrou em impasse total (bandeja cheia de 4 slots
   * sem nenhum par entre si e nenhuma peça livre na mesa que case com a bandeja).
   */
  public isDeadlocked(): boolean {
    if (this.tray.length < this.maxTraySlots) return false;

    // 1. Checa se existe par dentro da própria bandeja
    for (let i = 0; i < this.tray.length; i++) {
      for (let j = i + 1; j < this.tray.length; j++) {
        if (canMatch(this.tray[i], this.tray[j])) return false;
      }
    }

    // 2. Checa se alguma peça livre da mesa combina com qualquer peça da bandeja
    const free = this.getFreeTiles();
    for (const trayTile of this.tray) {
      if (free.some((b) => canMatch(b, trayTile))) return false;
    }

    return true;
  }

  /**
   * Resgate Zen: alivia a bandeja devolvendo a peça mais antiga suavemente ao tabuleiro
   */
  public zenRescue(): PlacedTile | null {
    if (this.tray.length === 0) return null;
    const rescued = this.tray.shift()!;
    rescued.inTray = false;
    rescued.isRemoved = false;
    rescued.isSelected = false;
    rescued.isHinted = false;
    this.invalidateCache();
    return rescued;
  }

  // ─── Geração de Tabuleiro / Onda ──────────────────────────────────────────

  private generateCurrentWave(): void {
    const rawSlots = this.waves[this.currentWaveIndex] || this.layout.slots;
    // Garante que o total de slots seja rigorosamente PAR (sem peças órfãs)
    const totalSlots = rawSlots.length % 2 === 0 ? rawSlots.length : rawSlots.length - 1;
    const slots = rawSlots.slice(0, totalSlots);
    const deck = createAnimalDeck();

    const pairsNeeded = totalSlots / 2;
    const selectedPairs: [TileDefinition, TileDefinition][] = [];

    // Embaralhar o deck
    const shuffledDeck = [...deck].sort(() => Math.random() - 0.5);

    let pairCount = 0;
    for (let i = 0; pairCount < pairsNeeded; i++) {
      const src = shuffledDeck[i % shuffledDeck.length];
      const p1: TileDefinition = {
        ...src,
        id: `${src.id}_w${this.currentWaveIndex}_p1_${pairCount}`,
      };
      const p2: TileDefinition = {
        ...src,
        id: `${src.id}_w${this.currentWaveIndex}_p2_${pairCount}`,
      };
      selectedPairs.push([p1, p2]);
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
      selectedPairs[0] = [
        chameleonDef,
        { ...chameleonDef, id: `${chameleonDef.id}_pair` },
      ];
    }

    const allPieces: TileDefinition[] = [];
    selectedPairs.forEach(([p1, p2]) => {
      allPieces.push(p1, p2);
    });
    allPieces.sort(() => Math.random() - 0.5);

    this.tiles = slots.map((s, idx) => {
      const def = allPieces[idx];
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
    this.invalidateCache();
  }
}
