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
  stars: 0 | 1 | 2 | 3; // 0=nunca jogado, 1=completou, 2=<3min, 3=<1min
}

export interface GlobalStats {
  totalGamesPlayed: number;
  totalGamesWon: number;
  totalPairsMatched: number;
  totalTimePlayed: number; // em segundos
  currentStreak: number;   // dias consecutivos
  lastPlayedDate: string;  // ISO date string
  highestLevelUnlocked: number; // índice 0-based
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
    theme: 'felt-green',
    soundEnabled: true,
    soundVolume: 0.8,
    musicEnabled: true,
    musicVolume: 0.35,
    hapticEnabled: true,
    showHelperNumbers: true,
    dimBlockedTiles: true,
    useEmojiMode: true,
  };

  // ─── Preferences ────────────────────────────────────────────────────────────

  public static getPreferences(): UserPreferences {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (raw) return { ...this.defaultPrefs, ...JSON.parse(raw) };
    } catch { /* silent */ }
    return { ...this.defaultPrefs };
  }

  public static savePreferences(prefs: UserPreferences): void {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch { /* silent */ }
  }

  // ─── Per-Level Stats ─────────────────────────────────────────────────────────

  public static getLevelStats(layoutId: string): LevelStats {
    try {
      const raw = localStorage.getItem(`${STATS_KEY}_${layoutId}`);
      if (raw) return JSON.parse(raw);
    } catch { /* silent */ }
    return { completed: false, timesPlayed: 0, stars: 0 };
  }

  /** Alias para compatibilidade com código antigo */
  public static getStats(layoutId: string): LevelStats {
    return this.getLevelStats(layoutId);
  }

  public static recordVictory(layoutId: string, timeSeconds: number): LevelStats {
    const stats = this.getLevelStats(layoutId);
    stats.completed = true;
    stats.timesPlayed += 1;
    if (!stats.bestTimeSeconds || timeSeconds < stats.bestTimeSeconds) {
      stats.bestTimeSeconds = timeSeconds;
    }
    // Calcular estrelas
    if (timeSeconds < 60)       stats.stars = 3;
    else if (timeSeconds < 180) stats.stars = 2;
    else                        stats.stars = 1;

    try { localStorage.setItem(`${STATS_KEY}_${layoutId}`, JSON.stringify(stats)); } catch { /* silent */ }
    return stats;
  }

  // ─── Global Stats ────────────────────────────────────────────────────────────

  public static getGlobalStats(): GlobalStats {
    try {
      const raw = localStorage.getItem(GLOBAL_KEY);
      if (raw) return JSON.parse(raw);
    } catch { /* silent */ }
    return {
      totalGamesPlayed: 0,
      totalGamesWon: 0,
      totalPairsMatched: 0,
      totalTimePlayed: 0,
      currentStreak: 0,
      lastPlayedDate: '',
      highestLevelUnlocked: 0,
    };
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
    try { localStorage.setItem(GLOBAL_KEY, JSON.stringify(g)); } catch { /* silent */ }
  }

  public static incrementGamesWon(timeSeconds: number, pairsMatched: number, levelIndex: number): void {
    const g = this.getGlobalStats();
    g.totalGamesWon += 1;
    g.totalPairsMatched += pairsMatched;
    g.totalTimePlayed += timeSeconds;
    if (levelIndex > g.highestLevelUnlocked) g.highestLevelUnlocked = levelIndex;
    try { localStorage.setItem(GLOBAL_KEY, JSON.stringify(g)); } catch { /* silent */ }
  }

  // ─── Progress (Unlocked Levels) ──────────────────────────────────────────────

  public static getProgress(): SavedProgress {
    try {
      const raw = localStorage.getItem(PROGRESS_KEY);
      if (raw) return JSON.parse(raw);
    } catch { /* silent */ }
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
    try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); } catch { /* silent */ }
  }

  public static isLevelUnlocked(levelIndex: number): boolean {
    if (levelIndex === 0) return true;
    const p = this.getProgress();
    return p.unlockedLevels.includes(levelIndex);
  }
}
