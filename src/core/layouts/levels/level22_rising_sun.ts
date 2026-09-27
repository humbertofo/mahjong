import { BoardLayout } from '../../types';

/**
 * 🀄 Fase 22: Ilhas do Sol Poente
 * Dificuldade: Médio
 * Total de Peças: 80 (2 Ondas Artesanais)
 *
 * Layout: Arquipélago de três ilhas em forma de U — duas ilhas
 * laterais maiores (onda 1) e uma ilha central elevada (onda 2).
 * O jogador desbloqueias as bordas das ilhas e converge ao centro.
 *
 * Onda 1 — Ilhas Laterais (40 peças):
 *   Ilha Esquerda: x=0-4, y=2-12  (grade 3×6)
 *   Ilha Direita:  x=6-10, y=2-12 (grade 3×6)
 *   Pontes: conexões em y=0 e y=14
 *
 * Onda 2 — Ilha Central Elevada (40 peças):
 *   Z0: grade central x=2-8, y=4-10
 *   Z1: elevação x=4-6, y=6-8
 *   Z2: pico central
 *
 * Grade mobile: x ∈ {0,2,4,6,8,10}  |  y ∈ {0..14}  |  z ∈ {0..3}
 */
export const level22Layout: BoardLayout = {
  id: 'rising-sun',
  name: 'Ilhas do Sol Poente',
  description: 'Arquipélago místico banhado pela luz dourada do sol poente.',
  difficulty: 'Médio',
  slots: [
    // ── Ilha Esquerda Z=0 (x=0-4, y=2-12) ──
    { x: 0, y: 2,  z: 0 }, { x: 2, y: 2,  z: 0 }, { x: 4, y: 2,  z: 0 },
    { x: 0, y: 4,  z: 0 }, { x: 2, y: 4,  z: 0 }, { x: 4, y: 4,  z: 0 },
    { x: 0, y: 6,  z: 0 }, { x: 2, y: 6,  z: 0 }, { x: 4, y: 6,  z: 0 },
    { x: 0, y: 8,  z: 0 }, { x: 2, y: 8,  z: 0 }, { x: 4, y: 8,  z: 0 },
    { x: 0, y: 10, z: 0 }, { x: 2, y: 10, z: 0 }, { x: 4, y: 10, z: 0 },
    { x: 0, y: 12, z: 0 }, { x: 2, y: 12, z: 0 }, { x: 4, y: 12, z: 0 },
    // ── Ilha Direita Z=0 (x=6-10, y=2-12) ──
    { x: 6,  y: 2,  z: 0 }, { x: 8,  y: 2,  z: 0 }, { x: 10, y: 2,  z: 0 },
    { x: 6,  y: 4,  z: 0 }, { x: 8,  y: 4,  z: 0 }, { x: 10, y: 4,  z: 0 },
    { x: 6,  y: 6,  z: 0 }, { x: 8,  y: 6,  z: 0 }, { x: 10, y: 6,  z: 0 },
    { x: 6,  y: 8,  z: 0 }, { x: 8,  y: 8,  z: 0 }, { x: 10, y: 8,  z: 0 },
    { x: 6,  y: 10, z: 0 }, { x: 8,  y: 10, z: 0 }, { x: 10, y: 10, z: 0 },
    { x: 6,  y: 12, z: 0 }, { x: 8,  y: 12, z: 0 }, { x: 10, y: 12, z: 0 },
    // ── Pontes Norte e Sul ──
    { x: 4, y: 0,  z: 0 }, { x: 6, y: 0,  z: 0 },
    { x: 4, y: 14, z: 0 }, { x: 6, y: 14, z: 0 },
    // ── Ilha Central Z=1 (x=2-8, y=4-10) ──
    { x: 2, y: 4,  z: 1 }, { x: 4, y: 4,  z: 1 }, { x: 6, y: 4,  z: 1 }, { x: 8, y: 4,  z: 1 },
    { x: 2, y: 6,  z: 1 }, { x: 4, y: 6,  z: 1 }, { x: 6, y: 6,  z: 1 }, { x: 8, y: 6,  z: 1 },
    { x: 2, y: 8,  z: 1 }, { x: 4, y: 8,  z: 1 }, { x: 6, y: 8,  z: 1 }, { x: 8, y: 8,  z: 1 },
    { x: 2, y: 10, z: 1 }, { x: 4, y: 10, z: 1 }, { x: 6, y: 10, z: 1 }, { x: 8, y: 10, z: 1 },
    // ── Pico do Sol (Z=2, Z=3) ──
    { x: 4, y: 6,  z: 2 }, { x: 6, y: 6,  z: 2 },
    { x: 4, y: 8,  z: 2 }, { x: 6, y: 8,  z: 2 },
    { x: 4, y: 6,  z: 3 }, { x: 6, y: 6,  z: 3 },
  ],
  waves: [
    {
      waveNumber: 1,
      slots: [
        // Ilha Esquerda
        { x: 0, y: 2,  z: 0 }, { x: 2, y: 2,  z: 0 }, { x: 4, y: 2,  z: 0 },
        { x: 0, y: 4,  z: 0 }, { x: 2, y: 4,  z: 0 }, { x: 4, y: 4,  z: 0 },
        { x: 0, y: 6,  z: 0 }, { x: 2, y: 6,  z: 0 }, { x: 4, y: 6,  z: 0 },
        { x: 0, y: 8,  z: 0 }, { x: 2, y: 8,  z: 0 }, { x: 4, y: 8,  z: 0 },
        { x: 0, y: 10, z: 0 }, { x: 2, y: 10, z: 0 }, { x: 4, y: 10, z: 0 },
        { x: 0, y: 12, z: 0 }, { x: 2, y: 12, z: 0 }, { x: 4, y: 12, z: 0 },
        // Ilha Direita
        { x: 6,  y: 2,  z: 0 }, { x: 8,  y: 2,  z: 0 }, { x: 10, y: 2,  z: 0 },
        { x: 6,  y: 4,  z: 0 }, { x: 8,  y: 4,  z: 0 }, { x: 10, y: 4,  z: 0 },
        { x: 6,  y: 6,  z: 0 }, { x: 8,  y: 6,  z: 0 }, { x: 10, y: 6,  z: 0 },
        { x: 6,  y: 8,  z: 0 }, { x: 8,  y: 8,  z: 0 }, { x: 10, y: 8,  z: 0 },
        { x: 6,  y: 10, z: 0 }, { x: 8,  y: 10, z: 0 }, { x: 10, y: 10, z: 0 },
        { x: 6,  y: 12, z: 0 }, { x: 8,  y: 12, z: 0 }, { x: 10, y: 12, z: 0 },
        // Pontes
        { x: 4, y: 0,  z: 0 }, { x: 6, y: 0,  z: 0 },
        { x: 4, y: 14, z: 0 }, { x: 6, y: 14, z: 0 },
      ],
    },
    {
      waveNumber: 2,
      slots: [
        // Ilha Central Z=1
        { x: 2, y: 4,  z: 1 }, { x: 4, y: 4,  z: 1 }, { x: 6, y: 4,  z: 1 }, { x: 8, y: 4,  z: 1 },
        { x: 2, y: 6,  z: 1 }, { x: 4, y: 6,  z: 1 }, { x: 6, y: 6,  z: 1 }, { x: 8, y: 6,  z: 1 },
        { x: 2, y: 8,  z: 1 }, { x: 4, y: 8,  z: 1 }, { x: 6, y: 8,  z: 1 }, { x: 8, y: 8,  z: 1 },
        { x: 2, y: 10, z: 1 }, { x: 4, y: 10, z: 1 }, { x: 6, y: 10, z: 1 }, { x: 8, y: 10, z: 1 },
        // Base extra para completar 40 peças
        { x: 2, y: 2,  z: 1 }, { x: 4, y: 2,  z: 1 }, { x: 6, y: 2,  z: 1 }, { x: 8, y: 2,  z: 1 },
        { x: 2, y: 12, z: 1 }, { x: 4, y: 12, z: 1 }, { x: 6, y: 12, z: 1 }, { x: 8, y: 12, z: 1 },
        // Picos
        { x: 4, y: 6,  z: 2 }, { x: 6, y: 6,  z: 2 },
        { x: 4, y: 8,  z: 2 }, { x: 6, y: 8,  z: 2 },
        { x: 4, y: 4,  z: 2 }, { x: 6, y: 4,  z: 2 },
        { x: 4, y: 10, z: 2 }, { x: 6, y: 10, z: 2 },
        { x: 4, y: 6,  z: 3 }, { x: 6, y: 6,  z: 3 },
        { x: 4, y: 8,  z: 3 }, { x: 6, y: 8,  z: 3 },
        { x: 4, y: 4,  z: 3 }, { x: 6, y: 4,  z: 3 },
        { x: 4, y: 10, z: 3 }, { x: 6, y: 10, z: 3 },
      ],
    },
  ],
};
