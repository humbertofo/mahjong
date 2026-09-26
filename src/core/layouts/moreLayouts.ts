import { BoardLayout, LayoutSlot } from '../types';

/**
 * Layout Pirâmide de 144 peças
 * Camadas concêntricas subindo uniformemente
 */
function generatePyramidSlots(): LayoutSlot[] {
  const slots: LayoutSlot[] = [];

  // Camada 0: Base 10x8 menos cantos = 72 peças
  for (let y = 0; y <= 14; y += 2) {
    for (let x = 4; x <= 22; x += 2) {
      if ((x === 4 || x === 22) && (y === 0 || y === 14)) continue;
      slots.push({ x, y, z: 0 }); // 76 peças
    }
  }

  // Camada 1: Nível 1 - 8x6 = 40 peças
  for (let y = 2; y <= 12; y += 2) {
    for (let x = 6; x <= 20; x += 2) {
      slots.push({ x, y, z: 1 }); // 8 * 6 = 48 peças
    }
  }

  // Camada 2: Nível 2 - 4x4 = 16 peças
  for (let y = 4; y <= 10; y += 2) {
    for (let x = 10; x <= 16; x += 2) {
      slots.push({ x, y, z: 2 }); // 16 peças
    }
  }

  // Camada 3: Topo 2x2 = 4 peças
  for (let y = 6; y <= 8; y += 2) {
    for (let x = 12; x <= 14; x += 2) {
      slots.push({ x, y, z: 3 }); // 4 peças
    }
  }

  // Ajusta para ter exatamente 144 peças se necessário
  while (slots.length > 144) {
    slots.pop();
  }
  return slots;
}

/**
 * Layout Mini Zen Vertical (36 peças) - Partidas rápidas e relaxantes
 */
function generateMiniZenSlots(): LayoutSlot[] {
  const slots: LayoutSlot[] = [];

  // Camada 0: 4 colunas x 6 linhas = 24 peças
  for (let y = 2; y <= 12; y += 2) {
    for (let x = 4; x <= 10; x += 2) {
      slots.push({ x, y, z: 0 });
    }
  }

  // Camada 1: 2 colunas x 4 linhas = 8 peças
  for (let y = 4; y <= 10; y += 2) {
    for (let x = 6; x <= 8; x += 2) {
      slots.push({ x, y, z: 1 });
    }
  }

  // Camada 2: 2 colunas x 2 linhas = 4 peças no topo
  for (let y = 6; y <= 8; y += 2) {
    for (let x = 6; x <= 8; x += 2) {
      slots.push({ x, y, z: 2 });
    }
  }

  // Total: 24 + 8 + 4 = 36 peças
  return slots;
}

/**
 * Layout Fortaleza (Fortress - 144 peças)
 * 4 torres defensivas e um pátio central
 */
function generateFortressSlots(): LayoutSlot[] {
  const slots: LayoutSlot[] = [];

  // Base 12x8 com pátio aberto
  for (let y = 0; y <= 14; y += 2) {
    for (let x = 2; x <= 24; x += 2) {
      // Deixar centro mais aberto
      if (x >= 10 && x <= 16 && y >= 4 && y <= 10) continue;
      slots.push({ x, y, z: 0 });
    }
  }

  // Quatro torres nos cantos (nível 1, 2, 3)
  const towers = [
    { xMin: 2, xMax: 6, yMin: 0, yMax: 4 },
    { xMin: 20, xMax: 24, yMin: 0, yMax: 4 },
    { xMin: 2, xMax: 6, yMin: 10, yMax: 14 },
    { xMin: 20, xMax: 24, yMin: 10, yMax: 14 },
  ];

  for (const t of towers) {
    for (let y = t.yMin; y <= t.yMax; y += 2) {
      for (let x = t.xMin; x <= t.xMax; x += 2) {
        slots.push({ x, y, z: 1 });
      }
    }
  }

  // Centro elevado em z=1 e z=2
  for (let y = 6; y <= 8; y += 2) {
    for (let x = 12; x <= 14; x += 2) {
      slots.push({ x, y, z: 1 });
      slots.push({ x, y, z: 2 });
    }
  }

  // Ajustar para exatamente 144 peças
  while (slots.length > 144) {
    slots.pop();
  }
  return slots;
}

export const pyramidLayout: BoardLayout = {
  id: 'pyramid',
  name: 'Pirâmide Imperial',
  description: 'Camadas concêntricas com 144 peças em 4 níveis. Alta visibilidade, estratégia crescente.',
  difficulty: 'Médio',
  slots: generatePyramidSlots(),
};

export const fortressLayout: BoardLayout = {
  id: 'fortress',
  name: 'Fortaleza Proibida',
  description: 'Muralhas imponentes e 4 bastiões com 144 peças. O maior desafio do jogo!',
  difficulty: 'Difícil',
  slots: generateFortressSlots(),
};

export const miniZenLayout: BoardLayout = {
  id: 'mini-zen',
  name: 'Jardim Zen (Rápido)',
  description: 'Partida curta com 36 peças, perfeita para uma pausa relaxante de 3 minutos.',
  difficulty: 'Fácil',
  slots: generateMiniZenSlots(),
};
