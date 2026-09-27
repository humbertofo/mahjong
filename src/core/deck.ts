import { TileDefinition, AnimalValue } from './types';
import { SynergyRegistry } from './nature/synergies/SynergyRegistry';
import { TileRegistry } from './nature/tiles';

export interface AnimalDeckItem {
  val: AnimalValue;
  label: string;
}

/**
 * Catálogo derivado do TileRegistry para manter retrocompatibilidade pública
 */
export const ANIMALS: AnimalDeckItem[] = TileRegistry.getAll().map((t) => ({
  val: t.value,
  label: t.label,
}));

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  FÁBRICA DE BARALHO (DECK FACTORY)
 *  Orquestra a criação do monte de peças com multiplicidade garantida
 * ═══════════════════════════════════════════════════════════════════════════
 */
export function createAnimalDeck(includeChameleon: boolean = false): TileDefinition[] {
  const deck: TileDefinition[] = [];
  const tiles = includeChameleon
    ? TileRegistry.getAll()
    : TileRegistry.getAll().filter((t) => t.value !== 'chameleon');

  tiles.forEach(({ value, label, category }) => {
    const suit =
      category === 'flora'
        ? 'flora'
        : category === 'mythic'
        ? 'mythic'
        : category === 'natural_element'
        ? 'element'
        : 'animal';

    // 4 cópias de cada tipo para garantir multiplicidade de pares
    for (let copy = 0; copy < 4; copy++) {
      deck.push({
        id: `animal-${value}-${copy}`,
        suit,
        value,
        label,
      });
    }
  });

  return deck;
}

/**
 * Regra mestra de combinação entre duas peças:
 * 1. O Camaleão Dourado (Coringa) combina com QUALQUER outra peça.
 * 2. Peças idênticas (mesmo valor) combinam.
 * 3. Sinergias da Natureza avaliadas declarativamente pelo SynergyRegistry.
 */
export function canMatch(tileA: TileDefinition, tileB: TileDefinition): boolean {
  if (tileA.id === tileB.id) return false;

  const vA = tileA.value;
  const vB = tileB.value;

  // 1. Coringa
  if (vA === 'chameleon' || vB === 'chameleon') return true;

  // 2. Mesma espécie / valor
  if (vA === vB) return true;

  // 3. Sinergias da Natureza
  return SynergyRegistry.areSynergistic(vA, vB);
}
