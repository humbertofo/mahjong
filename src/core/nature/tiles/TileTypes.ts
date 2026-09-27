import { AnimalValue, TileBiome } from '../../types';

export type TileVfxType =
  | 'bubbles'   // 🌊 Animais aquáticos (peixe, concha, golfinho)
  | 'petals'    // 🌸 Jardim e primavera (coelho, borboleta, joaninha)
  | 'leaves'    // 🍃 Floresta e vento (pássaro, raposa, esquilo)
  | 'sparkles'  // ✨ Coringa, sol e abelhas
  | 'feathers'  // 🪶 Aves (pato, pássaro)
  | 'snow'      // ❄️ Ártico e frio (pinguim, urso)
  | 'fruits'    // 🍎 Frutas (maçã, banana)
  | 'nuts';     // 🌰 Nozes e sementes (noz, favo)

export type TileAudioTimbre = 'water' | 'wood' | 'crystal' | 'leaf' | 'zen';

export type TileCategory = 'animal' | 'natural_element' | 'wildcard' | 'flora' | 'mythic';

export interface TilePalette {
  bg: string;
  accent: string;
  dark: string;
}

export interface TileEntityConfig {
  value: AnimalValue;
  label: string;
  emoji: string;
  helperIndex: string;
  biome: TileBiome;
  category: TileCategory;
  tier?: number;
  synergiesWith: AnimalValue[];
  synergyTitle?: string;
  dietOrRole?: string;
  palette: TilePalette;
  vfx: {
    type: TileVfxType;
    color: string;
    particleCount?: number;
  };
  audio?: {
    timbre?: TileAudioTimbre;
  };
}
