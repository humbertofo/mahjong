import { UserPreferences } from '../../storage/StorageManager';
import { soundManager } from '../../audio/SoundManager';
import { hapticManager } from '../../audio/HapticManager';
import { diagnosticLogger } from '../../core/DiagnosticLogger';
import { BenchmarkRunner } from '../../core/BenchmarkRunner';
import { BoardRenderer } from '../../render/BoardRenderer';

export class SettingsModal {
  public static renderSettingsOptions(
    prefs: UserPreferences,
    onSaveAndApply: (updated: UserPreferences) => void,
    onRequestReset?: () => void,
    renderer?: BoardRenderer
  ): void {
    const container = document.getElementById('settings-options-container');
    if (!container) return;

    const stats = diagnosticLogger.getPerformanceStats();
    const phaseSummary = diagnosticLogger.getPhaseLoadingSummary();
    const lastBench = diagnosticLogger.getLastBenchmarkResult();

    container.innerHTML = `
      <div class="setting-row">
        <div>
          <div class="setting-title">Números de Auxílio (Acessibilidade)</div>
          <div class="setting-subtitle">Exibe numerais arábicos para identificação imediata</div>
        </div>
        <input type="checkbox" id="check-helper" class="toggle-checkbox" ${prefs.showHelperNumbers ? 'checked' : ''} />
      </div>
      <div class="setting-row">
        <div>
          <div class="setting-title">Destacar Peças Livres</div>
          <div class="setting-subtitle">Escurece as peças bloqueadas para fácil visualização</div>
        </div>
        <input type="checkbox" id="check-dim" class="toggle-checkbox" ${prefs.dimBlockedTiles ? 'checked' : ''} />
      </div>
      <div class="setting-row">
        <div>
          <div class="setting-title">Música Lo-Fi Zen (Chuva & Relaxamento)</div>
          <div class="setting-subtitle">Trilha sonora calma com batidas suaves e chuva</div>
        </div>
        <input type="checkbox" id="check-music" class="toggle-checkbox" ${prefs.musicEnabled ? 'checked' : ''} />
      </div>
      <div class="setting-row">
        <div>
          <div class="setting-title">Efeitos Sonoros</div>
          <div class="setting-subtitle">Sons ao tocar e combinar peças</div>
        </div>
        <input type="checkbox" id="check-sound" class="toggle-checkbox" ${prefs.soundEnabled ? 'checked' : ''} />
      </div>
      <div class="setting-row">
        <div>
          <div class="setting-title">Vibração</div>
          <div class="setting-subtitle">Feedback tátil ao tocar nas peças</div>
        </div>
        <input type="checkbox" id="check-haptic" class="toggle-checkbox" ${prefs.hapticEnabled ? 'checked' : ''} />
      </div>

      <!-- Seção de Diagnóstico e Performance -->
      <div class="settings-diag-section">
        <div class="diag-section-header">
          <div class="diag-section-title">
            <span class="diag-icon">📊</span>
            <span>Diagnóstico & Performance</span>
          </div>
          <div class="diag-section-desc">
            Métricas de FPS, Long Tasks, tempo de carga das fases e simulação automatizada de estresse.
          </div>
        </div>

        <div class="diag-stats-grid">
          <div class="diag-stat-card">
            <div class="diag-stat-label">Quadros</div>
            <div class="diag-stat-value">${stats.totalFrames}</div>
          </div>
          <div class="diag-stat-card">
            <div class="diag-stat-label">Tempo Médio</div>
            <div class="diag-stat-value">${stats.avgFrameMs > 0 ? stats.avgFrameMs + 'ms' : '--'}</div>
          </div>
          <div class="diag-stat-card">
            <div class="diag-stat-label">Carga de Fase</div>
            <div class="diag-stat-value">${phaseSummary.avgTotalLoadMs ? phaseSummary.avgTotalLoadMs + 'ms' : '--'}</div>
          </div>
          <div class="diag-stat-card">
            <div class="diag-stat-label">Lentos (&gt;16ms)</div>
            <div class="diag-stat-value ${stats.slowFrames > 0 ? 'diag-warning' : ''}">${stats.slowFrames} <span class="diag-pct">(${stats.slowFramesPct}%)</span></div>
          </div>
          <div class="diag-stat-card">
            <div class="diag-stat-label">Long Tasks</div>
            <div class="diag-stat-value ${stats.longTasksCount > 0 ? 'diag-danger' : ''}">${stats.longTasksCount}</div>
          </div>
        </div>

        ${lastBench ? `
          <div class="diag-benchmark-card">
            <div class="diag-benchmark-header">
              <div class="diag-benchmark-title">
                <span>⚡ Último Benchmark</span>
              </div>
              <span class="diag-benchmark-badge grade-${lastBench.grade.toLowerCase()}">Classe ${lastBench.grade}</span>
            </div>
            <div class="diag-benchmark-desc">
              ${lastBench.summary}
            </div>
          </div>
        ` : ''}

        <div id="diag-benchmark-progress" class="diag-progress-container hidden">
          <div id="diag-benchmark-text" class="diag-progress-text">Iniciando simulação...</div>
          <div class="diag-progress-bar-bg">
            <div id="diag-benchmark-fill" class="diag-progress-bar-fill"></div>
          </div>
        </div>

        ${renderer ? `
          <button id="btn-run-benchmark" class="btn-diag-benchmark" type="button">
            <span>⚡ Executar Simulação & Benchmark</span>
          </button>
        ` : ''}

        <div class="diag-actions-row">
          <button id="btn-share-diag-logs" class="btn-diag-primary" type="button">
            <span class="diag-btn-icon">📤</span>
            <span>Compartilhar Logs</span>
          </button>
          <button id="btn-copy-diag-logs" class="btn-diag-secondary" type="button" title="Copiar relatório como texto JSON">
            <span class="diag-btn-icon">📋</span>
            <span>Copiar</span>
          </button>
          <button id="btn-download-diag-logs" class="btn-diag-secondary" type="button" title="Baixar arquivo JSON">
            <span class="diag-btn-icon">💾</span>
            <span>Baixar</span>
          </button>
        </div>

        <div id="diag-feedback-msg" class="diag-feedback-msg hidden"></div>
      </div>

      <!-- Seção de Gerenciamento de Dados / Reset -->
      <div class="settings-danger-section">
        <div class="danger-section-header">
          <div class="danger-section-title">
            <span class="danger-icon">⚠️</span>
            <span>Gerenciamento de Dados</span>
          </div>
          <div class="danger-section-desc">
            Redefinir todas as 50 fases, estrelas e recordes para recomeçar a jornada do zero.
          </div>
        </div>
        <button id="btn-settings-reset-data" class="btn-danger-reset" type="button">
          <span class="reset-btn-icon">🗑️</span>
          <span>Limpar Todo o Progresso</span>
        </button>
      </div>
    `;

    container.querySelector('#check-helper')?.addEventListener('change', (e) => {
      prefs.showHelperNumbers = (e.target as HTMLInputElement).checked;
      onSaveAndApply(prefs);
    });
    container.querySelector('#check-dim')?.addEventListener('change', (e) => {
      prefs.dimBlockedTiles = (e.target as HTMLInputElement).checked;
      onSaveAndApply(prefs);
    });
    container.querySelector('#check-music')?.addEventListener('change', (e) => {
      prefs.musicEnabled = (e.target as HTMLInputElement).checked;
      onSaveAndApply(prefs);
    });
    container.querySelector('#check-sound')?.addEventListener('change', (e) => {
      prefs.soundEnabled = (e.target as HTMLInputElement).checked;
      onSaveAndApply(prefs);
    });
    container.querySelector('#check-haptic')?.addEventListener('change', (e) => {
      prefs.hapticEnabled = (e.target as HTMLInputElement).checked;
      onSaveAndApply(prefs);
    });

    // Ações de Diagnóstico e Exportação de Logs
    const feedbackEl = container.querySelector('#diag-feedback-msg') as HTMLElement | null;

    const showFeedback = (msg: string, isError: boolean = false) => {
      if (!feedbackEl) return;
      feedbackEl.textContent = msg;
      feedbackEl.className = `diag-feedback-msg ${isError ? 'diag-feedback-error' : 'diag-feedback-success'}`;
      feedbackEl.classList.remove('hidden');
      setTimeout(() => {
        feedbackEl.classList.add('hidden');
      }, 4500);
    };

    container.querySelector('#btn-share-diag-logs')?.addEventListener('click', async () => {
      soundManager.playTileClick();
      hapticManager.impactLight();
      showFeedback('⏳ Preparando e abrindo folha de compartilhamento...');
      const res = await diagnosticLogger.shareLogs();
      if (res.success) {
        showFeedback(`✅ ${res.message}`);
      } else if (res.method !== 'cancelled') {
        showFeedback(`⚠️ ${res.message}`, true);
      }
    });

    container.querySelector('#btn-copy-diag-logs')?.addEventListener('click', async () => {
      soundManager.playTileClick();
      hapticManager.impactLight();
      const ok = await diagnosticLogger.copyLogsToClipboard();
      if (ok) {
        showFeedback('📋 Relatório copiado para a Área de Transferência!');
      } else {
        showFeedback('❌ Falha ao copiar. Experimente o botão "Baixar".', true);
      }
    });

    container.querySelector('#btn-download-diag-logs')?.addEventListener('click', () => {
      soundManager.playTileClick();
      hapticManager.impactLight();
      diagnosticLogger.downloadLogsFile();
      showFeedback('💾 Arquivo .json enviado para os Downloads do aparelho!');
    });

    // Execução do Benchmark Automatizado
    const btnBenchmark = container.querySelector('#btn-run-benchmark') as HTMLButtonElement | null;
    const progressContainer = container.querySelector('#diag-benchmark-progress') as HTMLElement | null;
    const progressFill = container.querySelector('#diag-benchmark-fill') as HTMLElement | null;
    const progressText = container.querySelector('#diag-benchmark-text') as HTMLElement | null;

    btnBenchmark?.addEventListener('click', async () => {
      if (!renderer || BenchmarkRunner.getIsRunning()) return;

      soundManager.playTileClick();
      hapticManager.impactMedium();

      btnBenchmark.disabled = true;
      if (progressContainer) progressContainer.classList.remove('hidden');

      try {
        const result = await BenchmarkRunner.runBenchmark(renderer, (pct, text) => {
          if (progressFill) progressFill.style.width = `${pct}%`;
          if (progressText) progressText.textContent = text;
        });

        soundManager.playSynergyBonus();
        hapticManager.impactVictory();
        showFeedback(`🎉 Benchmark concluído! Nota: Classe ${result.grade}`);

        // Re-renderiza o modal para atualizar a grade e exibir o card de resultado
        setTimeout(() => {
          SettingsModal.renderSettingsOptions(prefs, onSaveAndApply, onRequestReset, renderer);
        }, 1200);
      } catch (err: any) {
        showFeedback(`❌ Erro no benchmark: ${err?.message || 'Falha na simulação'}`, true);
        if (progressContainer) progressContainer.classList.add('hidden');
        btnBenchmark.disabled = false;
      }
    });

    container.querySelector('#btn-settings-reset-data')?.addEventListener('click', () => {
      soundManager.playTileClick();
      hapticManager.impactLight();
      onRequestReset?.();
    });
  }
}
