import { AnimalValue, TileBiome } from '../types';
import { TileRegistry } from './tiles';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  MAPEAMENTO OFICIAL DE BIOMAS ELEMENTARES DA NATUREZA
 *  Consumido a partir do TileRegistry (Fonte Única da Verdade)
 * ═══════════════════════════════════════════════════════════════════════════
 */
export const ANIMAL_BIOMES: Record<AnimalValue, TileBiome> = TileRegistry.getAll().reduce(
  (acc, tile) => {
    acc[tile.value] = tile.biome;
    return acc;
  },
  {} as Record<AnimalValue, TileBiome>
);

export function getBiomeForAnimal(animal: AnimalValue): TileBiome {
  return TileRegistry.getBiome(animal);
}

export function isBiomeMatch(a1: AnimalValue, a2: AnimalValue): boolean {
  return TileRegistry.getBiome(a1) === TileRegistry.getBiome(a2);
}
