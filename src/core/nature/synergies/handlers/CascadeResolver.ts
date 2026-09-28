import { PlacedTile, SynergyResult, SynergyType } from '../../../types';

export interface CascadeSynergyConfig {
  type: SynergyType;
  title: string;
  icon: string;
  preyValues: string[];
  boardPairDescription: string;
  trayRescueDescription?: string;
  loneCatchDescription?: string;
  zenGraceDescription?: string;
  baseScore?: number;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  RESOLUTOR EM CASCATA DE 3 CAMADAS (BANDEJA ➔ MESA ➔ DÁDIVA ZEN)
 *  Garante que nenhuma sinergia da natureza falhe ou frustre o jogador.
 * ═══════════════════════════════════════════════════════════════════════════
 */
export class CascadeResolver {
  public static resolve(
    config: CascadeSynergyConfig,
    activeBoardTiles: PlacedTile[],
    tray: PlacedTile[]
  ): SynergyResult {
    const {
      type,
      title,
      preyValues,
      boardPairDescription,
      trayRescueDescription,
      loneCatchDescription,
      zenGraceDescription,
      baseScore = 240,
    } = config;

    // ─── Camada 1: Resgate da Bandeja (Tray Rescue) ─────────────────────────
    // Se a bandeja do jogador tiver uma peça da dieta/alvo, resgata-a imediatamente
    const trayVictim = tray.find(
      (t) => !t.isRemoved && preyValues.includes(t.value)
    );
    if (trayVictim) {
      // Procura a peça correspondente no tabuleiro para resolver o par completo sem gerar peças órfãs
      const boardPartner = activeBoardTiles.find(
        (t) => !t.isRemoved && !t.inTray && t.value === trayVictim.value && t.suit === trayVictim.suit
      );
      return {
        type,
        title: `${title} (Alívio!)`,
        description:
          trayRescueDescription ||
          `O predador resgatou a peça ${trayVictim.label} presa na sua bandeja, harmonizando o caminho livre!`,
        bonusScore: baseScore + 60,
        clearedTrayTiles: [trayVictim],
        affectedBoardTiles: boardPartner ? [boardPartner] : undefined,
      };
    }

    // ─── Camada 2: Captura na Mesa (Board Catch) ────────────────────────────
    // 2A: Procura um par completo da presa na mesa
    for (const preyVal of preyValues) {
      const matchingTiles = activeBoardTiles.filter(
        (t) => !t.isRemoved && !t.inTray && t.value === preyVal
      );
      if (matchingTiles.length >= 2) {
        return {
          type,
          title,
          description: boardPairDescription,
          bonusScore: baseScore,
          affectedBoardTiles: [matchingTiles[0], matchingTiles[1]],
        };
      }
    }

    // 2B: Se houver apenas 1 peça solitária da presa na mesa, captura-a
    for (const preyVal of preyValues) {
      const loneTile = activeBoardTiles.find(
        (t) => !t.isRemoved && !t.inTray && t.value === preyVal
      );
      if (loneTile) {
        return {
          type,
          title: `${title} (Captura!)`,
          description:
            loneCatchDescription ||
            `O animal capturou a peça ${loneTile.label} que bloqueava o fluxo do tabuleiro!`,
          bonusScore: baseScore - 40,
          affectedBoardTiles: [loneTile],
        };
      }
    }

    // ─── Camada 3: Dádiva Zen (Zen Grace Fallback) ──────────────────────────
    // Se não há presas nem na bandeja nem na mesa, o animal abençoa com Harmonia Zen
    return {
      type,
      title: `Dádiva Zen: ${title}`,
      description:
        zenGraceDescription ||
        `O ecossistema em paz concedeu bênção de Harmonia Zen (+300 pts)!`,
      bonusScore: 300,
    };
  }
}
