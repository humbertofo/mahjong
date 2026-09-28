// Naipes do Mahjong Nature: 'animal', 'flora', 'element' e 'mythic'
export type TileSuit = 'animal' | 'flora' | 'element' | 'mythic';

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
  | 'chameleon'
  // ─── FLORA ZEN (12 Flores) ───
  | 'cherry_blossom'
  | 'lotus'
  | 'sunflower'
  | 'rose'
  | 'hibiscus'
  | 'tulip'
  | 'white_flower'
  | 'daisy'
  | 'hyacinth'
  | 'rosette'
  | 'bouquet'
  | 'wilted_flower'
  // ─── REINO MARINHO & ÁRTICO (10 Animais Aquáticos) ───
  | 'whale'
  | 'spouting_whale'
  | 'orca'
  | 'seal'
  | 'tropical_fish'
  | 'blowfish'
  | 'shark'
  | 'octopus'
  | 'coral'
  | 'jellyfish'
  // ─── AVES MAJESTOSAS & SANTUÁRIO MÍSTICO (22 Entidades - Fase 2) ───
  | 'dragon'
  | 'dragon_face'
  | 'phoenix'
  | 'owl'
  | 'eagle'
  | 'peacock'
  | 'dove'
  | 'swan'
  | 'flamingo'
  | 'parrot'
  | 'bat'
  | 'turkey'
  | 'chicken'
  | 'rooster'
  | 'hatching_chick'
  | 'baby_chick'
  | 'front_chick'
  | 'dodo'
  | 'goose'
  | 'black_bird'
  | 'feather'
  | 'wing'
  // ─── FAUNA POLAR, SELVA & RÉPTEIS (30 Entidades - Fase 3) ───
  | 'wolf'
  | 'polar_bear'
  | 'moose'
  | 'llama'
  | 'ram'
  | 'goat'
  | 'giraffe'
  | 'zebra'
  | 'rhino'
  | 'hippo'
  | 'leopard'
  | 'tiger_face'
  | 'tiger'
  | 'gorilla'
  | 'orangutan'
  | 'camel'
  | 'two_hump_camel'
  | 'kangaroo'
  | 'sloth'
  | 'koala'
  | 'skunk'
  | 'badger'
  | 'beaver'
  | 'otter'
  | 'crocodile'
  | 'snake'
  | 'sauropod'
  | 't_rex'
  | 'mammoth'
  | 'paw_prints'
  // ─── PLANTAS, INSETOS & FAUNA ADICIONAL (Fase 4) ───
  // Plantas & Árvores (16)
  | 'sprout'
  | 'potted_plant'
  | 'pine_tree'
  | 'deciduous_tree'
  | 'palm_tree'
  | 'cactus'
  | 'rice_plant'
  | 'herb'
  | 'shamrock'
  | 'four_leaf_clover'
  | 'maple_leaf'
  | 'fallen_leaves'
  | 'wind_leaf'
  | 'empty_nest'
  | 'nest_eggs'
  | 'bare_tree'
  // Insetos (12)
  | 'caterpillar'
  | 'ant'
  | 'beetle'
  | 'cricket'
  | 'cockroach'
  | 'spider'
  | 'spider_web'
  | 'scorpion'
  | 'mosquito'
  | 'fly'
  | 'worm'
  | 'microbe'
  // Mamíferos Adicionais & Domésticos (27)
  | 'monkey_face'
  | 'dog_full'
  | 'guide_dog'
  | 'service_dog'
  | 'poodle'
  | 'raccoon'
  | 'cat_full'
  | 'black_cat'
  | 'horse_face'
  | 'horse'
  | 'donkey'
  | 'unicorn'
  | 'cow_face'
  | 'cow'
  | 'ox'
  | 'water_buffalo'
  | 'bison'
  | 'pig_face'
  | 'pig'
  | 'boar'
  | 'pig_nose'
  | 'sheep'
  | 'mouse_face'
  | 'mouse'
  | 'rat'
  | 'hamster'
  | 'rabbit_full';

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
  inFlight?: boolean;
  inSynergyAction?: boolean;
  inSynergyPulled?: boolean;
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

export interface LevelRuleDefinition {
  levelNumber: number;
  worldId: string;
  worldTitle: string;
  biome: TileBiome;
  allowedSpecials: TileSpecialType[];
  maxSpecialPairs: number;
  allowChameleon: boolean;
  chameleonChance: number;
  worldTier?: number;
  mechanicIntro?: string;
  starThresholds: [number, number, number];
}

export interface BoardLayout {
  id: string;
  name: string;
  description: string;
  difficulty: 'Fácil' | 'Médio' | 'Difícil';
  slots: LayoutSlot[];
  waves?: WaveStage[];
  rules?: LevelRuleDefinition;
}

export type ClimateType =
  | 'ocean_surge'      // Maré Alta Purificadora: lava bandeja + chance de eliminar 1 par
  | 'heat_wave'        // Onda de Calor: derrete gelo e gera 1 camaleão
  | 'arctic_blizzard'  // Nevasca Ártica: pausa timer 30s + passo livre
  | 'autumn_gale'      // Vendaval de Outono: corta vinhas + reorganiza travadas
  | 'zen_storm'        // Tempestade Zen: raio vaporiza peça bloqueada + 1 marreta
  | 'spring_breeze'    // Brisa da Primavera: choca casulos + escudo de pétalas
  | 'full_moon';       // Noite de Lua Cheia: vaga-lumes iluminam com serenidade 1 par livre

export type SynergyType =
  // Clássicas (9)
  | 'bee_honey'
  | 'bear_feast'
  | 'monkey_banana'
  | 'squirrel_acorn'
  | 'frog_tongue'
  | 'dolphin_sonar'
  | 'hedgehog_apple'
  | 'cat_paw'
  | 'wildcard_chameleon'
  // Novas da Fauna (12)
  | 'penguin_slide'
  | 'panda_zen'
  | 'turtle_shield'
  | 'rabbit_hop'
  | 'fox_trail'
  | 'dog_cat_harmony'
  | 'butterfly_flap'
  | 'elephant_crush'
  | 'duck_splash'
  | 'lion_roar'
  | 'bird_swoop'
  | 'snail_zen'
  // Sinergias da Flora, Oceano Profundo & Santuário Místico
  | 'floral_harmony'
  | 'marine_abyss'
  | 'mythic_harmony'
  | 'nature_harmony';

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
  mutations?: TileMutationRecord[];
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

export interface TileMutationRecord {
  tile: PlacedTile;
  prevValue: AnimalValue;
  prevLabel: string;
  prevSuit: TileSuit;
}

export interface MoveHistoryItem {
  actionType: 'tray_add' | 'matched_pair' | 'trio_match';
  tile?: PlacedTile;
  trioTile?: PlacedTile;
  fromBoardToTrayIndex?: number;
  matchedPair?: [PlacedTile, PlacedTile];
  pointsAwarded?: number;
  secondaryRemovedTiles?: PlacedTile[];
  mutations?: TileMutationRecord[];
  rechargedTool?: 'hammer' | 'shuffle' | 'hint' | 'undo';
}

export type ThemeType = 'mist-emerald' | 'felt-green' | 'wood-dark' | 'zen-dark' | 'parchment';

