import { BoardLayout, LayoutSlot } from '../types';

/**
 * Tartaruga Vertical (Especialmente adaptada para telas verticais 20:9 e 16:9)
 * 144 peças em 5 camadas (z=0 a z=4)
 * Colunas estreitas (x=0 a 16) e altura alongada (y=0 a 30) para maximizar o tamanho das peças no celular.
 */
function generateVerticalTurtleSlots(): LayoutSlot[] {
  const slots: LayoutSlot[] = [];

  // === Camada 0 (Nível Base - 87 peças) ===
  // Coluna 0 (x=0)
  for (let y = 2; y <= 24; y += 2) {
    slots.push({ x: 0, y, z: 0 }); // 12 peças
  }
  // Coluna 1 (x=2)
  for (let y = 6; y <= 20; y += 2) {
    slots.push({ x: 2, y, z: 0 }); // 8 peças
  }
  // Coluna 2 (x=4)
  for (let y = 4; y <= 22; y += 2) {
    slots.push({ x: 4, y, z: 0 }); // 10 peças
  }
  // Coluna 3 (x=6)
  for (let y = 2; y <= 24; y += 2) {
    slots.push({ x: 6, y, z: 0 }); // 12 peças
  }

  // Asas / Extensões no eixo central (em x=7)
  slots.push({ x: 7, y: 0, z: 0 });  // Topo da asa
  slots.push({ x: 7, y: 26, z: 0 }); // Base da asa 1
  slots.push({ x: 7, y: 28, z: 0 }); // Base da asa 2

  // Coluna 4 (x=8)
  for (let y = 2; y <= 24; y += 2) {
    slots.push({ x: 8, y, z: 0 }); // 12 peças
  }
  // Coluna 5 (x=10)
  for (let y = 4; y <= 22; y += 2) {
    slots.push({ x: 10, y, z: 0 }); // 10 peças
  }
  // Coluna 6 (x=12)
  for (let y = 6; y <= 20; y += 2) {
    slots.push({ x: 12, y, z: 0 }); // 8 peças
  }
  // Coluna 7 (x=14)
  for (let y = 2; y <= 24; y += 2) {
    slots.push({ x: 14, y, z: 0 }); // 12 peças
  }
  // Subtotal Nível 0 = 12 + 8 + 10 + 12 + 3 + 12 + 10 + 8 + 12 = 87 peças.

  // === Camada 1 (Nível 1 - 36 peças: grade 6x6 alongada) ===
  for (let x = 2; x <= 12; x += 2) {
    for (let y = 8; y <= 18; y += 2) {
      slots.push({ x, y, z: 1 }); // 6 x 6 = 36 peças
    }
  }

  // === Camada 2 (Nível 2 - 16 peças: grade 4x4) ===
  for (let x = 4; x <= 10; x += 2) {
    for (let y = 10; y <= 16; y += 2) {
      slots.push({ x, y, z: 2 }); // 4 x 4 = 16 peças
    }
  }

  // === Camada 3 (Nível 3 - 4 peças: grade 2x2) ===
  for (let x = 6; x <= 8; x += 2) {
    for (let y = 12; y <= 14; y += 2) {
      slots.push({ x, y, z: 3 }); // 2 x 2 = 4 peças
    }
  }

  // === Camada 4 (Nível 4 - Topo / Coroa Central - 1 peça) ===
  slots.push({ x: 7, y: 13, z: 4 }); // 1 peça

  // Total Geral: 87 + 36 + 16 + 4 + 1 = 144 peças
  return slots;
}

export const verticalTurtleLayout: BoardLayout = {
  id: 'vertical-turtle',
  name: 'Tartaruga Vertical (Celular)',
  description: 'Projetada sob medida para telas verticais 20:9, com peças ampliadas de máxima legibilidade.',
  difficulty: 'Médio',
  slots: generateVerticalTurtleSlots(),
};
