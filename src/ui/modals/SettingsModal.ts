import { UserPreferences } from '../../storage/StorageManager';
import { soundManager } from '../../audio/SoundManager';
import { hapticManager } from '../../audio/HapticManager';

export class SettingsModal {
  public static renderSettingsOptions(
    prefs: UserPreferences,
    onSaveAndApply: (updated: UserPreferences) => void,
    onRequestReset?: () => void
  ): void {
    const container = document.getElementById('settings-options-container');
    if (!container) return;

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

    container.querySelector('#btn-settings-reset-data')?.addEventListener('click', () => {
      soundManager.playTileClick();
      hapticManager.impactLight();
      onRequestReset?.();
    });
  }
}
