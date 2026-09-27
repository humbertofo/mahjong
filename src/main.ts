import { BoardEngine } from './core/BoardEngine';
import { BoardRenderer } from './render/BoardRenderer';
import { UIManager } from './ui/UIManager';
import { garden36Layout } from './core/layouts/garden36';
import { LiveUpdateManager } from './core/LiveUpdateManager';

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
    onBlockedTileClick: (_tile, isBlockedFromAbove) => {
      if (isBlockedFromAbove) {
        uiManager?.showBlockedTip('Remova a peça superior para liberar esta!');
      } else {
        uiManager?.showBlockedTip('Remova uma peça lateral para liberar esta!');
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
  }, fxCanvas);

  // 3. UIManager orquestra toda a navegação e estado
  uiManager = new UIManager(engine, renderer);

  // 4. Screen Wake Lock para manter tela acesa durante o jogo (Android)
  if ('wakeLock' in navigator) {
    (navigator as unknown as { wakeLock: { request: (t: string) => Promise<unknown> } })
      .wakeLock.request('screen')
      .catch(() => {});
  }

  // 5. Verificação de Live Update com tela de download e solicitação de reinício
  LiveUpdateManager.checkForUpdates({
    onDownloading: (message) => {
      uiManager?.showUpdateDownloading(message);
    },
    onReady: (message) => {
      uiManager?.showUpdateReady(message);
    },
  });
});
