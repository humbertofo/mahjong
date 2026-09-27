import { ALL_LAYOUTS, WORLDS } from '../core/layouts';
import { StorageManager } from '../storage/StorageManager';

export class HUDController {
  public static readonly MAX_HAMMER = 3;
  public static readonly MAX_SHUFFLE = 3;
  public static readonly MAX_HINT = 3;
  public static readonly MAX_UNDO = 5;

  public hammerCount: number = HUDController.MAX_HAMMER;
  public shuffleCount: number = HUDController.MAX_SHUFFLE;
  public hintCount: number = HUDController.MAX_HINT;
  public undoCount: number = HUDController.MAX_UNDO;

  // DOM Elements
  private badgeHammer!: HTMLElement;
  private badgeShuffle!: HTMLElement;
  private badgeHint!: HTMLElement;
  private badgeUndo!: HTMLElement;

  private hammerBtn!: HTMLButtonElement;
  private shuffleBtn!: HTMLButtonElement;
  private hintBtn!: HTMLButtonElement;
  private undoBtn!: HTMLButtonElement;

  private timerEl!: HTMLElement;
  private gameStartTime: number = 0;
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  public elapsedSeconds: number = 0;

  constructor() {
    this.bindDomElements();
  }

  private bindDomElements(): void {
    this.badgeHammer  = document.getElementById('badge-hammer')!;
    this.badgeShuffle = document.getElementById('badge-shuffle')!;
    this.badgeHint    = document.getElementById('badge-hint')!;
    this.badgeUndo    = document.getElementById('badge-undo')!;

    this.hammerBtn  = document.getElementById('btn-hammer')  as HTMLButtonElement;
    this.shuffleBtn = document.getElementById('btn-shuffle') as HTMLButtonElement;
    this.hintBtn    = document.getElementById('btn-hint')    as HTMLButtonElement;
    this.undoBtn    = document.getElementById('btn-undo')    as HTMLButtonElement;

    this.timerEl = document.getElementById('hud-timer')!;
  }

  public resetCharges(): void {
    this.hammerCount = HUDController.MAX_HAMMER;
    this.shuffleCount = HUDController.MAX_SHUFFLE;
    this.hintCount = HUDController.MAX_HINT;
    this.undoCount = HUDController.MAX_UNDO;
    this.updatePowerUpBadges(false);
  }

  public updatePowerUpBadges(canUndo: boolean): void {
    if (this.badgeHammer) {
      this.badgeHammer.textContent = `${this.hammerCount}`;
      this.badgeHammer.classList.toggle('depleted', this.hammerCount <= 0);
      if (this.hammerBtn) this.hammerBtn.disabled = this.hammerCount <= 0;
    }
    if (this.badgeShuffle) {
      this.badgeShuffle.textContent = `${this.shuffleCount}`;
      this.badgeShuffle.classList.toggle('depleted', this.shuffleCount <= 0);
      if (this.shuffleBtn) this.shuffleBtn.disabled = this.shuffleCount <= 0;
    }
    if (this.badgeHint) {
      this.badgeHint.textContent = `${this.hintCount}`;
      this.badgeHint.classList.toggle('depleted', this.hintCount <= 0);
      if (this.hintBtn) this.hintBtn.disabled = this.hintCount <= 0;
    }
    if (this.badgeUndo) {
      this.badgeUndo.textContent = `${this.undoCount}`;
      this.badgeUndo.classList.toggle('depleted', this.undoCount <= 0);
      if (this.undoBtn) this.undoBtn.disabled = this.undoCount <= 0 || !canUndo;
    }
  }

  public startTimer(): void {
    this.stopTimer();
    this.gameStartTime = Date.now();
    this.elapsedSeconds = 0;
    if (this.timerEl) this.timerEl.textContent = '00:00';

    this.timerInterval = setInterval(() => {
      this.elapsedSeconds = Math.floor((Date.now() - this.gameStartTime) / 1000);
      const m = Math.floor(this.elapsedSeconds / 60).toString().padStart(2, '0');
      const s = (this.elapsedSeconds % 60).toString().padStart(2, '0');
      if (this.timerEl) this.timerEl.textContent = `${m}:${s}`;
    }, 1000);
  }

  public stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  public updateMenuProgress(): number {
    const total = ALL_LAYOUTS.length;
    let done = 0;
    let totalStars = 0;

    ALL_LAYOUTS.forEach((layout) => {
      const stats = StorageManager.getLevelStats(layout.id);
      if (stats.completed) {
        done++;
        totalStars += stats.stars;
      }
    });

    const menuLevelsDone = document.getElementById('menu-levels-done');
    const menuLevelsTotal = document.getElementById('menu-levels-total');
    const menuProgressFill = document.getElementById('menu-progress-fill');
    const menuStarsTotal = document.getElementById('menu-stars-total');

    if (menuLevelsDone) menuLevelsDone.textContent = `${done}`;
    if (menuLevelsTotal) menuLevelsTotal.textContent = `${total}`;
    if (menuProgressFill) menuProgressFill.style.width = `${(done / total) * 100}%`;
    if (menuStarsTotal) menuStarsTotal.textContent = `⭐ ${totalStars}`;

    const progress = StorageManager.getProgress();
    const currentIdx = Math.min(progress.currentLevelIndex, total - 1);
    const menuPlaySub = document.getElementById('menu-play-sub');
    if (menuPlaySub) {
      menuPlaySub.textContent = `Fase ${currentIdx + 1} de ${total}`;
    }

    const currentWorld = WORLDS.find((w) => currentIdx >= w.levelRange[0] - 1 && currentIdx < w.levelRange[1]) || WORLDS[0];
    const menuBiomeCurrent = document.getElementById('menu-biome-current');
    if (menuBiomeCurrent) {
      menuBiomeCurrent.textContent = `${currentWorld.title} · Fase ${currentIdx + 1}`;
    }

    const menuJourneyStatus = document.getElementById('menu-journey-status');
    if (menuJourneyStatus) {
      menuJourneyStatus.textContent = done >= total ? '✨ Trilha Concluída!' : '🌿 Em harmonia';
    }

    return currentIdx;
  }
}
