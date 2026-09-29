import { BoardEngine } from '../core/BoardEngine';
import { BoardRenderer } from '../render/BoardRenderer';
import { ALL_LAYOUTS } from '../core/layouts';
import { StorageManager } from '../storage/StorageManager';
import { soundManager } from '../audio/SoundManager';
import { hapticManager } from '../audio/HapticManager';
import { PlacedTile, SynergyResult, ClimateEffectResult, TimeOfDay } from '../core/types';
import { LiveUpdateManager } from '../core/LiveUpdateManager';
import { LevelsModal } from './modals/LevelsModal';
import { SettingsModal } from './modals/SettingsModal';
import { GameEndModals } from './modals/GameEndModals';
import { HUDController } from './HUDController';
import { TrayAnimator } from './TrayAnimator';
import { NatureFeedbackController } from './NatureFeedbackController';
import { NatureGuideModal } from './modals/NatureGuideModal';
import { getLevelRules } from '../core/levelRules';
import { LevelDeckCurator } from '../core/nature/LevelDeckCurator';
import { TileRegistry } from '../core/nature/tiles/TileRegistry';
import { TrayTacticalOracle } from '../core/nature/TrayTacticalOracle';
import { diagnosticLogger } from '../core/DiagnosticLogger';

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
    this.preloadTransitionAssets();
  }

  // ─── Preload de Ativos de Transição (Zero Jank no Android) ────────────────
  private preloadTransitionAssets(): void {
    const assets = [
      './assets/nature/foliage-curtain-left.svg',
      './assets/nature/foliage-curtain-right.svg',
      ...UIManager.BIOME_GUARDIANS.map((g) => g.avatar),
    ];
    assets.forEach((src) => {
      const img = new Image();
      img.src = src;
      if ('decode' in img) {
        img.decode().catch(() => {});
      }
    });
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
      LiveUpdateManager.setGameActive(false);
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
      this.undoBtn.classList.remove('pulse-attention');
      diagnosticLogger.recordEvent('game', 'undo_click', { remainingUndos: this.hud.undoCount });
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
      diagnosticLogger.recordEvent('game', 'hint_click', { remainingHints: this.hud.hintCount });
      if (this.hud.hintCount <= 0) {
        this.showToast('Sem dicas restantes nesta fase!');
        soundManager.playBlockedSound();
        hapticManager.impactWarning();
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
        this.renderer.triggerAnimation(2200);
        this.renderer.requestRender();
        this.showToast(`Dica revelada! (${this.hud.hintCount} restante${this.hud.hintCount === 1 ? '' : 's'})`);
        setTimeout(() => {
          if (t1) t1.isHinted = false;
          if (t2) t2.isHinted = false;
          this.renderer.requestRender();
        }, 2200);
      } else {
        this.showToast('Nenhum par disponível! Use Misturar.');
        soundManager.playBlockedSound();
        hapticManager.impactWarning();
      }
      this.updateHUD();
    });

    // Misturar
    this.shuffleBtn.addEventListener('click', () => {
      this.cancelHammerMode();
      diagnosticLogger.recordEvent('game', 'shuffle_click', { remainingShuffles: this.hud.shuffleCount });
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
      this.hammerBtn.classList.remove('pulse-attention');
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
        },
        this.renderer
      );
      this.settingsModal.classList.remove('hidden');
    };

    this.settingsBtn.addEventListener('click', openSettings);
    document.getElementById('btn-menu-settings')?.addEventListener('click', openSettings);

    // Indicador da Trinca Sagrada Zen (Toque para explicação)
    document.getElementById('hud-trio-indicator')?.addEventListener('click', () => {
      soundManager.playTileClick();
      hapticManager.impactLight();
      const trioCandidate = this.engine.getActiveTrioCandidate();
      if (trioCandidate) {
        const def = TileRegistry.get(trioCandidate);
        const name = def?.label.split(' ').slice(1).join(' ') || trioCandidate;
        this.showToast(`Trinca Zen: combine a 3ª peça de ${name} para ativar o Clima e transmutar a 4ª em Camaleão 🦎!`);
      } else {
        this.showToast('Trinca Zen: combine 2 peças da mesma espécie para começar a Trinca Sagrada!');
      }
    });

    // Radar Tático da Bandeja / Caixa de Evento da Natureza (Toque para orientação tática completa)
    document.getElementById('nature-event-box')?.addEventListener('click', () => {
      soundManager.playTileClick();
      hapticManager.impactLight();
      const lastOracle = this.natureFeedback.getLastOracleResult();
      if (lastOracle) {
        this.showToast(`${lastOracle.icon} ${lastOracle.title}: ${lastOracle.description}`);
      } else {
        this.showToast('🌿 Diário Zen: Observe os pares livres e esvazie os slots da bandeja!');
      }
    });

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

    // Modal Guia da Natureza (Carregamento Tardio / Lazy Hydration)
    const helpBtn = document.getElementById('btn-help');
    const natureGuideModal = document.getElementById('modal-nature-guide');
    const openNatureGuide = () => {
      NatureGuideModal.hydrateGuide(soundManager, hapticManager);
      natureGuideModal?.classList.remove('hidden');
      soundManager.playTileClick();
      hapticManager.impactLight();
    };

    if (helpBtn && natureGuideModal) {
      helpBtn.addEventListener('click', openNatureGuide);
    }
    const natureEventBox = document.getElementById('nature-event-box');
    if (natureEventBox && natureGuideModal) {
      natureEventBox.addEventListener('click', openNatureGuide);
    }

    document.getElementById('tutorial-tip-banner')?.addEventListener('click', () => {
      document.getElementById('tutorial-tip-banner')?.classList.add('hidden');
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
        requestAnimationFrame(() => {
          mascotContainer.classList.add('mascot-reacting');
        });

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
    LiveUpdateManager.setGameActive(false);
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

  public handleAppVisibility(isVisible: boolean): void {
    if (!isVisible) {
      soundManager.suspend();
      this.hud.pauseTimer();
      this.renderer.pause();
    } else {
      soundManager.resume();
      if (!this.screenGame.classList.contains('hidden')) {
        this.hud.resumeTimer();
        this.renderer.resume();
      }
    }
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

      // 2. Executa a montagem do tabuleiro de forma assíncrona desacoplada do frame da cortina
      requestAnimationFrame(() => {
        onSwitch();
        this.hud.stopTimer();
      });
    }, 420);
  }

  // ─── Iniciar Partida ──────────────────────────────────────────────────────

  public startGame(levelIndex: number): void {
    const tStart = performance.now();
    this.currentLevelIndex = Math.max(0, Math.min(levelIndex, ALL_LAYOUTS.length - 1));
    const layout = ALL_LAYOUTS[this.currentLevelIndex];

    diagnosticLogger.recordEvent('game', 'start_game', {
      levelIndex: this.currentLevelIndex,
      layoutId: layout.id,
      layoutName: layout.name,
      tilesCount: layout.slots.length,
    });

    this.showGame();
    LiveUpdateManager.setGameActive(true);

    const t0 = performance.now();
    this.engine = new BoardEngine(layout, this.currentLevelIndex);
    const engineGenMs = performance.now() - t0;

    const t1 = performance.now();
    this.renderer.setLevelIndex(this.currentLevelIndex);
    this.renderer.setEngine(this.engine);
    const tilePrewarmMs = performance.now() - t1;

    const t2 = performance.now();
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

    const waveModal = document.getElementById('modal-wave-cleared');
    if (waveModal) waveModal.classList.add('hidden');
    [this.levelsModal, this.settingsModal, this.victoryModal].forEach((m) =>
      m.classList.add('hidden')
    );

    // Renderização do HUD e tabuleiro
    this.updateHUD();
    this.renderer.requestRender();
    const uiSetupMs = performance.now() - t2;
    const totalLoadMs = performance.now() - tStart;

    diagnosticLogger.recordPhaseLoad({
      levelIndex: this.currentLevelIndex,
      layoutId: layout.id,
      layoutName: layout.name,
      tilesCount: layout.slots.length,
      engineGenMs: Number(engineGenMs.toFixed(2)),
      tilePrewarmMs: Number(tilePrewarmMs.toFixed(2)),
      uiSetupMs: Number(uiSetupMs.toFixed(2)),
      totalLoadMs: Number(totalLoadMs.toFixed(2)),
      timestamp: Math.round(performance.now()),
    });

    // Tarefas em segundo plano (I/O de storage e áudio) fora da thread crítica de frame
    setTimeout(() => {
      StorageManager.incrementGamesPlayed();
      soundManager.playRandomTrack();
    }, 60);
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

    const trioCandidate = this.engine.getActiveTrioCandidate();
    const trioIndicatorEl = document.getElementById('hud-trio-indicator');
    if (trioIndicatorEl && !trioIndicatorEl.classList.contains('trio-completed-pulse')) {
      if (trioCandidate) {
        const def = TileRegistry.get(trioCandidate);
        const icon = def?.label.split(' ')[0] || '🀄';
        const name = def?.label.split(' ').slice(1).join(' ') || trioCandidate;
        const icon1 = document.getElementById('trio-icon-1');
        const icon2 = document.getElementById('trio-icon-2');
        const icon3 = document.getElementById('trio-icon-3');
        const textEl = document.getElementById('trio-text');
        if (icon1) icon1.textContent = icon;
        if (icon2) icon2.textContent = icon;
        if (icon3) {
          icon3.textContent = '○';
          icon3.className = 'trio-orb empty';
        }
        if (textEl) textEl.textContent = `Trinca: 3º ${name}!`;
        trioIndicatorEl.classList.remove('hidden');
      } else {
        trioIndicatorEl.classList.add('hidden');
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
      if (idx >= maxSlots) {
        slotEl.style.display = 'none';
        return;
      }
      slotEl.style.display = '';

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
            soundManager.playBlockedSound();
            hapticManager.impactLight();
            slotEl.classList.remove('slot-blocked-shake');
            requestAnimationFrame(() => {
              slotEl.classList.add('slot-blocked-shake');
            });
            setTimeout(() => {
              slotEl.classList.remove('slot-blocked-shake');
            }, 360);
            this.showToast('Peça guardada na bandeja! Combine com o par na mesa, use Desfazer ↩️ ou Marreta 🔨.');
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

      const isDeadlock = this.engine.isDeadlocked();
      if (isDeadlock) {
        this.handleDeadlock();
      }
    } else {
      this.traySlotsContainer.classList.remove('warning-full');
      if (this.undoBtn) this.undoBtn.classList.remove('pulse-attention');
      if (this.hammerBtn) this.hammerBtn.classList.remove('pulse-attention');
    }

    // Radar Tático da Bandeja: avalia slots e sugere a melhor jogada na caixa de eventos da natureza
    const worldIdx = Math.max(0, Math.min(4, Math.floor(this.currentLevelIndex / 10)));
    const guardian = UIManager.BIOME_GUARDIANS[worldIdx];
    const tacticalOpportunity = TrayTacticalOracle.evaluate(
      tray,
      this.engine.getFreeTiles(),
      this.engine.getActiveBoardTiles(),
      guardian?.name || 'Bosque Sereno',
      guardian?.emoji || '🌿'
    );
    this.natureFeedback.updateTacticalStatus(tacticalOpportunity);

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

    const nextLevelIdx = this.currentLevelIndex + 1;
    const hasNext = nextLevelIdx < ALL_LAYOUTS.length;

    const levelStats = StorageManager.recordVictoryBatch({
      layoutId,
      timeSeconds,
      toolsRemaining,
      synergiesTriggered: this.synergiesTriggeredThisGame,
      score: harmonyScore,
      pairsMatched: this.pairsMatchedThisGame,
      levelIndex: this.currentLevelIndex,
      nextLevelIndex: hasNext ? nextLevelIdx : undefined,
    });

    GameEndModals.showVictoryModal(
      timeSeconds,
      toolsRemaining,
      harmonyScore,
      levelStats,
      this.currentLevelIndex
    );

    LiveUpdateManager.setGameActive(false);
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
    let isNextWavePrepared = false;

    const prepareNextWaveInBackground = () => {
      if (isNextWavePrepared) return;
      isNextWavePrepared = true;
      this.engine.advanceToNextWave();
      this.renderer.handleResize();
      this.renderer.prewarmActiveTiles();
    };

    // Pré-calcula e pré-aquece a próxima onda em background enquanto o jogador lê o modal
    const prewarmTimer = setTimeout(() => {
      prepareNextWaveInBackground();
    }, 60);

    GameEndModals.showWaveCleared(currentWave, totalWaves, () => {
      clearTimeout(prewarmTimer);
      prepareNextWaveInBackground();
      this.renderer.triggerDealAnimation(420);
      this.renderer.requestRender();
      this.updateHUD();
    });
  }

  // ─── Sinergias & Climas da Natureza ───────────────────────────────────────

  public handleDeadlock(): void {
    const hasTools = this.hud.hammerCount > 0 || this.hud.undoCount > 0;

    if (!hasTools) {
      // Nos mundos 1 a 4 (Modo Tutorial / Aprendiz), mantém a Brisa da Compaixão como rede de segurança:
      if (this.currentLevelIndex < 20) {
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
        // Mundos 5 a 10: Derrota Tática Real por Deadlock!
        this.hud.stopTimer();
        soundManager.playBlockedSound();
        hapticManager.impactHeavy();
        GameEndModals.showGameOverModal(
          this.currentLevelIndex,
          () => this.startGame(this.currentLevelIndex),
          () => this.showMenu()
        );
      }
    } else {
      // Tem ferramentas disponíveis: destaca botões pulsando para o jogador se salvar
      if (this.hud.undoCount > 0 && this.undoBtn) {
        this.undoBtn.classList.remove('pulse-attention');
        requestAnimationFrame(() => this.undoBtn.classList.add('pulse-attention'));
      }
      if (this.hud.hammerCount > 0 && this.hammerBtn) {
        this.hammerBtn.classList.remove('pulse-attention');
        requestAnimationFrame(() => this.hammerBtn.classList.add('pulse-attention'));
      }
      this.showToast('⚠️ Bandeja travada! Use Desfazer ↩️ ou Marreta 🔨 para abrir espaço.', 3600, true);
    }
  }

  public triggerHudPulse(): void {
    const hudTitle = document.querySelector('.wisdom-title-container');
    if (hudTitle) {
      hudTitle.classList.remove('pulse-glow');
      requestAnimationFrame(() => {
        hudTitle.classList.add('pulse-glow');
      });
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

  public handleTrioMatched(trioTile: PlacedTile): void {
    const trioIndicatorEl = document.getElementById('hud-trio-indicator');
    if (trioIndicatorEl) {
      const def = TileRegistry.get(trioTile.value);
      const icon = def?.label.split(' ')[0] || '🀄';

      const icon3 = document.getElementById('trio-icon-3');
      const textEl = document.getElementById('trio-text');
      if (icon3) {
        icon3.textContent = icon;
        icon3.className = 'trio-orb filled';
      }
      if (textEl) textEl.textContent = '✨ TRINCA CONCLUÍDA!';
      trioIndicatorEl.classList.remove('hidden');
      trioIndicatorEl.classList.add('trio-completed-pulse');

      setTimeout(() => {
        trioIndicatorEl.classList.remove('trio-completed-pulse');
        trioIndicatorEl.classList.add('hidden');
      }, 1800);
    }
    this.triggerHudPulse();
    this.showNatureEvent(
      '🦎',
      'Trinca Sagrada Consagrada!',
      `A 3ª peça de ${trioTile.label} consagrou a Trinca! A 4ª peça virou Camaleão Coringa 🦎 (+500 Harmonia)!`
    );
    this.updateHUD();
  }

  public handleCosmicRescue(rescuedTiles: PlacedTile[]): void {
    this.natureFeedback.handleCosmicRescue(rescuedTiles, (msg) => this.showToast(msg));
  }

  public handleVinesEntangled(tile: PlacedTile): void {
    this.showToast(
      `🌿 ${tile.label} está presa por Vinhas da Selva! Combine herbívoros ou insetos vizinhos para pastar e podar.`,
      3600
    );
  }

  public handlePredation(predation: { predator: PlacedTile; prey: PlacedTile; bonusHarmony: number }): void {
    this.showToast(
      `🥩 Predação Ecológica! ${predation.predator.label} caçou ${predation.prey.label}! Slot da bandeja liberado (+${predation.bonusHarmony} pts)`,
      3600
    );
    this.updateHUD();
  }

  public handleTimeOfDayChanged(_newTime: TimeOfDay): void {
    // Transição silenciosa do ciclo solar/lunar sem popups para manter o tabuleiro 100% limpo
    this.updateHUD();
  }

  public handleCocoonCracked(tile: PlacedTile): void {
    const hitsLeft = tile.cocoonHits ?? 1;
    this.showToast(`🥚 O casulo trincou! (${hitsLeft} impacto restante para chocar)`, 3000);
  }

  public handleCocoonHatched(_tile: PlacedTile): void {
    this.showToast(`✨ O Ninho Chocou! Uma criatura mística emergiu (+250 Harmonia)!`, 3600);
    this.updateHUD();
  }

  public handleElementalSealed(tile: PlacedTile): void {
    const sealNames: Record<string, string> = {
      fire: 'Fogo 🔥',
      water: 'Água 💧',
      earth: 'Terra 🌿',
      air: 'Ar 💨',
    };
    const sealName = tile.elementalSeal ? sealNames[tile.elementalSeal] : 'Místico';
    this.showToast(
      `🔒 ${tile.label} está protegida pelo Selo de ${sealName}! Combine o par da Chave correspondente para quebrar a cúpula.`,
      3600
    );
  }

  public handleElementalUnsealed(unsealedTiles: PlacedTile[]): void {
    this.showToast(
      `✨ Cúpula Rúnica Rompida! ${unsealedTiles.length} ${unsealedTiles.length === 1 ? 'peça libertada' : 'peças libertadas'} do selo com +Harmonia Zen!`,
      3600
    );
    this.updateHUD();
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

  /**
   * Trata o botão físico/gesto de "Voltar" do Android.
   * Retorna true se consumiu o evento (fechou modal, preview ou voltou ao menu);
   * Retorna false se já estava no menu principal e pode sair do app.
   */
  public handleHardwareBack(): boolean {
    // 1. Fechar preview de fase se visível
    const preview = document.getElementById('atom-level-preview');
    if (preview && !preview.classList.contains('hidden')) {
      preview.classList.add('hidden');
      soundManager.playTileClick();
      hapticManager.impactLight();
      return true;
    }

    // 2. Fechar modais abertos do jogo em ordem de prioridade
    const modals = [
      this.restartConfirmModal,
      this.settingsModal,
      this.levelsModal,
      this.statsModal,
      this.victoryModal,
      document.getElementById('modal-nature-guide'),
      document.getElementById('modal-game-over'),
      document.getElementById('modal-update-dialog'),
    ];

    for (const m of modals) {
      if (m && !m.classList.contains('hidden')) {
        m.classList.add('hidden');
        soundManager.playTileClick();
        hapticManager.impactLight();
        return true;
      }
    }

    // 3. Se estiver na tela de jogo, retorna para o menu com segurança
    if (this.screenGame && !this.screenGame.classList.contains('hidden')) {
      soundManager.playTileClick();
      hapticManager.impactLight();
      this.hud.stopTimer();
      this.showMenu();
      return true;
    }

    // 4. Se já estiver no menu inicial, retorna false permitindo que o Android minimize o app
    return false;
  }
}
