import { BoardLayout, LayoutSlot } from '../types';

/**
 * Layout Pagode Imperial Vertical (144 peças)
 * Arquitetura em camadas com base larga e topo afunilado para telas altas 20:9
 */
function generatePagodaSlots(): LayoutSlot[] {
  const slots: LayoutSlot[] = [];

  // Camada 0: Base da torre (8 colunas x 12 linhas = 76 peças com recortes)
  for (let y = 2; y <= 24; y += 2) {
    for (let x = 2; x <= 14; x += 2) {
      // Deixar cantos ligeiramente recortados para estética de templo
      if ((y === 2 || y === 24) && (x === 2 || x === 14)) continue;
      slots.push({ x, y, z: 0 }); // 80 - 4 = 76 peças
    }
  }

  // Camada 1: Andar intermediário (6 colunas x 8 linhas = 48 peças)
  for (let y = 6; y <= 20; y += 2) {
    for (let x = 4; x <= 12; x += 2) {
      slots.push({ x, y, z: 1 }); // 8 * 5 = 40 peças
    }
  }

  // Camada 2: Sacada superior (4 colunas x 5 linhas = 20 peças)
  for (let y = 10; y <= 18; y += 2) {
    for (let x = 6; x <= 10; x += 2) {
      slots.push({ x, y, z: 2 }); // 5 * 3 = 15 peças
    }
  }

  // Camada 3: Cúpula da torre (2 colunas x 4 linhas = 8 peças)
  for (let y = 12; y <= 18; y += 2) {
    for (let x = 7; x <= 9; x += 2) {
      slots.push({ x, y, z: 3 });
    }
  }

  // Camada 4: Pináculo central (1 peça no topo)
  slots.push({ x: 8, y: 15, z: 4 });

  // Ajustar para exatamente 144 peças
  while (slots.length > 144) {
    slots.pop();
  }
  while (slots.length < 144) {
    slots.push({ x: 8, y: 26, z: 0 });
  }

  return slots;
}

export const verticalPagodaLayout: BoardLayout = {
  id: 'vertical-pagoda',
  name: 'Pagode Imperial Vertical',
  description: 'Templo oriental clássico com 5 andares, preenchendo a tela vertical com elegância.',
  difficulty: 'Médio',
  slots: generatePagodaSlots(),
};
