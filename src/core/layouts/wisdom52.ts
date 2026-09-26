import { BoardLayout, LayoutSlot } from '../types';

/**
 * Layout "Sabedoria: 52" do screenshot oficial:
 * Estrutura vertical imponente: 8 colunas de largura, 15 fileiras verticais,
 * colunas laterais completas com 12 peças, topo e ponta afunilados,
 * platô elevado Z=1 no centro e coroa Z=2 no cume com o Pássaro Dourado.
 * Total: 96 peças (48 pares matemáticos).
 */
function generateWisdom52Slots(): LayoutSlot[] {
  const slots: LayoutSlot[] = [];

  // Linha 0 (y = 0): Topo solitário (Elefante Azul do cume)
  slots.push({ x: 7, y: 0, z: 0 });

  // Linha 1 (y = 2): Asa esquerda, 2 peças centrais e asa direita
  slots.push({ x: 0, y: 2, z: 0 }); // Número 2 verde
  slots.push({ x: 6, y: 2, z: 0 }); // 4 Bambus
  slots.push({ x: 8, y: 2, z: 0 }); // Romã Vermelha
  slots.push({ x: 14, y: 2, z: 0 }); // Tucano Vermelho

  // Linha 2 (y = 4): Asa esquerda, 4 peças intermediárias e asa direita
  slots.push({ x: 0, y: 4, z: 0 }); // Número 6 azul
  slots.push({ x: 4, y: 4, z: 0 }); // 1 Bambu
  slots.push({ x: 6, y: 4, z: 0 }); // Tucano
  slots.push({ x: 8, y: 4, z: 0 }); // Número 6
  slots.push({ x: 10, y: 4, z: 0 }); // 2 Bambus
  slots.push({ x: 14, y: 4, z: 0 }); // 5 Círculos

  // Linhas 3 a 10 (y = 6 a 20): Corpo maciço de 8 colunas cheias (8 x 8 = 64 peças)
  for (let y = 6; y <= 20; y += 2) {
    for (let x = 0; x <= 14; x += 2) {
      slots.push({ x, y, z: 0 });
    }
  }

  // Linha 11 (y = 22): Afunilamento inferior com asas laterais
  slots.push({ x: 0, y: 22, z: 0 }); // 6 Círculos
  slots.push({ x: 4, y: 22, z: 0 }); // Guarda-chuva roxo
  slots.push({ x: 6, y: 22, z: 0 }); // Coelho azul
  slots.push({ x: 8, y: 22, z: 0 }); // Número 3 vermelho
  slots.push({ x: 10, y: 22, z: 0 }); // Número 1 azul
  slots.push({ x: 14, y: 22, z: 0 }); // Moldura branca/vermelha

  // Linha 12 (y = 24): Base das asas laterais e centro
  slots.push({ x: 0, y: 24, z: 0 }); // Moldura
  slots.push({ x: 6, y: 24, z: 0 }); // Elefante azul
  slots.push({ x: 8, y: 24, z: 0 }); // Número 6 azul
  slots.push({ x: 14, y: 24, z: 0 }); // Número 2 verde

  // Linhas 13 e 14 (y = 26 e 28): Ponta inferior solitária
  slots.push({ x: 7, y: 26, z: 0 }); // 4 Círculos
  slots.push({ x: 7, y: 28, z: 0 }); // Número 9 vermelho final

  // Camada Elevada 1 (z = 1): Platô central sobreposto (4 linhas x 2 colunas = 8 peças)
  for (let y = 10; y <= 16; y += 2) {
    slots.push({ x: 6, y, z: 1 });
    slots.push({ x: 8, y, z: 1 });
  }

  // Camada Elevada 2 (z = 2): Peça de topo no zênite (Pássaro Dourado do print)
  slots.push({ x: 7, y: 13, z: 2 });

  return slots;
}

export const wisdom52Layout: BoardLayout = {
  id: 'wisdom-52',
  name: 'Sabedoria 52 (Torre e Pilares)',
  description: 'O layout idêntico ao print Sabedoria: 52 com 96 peças, colunas laterais e platô central em relevo.',
  difficulty: 'Médio',
  slots: generateWisdom52Slots(),
};
