// Apenas um suit: 'animal' — cada value é o nome do animal ou adereço natural
export type TileSuit = 'animal';

export type AnimalValue =
  | 'cat'
  | 'dog'
  | 'rabbit'
  | 'fish'
  | 'bird'
  | 'butterfly'
  | 'turtle'
  | 'frog'
  | 'bee'
  | 'elephant'
  | 'lion'
  | 'fox'
  | 'monkey'
  | 'panda'
  | 'penguin'
  | 'duck'
  | 'snail'
  | 'ladybug'
  // Novos animais
  | 'bear'
  | 'squirrel'
  | 'dolphin'
  | 'hedgehog'
  // Adereços e elementos de sinergia
  | 'banana'
  | 'acorn'
  | 'shell'
  | 'apple'
  | 'honeycomb'
  // Peça Coringa
  | 'chameleon';

// TileValue apenas string (nome do animal ou adereço)
export type TileValue = AnimalValue;

export interface TileDefinition {
  id: string;
  suit: TileSuit;
  value: TileValue;
  label: string;
}

export interface GridPosition {
  x: number;
  y: number;
  z: number;
}

export type TileSpecialType = 'normal' | 'chameleon' | 'ice' | 'cocoon' | 'rock' | 'chest' | 'mirror' | 'vines';
export type TileBiome = 'savanna' | 'arctic' | 'forest' | 'water' | 'garden';

export interface PlacedTile {
  id: string;
  suit: TileSuit;
  value: TileValue;
  label: string;
  position: GridPosition;
  isRemoved: boolean;
  isSelected: boolean;
  isHinted: boolean;
  inTray?: boolean;
  specialType?: TileSpecialType;
  biome?: TileBiome;
}

export interface LayoutSlot {
  x: number;
  y: number;
  z: number;
}

export interface WaveStage {
  waveNumber: number;
  slots: LayoutSlot[];
}

export interface BoardLayout {
  id: string;
  name: string;
  description: string;
  difficulty: 'Fácil' | 'Médio' | 'Difícil';
  slots: LayoutSlot[];
  waves?: WaveStage[];
}

export type ClimateType =
  | 'ocean_surge'      // Maré Alta Purificadora: lava bandeja + chance de eliminar 1 par
  | 'heat_wave'        // Onda de Calor: derrete gelo e gera 1 camaleão
  | 'arctic_blizzard'  // Nevasca Ártica: pausa timer 30s + passo livre
  | 'autumn_gale'      // Vendaval de Outono: corta vinhas + reorganiza travadas
  | 'zen_storm'        // Tempestade Zen: raio vaporiza peça bloqueada + 1 marreta
  | 'spring_breeze'    // Brisa da Primavera: choca casulos + escudo de pétalas
  | 'full_moon';       // Noite de Lua Cheia: vaga-lumes iluminam todos os pares livres

export type SynergyType =
  | 'bee_honey'
  | 'bear_feast'
  | 'monkey_banana'
  | 'squirrel_acorn'
  | 'frog_tongue'
  | 'dolphin_sonar'
  | 'hedgehog_apple'
  | 'cat_paw'
  | 'wildcard_chameleon';

export interface SynergyResult {
  type: SynergyType;
  title: string;
  description: string;
  bonusScore?: number;
  clearedTrayTiles?: PlacedTile[];
  affectedBoardTiles?: PlacedTile[];
}

export interface ClimateEffectResult {
  climate: ClimateType;
  title: string;
  description: string;
  icon: string;
  clearedTrayTiles?: PlacedTile[];
  affectedBoardTiles?: PlacedTile[];
  eliminatedBoardPairs?: [PlacedTile, PlacedTile];
  frozenTimerSeconds?: number;
  rechargedTool?: 'hammer' | 'shuffle' | 'hint' | 'undo';
}

export interface WaveInfo {
  currentWave: number;
  totalWaves: number;
  remainingInWave: number;
}

export interface MatchPair {
  tile1Id: string;
  tile2Id: string;
}

export interface MoveHistoryItem {
  tile: PlacedTile;
  fromBoardToTrayIndex: number;
}

export type ThemeType = 'mist-emerald' | 'felt-green' | 'wood-dark' | 'zen-dark';

