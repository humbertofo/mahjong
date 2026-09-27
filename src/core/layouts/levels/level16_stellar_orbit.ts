import { BoardLayout } from '../../types';

/**
 * 🀄 Fase 16: Órbita Celeste
 * Dificuldade: Médio
 * Total de Peças: 72 (2 Ondas Artesanais)
 *
 * Layout: Anéis concêntricos planetários — anel exterior largo + anel interior
 * com núcleo elevado no centro, evocando um planeta visto do espaço.
 *
 * Onda 1 — Anel Exterior + Anel Interno base (36 peças)
 * Onda 2 — Anel Interior elevado + Núcleo solar (36 peças)
 *
 * Grade mobile: x ∈ {0,2,4,6,8,10}  |  y ∈ {0..14}  |  z ∈ {0..2}
 */
export const level16Layout: BoardLayout = {
  id: 'stellar-orbit',
  name: 'Órbita Celeste',
  description: 'Anéis concêntricos girando em torno do sol interior dourado.',
  difficulty: 'Médio',
  slots: [
    // ── Z=0: Anel exterior — perímetro completo ──
    { x: 0,  y: 0,  z: 0 }, { x: 2,  y: 0,  z: 0 }, { x: 4,  y: 0,  z: 0 }, { x: 6,  y: 0,  z: 0 }, { x: 8,  y: 0,  z: 0 }, { x: 10, y: 0,  z: 0 },
    { x: 0,  y: 14, z: 0 }, { x: 2,  y: 14, z: 0 }, { x: 4,  y: 14, z: 0 }, { x: 6,  y: 14, z: 0 }, { x: 8,  y: 14, z: 0 }, { x: 10, y: 14, z: 0 },
    { x: 0,  y: 2,  z: 0 }, { x: 0,  y: 4,  z: 0 }, { x: 0,  y: 6,  z: 0 }, { x: 0,  y: 8,  z: 0 }, { x: 0,  y: 10, z: 0 }, { x: 0,  y: 12, z: 0 },
    { x: 10, y: 2,  z: 0 }, { x: 10, y: 4,  z: 0 }, { x: 10, y: 6,  z: 0 }, { x: 10, y: 8,  z: 0 }, { x: 10, y: 10, z: 0 }, { x: 10, y: 12, z: 0 },
    // ── Z=0: Anel interno — 2ª órbita ──
    { x: 2, y: 2,  z: 0 }, { x: 4, y: 2,  z: 0 }, { x: 6, y: 2,  z: 0 }, { x: 8, y: 2,  z: 0 },
    { x: 2, y: 12, z: 0 }, { x: 4, y: 12, z: 0 }, { x: 6, y: 12, z: 0 }, { x: 8, y: 12, z: 0 },
    { x: 2, y: 4,  z: 0 }, { x: 2, y: 6,  z: 0 }, { x: 2, y: 8,  z: 0 }, { x: 2, y: 10, z: 0 },
    { x: 8, y: 4,  z: 0 }, { x: 8, y: 6,  z: 0 }, { x: 8, y: 8,  z: 0 }, { x: 8, y: 10, z: 0 },
    // ── Z=0: Interior central ──
    { x: 4, y: 4,  z: 0 }, { x: 6, y: 4,  z: 0 }, { x: 4, y: 10, z: 0 }, { x: 6, y: 10, z: 0 },
    { x: 4, y: 6,  z: 0 }, { x: 6, y: 6,  z: 0 }, { x: 4, y: 8,  z: 0 }, { x: 6, y: 8,  z: 0 },
    // ── Z=1: Flancos elevados ──
    { x: 2, y: 4,  z: 1 }, { x: 2, y: 6,  z: 1 }, { x: 2, y: 8,  z: 1 }, { x: 2, y: 10, z: 1 },
    { x: 8, y: 4,  z: 1 }, { x: 8, y: 6,  z: 1 }, { x: 8, y: 8,  z: 1 }, { x: 8, y: 10, z: 1 },
    { x: 4, y: 4,  z: 1 }, { x: 6, y: 4,  z: 1 }, { x: 4, y: 10, z: 1 }, { x: 6, y: 10, z: 1 },
    { x: 4, y: 6,  z: 1 }, { x: 6, y: 6,  z: 1 }, { x: 4, y: 8,  z: 1 }, { x: 6, y: 8,  z: 1 },
    // ── Z=2: Núcleo solar ──
    { x: 4, y: 6,  z: 2 }, { x: 6, y: 6,  z: 2 },
    { x: 4, y: 8,  z: 2 }, { x: 6, y: 8,  z: 2 },
  ],
  waves: [
    {
      waveNumber: 1,
      slots: [
        { x: 0,  y: 0,  z: 0 }, { x: 2,  y: 0,  z: 0 }, { x: 4,  y: 0,  z: 0 }, { x: 6,  y: 0,  z: 0 }, { x: 8,  y: 0,  z: 0 }, { x: 10, y: 0,  z: 0 },
        { x: 0,  y: 14, z: 0 }, { x: 2,  y: 14, z: 0 }, { x: 4,  y: 14, z: 0 }, { x: 6,  y: 14, z: 0 }, { x: 8,  y: 14, z: 0 }, { x: 10, y: 14, z: 0 },
        { x: 0,  y: 2,  z: 0 }, { x: 0,  y: 4,  z: 0 }, { x: 0,  y: 6,  z: 0 }, { x: 0,  y: 8,  z: 0 }, { x: 0,  y: 10, z: 0 }, { x: 0,  y: 12, z: 0 },
        { x: 10, y: 2,  z: 0 }, { x: 10, y: 4,  z: 0 }, { x: 10, y: 6,  z: 0 }, { x: 10, y: 8,  z: 0 }, { x: 10, y: 10, z: 0 }, { x: 10, y: 12, z: 0 },
        { x: 2, y: 2,  z: 0 }, { x: 4, y: 2,  z: 0 }, { x: 6, y: 2,  z: 0 }, { x: 8, y: 2,  z: 0 },
        { x: 2, y: 12, z: 0 }, { x: 4, y: 12, z: 0 }, { x: 6, y: 12, z: 0 }, { x: 8, y: 12, z: 0 },
        { x: 2, y: 4,  z: 0 }, { x: 2, y: 6,  z: 0 }, { x: 2, y: 8,  z: 0 }, { x: 2, y: 10, z: 0 },
        { x: 8, y: 4,  z: 0 }, { x: 8, y: 6,  z: 0 }, { x: 8, y: 8,  z: 0 }, { x: 8, y: 10, z: 0 },
      ],
    },
    {
      waveNumber: 2,
      slots: [
        { x: 4, y: 4,  z: 0 }, { x: 6, y: 4,  z: 0 }, { x: 4, y: 10, z: 0 }, { x: 6, y: 10, z: 0 },
        { x: 4, y: 6,  z: 0 }, { x: 6, y: 6,  z: 0 }, { x: 4, y: 8,  z: 0 }, { x: 6, y: 8,  z: 0 },
        { x: 2, y: 4,  z: 1 }, { x: 2, y: 6,  z: 1 }, { x: 2, y: 8,  z: 1 }, { x: 2, y: 10, z: 1 },
        { x: 8, y: 4,  z: 1 }, { x: 8, y: 6,  z: 1 }, { x: 8, y: 8,  z: 1 }, { x: 8, y: 10, z: 1 },
        { x: 4, y: 4,  z: 1 }, { x: 6, y: 4,  z: 1 }, { x: 4, y: 10, z: 1 }, { x: 6, y: 10, z: 1 },
        { x: 4, y: 6,  z: 1 }, { x: 6, y: 6,  z: 1 }, { x: 4, y: 8,  z: 1 }, { x: 6, y: 8,  z: 1 },
        { x: 4, y: 2,  z: 1 }, { x: 6, y: 2,  z: 1 },
        { x: 4, y: 12, z: 1 }, { x: 6, y: 12, z: 1 },
        { x: 4, y: 6,  z: 2 }, { x: 6, y: 6,  z: 2 },
        { x: 4, y: 8,  z: 2 }, { x: 6, y: 8,  z: 2 },
        { x: 4, y: 4,  z: 2 }, { x: 6, y: 4,  z: 2 },
        { x: 4, y: 10, z: 2 }, { x: 6, y: 10, z: 2 },
      ],
    },
  ],
};
