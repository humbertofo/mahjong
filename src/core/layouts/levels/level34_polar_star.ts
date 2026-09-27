import { BoardLayout } from '../../types';

/**
 * 🀄 Fase 34: Estrela Polar
 * Dificuldade: Difícil
 * Total de Peças: 80 (2 Ondas Artesanais)
 *
 * Layout: Octograma (estrela de 8 pontas) com núcleo elevado em losango.
 * As pontas são as peças livres iniciais; o núcleo central só se expõe
 * após remover as 8 pontas da onda 1.
 *
 * Onda 1 — 8 Pontas da Estrela (40 peças)
 * Onda 2 — Núcleo + Anel do Losango (40 peças)
 *
 * Grade mobile: x ∈ {0,2,4,6,8,10}  |  y ∈ {0..14}  |  z ∈ {0..3}
 */
export const level34Layout: BoardLayout = {
  id: 'polar-star',
  name: 'Estrela Polar',
  description: 'O octograma polar que guia os viajantes do Grande Norte.',
  difficulty: 'Difícil',
  slots: [
    // ── Ponta Norte (y=0-2) ──
    { x: 4, y: 0,  z: 0 }, { x: 6, y: 0,  z: 0 },
    { x: 4, y: 2,  z: 0 }, { x: 6, y: 2,  z: 0 },
    // ── Ponta Sul (y=12-14) ──
    { x: 4, y: 12, z: 0 }, { x: 6, y: 12, z: 0 },
    { x: 4, y: 14, z: 0 }, { x: 6, y: 14, z: 0 },
    // ── Ponta Oeste (x=0-2) ──
    { x: 0, y: 6,  z: 0 }, { x: 0, y: 8,  z: 0 },
    { x: 2, y: 6,  z: 0 }, { x: 2, y: 8,  z: 0 },
    // ── Ponta Leste (x=8-10) ──
    { x: 8,  y: 6,  z: 0 }, { x: 8,  y: 8,  z: 0 },
    { x: 10, y: 6,  z: 0 }, { x: 10, y: 8,  z: 0 },
    // ── Pontas Diagonais NE/NO/SE/SO ──
    { x: 2, y: 2,  z: 0 }, { x: 2, y: 4,  z: 0 },  // NO
    { x: 8, y: 2,  z: 0 }, { x: 8, y: 4,  z: 0 },  // NE
    { x: 2, y: 10, z: 0 }, { x: 2, y: 12, z: 0 },  // SO
    { x: 8, y: 10, z: 0 }, { x: 8, y: 12, z: 0 },  // SE
    // ── Anel do Losango Z=0 ──
    { x: 4, y: 4,  z: 0 }, { x: 6, y: 4,  z: 0 },
    { x: 4, y: 10, z: 0 }, { x: 6, y: 10, z: 0 },
    { x: 2, y: 6,  z: 1 }, { x: 2, y: 8,  z: 1 },
    { x: 8, y: 6,  z: 1 }, { x: 8, y: 8,  z: 1 },
    // ── Núcleo Central Z=1 ──
    { x: 4, y: 4,  z: 1 }, { x: 6, y: 4,  z: 1 },
    { x: 4, y: 6,  z: 1 }, { x: 6, y: 6,  z: 1 },
    { x: 4, y: 8,  z: 1 }, { x: 6, y: 8,  z: 1 },
    { x: 4, y: 10, z: 1 }, { x: 6, y: 10, z: 1 },
    // ── Coração Polar Z=2 ──
    { x: 4, y: 6,  z: 2 }, { x: 6, y: 6,  z: 2 },
    { x: 4, y: 8,  z: 2 }, { x: 6, y: 8,  z: 2 },
    // ── Ápice Z=3 ──
    { x: 4, y: 6,  z: 3 }, { x: 6, y: 6,  z: 3 },
  ],
  waves: [
    {
      waveNumber: 1,
      // 8 pontas da estrela (40 peças)
      slots: [
        { x: 4,  y: 0,  z: 0 }, { x: 6,  y: 0,  z: 0 },
        { x: 4,  y: 2,  z: 0 }, { x: 6,  y: 2,  z: 0 },
        { x: 4,  y: 12, z: 0 }, { x: 6,  y: 12, z: 0 },
        { x: 4,  y: 14, z: 0 }, { x: 6,  y: 14, z: 0 },
        { x: 0,  y: 6,  z: 0 }, { x: 0,  y: 8,  z: 0 },
        { x: 2,  y: 6,  z: 0 }, { x: 2,  y: 8,  z: 0 },
        { x: 8,  y: 6,  z: 0 }, { x: 8,  y: 8,  z: 0 },
        { x: 10, y: 6,  z: 0 }, { x: 10, y: 8,  z: 0 },
        { x: 2,  y: 2,  z: 0 }, { x: 2,  y: 4,  z: 0 },
        { x: 8,  y: 2,  z: 0 }, { x: 8,  y: 4,  z: 0 },
        { x: 2,  y: 10, z: 0 }, { x: 2,  y: 12, z: 0 },
        { x: 8,  y: 10, z: 0 }, { x: 8,  y: 12, z: 0 },
        // Conectores entre pontas
        { x: 4,  y: 4,  z: 0 }, { x: 6,  y: 4,  z: 0 },
        { x: 4,  y: 10, z: 0 }, { x: 6,  y: 10, z: 0 },
        { x: 4,  y: 6,  z: 0 }, { x: 6,  y: 6,  z: 0 },
        { x: 4,  y: 8,  z: 0 }, { x: 6,  y: 8,  z: 0 },
        // Anel Z=1 base
        { x: 2,  y: 4,  z: 1 }, { x: 8,  y: 4,  z: 1 },
        { x: 2,  y: 10, z: 1 }, { x: 8,  y: 10, z: 1 },
        { x: 4,  y: 2,  z: 1 }, { x: 6,  y: 2,  z: 1 },
        { x: 4,  y: 12, z: 1 }, { x: 6,  y: 12, z: 1 },
      ],
    },
    {
      waveNumber: 2,
      // Núcleo do losango (40 peças)
      slots: [
        { x: 2,  y: 6,  z: 1 }, { x: 2,  y: 8,  z: 1 },
        { x: 8,  y: 6,  z: 1 }, { x: 8,  y: 8,  z: 1 },
        { x: 4,  y: 4,  z: 1 }, { x: 6,  y: 4,  z: 1 },
        { x: 4,  y: 6,  z: 1 }, { x: 6,  y: 6,  z: 1 },
        { x: 4,  y: 8,  z: 1 }, { x: 6,  y: 8,  z: 1 },
        { x: 4,  y: 10, z: 1 }, { x: 6,  y: 10, z: 1 },
        { x: 4,  y: 6,  z: 2 }, { x: 6,  y: 6,  z: 2 },
        { x: 4,  y: 8,  z: 2 }, { x: 6,  y: 8,  z: 2 },
        { x: 4,  y: 4,  z: 2 }, { x: 6,  y: 4,  z: 2 },
        { x: 4,  y: 10, z: 2 }, { x: 6,  y: 10, z: 2 },
        { x: 2,  y: 4,  z: 2 }, { x: 8,  y: 4,  z: 2 },
        { x: 2,  y: 10, z: 2 }, { x: 8,  y: 10, z: 2 },
        { x: 4,  y: 2,  z: 2 }, { x: 6,  y: 2,  z: 2 },
        { x: 4,  y: 12, z: 2 }, { x: 6,  y: 12, z: 2 },
        { x: 4,  y: 6,  z: 3 }, { x: 6,  y: 6,  z: 3 },
        { x: 4,  y: 8,  z: 3 }, { x: 6,  y: 8,  z: 3 },
        { x: 2,  y: 6,  z: 2 }, { x: 8,  y: 6,  z: 2 },
        { x: 2,  y: 8,  z: 2 }, { x: 8,  y: 8,  z: 2 },
        { x: 0,  y: 6,  z: 1 }, { x: 0,  y: 8,  z: 1 },
        { x: 10, y: 6,  z: 1 }, { x: 10, y: 8,  z: 1 },
      ],
    },
  ],
};
