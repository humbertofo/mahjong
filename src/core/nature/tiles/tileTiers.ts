import { AnimalValue } from '../../types';

/**
 * ═══════════════════════════════════════════════════════════════════
 *  MAPA DE TIERS DE DESCOBERTA DA FAUNA & FLORA (10 MUNDOS)
 *  Garante que novos animais estreiem progressivamente de 1 a 10.
 * ═══════════════════════════════════════════════════════════════════
 */
export const ANIMAL_TIERS: Partial<Record<AnimalValue, number>> = {
  // ─── TIER 1: Jardim do Aprendiz (18 espécies ultra familiares) ─────────────
  cat: 1,
  dog: 1,
  rabbit: 1,
  hamster: 1,
  mouse: 1,
  duck: 1,
  chicken: 1,
  baby_chick: 1,
  bee: 1,
  ladybug: 1,
  snail: 1,
  caterpillar: 1,
  cherry_blossom: 1,
  lotus: 1,
  sunflower: 1,
  rose: 1,
  apple: 1,
  honeycomb: 1,

  // ─── TIER 2: Bosque da Fortuna (+10 espécies de bosque & flores) ────────────
  squirrel: 2,
  hedgehog: 2,
  bird: 2,
  butterfly: 2,
  frog: 2,
  ant: 2,
  acorn: 2,
  tulip: 2,
  daisy: 2,
  chameleon: 2, // Estreia do Camaleão na Fase 6

  // ─── TIER 3: Vale Glacial (+10 espécies polares & frio) ─────────────────────
  penguin: 3,
  polar_bear: 3,
  seal: 3,
  wolf: 3,
  moose: 3,
  fish: 3,
  owl: 3,
  dove: 3,
  wilted_flower: 3,

  // ─── TIER 4: Floresta de Bambu (+10 espécies de bosque asiático) ────────────
  panda: 4,
  fox: 4,
  bear: 4,
  badger: 4,
  raccoon: 4,
  skunk: 4,
  pine_tree: 4,
  white_flower: 4,
  hyacinth: 4,

  // ─── TIER 5: Santuário de Pedra (+10 espécies da terra & montanhas) ─────────
  turtle: 5,
  ram: 5,
  goat: 5,
  llama: 5,
  snake: 5,
  cricket: 5,
  beetle: 5,
  spider: 5,
  sprout: 5,

  // ─── TIER 6: Rios Ancestrais (+12 espécies aquáticas & fluviais) ────────────
  dolphin: 6,
  shell: 6,
  tropical_fish: 6,
  whale: 6,
  spouting_whale: 6,
  orca: 6,
  beaver: 6,
  otter: 6,
  coral: 6,
  jellyfish: 6,
  blowfish: 6,
  octopus: 6,

  // ─── TIER 7: Reino dos Espelhos (+10 aves nobres & elementos reais) ────────
  peacock: 7,
  swan: 7,
  flamingo: 7,
  parrot: 7,
  dodo: 7,
  goose: 7,
  feather: 7,
  wing: 7,
  rosette: 7,
  bouquet: 7,

  // ─── TIER 8: Savana dos Segredos (+16 grandes animais da savana) ────────────
  lion: 8,
  tiger: 8,
  tiger_face: 8,
  leopard: 8,
  elephant: 8,
  rhino: 8,
  hippo: 8,
  giraffe: 8,
  zebra: 8,
  gorilla: 8,
  orangutan: 8,
  camel: 8,
  two_hump_camel: 8,
  kangaroo: 8,
  sloth: 8,
  koala: 8,

  // ─── TIER 9: Cumes Celestiais (+12 aves de rapina & pré-história) ───────────
  eagle: 9,
  black_bird: 9,
  bat: 9,
  turkey: 9,
  rooster: 9,
  hatching_chick: 9,
  front_chick: 9,
  crocodile: 9,
  sauropod: 9,
  t_rex: 9,
  mammoth: 9,
  dragon_face: 9,

  // ─── TIER 10: Templo dos Mestres (Entidades Míticas & Plenitude) ────────────
  dragon: 10,
  phoenix: 10,
  unicorn: 10,
};

/**
 * Retorna o Tier do animal (1 a 10). Se não mapeado explicitamente, assume Tier 10.
 */
export function getAnimalTier(val: AnimalValue): number {
  return ANIMAL_TIERS[val] ?? 10;
}
