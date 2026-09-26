import { Haptics, ImpactStyle } from '@capacitor/haptics';

export class HapticManager {
  private enabled: boolean = true;

  public setEnabled(val: boolean): void {
    this.enabled = val;
  }

  public getEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Vibração leve ao tocar em uma peça livre
   */
  public async impactLight(): Promise<void> {
    if (!this.enabled) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // Fallback para Web Vibration API se suportada
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(15);
      }
    }
  }

  /**
   * Vibração média ao combinar um par com sucesso
   */
  public async impactMedium(): Promise<void> {
    if (!this.enabled) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([25, 40, 30]);
      }
    }
  }

  /**
   * Vibração forte para a Marreta (impacto potente)
   */
  public async impactHeavy(): Promise<void> {
    if (!this.enabled) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([45, 25, 65]);
      }
    }
  }

  /**
   * Vibração de vitória
   */
  public async impactVictory(): Promise<void> {
    if (!this.enabled) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([40, 50, 40, 50, 60]);
      }
    }
  }
}

export const hapticManager = new HapticManager();
