import { PlacedTile, SynergyResult, ClimateEffectResult } from '../core/types';
import { soundManager } from '../audio/SoundManager';
import { hapticManager } from '../audio/HapticManager';
import { HUDController } from './HUDController';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  CONTROLADOR DE FEEDBACK VISUAL & CRÔNICAS DA NATUREZA (UI)
 *  Responsável por eventos narrativos, toasts da fauna, clica e longo toque
 * ═══════════════════════════════════════════════════════════════════════════
 */
export class NatureFeedbackController {
  private natureEventTimer: ReturnType<typeof setTimeout> | null = null;
  private natureToastTimer: ReturnType<typeof setTimeout> | null = null;

  private triggerHudPulse: () => void;
  private updateHUD: () => void;

  constructor(callbacks: { triggerHudPulse: () => void; updateHUD: () => void }) {
    this.triggerHudPulse = callbacks.triggerHudPulse;
    this.updateHUD = callbacks.updateHUD;
  }

  public handleSynergy(synergy: SynergyResult): void {
    soundManager.playSynergySound(synergy.type);
    hapticManager.impactLight();
    this.triggerHudPulse();

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
    else if (synergy.type === 'penguin_slide') icon = '🐧';
    else if (synergy.type === 'panda_zen') icon = '🐼';
    else if (synergy.type === 'turtle_shield') icon = '🐢';
    else if (synergy.type === 'rabbit_hop') icon = '🐰';
    else if (synergy.type === 'fox_trail') icon = '🦊';
    else if (synergy.type === 'dog_cat_harmony') icon = '🐶';
    else if (synergy.type === 'butterfly_flap') icon = '🦋';
    else if (synergy.type === 'elephant_crush') icon = '🐘';
    else if (synergy.type === 'duck_splash') icon = '🦆';
    else if (synergy.type === 'lion_roar') icon = '🦁';
    else if (synergy.type === 'bird_swoop') icon = '🐦';
    else if (synergy.type === 'snail_zen') icon = '🐌';
    else if (synergy.type === 'floral_harmony') icon = '🌸';
    else if (synergy.type === 'marine_abyss') icon = '🌊';
    else if (synergy.type === 'mythic_harmony') icon = '🐉';
    else if (synergy.type === 'nature_harmony') icon = '🌿';

    this.showNatureEvent(icon, synergy.title, synergy.description);
    this.updateHUD();
  }

  public handleClimate(climate: ClimateEffectResult, hud: HUDController, hasHistory: boolean): void {
    soundManager.playSynergyBonus();
    hapticManager.impactMedium();
    this.triggerHudPulse();

    if (climate.rechargedTool === 'hammer') {
      hud.hammerCount = Math.min(HUDController.MAX_HAMMER, hud.hammerCount + 1);
    } else if (climate.rechargedTool === 'hint') {
      hud.hintCount = Math.min(HUDController.MAX_HINT, hud.hintCount + 1);
    } else if (climate.rechargedTool === 'shuffle') {
      hud.shuffleCount = Math.min(HUDController.MAX_SHUFFLE, hud.shuffleCount + 1);
    } else if (climate.rechargedTool === 'undo') {
      hud.undoCount = Math.min(HUDController.MAX_UNDO, hud.undoCount + 1);
    }
    hud.updatePowerUpBadges(hasHistory);

    this.showNatureEvent(climate.icon, climate.title, climate.description);
    this.updateHUD();
  }

  public handleCosmicRescue(_rescuedTiles: PlacedTile[], _showToast: (msg: string) => void): void {
    // Resgate Cósmico removido a pedido do usuário: sem toasts invasivos na tela de conclusão
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
      void box.offsetWidth;
      box.classList.add('event-pulse');
    }

    if (this.natureEventTimer) {
      clearTimeout(this.natureEventTimer);
    }
    this.natureEventTimer = setTimeout(() => {
      if (boxIcon) boxIcon.textContent = '🌿';
      if (boxTitle) boxTitle.textContent = 'Bosque Sereno';
      if (boxDesc) boxDesc.textContent = 'Toque nas peças livres';
      this.natureEventTimer = null;
    }, 4500);
  }

  public showNatureToast(icon: string, title: string, desc: string): void {
    this.showNatureEvent(icon, title, desc);

    const toast = document.getElementById('nature-toast');
    const toastIcon = document.getElementById('nature-toast-icon');
    const toastTitle = document.getElementById('nature-toast-title');
    const toastDesc = document.getElementById('nature-toast-desc');
    const timerBar = toast?.querySelector('.nature-toast-timer-bar') as HTMLElement | null;

    if (toast && toastIcon && toastTitle && toastDesc) {
      toastIcon.textContent = icon;
      toastTitle.textContent = title;
      toastDesc.textContent = desc;

      if (timerBar) {
        timerBar.style.animation = 'none';
        void timerBar.offsetWidth;
        timerBar.style.animation = 'toast-timer-drain 3.5s linear forwards';
      }

      toast.classList.remove('hidden');

      if (this.natureToastTimer) {
        clearTimeout(this.natureToastTimer);
      }
      this.natureToastTimer = setTimeout(() => {
        toast.classList.add('hidden');
        this.natureToastTimer = null;
      }, 3500);
    }
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

  public showBlockedTip(message: string): void {
    const banner = document.getElementById('tutorial-tip-banner');
    const tipText = document.getElementById('tutorial-tip-text');
    if (banner && tipText) {
      tipText.textContent = message;
      banner.classList.remove('hidden');
      setTimeout(() => banner.classList.add('hidden'), 2600);
    }
  }

  public showTutorialTip(message: string): void {
    const banner = document.getElementById('tutorial-tip-banner');
    const tipText = document.getElementById('tutorial-tip-text');
    if (banner && tipText) {
      tipText.textContent = message;
      banner.classList.remove('hidden');
      setTimeout(() => banner.classList.add('hidden'), 4000);
    }
  }

  public clearTimers(): void {
    if (this.natureEventTimer) {
      clearTimeout(this.natureEventTimer);
      this.natureEventTimer = null;
    }
    if (this.natureToastTimer) {
      clearTimeout(this.natureToastTimer);
      this.natureToastTimer = null;
    }
  }
}
