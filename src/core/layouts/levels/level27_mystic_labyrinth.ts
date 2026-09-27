import { BoardLayout } from '../../types';

/**
 * 🀄 Fase 27: Labirinto Místico
 * Dificuldade: Médio
 * Total de Peças: 72 (2 Ondas Artesanais)
 *
 * Layout: Labirinto de corredores em L e T — a onda 1 é o
 * anel exterior com passagens falsas; a onda 2 é o núcleo
 * interno com o centro desbloqueado por último.
 *
 * Onda 1 — Muralhas do Labirinto (36 peças):
 *   Anel perimetral + divisórias internas em T
 *
 * Onda 2 — Núcleo Interno (36 peças):
 *   Câmaras internas com elevação central
 *
 * Grade mobile: x ∈ {0,2,4,6,8,10}  |  y ∈ {0..14}  |  z ∈ {0..2}
 */
export const level27Layout: BoardLayout = {
  id: 'mystic-labyrinth',
  name: 'Labirinto Místico',
  description: 'Corredores sinuosos que guardam os segredos dos anciãos da floresta.',
  difficulty: 'Médio',
  slots: [
    // ── Anel Exterior (parede do labirinto) ──
    // Topo
    { x: 0, y: 0,  z: 0 }, { x: 2, y: 0,  z: 0 }, { x: 4, y: 0,  z: 0 }, { x: 6, y: 0,  z: 0 }, { x: 8, y: 0,  z: 0 }, { x: 10, y: 0,  z: 0 },
    // Base
    { x: 0, y: 14, z: 0 }, { x: 2, y: 14, z: 0 }, { x: 4, y: 14, z: 0 }, { x: 6, y: 14, z: 0 }, { x: 8, y: 14, z: 0 }, { x: 10, y: 14, z: 0 },
    // Laterais
    { x: 0,  y: 2,  z: 0 }, { x: 0,  y: 4,  z: 0 }, { x: 0,  y: 6,  z: 0 }, { x: 0,  y: 8,  z: 0 }, { x: 0,  y: 10, z: 0 }, { x: 0,  y: 12, z: 0 },
    { x: 10, y: 2,  z: 0 }, { x: 10, y: 4,  z: 0 }, { x: 10, y: 6,  z: 0 }, { x: 10, y: 8,  z: 0 }, { x: 10, y: 10, z: 0 }, { x: 10, y: 12, z: 0 },
    // ── Divisórias internas em T e L ──
    // Divisória horizontal superior
    { x: 2, y: 4,  z: 0 }, { x: 4, y: 4,  z: 0 }, { x: 6, y: 4,  z: 0 },
    // Divisória vertical esquerda
    { x: 4, y: 2,  z: 0 }, { x: 4, y: 6,  z: 0 }, { x: 4, y: 8,  z: 0 },
    // Divisória horizontal inferior
    { x: 4, y: 10, z: 0 }, { x: 6, y: 10, z: 0 }, { x: 8, y: 10, z: 0 },
    // Divisória vertical direita
    { x: 6, y: 6,  z: 0 }, { x: 6, y: 8,  z: 0 },
    // Canto-L superior direito
    { x: 8, y: 4,  z: 0 }, { x: 8, y: 6,  z: 0 },
    // Câmara esquerda inferior
    { x: 2, y: 10, z: 0 }, { x: 2, y: 12, z: 0 },
    // ── Z=1: Elevação dos cruzamentos ──
    { x: 4, y: 4,  z: 1 }, { x: 6, y: 4,  z: 1 },
    { x: 4, y: 6,  z: 1 }, { x: 6, y: 6,  z: 1 },
    { x: 4, y: 8,  z: 1 }, { x: 6, y: 8,  z: 1 },
    { x: 4, y: 10, z: 1 }, { x: 6, y: 10, z: 1 },
    // ── Z=2: Centro do labirinto (câmara secreta) ──
    { x: 4, y: 6,  z: 2 }, { x: 6, y: 6,  z: 2 },
    { x: 4, y: 8,  z: 2 }, { x: 6, y: 8,  z: 2 },
  ],
  waves: [
    {
      waveNumber: 1,
      // Muralhas externas e divisórias
      slots: [
        { x: 0,  y: 0,  z: 0 }, { x: 2,  y: 0,  z: 0 }, { x: 4,  y: 0,  z: 0 }, { x: 6,  y: 0,  z: 0 }, { x: 8,  y: 0,  z: 0 }, { x: 10, y: 0,  z: 0 },
        { x: 0,  y: 14, z: 0 }, { x: 2,  y: 14, z: 0 }, { x: 4,  y: 14, z: 0 }, { x: 6,  y: 14, z: 0 }, { x: 8,  y: 14, z: 0 }, { x: 10, y: 14, z: 0 },
        { x: 0,  y: 2,  z: 0 }, { x: 0,  y: 4,  z: 0 }, { x: 0,  y: 6,  z: 0 }, { x: 0,  y: 8,  z: 0 }, { x: 0,  y: 10, z: 0 }, { x: 0,  y: 12, z: 0 },
        { x: 10, y: 2,  z: 0 }, { x: 10, y: 4,  z: 0 }, { x: 10, y: 6,  z: 0 }, { x: 10, y: 8,  z: 0 }, { x: 10, y: 10, z: 0 }, { x: 10, y: 12, z: 0 },
        { x: 2, y: 4,  z: 0 }, { x: 4, y: 4,  z: 0 }, { x: 6, y: 4,  z: 0 },
        { x: 4, y: 2,  z: 0 }, { x: 4, y: 6,  z: 0 }, { x: 4, y: 8,  z: 0 },
        { x: 4, y: 10, z: 0 }, { x: 6, y: 10, z: 0 }, { x: 8, y: 10, z: 0 },
        { x: 6, y: 6,  z: 0 }, { x: 6, y: 8,  z: 0 },
        { x: 8, y: 4,  z: 0 }, { x: 8, y: 6,  z: 0 },
      ],
    },
    {
      waveNumber: 2,
      // Núcleo interno e câmara secreta
      slots: [
        { x: 2, y: 2,  z: 0 }, { x: 8, y: 2,  z: 0 },
        { x: 2, y: 6,  z: 0 }, { x: 2, y: 8,  z: 0 },
        { x: 8, y: 8,  z: 0 }, { x: 8, y: 12, z: 0 },
        { x: 2, y: 10, z: 0 }, { x: 2, y: 12, z: 0 },
        { x: 6, y: 2,  z: 0 }, { x: 6, y: 12, z: 0 },
        { x: 2, y: 4,  z: 1 }, { x: 8, y: 4,  z: 1 },
        { x: 4, y: 4,  z: 1 }, { x: 6, y: 4,  z: 1 },
        { x: 4, y: 6,  z: 1 }, { x: 6, y: 6,  z: 1 },
        { x: 4, y: 8,  z: 1 }, { x: 6, y: 8,  z: 1 },
        { x: 4, y: 10, z: 1 }, { x: 6, y: 10, z: 1 },
        { x: 2, y: 6,  z: 1 }, { x: 8, y: 6,  z: 1 },
        { x: 2, y: 8,  z: 1 }, { x: 8, y: 8,  z: 1 },
        { x: 2, y: 10, z: 1 }, { x: 8, y: 10, z: 1 },
        { x: 4, y: 12, z: 1 }, { x: 6, y: 12, z: 1 },
        { x: 4, y: 6,  z: 2 }, { x: 6, y: 6,  z: 2 },
        { x: 4, y: 8,  z: 2 }, { x: 6, y: 8,  z: 2 },
        { x: 4, y: 4,  z: 2 }, { x: 6, y: 4,  z: 2 },
        { x: 4, y: 10, z: 2 }, { x: 6, y: 10, z: 2 },
      ],
    },
  ],
};
