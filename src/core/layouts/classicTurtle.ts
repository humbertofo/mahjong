import { BoardLayout, LayoutSlot } from '../types';

/**
 * Layout Clássico Tartaruga (Turtle / Shanghai)
 * Total exato de 144 peças distribuídas em 5 camadas (z=0 a z=4)
 */
function generateTurtleSlots(): LayoutSlot[] {
  const slots: LayoutSlot[] = [];

  // === Camada 0 (Nível Base - 87 peças) ===
  // Linha 0 (y=0)
  for (let x = 2; x <= 24; x += 2) {
    slots.push({ x, y: 0, z: 0 }); // 12 peças
  }
  // Linha 1 (y=2)
  for (let x = 6; x <= 20; x += 2) {
    slots.push({ x, y: 2, z: 0 }); // 8 peças
  }
  // Linha 2 (y=4)
  for (let x = 4; x <= 22; x += 2) {
    slots.push({ x, y: 4, z: 0 }); // 10 peças
  }
  // Linha 3 (y=6)
  for (let x = 2; x <= 24; x += 2) {
    slots.push({ x, y: 6, z: 0 }); // 12 peças
  }
  // Asas / Extensões laterais em y=7 (meia-altura)
  slots.push({ x: 0, y: 7, z: 0 }); // Extensão esquerda
  slots.push({ x: 26, y: 7, z: 0 }); // Extensão direita 1
  slots.push({ x: 28, y: 7, z: 0 }); // Extensão direita 2 (ponta da asa)

  // Linha 4 (y=8)
  for (let x = 2; x <= 24; x += 2) {
    slots.push({ x, y: 8, z: 0 }); // 12 peças
  }
  // Linha 5 (y=10)
  for (let x = 4; x <= 22; x += 2) {
    slots.push({ x, y: 10, z: 0 }); // 10 peças
  }
  // Linha 6 (y=12)
  for (let x = 6; x <= 20; x += 2) {
    slots.push({ x, y: 12, z: 0 }); // 8 peças
  }
  // Linha 7 (y=14)
  for (let x = 2; x <= 24; x += 2) {
    slots.push({ x, y: 14, z: 0 }); // 12 peças
  }
  // Total Nível 0: 12 + 8 + 10 + 12 + 3 + 12 + 10 + 8 + 12 = 87 peças.

  // === Camada 1 (Nível 1 - 36 peças: grade 6x6) ===
  for (let y = 2; y <= 12; y += 2) {
    for (let x = 8; x <= 18; x += 2) {
      slots.push({ x, y, z: 1 }); // 6 x 6 = 36 peças
    }
  }

  // === Camada 2 (Nível 2 - 16 peças: grade 4x4) ===
  for (let y = 4; y <= 10; y += 2) {
    for (let x = 10; x <= 16; x += 2) {
      slots.push({ x, y, z: 2 }); // 4 x 4 = 16 peças
    }
  }

  // === Camada 3 (Nível 3 - 4 peças: grade 2x2) ===
  for (let y = 6; y <= 8; y += 2) {
    for (let x = 12; x <= 14; x += 2) {
      slots.push({ x, y, z: 3 }); // 2 x 2 = 4 peças
    }
  }

  // === Camada 4 (Nível 4 - Topo / Coroa central - 1 peça) ===
  slots.push({ x: 13, y: 7, z: 4 }); // 1 peça

  // Total geral: 87 + 36 + 16 + 4 + 1 = 144 peças
  return slots;
}

export const classicTurtleLayout: BoardLayout = {
  id: 'classic-turtle',
  name: 'Tartaruga Clássica',
  description: 'O layout mais famoso e tradicional do Mahjong Solitaire em 5 camadas.',
  difficulty: 'Médio',
  slots: generateTurtleSlots(),
};
