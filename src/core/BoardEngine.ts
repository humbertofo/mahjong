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

    // Garantir estritamente paridade par em cada onda (zero peças órfãs)
    for (let i = 0; i < this.waves.length; i++) {
      if (this.waves[i].length % 2 !== 0) {
        this.waves[i] = this.waves[i].slice(0, this.waves[i].length - 1);
      }
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
      // Enxame Dourado: para a peça da bandeja, encontra sua parceira na mesa e elimina o PAR COMPLETO!
      let clearedTrayTiles: PlacedTile[] = [];
      let affectedBoardTiles: PlacedTile[] = [];
      if (this.tray.length > 0) {
        const candidate = this.tray[this.tray.length - 1];
        const partner = this.getActiveBoardTiles().find((t) => canMatch(t, candidate));
        if (partner) {
          this.tray.pop();
          candidate.isRemoved = true;
          candidate.inTray = false;
          partner.isRemoved = true;
          clearedTrayTiles.push(candidate);
          affectedBoardTiles.push(partner);
        } else {
          // Devolve suavemente a peça para a mesa (sem destruir solitária)
          this.tray.pop();
          candidate.inTray = false;
          candidate.isRemoved = false;
        }
      }
      return {
        type: 'bee_honey',
        title: '🐝🍯 Enxame Dourado!',
        description: affectedBoardTiles.length > 0
          ? 'O enxame de abelhas encontrou o par completo e abriu espaço na bandeja!'
          : 'O enxame de abelhas reorganizou a bandeja com doçura!',
        bonusScore: 250,
        clearedTrayTiles,
        affectedBoardTiles,
      };
    }

    // Urso + Mel ou Urso + Peixe
    if ((v1 === 'bear' && (v2 === 'honeycomb' || v2 === 'fish')) ||
        ((v1 === 'honeycomb' || v1 === 'fish') && v2 === 'bear')) {
      // Banquete do Urso: remove o PAR COMPLETO (2 peças correspondentes) na mesa!
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
      if (affectedBoardTiles.length === 0) {
        const active = this.getActiveBoardTiles();
        for (let i = 0; i < active.length; i++) {
          for (let j = i + 1; j < active.length; j++) {
            if (canMatch(active[i], active[j])) {
              active[i].isRemoved = true;
              active[j].isRemoved = true;
              affectedBoardTiles = [active[i], active[j]];
              break;
            }
          }
          if (affectedBoardTiles.length > 0) break;
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
      let affectedBoardTiles: PlacedTile[] = [];
      if (this.tray.length > 0) {
        const candidate = this.tray[0];
        const partner = this.getActiveBoardTiles().find((t) => canMatch(t, candidate));
        if (partner) {
          this.tray.shift();
          candidate.isRemoved = true;
          candidate.inTray = false;
          partner.isRemoved = true;
          clearedTrayTiles.push(candidate);
          affectedBoardTiles.push(partner);
        } else {
          this.tray.shift();
          candidate.inTray = false;
          candidate.isRemoved = false;
        }
      }
      return {
        type: 'squirrel_acorn',
        title: '🐿️🌰 Reserva Secreta!',
        description: affectedBoardTiles.length > 0
          ? 'O esquilo recolheu o par completo e guardou na toca segura!'
          : 'O esquilo abriu espaço na sua bandeja com agilidade!',
        bonusScore: 200,
        clearedTrayTiles,
        affectedBoardTiles,
      };
    }

    // Sapo + Insetos OU Sapo + Sapo: Língua Elástica
    if ((v1 === 'frog' && (v2 === 'ladybug' || v2 === 'bee')) ||
        ((v1 === 'ladybug' || v1 === 'bee') && v2 === 'frog') ||
        (v1 === 'frog' && v2 === 'frog')) {
      let clearedTrayTiles: PlacedTile[] = [];
      let affectedBoardTiles: PlacedTile[] = [];

      // 1. Verifica se há inseto preso na bandeja para aliviar a bandeja
      const trayInsectIndex = this.tray.findIndex((t) => t.value === 'ladybug' || t.value === 'bee');
      if (trayInsectIndex !== -1) {
        const trayInsect = this.tray[trayInsectIndex];
        const boardPartner = this.getActiveBoardTiles().find((t) => canMatch(t, trayInsect));
        if (boardPartner) {
          this.tray.splice(trayInsectIndex, 1);
          trayInsect.isRemoved = true;
          trayInsect.inTray = false;
          boardPartner.isRemoved = true;
          clearedTrayTiles.push(trayInsect);
          affectedBoardTiles.push(boardPartner);
        }
      }

      // 2. Se a bandeja não tinha inseto, puxa um par completo de insetos da mesa
      if (affectedBoardTiles.length === 0) {
        const active = this.getActiveBoardTiles();
        const insectA = active.find((t) => t.value === 'ladybug' || t.value === 'bee');
        if (insectA) {
          const insectB = active.find((t) => t !== insectA && canMatch(t, insectA));
          if (insectB) {
            insectA.isRemoved = true;
            insectB.isRemoved = true;
            affectedBoardTiles.push(insectA, insectB);
          }
        }
      }

      return {
        type: 'frog_tongue',
        title: '🐸 Língua Ágil!',
        description: clearedTrayTiles.length > 0
          ? 'O sapo esticou a língua, limpou a bandeja e puxou o inseto da mesa!'
          : affectedBoardTiles.length > 0
            ? 'O sapo esticou a língua elástica e capturou um par de insetos!'
            : 'O sapinho saltou com agilidade zen pela lagoa!',
        bonusScore: 240,
        clearedTrayTiles,
        affectedBoardTiles,
      };
    }

    // Gato + Peixe OU Gato + Gato: Pata Ágil
    if ((v1 === 'cat' && v2 === 'fish') || (v1 === 'fish' && v2 === 'cat') || (v1 === 'cat' && v2 === 'cat')) {
      let affectedBoardTiles: PlacedTile[] = [];
      const active = this.getActiveBoardTiles();
      const fishA = active.find((t) => t.value === 'fish');
      if (fishA) {
        const fishB = active.find((t) => t !== fishA && canMatch(t, fishA));
        if (fishB) {
          fishA.isRemoved = true;
          fishB.isRemoved = true;
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
        const shellB = active.find((t) => t !== shellA && canMatch(t, shellA));
        if (shellB) {
          shellA.isRemoved = true;
          shellB.isRemoved = true;
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
        const appleB = active.find((t) => t !== appleA && canMatch(t, appleA));
        if (appleB) {
          appleA.isRemoved = true;
          appleB.isRemoved = true;
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
      // Chance de ativar quando ocorrem 2 matches de água ou bandeja sob pressão
      const waterMatches = this.recentBiomeMatches.filter((b) => b === 'water').length;
      if (waterMatches >= 2 || (this.tray.length >= 2 && Math.random() < 0.6)) {
        // Lava e esvazia a bandeja com segurança matemática de paridade:
        const clearedTray: PlacedTile[] = [];
        const affectedBoardTiles: PlacedTile[] = [];
        const tilesToProcess = [...this.tray];
        this.tray = [];

        for (const t of tilesToProcess) {
          // Procura parceira correspondente na mesa
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
            // Se não encontrou parceira livre imediata, devolve com segurança para a mesa
            t.inTray = false;
            t.isRemoved = false;
          }
        }

        // Chance de 50% de eliminar mais 1 par livre da mesa!
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
      // Transforma um PAR completo em Camaleões Coringa, mantendo a paridade estrita!
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
  }
}
