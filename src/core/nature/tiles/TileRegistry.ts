import { AnimalValue, TileBiome } from '../../types';
import { TileEntityConfig, TilePalette, TileAudioTimbre } from './TileTypes';
import { TILE_CATALOG } from './tileCatalog';
import { getAnimalTier } from './tileTiers';

const REGISTRY_MAP = new Map<AnimalValue, TileEntityConfig>();
const BIOME_MAP = new Map<TileBiome, TileEntityConfig[]>();

// Inicialização única indexada em memória O(1)
TILE_CATALOG.forEach((tile) => {
  tile.tier = getAnimalTier(tile.value);
  REGISTRY_MAP.set(tile.value, tile);
  const biomeList = BIOME_MAP.get(tile.biome) || [];
  biomeList.push(tile);
  BIOME_MAP.set(tile.biome, biomeList);
});

const DEFAULT_TILE: TileEntityConfig = TILE_CATALOG[0];

export class TileRegistry {
  public static get(value: AnimalValue): TileEntityConfig {
    return REGISTRY_MAP.get(value) || DEFAULT_TILE;
  }

  public static getAll(): readonly TileEntityConfig[] {
    return TILE_CATALOG;
  }

  public static getByBiome(biome: TileBiome): readonly TileEntityConfig[] {
    return BIOME_MAP.get(biome) || [];
  }

  public static getTier(value: AnimalValue): number {
    return getAnimalTier(value);
  }

  public static getByMaxTier(maxTier: number): readonly TileEntityConfig[] {
    return TILE_CATALOG.filter((t) => getAnimalTier(t.value) <= maxTier);
  }

  public static getPalette(value: AnimalValue): TilePalette {
    return this.get(value).palette;
  }

  public static getEmoji(value: AnimalValue): string {
    return this.get(value).emoji;
  }

  public static getLabel(value: AnimalValue): string {
    return this.get(value).label;
  }

  public static getHelperIndex(value: AnimalValue): string {
    return this.get(value).helperIndex;
  }

  public static getBiome(value: AnimalValue): TileBiome {
    return this.get(value).biome;
  }

  public static getVfx(value: AnimalValue) {
    return this.get(value).vfx;
  }

  public static getAudioTimbre(value: AnimalValue): TileAudioTimbre {
    return this.get(value).audio?.timbre || 'zen';
  }

  public static getSynergiesWith(value: AnimalValue): readonly AnimalValue[] {
    return this.get(value).synergiesWith;
  }

  public static getCategory(value: AnimalValue) {
    return this.get(value).category;
  }

  public static getSynergyTitle(value: AnimalValue): string | undefined {
    return this.get(value).synergyTitle;
  }

  public static getDietOrRole(value: AnimalValue): string | undefined {
    return this.get(value).dietOrRole;
  }

  public static areSynergistic(v1: AnimalValue, v2: AnimalValue): boolean {
    if (v1 === v2) return false;
    const tile1 = this.get(v1);
    const tile2 = this.get(v2);
    return (
      (tile1?.synergiesWith?.includes(v2) ?? false) ||
      (tile2?.synergiesWith?.includes(v1) ?? false)
    );
  }
}
