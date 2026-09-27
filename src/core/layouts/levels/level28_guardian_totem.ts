import { BoardLayout } from '../../types';

/**
 * 🀄 Fase 28: Totem dos Guardiões
 * Dificuldade: Médio
 * Total de Peças: 72 (2 Ondas Artesanais)
 *
 * Layout: Torre xamã em forma de totem — base larga com sentinelas nos flancos,
 * corpo alto que se afunila até um topo duplo erguido.
 *
 * Onda 1 — Corpo do Totem (36 peças):
 *   Z0: muralha perimetral de 4 colunas x 8 linhas (x 2-8, y 0-14)  = 28 peças
 *   Z0: sentinelas laterais (x=0 e x=10, y 6-8)                     =  4 peças
 *   Z1: faixas internas nos flancos (x 2 e x 8, y 4-10)             =  8 peças → 4 por coluna = 8 total... → ajuste abaixo
 *
 * Onda 2 — Topo do Totem (36 peças):
 *   Z0: base retangular central 4x6 (x 2-8, y 4-10)                 = 12 peças (excluindo cantos do meio)
 *   Z0: base exterior completa (x 0-10, y 6-8)                      =  4 peças extras
 *   Z1: anel 3×3 interno (x 2-8, y 6-8)                             =  6 peças
 *   Z2: coroa 2×2 (x 4-6, y 6-8)                                    =  4 peças
 *   Z3: par de topo (x 4-6, y 6)                                     =  2 peças
 *   ... complemento para 36 peças com eixo base
 *
 * Grade mobile: x ∈ {0,2,4,6,8,10}  |  y ∈ {0..14}  |  z ∈ {0..3}
 */
export const level28Layout: BoardLayout = {
  id: 'guardian-totem',
  name: 'Totem dos Guardiões',
  description: 'Escultura xamã erguida pelos antigos protetores da floresta sagrada.',
  difficulty: 'Médio',
  slots: [
    // ── Z=0: Muralha do corpo — 4 colunas x 8 linhas (x:2-8, y:0-14) ──
    { x: 2,  y: 0,  z: 0 }, { x: 4,  y: 0,  z: 0 }, { x: 6,  y: 0,  z: 0 }, { x: 8,  y: 0,  z: 0 },
    { x: 2,  y: 2,  z: 0 }, { x: 4,  y: 2,  z: 0 }, { x: 6,  y: 2,  z: 0 }, { x: 8,  y: 2,  z: 0 },
    { x: 2,  y: 4,  z: 0 }, { x: 4,  y: 4,  z: 0 }, { x: 6,  y: 4,  z: 0 }, { x: 8,  y: 4,  z: 0 },
    { x: 2,  y: 6,  z: 0 }, { x: 4,  y: 6,  z: 0 }, { x: 6,  y: 6,  z: 0 }, { x: 8,  y: 6,  z: 0 },
    { x: 2,  y: 8,  z: 0 }, { x: 4,  y: 8,  z: 0 }, { x: 6,  y: 8,  z: 0 }, { x: 8,  y: 8,  z: 0 },
    { x: 2,  y: 10, z: 0 }, { x: 4,  y: 10, z: 0 }, { x: 6,  y: 10, z: 0 }, { x: 8,  y: 10, z: 0 },
    { x: 2,  y: 12, z: 0 }, { x: 4,  y: 12, z: 0 }, { x: 6,  y: 12, z: 0 }, { x: 8,  y: 12, z: 0 },
    { x: 2,  y: 14, z: 0 }, { x: 4,  y: 14, z: 0 }, { x: 6,  y: 14, z: 0 }, { x: 8,  y: 14, z: 0 },
    // ── Z=0: Sentinelas laterais (flancos do totem) ──
    { x: 0,  y: 6,  z: 0 }, { x: 0,  y: 8,  z: 0 },
    { x: 10, y: 6,  z: 0 }, { x: 10, y: 8,  z: 0 },
  ],
  waves: [
    {
      waveNumber: 1,
      // ── Onda 1: Flancos e muralha exterior (36 peças) ──
      slots: [
        // Z=0: colunas externas do totem (x=2 e x=8, todas as linhas)
        { x: 2,  y: 0,  z: 0 }, { x: 8,  y: 0,  z: 0 },
        { x: 2,  y: 2,  z: 0 }, { x: 8,  y: 2,  z: 0 },
        { x: 2,  y: 4,  z: 0 }, { x: 8,  y: 4,  z: 0 },
        { x: 2,  y: 6,  z: 0 }, { x: 8,  y: 6,  z: 0 },
        { x: 2,  y: 8,  z: 0 }, { x: 8,  y: 8,  z: 0 },
        { x: 2,  y: 10, z: 0 }, { x: 8,  y: 10, z: 0 },
        { x: 2,  y: 12, z: 0 }, { x: 8,  y: 12, z: 0 },
        { x: 2,  y: 14, z: 0 }, { x: 8,  y: 14, z: 0 },
        // Z=0: barra horizontal superior e inferior (x=4,6)
        { x: 4,  y: 0,  z: 0 }, { x: 6,  y: 0,  z: 0 },
        { x: 4,  y: 14, z: 0 }, { x: 6,  y: 14, z: 0 },
        // Z=0: sentinelas laterais
        { x: 0,  y: 6,  z: 0 }, { x: 0,  y: 8,  z: 0 },
        { x: 10, y: 6,  z: 0 }, { x: 10, y: 8,  z: 0 },
        // Z=1: faixas nos flancos elevados (corpo do totem sobe)
        { x: 2,  y: 4,  z: 1 }, { x: 8,  y: 4,  z: 1 },
        { x: 2,  y: 6,  z: 1 }, { x: 8,  y: 6,  z: 1 },
        { x: 2,  y: 8,  z: 1 }, { x: 8,  y: 8,  z: 1 },
        { x: 2,  y: 10, z: 1 }, { x: 8,  y: 10, z: 1 },
        // Z=2: picos dos flancos
        { x: 2,  y: 6,  z: 2 }, { x: 8,  y: 6,  z: 2 },
        { x: 2,  y: 8,  z: 2 }, { x: 8,  y: 8,  z: 2 },
      ],
    },
    {
      waveNumber: 2,
      // ── Onda 2: Núcleo central elevado — coroa do totem (36 peças) ──
      slots: [
        // Z=0: preenchimento interior do corpo
        { x: 4,  y: 2,  z: 0 }, { x: 6,  y: 2,  z: 0 },
        { x: 4,  y: 4,  z: 0 }, { x: 6,  y: 4,  z: 0 },
        { x: 4,  y: 6,  z: 0 }, { x: 6,  y: 6,  z: 0 },
        { x: 4,  y: 8,  z: 0 }, { x: 6,  y: 8,  z: 0 },
        { x: 4,  y: 10, z: 0 }, { x: 6,  y: 10, z: 0 },
        { x: 4,  y: 12, z: 0 }, { x: 6,  y: 12, z: 0 },
        // Z=1: anel interno do núcleo
        { x: 4,  y: 4,  z: 1 }, { x: 6,  y: 4,  z: 1 },
        { x: 4,  y: 6,  z: 1 }, { x: 6,  y: 6,  z: 1 },
        { x: 4,  y: 8,  z: 1 }, { x: 6,  y: 8,  z: 1 },
        { x: 4,  y: 10, z: 1 }, { x: 6,  y: 10, z: 1 },
        // Z=1: cruzes internas (espessura de núcleo)
        { x: 4,  y: 2,  z: 1 }, { x: 6,  y: 2,  z: 1 },
        { x: 4,  y: 12, z: 1 }, { x: 6,  y: 12, z: 1 },
        // Z=2: coroa — 4 losango central
        { x: 4,  y: 6,  z: 2 }, { x: 6,  y: 6,  z: 2 },
        { x: 4,  y: 8,  z: 2 }, { x: 6,  y: 8,  z: 2 },
        // Z=2: ombros adicionais
        { x: 4,  y: 4,  z: 2 }, { x: 6,  y: 4,  z: 2 },
        { x: 4,  y: 10, z: 2 }, { x: 6,  y: 10, z: 2 },
        // Z=3: topo do totem — 2 peças do par final da onda
        { x: 4,  y: 6,  z: 3 }, { x: 6,  y: 6,  z: 3 },
        { x: 4,  y: 8,  z: 3 }, { x: 6,  y: 8,  z: 3 },
      ],
    },
  ],
};
