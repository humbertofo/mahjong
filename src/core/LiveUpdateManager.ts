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
  private static isGameActive = false;
  private static pendingUpdate: {
    latestSha: string;
    commitMessage: string;
    callbacks?: LiveUpdateCallbacks | ((message: string) => void);
  } | null = null;

  /**
   * Informa se há uma partida com toques ativos em andamento para postergar
   * operações pesadas de I/O (download/descompactação do dist.zip de 5MB)
   */
  public static setGameActive(active: boolean): void {
    this.isGameActive = active;
    if (!active && this.pendingUpdate && !this.isChecking) {
      console.log('[LiveUpdate] Partida finalizada ou pausada. Executando download postergado...');
      const update = this.pendingUpdate;
      this.pendingUpdate = null;
      this.executeBundleDownload(update).catch((err) => {
        console.warn('[LiveUpdate] Erro ao executar download postergado:', err);
      });
    }
  }

  /**
   * Obtém o identificador do bundle atualmente em execução.
   * Retorna o SHA do commit ou null se estiver executando a versão base do APK.
   */
  public static async getActiveBundleId(): Promise<string | null> {
    if (!Capacitor.isNativePlatform()) return null;
    try {
      const bundleInfo = await (LiveUpdate.getCurrentBundle ? LiveUpdate.getCurrentBundle() : LiveUpdate.getBundle());
      return bundleInfo?.bundleId || null;
    } catch {
      return null;
    }
  }

  /**
   * Confirma que o bundle atual carregou com sucesso, impede o rollback automático
   * e limpa bloqueios de versões anteriores.
   */
  public static async notifyAppReady(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      // 1. Limpar bundles bloqueados por rollbacks anteriores
      try {
        await LiveUpdate.clearBlockedBundles();
      } catch {
        // Ignora se não suportado
      }

      // 2. Avisar ao plugin nativo que o app inicializou sem travar
      const res = await LiveUpdate.ready();
      console.log('[LiveUpdate] Bundle ativo confirmado como estável via ready():', res);

      // 3. Atualizar o localStorage de acordo com a realidade do bundle ativo
      const activeBundle = await this.getActiveBundleId();
      if (activeBundle) {
        localStorage.setItem(CURRENT_BUNDLE_KEY, activeBundle);
      } else {
        localStorage.removeItem(CURRENT_BUNDLE_KEY);
      }
    } catch (err) {
      console.warn('[LiveUpdate] Erro ao chamar ready():', err);
    }
  }

  /**
   * Verifica em segundo plano se há um novo commit/versão no GitHub
   */
  public static async checkForUpdates(callbacks?: LiveUpdateCallbacks | ((message: string) => void)): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    if (this.isChecking) return;
    this.isChecking = true;

    try {
      // 1. Obter o SHA do bundle REAL que está ativo agora
      const activeBundle = await this.getActiveBundleId();
      const currentSha = activeBundle || '';

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

      // 3. Se o bundle ativo REAL já for essa versão, não precisa atualizar
      if (currentSha && currentSha.startsWith(latestSha)) {
        localStorage.setItem(LAST_CHECK_KEY, Date.now().toString());
        return;
      }

      console.log(`[LiveUpdate] Nova versão detectada (${latestSha}). Ativo: ${currentSha || 'APK base'}.`);

      // Se o usuário estiver no meio da partida, posterga o download pesado para quando a partida terminar
      if (this.isGameActive) {
        console.log('[LiveUpdate] Partida em andamento. Postergar download de dist.zip para tela estática de vitória/menu.');
        this.pendingUpdate = { latestSha, commitMessage, callbacks };
        return;
      }

      await this.executeBundleDownload({ latestSha, commitMessage, callbacks });
    } catch (err) {
      console.warn('[LiveUpdate] Verificação em background ignorada (offline ou conexão lenta):', err);
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Executa o download e registro do bundle ZIP em segundo plano fora do jogo ativo
   */
  private static async executeBundleDownload(update: {
    latestSha: string;
    commitMessage: string;
    callbacks?: LiveUpdateCallbacks | ((message: string) => void);
  }): Promise<void> {
    const { latestSha, commitMessage, callbacks } = update;
    try {
      console.log(`[LiveUpdate] Iniciando download do bundle ${latestSha}...`);

      // Notificar início do download (exibe tela de progresso se callback fornecido)
      if (typeof callbacks === 'object' && callbacks?.onDownloading) {
        callbacks.onDownloading(commitMessage);
      }

      // 4. Limpar cópia anterior do mesmo bundleId caso tenha ficado corrompida
      try {
        await LiveUpdate.deleteBundle({ bundleId: latestSha });
      } catch {
        // Ignora se não existir
      }

      // 5. Baixar o bundle dist.zip da release 'live-update'
      try {
        await LiveUpdate.downloadBundle({
          bundleId: latestSha,
          url: `${BUNDLE_ZIP_URL}?_v=${latestSha}`,
        });
      } catch (dlErr: unknown) {
        const msg = dlErr instanceof Error ? dlErr.message : String(dlErr);
        if (!msg.includes('already exists')) {
          throw dlErr;
        }
      }

      // 6. Definir como o próximo bundle ativo permanente
      try {
        await LiveUpdate.setNextBundle({
          bundleId: latestSha,
        });
      } catch {
        await LiveUpdate.setBundle({
          bundleId: latestSha,
        });
      }

      localStorage.setItem(LAST_CHECK_KEY, Date.now().toString());
      console.log(`[LiveUpdate] Sucesso! Bundle ${latestSha} preparado para reinício.`);

      // 7. Notificar conclusão do download para o usuário confirmar o reinício
      if (typeof callbacks === 'object' && callbacks?.onReady) {
        callbacks.onReady(commitMessage);
      } else if (typeof callbacks === 'function') {
        callbacks(commitMessage);
      }
    } catch (err) {
      console.warn('[LiveUpdate] Falha no download do bundle:', err);
    }
  }

  /**
   * Recarrega o app imediatamente para carregar o novo bundle
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

// Executar confirmação de prontidão imediatamente ao carregar o script JS
LiveUpdateManager.notifyAppReady();
