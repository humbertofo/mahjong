import { BoardLayout } from '../../types';

/**
 * 🀄 Fase 17: Ondas Gêmeas
 * Dificuldade: Médio
 * Total de Peças: 64 (1 Onda — Único Bloco)
 *
 * Layout: Duas ondas de água simétricas dispostas horizontalmente —
 * crista elevada no centro de cada onda com flancos que descem.
 * O jogador desbloqueia das bordas em direção às cristas.
 *
 * Estrutura:
 *   Onda Esquerda: crista em x=2-4, y=4-10, z crescente até z=2
 *   Onda Direita:  crista em x=6-8, y=4-10, z crescente até z=2
 *   Base comum:    x=0-10, y=2-12, z=0
 *
 * Grade mobile: x ∈ {0,2,4,6,8,10}  |  y ∈ {0..14}  |  z ∈ {0..3}
 */
export const level17Layout: BoardLayout = {
  id: 'twin-waves',
  name: 'Ondas Gêmeas',
  description: 'Duas ondas de energia que surgem das profundezas em perfeita harmonia.',
  difficulty: 'Médio',
  slots: [
    // ── Z=0: Base oceânica completa — 6 colunas × 6 linhas ──
    { x: 0, y: 2,  z: 0 }, { x: 2, y: 2,  z: 0 }, { x: 4, y: 2,  z: 0 }, { x: 6, y: 2,  z: 0 }, { x: 8, y: 2,  z: 0 }, { x: 10, y: 2,  z: 0 },
    { x: 0, y: 4,  z: 0 }, { x: 2, y: 4,  z: 0 }, { x: 4, y: 4,  z: 0 }, { x: 6, y: 4,  z: 0 }, { x: 8, y: 4,  z: 0 }, { x: 10, y: 4,  z: 0 },
    { x: 0, y: 6,  z: 0 }, { x: 2, y: 6,  z: 0 }, { x: 4, y: 6,  z: 0 }, { x: 6, y: 6,  z: 0 }, { x: 8, y: 6,  z: 0 }, { x: 10, y: 6,  z: 0 },
    { x: 0, y: 8,  z: 0 }, { x: 2, y: 8,  z: 0 }, { x: 4, y: 8,  z: 0 }, { x: 6, y: 8,  z: 0 }, { x: 8, y: 8,  z: 0 }, { x: 10, y: 8,  z: 0 },
    { x: 0, y: 10, z: 0 }, { x: 2, y: 10, z: 0 }, { x: 4, y: 10, z: 0 }, { x: 6, y: 10, z: 0 }, { x: 8, y: 10, z: 0 }, { x: 10, y: 10, z: 0 },
    { x: 0, y: 12, z: 0 }, { x: 2, y: 12, z: 0 }, { x: 4, y: 12, z: 0 }, { x: 6, y: 12, z: 0 }, { x: 8, y: 12, z: 0 }, { x: 10, y: 12, z: 0 },
    // ── Z=1: Corpo das ondas — colunas internas x=2,4,6,8 ──
    { x: 2, y: 4,  z: 1 }, { x: 4, y: 4,  z: 1 }, { x: 6, y: 4,  z: 1 }, { x: 8, y: 4,  z: 1 },
    { x: 2, y: 6,  z: 1 }, { x: 4, y: 6,  z: 1 }, { x: 6, y: 6,  z: 1 }, { x: 8, y: 6,  z: 1 },
    { x: 2, y: 8,  z: 1 }, { x: 4, y: 8,  z: 1 }, { x: 6, y: 8,  z: 1 }, { x: 8, y: 8,  z: 1 },
    { x: 2, y: 10, z: 1 }, { x: 4, y: 10, z: 1 }, { x: 6, y: 10, z: 1 }, { x: 8, y: 10, z: 1 },
    // ── Z=2: Cristas das ondas — x=2,4 (onda A) e x=6,8 (onda B) ──
    { x: 2, y: 6,  z: 2 }, { x: 4, y: 6,  z: 2 },
    { x: 2, y: 8,  z: 2 }, { x: 4, y: 8,  z: 2 },
    { x: 6, y: 6,  z: 2 }, { x: 8, y: 6,  z: 2 },
    { x: 6, y: 8,  z: 2 }, { x: 8, y: 8,  z: 2 },
    // ── Z=3: Picos das cristas — 4 peças no topo ──
    { x: 4, y: 6,  z: 3 }, { x: 4, y: 8,  z: 3 },
    { x: 6, y: 6,  z: 3 }, { x: 6, y: 8,  z: 3 },
  ],
};
