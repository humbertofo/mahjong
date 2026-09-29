import { ThemeType } from '../core/types';

export interface UserPreferences {
  theme: ThemeType;
  soundEnabled: boolean;
  soundVolume: number;
  musicEnabled: boolean;
  musicVolume: number;
  hapticEnabled: boolean;
  showHelperNumbers: boolean;
  dimBlockedTiles: boolean;
  useEmojiMode: boolean;
}

export interface LevelStats {
  completed: boolean;
  timesPlayed: number;
  bestTimeSeconds?: number;
  bestScore?: number;
  stars: 0 | 1 | 2 | 3; // 0=não jogado, 1=completou, 2=ferramenta poupada ou sinergia, 3=ferramenta poupada e sinergia
}

export interface GlobalStats {
  totalGamesPlayed: number;
  totalGamesWon: number;
  totalPairsMatched: number;
  totalTimePlayed: number; // em segundos
  currentStreak: number;   // dias consecutivos
  lastPlayedDate: string;  // ISO date string
  highestLevelUnlocked: number; // índice 0-based
  totalSynergiesTriggered?: number;
}

export interface SavedProgress {
  currentLevelIndex: number; // índice no array ALL_LEVELS
  unlockedLevels: number[];  // índices desbloqueados
}

const PREFS_KEY    = 'mahjong_prefs_v2';
const STATS_KEY    = 'mahjong_stats_v2';
const GLOBAL_KEY   = 'mahjong_global_v2';
const PROGRESS_KEY = 'mahjong_progress_v2';

export class StorageManager {
  private static defaultPrefs: UserPreferences = {
    theme: 'mist-emerald',
    soundEnabled: true,
    soundVolume: 0.8,
    musicEnabled: true,
    musicVolume: 0.35,
    hapticEnabled: true,
    showHelperNumbers: true,
    dimBlockedTiles: true,
    useEmojiMode: true,
  };

  // ─── Memory Memoization Caches (Zero-Disk Lag / O(1) RAM Lookups) ──────────
  private static prefsCache: UserPreferences | null = null;
  private static statsCache: Map<string, LevelStats> = new Map();
  private static globalStatsCache: GlobalStats | null = null;
  private static progressCache: SavedProgress | null = null;

  public static clearMemoryCache(): void {
    this.statsCache.clear();
    this.prefsCache = null;
    this.globalStatsCache = null;
    this.progressCache = null;
  }

  // ─── Preferences ────────────────────────────────────────────────────────────

  public static getPreferences(): UserPreferences {
    if (this.prefsCache) {
      return { ...this.prefsCache };
    }
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<UserPreferences>;
        this.prefsCache = { ...this.defaultPrefs, ...parsed };
        return { ...this.prefsCache };
      }
    } catch { /* silent */ }
    this.prefsCache = { ...this.defaultPrefs };
    return { ...this.prefsCache };
  }

  public static savePreferences(prefs: UserPreferences): void {
    this.prefsCache = { ...prefs };
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch { /* silent */ }
  }

  // ─── Per-Level Stats ─────────────────────────────────────────────────────────

  public static getLevelStats(layoutId: string): LevelStats {
    const cached = this.statsCache.get(layoutId);
    if (cached) {
      return { ...cached };
    }
    try {
      const raw = localStorage.getItem(`${STATS_KEY}_${layoutId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.statsCache.set(layoutId, parsed);
        return { ...parsed };
      }
    } catch { /* silent */ }
    const defaultStat: LevelStats = { completed: false, timesPlayed: 0, stars: 0 };
    this.statsCache.set(layoutId, defaultStat);
    return { ...defaultStat };
  }

  /** Alias para compatibilidade com código antigo */
  public static getStats(layoutId: string): LevelStats {
    return this.getLevelStats(layoutId);
  }

  public static recordVictory(
    layoutId: string,
    timeSeconds: number,
    toolsRemaining: number = 0,
    synergiesTriggered: number = 0,
    score: number = 0
  ): LevelStats {
    const stats = this.getLevelStats(layoutId);
    stats.completed = true;
    stats.timesPlayed += 1;
    if (!stats.bestTimeSeconds || timeSeconds < stats.bestTimeSeconds) {
      stats.bestTimeSeconds = timeSeconds;
    }
    if (!stats.bestScore || score > stats.bestScore) {
      stats.bestScore = score;
    }

    // Critério 100% Zen de 3 Estrelas (Sem pressão de tempo, focado em contemplação):
    // 1★ = Completou o tabuleiro
    // 2★ = Poupou pelo menos 1 ferramenta OU ativou pelo menos 1 sinergia
    // 3★ = Poupou pelo menos 1 ferramenta E ativou pelo menos 1 sinergia/clima
    let earnedStars: 0 | 1 | 2 | 3 = 1;
    if (toolsRemaining > 0 && synergiesTriggered > 0) {
      earnedStars = 3;
    } else if (toolsRemaining > 0 || synergiesTriggered > 0) {
      earnedStars = 2;
    }

    if (earnedStars > stats.stars) {
      stats.stars = earnedStars;
    }

    this.statsCache.set(layoutId, { ...stats });
    try { localStorage.setItem(`${STATS_KEY}_${layoutId}`, JSON.stringify(stats)); } catch { /* silent */ }
    return stats;
  }

  /**
   * Grava todas as métricas de vitória de fase em lote atômico (Batch Victory Transaction).
   * Reduz múltiplas chamadas com I/O síncrono no localStorage para uma passagem unificada,
   * eliminando long tasks na CPU/eMMC do Android no momento da celebração de vitória.
   */
  public static recordVictoryBatch(params: {
    layoutId: string;
    timeSeconds: number;
    toolsRemaining: number;
    synergiesTriggered: number;
    score: number;
    pairsMatched: number;
    levelIndex: number;
    nextLevelIndex?: number;
  }): LevelStats {
    const {
      layoutId,
      timeSeconds,
      toolsRemaining,
      synergiesTriggered,
      score,
      pairsMatched,
      levelIndex,
      nextLevelIndex,
    } = params;

    // 1. Estatísticas do Tabuleiro Atual
    const stats = this.getLevelStats(layoutId);
    stats.completed = true;
    stats.timesPlayed += 1;
    if (!stats.bestTimeSeconds || timeSeconds < stats.bestTimeSeconds) {
      stats.bestTimeSeconds = timeSeconds;
    }
    if (!stats.bestScore || score > stats.bestScore) {
      stats.bestScore = score;
    }

    let earnedStars: 0 | 1 | 2 | 3 = 1;
    if (toolsRemaining > 0 && synergiesTriggered > 0) {
      earnedStars = 3;
    } else if (toolsRemaining > 0 || synergiesTriggered > 0) {
      earnedStars = 2;
    }
    if (earnedStars > stats.stars) {
      stats.stars = earnedStars;
    }
    this.statsCache.set(layoutId, { ...stats });

    // 2. Estatísticas Globais
    const g = this.getGlobalStats();
    g.totalGamesWon += 1;
    g.totalPairsMatched += pairsMatched;
    g.totalTimePlayed += timeSeconds;
    g.totalSynergiesTriggered = (g.totalSynergiesTriggered || 0) + synergiesTriggered;
    if (levelIndex > g.highestLevelUnlocked) g.highestLevelUnlocked = levelIndex;
    this.globalStatsCache = { ...g };

    // 3. Progresso e Desbloqueio da Próxima Fase
    let p: SavedProgress | null = null;
    if (nextLevelIndex !== undefined) {
      p = this.getProgress();
      if (!p.unlockedLevels.includes(nextLevelIndex)) {
        p.unlockedLevels.push(nextLevelIndex);
      }
      if (nextLevelIndex > p.currentLevelIndex) {
        p.currentLevelIndex = nextLevelIndex;
      }
      this.progressCache = {
        currentLevelIndex: p.currentLevelIndex,
        unlockedLevels: [...p.unlockedLevels],
      };
    }

    // Persistência em lote (passagem única de I/O)
    try {
      localStorage.setItem(`${STATS_KEY}_${layoutId}`, JSON.stringify(stats));
      localStorage.setItem(GLOBAL_KEY, JSON.stringify(g));
      if (p) {
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
      }
    } catch {
      /* silent */
    }

    return stats;
  }

  // ─── Global Stats ────────────────────────────────────────────────────────────

  public static getGlobalStats(): GlobalStats {
    if (this.globalStatsCache) {
      return { ...this.globalStatsCache };
    }
    try {
      const raw = localStorage.getItem(GLOBAL_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<GlobalStats>;
        this.globalStatsCache = {
          totalGamesPlayed: parsed.totalGamesPlayed ?? 0,
          totalGamesWon: parsed.totalGamesWon ?? 0,
          totalPairsMatched: parsed.totalPairsMatched ?? 0,
          totalTimePlayed: parsed.totalTimePlayed ?? 0,
          currentStreak: parsed.currentStreak ?? 0,
          lastPlayedDate: parsed.lastPlayedDate ?? '',
          highestLevelUnlocked: parsed.highestLevelUnlocked ?? 0,
          totalSynergiesTriggered: parsed.totalSynergiesTriggered ?? 0,
        };
        return { ...this.globalStatsCache };
      }
    } catch { /* silent */ }
    this.globalStatsCache = {
      totalGamesPlayed: 0,
      totalGamesWon: 0,
      totalPairsMatched: 0,
      totalTimePlayed: 0,
      currentStreak: 0,
      lastPlayedDate: '',
      highestLevelUnlocked: 0,
      totalSynergiesTriggered: 0,
    };
    return { ...this.globalStatsCache };
  }

  public static incrementGamesPlayed(): void {
    const g = this.getGlobalStats();
    g.totalGamesPlayed += 1;
    // Streak diário
    const today = new Date().toISOString().slice(0, 10);
    if (g.lastPlayedDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      g.currentStreak = g.lastPlayedDate === yesterday ? g.currentStreak + 1 : 1;
      g.lastPlayedDate = today;
    }
    this.globalStatsCache = { ...g };
    try { localStorage.setItem(GLOBAL_KEY, JSON.stringify(g)); } catch { /* silent */ }
  }

  public static incrementGamesWon(
    timeSeconds: number,
    pairsMatched: number,
    levelIndex: number,
    synergiesTriggered: number = 0
  ): void {
    const g = this.getGlobalStats();
    g.totalGamesWon += 1;
    g.totalPairsMatched += pairsMatched;
    g.totalTimePlayed += timeSeconds;
    g.totalSynergiesTriggered = (g.totalSynergiesTriggered || 0) + synergiesTriggered;
    if (levelIndex > g.highestLevelUnlocked) g.highestLevelUnlocked = levelIndex;
    this.globalStatsCache = { ...g };
    try { localStorage.setItem(GLOBAL_KEY, JSON.stringify(g)); } catch { /* silent */ }
  }

  // ─── Progress (Unlocked Levels) ──────────────────────────────────────────────

  public static getProgress(): SavedProgress {
    if (this.progressCache) {
      return {
        currentLevelIndex: this.progressCache.currentLevelIndex,
        unlockedLevels: [...this.progressCache.unlockedLevels],
      };
    }
    try {
      const raw = localStorage.getItem(PROGRESS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SavedProgress>;
        const progress: SavedProgress = {
          currentLevelIndex: parsed.currentLevelIndex ?? 0,
          unlockedLevels: Array.isArray(parsed.unlockedLevels) ? [...parsed.unlockedLevels] : [0],
        };
        this.progressCache = progress;
        return {
          currentLevelIndex: progress.currentLevelIndex,
          unlockedLevels: [...progress.unlockedLevels],
        };
      }
    } catch { /* silent */ }
    this.progressCache = { currentLevelIndex: 0, unlockedLevels: [0] };
    return { currentLevelIndex: 0, unlockedLevels: [0] };
  }

  public static unlockLevel(levelIndex: number): void {
    const p = this.getProgress();
    if (!p.unlockedLevels.includes(levelIndex)) {
      p.unlockedLevels.push(levelIndex);
    }
    if (levelIndex > p.currentLevelIndex) {
      p.currentLevelIndex = levelIndex;
    }
    this.progressCache = {
      currentLevelIndex: p.currentLevelIndex,
      unlockedLevels: [...p.unlockedLevels],
    };
    try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); } catch { /* silent */ }
  }

  public static isLevelUnlocked(levelIndex: number): boolean {
    if (levelIndex === 0) return true;
    const p = this.getProgress();
    return p.unlockedLevels.includes(levelIndex);
  }

  public static resetAllProgress(): void {
    this.statsCache.clear();
    this.prefsCache = null;
    this.globalStatsCache = null;
    this.progressCache = null;

    try {
      // 1. Redefinir progresso para a Fase 1
      localStorage.setItem(PROGRESS_KEY, JSON.stringify({ currentLevelIndex: 0, unlockedLevels: [0] }));

      // 2. Zerar estatísticas globais
      const resetGlobal: GlobalStats = {
        totalGamesPlayed: 0,
        totalGamesWon: 0,
        totalPairsMatched: 0,
        totalTimePlayed: 0,
        currentStreak: 0,
        lastPlayedDate: '',
        highestLevelUnlocked: 0,
        totalSynergiesTriggered: 0,
      };
      localStorage.setItem(GLOBAL_KEY, JSON.stringify(resetGlobal));

      // 3. Remover recordes e estatísticas de todas as pranchas
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith(STATS_KEY) || key.startsWith('mahjong_stats'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch { /* silent */ }
  }

  /**
   * Solicita persistência durável de dados no dispositivo (Android WebView / Browser Storage API)
   * garantindo que o progresso do jogador e savegame nunca sejam descartados pelo sistema operacional.
   */
  public static async requestPersistentStorage(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      try {
        const isPersisted = await navigator.storage.persisted();
        if (isPersisted) return true;
        return await navigator.storage.persist();
      } catch {
        return false;
      }
    }
    return false;
  }
}
