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
  TileMutationRecord,
  TileSpecialType,
  LevelRuleDefinition,
  AnimalValue,
} from './types';
import { canMatch } from './deck';
import { getLevelRules } from './levelRules';
import { TileRuleEngine } from './engine/TileRuleEngine';
import { SynergyDirector, ANIMAL_BIOMES } from './engine/SynergyDirector';
import { TrayController, UndoResult } from './engine/TrayController';
import { ZenPowerManager } from './engine/ZenPowerManager';
import { LevelDeckCurator } from './nature/LevelDeckCurator';
import { SpecialTileRules } from './nature/specialTiles/SpecialTileRules';

export type { UndoResult };

export interface TileSelectionResult {
  action: 'added' | 'matched' | 'tray_full' | 'invalid' | 'special_action' | 'trio_matched';
  specialEffect?: 'ice_cracked' | 'rock_crushed' | 'vines_cut' | 'cocoon_hatched';
  matchedPair?: [PlacedTile, PlacedTile];
  tile?: PlacedTile;
  tray: PlacedTile[];
  isTrayFullWarning?: boolean;
  synergy?: SynergyResult;
  climateTriggered?: ClimateEffectResult;
  cosmicRescue?: PlacedTile[];
  waveCleared?: boolean;
  waveInfo?: WaveInfo;
  mutations?: TileMutationRecord[];
  vinesCutCount?: number;
  trioCandidateSpecies?: AnimalValue | null;
  isTrioMatch?: boolean;
  trioTile?: PlacedTile;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  FACHADA PRINCIPAL DO MOTOR DE JOGO (BOARD ENGINE FACADE)
 *  Orquestra os módulos: TileRuleEngine, TrayController, ZenPowerManager,
 *  SynergyDirector mantendo estabilidade e compatibilidade total de API.
 * ═══════════════════════════════════════════════════════════════════════════
 */
export class BoardEngine {
  private tiles: PlacedTile[] = [];
  private history: MoveHistoryItem[] = [];
  private layout: BoardLayout;

  // Submódulos especialistas
  private trayController: TrayController = new TrayController();

  // Cache de alta performance para 60 FPS
  private cachedFreeTileIds: Set<string> | null = null;
  private cachedActiveTiles: PlacedTile[] | null = null;

  // Estado Multi-Wave
  private waves: LayoutSlot[][] = [];
  private currentWaveIndex: number = 0;

  // Estado Climático, Sinergias & Pontuação de Harmonia
  private recentBiomeMatches: TileBiome[] = [];
  private consecutiveMatchesStreak: number = 0;
  private harmonyScore: number = 0;
  private levelRules: LevelRuleDefinition;

  // Trinca Sagrada Zen (candidata a trio na próxima jogada)
  private lastMatchedSpecies: { value: AnimalValue; biome: TileBiome } | null = null;

  public getActiveTrioCandidate(): AnimalValue | null {
    return this.lastMatchedSpecies ? this.lastMatchedSpecies.value : null;
  }

  constructor(layout: BoardLayout, levelIndex?: number) {
    this.layout = layout;
    const lInput = typeof levelIndex === 'number' ? levelIndex : layout.id;
    this.levelRules = layout.rules || getLevelRules(lInput, layout.slots.length);
    this.initWaves();
    this.generateCurrentWave();
  }

  // ─── Getters de Estado ───────────────────────────────────────────────────

  public getLevelRules(): LevelRuleDefinition {
    return this.levelRules;
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

  public get tray(): PlacedTile[] {
    return this.trayController.getTray();
  }

  public set tray(val: PlacedTile[]) {
    this.trayController.setTray(val);
  }

  public getTray(): PlacedTile[] {
    return this.trayController.getTray();
  }

  public getMaxTraySlots(): number {
    return this.trayController.getMaxTraySlots();
  }

  public getActiveBoardTiles(): PlacedTile[] {
    if (this.cachedActiveTiles) {
      return this.cachedActiveTiles;
    }
    this.cachedActiveTiles = this.tiles.filter((t) => !t.isRemoved && !t.inTray);
    return this.cachedActiveTiles;
  }

  public getRemainingCount(): number {
    return this.getActiveBoardTiles().length + this.getTray().length;
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
    this.invalidateCache();
    if (this.getActiveBoardTiles().length === 0) {
      if (this.getTray().length > 0) {
        this.checkAndResolveCosmicRescue();
      }
      return true;
    }
    return false;
  }

  public checkAndResolveCosmicRescue(): PlacedTile[] | null {
    return this.trayController.checkAndResolveCosmicRescue(
      this.getActiveBoardTiles().length,
      () => this.invalidateCache(),
      (pts) => { this.harmonyScore += pts; }
    );
  }

  public finalizeSynergyMatch(tiles: PlacedTile[]): PlacedTile[] | null {
    for (const t of tiles) {
      t.isRemoved = true;
      t.inSynergyAction = false;
      t.inSynergyPulled = false;
      t.inTray = false;
      t.isSelected = false;
    }
    this.invalidateCache();
    return this.checkAndResolveCosmicRescue();
  }

  public getWaveInfo(): WaveInfo {
    return {
      currentWave: this.getCurrentWave(),
      totalWaves: this.getTotalWaves(),
      remainingInWave: this.getActiveBoardTiles().length,
    };
  }

  public advanceToNextWave(): boolean {
    if (!this.hasMoreWaves()) return false;

    this.currentWaveIndex++;
    this.getTray().forEach((t) => {
      t.isRemoved = true;
      t.inTray = false;
    });
    this.trayController.clearTray();
    this.history = [];
    this.lastMatchedSpecies = null;

    this.generateCurrentWave();
    return true;
  }

  private initWaves(): void {
    if (this.layout.waves && this.layout.waves.length > 0) {
      this.waves = this.layout.waves.map((w) => w.slots);
      return;
    }

    const allSlots = [...this.layout.slots];
    const total = allSlots.length;

    if (total <= 60) {
      this.waves = [allSlots];
      return;
    }

    const sortedByZ = [...allSlots].sort((a, b) => b.z - a.z);

    if (total <= 88) {
      const half = Math.floor(total / 4) * 2;
      this.waves = [sortedByZ.slice(0, half), sortedByZ.slice(half)];
    } else {
      const part1 = Math.floor(total / 6) * 2;
      const part2 = Math.floor(total / 6) * 2;
      this.waves = [
        sortedByZ.slice(0, part1),
        sortedByZ.slice(part1, part1 + part2),
        sortedByZ.slice(part1 + part2),
      ];
    }

    for (let i = 0; i < this.waves.length; i++) {
      if (this.waves[i].length % 2 !== 0) {
        this.waves[i] = this.waves[i].slice(0, this.waves[i].length - 1);
      }
    }
  }

  // ─── Liberdade de Peças (Delegação TileRuleEngine) ─────────────────────────

  public getFreeTileIds(): Set<string> {
    if (this.cachedFreeTileIds) {
      return this.cachedFreeTileIds;
    }
    const freeSet = TileRuleEngine.computeFreeTileIds(this.getActiveBoardTiles());
    this.cachedFreeTileIds = freeSet;
    return freeSet;
  }

  public isTileFree(tile: PlacedTile): boolean {
    return TileRuleEngine.isTileFree(tile, this.getFreeTileIds());
  }

  public getFreeTiles(): PlacedTile[] {
    return TileRuleEngine.getFreeTiles(this.getActiveBoardTiles(), this.getFreeTileIds());
  }

  // ─── Seleção e Jogadas ────────────────────────────────────────────────────

  public selectTile(tileId: string): TileSelectionResult {
    const tile = this.tiles.find((t) => t.id === tileId);
    if (!tile || tile.isRemoved || tile.inTray || !this.isTileFree(tile)) {
      return { action: 'invalid', tray: [...this.getTray()] };
    }

    // ─── Gelo (ice): 1º toque trinca na mesa sem entrar na bandeja ─────
    if (tile.specialType === 'ice') {
      tile.specialType = 'normal';
      this.invalidateCache();
      return {
        action: 'special_action',
        specialEffect: 'ice_cracked',
        tile,
        tray: [...this.getTray()],
      };
    }

    // ─── Rocha (rock): esfarela na mesa sem entrar na bandeja ───────────
    if (tile.specialType === 'rock') {
      tile.isRemoved = true;
      tile.inTray = false;
      this.harmonyScore += 150;
      this.invalidateCache();

      let cosmicRescue: PlacedTile[] | undefined;
      const rescued = this.checkAndResolveCosmicRescue();
      if (rescued && rescued.length > 0) cosmicRescue = rescued;
      const waveCleared = this.isWaveCleared();

      return {
        action: 'special_action',
        specialEffect: 'rock_crushed',
        tile,
        tray: [...this.getTray()],
        cosmicRescue,
        waveCleared,
      };
    }

    // ─── Trinca Sagrada Zen (3ª Peça da Mesma Espécie) ──────────────────
    if (this.lastMatchedSpecies && tile.value === this.lastMatchedSpecies.value) {
      tile.isRemoved = true;
      tile.inTray = false;
      tile.isSelected = false;
      tile.isHinted = false;
      this.invalidateCache();

      const mutations: TileMutationRecord[] = [];
      const fourthTile = this.tiles.find(
        (t) => !t.isRemoved && t.id !== tile.id && t.value === tile.value
      );
      if (fourthTile) {
        const mut = SpecialTileRules.transmuteToChameleon(fourthTile, () => this.invalidateCache());
        mutations.push(mut);
      }

      this.consecutiveMatchesStreak++;
      const climateTriggered = SynergyDirector.evaluateClimate(
        tile,
        this.recentBiomeMatches,
        this.getTray(),
        this.consecutiveMatchesStreak,
        () => this.getActiveBoardTiles(),
        () => this.getHintPair(),
        () => this.getFreeTiles(),
        (pts) => { this.harmonyScore += pts; },
        true
      );

      const pointsAwarded = 500;
      this.harmonyScore += pointsAwarded;

      const secondaryRemovedTiles: PlacedTile[] = [];
      if (climateTriggered?.affectedBoardTiles) secondaryRemovedTiles.push(...climateTriggered.affectedBoardTiles);
      if (climateTriggered?.eliminatedBoardPairs) secondaryRemovedTiles.push(...climateTriggered.eliminatedBoardPairs);
      if (climateTriggered?.mutations) mutations.push(...climateTriggered.mutations);

      this.history.push({
        actionType: 'trio_match',
        trioTile: tile,
        pointsAwarded,
        secondaryRemovedTiles: secondaryRemovedTiles.length > 0 ? secondaryRemovedTiles : undefined,
        mutations: mutations.length > 0 ? mutations : undefined,
        rechargedTool: climateTriggered?.rechargedTool,
      });

      this.lastMatchedSpecies = null;

      let cosmicRescue: PlacedTile[] | undefined;
      const rescued = this.checkAndResolveCosmicRescue();
      if (rescued && rescued.length > 0) cosmicRescue = rescued;
      const waveCleared = this.isWaveCleared();

      return {
        action: 'trio_matched',
        isTrioMatch: true,
        trioTile: tile,
        tile,
        tray: [...this.getTray()],
        climateTriggered: climateTriggered || undefined,
        cosmicRescue,
        waveCleared,
        waveInfo: this.getWaveInfo(),
        mutations: mutations.length > 0 ? mutations : undefined,
        trioCandidateSpecies: null,
      };
    }

    // Se o jogador tocou em outra espécie, reseta o candidato a Trinca
    this.lastMatchedSpecies = null;

    if (this.getTray().length >= this.getMaxTraySlots()) {
      return { action: 'tray_full', tray: [...this.getTray()], isTrayFullWarning: true };
    }

    this.trayController.addTile(tile);
    this.invalidateCache();

    const tray = this.getTray();
    const matchingIdx = tray.findIndex(
      (t) => t.id !== tile.id && canMatch(t, tile)
    );

    if (matchingIdx !== -1) {
      const match1 = tray[matchingIdx];
      const match2 = tile;

      const chamMutation = SynergyDirector.resolveChameleonMirror(
        match1,
        match2,
        this.tiles,
        () => this.invalidateCache()
      );

      this.trayController.removeTiles(new Set([match1.id, match2.id]));

      this.consecutiveMatchesStreak++;
      const biome = ANIMAL_BIOMES[match1.value] || 'forest';
      this.recentBiomeMatches.push(biome);
      if (this.recentBiomeMatches.length > 4) {
        this.recentBiomeMatches.shift();
      }

      const synergy = SynergyDirector.evaluateSynergy(
        match1,
        match2,
        () => this.getActiveBoardTiles(),
        () => this.shuffleRemaining(),
        this.getTray()
      );

      const secondaryRemovedTiles: PlacedTile[] = [];

      // Alívio na Bandeja (Tray Rescue da Sinergia)
      if (synergy?.clearedTrayTiles && synergy.clearedTrayTiles.length > 0) {
        this.trayController.removeTiles(new Set(synergy.clearedTrayTiles.map((t) => t.id)));
        synergy.clearedTrayTiles.forEach((t) => {
          t.isRemoved = true;
          t.inTray = false;
        });
        secondaryRemovedTiles.push(...synergy.clearedTrayTiles);
      }

      const isTheatrical = SynergyDirector.isTheatrical(synergy);

      if (isTheatrical) {
        match2.inSynergyAction = true;
        match2.isRemoved = false;
        match2.inTray = false;

        match1.isRemoved = true;
        match1.inTray = false;
        match1.inSynergyAction = false;

        if (synergy?.affectedBoardTiles) {
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

      let climateTriggered = SynergyDirector.evaluateClimate(
        match1,
        this.recentBiomeMatches,
        this.getTray(),
        this.consecutiveMatchesStreak,
        () => this.getActiveBoardTiles(),
        () => this.getHintPair(),
        () => this.getFreeTiles(),
        (pts) => { this.harmonyScore += pts; },
        false
      );

      // Baú da Fortuna 🎁
      if (match1.specialType === 'chest' || match2.specialType === 'chest') {
        const tools: ('hammer' | 'shuffle' | 'hint')[] = ['hammer', 'shuffle', 'hint'];
        const awardedTool = tools[Math.floor(Math.random() * tools.length)];
        if (!climateTriggered) {
          climateTriggered = {
            climate: 'zen_storm',
            icon: '🎁',
            title: 'Baú da Fortuna Aberto!',
            description: `Você abriu um Baú Dourado e recebeu +1 ${awardedTool === 'hammer' ? 'Marreta 🔨' : awardedTool === 'hint' ? 'Dica 💡' : 'Misturar 🔀'}!`,
            rechargedTool: awardedTool,
          };
        }
      }

      let pointsAwarded = 100;
      if (synergy?.bonusScore) pointsAwarded += synergy.bonusScore;
      if (climateTriggered) pointsAwarded += 200;

      // ─── Efeitos de Adjacência: Corte de Cipós & Eclosão de Casulos ─────
      const activeBoard = this.getActiveBoardTiles();
      const isAdjacent = (target: PlacedTile, source: PlacedTile) => {
        return (
          Math.abs(target.position.x - source.position.x) <= 1.5 &&
          Math.abs(target.position.y - source.position.y) <= 1.5 &&
          Math.abs(target.position.z - source.position.z) <= 1
        );
      };

      const mutations: TileMutationRecord[] = [];
      if (chamMutation) mutations.push(chamMutation);

      let vinesCutCount = 0;
      for (const t of activeBoard) {
        if (isAdjacent(t, match1) || isAdjacent(t, match2)) {
          if (t.specialType === 'vines') {
            t.specialType = 'normal';
            this.harmonyScore += 50;
            pointsAwarded += 50;
            vinesCutCount++;
          } else if (t.specialType === 'cocoon') {
            mutations.push({
              tile: t,
              prevValue: t.value,
              prevLabel: t.label,
              prevSuit: t.suit,
            });
            t.specialType = 'normal';
            t.value = 'chameleon';
            t.label = 'Camaleão';
            t.suit = 'animal';
            this.harmonyScore += 100;
            pointsAwarded += 100;
          }
        }
      }

      this.harmonyScore += pointsAwarded;

      if (synergy?.affectedBoardTiles) secondaryRemovedTiles.push(...synergy.affectedBoardTiles);
      if (climateTriggered?.affectedBoardTiles) secondaryRemovedTiles.push(...climateTriggered.affectedBoardTiles);
      if (climateTriggered?.eliminatedBoardPairs) secondaryRemovedTiles.push(...climateTriggered.eliminatedBoardPairs);

      if (climateTriggered?.mutations) mutations.push(...climateTriggered.mutations);

      const mirrorTiles = this.getActiveBoardTiles().filter((t) => t.specialType === 'mirror');
      for (const mir of mirrorTiles) {
        if (!chamMutation || chamMutation.tile.id !== mir.id) {
          mutations.push({
            tile: mir,
            prevValue: mir.value,
            prevLabel: mir.label,
            prevSuit: mir.suit,
          });
          mir.value = match1.value;
          mir.label = match1.label;
          mir.suit = match1.suit;
        }
      }

      this.history.push({
        actionType: 'matched_pair',
        matchedPair: [match1, match2],
        pointsAwarded,
        secondaryRemovedTiles: secondaryRemovedTiles.length > 0 ? secondaryRemovedTiles : undefined,
        mutations: mutations.length > 0 ? mutations : undefined,
        rechargedTool: climateTriggered?.rechargedTool,
      });

      let cosmicRescue: PlacedTile[] | undefined;
      const rescued = this.checkAndResolveCosmicRescue();
      if (rescued && rescued.length > 0) cosmicRescue = rescued;

      const waveCleared = this.isWaveCleared();

      // Consagra a espécie como candidata à Trinca Sagrada na próxima jogada
      this.lastMatchedSpecies = { value: match1.value, biome };

      return {
        action: 'matched',
        matchedPair: [match1, match2],
        tray: [...this.getTray()],
        synergy: synergy || undefined,
        climateTriggered: climateTriggered || undefined,
        cosmicRescue,
        waveCleared,
        waveInfo: this.getWaveInfo(),
        mutations: mutations.length > 0 ? mutations : undefined,
        vinesCutCount: vinesCutCount > 0 ? vinesCutCount : undefined,
        trioCandidateSpecies: match1.value,
      };
    }

    this.history.push({
      actionType: 'tray_add',
      tile: { ...tile },
      fromBoardToTrayIndex: this.getTray().length - 1,
    });

    this.trayController.sortTray();

    let cosmicRescue: PlacedTile[] | undefined;
    const rescued = this.checkAndResolveCosmicRescue();
    if (rescued && rescued.length > 0) cosmicRescue = rescued;

    const isFull = this.getTray().length >= this.getMaxTraySlots();
    const waveCleared = this.isWaveCleared();

    this.lastMatchedSpecies = null;

    return {
      action: 'added',
      tile,
      tray: [...this.getTray()],
      isTrayFullWarning: isFull,
      cosmicRescue,
      waveCleared,
      waveInfo: this.getWaveInfo(),
      trioCandidateSpecies: null,
    };
  }

  // ─── Dicas, Poderes Zen & Desfazer (Delegação Especialistas) ───────────────

  public getHintPair(): MatchPair | null {
    return ZenPowerManager.getHintPair(this.getFreeTiles(), this.getTray());
  }

  public undo(): UndoResult {
    this.lastMatchedSpecies = null;
    return this.trayController.undo(
      this.history,
      () => this.harmonyScore,
      (pts) => { this.harmonyScore -= pts; },
      () => this.invalidateCache()
    );
  }

  public undoSpecificTrayTile(tileId: string): UndoResult {
    return this.trayController.undoSpecificTrayTile(
      tileId,
      this.history,
      () => this.invalidateCache()
    );
  }

  public hammerRemove(tileId: string): boolean {
    return ZenPowerManager.hammerRemove(
      tileId,
      this.trayController,
      () => this.getActiveBoardTiles(),
      this.tiles,
      (tile) => this.isTileFree(tile),
      () => this.history,
      (h) => { this.history = h; },
      () => this.invalidateCache(),
      () => this.checkAndResolveCosmicRescue()
    );
  }

  public shuffleRemaining(): boolean {
    return ZenPowerManager.shuffleRemaining(
      this.getActiveBoardTiles(),
      () => this.invalidateCache()
    );
  }

  public isVictory(): boolean {
    if (this.getActiveBoardTiles().length === 0 && this.getTray().length > 0) {
      this.checkAndResolveCosmicRescue();
    }
    return this.isWaveCleared() && !this.hasMoreWaves() && this.getTray().length === 0;
  }

  public isDeadlocked(): boolean {
    return ZenPowerManager.isDeadlocked(
      this.getTray(),
      this.getMaxTraySlots(),
      this.getFreeTiles()
    );
  }

  public zenRescue(): PlacedTile | null {
    return this.trayController.zenRescue(() => this.invalidateCache());
  }

  // ─── Geração de Tabuleiro / Onda ──────────────────────────────────────────

  private generateCurrentWave(): void {
    const rawSlots = this.waves[this.currentWaveIndex] || this.layout.slots;
    const totalSlots = rawSlots.length % 2 === 0 ? rawSlots.length : rawSlots.length - 1;
    const slots = rawSlots.slice(0, totalSlots);
    const pairsNeeded = totalSlots / 2;
    const selectedPairs = LevelDeckCurator.curateWavePairs(
      this.levelRules.biome || 'forest',
      pairsNeeded,
      this.currentWaveIndex,
      this.levelRules.allowChameleon,
      this.levelRules.chameleonChance,
      this.levelRules.worldTier || 10
    );
    const pairCount = selectedPairs.length;

    const specialMap = new Map<number, TileSpecialType>();
    const allowed = this.levelRules.allowedSpecials;
    if (allowed.length > 0 && pairCount >= 8) {
      const count = Math.min(this.levelRules.maxSpecialPairs, Math.max(1, Math.floor(pairCount / 7)));
      for (let sIdx = 1; sIdx <= count; sIdx++) {
        const chosen = allowed[Math.floor(Math.random() * allowed.length)];
        specialMap.set(sIdx, chosen);
      }
    }

    interface TaggedPiece extends TileDefinition {
      specialType: TileSpecialType;
    }

    const allPieces: TaggedPiece[] = [];
    selectedPairs.forEach(([p1, p2], pIdx) => {
      const sp = p1.value === 'chameleon' ? 'chameleon' : (specialMap.get(pIdx) || 'normal');
      allPieces.push({ ...p1, specialType: sp }, { ...p2, specialType: sp });
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
        specialType: def.specialType,
      };
    });
    this.invalidateCache();
  }
}
