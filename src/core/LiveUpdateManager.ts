import { Capacitor } from '@capacitor/core';
import { LiveUpdate } from '@capawesome/capacitor-live-update';

const GITHUB_REPO = 'humbertofo/mahjong';
const COMMITS_API = `https://api.github.com/repos/${GITHUB_REPO}/commits/main`;
const BUNDLE_ZIP_URL = `https://github.com/${GITHUB_REPO}/releases/download/live-update/dist.zip`;
const CURRENT_BUNDLE_KEY = 'mahjong_live_bundle_sha';
const LAST_CHECK_KEY = 'mahjong_last_update_check';

export interface LiveUpdateCallbacks {
  onDownloading?: (commitMessage: string) => void;
  onReady?: (commitMessage: string) => void;
}

export class LiveUpdateManager {
  private static isChecking = false;

  /**
   * Verifica em segundo plano se há um novo commit/versão no GitHub
   */
  public static async checkForUpdates(callbacks?: LiveUpdateCallbacks | ((message: string) => void)): Promise<void> {
    // Live update só roda no aplicativo nativo Android/iOS, não no browser
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    if (this.isChecking) return;
    this.isChecking = true;

    try {
      // 1. Obter o SHA do bundle ativo
      let currentSha = localStorage.getItem(CURRENT_BUNDLE_KEY) || '';
      try {
        const bundleInfo = await LiveUpdate.getBundle();
        if (bundleInfo && bundleInfo.bundleId) {
          currentSha = bundleInfo.bundleId;
        }
      } catch {
        // Fallback para valor no localStorage
      }

      // 2. Consultar o último commit da branch main no GitHub (sem cache)
      const res = await fetch(`${COMMITS_API}?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!res.ok) {
        return;
      }

      const data = await res.json();
      const latestSha = (data.sha || '').substring(0, 10);
      const commitMessage = data.commit?.message?.split('\n')[0] || 'Novas fases e melhorias visuais';

      if (!latestSha) return;

      // 3. Se for a mesma versão já instalada, encerra
      if (currentSha && currentSha.startsWith(latestSha)) {
        localStorage.setItem(LAST_CHECK_KEY, Date.now().toString());
        return;
      }

      console.log(`[LiveUpdate] Nova versão detectada (${latestSha}). Baixando dist.zip...`);

      // Notificar que o download começou (exibe tela de carregando)
      if (typeof callbacks === 'object' && callbacks?.onDownloading) {
        callbacks.onDownloading(commitMessage);
      }

      // 4. Baixar o bundle dist.zip da release 'live-update'
      await LiveUpdate.downloadBundle({
        bundleId: latestSha,
        url: `${BUNDLE_ZIP_URL}?_v=${latestSha}`,
      });

      // 5. Definir como o bundle ativo
      await LiveUpdate.setBundle({
        bundleId: latestSha,
      });

      localStorage.setItem(CURRENT_BUNDLE_KEY, latestSha);
      localStorage.setItem(LAST_CHECK_KEY, Date.now().toString());

      console.log(`[LiveUpdate] Sucesso! Bundle ${latestSha} preparado.`);

      // Notificar que o download terminou e pode reiniciar
      if (typeof callbacks === 'object' && callbacks?.onReady) {
        callbacks.onReady(commitMessage);
      } else if (typeof callbacks === 'function') {
        callbacks(commitMessage);
      }
    } catch (err) {
      console.warn('[LiveUpdate] Verificação em background ignorada (offline ou conexão lenta):', err);
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Recarrega o app imediatamente
   */
  public static async applyUpdateNow(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await LiveUpdate.reload();
    } catch (err) {
      console.error('[LiveUpdate] Erro ao recarregar:', err);
    }
  }
}
