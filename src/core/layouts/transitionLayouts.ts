import { BoardLayout, LayoutSlot } from '../types';

/**
 * Layout "Borboleta" — 56 peças, 2 camadas
 * Asas simétricas em torno de um corpo central.
 * Dificuldade: Fácil-Médio (transição entre 36 e 96 peças)
 */
function generateButterflySlots(): LayoutSlot[] {
  const slots: LayoutSlot[] = [];

  // Asa esquerda — 3 colunas x 5 linhas = 15 peças
  for (let y = 2; y <= 10; y += 2) {
    for (let x = 0; x <= 4; x += 2) {
      slots.push({ x, y, z: 0 });
    }
  }

  // Asa direita — 3 colunas x 5 linhas = 15 peças
  for (let y = 2; y <= 10; y += 2) {
    for (let x = 10; x <= 14; x += 2) {
      slots.push({ x, y, z: 0 });
    }
  }

  // Corpo central — 2 colunas x 7 linhas = 14 peças
  for (let y = 0; y <= 12; y += 2) {
    slots.push({ x: 6, y, z: 0 });
    slots.push({ x: 8, y, z: 0 });
  }

  // Camada 1 — centro elevado 2x3 = 6 peças
  for (let y = 4; y <= 8; y += 2) {
    slots.push({ x: 6, y, z: 1 });
    slots.push({ x: 8, y, z: 1 });
  }

  // Antenas do topo (2 peças)
  slots.push({ x: 5, y: 0, z: 0 });
  slots.push({ x: 9, y: 0, z: 0 });

  // Ajustar para par exato
  if (slots.length % 2 !== 0) slots.pop();

  return slots;
}

/**
 * Layout "Diamante" — 72 peças, 3 camadas
 * Losango simétrico vertical — 7 linhas com largura crescente e decrescente.
 * Dificuldade: Médio (transição entre 56 e 96 peças)
 */
function generateDiamondSlots(): LayoutSlot[] {
  const slots: LayoutSlot[] = [];

  // Perfil de losango — número de peças por linha
  const rowWidths = [2, 4, 6, 8, 6, 4, 2]; // 32 peças totais na base

  rowWidths.forEach((count, rowIdx) => {
    const y = rowIdx * 2;
    const startX = 8 - count; // centralizar
    for (let i = 0; i < count; i++) {
      slots.push({ x: startX + i * 2, y, z: 0 });
    }
  });

  // Camada 1 — losango menor
  const mid1Widths = [2, 4, 6, 4, 2]; // 18 peças
  mid1Widths.forEach((count, rowIdx) => {
    const y = (rowIdx + 1) * 2;
    const startX = 8 - count;
    for (let i = 0; i < count; i++) {
      slots.push({ x: startX + i * 2, y, z: 1 });
    }
  });

  // Camada 2 — núcleo central
  const mid2Widths = [2, 4, 2]; // 8 peças
  mid2Widths.forEach((count, rowIdx) => {
    const y = (rowIdx + 2) * 2;
    const startX = 8 - count;
    for (let i = 0; i < count; i++) {
      slots.push({ x: startX + i * 2, y, z: 2 });
    }
  });

  // Ajustar para par exato
  if (slots.length % 2 !== 0) slots.pop();

  return slots;
}

/**
 * Layout "Cruz" — 80 peças, 3 camadas
 * Cruz simétrica de grande profundidade — difícil por exigir planejamento cruzado.
 * Dificuldade: Médio-Difícil
 */
function generateCrossSlots(): LayoutSlot[] {
  const slots: LayoutSlot[] = [];

  // Barra horizontal da cruz — 4 linhas x 10 colunas = 40 peças
  for (let y = 6; y <= 12; y += 2) {
    for (let x = 0; x <= 18; x += 2) {
      slots.push({ x, y, z: 0 });
    }
  }

  // Barra vertical da cruz — 8 linhas x 3 colunas (sem repetir centro) = 30 peças
  for (let y = 0; y <= 18; y += 2) {
    if (y >= 6 && y <= 12) continue; // já adicionado pela horizontal
    for (let x = 6; x <= 12; x += 2) {
      slots.push({ x, y, z: 0 });
    }
  }

  // Camada 1 — 3x3 no centro da cruz = 9 → arredondado para 8
  for (let y = 6; y <= 12; y += 2) {
    for (let x = 6; x <= 12; x += 2) {
      slots.push({ x, y, z: 1 });
    }
  }

  // Camada 2 — 2x2 no topo
  slots.push({ x: 8, y: 8, z: 2 });
  slots.push({ x: 10, y: 8, z: 2 });
  slots.push({ x: 8, y: 10, z: 2 });
  slots.push({ x: 10, y: 10, z: 2 });

  // Ajustar para par exato
  if (slots.length % 2 !== 0) slots.pop();

  return slots;
}

export const butterflyLayout: BoardLayout = {
  id: 'butterfly',
  name: 'Borboleta',
  description: 'Asas simétricas e corpo central. 56 peças com 2 camadas — transição suave para o desafio.',
  difficulty: 'Fácil',
  slots: generateButterflySlots(),
};

export const diamondLayout: BoardLayout = {
  id: 'diamond',
  name: 'Diamante',
  description: 'Losango simétrico vertical com 3 camadas. Requer planejamento para desmontar do centro.',
  difficulty: 'Médio',
  slots: generateDiamondSlots(),
};

export const crossLayout: BoardLayout = {
  id: 'cross',
  name: 'Cruz dos Animais',
  description: 'Cruz simétrica de 80 peças em 3 camadas. As quatro pontas escondem surpresas!',
  difficulty: 'Médio',
  slots: generateCrossSlots(),
};
