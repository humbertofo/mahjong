import { BoardLayout, LayoutSlot } from '../types';

/**
 * Layout "Jardim: 36" — compacto para mobile (Galaxy A12)
 * Pirâmide de 6 colunas × 7 linhas com alas laterais curtas
 * Total: 36 peças (18 pares) — cabe em tela com peças grandes e tocáveis
 */
function generateGarden36Slots(): LayoutSlot[] {
  const slots: LayoutSlot[] = [];

  // Topo solitário (z=2, pico da pirâmide)
  slots.push({ x: 5, y: 2, z: 2 });

  // Linha 1 — 2 peças, z=1
  slots.push({ x: 4, y: 4, z: 1 });
  slots.push({ x: 6, y: 4, z: 1 });

  // Linha 2 — 4 peças base (z=0) + 1 central elevada (z=1)
  for (let x = 2; x <= 8; x += 2) slots.push({ x, y: 6, z: 0 });
  slots.push({ x: 5, y: 6, z: 1 });

  // Linha 3 — 5 peças (corpo principal)
  for (let x = 1; x <= 9; x += 2) slots.push({ x, y: 8, z: 0 });

  // Linha 4 — 5 peças
  for (let x = 1; x <= 9; x += 2) slots.push({ x, y: 10, z: 0 });

  // Linha 5 — 4 peças (começa afunilamento)
  for (let x = 2; x <= 8; x += 2) slots.push({ x, y: 12, z: 0 });

  // Linha 6 — 3 peças (base)
  for (let x = 3; x <= 7; x += 2) slots.push({ x, y: 14, z: 0 });

  // Linha 7 — 2 peças (ponta inferior)
  slots.push({ x: 4, y: 16, z: 0 });
  slots.push({ x: 6, y: 16, z: 0 });

  // Ponto base solitário
  slots.push({ x: 5, y: 18, z: 0 });

  return slots;
}

export const garden36Layout: BoardLayout = {
  id: 'garden-36',
  name: 'Jardim dos Animais (Tutorial)',
  description: 'Aprenda as regras com 30 peças em pirâmide compacta. Perfeito para começar!',
  difficulty: 'Fácil',
  slots: generateGarden36Slots(),
};
