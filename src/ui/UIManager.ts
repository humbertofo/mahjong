import { BoardEngine } from '../core/BoardEngine';
import { BoardRenderer } from '../render/BoardRenderer';
import { ALL_LAYOUTS } from '../core/layouts';
import { StorageManager } from '../storage/StorageManager';
import { soundManager } from '../audio/SoundManager';
import { hapticManager } from '../audio/HapticManager';
import { PlacedTile, SynergyResult, ClimateEffectResult } from '../core/types';
import { LiveUpdateManager } from '../core/LiveUpdateManager';
import { LevelsModal } from './modals/LevelsModal';
import { SettingsModal } from './modals/SettingsModal';
import { GameEndModals } from './modals/GameEndModals';
import { HUDController } from './HUDController';
import { TrayAnimator } from './TrayAnimator';
import { NatureFeedbackController } from './NatureFeedbackController';
import { getLevelRules } from '../core/levelRules';
import { LevelDeckCurator } from '../core/nature/LevelDeckCurator';

export class UIManager {
  private engine: BoardEngine;
  private renderer: BoardRenderer;
  private prefs = StorageManager.getPreferences();
  private currentLevelIndex: number = 0;
  private isHammerActive: boolean = false;

  // Submódulos especialistas
  private hud: HUDController = new HUDController();
  private trayAnimator: TrayAnimator = new TrayAnimator();
  private natureFeedback: NatureFeedbackController;

  // Limite de Cargas por Fase (Retrocompatibilidade)
  public static readonly MAX_HAMMER = HUDController.MAX_HAMMER;
  public static readonly MAX_SHUFFLE = HUDController.MAX_SHUFFLE;
  public static readonly MAX_HINT = HUDController.MAX_HINT;
  public static readonly MAX_UNDO = HUDController.MAX_UNDO;

  // Contador de jogadas
  private pairsMatchedThisGame: number = 0;
  private synergiesTriggeredThisGame: number = 0;
  private isRestarting: boolean = false;
  private zenRescueTimer: ReturnType<typeof setTimeout> | null = null;

  // DOM — Screens & Containers
  private screenMenu!: HTMLElement;
  private screenGame!: HTMLElement;
  private traySlotsContainer!: HTMLElement;
  private traySlotEls: HTMLElement[] = [];
  private traySlotCanvases: HTMLCanvasElement[] = [];

  // DOM — Buttons
  private undoBtn!: HTMLButtonElement;
  private hintBtn!: HTMLButtonElement;
  private shuffleBtn!: HTMLButtonElement;
  private hammerBtn!: HTMLButtonElement;
  private restartBtn!: HTMLButtonElement;
  private levelsBtn!: HTMLButtonElement;
  private settingsBtn!: HTMLButtonElement;
  private menuBackBtn!: HTMLButtonElement;

  // DOM — Modals
  private levelsModal!: HTMLElement;
  private settingsModal!: HTMLElement;
  private victoryModal!: HTMLElement;
  private statsModal!: HTMLElement;
  private restartConfirmModal!: HTMLElement;
  private btnRestartCancel!: HTMLButtonElement;
  private btnRestartConfirm!: HTMLButtonElement;

  // DOM & Timers — Cortina de Folhagens & Fauna Zen
  private foliageCurtain: HTMLElement | null = null;
  private foliageTransitionTimer: ReturnType<typeof setTimeout> | null = null;
  private mascotSpeechTimer: ReturnType<typeof setTimeout> | null = null;

  public static readonly BIOME_GUARDIANS = [
    {
      world: 1,
      name: 'Mundo 1 · Jardim das Lótus',
      badge: '🌿 Jardim',
      emoji: '🌿',
      avatar: './assets/nature/guardian-1-panda.svg',
      quote: '"A serenidade revela os pares ocultos."',
    },
    {
      world: 2,
      name: 'Mundo 2 · Vale do Bambu',
      badge: '🎋 Vale',
      emoji: '🎋',
      avatar: './assets/nature/guardian-2-cricket.svg',
      quote: '"A paciência dobra o bambu sem quebrar."',
    },
    {
      world: 3,
      name: 'Mundo 3 · Montanha Crepuscular',
      badge: '⛰️ Montanha',
      emoji: '⛰️',
      avatar: './assets/nature/guardian-3-fox.svg',
      quote: '"A astúcia enxerga além do nevoeiro da montanha."',
    },
    {
      world: 4,
      name: 'Mundo 4 · Floresta Ancestral',
      badge: '🌲 Floresta',
      emoji: '🌲',
      avatar: './assets/nature/guardian-4-deer.svg',
      quote: '"As raízes antigas sustentam cada movimento."',
    },
    {
      world: 5,
      name: 'Mundo 5 · Cume Celestial',
      badge: '✨ Celestial',
      emoji: '✨',
      avatar: './assets/nature/guardian-5-dragon.svg',
      quote: '"No ápice dos céus, o mestre encontra a harmonia total."',
    },
  ];

  private static readonly PANDA_QUOTES = [
    'Que a serenidade guie seus pares hoje! 🌿',
    'Respira fundo... As pedras livres se revelarão! 🎋',
    'O bambu ensina que a flexibilidade vence a rigidez. 🐼',
    'Em cada combinação há harmonia e paz! ✨',
    'Não tenha pressa, o tempo aqui é seu amigo. 🍵',
    'Os animais da floresta torcem por você! 🌸',
  ];

  constructor(engine: BoardEngine, renderer: BoardRenderer) {
    this.engine = engine;
    this.renderer = renderer;

    this.natureFeedback = new NatureFeedbackController({
      triggerHudPulse: () => this.triggerHudPulse(),
      updateHUD: () => this.updateHUD(),
    });

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

    this.traySlotsContainer = document.getElementById('tray-slots')!;
    this.traySlotEls = Array.from(document.querySelectorAll('.tray-slot'));

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

    this.levelsModal  = document.getElementById('modal-levels')!;
    this.settingsModal = document.getElementById('modal-settings')!;
    this.victoryModal = document.getElementById('modal-victory')!;
    this.statsModal   = document.getElementById('modal-stats')!;
    this.restartConfirmModal = document.getElementById('modal-restart-confirm')!;
    this.btnRestartCancel    = document.getElementById('btn-restart-cancel') as HTMLButtonElement;
    this.btnRestartConfirm   = document.getElementById('btn-restart-confirm') as HTMLButtonElement;
    this.foliageCurtain      = document.getElementById('foliage-curtain');
  }

  // ─── Events ───────────────────────────────────────────────────────────────

  private attachEvents(): void {
    // Menu principal com transição cinematográfica de folhagens
    document.getElementById('btn-menu-play')?.addEventListener('click', () => {
      this.playFoliageTransition(() => {
        this.startGame(this.currentLevelIndex);
      }, this.currentLevelIndex);
    });
    const btnMenuLevels = document.getElementById('btn-menu-levels');
    const openLevelsMap = () => {
      soundManager.playTileClick();
      hapticManager.impactLight();
      LevelsModal.renderLevelsList(
        this.currentLevelIndex,
        (idx: number) => {
          this.playFoliageTransition(() => {
            this.startGame(idx);
          }, idx);
        },
        (msg: string) => this.showToast(msg)
      );
      this.levelsModal.classList.remove('hidden');
    };
    btnMenuLevels?.addEventListener('click', openLevelsMap);
    btnMenuLevels?.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLevelsMap();
      }
    });
    document.getElementById('btn-menu-stats')?.addEventListener('click', () => {
      GameEndModals.renderStats();
      this.statsModal.classList.remove('hidden');
    });

    // Voltar ao menu
    this.menuBackBtn.addEventListener('click', () => {
      soundManager.playTileClick();
      hapticManager.impactLight();
      this.hud.stopTimer();
      this.showMenu();
    });

    // Reiniciar
    this.restartBtn.addEventListener('click', () => {
      soundManager.playTileClick();
      hapticManager.impactLight();
      this.cancelHammerMode();

      if (this.engine.getHistoryLength() === 0 && this.engine.getTray().length === 0) {
        this.startGame(this.currentLevelIndex);
        return;
      }
      this.restartConfirmModal.classList.remove('hidden');
    });

    this.btnRestartCancel?.addEventListener('click', () => {
      soundManager.playTileClick();
      hapticManager.impactLight();
      this.restartConfirmModal.classList.add('hidden');
    });

    this.btnRestartConfirm?.addEventListener('click', () => {
      soundManager.playTileClick();
      hapticManager.impactMedium();
      this.restartConfirmModal.classList.add('hidden');
      this.startGame(this.currentLevelIndex);
    });

    // Desfazer
    this.undoBtn.addEventListener('click', () => {
      this.cancelHammerMode();
      if (this.hud.undoCount <= 0) {
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
        this.hud.undoCount--;
        this.hud.updatePowerUpBadges(this.engine.getHistoryLength() > 0);
        soundManager.playTileClick();
        hapticManager.impactLight();

        if (undoResult.tile) {
          const tile = undoResult.tile;
          tile.inFlight = true;
          this.renderer.isInputLocked = true;
          const coords = this.renderer.getTileViewportCoords(tile);
          const lastSlotIdx = Math.min(this.engine.getTray().length, this.traySlotEls.length - 1);
          const slotEl = this.traySlotEls[lastSlotIdx] || this.traySlotsContainer;
          this.trayAnimator.animateTileFromTrayToBoard(
            tile,
            slotEl,
            coords.left,
            coords.top,
            coords.width,
            coords.height,
            this.renderer.getTileRenderer(),
            () => {
              tile.inFlight = false;
              this.renderer.isInputLocked = false;
              this.renderer.requestRender();
              this.updateHUD();
            }
          );
        } else {
          this.renderer.requestRender();
        }

        if (undoResult.type === 'pair_restored') {
          if (undoResult.secondaryTiles && undoResult.secondaryTiles.length > 0) {
            this.showToast(`↩️ Par e peças de sinergia restaurados! (${this.hud.undoCount} restante${this.hud.undoCount === 1 ? '' : 's'})`);
          } else {
            this.showToast(`↩️ Par restaurado à mesa! (${this.hud.undoCount} restante${this.hud.undoCount === 1 ? '' : 's'})`);
          }
        } else {
          this.showToast(`Peça devolvida! (${this.hud.undoCount} restante${this.hud.undoCount === 1 ? '' : 's'})`);
        }
        this.updateHUD();
      }
    });

    // Dica
    this.hintBtn.addEventListener('click', () => {
      this.cancelHammerMode();
      if (this.hud.hintCount <= 0) {
        this.showToast('Sem dicas restantes nesta fase!');
        soundManager.playBlockedSound();
        return;
      }
      this.engine.getTiles().forEach((t) => (t.isHinted = false));
      const hintPair = this.engine.getHintPair();
      if (hintPair) {
        this.hud.hintCount--;
        this.hud.updatePowerUpBadges(this.engine.getHistoryLength() > 0);
        const t1 = this.engine.getTiles().find((t) => t.id === hintPair.tile1Id);
        const t2 = this.engine.getTiles().find((t) => t.id === hintPair.tile2Id);
        if (t1) t1.isHinted = true;
        if (t2) t2.isHinted = true;
        soundManager.playTileClick();
        hapticManager.impactLight();
        this.renderer.triggerAnimation(4000);
        this.renderer.requestRender();
        this.showToast(`Dica revelada! (${this.hud.hintCount} restante${this.hud.hintCount === 1 ? '' : 's'})`);
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

    // Misturar
    this.shuffleBtn.addEventListener('click', () => {
      this.cancelHammerMode();
      if (this.hud.shuffleCount <= 0) {
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
        this.hud.shuffleCount--;
        this.hud.updatePowerUpBadges(this.engine.getHistoryLength() > 0);
        soundManager.playShuffleSound();
        hapticManager.impactMedium();
        this.renderer.triggerShuffleAnimation(500);
        this.showToast(`Peças misturadas! (${this.hud.shuffleCount} restante${this.hud.shuffleCount === 1 ? '' : 's'})`);
        this.updateHUD();
      }
    });

    // Marreta
    this.hammerBtn.addEventListener('click', () => {
      if (this.hud.hammerCount <= 0) {
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

    // Modal Fases
    this.levelsBtn.addEventListener('click', () => {
      soundManager.playTileClick();
      hapticManager.impactLight();
      LevelsModal.renderLevelsList(
        this.currentLevelIndex,
        (idx: number) => this.startGame(idx),
        (msg: string) => this.showToast(msg)
      );
      this.levelsModal.classList.remove('hidden');
    });

    // Modal Configurações (Acessível pelo HUD do jogo e pelo Menu Inicial)
    const openSettings = () => {
      soundManager.playTileClick();
      hapticManager.impactLight();
      SettingsModal.renderSettingsOptions(
        this.prefs,
        (updated) => {
          this.prefs = updated;
          StorageManager.savePreferences(this.prefs);
          this.applyPreferences();
          soundManager.playTileClick();
          hapticManager.impactLight();
          this.renderer.requestRender();
        },
        () => {
          // Solicitação de reset de dados
          const resetModal = document.getElementById('modal-reset-confirm');
          resetModal?.classList.remove('hidden');
        }
      );
      this.settingsModal.classList.remove('hidden');
    };

    this.settingsBtn.addEventListener('click', openSettings);
    document.getElementById('btn-menu-settings')?.addEventListener('click', openSettings);

    // Diálogo de confirmação de reset de progresso
    const resetModal = document.getElementById('modal-reset-confirm');
    document.getElementById('btn-reset-cancel')?.addEventListener('click', () => {
      soundManager.playTileClick();
      hapticManager.impactLight();
      resetModal?.classList.add('hidden');
    });

    document.getElementById('btn-reset-confirm-action')?.addEventListener('click', () => {
      soundManager.playTileClick();
      hapticManager.impactMedium();
      StorageManager.resetAllProgress();
      resetModal?.classList.add('hidden');
      this.settingsModal.classList.add('hidden');

      this.currentLevelIndex = 0;
      this.hud.updateMenuProgress();
      this.showToast('Todo o progresso foi reiniciado com sucesso! 🌿');

      // Se estiver na tela de jogo, volta ao menu
      const gameScreen = document.getElementById('screen-game');
      if (gameScreen && !gameScreen.classList.contains('hidden')) {
        this.hud.stopTimer();
        this.showMenu();
      }
    });

    // Modal Guia da Natureza
    const helpBtn = document.getElementById('btn-help');
    const natureGuideModal = document.getElementById('modal-nature-guide');
    if (helpBtn && natureGuideModal) {
      helpBtn.addEventListener('click', () => {
        natureGuideModal.classList.remove('hidden');
        soundManager.playTileClick();
        hapticManager.impactLight();
      });
    }
    const natureEventBox = document.getElementById('nature-event-box');
    if (natureEventBox && natureGuideModal) {
      natureEventBox.addEventListener('click', () => {
        natureGuideModal.classList.remove('hidden');
        soundManager.playTileClick();
        hapticManager.impactLight();
      });
    }

    document.getElementById('tutorial-tip-banner')?.addEventListener('click', () => {
      document.getElementById('tutorial-tip-banner')?.classList.add('hidden');
    });

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
        hapticManager.impactLight();
      });
    });

    document.querySelectorAll('.modal-close').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        soundManager.playTileClick();
        hapticManager.impactLight();
        (e.target as HTMLElement).closest('.modal-container')?.classList.add('hidden');
      });
    });
    document.getElementById('btn-levels-back')?.addEventListener('click', () => {
      soundManager.playTileClick();
      hapticManager.impactLight();
      this.levelsModal.classList.add('hidden');
    });
    document.querySelectorAll('.modal-container').forEach((modal) => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          soundManager.playTileClick();
          modal.classList.add('hidden');
        }
      });
    });

    document.getElementById('nature-toast')?.addEventListener('click', () => {
      document.getElementById('nature-toast')?.classList.add('hidden');
    });

    document.getElementById('btn-next-level')?.addEventListener('click', () => {
      soundManager.playTileClick();
      hapticManager.impactLight();
      this.victoryModal.classList.add('hidden');
      const nextIdx = Math.min(this.currentLevelIndex + 1, ALL_LAYOUTS.length - 1);
      this.playFoliageTransition(() => {
        this.startGame(nextIdx);
      }, nextIdx);
    });
    document.getElementById('btn-replay')?.addEventListener('click', () => {
      soundManager.playTileClick();
      hapticManager.impactLight();
      this.victoryModal.classList.add('hidden');
      this.startGame(this.currentLevelIndex);
    });

    // Interação Tátil com o Mascote Panda Zen (Fauna do Menu)
    const mascotContainer = document.getElementById('menu-mascot-container');
    const speechBubble = document.getElementById('mascot-speech-bubble');
    const speechText = document.getElementById('mascot-speech-text');

    if (mascotContainer) {
      mascotContainer.addEventListener('click', () => {
        soundManager.playTileClick();
        hapticManager.impactLight();

        mascotContainer.classList.remove('mascot-reacting');
        void mascotContainer.offsetWidth; // Força reinício da animação CSS
        mascotContainer.classList.add('mascot-reacting');

        if (speechBubble && speechText) {
          const quotes = UIManager.PANDA_QUOTES;
          const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
          speechText.textContent = randomQuote;
          speechBubble.classList.remove('hidden');

          if (this.mascotSpeechTimer) clearTimeout(this.mascotSpeechTimer);
          this.mascotSpeechTimer = setTimeout(() => {
            speechBubble.classList.add('hidden');
            this.mascotSpeechTimer = null;
          }, 3400);
        }
      });
    }

    // Botão de continuar do briefing da fase na cortina de folhagens
    document.getElementById('btn-foliage-continue')?.addEventListener('click', (e) => {
      e.stopPropagation();
      (e.currentTarget as HTMLElement | null)?.blur();
      this.dismissFoliageCurtain();
    });

    // Toque na cortina também permite prosseguir
    if (this.foliageCurtain) {
      this.foliageCurtain.addEventListener('click', (e) => {
        const target = e.target as HTMLElement | null;
        if (target?.closest('#btn-foliage-continue')) return;
        if (this.foliageCurtain?.classList.contains('active')) {
          this.dismissFoliageCurtain();
        }
      });
    }
  }

  // ─── Screen Navigation ────────────────────────────────────────────────────

  private showMenu(): void {
    this.hud.stopTimer();
    this.cancelHammerMode();
    this.natureFeedback.clearTimers();
    if (this.zenRescueTimer) {
      clearTimeout(this.zenRescueTimer);
      this.zenRescueTimer = null;
    }
    this.isRestarting = false;
    document.querySelectorAll('.modal-container').forEach((m) => m.classList.add('hidden'));
    this.currentLevelIndex = this.hud.updateMenuProgress();
    this.updateMenuVersion();
    this.screenMenu.classList.remove('hidden');
    this.screenGame.classList.add('hidden');
    this.renderer.pause();
  }

  private async updateMenuVersion(): Promise<void> {
    const el = document.getElementById('menu-version-text');
    if (!el) return;
    const activeBundle = await LiveUpdateManager.getActiveBundleId();
    el.textContent = activeBundle
      ? `v1.0.1 (${activeBundle}) · 100% Offline`
      : `v1.0.1 · 100% Offline`;
  }

  private showGame(): void {
    this.screenMenu.classList.add('hidden');
    this.screenGame.classList.remove('hidden');
    this.renderer.resume();
  }

  /**
   * Finaliza a exibição do briefing da fase e abre as cortinas de folhagem suavemente.
   */
  public dismissFoliageCurtain(): void {
    if (!this.foliageCurtain || !this.foliageCurtain.classList.contains('active')) return;

    soundManager.playTileClick('leaf');
    hapticManager.impactLight();

    // 1. Desfoca o botão para evitar que descendente com foco bloqueie aria-hidden na árvore WAI-ARIA
    const continueBtn = document.getElementById('btn-foliage-continue') as HTMLElement | null;
    continueBtn?.blur();

    // 2. Aplica 'inert' imediatamente para suprimir interação e foco durante a transição
    this.foliageCurtain.setAttribute('inert', '');
    this.foliageCurtain.removeAttribute('aria-hidden');

    this.foliageCurtain.classList.remove('active');
    this.foliageCurtain.classList.add('opening');

    // Inicia o timer do HUD agora que o jogador vai começar a jogar
    this.hud.startTimer();

    if (this.foliageTransitionTimer) {
      clearTimeout(this.foliageTransitionTimer);
    }

    this.foliageTransitionTimer = setTimeout(() => {
      this.foliageCurtain?.classList.remove('opening');
      this.foliageCurtain?.classList.add('hidden');
      this.foliageCurtain?.setAttribute('aria-hidden', 'true');
      this.foliageTransitionTimer = null;
    }, 420);
  }

  /**
   * Executa a transição orgânica de Cortina de Folhagens fechando da esquerda/direita,
   * apresentando o briefing completo da fase (peças, ondas, sinergias e mecânicas)
   * e aguardando o jogador clicar em "Continuar" para abrir as cortinas e jogar.
   */
  public playFoliageTransition(onSwitch: () => void, targetLevelIndex?: number): void {
    const curtain = this.foliageCurtain;
    if (!curtain) {
      onSwitch();
      return;
    }

    const lvlIdx = targetLevelIndex ?? this.currentLevelIndex;
    const worldIdx = Math.max(0, Math.min(4, Math.floor(lvlIdx / 10)));
    const guardian = UIManager.BIOME_GUARDIANS[worldIdx];
    const layout = ALL_LAYOUTS[lvlIdx];
    const rules = getLevelRules(lvlIdx, layout?.slots.length);

    const avatarEl = document.getElementById('foliage-guardian-avatar') as HTMLImageElement | null;
    const tagEl = document.getElementById('foliage-biome-tag');
    const titleEl = document.getElementById('foliage-level-title');
    const statTilesEl = document.getElementById('foliage-stat-tiles');
    const statWavesEl = document.getElementById('foliage-stat-waves');
    const statDiffEl = document.getElementById('foliage-stat-diff');
    const mechanicBox = document.getElementById('foliage-mechanic-box');
    const mechanicIcon = document.getElementById('foliage-mechanic-icon');
    const mechanicLabel = document.getElementById('foliage-mechanic-label');
    const mechanicText = document.getElementById('foliage-mechanic-text');
    const synListEl = document.getElementById('foliage-synergies-list');

    // 1. Avatar e Título
    if (avatarEl) avatarEl.src = guardian.avatar;
    if (tagEl) tagEl.textContent = guardian.name.toUpperCase();
    if (titleEl) titleEl.textContent = `Fase ${lvlIdx + 1}: ${layout ? layout.name : 'Jornada Zen'}`;

    // 2. Estatísticas da Fase: Peças, Ondas e Dificuldade
    if (layout) {
      const totalTiles = layout.slots.length;
      const waveCount = layout.waves && layout.waves.length > 1 ? layout.waves.length : 1;
      if (statTilesEl) statTilesEl.textContent = `🧩 ${totalTiles} Peças`;
      if (statWavesEl) statWavesEl.textContent = waveCount > 1 ? `🌊 ${waveCount} Ondas` : `🌊 Onda Única`;
      if (statDiffEl) statDiffEl.textContent = `⭐ ${layout.difficulty}`;
    }

    // 3. Mecânica Didática / Regra Especial / Sabedoria do Guardião
    if (mechanicBox && mechanicText) {
      if (rules.mechanicIntro) {
        if (mechanicIcon) mechanicIcon.textContent = '✨';
        if (mechanicLabel) mechanicLabel.textContent = 'NOVA MECÂNICA';
        mechanicText.textContent = rules.mechanicIntro;
        mechanicBox.classList.remove('hidden');
      } else if (rules.allowedSpecials && rules.allowedSpecials.length > 0) {
        if (mechanicIcon) mechanicIcon.textContent = '🌿';
        if (mechanicLabel) mechanicLabel.textContent = 'REGRAS DESTE BIOMA';
        const specialNames: string[] = rules.allowedSpecials.map((s) => {
          switch (s) {
            case 'mirror': return '🪞 Espelho Místico';
            case 'ice': return '❄️ Peça Congelada';
            case 'vines': return '🌿 Cipós';
            case 'rock': return '🪨 Rocha Ancestral';
            case 'cocoon': return '🥚 Casulo';
            case 'chest': return '🎁 Baú da Fortuna';
            default: return s;
          }
        });
        if (rules.allowChameleon) specialNames.push('🦎 Camaleão Coringa');
        mechanicText.textContent = `Peças especiais presentes: ${specialNames.join(', ')}.`;
        mechanicBox.classList.remove('hidden');
      } else {
        if (mechanicIcon) mechanicIcon.textContent = '🎋';
        if (mechanicLabel) mechanicLabel.textContent = 'SABEDORIA ZEN';
        mechanicText.textContent = guardian.quote;
        mechanicBox.classList.remove('hidden');
      }
    }

    // 4. Sinergias Disponíveis na Fauna deste Bioma
    if (synListEl) {
      const synergies = LevelDeckCurator.getLevelSynergies(rules.biome);
      if (synergies.length > 0) {
        synListEl.innerHTML = synergies
          .slice(0, 3)
          .map(
            (s) => `
            <div class="foliage-syn-pill" title="${s.description}">
              <span class="syn-pill-icon">${s.icon}</span>
              <span class="syn-pill-text">${s.title}</span>
            </div>
          `
          )
          .join('');
      } else {
        synListEl.innerHTML = `
          <div class="foliage-syn-pill">
            <span class="syn-pill-icon">🐾</span>
            <span class="syn-pill-text">Pares Livres de Animais</span>
          </div>
        `;
      }
    }

    soundManager.playTileClick('leaf');
    hapticManager.impactLight();

    if (this.foliageTransitionTimer) {
      clearTimeout(this.foliageTransitionTimer);
    }

    curtain.removeAttribute('inert');
    curtain.setAttribute('aria-hidden', 'false');
    curtain.classList.remove('hidden', 'opening');
    curtain.classList.add('closing');

    // Fechamento das cortinas e troca de tela/carregamento por trás
    this.foliageTransitionTimer = setTimeout(() => {
      // 1. Atualiza o estado da cortina imediatamente para transição suave a 60 FPS
      this.hud.stopTimer();
      curtain.classList.remove('closing');
      curtain.classList.add('active');
      curtain.removeAttribute('inert');
      curtain.setAttribute('aria-hidden', 'false');
      this.foliageTransitionTimer = null;

      // 2. Monta o tabuleiro e troca de tela sem prender o frame de renderização (evita violation de frame longo)
      setTimeout(() => {
        onSwitch();
        this.hud.stopTimer();
      }, 0);
    }, 380);
  }

  // ─── Iniciar Partida ──────────────────────────────────────────────────────

  public startGame(levelIndex: number): void {
    this.currentLevelIndex = Math.max(0, Math.min(levelIndex, ALL_LAYOUTS.length - 1));
    const layout = ALL_LAYOUTS[this.currentLevelIndex];

    this.showGame();

    this.engine = new BoardEngine(layout, this.currentLevelIndex);
    this.renderer.setLevelIndex(this.currentLevelIndex);
    this.renderer.setEngine(this.engine);
    this.isHammerActive = false;
    this.hammerBtn.classList.remove('active-hammer');
    this.pairsMatchedThisGame = 0;
    this.synergiesTriggeredThisGame = 0;
    this.engine.resetHarmonyScore();
    this.isRestarting = false;
    if (this.zenRescueTimer) {
      clearTimeout(this.zenRescueTimer);
      this.zenRescueTimer = null;
    }
    this.renderer.isInputLocked = false;
    if (this.traySlotsContainer) {
      this.traySlotsContainer.classList.remove('warning-full', 'zen-rescue-swirl');
    }

    this.hud.resetCharges();
    StorageManager.incrementGamesPlayed();

    this.hud.startTimer();
    this.renderer.triggerDealAnimation(420);
    this.updateHUD();

    // 🎵 Inicia uma nova música aleatória para esta fase (Shuffle randômico a cada início de fase)
    soundManager.playRandomTrack();

    // Dica de mecânica e regras foram incorporadas no briefing da cortina de transição

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

  // ─── HUD Update ───────────────────────────────────────────────────────────

  public updateHUD(): void {
    const levelEl = document.getElementById('wisdom-level');
    if (levelEl) levelEl.textContent = `${this.currentLevelIndex + 1}`;

    const biomeBadgeEl = document.getElementById('hud-biome-badge');
    if (biomeBadgeEl) {
      const worldIdx = Math.max(0, Math.min(4, Math.floor(this.currentLevelIndex / 10)));
      const guardian = UIManager.BIOME_GUARDIANS[worldIdx];
      biomeBadgeEl.textContent = guardian.emoji;
      biomeBadgeEl.setAttribute('title', guardian.name);
      biomeBadgeEl.setAttribute('aria-label', guardian.name);
    }

    const waveBadgeEl = document.getElementById('hud-wave-badge');
    if (waveBadgeEl) {
      if (this.engine.getTotalWaves() > 1) {
        waveBadgeEl.textContent = `${this.engine.getCurrentWave()}/${this.engine.getTotalWaves()}`;
        waveBadgeEl.classList.remove('hidden');
      } else {
        waveBadgeEl.classList.add('hidden');
      }
    }

    if (this.engine.isWaveCleared() && this.engine.hasMoreWaves()) {
      const waveModal = document.getElementById('modal-wave-cleared');
      if (waveModal && waveModal.classList.contains('hidden')) {
        this.handleWaveCleared(this.engine.getCurrentWave(), this.engine.getTotalWaves());
      }
    }

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
          this.trayAnimator.renderTileToCanvas(canvas, tile, this.renderer.getTileRenderer());
        }

        if (this.isHammerActive) {
          slotEl.classList.add('can-hammer');
        } else {
          slotEl.classList.remove('can-hammer');
        }

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

    if (tray.length >= maxSlots) {
      this.traySlotsContainer.classList.add('warning-full');

      if (this.hud.hammerCount <= 0 && this.hud.undoCount <= 0) {
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

          this.zenRescueTimer = setTimeout(() => {
            this.engine.zenRescue();
            this.isRestarting = false;
            this.zenRescueTimer = null;
            this.traySlotsContainer.classList.remove('warning-full', 'zen-rescue-swirl');
            this.renderer.requestRender();
            this.updateHUD();
          }, 900);
        }
      } else {
        this.showNatureEvent('⚠️', 'Bandeja Cheia (4/4)!', 'Toque na Marreta 🔨 ou Desfazer ↩️!');
      }
    } else {
      this.traySlotsContainer.classList.remove('warning-full');
    }

    this.hud.updatePowerUpBadges(this.engine.getHistoryLength() > 0);
  }

  public cancelHammerMode(): void {
    if (this.isHammerActive) {
      this.isHammerActive = false;
      this.hammerBtn.classList.remove('active-hammer');
      this.traySlotEls.forEach((slotEl) => slotEl.classList.remove('can-hammer'));
    }
  }

  private useHammerOnSlot(tile: PlacedTile, slotEl: HTMLElement): void {
    if (this.hud.hammerCount <= 0) return;

    this.hud.hammerCount--;
    this.isHammerActive = false;
    this.hammerBtn.classList.remove('active-hammer');
    this.hud.updatePowerUpBadges(this.engine.getHistoryLength() > 0);

    soundManager.playHammerSmash();
    hapticManager.impactHeavy();

    slotEl.classList.add('smash-shatter');
    this.showToast(`💥 Peça esmagada! (${this.hud.hammerCount} restante${this.hud.hammerCount === 1 ? '' : 's'})`);

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
        this.handleWaveCleared(this.engine.getCurrentWave(), this.engine.getTotalWaves());
      }
    }, 280);
  }

  private returnTileFromTray(tile: PlacedTile, slotEl: HTMLElement): void {
    if (this.renderer.isInputLocked) return;

    tile.inFlight = true;
    const undoResult = this.engine.undoSpecificTrayTile(tile.id);
    if (undoResult.success) {
      soundManager.playTileClick();
      hapticManager.impactLight();

      slotEl.classList.add('tray-return-anim');
      const coords = this.renderer.getTileViewportCoords(tile);
      this.renderer.isInputLocked = true;

      this.trayAnimator.animateTileFromTrayToBoard(
        tile,
        slotEl,
        coords.left,
        coords.top,
        coords.width,
        coords.height,
        this.renderer.getTileRenderer(),
        () => {
          tile.inFlight = false;
          slotEl.classList.remove('tray-return-anim');
          this.renderer.isInputLocked = false;
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
    const targetSlot = this.traySlotEls[targetIdx] || this.traySlotsContainer;
    this.trayAnimator.animateTileToTray(
      tile,
      startX,
      startY,
      width,
      height,
      targetSlot,
      this.renderer.getTileRenderer(),
      onArrival
    );
  }

  // ─── Victory ──────────────────────────────────────────────────────────────

  public handleVictory(): void {
    this.hud.stopTimer();

    const timeSeconds = this.hud.elapsedSeconds;
    const layoutId = this.engine.getLayout().id;

    const toolsRemaining =
      this.hud.hammerCount +
      this.hud.shuffleCount +
      this.hud.hintCount +
      (this.hud.undoCount > 0 ? 1 : 0);

    const harmonyScore = this.engine.getHarmonyScore();

    const levelStats = StorageManager.recordVictory(
      layoutId,
      timeSeconds,
      toolsRemaining,
      this.synergiesTriggeredThisGame,
      harmonyScore
    );
    StorageManager.incrementGamesWon(
      timeSeconds,
      this.pairsMatchedThisGame,
      this.currentLevelIndex,
      this.synergiesTriggeredThisGame
    );

    const nextLevelIdx = this.currentLevelIndex + 1;
    if (nextLevelIdx < ALL_LAYOUTS.length) {
      StorageManager.unlockLevel(nextLevelIdx);
    }

    GameEndModals.showVictoryModal(
      timeSeconds,
      toolsRemaining,
      harmonyScore,
      levelStats,
      this.currentLevelIndex
    );
    soundManager.playVictoryFanfare?.();
    hapticManager.impactVictory?.();
  }

  public recordMatchedPair(pair?: [PlacedTile, PlacedTile]): void {
    this.pairsMatchedThisGame++;
    if (pair && pair.some((t) => t.value === 'chameleon' || t.value === 'honeycomb')) {
      const specialTile = pair.find((t) => t.value === 'chameleon' || t.value === 'honeycomb');
      const badges = [
        document.getElementById('badge-undo'),
        document.getElementById('badge-hint'),
      ].filter((el): el is HTMLElement => Boolean(el));

      if (specialTile) {
        const coords = this.renderer.getTileViewportCoords(specialTile);
        this.trayAnimator.spawnLotusManaSparks(badges, coords.left + coords.width / 2, coords.top + coords.height / 2);
      } else {
        this.trayAnimator.spawnLotusManaSparks(badges);
      }
    }
  }

  public handleWaveCleared(currentWave: number, totalWaves: number): void {
    GameEndModals.showWaveCleared(currentWave, totalWaves, () => {
      this.engine.advanceToNextWave();
      this.renderer.handleResize();
      this.renderer.prewarmActiveTiles();
      this.renderer.triggerDealAnimation(420);
      this.renderer.requestRender();
      this.updateHUD();
      this.showNatureToast('🌊', `Onda ${this.engine.getCurrentWave()} Iniciada!`, 'Novas peças na mesa com peças gigantes!');
    });
  }

  // ─── Sinergias & Climas da Natureza ───────────────────────────────────────

  public triggerHudPulse(): void {
    const hudTitle = document.querySelector('.wisdom-title-container');
    if (hudTitle) {
      hudTitle.classList.remove('pulse-glow');
      void (hudTitle as HTMLElement).offsetWidth;
      hudTitle.classList.add('pulse-glow');
    }
  }

  public handleSynergy(synergy: SynergyResult): void {
    this.synergiesTriggeredThisGame++;
    this.natureFeedback.handleSynergy(synergy);
  }

  public handleClimate(climate: ClimateEffectResult): void {
    this.synergiesTriggeredThisGame++;
    this.natureFeedback.handleClimate(climate, this.hud, this.engine.getHistoryLength() > 0);
  }

  public handleCosmicRescue(rescuedTiles: PlacedTile[]): void {
    this.natureFeedback.handleCosmicRescue(rescuedTiles, (msg) => this.showToast(msg));
  }

  public showNatureEvent(icon: string, title: string, desc: string): void {
    this.natureFeedback.showNatureEvent(icon, title, desc);
  }

  public showNatureToast(icon: string, title: string, desc: string): void {
    this.natureFeedback.showNatureToast(icon, title, desc);
  }

  public handleTileLongPress(tile: PlacedTile): void {
    this.natureFeedback.handleTileLongPress(tile);
  }

  // ─── Feedback Messages ───────────────────────────────────────────────────

  public showBlockedTip(message: string): void {
    this.natureFeedback.showBlockedTip(message);
  }

  public showTutorialTip(message: string): void {
    this.natureFeedback.showTutorialTip(message);
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
