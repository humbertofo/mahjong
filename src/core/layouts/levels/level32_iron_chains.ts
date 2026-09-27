import { BoardLayout } from '../../types';

/**
 * 🀄 Fase 32: Correntes de Bronze
 * Dificuldade: Difícil
 * Total de Peças: 80 (2 Ondas Artesanais)
 *
 * Layout: Quatro correntes horizontais interligadas por elos centrais.
 * Cada corrente tem 2 elos ovais e 1 elo central elevado que só se
 * liberta após remover os elos laterais.
 *
 * Onda 1 — Correntes Superiores (40 peças)
 * Onda 2 — Correntes Inferiores + Elos Centrais (40 peças)
 *
 * Grade mobile: x ∈ {0,2,4,6,8,10}  |  y ∈ {0..14}  |  z ∈ {0..3}
 */
export const level32Layout: BoardLayout = {
  id: 'iron-chains',
  name: 'Correntes de Bronze',
  description: 'Elos ancestrais forjados nos vulcões do mundo interior.',
  difficulty: 'Difícil',
  slots: [
    // ── CORRENTE A (y=0-4): anel oval + elo central elevado ──
    { x: 0, y: 0,  z: 0 }, { x: 2, y: 0,  z: 0 }, { x: 4, y: 0,  z: 0 }, { x: 6, y: 0,  z: 0 }, { x: 8, y: 0,  z: 0 }, { x: 10, y: 0,  z: 0 },
    { x: 0, y: 2,  z: 0 }, { x: 10, y: 2, z: 0 },
    { x: 0, y: 4,  z: 0 }, { x: 2, y: 4,  z: 0 }, { x: 4, y: 4,  z: 0 }, { x: 6, y: 4,  z: 0 }, { x: 8, y: 4,  z: 0 }, { x: 10, y: 4,  z: 0 },
    // Elo central A (Z=1)
    { x: 4, y: 2,  z: 1 }, { x: 6, y: 2,  z: 1 },
    // Elo-topo A (Z=2)
    { x: 4, y: 2,  z: 2 }, { x: 6, y: 2,  z: 2 },

    // ── CORRENTE B (y=4-8): anel oval + elo central elevado ──
    { x: 0, y: 6,  z: 0 }, { x: 2, y: 6,  z: 0 }, { x: 4, y: 6,  z: 0 }, { x: 6, y: 6,  z: 0 }, { x: 8, y: 6,  z: 0 }, { x: 10, y: 6,  z: 0 },
    { x: 0, y: 8,  z: 0 }, { x: 10, y: 8, z: 0 },
    // Base B fundo
    { x: 0, y: 4,  z: 1 }, { x: 2, y: 4,  z: 1 }, { x: 8, y: 4,  z: 1 }, { x: 10, y: 4, z: 1 },
    // Elo central B (Z=1)
    { x: 4, y: 6,  z: 1 }, { x: 6, y: 6,  z: 1 },
    // Elo-topo B (Z=2)
    { x: 4, y: 6,  z: 2 }, { x: 6, y: 6,  z: 2 },

    // ── CORRENTE C (y=8-12): anel oval ──
    { x: 0, y: 10, z: 0 }, { x: 2, y: 10, z: 0 }, { x: 4, y: 10, z: 0 }, { x: 6, y: 10, z: 0 }, { x: 8, y: 10, z: 0 }, { x: 10, y: 10, z: 0 },
    { x: 0, y: 12, z: 0 }, { x: 10, y: 12, z: 0 },
    { x: 0, y: 8,  z: 1 }, { x: 10, y: 8, z: 1 },
    // Elo central C
    { x: 4, y: 10, z: 1 }, { x: 6, y: 10, z: 1 },
    { x: 4, y: 10, z: 2 }, { x: 6, y: 10, z: 2 },

    // ── CORRENTE D (y=12-14): arco de fechamento ──
    { x: 0, y: 14, z: 0 }, { x: 2, y: 14, z: 0 }, { x: 4, y: 14, z: 0 }, { x: 6, y: 14, z: 0 }, { x: 8, y: 14, z: 0 }, { x: 10, y: 14, z: 0 },
    { x: 0, y: 12, z: 1 }, { x: 10, y: 12, z: 1 },
    { x: 4, y: 12, z: 1 }, { x: 6, y: 12, z: 1 },
    // Elo-topo D (Z=3 — elo máximo)
    { x: 4, y: 12, z: 2 }, { x: 6, y: 12, z: 2 },
    { x: 4, y: 12, z: 3 }, { x: 6, y: 12, z: 3 },
  ],
  waves: [
    {
      waveNumber: 1,
      // Correntes A e B — parte superior (40 peças)
      slots: [
        { x: 0,  y: 0,  z: 0 }, { x: 2,  y: 0,  z: 0 }, { x: 4,  y: 0,  z: 0 }, { x: 6,  y: 0,  z: 0 }, { x: 8,  y: 0,  z: 0 }, { x: 10, y: 0,  z: 0 },
        { x: 0,  y: 2,  z: 0 }, { x: 10, y: 2,  z: 0 },
        { x: 0,  y: 4,  z: 0 }, { x: 2,  y: 4,  z: 0 }, { x: 4,  y: 4,  z: 0 }, { x: 6,  y: 4,  z: 0 }, { x: 8,  y: 4,  z: 0 }, { x: 10, y: 4,  z: 0 },
        { x: 4,  y: 2,  z: 1 }, { x: 6,  y: 2,  z: 1 },
        { x: 4,  y: 2,  z: 2 }, { x: 6,  y: 2,  z: 2 },
        { x: 0,  y: 6,  z: 0 }, { x: 2,  y: 6,  z: 0 }, { x: 4,  y: 6,  z: 0 }, { x: 6,  y: 6,  z: 0 }, { x: 8,  y: 6,  z: 0 }, { x: 10, y: 6,  z: 0 },
        { x: 0,  y: 8,  z: 0 }, { x: 10, y: 8,  z: 0 },
        { x: 0,  y: 4,  z: 1 }, { x: 2,  y: 4,  z: 1 }, { x: 8,  y: 4,  z: 1 }, { x: 10, y: 4,  z: 1 },
        { x: 4,  y: 6,  z: 1 }, { x: 6,  y: 6,  z: 1 },
        { x: 4,  y: 6,  z: 2 }, { x: 6,  y: 6,  z: 2 },
        { x: 2,  y: 2,  z: 0 }, { x: 8,  y: 2,  z: 0 },
        { x: 2,  y: 6,  z: 1 }, { x: 8,  y: 6,  z: 1 },
        { x: 2,  y: 8,  z: 0 }, { x: 8,  y: 8,  z: 0 },
      ],
    },
    {
      waveNumber: 2,
      // Correntes C e D — parte inferior (40 peças)
      slots: [
        { x: 0,  y: 10, z: 0 }, { x: 2,  y: 10, z: 0 }, { x: 4,  y: 10, z: 0 }, { x: 6,  y: 10, z: 0 }, { x: 8,  y: 10, z: 0 }, { x: 10, y: 10, z: 0 },
        { x: 0,  y: 12, z: 0 }, { x: 10, y: 12, z: 0 },
        { x: 0,  y: 8,  z: 1 }, { x: 10, y: 8,  z: 1 },
        { x: 4,  y: 10, z: 1 }, { x: 6,  y: 10, z: 1 },
        { x: 4,  y: 10, z: 2 }, { x: 6,  y: 10, z: 2 },
        { x: 0,  y: 14, z: 0 }, { x: 2,  y: 14, z: 0 }, { x: 4,  y: 14, z: 0 }, { x: 6,  y: 14, z: 0 }, { x: 8,  y: 14, z: 0 }, { x: 10, y: 14, z: 0 },
        { x: 0,  y: 12, z: 1 }, { x: 10, y: 12, z: 1 },
        { x: 4,  y: 12, z: 1 }, { x: 6,  y: 12, z: 1 },
        { x: 4,  y: 12, z: 2 }, { x: 6,  y: 12, z: 2 },
        { x: 4,  y: 12, z: 3 }, { x: 6,  y: 12, z: 3 },
        { x: 2,  y: 10, z: 1 }, { x: 8,  y: 10, z: 1 },
        { x: 2,  y: 12, z: 1 }, { x: 8,  y: 12, z: 1 },
        { x: 2,  y: 14, z: 1 }, { x: 8,  y: 14, z: 1 },
        { x: 4,  y: 8,  z: 0 }, { x: 6,  y: 8,  z: 0 },
        { x: 4,  y: 8,  z: 1 }, { x: 6,  y: 8,  z: 1 },
        { x: 2,  y: 8,  z: 1 }, { x: 8,  y: 8,  z: 1 },
      ],
    },
  ],
};
