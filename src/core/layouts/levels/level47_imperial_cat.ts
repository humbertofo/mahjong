import { BoardLayout } from '../../types';

/**
 * 🀄 Fase 47: Gato Imperial
 * Dificuldade: Difícil
 * Total de Peças: 80 (2 Ondas Artesanais)
 *
 * Layout: Silhueta estilizada de um rosto de gato visto de frente —
 * orelhas triangulares no topo, rosto oval central, bigodes laterais.
 * Thematicamente alinhado ao nome "Imperial Cat".
 *
 * Onda 1 — Rosto e Bigodes (40 peças)
 * Onda 2 — Interior elevado + Orelhas (40 peças)
 *
 * Grade mobile: x ∈ {0,2,4,6,8,10}  |  y ∈ {0..14}  |  z ∈ {0..3}
 */
export const level47Layout: BoardLayout = {
  id: 'imperial-cat',
  name: 'Gato Imperial',
  description: 'O guardião eterno dos palácios celestiais, orgulhoso e majestoso.',
  difficulty: 'Difícil',
  slots: [
    // ── Orelha Esquerda (triângulo x=0-4, y=0-4) ──
    { x: 0, y: 0,  z: 0 }, { x: 2, y: 0,  z: 0 },
    { x: 2, y: 2,  z: 0 },
    { x: 2, y: 0,  z: 1 },
    // ── Orelha Direita (triângulo x=6-10, y=0-4) ──
    { x: 8,  y: 0,  z: 0 }, { x: 10, y: 0,  z: 0 },
    { x: 8,  y: 2,  z: 0 },
    { x: 8,  y: 0,  z: 1 },
    // ── Rosto — anel oval (y=4-12, x=2-8) ──
    { x: 2, y: 4,  z: 0 }, { x: 4, y: 4,  z: 0 }, { x: 6, y: 4,  z: 0 }, { x: 8, y: 4,  z: 0 },
    { x: 2, y: 6,  z: 0 }, { x: 8, y: 6,  z: 0 },
    { x: 2, y: 8,  z: 0 }, { x: 8, y: 8,  z: 0 },
    { x: 2, y: 10, z: 0 }, { x: 8, y: 10, z: 0 },
    { x: 2, y: 12, z: 0 }, { x: 4, y: 12, z: 0 }, { x: 6, y: 12, z: 0 }, { x: 8, y: 12, z: 0 },
    // ── Bigodes (x=0 e x=10, y=6-10) ──
    { x: 0, y: 6,  z: 0 }, { x: 0, y: 8,  z: 0 }, { x: 0, y: 10, z: 0 },
    { x: 10, y: 6, z: 0 }, { x: 10, y: 8, z: 0 }, { x: 10, y: 10, z: 0 },
    // ── Interior do rosto Z=1 ──
    { x: 4, y: 6,  z: 1 }, { x: 6, y: 6,  z: 1 },
    { x: 4, y: 8,  z: 1 }, { x: 6, y: 8,  z: 1 },
    { x: 4, y: 10, z: 1 }, { x: 6, y: 10, z: 1 },
    { x: 4, y: 4,  z: 1 }, { x: 6, y: 4,  z: 1 },
    { x: 2, y: 6,  z: 1 }, { x: 8, y: 6,  z: 1 },
    { x: 2, y: 8,  z: 1 }, { x: 8, y: 8,  z: 1 },
    { x: 2, y: 10, z: 1 }, { x: 8, y: 10, z: 1 },
    // ── Focinho Z=2 ──
    { x: 4, y: 8,  z: 2 }, { x: 6, y: 8,  z: 2 },
    { x: 4, y: 6,  z: 2 }, { x: 6, y: 6,  z: 2 },
    // ── Nariz Z=3 (par final) ──
    { x: 4, y: 8,  z: 3 }, { x: 6, y: 8,  z: 3 },
    // ── Pescoço / queixo ──
    { x: 4, y: 14, z: 0 }, { x: 6, y: 14, z: 0 },
    { x: 4, y: 12, z: 1 }, { x: 6, y: 12, z: 1 },
  ],
  waves: [
    {
      waveNumber: 1,
      // Rosto, bigodes e orelhas externas (40 peças)
      slots: [
        { x: 0,  y: 0,  z: 0 }, { x: 2,  y: 0,  z: 0 },
        { x: 8,  y: 0,  z: 0 }, { x: 10, y: 0,  z: 0 },
        { x: 2,  y: 2,  z: 0 }, { x: 8,  y: 2,  z: 0 },
        { x: 2,  y: 4,  z: 0 }, { x: 4,  y: 4,  z: 0 }, { x: 6,  y: 4,  z: 0 }, { x: 8,  y: 4,  z: 0 },
        { x: 2,  y: 6,  z: 0 }, { x: 8,  y: 6,  z: 0 },
        { x: 2,  y: 8,  z: 0 }, { x: 8,  y: 8,  z: 0 },
        { x: 2,  y: 10, z: 0 }, { x: 8,  y: 10, z: 0 },
        { x: 2,  y: 12, z: 0 }, { x: 4,  y: 12, z: 0 }, { x: 6,  y: 12, z: 0 }, { x: 8,  y: 12, z: 0 },
        { x: 0,  y: 6,  z: 0 }, { x: 0,  y: 8,  z: 0 }, { x: 0,  y: 10, z: 0 },
        { x: 10, y: 6,  z: 0 }, { x: 10, y: 8,  z: 0 }, { x: 10, y: 10, z: 0 },
        { x: 4,  y: 14, z: 0 }, { x: 6,  y: 14, z: 0 },
        { x: 2,  y: 0,  z: 1 }, { x: 8,  y: 0,  z: 1 },
        { x: 4,  y: 4,  z: 1 }, { x: 6,  y: 4,  z: 1 },
        { x: 2,  y: 4,  z: 1 }, { x: 8,  y: 4,  z: 1 },
        { x: 0,  y: 6,  z: 1 }, { x: 10, y: 6,  z: 1 },
        { x: 0,  y: 8,  z: 1 }, { x: 10, y: 8,  z: 1 },
        { x: 4,  y: 12, z: 1 }, { x: 6,  y: 12, z: 1 },
      ],
    },
    {
      waveNumber: 2,
      // Interior elevado + olhos + nariz (40 peças)
      slots: [
        { x: 4,  y: 6,  z: 1 }, { x: 6,  y: 6,  z: 1 },
        { x: 4,  y: 8,  z: 1 }, { x: 6,  y: 8,  z: 1 },
        { x: 4,  y: 10, z: 1 }, { x: 6,  y: 10, z: 1 },
        { x: 2,  y: 6,  z: 1 }, { x: 8,  y: 6,  z: 1 },
        { x: 2,  y: 8,  z: 1 }, { x: 8,  y: 8,  z: 1 },
        { x: 2,  y: 10, z: 1 }, { x: 8,  y: 10, z: 1 },
        { x: 0,  y: 10, z: 1 }, { x: 10, y: 10, z: 1 },
        // Bigodes elevados
        { x: 0,  y: 6,  z: 2 }, { x: 0,  y: 8,  z: 2 },
        { x: 10, y: 6,  z: 2 }, { x: 10, y: 8,  z: 2 },
        // Focinho
        { x: 4,  y: 8,  z: 2 }, { x: 6,  y: 8,  z: 2 },
        { x: 4,  y: 6,  z: 2 }, { x: 6,  y: 6,  z: 2 },
        { x: 4,  y: 10, z: 2 }, { x: 6,  y: 10, z: 2 },
        { x: 2,  y: 6,  z: 2 }, { x: 8,  y: 6,  z: 2 },
        { x: 2,  y: 8,  z: 2 }, { x: 8,  y: 8,  z: 2 },
        { x: 2,  y: 10, z: 2 }, { x: 8,  y: 10, z: 2 },
        { x: 4,  y: 4,  z: 2 }, { x: 6,  y: 4,  z: 2 },
        { x: 4,  y: 12, z: 2 }, { x: 6,  y: 12, z: 2 },
        // Nariz Z=3
        { x: 4,  y: 8,  z: 3 }, { x: 6,  y: 8,  z: 3 },
        // Orelhas Z=2/3
        { x: 2,  y: 0,  z: 2 }, { x: 8,  y: 0,  z: 2 },
        { x: 4,  y: 2,  z: 1 }, { x: 6,  y: 2,  z: 1 },
      ],
    },
  ],
};
