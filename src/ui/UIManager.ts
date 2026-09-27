import { BoardEngine } from '../core/BoardEngine';
import { BoardRenderer } from '../render/BoardRenderer';
import { ALL_LAYOUTS, WORLDS } from '../core/layouts';
import { StorageManager } from '../storage/StorageManager';
import { soundManager } from '../audio/SoundManager';
import { hapticManager } from '../audio/HapticManager';
import { PlacedTile, SynergyResult, ClimateEffectResult } from '../core/types';
import { LiveUpdateManager } from '../core/LiveUpdateManager';
import confetti from 'canvas-confetti';

export class UIManager {
  private engine: BoardEngine;
  private renderer: BoardRenderer;
  private prefs = StorageManager.getPreferences();
  private currentLevelIndex: number = 0;
  private isHammerActive: boolean = false;

  // Limite de Cargas por Fase
  public static readonly MAX_HAMMER = 3;
  public static readonly MAX_SHUFFLE = 3;
  public static readonly MAX_HINT = 3;
  public static readonly MAX_UNDO = 5;

  private hammerCount: number = UIManager.MAX_HAMMER;
  private shuffleCount: number = UIManager.MAX_SHUFFLE;
  private hintCount: number = UIManager.MAX_HINT;
  private undoCount: number = UIManager.MAX_UNDO;

  // DOM — Badges de Cargas
  private badgeHammer!: HTMLElement;
  private badgeShuffle!: HTMLElement;
  private badgeHint!: HTMLElement;
  private badgeUndo!: HTMLElement;

  // Timer de jogo
  private gameStartTime: number = 0;
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private elapsedSeconds: number = 0;

  // Contador de pares combinados e sinergias na partida atual
  private pairsMatchedThisGame: number = 0;
  private synergiesTriggeredThisGame: number = 0;
  private isRestarting: boolean = false;

  // DOM — Screens
  private screenMenu!: HTMLElement;
  private screenGame!: HTMLElement;

  // DOM — Menu
  private menuLevelsDone!: HTMLElement;
  private menuLevelsTotal!: HTMLElement;
  private menuProgressFill!: HTMLElement;
  private menuStarsTotal!: HTMLElement;

  // DOM — Tray
  private traySlotsContainer!: HTMLElement;
  private traySlotEls: HTMLElement[] = [];
  private traySlotCanvases: HTMLCanvasElement[] = [];
  private flyerPool: { el: HTMLElement; canvas: HTMLCanvasElement; inUse: boolean }[] = [];

  // DOM — HUD Buttons
  private undoBtn!: HTMLButtonElement;
  private hintBtn!: HTMLButtonElement;
  private shuffleBtn!: HTMLButtonElement;
  private hammerBtn!: HTMLButtonElement;
  private restartBtn!: HTMLButtonElement;
  private levelsBtn!: HTMLButtonElement;
  private settingsBtn!: HTMLButtonElement;
  private menuBackBtn!: HTMLButtonElement;
  private timerEl!: HTMLElement;

  // DOM — Modals
  private levelsModal!: HTMLElement;
  private settingsModal!: HTMLElement;
  private victoryModal!: HTMLElement;
  private statsModal!: HTMLElement;

  constructor(engine: BoardEngine, renderer: BoardRenderer) {
    this.engine = engine;
    this.renderer = renderer;

    this.applyPreferences();
    this.bindDomElements();
    this.attachEvents();
    this.showMenu();
  }

  // ─── Preferences ──────────────────────────────────────────────────────────

  private applyPreferences(): void {
    this.renderer.setTheme(this.prefs.theme);
    this.renderer.setTileOptions(this.prefs.showHelperNumbers, this.prefs.dimBlockedTiles, this.prefs.useEmojiMode);
    soundManager.setMuted(!this.prefs.soundEnabled);
    soundManager.setVolume(this.prefs.soundVolume);
    soundManager.setMusicEnabled(this.prefs.musicEnabled);
    soundManager.setMusicVolume(this.prefs.musicVolume);
    hapticManager.setEnabled(this.prefs.hapticEnabled);
  }

  // ─── DOM Binding ──────────────────────────────────────────────────────────

  private bindDomElements(): void {
    this.screenMenu = document.getElementById('screen-menu')!;
    this.screenGame = document.getElementById('screen-game')!;

    this.menuLevelsDone  = document.getElementById('menu-levels-done')!;
    this.menuLevelsTotal = document.getElementById('menu-levels-total')!;
    this.menuProgressFill = document.getElementById('menu-progress-fill')!;
    this.menuStarsTotal  = document.getElementById('menu-stars-total')!;

    this.traySlotsContainer = document.getElementById('tray-slots')!;
    this.traySlotEls = Array.from(document.querySelectorAll('.tray-slot'));

    // Pre-alocar canvas reutilizáveis nos 4 slots para reciclagem perfeita sem GC
    this.traySlotCanvases = this.traySlotEls.map((slotEl) => {
      slotEl.innerHTML = '';
      const canvas = document.createElement('canvas');
      canvas.className = 'tray-tile-canvas';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.display = 'none';
      slotEl.appendChild(canvas);
      return canvas;
    });

    this.undoBtn    = document.getElementById('btn-undo')    as HTMLButtonElement;
    this.hintBtn    = document.getElementById('btn-hint')    as HTMLButtonElement;
    this.shuffleBtn = document.getElementById('btn-shuffle') as HTMLButtonElement;
    this.hammerBtn  = document.getElementById('btn-hammer')  as HTMLButtonElement;
    this.restartBtn = document.getElementById('btn-restart') as HTMLButtonElement;
    this.levelsBtn  = document.getElementById('btn-levels')  as HTMLButtonElement;
    this.settingsBtn = document.getElementById('btn-settings') as HTMLButtonElement;
    this.menuBackBtn = document.getElementById('btn-menu-back') as HTMLButtonElement;
    this.timerEl    = document.getElementById('hud-timer')!;

    this.levelsModal  = document.getElementById('modal-levels')!;
    this.settingsModal = document.getElementById('modal-settings')!;
    this.victoryModal = document.getElementById('modal-victory')!;
    this.statsModal   = document.getElementById('modal-stats')!;

    this.badgeHammer  = document.getElementById('badge-hammer')!;
    this.badgeShuffle = document.getElementById('badge-shuffle')!;
    this.badgeHint    = document.getElementById('badge-hint')!;
    this.badgeUndo    = document.getElementById('badge-undo')!;
  }

  // ─── Events ───────────────────────────────────────────────────────────────

  private attachEvents(): void {
    // Menu principal
    document.getElementById('btn-menu-play')?.addEventListener('click', () => {
      this.startGame(this.currentLevelIndex);
    });
    document.getElementById('btn-menu-levels')?.addEventListener('click', () => {
      this.renderLevelsList();
      this.levelsModal.classList.remove('hidden');
    });
    document.getElementById('btn-menu-stats')?.addEventListener('click', () => {
      this.renderStats();
      this.statsModal.classList.remove('hidden');
    });

    // Voltar ao menu
    this.menuBackBtn.addEventListener('click', () => {
      this.stopTimer();
      this.showMenu();
    });

    // Reiniciar
    this.restartBtn.addEventListener('click', () => {
      if (confirm('Reiniciar esta fase do início?')) {
        this.startGame(this.currentLevelIndex);
      }
    });

    // Desfazer (5 cargas por fase - suporta peças na bandeja e pares combinados na mesa)
    this.undoBtn.addEventListener('click', () => {
      if (this.undoCount <= 0) {
        this.showToast('Sem desfazeres restantes nesta fase!');
        soundManager.playBlockedSound();
        return;
      }
      if (this.engine.getHistoryLength() === 0) {
        this.showToast('Nenhum movimento para desfazer.');
        return;
      }
      const undoResult = this.engine.undo();
      if (undoResult.success) {
        this.undoCount--;
        this.updatePowerUpBadges();
        soundManager.playTileClick();
        hapticManager.impactLight();

        if (undoResult.tile) {
          const tile = undoResult.tile;
          tile.inFlight = true;
          const coords = this.renderer.getTileViewportCoords(tile);
          const lastSlotIdx = Math.min(this.engine.getTray().length, this.traySlotEls.length - 1);
          const slotEl = this.traySlotEls[lastSlotIdx] || this.traySlotsContainer;
          this.animateTileFromTrayToBoard(
            tile,
            slotEl,
            coords.left,
            coords.top,
            coords.width,
            coords.height,
            () => {
              tile.inFlight = false;
              this.renderer.requestRender();
              this.updateHUD();
            }
          );
        } else {
          this.renderer.requestRender();
        }

        if (undoResult.type === 'pair_restored') {
          if (undoResult.secondaryTiles && undoResult.secondaryTiles.length > 0) {
            this.showToast(`↩️ Par e peças de sinergia restaurados! (${this.undoCount} restante${this.undoCount === 1 ? '' : 's'})`);
          } else {
            this.showToast(`↩️ Par restaurado à mesa! (${this.undoCount} restante${this.undoCount === 1 ? '' : 's'})`);
          }
        } else {
          this.showToast(`Peça devolvida! (${this.undoCount} restante${this.undoCount === 1 ? '' : 's'})`);
        }
        this.updateHUD();
      }
    });

    // Dica (3 cargas por fase)
    this.hintBtn.addEventListener('click', () => {
      if (this.hintCount <= 0) {
        this.showToast('Sem dicas restantes nesta fase!');
        soundManager.playBlockedSound();
        return;
      }
      this.engine.getTiles().forEach((t) => (t.isHinted = false));
      const hintPair = this.engine.getHintPair();
      if (hintPair) {
        this.hintCount--;
        this.updatePowerUpBadges();
        const t1 = this.engine.getTiles().find((t) => t.id === hintPair.tile1Id);
        const t2 = this.engine.getTiles().find((t) => t.id === hintPair.tile2Id);
        if (t1) t1.isHinted = true;
        if (t2) t2.isHinted = true;
        soundManager.playTileClick();
        hapticManager.impactLight();
        this.renderer.triggerAnimation(4000);
        this.renderer.requestRender();
        this.showToast(`Dica revelada! (${this.hintCount} restante${this.hintCount === 1 ? '' : 's'})`);
        setTimeout(() => {
          if (t1) t1.isHinted = false;
          if (t2) t2.isHinted = false;
          this.renderer.requestRender();
        }, 4000);
      } else {
        this.showToast('Nenhum par disponível! Use Misturar.');
        soundManager.playBlockedSound();
      }
      this.updateHUD();
    });

    // Misturar (3 cargas por fase)
    this.shuffleBtn.addEventListener('click', () => {
      if (this.shuffleCount <= 0) {
        this.showToast('Sem misturas restantes nesta fase!');
        soundManager.playBlockedSound();
        return;
      }
      if (this.engine.getActiveBoardTiles().length < 2) {
        this.showToast('Não há peças suficientes para misturar.');
        soundManager.playBlockedSound();
        return;
      }
      if (this.engine.shuffleRemaining()) {
        this.shuffleCount--;
        this.updatePowerUpBadges();
        soundManager.playShuffleSound();
        hapticManager.impactMedium();
        this.renderer.triggerShuffleAnimation(500);
        this.showToast(`Peças misturadas! (${this.shuffleCount} restante${this.shuffleCount === 1 ? '' : 's'})`);
        this.updateHUD();
      }
    });

    // Marreta (3 cargas por fase — exclusiva para destruir peça presa na bandeja)
    this.hammerBtn.addEventListener('click', () => {
      if (this.hammerCount <= 0) {
        this.showToast('Sem marretas restantes nesta fase!');
        soundManager.playBlockedSound();
        return;
      }

      const tray = this.engine.getTray();
      if (tray.length === 0) {
        this.showToast('A bandeja está vazia! A marreta remove peças presas na bandeja.');
        soundManager.playBlockedSound();
        return;
      }

      this.isHammerActive = !this.isHammerActive;
      this.hammerBtn.classList.toggle('active-hammer', this.isHammerActive);

      if (this.isHammerActive) {
        this.showToast('Toque em uma peça na bandeja para quebrá-la!');
        soundManager.playTileClick();
        hapticManager.impactLight();
      } else {
        this.showToast('Modo marreta desativado.');
      }
      this.updateHUD();
    });

    // Modal Fases (via HUD)
    this.levelsBtn.addEventListener('click', () => {
      this.renderLevelsList();
      this.levelsModal.classList.remove('hidden');
    });

    // Modal Configurações
    this.settingsBtn.addEventListener('click', () => {
      this.renderSettingsOptions();
      this.settingsModal.classList.remove('hidden');
    });

    // Modal Guia da Natureza (Botão ❓)
    const helpBtn = document.getElementById('btn-help');
    const natureGuideModal = document.getElementById('modal-nature-guide');
    if (helpBtn && natureGuideModal) {
      helpBtn.addEventListener('click', () => {
        natureGuideModal.classList.remove('hidden');
        soundManager.playTileClick();
      });
    }

    // Abas do Guia da Natureza
    document.querySelectorAll('.guide-tab-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const tab = target.dataset.tab;
        if (!tab) return;

        document.querySelectorAll('.guide-tab-btn').forEach((b) => b.classList.remove('active'));
        target.classList.add('active');

        document.querySelectorAll('.guide-tab-pane').forEach((pane) => pane.classList.add('hidden'));
        document.getElementById(`guide-tab-${tab}`)?.classList.remove('hidden');
        soundManager.playTileClick();
      });
    });

    // Fechar todos os modais
    document.querySelectorAll('.modal-close').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        (e.target as HTMLElement).closest('.modal-container')?.classList.add('hidden');
      });
    });
    document.getElementById('btn-levels-back')?.addEventListener('click', () => {
      this.levelsModal.classList.add('hidden');
    });
    document.querySelectorAll('.modal-container').forEach((modal) => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
      });
    });

    // Fechar toast da natureza ao tocar
    document.getElementById('nature-toast')?.addEventListener('click', () => {
      document.getElementById('nature-toast')?.classList.add('hidden');
    });

    // Vitória — botões
    document.getElementById('btn-next-level')?.addEventListener('click', () => {
      this.victoryModal.classList.add('hidden');
      this.startGame(Math.min(this.currentLevelIndex + 1, ALL_LAYOUTS.length - 1));
    });
    document.getElementById('btn-replay')?.addEventListener('click', () => {
      this.victoryModal.classList.add('hidden');
      this.startGame(this.currentLevelIndex);
    });
  }

  // ─── Screen Navigation ────────────────────────────────────────────────────

  private showMenu(): void {
    this.stopTimer();
    this.updateMenuProgress();
    this.updateMenuVersion();
    this.screenMenu.classList.remove('hidden');
    this.screenGame.classList.add('hidden');
  }

  private async updateMenuVersion(): Promise<void> {
    const el = document.getElementById('menu-version-text');
    if (!el) return;
    const activeBundle = await LiveUpdateManager.getActiveBundleId();
    if (activeBundle) {
      el.textContent = `v1.0.1 (${activeBundle}) · 100% Offline`;
    } else {
      el.textContent = `v1.0.1 · 100% Offline`;
    }
  }

  private showGame(): void {
    this.screenMenu.classList.add('hidden');
    this.screenGame.classList.remove('hidden');
  }

  // ─── Iniciar Partida ──────────────────────────────────────────────────────

  public startGame(levelIndex: number): void {
    this.currentLevelIndex = Math.max(0, Math.min(levelIndex, ALL_LAYOUTS.length - 1));
    const layout = ALL_LAYOUTS[this.currentLevelIndex];

    this.engine = new BoardEngine(layout);
    this.renderer.setEngine(this.engine);
    this.isHammerActive = false;
    this.hammerBtn.classList.remove('active-hammer');
    this.pairsMatchedThisGame = 0;
    this.synergiesTriggeredThisGame = 0;
    this.engine.resetHarmonyScore();
    this.isRestarting = false;
    this.renderer.isInputLocked = false;
    if (this.traySlotsContainer) {
      this.traySlotsContainer.classList.remove('warning-full');
    }

    // Reiniciar cargas por fase (3 Marretas, 3 Misturar, 3 Dicas, 5 Desfazer)
    this.hammerCount = UIManager.MAX_HAMMER;
    this.shuffleCount = UIManager.MAX_SHUFFLE;
    this.hintCount = UIManager.MAX_HINT;
    this.undoCount = UIManager.MAX_UNDO;

    StorageManager.incrementGamesPlayed();

    this.showGame();
    this.startTimer();
    this.renderer.triggerDealAnimation(420);
    this.updateHUD();

    // Fechar modais que possam estar abertos
    const waveModal = document.getElementById('modal-wave-cleared');
    if (waveModal) waveModal.classList.add('hidden');
    [this.levelsModal, this.settingsModal, this.victoryModal].forEach((m) =>
      m.classList.add('hidden')
    );
  }

  public loadLayout(layoutId: string): void {
    const idx = ALL_LAYOUTS.findIndex((l) => l.id === layoutId);
    this.startGame(idx >= 0 ? idx : 0);
  }

  // ─── Timer ────────────────────────────────────────────────────────────────

  private startTimer(): void {
    this.stopTimer();
    this.gameStartTime = Date.now();
    this.elapsedSeconds = 0;
    this.timerEl.textContent = '00:00';

    this.timerInterval = setInterval(() => {
      this.elapsedSeconds = Math.floor((Date.now() - this.gameStartTime) / 1000);
      const m = Math.floor(this.elapsedSeconds / 60).toString().padStart(2, '0');
      const s = (this.elapsedSeconds % 60).toString().padStart(2, '0');
      this.timerEl.textContent = `${m}:${s}`;
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  // ─── HUD Update ───────────────────────────────────────────────────────────

  public updateHUD(): void {
    // Número do nível
    const levelEl = document.getElementById('wisdom-level');
    if (levelEl) levelEl.textContent = `${this.currentLevelIndex + 1}`;

    // Badge de Onda Atual (Multi-Wave)
    const waveBadgeEl = document.getElementById('hud-wave-badge');
    if (waveBadgeEl) {
      if (this.engine.getTotalWaves() > 1) {
        waveBadgeEl.textContent = `${this.engine.getCurrentWave()}/${this.engine.getTotalWaves()}`;
        waveBadgeEl.classList.remove('hidden');
      } else {
        waveBadgeEl.classList.add('hidden');
      }
    }

    // Verificação de segurança: se a onda foi concluída e restam mais ondas, garantir que o modal de transição seja exibido
    if (this.engine.isWaveCleared() && this.engine.hasMoreWaves()) {
      const waveModal = document.getElementById('modal-wave-cleared');
      if (waveModal && waveModal.classList.contains('hidden')) {
        this.handleWaveCleared(this.engine.getCurrentWave(), this.engine.getTotalWaves());
      }
    }

    // Bandeja de 4 slots com nós reciclados
    const tray = this.engine.getTray();
    const maxSlots = this.engine.getMaxTraySlots();

    this.traySlotEls.forEach((slotEl, idx) => {
      const canvas = this.traySlotCanvases[idx];
      if (idx < tray.length) {
        const wasFilled = slotEl.classList.contains('filled');
        slotEl.classList.add('filled');
        const tile = tray[idx];
        if (canvas) {
          canvas.style.display = 'block';
          this.renderTileToCanvas(canvas, tile);
        }

        if (this.isHammerActive) {
          slotEl.classList.add('can-hammer');
        } else {
          slotEl.classList.remove('can-hammer');
        }

        // Bounce suave apenas ao receber nova peça
        if (!wasFilled) {
          slotEl.classList.add('just-filled');
          setTimeout(() => slotEl.classList.remove('just-filled'), 380);
        }

        slotEl.onclick = () => {
          if (this.isHammerActive) {
            this.useHammerOnSlot(tile, slotEl);
          } else {
            this.returnTileFromTray(tile, slotEl);
          }
        };
      } else {
        const wasFilled = slotEl.classList.contains('filled');
        slotEl.classList.remove('filled', 'can-hammer', 'just-filled');
        slotEl.onclick = null;
        if (canvas) {
          canvas.style.display = 'none';
        }
        if (wasFilled && !slotEl.classList.contains('smash-shatter') && !slotEl.classList.contains('tray-return-anim')) {
          slotEl.classList.add('match-clear-anim');
          setTimeout(() => slotEl.classList.remove('match-clear-anim'), 280);
        }
      }
    });

    if (tray.length === 0 && this.isHammerActive) {
      this.isHammerActive = false;
      this.hammerBtn.classList.remove('active-hammer');
    }

    // Tratamento Zen da Bandeja Cheia (4 slots)
    if (tray.length >= maxSlots) {
      this.traySlotsContainer.classList.add('warning-full');

      // Se o jogador não tem marreta nem desfazer para se salvar, a floresta concede o Salvamento Zen!
      if (this.hammerCount <= 0 && this.undoCount <= 0) {
        if (!this.isRestarting) {
          this.isRestarting = true;
          soundManager.playShuffleSound();
          hapticManager.impactMedium();
          this.traySlotsContainer.classList.add('zen-rescue-swirl');
          this.showNatureEvent(
            '🍃',
            'Brisa da Compaixão',
            'A floresta abriu espaço na sua bandeja com segurança zen!'
          );

          setTimeout(() => {
            this.engine.zenRescue();
            this.isRestarting = false;
            this.traySlotsContainer.classList.remove('warning-full', 'zen-rescue-swirl');
            this.renderer.requestRender();
            this.updateHUD();
          }, 900);
        }
      } else {
        // Alerta o jogador para usar seus recursos
        this.showNatureEvent('⚠️', 'Bandeja Cheia (4/4)!', 'Toque na Marreta 🔨 ou Desfazer ↩️!');
      }
    } else {
      this.traySlotsContainer.classList.remove('warning-full');
    }

    this.updatePowerUpBadges();
  }

  /**
   * Esmaga uma peça presa na bandeja com a Marreta
   */
  private useHammerOnSlot(tile: PlacedTile, slotEl: HTMLElement): void {
    if (this.hammerCount <= 0) return;

    this.hammerCount--;
    this.isHammerActive = false;
    this.hammerBtn.classList.remove('active-hammer');
    this.updatePowerUpBadges();

    // Feedback sonoro e tátil de esmagamento
    soundManager.playHammerSmash();
    hapticManager.impactHeavy();

    // Animação visual de quebra
    slotEl.classList.add('smash-shatter');
    this.showToast(`💥 Peça esmagada! (${this.hammerCount} restante${this.hammerCount === 1 ? '' : 's'})`);

    setTimeout(() => {
      slotEl.classList.remove('smash-shatter');
      this.engine.hammerRemove(tile.id);
      this.recordMatchedPair();
      this.renderer.requestRender();
      this.updateHUD();

      if (this.engine.isVictory()) {
        soundManager.playVictoryFanfare();
        hapticManager.impactVictory();
        this.handleVictory();
      } else if (this.engine.isWaveCleared() && this.engine.hasMoreWaves()) {
        soundManager.playMatchSuccess();
        confetti({
          particleCount: 40,
          spread: 55,
          origin: { y: 0.6 },
          colors: ['#10B981', '#F59E0B', '#3B82F6', '#EC4899'],
        });
        this.handleWaveCleared(this.engine.getCurrentWave(), this.engine.getTotalWaves());
      }
    }, 280);
  }

  /**
   * Devolve uma peça da bandeja de volta para a mesa com toque tátil intuitivo
   */
  private returnTileFromTray(tile: PlacedTile, slotEl: HTMLElement): void {
    if (this.renderer.isInputLocked) return;

    tile.inFlight = true;
    const undoResult = this.engine.undoSpecificTrayTile(tile.id);
    if (undoResult.success) {
      soundManager.playTileClick();
      hapticManager.impactLight();

      slotEl.classList.add('tray-return-anim');
      const coords = this.renderer.getTileViewportCoords(tile);

      this.animateTileFromTrayToBoard(
        tile,
        slotEl,
        coords.left,
        coords.top,
        coords.width,
        coords.height,
        () => {
          tile.inFlight = false;
          slotEl.classList.remove('tray-return-anim');
          this.renderer.requestRender();
          this.updateHUD();
        }
      );

      this.updateHUD();
      this.showToast('Peça devolvida ao tabuleiro!');
    } else {
      tile.inFlight = false;
    }
  }

  /**
   * Atualiza os números e estados dos botões de poder
   */
  private updatePowerUpBadges(): void {
    if (this.badgeHammer) {
      this.badgeHammer.textContent = `${this.hammerCount}`;
      this.badgeHammer.classList.toggle('depleted', this.hammerCount <= 0);
      this.hammerBtn.disabled = this.hammerCount <= 0;
    }
    if (this.badgeShuffle) {
      this.badgeShuffle.textContent = `${this.shuffleCount}`;
      this.badgeShuffle.classList.toggle('depleted', this.shuffleCount <= 0);
      this.shuffleBtn.disabled = this.shuffleCount <= 0;
    }
    if (this.badgeHint) {
      this.badgeHint.textContent = `${this.hintCount}`;
      this.badgeHint.classList.toggle('depleted', this.hintCount <= 0);
      this.hintBtn.disabled = this.hintCount <= 0;
    }
    if (this.badgeUndo) {
      this.badgeUndo.textContent = `${this.undoCount}`;
      this.badgeUndo.classList.toggle('depleted', this.undoCount <= 0);
      const canUndo = this.engine ? this.engine.getHistoryLength() > 0 : false;
      this.undoBtn.disabled = this.undoCount <= 0 || !canUndo;
    }
  }

  // ─── Victory ──────────────────────────────────────────────────────────────

  public handleVictory(): void {
    this.stopTimer();

    const timeSeconds = this.elapsedSeconds;
    const layoutId = this.engine.getLayout().id;

    // Ferramentas poupadas
    const toolsRemaining =
      this.hammerCount +
      this.shuffleCount +
      this.hintCount +
      (this.undoCount > 0 ? 1 : 0);

    const harmonyScore = this.engine.getHarmonyScore();

    // Salvar estatísticas contemplativas
    const levelStats = StorageManager.recordVictory(
      layoutId,
      timeSeconds,
      toolsRemaining,
      this.synergiesTriggeredThisGame,
      harmonyScore
    );
    StorageManager.incrementGamesWon(timeSeconds, this.pairsMatchedThisGame, this.currentLevelIndex);

    // Desbloquear próximo nível
    const nextLevelIdx = this.currentLevelIndex + 1;
    let nextUnlocked = false;
    if (nextLevelIdx < ALL_LAYOUTS.length) {
      StorageManager.unlockLevel(nextLevelIdx);
      nextUnlocked = true;
    }

    // Atualizar modal de vitória
    const stars = levelStats.stars;
    const starsStr = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    const m = Math.floor(timeSeconds / 60).toString().padStart(2, '0');
    const s = (timeSeconds % 60).toString().padStart(2, '0');

    const starsEl = document.getElementById('victory-stars');
    if (starsEl) starsEl.textContent = starsStr;

    const timeEl = document.getElementById('victory-time');
    if (timeEl) timeEl.textContent = `⏱ Tempo Zen: ${m}:${s}`;

    const scoreEl = document.getElementById('victory-score');
    if (scoreEl) scoreEl.textContent = `🌸 Harmonia Zen: ${harmonyScore.toLocaleString('pt-BR')} pts`;

    const detailEl = document.getElementById('victory-stars-detail');
    if (detailEl) {
      detailEl.innerHTML = `
        <div class="zen-star-row ${stars >= 1 ? 'earned' : ''}">⭐ 1★ Conclusão do Tabuleiro</div>
        <div class="zen-star-row ${stars >= 2 ? 'earned' : ''}">⭐ 2★ ${toolsRemaining > 0 ? `Ferramentas Poupadas (${toolsRemaining})` : 'Sinergia da Natureza'}</div>
        <div class="zen-star-row ${stars >= 3 ? 'earned' : ''}">⭐ 3★ Harmonia Zen Completa</div>
      `;
    }

    const unlockEl = document.getElementById('victory-next-unlock');
    const unlockName = document.getElementById('victory-unlock-name');
    if (unlockEl && unlockName) {
      if (nextUnlocked && nextLevelIdx < ALL_LAYOUTS.length) {
        unlockName.textContent = `"${ALL_LAYOUTS[nextLevelIdx].name}" desbloqueada!`;
        unlockEl.classList.remove('hidden');
      } else {
        unlockEl.classList.add('hidden');
      }
    }

    // Botão "Próxima Fase" só aparece se houver próximo nível
    const nextBtn = document.getElementById('btn-next-level') as HTMLButtonElement | null;
    if (nextBtn) nextBtn.style.display = nextLevelIdx < ALL_LAYOUTS.length ? '' : 'none';

    this.victoryModal.classList.remove('hidden');
    this.launchVictoryConfetti();
    soundManager.playVictoryFanfare?.();
    hapticManager.impactVictory?.();
  }

  public recordMatchedPair(pair?: [PlacedTile, PlacedTile]): void {
    this.pairsMatchedThisGame++;
    if (pair && pair.some((t) => t.value === 'chameleon' || t.value === 'honeycomb')) {
      const specialTile = pair.find((t) => t.value === 'chameleon' || t.value === 'honeycomb');
      if (specialTile) {
        const coords = this.renderer.getTileViewportCoords(specialTile);
        this.spawnLotusManaSparks(coords.left + coords.width / 2, coords.top + coords.height / 2);
      } else {
        this.spawnLotusManaSparks();
      }
    }
  }

  private launchVictoryConfetti(): void {
    const end = Date.now() + 2800;
    const frame = () => {
      confetti({
        particleCount: 7,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF8FD8'],
      });
      confetti({
        particleCount: 7,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF8FD8'],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }

  // ─── Transições de Onda (Multi-Wave) ──────────────────────────────────────

  public handleWaveCleared(currentWave: number, totalWaves: number): void {
    const waveModal = document.getElementById('modal-wave-cleared');
    const titleEl = document.getElementById('wave-cleared-title');
    const subtitleEl = document.getElementById('wave-cleared-subtitle');
    const nextWaveBtn = document.getElementById('btn-next-wave');

    if (titleEl) titleEl.textContent = `Onda ${currentWave} Concluída! 🌸`;
    if (subtitleEl) subtitleEl.textContent = `Prepare-se para a Onda ${currentWave + 1} de ${totalWaves}!`;

    const advance = () => {
      if (waveModal) waveModal.classList.add('hidden');
      this.engine.advanceToNextWave();
      this.renderer.handleResize();
      this.renderer.triggerDealAnimation(420);
      this.renderer.requestRender();
      this.updateHUD();
      this.showNatureToast('🌊', `Onda ${this.engine.getCurrentWave()} Iniciada!`, 'Novas peças na mesa com peças gigantes!');
    };

    if (nextWaveBtn) {
      nextWaveBtn.onclick = (e) => {
        e.stopPropagation();
        advance();
      };
    }

    if (waveModal) {
      waveModal.onclick = (e) => {
        if (e.target === waveModal) {
          advance();
        }
      };
      waveModal.classList.remove('hidden');
    }
  }

  // ─── Sinergias & Climas da Natureza ───────────────────────────────────────

  public triggerHudPulse(): void {
    const hudTitle = document.querySelector('.wisdom-title-container');
    if (hudTitle) {
      hudTitle.classList.remove('pulse-glow');
      void (hudTitle as HTMLElement).offsetWidth; // trigger reflow
      hudTitle.classList.add('pulse-glow');
    }
  }

  public handleSynergy(synergy: SynergyResult): void {
    soundManager.playMatchSuccess();
    hapticManager.impactLight();
    this.triggerHudPulse();
    this.synergiesTriggeredThisGame++;

    let icon = '🐾';
    if (synergy.type === 'frog_tongue') icon = '🐸';
    else if (synergy.type === 'cat_paw') icon = '🐱';
    else if (synergy.type === 'bear_feast') icon = '🐻';
    else if (synergy.type === 'squirrel_acorn') icon = '🐿️';
    else if (synergy.type === 'dolphin_sonar') icon = '🐬';
    else if (synergy.type === 'hedgehog_apple') icon = '🦔';
    else if (synergy.type === 'bee_honey') icon = '🐝';
    else if (synergy.type === 'monkey_banana') icon = '🐒';
    else if (synergy.type === 'wildcard_chameleon') icon = '🦎';

    this.showNatureEvent(icon, synergy.title, synergy.description);
    this.updateHUD();
  }

  public handleClimate(climate: ClimateEffectResult): void {
    soundManager.playMatchSuccess();
    hapticManager.impactMedium();
    this.triggerHudPulse();
    this.synergiesTriggeredThisGame++;

    if (climate.rechargedTool === 'hammer') {
      this.hammerCount = Math.min(UIManager.MAX_HAMMER, this.hammerCount + 1);
    } else if (climate.rechargedTool === 'hint') {
      this.hintCount = Math.min(UIManager.MAX_HINT, this.hintCount + 1);
    } else if (climate.rechargedTool === 'shuffle') {
      this.shuffleCount = Math.min(UIManager.MAX_SHUFFLE, this.shuffleCount + 1);
    } else if (climate.rechargedTool === 'undo') {
      this.undoCount = Math.min(UIManager.MAX_UNDO, this.undoCount + 1);
    }
    this.updatePowerUpBadges();

    this.showNatureEvent(climate.icon, climate.title, climate.description);
    this.updateHUD();
  }

  public showNatureEvent(icon: string, title: string, desc: string): void {
    const box = document.getElementById('nature-event-box');
    const boxIcon = document.getElementById('nature-event-icon');
    const boxTitle = document.getElementById('nature-event-title');
    const boxDesc = document.getElementById('nature-event-desc');

    if (boxIcon) boxIcon.textContent = icon;
    if (boxTitle) boxTitle.textContent = title;
    if (boxDesc) boxDesc.textContent = desc;

    if (box) {
      box.classList.remove('event-pulse');
      void box.offsetWidth; // trigger reflow
      box.classList.add('event-pulse');
    }

    clearTimeout((this as unknown as { _natureEventTimer?: ReturnType<typeof setTimeout> })._natureEventTimer);
    (this as unknown as { _natureEventTimer?: ReturnType<typeof setTimeout> })._natureEventTimer = setTimeout(() => {
      if (boxIcon) boxIcon.textContent = '🌿';
      if (boxTitle) boxTitle.textContent = 'Bosque Sereno';
      if (boxDesc) boxDesc.textContent = 'Toque nas peças livres';
    }, 4500);
  }

  public showNatureToast(icon: string, title: string, desc: string): void {
    this.showNatureEvent(icon, title, desc);
  }

  public handleTileLongPress(tile: PlacedTile): void {
    const tips: Partial<Record<string, { icon: string; title: string; text: string }>> = {
      chameleon: { icon: '🦎', title: 'Camaleão Dourado', text: 'Peça Coringa! Combina com qualquer peça livre.' },
      cat:       { icon: '🐱', title: 'Gato Curioso', text: 'Combina com Peixe 🐟 para a Pata Ágil pescar na lagoa!' },
      bear:      { icon: '🐻', title: 'Urso Marrom', text: 'Combina com Mel 🍯 ou Peixe 🐟 para devorar o par da mesa!' },
      honeycomb: { icon: '🍯', title: 'Favo de Mel', text: 'Combina com Abelha 🐝 ou Urso 🐻 para abrir espaço!' },
      bee:       { icon: '🐝', title: 'Abelhinha', text: 'Combina com Favo de Mel 🍯 para o Enxame Dourado!' },
      monkey:    { icon: '🐒', title: 'Macaco Esperto', text: 'Combina com Banana 🍌 para o Salto na Copa!' },
      banana:    { icon: '🍌', title: 'Cacho de Bananas', text: 'Combina com Macaco 🐒 para reorganizar a mesa!' },
      squirrel:  { icon: '🐿️', title: 'Esquilo Tagarela', text: 'Combina com Noz 🌰 para a Toca Segura!' },
      acorn:     { icon: '🌰', title: 'Noz Silvestre', text: 'Combina com Esquilo 🐿️ para guardar peças!' },
      frog:      { icon: '🐸', title: 'Sapo Saltador', text: 'Combina com Joaninha 🐞 ou Abelha 🐝 para a Língua Ágil!' },
      dolphin:   { icon: '🐬', title: 'Golfinho Encantado', text: 'Combina com Concha 🐚 para o Eco Sonar!' },
      shell:     { icon: '🐚', title: 'Concha Marinha', text: 'Combina com Golfinho 🐬 para iluminar pares!' },
      hedgehog:  { icon: '🦔', title: 'Ouriço Manso', text: 'Combina com Maçã 🍎 para o Espinho Coletor!' },
      apple:     { icon: '🍎', title: 'Maçã Doce', text: 'Combina com Ouriço 🦔 para bônus de harmonia!' },
    };

    const tip = tips[tile.value] || {
      icon: '🐾',
      title: tile.label,
      text: 'Combine duas peças iguais ou use peças coringa para liberar!',
    };

    soundManager.playTileClick();
    this.showNatureEvent(tip.icon, tip.title, tip.text);
  }

  // ─── Stats Render ─────────────────────────────────────────────────────────

  private renderStats(): void {
    const container = document.getElementById('stats-content');
    if (!container) return;

    const g = StorageManager.getGlobalStats();
    const winRate = g.totalGamesPlayed > 0
      ? Math.round((g.totalGamesWon / g.totalGamesPlayed) * 100)
      : 0;
    const avgTime = g.totalGamesWon > 0
      ? Math.round(g.totalTimePlayed / g.totalGamesWon)
      : 0;
    const avgM = Math.floor(avgTime / 60).toString().padStart(2, '0');
    const avgS = (avgTime % 60).toString().padStart(2, '0');

    container.innerHTML = `
      <div class="stats-streak">
        <span class="stats-streak-icon">🔥</span>
        <div class="stats-streak-text">
          <div class="stats-streak-count">${g.currentStreak} dias seguidos</div>
          <div style="font-size:0.75rem;color:#94a3b8">Sequência de Jogo Diária</div>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${g.totalGamesPlayed}</div>
          <div class="stat-label">Partidas</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${g.totalGamesWon}</div>
          <div class="stat-label">Vitórias</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${winRate}%</div>
          <div class="stat-label">Taxa Vitória</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${avgM}:${avgS}</div>
          <div class="stat-label">Tempo Médio</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${g.totalPairsMatched}</div>
          <div class="stat-label">Pares Feitos</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${g.highestLevelUnlocked + 1}</div>
          <div class="stat-label">Nível Máximo</div>
        </div>
      </div>

      <div style="font-size:0.78rem;color:#64748b;text-align:center;margin-top:8px">
        Progresso salvo automaticamente no dispositivo
      </div>
    `;
  }

  private renderLevelsList(): void {
    const tabsContainer = document.getElementById('levels-world-tabs');
    const mapViewport = document.getElementById('levels-map-viewport');
    const mapContent = document.getElementById('levels-map-content');
    const mapSvg = document.getElementById('levels-map-svg');
    const previewCard = document.getElementById('atom-level-preview');
    const previewClose = document.getElementById('atom-preview-close');
    const btnPlay = document.getElementById('btn-atom-play');

    if (!mapContent || !mapSvg) return;

    // Limpar conteúdo anterior
    mapContent.querySelectorAll('.atom-node, .atom-world-portal').forEach((el) => el.remove());
    mapSvg.innerHTML = '';
    if (previewCard) previewCard.classList.add('hidden');

    if (previewClose && previewCard) {
      previewClose.onclick = () => previewCard.classList.add('hidden');
    }

    // Preencher Tabs de Navegação Rápida entre Mundos
    if (tabsContainer) {
      tabsContainer.innerHTML = '';
      WORLDS.forEach((world, wIdx) => {
        const tab = document.createElement('button');
        tab.className = 'world-nav-tab';
        tab.textContent = `Mundo ${wIdx + 1}`;
        tab.addEventListener('click', () => {
          const portal = document.getElementById(`world-portal-${world.id}`);
          portal?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        tabsContainer.appendChild(tab);
      });
    }

    // Atualizar Contador Geral de Estrelas no Topo
    const totalStars = ALL_LAYOUTS.reduce((acc, l) => acc + StorageManager.getLevelStats(l.id).stars, 0);
    const starsHeader = document.getElementById('levels-header-stars');
    if (starsHeader) starsHeader.textContent = `⭐ ${totalStars} / ${ALL_LAYOUTS.length * 3}`;

    // Geometria Responsiva do Mapa (Pixel-Perfect)
    const viewWidth = mapViewport ? mapViewport.clientWidth : 360;
    const baseWidth = Math.max(340, Math.min(480, viewWidth || 360));
    const centerX = baseWidth / 2;
    const xAmplitude = Math.min(115, Math.max(82, (baseWidth - 110) / 2));
    const nodeSpacingY = 108;
    const portalHeight = 88;

    interface RoutePoint {
      x: number;
      y: number;
      isUnlocked: boolean;
      type: 'portal' | 'node';
      idx?: number;
      isCurrent?: boolean;
      layout?: typeof ALL_LAYOUTS[0];
    }

    const route: RoutePoint[] = [];
    let currentY = 46;

    WORLDS.forEach((world, wIdx) => {
      const [startLvl, endLvl] = world.levelRange;
      const worldLayouts = ALL_LAYOUTS.slice(startLvl - 1, endLvl);

      // Estatísticas do Mundo
      let completedInWorld = 0;
      let starsInWorld = 0;
      worldLayouts.forEach((l) => {
        const stats = StorageManager.getLevelStats(l.id);
        if (stats.completed) {
          completedInWorld++;
          starsInWorld += stats.stars;
        }
      });

      // Portal / Marco do Mundo
      const portal = document.createElement('div');
      portal.id = `world-portal-${world.id}`;
      portal.className = 'atom-world-portal';
      const portalCenterY = currentY + portalHeight / 2;
      portal.style.top = `${portalCenterY}px`;
      portal.style.left = `${centerX}px`;
      portal.innerHTML = `
        <div class="world-portal-info">
          <div class="world-portal-title">${world.title}</div>
          <div class="world-portal-desc">${world.description}</div>
        </div>
        <div class="world-portal-progress">
          ${completedInWorld}/${worldLayouts.length} · ⭐ ${starsInWorld}
        </div>
      `;
      mapContent.appendChild(portal);

      const firstUnlockedInWorld = StorageManager.isLevelUnlocked(startLvl - 1);
      route.push({
        x: centerX,
        y: portalCenterY + portalHeight / 2, // Conecta na base do portal
        isUnlocked: firstUnlockedInWorld,
        type: 'portal'
      });

      currentY += portalHeight + 46;

      // Nós Atômicos do Mundo
      worldLayouts.forEach((layout, offset) => {
        const idx = startLvl - 1 + offset;
        const isUnlocked = StorageManager.isLevelUnlocked(idx);
        const isCurrent = idx === this.currentLevelIndex;

        // Oscilação sinusoidal ampla e elegante da constelação
        const xOffset = Math.sin(offset * 0.74 + wIdx * 0.55) * xAmplitude;
        const nodeX = centerX + xOffset;
        const nodeY = currentY;

        route.push({
          x: nodeX,
          y: nodeY,
          isUnlocked,
          type: 'node',
          idx,
          isCurrent,
          layout
        });

        currentY += nodeSpacingY;
      });

      currentY += 24; // Espaço antes do próximo portal
    });

    const totalHeight = currentY + 60;
    mapContent.style.width = `${baseWidth}px`;
    mapContent.style.height = `${totalHeight}px`;
    mapSvg.style.width = `${baseWidth}px`;
    mapSvg.style.height = `${totalHeight}px`;
    mapSvg.setAttribute('viewBox', `0 0 ${baseWidth} ${totalHeight}`);
    mapSvg.setAttribute('preserveAspectRatio', 'none');

    // Desenhar Ligações Atômicas / Tubos de Energia (SVG Bezier Curves)
    for (let i = 0; i < route.length - 1; i++) {
      const p1 = route[i];
      const p2 = route[i + 1];

      const dy = p2.y - p1.y;
      const cp1x = p1.x;
      const cp1y = p1.y + dy * 0.5;
      const cp2x = p2.x;
      const cp2y = p2.y - dy * 0.5;

      const pathData = `M ${p1.x} ${p1.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;

      if (p2.isUnlocked) {
        // 1. Tubo exterior de brilho neon suave
        const glowEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        glowEl.setAttribute('d', pathData);
        glowEl.setAttribute('class', 'map-path-glow');
        mapSvg.appendChild(glowEl);

        // 2. Linha principal condutora de energia
        const mainEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        mainEl.setAttribute('d', pathData);
        mainEl.setAttribute('class', 'map-path-unlocked');
        mapSvg.appendChild(mainEl);

        // 3. Feixe animado de elétrons em fluxo
        const flowEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        flowEl.setAttribute('d', pathData);
        flowEl.setAttribute('class', 'map-path-flow');
        mapSvg.appendChild(flowEl);
      } else {
        // Linha pontilhada de circuito bloqueado
        const lockedEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        lockedEl.setAttribute('d', pathData);
        lockedEl.setAttribute('class', 'map-path-locked');
        mapSvg.appendChild(lockedEl);
      }
    }

    // Renderizar Elementos HTML dos Átomos
    route.filter((p) => p.type === 'node' && p.layout).forEach((pt) => {
      const layout = pt.layout!;
      const idx = pt.idx!;
      const stats = StorageManager.getLevelStats(layout.id);
      const isCompleted = stats.completed;

      // Posição inteligente da etiqueta: esquerda ou direita conforme o lado da tela
      const labelClass = pt.x < centerX - 24
        ? 'label-right'
        : (pt.x > centerX + 24 ? 'label-left' : 'label-center');

      const node = document.createElement('div');
      node.className = `atom-node ${labelClass}${pt.isCurrent ? ' current' : ''}${isCompleted ? ' completed' : ''}${!pt.isUnlocked ? ' locked' : ''}`;
      node.style.left = `${pt.x}px`;
      node.style.top = `${pt.y}px`;

      // Modelo Atômico com 3 Órbitas 3D (Rutherford ⚛️) para a fase atual
      const orbitalHtml = pt.isCurrent
        ? `
          <div class="atom-orbital-wrap">
            <div class="atom-orbit atom-orbit-1"><div class="atom-electron"></div></div>
            <div class="atom-orbit atom-orbit-2"><div class="atom-electron"></div></div>
            <div class="atom-orbit atom-orbit-3"><div class="atom-electron"></div></div>
          </div>
        `
        : '';

      // Estrelas flutuando sob o átomo concluído
      const starsHtml = isCompleted
        ? `<div class="atom-stars">${'⭐'.repeat(stats.stars)}</div>`
        : '';

      node.innerHTML = `
        ${orbitalHtml}
        <div class="atom-core">${pt.isUnlocked ? idx + 1 : '🔒'}</div>
        ${starsHtml}
        <div class="atom-label-pill">${layout.name}</div>
      `;

      node.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!pt.isUnlocked) {
          soundManager.playBlockedSound();
          hapticManager.impactLight();
          this.showToast('Fase bloqueada! Complete a fase anterior primeiro.');
          return;
        }

        soundManager.playTileClick();
        hapticManager.impactLight();

        // Exibir Bottom Sheet de Missão
        if (previewCard) {
          const badge = document.getElementById('atom-preview-badge');
          const name = document.getElementById('atom-preview-name');
          const meta = document.getElementById('atom-preview-meta');
          const desc = document.getElementById('atom-preview-desc');
          const starsEl = document.getElementById('atom-preview-stars');
          const bestEl = document.getElementById('atom-preview-best');

          if (badge) badge.textContent = `${idx + 1}`;
          if (name) name.textContent = layout.name;
          if (meta) meta.textContent = `${layout.difficulty} · ${layout.slots.length} peças`;
          if (desc) desc.textContent = layout.description;

          if (starsEl) {
            starsEl.textContent = isCompleted
              ? '⭐'.repeat(stats.stars) + '☆'.repeat(3 - stats.stars)
              : 'Ainda não jogada';
          }

          if (bestEl) {
            let recordText = stats.bestTimeSeconds
              ? `Tempo Zen: ${Math.floor(stats.bestTimeSeconds / 60)}m ${stats.bestTimeSeconds % 60}s`
              : 'Sem recorde';
            if (stats.bestScore) {
              recordText += ` · 🌸 ${stats.bestScore.toLocaleString('pt-BR')} pts`;
            }
            bestEl.textContent = recordText;
          }

          if (btnPlay) {
            btnPlay.onclick = () => {
              this.startGame(idx);
              this.levelsModal.classList.add('hidden');
            };
          }

          previewCard.classList.remove('hidden');
        } else {
          this.startGame(idx);
          this.levelsModal.classList.add('hidden');
        }
      });

      mapContent.appendChild(node);
    });

    // Auto-scroll suave até o átomo da fase atual
    setTimeout(() => {
      const activeNode = mapContent.querySelector('.atom-node.current');
      activeNode?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  }


  // ─── Settings ─────────────────────────────────────────────────────────────

  private renderSettingsOptions(): void {
    const container = document.getElementById('settings-options-container');
    if (!container) return;

    container.innerHTML = `
      <div class="setting-row">
        <div>
          <div class="setting-title">Destacar Peças Livres</div>
          <div class="setting-subtitle">Escurece as peças bloqueadas para fácil visualização</div>
        </div>
        <input type="checkbox" id="check-dim" class="toggle-checkbox" ${this.prefs.dimBlockedTiles ? 'checked' : ''} />
      </div>
      <div class="setting-row">
        <div>
          <div class="setting-title">Música Lo-Fi Zen (Chuva & Relaxamento)</div>
          <div class="setting-subtitle">Trilha sonora calma com batidas suaves e chuva</div>
        </div>
        <input type="checkbox" id="check-music" class="toggle-checkbox" ${this.prefs.musicEnabled ? 'checked' : ''} />
      </div>
      <div class="setting-row">
        <div>
          <div class="setting-title">Efeitos Sonoros</div>
          <div class="setting-subtitle">Sons ao tocar e combinar peças</div>
        </div>
        <input type="checkbox" id="check-sound" class="toggle-checkbox" ${this.prefs.soundEnabled ? 'checked' : ''} />
      </div>
      <div class="setting-row">
        <div>
          <div class="setting-title">Vibração</div>
          <div class="setting-subtitle">Feedback tátil ao tocar nas peças</div>
        </div>
        <input type="checkbox" id="check-haptic" class="toggle-checkbox" ${this.prefs.hapticEnabled ? 'checked' : ''} />
      </div>
    `;

    container.querySelector('#check-dim')?.addEventListener('change', (e) => {
      this.prefs.dimBlockedTiles = (e.target as HTMLInputElement).checked;
      this.saveAndApplyPrefs();
    });
    container.querySelector('#check-music')?.addEventListener('change', (e) => {
      this.prefs.musicEnabled = (e.target as HTMLInputElement).checked;
      this.saveAndApplyPrefs();
    });
    container.querySelector('#check-sound')?.addEventListener('change', (e) => {
      this.prefs.soundEnabled = (e.target as HTMLInputElement).checked;
      this.saveAndApplyPrefs();
    });
    container.querySelector('#check-haptic')?.addEventListener('change', (e) => {
      this.prefs.hapticEnabled = (e.target as HTMLInputElement).checked;
      this.saveAndApplyPrefs();
    });
  }

  private saveAndApplyPrefs(): void {
    StorageManager.savePreferences(this.prefs);
    this.applyPreferences();
    this.renderer.requestRender();
  }

  // ─── Tray Tile Canvas ─────────────────────────────────────────────────────

  /**
   * Renderiza a face de uma peça em um canvas pré-alocado reutilizável
   */
  public renderTileToCanvas(canvas: HTMLCanvasElement, tile: PlacedTile): void {
    const dpr = window.devicePixelRatio || 1;
    const w = 62;
    const h = 82;
    const targetW = Math.round(w * dpr);
    const targetH = Math.round(h * dpr);

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, targetW, targetH);
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(1, 1, w - 2, h - 2, 7);
    ctx.fill();
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1;
    ctx.stroke();

    const sprite = this.renderer.getTileRenderer().getOrGenerateTileFace(tile);
    ctx.drawImage(sprite, 2, 2, w - 4, h - 4);
    ctx.restore();
  }

  private getFlyerFromPool(): { el: HTMLElement; canvas: HTMLCanvasElement; inUse: boolean } {
    let item = this.flyerPool.find((f) => !f.inUse);
    if (!item) {
      const el = document.createElement('div');
      el.className = 'flying-tile-card';
      el.style.cssText = `
        position: fixed;
        z-index: 1000;
        pointer-events: none;
        display: none;
        box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        border-radius: 8px;
        overflow: hidden;
      `;
      const canvas = document.createElement('canvas');
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      el.appendChild(canvas);
      document.body.appendChild(el);
      item = { el, canvas, inUse: false };
      this.flyerPool.push(item);
    }
    item.inUse = true;
    return item;
  }

  // ─── Menu Progress ────────────────────────────────────────────────────────

  private updateMenuProgress(): void {
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

    this.menuLevelsDone.textContent = `${done}`;
    this.menuLevelsTotal.textContent = `${total}`;
    this.menuProgressFill.style.width = `${(done / total) * 100}%`;
    this.menuStarsTotal.textContent = `⭐ ${totalStars} estrelas`;

    // Atualizar índice do nível atual (continuar do progresso salvo)
    const progress = StorageManager.getProgress();
    this.currentLevelIndex = Math.min(progress.currentLevelIndex, total - 1);
  }

  // ─── Feedback Messages ───────────────────────────────────────────────────

  public showBlockedTip(message: string): void {
    const banner = document.getElementById('tutorial-tip-banner');
    const tipText = document.getElementById('tutorial-tip-text');
    if (banner && tipText) {
      tipText.textContent = message;
      banner.classList.remove('hidden');
      setTimeout(() => banner.classList.add('hidden'), 2600);
    }
  }

  public showToast(message: string, durationMs: number = 3200, isDanger: boolean = false): void {
    const existing = document.querySelector('.mahjong-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'mahjong-toast' + (isDanger ? ' toast-danger' : '');
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, durationMs);
  }

  // ─── Animate Tile to Tray ─────────────────────────────────────────────────

  public animateTileToTray(
    tile: PlacedTile,
    startX: number,
    startY: number,
    width: number,
    height: number,
    onArrival: () => void
  ): void {
    const tray = this.engine.getTray();
    const targetIdx = Math.min(tray.length, this.traySlotEls.length - 1);
    const targetSlot = this.traySlotEls[targetIdx];
    if (!targetSlot) { onArrival(); return; }

    const targetRect = targetSlot.getBoundingClientRect();
    const flyerItem = this.getFlyerFromPool();
    const flyer = flyerItem.el;
    const canvas = flyerItem.canvas;

    this.renderTileToCanvas(canvas, tile);

    flyer.style.transition = 'none';
    flyer.style.left = `${startX}px`;
    flyer.style.top  = `${startY}px`;
    flyer.style.width = `${width}px`;
    flyer.style.height = `${height}px`;
    flyer.style.transform = 'scale(1.05)';
    flyer.style.display = 'block';

    void flyer.offsetWidth;

    requestAnimationFrame(() => {
      flyer.style.transition = 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)';
      flyer.style.left = `${targetRect.left}px`;
      flyer.style.top  = `${targetRect.top}px`;
      flyer.style.width = `${targetRect.width}px`;
      flyer.style.height = `${targetRect.height}px`;
      flyer.style.transform = 'scale(1)';
    });

    setTimeout(() => {
      flyer.style.display = 'none';
      flyerItem.inUse = false;
      onArrival();
    }, 220);
  }

  // ─── Animate Tile from Tray to Board (Reverse Flight) ─────────────────────

  public animateTileFromTrayToBoard(
    tile: PlacedTile,
    fromSlotEl: HTMLElement,
    targetLeft: number,
    targetTop: number,
    targetWidth: number,
    targetHeight: number,
    onArrival: () => void
  ): void {
    const slotRect = fromSlotEl.getBoundingClientRect();
    const flyerItem = this.getFlyerFromPool();
    const flyer = flyerItem.el;
    const canvas = flyerItem.canvas;

    this.renderTileToCanvas(canvas, tile);

    flyer.style.transition = 'none';
    flyer.style.left = `${slotRect.left}px`;
    flyer.style.top  = `${slotRect.top}px`;
    flyer.style.width = `${slotRect.width}px`;
    flyer.style.height = `${slotRect.height}px`;
    flyer.style.transform = 'scale(1)';
    flyer.style.display = 'block';

    void flyer.offsetWidth;

    requestAnimationFrame(() => {
      flyer.style.transition = 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)';
      flyer.style.left = `${targetLeft}px`;
      flyer.style.top  = `${targetTop}px`;
      flyer.style.width = `${targetWidth}px`;
      flyer.style.height = `${targetHeight}px`;
      flyer.style.transform = 'scale(1.04)';
    });

    setTimeout(() => {
      flyer.style.display = 'none';
      flyerItem.inUse = false;
      onArrival();
    }, 220);
  }

  // ─── Fagulhas Douradas da Flor de Lótus ────────────────────────────────────

  public spawnLotusManaSparks(fromX?: number, fromY?: number): void {
    const badges = [this.badgeUndo, this.badgeHint].filter(Boolean);
    const startX = fromX ?? window.innerWidth / 2;
    const startY = fromY ?? window.innerHeight / 2;

    badges.forEach((badge, bIdx) => {
      const bRect = badge.getBoundingClientRect();
      const spark = document.createElement('div');
      spark.className = 'golden-mana-spark';
      spark.textContent = '✨';
      spark.style.cssText = `
        position: fixed;
        left: ${startX}px;
        top: ${startY}px;
        font-size: 1.5rem;
        z-index: 1000;
        pointer-events: none;
        transition: all 0.55s cubic-bezier(0.16, 1, 0.3, 1) ${bIdx * 0.08}s;
      `;
      document.body.appendChild(spark);

      requestAnimationFrame(() => {
        spark.style.left = `${bRect.left + bRect.width / 2}px`;
        spark.style.top = `${bRect.top + bRect.height / 2}px`;
        spark.style.transform = 'scale(1.5)';
        spark.style.opacity = '0.95';
      });

      setTimeout(() => {
        spark.remove();
        badge.classList.add('sparkle-pulse');
        setTimeout(() => badge.classList.remove('sparkle-pulse'), 800);
      }, 650);
    });
  }

  // ─── Live Update UI ────────────────────────────────────────────────────────

  public showUpdateDownloading(message?: string): void {
    const dialog = document.getElementById('modal-update-dialog');
    const stepDownloading = document.getElementById('update-dialog-downloading');
    const stepReady = document.getElementById('update-dialog-ready');
    const desc = document.getElementById('update-download-desc');

    if (!dialog) return;
    if (desc && message) desc.textContent = `Instalando: ${message}`;
    stepDownloading?.classList.remove('hidden');
    stepReady?.classList.add('hidden');
    dialog.classList.remove('hidden');
  }

  public showUpdateReady(message?: string): void {
    const dialog = document.getElementById('modal-update-dialog');
    const stepDownloading = document.getElementById('update-dialog-downloading');
    const stepReady = document.getElementById('update-dialog-ready');
    const desc = document.getElementById('update-ready-desc');
    const btnRestart = document.getElementById('btn-update-restart');
    const btnLater = document.getElementById('btn-update-later');

    if (!dialog) return;
    if (desc && message) {
      desc.textContent = `"${message}" instalada com sucesso. Reinicie agora para jogar na versão mais recente!`;
    }
    stepDownloading?.classList.add('hidden');
    stepReady?.classList.remove('hidden');
    dialog.classList.remove('hidden');

    if (btnRestart) {
      btnRestart.onclick = () => {
        LiveUpdateManager.applyUpdateNow();
      };
    }

    if (btnLater) {
      btnLater.onclick = () => {
        dialog.classList.add('hidden');
        this.showToast('✨ A atualização entrará em vigor ao reabrir o jogo.');
      };
    }
  }
}

