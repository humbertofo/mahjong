// Apenas um suit: 'animal' — cada value é o nome do animal
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
  | 'ladybug';

// TileValue apenas string (nome do animal)
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
}

export interface LayoutSlot {
  x: number;
  y: number;
  z: number;
}

export interface BoardLayout {
  id: string;
  name: string;
  description: string;
  difficulty: 'Fácil' | 'Médio' | 'Difícil';
  slots: LayoutSlot[];
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
