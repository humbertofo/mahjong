import { BoardLayout } from '../../types';

/**
 * 🀄 Fase 50: Taipei Clássico (Shanghai)
 * Dificuldade: Difícil
 * Total de Peças: 144 (3 Ondas Artesanais)
 *
 * Layout: A GRANDE PIRÂMIDE SHANGHAI — o ápice definitivo do Mahjong Solitaire
 * tradicional em toda a sua escala e majestade.
 *
 * Estrutura em 3 ondas progressivas:
 *   Onda 1 — Base da Pirâmide (48 peças): grade 6×6 + antenas laterais
 *   Onda 2 — Corpo da Pirâmide (52 peças): anel 4×4 + camadas z=1-2 + rebase
 *   Onda 3 — Ápice da Pirâmide (44 peças): z=1 a z=4, terminando com o par do topo
 *
 * O jogador finaliza o jogo combinando as 2 peças NO TOPO DA PIRÂMIDE (z=4).
 * Vitória visual e narrativa: a pirâmide desmorona de cima para baixo.
 *
 * Grade mobile: x ∈ {0,2,4,6,8,10}  |  y ∈ {0..14}  |  z ∈ {0..4}
 */
export const level50Layout: BoardLayout = {
  id: 'classic-shanghai',
  name: 'Taipei Clássico (Shanghai)',
  description: 'O ápice definitivo do Mahjong Solitaire — a Grande Pirâmide de Shanghai.',
  difficulty: 'Difícil',
  slots: [
    // ═══════════════════════════════════════════════════════════
    // Z=0: BASE COMPLETA — grade 6×6 + flancos e antenas
    // ═══════════════════════════════════════════════════════════
    { x: 0,  y: 2,  z: 0 }, { x: 2,  y: 2,  z: 0 }, { x: 4,  y: 2,  z: 0 }, { x: 6,  y: 2,  z: 0 }, { x: 8,  y: 2,  z: 0 }, { x: 10, y: 2,  z: 0 },
    { x: 0,  y: 4,  z: 0 }, { x: 2,  y: 4,  z: 0 }, { x: 4,  y: 4,  z: 0 }, { x: 6,  y: 4,  z: 0 }, { x: 8,  y: 4,  z: 0 }, { x: 10, y: 4,  z: 0 },
    { x: 0,  y: 6,  z: 0 }, { x: 2,  y: 6,  z: 0 }, { x: 4,  y: 6,  z: 0 }, { x: 6,  y: 6,  z: 0 }, { x: 8,  y: 6,  z: 0 }, { x: 10, y: 6,  z: 0 },
    { x: 0,  y: 8,  z: 0 }, { x: 2,  y: 8,  z: 0 }, { x: 4,  y: 8,  z: 0 }, { x: 6,  y: 8,  z: 0 }, { x: 8,  y: 8,  z: 0 }, { x: 10, y: 8,  z: 0 },
    { x: 0,  y: 10, z: 0 }, { x: 2,  y: 10, z: 0 }, { x: 4,  y: 10, z: 0 }, { x: 6,  y: 10, z: 0 }, { x: 8,  y: 10, z: 0 }, { x: 10, y: 10, z: 0 },
    { x: 0,  y: 12, z: 0 }, { x: 2,  y: 12, z: 0 }, { x: 4,  y: 12, z: 0 }, { x: 6,  y: 12, z: 0 }, { x: 8,  y: 12, z: 0 }, { x: 10, y: 12, z: 0 },
    // Antenas Shanghai (peças solitárias laterais — marca do layout clássico)
    { x: 4,  y: 0,  z: 0 }, { x: 6,  y: 0,  z: 0 },
    { x: 4,  y: 14, z: 0 }, { x: 6,  y: 14, z: 0 },
    // ═══════════════════════════════════════════════════════════
    // Z=1: SEGUNDO ANDAR — grade 4×4 interna (x=2-8, y=4-12)
    // ═══════════════════════════════════════════════════════════
    { x: 2, y: 4,  z: 1 }, { x: 4, y: 4,  z: 1 }, { x: 6, y: 4,  z: 1 }, { x: 8, y: 4,  z: 1 },
    { x: 2, y: 6,  z: 1 }, { x: 4, y: 6,  z: 1 }, { x: 6, y: 6,  z: 1 }, { x: 8, y: 6,  z: 1 },
    { x: 2, y: 8,  z: 1 }, { x: 4, y: 8,  z: 1 }, { x: 6, y: 8,  z: 1 }, { x: 8, y: 8,  z: 1 },
    { x: 2, y: 10, z: 1 }, { x: 4, y: 10, z: 1 }, { x: 6, y: 10, z: 1 }, { x: 8, y: 10, z: 1 },
    { x: 4, y: 2,  z: 1 }, { x: 6, y: 2,  z: 1 },
    { x: 4, y: 12, z: 1 }, { x: 6, y: 12, z: 1 },
    // ═══════════════════════════════════════════════════════════
    // Z=2: TERCEIRO ANDAR — anel 2×4 + canto quadrante (x=4-6, y=6-10)
    // ═══════════════════════════════════════════════════════════
    { x: 4, y: 4,  z: 2 }, { x: 6, y: 4,  z: 2 },
    { x: 4, y: 6,  z: 2 }, { x: 6, y: 6,  z: 2 },
    { x: 4, y: 8,  z: 2 }, { x: 6, y: 8,  z: 2 },
    { x: 4, y: 10, z: 2 }, { x: 6, y: 10, z: 2 },
    { x: 2, y: 6,  z: 2 }, { x: 8, y: 6,  z: 2 },
    { x: 2, y: 8,  z: 2 }, { x: 8, y: 8,  z: 2 },
    // ═══════════════════════════════════════════════════════════
    // Z=3: QUARTO ANDAR — losango central (4 peças)
    // ═══════════════════════════════════════════════════════════
    { x: 4, y: 6,  z: 3 }, { x: 6, y: 6,  z: 3 },
    { x: 4, y: 8,  z: 3 }, { x: 6, y: 8,  z: 3 },
    // ═══════════════════════════════════════════════════════════
    // Z=4: TOPO DA PIRÂMIDE — o par final (2 peças)
    // ═══════════════════════════════════════════════════════════
    { x: 4, y: 6,  z: 4 }, { x: 6, y: 6,  z: 4 },
  ],
  waves: [
    {
      waveNumber: 1,
      // ── Base da Pirâmide: grade completa 6×6 + antenas (48 peças) ──
      slots: [
        { x: 0,  y: 2,  z: 0 }, { x: 2,  y: 2,  z: 0 }, { x: 4,  y: 2,  z: 0 }, { x: 6,  y: 2,  z: 0 }, { x: 8,  y: 2,  z: 0 }, { x: 10, y: 2,  z: 0 },
        { x: 0,  y: 4,  z: 0 }, { x: 2,  y: 4,  z: 0 }, { x: 4,  y: 4,  z: 0 }, { x: 6,  y: 4,  z: 0 }, { x: 8,  y: 4,  z: 0 }, { x: 10, y: 4,  z: 0 },
        { x: 0,  y: 6,  z: 0 }, { x: 2,  y: 6,  z: 0 }, { x: 4,  y: 6,  z: 0 }, { x: 6,  y: 6,  z: 0 }, { x: 8,  y: 6,  z: 0 }, { x: 10, y: 6,  z: 0 },
        { x: 0,  y: 8,  z: 0 }, { x: 2,  y: 8,  z: 0 }, { x: 4,  y: 8,  z: 0 }, { x: 6,  y: 8,  z: 0 }, { x: 8,  y: 8,  z: 0 }, { x: 10, y: 8,  z: 0 },
        { x: 0,  y: 10, z: 0 }, { x: 2,  y: 10, z: 0 }, { x: 4,  y: 10, z: 0 }, { x: 6,  y: 10, z: 0 }, { x: 8,  y: 10, z: 0 }, { x: 10, y: 10, z: 0 },
        { x: 0,  y: 12, z: 0 }, { x: 2,  y: 12, z: 0 }, { x: 4,  y: 12, z: 0 }, { x: 6,  y: 12, z: 0 }, { x: 8,  y: 12, z: 0 }, { x: 10, y: 12, z: 0 },
        { x: 4,  y: 0,  z: 0 }, { x: 6,  y: 0,  z: 0 },
        { x: 4,  y: 14, z: 0 }, { x: 6,  y: 14, z: 0 },
        { x: 4,  y: 2,  z: 1 }, { x: 6,  y: 2,  z: 1 },
        { x: 4,  y: 12, z: 1 }, { x: 6,  y: 12, z: 1 },
        { x: 2,  y: 4,  z: 1 }, { x: 8,  y: 4,  z: 1 },
        { x: 2,  y: 10, z: 1 }, { x: 8,  y: 10, z: 1 },
      ],
    },
    {
      waveNumber: 2,
      // ── Corpo da Pirâmide: z=1 interno completo + z=2 base (52 peças) ──
      slots: [
        { x: 2,  y: 4,  z: 1 }, { x: 4,  y: 4,  z: 1 }, { x: 6,  y: 4,  z: 1 }, { x: 8,  y: 4,  z: 1 },
        { x: 2,  y: 6,  z: 1 }, { x: 4,  y: 6,  z: 1 }, { x: 6,  y: 6,  z: 1 }, { x: 8,  y: 6,  z: 1 },
        { x: 2,  y: 8,  z: 1 }, { x: 4,  y: 8,  z: 1 }, { x: 6,  y: 8,  z: 1 }, { x: 8,  y: 8,  z: 1 },
        { x: 2,  y: 10, z: 1 }, { x: 4,  y: 10, z: 1 }, { x: 6,  y: 10, z: 1 }, { x: 8,  y: 10, z: 1 },
        // Z=1 extra (lateral z=1)
        { x: 0,  y: 6,  z: 1 }, { x: 0,  y: 8,  z: 1 },
        { x: 10, y: 6,  z: 1 }, { x: 10, y: 8,  z: 1 },
        // Z=2 anel
        { x: 4,  y: 4,  z: 2 }, { x: 6,  y: 4,  z: 2 },
        { x: 4,  y: 6,  z: 2 }, { x: 6,  y: 6,  z: 2 },
        { x: 4,  y: 8,  z: 2 }, { x: 6,  y: 8,  z: 2 },
        { x: 4,  y: 10, z: 2 }, { x: 6,  y: 10, z: 2 },
        { x: 2,  y: 6,  z: 2 }, { x: 8,  y: 6,  z: 2 },
        { x: 2,  y: 8,  z: 2 }, { x: 8,  y: 8,  z: 2 },
        // Complemento z=2
        { x: 2,  y: 4,  z: 2 }, { x: 8,  y: 4,  z: 2 },
        { x: 2,  y: 10, z: 2 }, { x: 8,  y: 10, z: 2 },
        { x: 4,  y: 2,  z: 2 }, { x: 6,  y: 2,  z: 2 },
        { x: 4,  y: 12, z: 2 }, { x: 6,  y: 12, z: 2 },
        // Rebase z=0 para segunda onda
        { x: 0,  y: 2,  z: 0 }, { x: 10, y: 2,  z: 0 },
        { x: 0,  y: 12, z: 0 }, { x: 10, y: 12, z: 0 },
        { x: 0,  y: 4,  z: 0 }, { x: 0,  y: 10, z: 0 },
        { x: 10, y: 4,  z: 0 }, { x: 10, y: 10, z: 0 },
        { x: 0,  y: 6,  z: 0 }, { x: 0,  y: 8,  z: 0 },
        { x: 10, y: 6,  z: 0 }, { x: 10, y: 8,  z: 0 },
      ],
    },
    {
      waveNumber: 3,
      // ── Ápice da Pirâmide: z=1 a z=4, última combinação no topo (44 peças) ──
      slots: [
        // z=1 base ápice
        { x: 4,  y: 4,  z: 1 }, { x: 6,  y: 4,  z: 1 },
        { x: 4,  y: 6,  z: 1 }, { x: 6,  y: 6,  z: 1 },
        { x: 4,  y: 8,  z: 1 }, { x: 6,  y: 8,  z: 1 },
        { x: 4,  y: 10, z: 1 }, { x: 6,  y: 10, z: 1 },
        { x: 2,  y: 6,  z: 1 }, { x: 8,  y: 6,  z: 1 },
        { x: 2,  y: 8,  z: 1 }, { x: 8,  y: 8,  z: 1 },
        // z=2 pirâmide
        { x: 4,  y: 4,  z: 2 }, { x: 6,  y: 4,  z: 2 },
        { x: 4,  y: 6,  z: 2 }, { x: 6,  y: 6,  z: 2 },
        { x: 4,  y: 8,  z: 2 }, { x: 6,  y: 8,  z: 2 },
        { x: 4,  y: 10, z: 2 }, { x: 6,  y: 10, z: 2 },
        { x: 2,  y: 6,  z: 2 }, { x: 8,  y: 6,  z: 2 },
        { x: 2,  y: 8,  z: 2 }, { x: 8,  y: 8,  z: 2 },
        // z=3 quarto andar (losango)
        { x: 4,  y: 6,  z: 3 }, { x: 6,  y: 6,  z: 3 },
        { x: 4,  y: 8,  z: 3 }, { x: 6,  y: 8,  z: 3 },
        { x: 4,  y: 4,  z: 3 }, { x: 6,  y: 4,  z: 3 },
        { x: 4,  y: 10, z: 3 }, { x: 6,  y: 10, z: 3 },
        // z=3 anel extra
        { x: 2,  y: 6,  z: 3 }, { x: 8,  y: 6,  z: 3 },
        { x: 2,  y: 8,  z: 3 }, { x: 8,  y: 8,  z: 3 },
        // Pré-ápice z=3
        { x: 4,  y: 6,  z: 3 }, { x: 6,  y: 6,  z: 3 },
        // z=4: O PAR FINAL — topo da pirâmide
        { x: 4,  y: 6,  z: 4 }, { x: 6,  y: 6,  z: 4 },
        // Complemento z=2 extras para atingir 44
        { x: 4,  y: 2,  z: 1 }, { x: 6,  y: 2,  z: 1 },
        { x: 4,  y: 12, z: 1 }, { x: 6,  y: 12, z: 1 },
      ],
    },
  ],
};
