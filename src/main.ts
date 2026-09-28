import { BoardEngine } from './core/BoardEngine';
import { BoardRenderer } from './render/BoardRenderer';
import { UIManager } from './ui/UIManager';
import { garden36Layout } from './core/layouts/garden36';
import { LiveUpdateManager } from './core/LiveUpdateManager';
import { App } from '@capacitor/app';

window.addEventListener('DOMContentLoaded', () => {
  // Confirmar que o app carregou com sucesso e desativar o rollback automático
  LiveUpdateManager.notifyAppReady();

  const canvas = document.getElementById('board-canvas') as HTMLCanvasElement;
  const fxCanvas = document.getElementById('fx-canvas') as HTMLCanvasElement | null;
  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }

  // 1. Motor inicial (será substituído ao iniciar cada nível)
  const engine = new BoardEngine(garden36Layout);

  // 2. Referência circular controlada: uiManager criado depois do renderer
  let uiManager: UIManager;

  const renderer = new BoardRenderer(canvas, engine, {
    onBlockedTileClick: (tile, isBlockedFromAbove) => {
      if (isBlockedFromAbove) {
        uiManager?.showBlockedTip(`Peça coberta! Remova a peça superior para liberar ${tile.label}.`);
      } else {
        uiManager?.showBlockedTip(`Presa nas laterais! Libere o lado esquerdo ou direito para mover ${tile.label}.`);
      }
    },
    onMatchSuccess: (pair) => {
      uiManager?.recordMatchedPair(pair);
      uiManager?.updateHUD();
    },
    onBoardCleared: () => {
      uiManager?.handleVictory();
    },
    onWaveCleared: (currentWave, totalWaves) => {
      uiManager?.handleWaveCleared(currentWave, totalWaves);
    },
    onSynergyTriggered: (synergy) => {
      uiManager?.handleSynergy(synergy);
    },
    onClimateTriggered: (climate) => {
      uiManager?.handleClimate(climate);
    },
    onTileLongPress: (tile) => {
      uiManager?.handleTileLongPress(tile);
    },
    onCosmicRescue: (rescuedTiles) => {
      uiManager?.handleCosmicRescue(rescuedTiles);
    },
    onTrioMatched: (trioTile) => {
      uiManager?.handleTrioMatched(trioTile);
    },
    onStateChanged: () => {
      uiManager?.updateHUD();
    },
    onTileFlightToTray: (tile, startX, startY, width, height, onArrival) => {
      if (uiManager) {
        uiManager.animateTileToTray(tile, startX, startY, width, height, onArrival);
      } else {
        onArrival();
      }
    },
    onDeadlocked: () => {
      uiManager?.handleDeadlock();
    },
    onVinesEntangled: (tile) => {
      uiManager?.handleVinesEntangled(tile);
    },
    onPredation: (predation) => {
      uiManager?.handlePredation(predation);
    },
    onTimeOfDayChanged: (newTime) => {
      uiManager?.handleTimeOfDayChanged(newTime);
    },
    onCocoonCracked: (tile) => {
      uiManager?.handleCocoonCracked(tile);
    },
    onCocoonHatched: (tile) => {
      uiManager?.handleCocoonHatched(tile);
    },
    onElementalSealed: (tile) => {
      uiManager?.handleElementalSealed(tile);
    },
    onElementalUnsealed: (unsealedTiles) => {
      uiManager?.handleElementalUnsealed(unsealedTiles);
    },
  }, fxCanvas);

  // 3. UIManager orquestra toda a navegação e estado
  uiManager = new UIManager(engine, renderer);

  // 4. Screen Wake Lock dinâmico e Gerenciamento de Ciclo de Vida Mobile (Android)
  let wakeLockSentinel: WakeLockSentinel | null = null;
  const requestWakeLock = async () => {
    if ('wakeLock' in navigator && navigator.wakeLock) {
      try {
        wakeLockSentinel = await navigator.wakeLock.request('screen');
        wakeLockSentinel.addEventListener('release', () => {
          wakeLockSentinel = null;
        });
      } catch {
        wakeLockSentinel = null;
      }
    }
  };

  requestWakeLock();

  document.addEventListener('visibilitychange', () => {
    const isVisible = document.visibilityState === 'visible';
    uiManager?.handleAppVisibility(isVisible);
    if (isVisible) {
      requestWakeLock();
    }
  });

  window.addEventListener('pagehide', () => {
    uiManager?.handleAppVisibility(false);
  });

  window.addEventListener('pageshow', () => {
    uiManager?.handleAppVisibility(true);
    requestWakeLock();
  });

  // 5. Verificação de Live Update com tela de download e solicitação de reinício (deferida para fluidez imediata)
  setTimeout(() => {
    LiveUpdateManager.checkForUpdates({
      onDownloading: (message) => {
        uiManager?.showUpdateDownloading(message);
      },
      onReady: (message) => {
        uiManager?.showUpdateReady(message);
      },
    });
  }, 100);

  // 6. Tratamento do Hardware Back Button do Android (Evita encerramento acidental da fase)
  const onBackButton = (e?: Event) => {
    e?.preventDefault();
    const handled = uiManager?.handleHardwareBack() ?? false;
    if (!handled) {
      App.exitApp().catch(() => {});
    }
  };

  try {
    App.addListener('backButton', () => {
      onBackButton();
    }).catch(() => {
      document.addEventListener('backbutton', onBackButton);
    });
  } catch {
    document.addEventListener('backbutton', onBackButton);
  }
});
