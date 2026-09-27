import { BoardLayout } from '../../types';

/**
 * 🀄 Fase 38: Chave Mestra
 * Dificuldade: Difícil
 * Total de Peças: 100 (2 Ondas Artesanais)
 *
 * Layout: Silhueta de uma chave vista de cima — cabo retangular no topo,
 * haste vertical central, três dentes projetados para a direita.
 * Tema visual que remete a "abrir os portais secretos".
 *
 * Estrutura geral:
 *   CABO (topo):  grade 3 colunas × 4 linhas, elevada com z=1/2 no centro
 *   HASTE:        2 colunas simétricas (x=4,6) percorrendo y=6 até y=14
 *   DENTES:       3 pares de projeções à direita (x=8-10) em y=8, 10, 12
 *
 * Grade mobile: x ∈ {0,2,4,6,8,10}  |  y ∈ {0..14}  |  z ∈ {0..3}
 */
export const level38Layout: BoardLayout = {
  id: 'master-key',
  name: 'Chave Mestra',
  description: 'O símbolo universal que abre todos os portais da cidadela ancestral.',
  difficulty: 'Difícil',
  slots: [
    // ─── CABO DA CHAVE (y: 0–4, x: 2–8) — cabeça larga da chave ───
    // Z=0: grade 4 colunas × 3 linhas = 12 peças
    { x: 2, y: 0, z: 0 }, { x: 4, y: 0, z: 0 }, { x: 6, y: 0, z: 0 }, { x: 8, y: 0, z: 0 },
    { x: 2, y: 2, z: 0 }, { x: 4, y: 2, z: 0 }, { x: 6, y: 2, z: 0 }, { x: 8, y: 2, z: 0 },
    { x: 2, y: 4, z: 0 }, { x: 4, y: 4, z: 0 }, { x: 6, y: 4, z: 0 }, { x: 8, y: 4, z: 0 },
    // Z=1: núcleo elevado do cabo (3 colunas × 2 linhas = 6)
    { x: 4, y: 0, z: 1 }, { x: 6, y: 0, z: 1 },
    { x: 4, y: 2, z: 1 }, { x: 6, y: 2, z: 1 },
    { x: 4, y: 4, z: 1 }, { x: 6, y: 4, z: 1 },
    // Z=2: topo do cabo (buraco da chave simulado — 2 peças)
    { x: 4, y: 2, z: 2 }, { x: 6, y: 2, z: 2 },

    // ─── HASTE DA CHAVE (x: 4,6 — eixo central, y: 6–14) ───
    // Z=0: 2 colunas × 5 linhas = 10 peças
    { x: 4, y: 6,  z: 0 }, { x: 6, y: 6,  z: 0 },
    { x: 4, y: 8,  z: 0 }, { x: 6, y: 8,  z: 0 },
    { x: 4, y: 10, z: 0 }, { x: 6, y: 10, z: 0 },
    { x: 4, y: 12, z: 0 }, { x: 6, y: 12, z: 0 },
    { x: 4, y: 14, z: 0 }, { x: 6, y: 14, z: 0 },
    // Z=1: espessura da haste (coluna x=4 apenas, mais profunda)
    { x: 4, y: 6,  z: 1 }, { x: 4, y: 8,  z: 1 },
    { x: 4, y: 10, z: 1 }, { x: 4, y: 12, z: 1 },

    // ─── DENTES DA CHAVE (x: 8, 10 — projeções à direita) ───
    // Dente 1: y=8
    { x: 8,  y: 8,  z: 0 }, { x: 10, y: 8,  z: 0 },
    { x: 8,  y: 8,  z: 1 },
    // Dente 2: y=10
    { x: 8,  y: 10, z: 0 }, { x: 10, y: 10, z: 0 },
    { x: 8,  y: 10, z: 1 },
    // Dente 3: y=12
    { x: 8,  y: 12, z: 0 }, { x: 10, y: 12, z: 0 },
    { x: 8,  y: 12, z: 1 },
  ],
  waves: [
    {
      waveNumber: 1,
      // ── Onda 1: Cabo + Haste exterior + Dentes base (50 peças) ──
      slots: [
        // Cabo Z=0 completo
        { x: 2, y: 0, z: 0 }, { x: 4, y: 0, z: 0 }, { x: 6, y: 0, z: 0 }, { x: 8, y: 0, z: 0 },
        { x: 2, y: 2, z: 0 }, { x: 4, y: 2, z: 0 }, { x: 6, y: 2, z: 0 }, { x: 8, y: 2, z: 0 },
        { x: 2, y: 4, z: 0 }, { x: 4, y: 4, z: 0 }, { x: 6, y: 4, z: 0 }, { x: 8, y: 4, z: 0 },
        // Cabo Z=1 elevado
        { x: 4, y: 0, z: 1 }, { x: 6, y: 0, z: 1 },
        { x: 4, y: 2, z: 1 }, { x: 6, y: 2, z: 1 },
        { x: 4, y: 4, z: 1 }, { x: 6, y: 4, z: 1 },
        // Cabo Z=2 (buraco)
        { x: 4, y: 2, z: 2 }, { x: 6, y: 2, z: 2 },
        // Haste Z=0
        { x: 4, y: 6,  z: 0 }, { x: 6, y: 6,  z: 0 },
        { x: 4, y: 8,  z: 0 }, { x: 6, y: 8,  z: 0 },
        { x: 4, y: 10, z: 0 }, { x: 6, y: 10, z: 0 },
        { x: 4, y: 12, z: 0 }, { x: 6, y: 12, z: 0 },
        { x: 4, y: 14, z: 0 }, { x: 6, y: 14, z: 0 },
        // Dentes base Z=0
        { x: 8,  y: 8,  z: 0 }, { x: 10, y: 8,  z: 0 },
        { x: 8,  y: 10, z: 0 }, { x: 10, y: 10, z: 0 },
        { x: 8,  y: 12, z: 0 }, { x: 10, y: 12, z: 0 },
        // ── Espelho esquerdo (peças simétricas ao cabo — chave dupla) ──
        { x: 0, y: 0, z: 0 }, { x: 0, y: 2, z: 0 }, { x: 0, y: 4, z: 0 },
        { x: 2, y: 0, z: 1 }, { x: 2, y: 2, z: 1 }, { x: 2, y: 4, z: 1 },
        // Haste Z=1 (espessura)
        { x: 4, y: 6,  z: 1 }, { x: 4, y: 8,  z: 1 },
        { x: 4, y: 10, z: 1 }, { x: 4, y: 12, z: 1 },
        // Dentes Z=1
        { x: 8, y: 8,  z: 1 }, { x: 8, y: 10, z: 1 }, { x: 8, y: 12, z: 1 },
        // Ponta da haste elevada
        { x: 4, y: 14, z: 1 }, { x: 6, y: 14, z: 1 },
      ],
    },
    {
      waveNumber: 2,
      // ── Onda 2: Duplicata do corpo principal — "encaixe da fechadura" (50 peças) ──
      slots: [
        // Cabo Z=0 completo
        { x: 2, y: 0, z: 0 }, { x: 4, y: 0, z: 0 }, { x: 6, y: 0, z: 0 }, { x: 8, y: 0, z: 0 },
        { x: 2, y: 2, z: 0 }, { x: 4, y: 2, z: 0 }, { x: 6, y: 2, z: 0 }, { x: 8, y: 2, z: 0 },
        { x: 2, y: 4, z: 0 }, { x: 4, y: 4, z: 0 }, { x: 6, y: 4, z: 0 }, { x: 8, y: 4, z: 0 },
        // Cabo elevado
        { x: 4, y: 0, z: 1 }, { x: 6, y: 0, z: 1 },
        { x: 4, y: 2, z: 1 }, { x: 6, y: 2, z: 1 },
        { x: 4, y: 4, z: 1 }, { x: 6, y: 4, z: 1 },
        // Topo do cabo
        { x: 4, y: 2, z: 2 }, { x: 6, y: 2, z: 2 },
        // Haste completa
        { x: 4, y: 6,  z: 0 }, { x: 6, y: 6,  z: 0 },
        { x: 4, y: 8,  z: 0 }, { x: 6, y: 8,  z: 0 },
        { x: 4, y: 10, z: 0 }, { x: 6, y: 10, z: 0 },
        { x: 4, y: 12, z: 0 }, { x: 6, y: 12, z: 0 },
        { x: 4, y: 14, z: 0 }, { x: 6, y: 14, z: 0 },
        // Haste espessa
        { x: 4, y: 6,  z: 1 }, { x: 4, y: 8,  z: 1 },
        { x: 4, y: 10, z: 1 }, { x: 4, y: 12, z: 1 },
        // Todos os dentes
        { x: 8,  y: 8,  z: 0 }, { x: 10, y: 8,  z: 0 }, { x: 8, y: 8,  z: 1 },
        { x: 8,  y: 10, z: 0 }, { x: 10, y: 10, z: 0 }, { x: 8, y: 10, z: 1 },
        { x: 8,  y: 12, z: 0 }, { x: 10, y: 12, z: 0 }, { x: 8, y: 12, z: 1 },
        // Espelho esquerdo
        { x: 0, y: 0, z: 0 }, { x: 0, y: 2, z: 0 }, { x: 0, y: 4, z: 0 },
        { x: 2, y: 0, z: 1 }, { x: 2, y: 2, z: 1 }, { x: 2, y: 4, z: 1 },
        // Ponta
        { x: 4, y: 14, z: 1 }, { x: 6, y: 14, z: 1 },
        // Topo da haste (cume Z=3 — par final)
        { x: 4, y: 6, z: 2 }, { x: 6, y: 6, z: 2 },
      ],
    },
  ],
};
