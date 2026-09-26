import { BoardLayout, LayoutSlot } from '../types';

/**
 * Layout do print do usuário ("Sabedoria: 51 / 65")
 * Pirâmide invertida em V com orelhas superiores e afunilamento até a ponta (peça 1).
 * Totalmente vertical, proporção 20:9 para Samsung Galaxy A12.
 */
function generateWisdomHeartSlots(): LayoutSlot[] {
  const slots: LayoutSlot[] = [];

  // === Camada 0 (Base do Tabuleiro - 28 posições) ===
  // As duas orelhas do topo (y=2)
  slots.push({ x: 2, y: 2, z: 0 }); // Orelha esquerda
  slots.push({ x: 10, y: 2, z: 0 }); // Orelha direita

  // Linha 1 (y=4)
  for (let x = 3; x <= 9; x += 2) {
    slots.push({ x, y: 4, z: 0 }); // 4 peças
  }

  // Linha 2 (y=6)
  for (let x = 2; x <= 10; x += 2) {
    slots.push({ x, y: 6, z: 0 }); // 5 peças
  }

  // Linha 3 (y=8)
  for (let x = 3; x <= 9; x += 2) {
    slots.push({ x, y: 8, z: 0 }); // 4 peças
  }

  // Linha 4 (y=10)
  for (let x = 3; x <= 9; x += 2) {
    slots.push({ x, y: 10, z: 0 }); // 4 peças
  }

  // Linha 5 (y=12)
  for (let x = 4; x <= 8; x += 2) {
    slots.push({ x, y: 12, z: 0 }); // 3 peças
  }

  // Linha 6 (y=14)
  for (let x = 5; x <= 7; x += 2) {
    slots.push({ x, y: 14, z: 0 }); // 2 peças
  }

  // Linha 7 (Ponta inferior - y=16)
  slots.push({ x: 6, y: 16, z: 0 }); // 1 peça (a peça 1 da ponta)

  // === Camada 1 (Nível Elevado 1 - 14 posições sobrepostas) ===
  // Orelhas nível 1
  slots.push({ x: 2, y: 2, z: 1 });
  slots.push({ x: 10, y: 2, z: 1 });

  // Centro elevado em z=1
  for (let x = 4; x <= 8; x += 2) {
    slots.push({ x, y: 5, z: 1 });
    slots.push({ x, y: 7, z: 1 });
    slots.push({ x, y: 9, z: 1 });
  }
  slots.push({ x: 5, y: 11, z: 1 });
  slots.push({ x: 7, y: 11, z: 1 });
  slots.push({ x: 6, y: 13, z: 1 });

  // === Camada 2 (Nível Elevado 2 - Topo - 6 posições) ===
  slots.push({ x: 6, y: 6, z: 2 });
  slots.push({ x: 6, y: 8, z: 2 });
  slots.push({ x: 6, y: 10, z: 2 });
  slots.push({ x: 6, y: 12, z: 2 });
  slots.push({ x: 2, y: 2, z: 2 });
  slots.push({ x: 10, y: 2, z: 2 });

  // Ajusta total para número par exato para fechar pares perfeitos
  if (slots.length % 2 !== 0) {
    slots.pop();
  }

  return slots;
}

export const wisdomHeartLayout: BoardLayout = {
  id: 'wisdom-heart',
  name: 'Coração de Sabedoria',
  description: 'Pirâmide em V com orelhas superiores e afunilamento. ~48 peças, 3 camadas.',
  difficulty: 'Fácil',
  slots: generateWisdomHeartSlots(),
};
