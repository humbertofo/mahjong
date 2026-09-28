import { PlacedTile, AnimalValue } from '../types';
import { canMatch } from '../deck';
import { TileRegistry } from './tiles/TileRegistry';
import { SynergyRegistry } from './synergies/SynergyRegistry';

export type TacticalOpportunityType =
  | 'pair_free'
  | 'synergy_free'
  | 'tray_warning'
  | 'pair_blocked'
  | 'board_zen';

export interface TacticalOracleResult {
  icon: string;
  title: string;
  description: string;
  type: TacticalOpportunityType;
  actionableTileId?: string;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ORÁCULO TÁTICO DA BANDEJA ZEN (TRAY TACTICAL ORACLE)
 *  Analisa os slots ocupados da bandeja em tempo real e identifica
 *  a melhor jogada tática no tabuleiro (Par Livre, Sinergia ou Alerta).
 * ═══════════════════════════════════════════════════════════════════════════
 */
export class TrayTacticalOracle {
  public static evaluate(
    tray: PlacedTile[],
    freeBoardTiles: PlacedTile[],
    activeBoardTiles: PlacedTile[],
    biomeName: string = 'Bosque Sereno',
    biomeEmoji: string = '🌿'
  ): TacticalOracleResult {
    // ─── 1. CRÍTICO: BANDEJA 100% CHEIA (4/4 SLOTS) ─────────────────────────
    if (tray.length >= 4) {
      return {
        icon: '⚠️',
        title: 'Bandeja Cheia (4/4)',
        description: 'Use Marreta 🔨 ou Desfazer ↩️!',
        type: 'tray_warning',
      };
    }

    // ─── 2. SE HOUVER PEÇAS NA BANDEJA: ANALISA SLOTS EM TEMPO REAL ──────────
    if (tray.length > 0) {
      // 2.1. OPORTUNIDADE MÁXIMA: Par 100% Livre no Tabuleiro (Esvazia o slot)
      for (let i = tray.length - 1; i >= 0; i--) {
        const trayTile = tray[i];
        const freeMatch = freeBoardTiles.find(
          (b) =>
            b.id !== trayTile.id &&
            (b.value === trayTile.value || b.value === 'chameleon' || trayTile.value === 'chameleon')
        );

        if (freeMatch) {
          const def = TileRegistry.get(trayTile.value as AnimalValue);
          const icon = def?.label.split(' ')[0] || '🎯';
          const name = def?.label.split(' ').slice(1).join(' ') || trayTile.label;

          return {
            icon,
            title: `Par Livre: ${name}`,
            description: `Combine o ${name} na mesa!`,
            type: 'pair_free',
            actionableTileId: freeMatch.id,
          };
        }
      }

      // 2.2. OPORTUNIDADE DE SINERGIA: Parceiro Especial 100% Livre na Mesa
      for (let i = tray.length - 1; i >= 0; i--) {
        const trayTile = tray[i];
        for (const freeTile of freeBoardTiles) {
          if (freeTile.id === trayTile.id || freeTile.value === trayTile.value) continue;

          // Filtro ultra-rápido O(1): só aciona o avaliador completo se os dois valores forem sinérgicos
          if (
            !SynergyRegistry.areSynergistic(trayTile.value, freeTile.value) &&
            trayTile.value !== 'chameleon' &&
            freeTile.value !== 'chameleon'
          ) {
            continue;
          }

          // Testa se forma sinergia declarada
          const synergy = SynergyRegistry.evaluate(
            trayTile,
            freeTile,
            () => activeBoardTiles,
            () => {},
            tray
          );

          if (synergy) {
            const partnerDef = TileRegistry.get(freeTile.value as AnimalValue);
            const partnerName = partnerDef?.label || freeTile.label;
            const cleanTitle = synergy.title
              .replace(/^[^\w\s\u00C0-\u00FF]+/, '')
              .replace(/\s*\([^)]*\)/, '')
              .trim();

            return {
              icon: '✨',
              title: `Sinergia: ${cleanTitle}`,
              description: `${partnerName} livre! Toque p/ ativar!`,
              type: 'synergy_free',
              actionableTileId: freeTile.id,
            };
          }
        }
      }

      // 2.3. ALERTA DE RISCO ELEVADO: 3 de 4 slots ocupados sem par imediato
      if (tray.length === 3) {
        return {
          icon: '⚡',
          title: 'Atenção: 3/4 Slots',
          description: 'Libere bordas ou use Marreta 🔨!',
          type: 'tray_warning',
        };
      }

      // 2.4. PEÇA NA BANDEJA BLOQUEADA NO TABULEIRO
      const lastTile = tray[tray.length - 1];
      const hasCopiesOnBoard = activeBoardTiles.some(
        (b) => b.id !== lastTile.id && canMatch(b, lastTile)
      );

      const def = TileRegistry.get(lastTile.value as AnimalValue);
      const icon = def?.label.split(' ')[0] || '🔒';
      const name = def?.label.split(' ').slice(1).join(' ') || lastTile.label;

      if (hasCopiesOnBoard) {
        return {
          icon: icon || '🔒',
          title: `${name} Bloqueado`,
          description: 'Libere as laterais para o par!',
          type: 'pair_blocked',
        };
      } else {
        return {
          icon: '🦎',
          title: `${name} Sem Par`,
          description: 'Use Camaleão 🦎 ou Desfazer ↩️!',
          type: 'pair_blocked',
        };
      }
    }

    // ─── 3. BANDEJA VAZIA (0/4): PANORAMA TÁTICO DO BIOMA ────────────────────
    // Contagem ultra-otimizada O(N) com Map em vez de O(N²) para zero lag de frame
    const valCounts = new Map<string, number>();
    let chameleons = 0;
    for (let i = 0; i < freeBoardTiles.length; i++) {
      const v = freeBoardTiles[i].value;
      if (v === 'chameleon') {
        chameleons++;
      } else {
        valCounts.set(v, (valCounts.get(v) || 0) + 1);
      }
    }

    let freePairsCount = 0;
    for (const count of valCounts.values()) {
      freePairsCount += Math.floor(count / 2);
    }
    if (chameleons > 0) {
      freePairsCount += chameleons;
    }

    if (freePairsCount > 0) {
      return {
        icon: biomeEmoji,
        title: biomeName,
        description: `${freePairsCount} par${freePairsCount === 1 ? '' : 'es'} livre${freePairsCount === 1 ? '' : 's'} no tabuleiro`,
        type: 'board_zen',
      };
    } else {
      return {
        icon: '🔀',
        title: 'Sem Pares Livres',
        description: 'Toque em Misturar 🔀 para abrir!',
        type: 'board_zen',
      };
    }
  }
}
