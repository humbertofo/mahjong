import { AnimalValue } from '../../types';
import { TileRegistry } from '../tiles';

export interface SynergyFamily {
  borderColor: string;
  badge: string;
  name: string;
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  FAMÍLIAS E IDENTIDADES VISUAIS DE SINERGIA DA NATUREZA
 *  Metadados de borda, micro-badges e nomes dos laços ecológicos
 * ═══════════════════════════════════════════════════════════════════════════
 */
export const SYNERGY_FAMILIES: Partial<Record<AnimalValue, SynergyFamily>> = {
  // 🐱🐟 Gato & Peixe (Pata Ágil na Lagoa)
  cat:       { borderColor: '#F59E0B', badge: '🐟', name: 'Peixeiro' },
  fish:      { borderColor: '#3B82F6', badge: '🐱', name: 'Aquático' },

  // 🐻🍯 Urso & Mel/Peixe (Banquete na Floresta)
  bear:      { borderColor: '#8B5CF6', badge: '🍯', name: 'Guloso' },
  honeycomb: { borderColor: '#EAB308', badge: '🐝', name: 'Doce' },

  // 🐝🍯 Abelha & Favo (Enxame Dourado)
  bee:       { borderColor: '#F59E0B', badge: '🍯', name: 'Polinizador' },

  // 🐒🍌 Macaco & Banana (Salto na Copa)
  monkey:    { borderColor: '#10B981', badge: '🍌', name: 'Acrobata' },
  banana:    { borderColor: '#FBBF24', badge: '🐒', name: 'Nutritivo' },

  // 🐿️🌰 Esquilo & Noz (Toca de Inverno)
  squirrel:  { borderColor: '#D97706', badge: '🌰', name: 'Precavido' },
  acorn:     { borderColor: '#92400E', badge: '🐿️', name: 'Semente' },

  // 🐸🐞 Sapo & Joaninha/Abelha (Língua Ágil)
  frog:      { borderColor: '#06B6D4', badge: '🐞', name: 'Pescador' },
  ladybug:   { borderColor: '#EF4444', badge: '🐸', name: 'Jardineira' },

  // 🐬🐚 Golfinho & Concha (Eco Sonar)
  dolphin:   { borderColor: '#0284C7', badge: '🐚', name: 'Navegador' },
  shell:     { borderColor: '#38BDF8', badge: '🐬', name: 'Tesouro' },

  // 🦔🍎 Ouriço & Maçã (Espinho Coletor)
  hedgehog:  { borderColor: '#EC4899', badge: '🍎', name: 'Coletor' },
  apple:     { borderColor: '#F43F5E', badge: '🍎', name: 'Pomar' },

  // 🦎 Camaleão Coringa (Arco-Íris Holográfico)
  chameleon: { borderColor: 'rainbow', badge: '✨', name: 'Coringa' },

  // 🐧🐟 Pinguim & Peixe (Deslize Glacial)
  penguin:   { borderColor: '#38BDF8', badge: '🐟', name: 'Glacial' },

  // 🐼🌰 Panda & Noz (Bambu Zen)
  panda:     { borderColor: '#22C55E', badge: '🎋', name: 'Panda Zen' },

  // 🐢🐚 Tartaruga & Concha (Escudo de Carapaça)
  turtle:    { borderColor: '#0284C7', badge: '🐚', name: 'Carapaça' },

  // 🐰🍎 Coelho & Maçã (Salto Ágil)
  rabbit:    { borderColor: '#EC4899', badge: '🍎', name: 'Saltador' },

  // 🦊🍇 Raposa & Uvas (Rastro Astuto)
  fox:       { borderColor: '#EA580C', badge: '🍇', name: 'Astuto' },

  // 🐶🐱 Cão & Gato (Harmonia Doméstica)
  dog:       { borderColor: '#F59E0B', badge: '🐱', name: 'Companheiro' },

  // 🦋🌸 Borboleta & Flor de Lótus (Metamorfose Floral)
  butterfly: { borderColor: '#A855F7', badge: '🌸', name: 'Metamorfose' },

  // 🐘🌰 Elefante & Noz (Impacto Monumental)
  elephant:  { borderColor: '#8B5CF6', badge: '🌰', name: 'Gigante' },

  // 🦆🐟 Pato & Peixe (Mergulho na Lagoa)
  duck:      { borderColor: '#00ACC1', badge: '🐟', name: 'Mergulhador' },

  // 🦁☀️ Leão & Sol (Rugido Radiante)
  lion:      { borderColor: '#F59E0B', badge: '☀️', name: 'Rei do Sol' },

  // 🐦🍇 Pássaro & Uvas (Voo Rasante)
  bird:      { borderColor: '#60A5FA', badge: '🍇', name: 'Alado' },

  // 🐌🍃 Lesma & Folha (Passo Sereno)
  snail:     { borderColor: '#84CC16', badge: '🍃', name: 'Paciente' },

  // 🌸 FLORA ZEN (Flores & Botânica)
  cherry_blossom: { borderColor: '#F472B6', badge: '🦋', name: 'Floral' },
  lotus:          { borderColor: '#FB7185', badge: '🐸', name: 'Lótus Zen' },
  sunflower:      { borderColor: '#FACC15', badge: '🐝', name: 'Solar' },
  rose:           { borderColor: '#EF4444', badge: '🐞', name: 'Espinhos' },
  hibiscus:       { borderColor: '#FB7185', badge: '🐒', name: 'Tropical' },
  tulip:          { borderColor: '#F43F5E', badge: '🐰', name: 'Jardim' },
  white_flower:   { borderColor: '#94A3B8', badge: '🐼', name: 'Pureza' },
  daisy:          { borderColor: '#FDE047', badge: '🐝', name: 'Campo' },
  hyacinth:       { borderColor: '#A855F7', badge: '🦔', name: 'Silvestre' },
  rosette:        { borderColor: '#F59E0B', badge: '✨', name: 'Roseta' },
  bouquet:        { borderColor: '#EC4899', badge: '🐶', name: 'Buquê' },
  wilted_flower:  { borderColor: '#94A3B8', badge: '❄️', name: 'Inverno' },

  // 🌊 REINO MARINHO & ÁRTICO
  seal:           { borderColor: '#38BDF8', badge: '🐟', name: 'Glacial' },
  whale:          { borderColor: '#0284C7', badge: '❄️', name: 'Gigante' },
  spouting_whale: { borderColor: '#0EA5E9', badge: '🐚', name: 'Maré' },
  orca:           { borderColor: '#475569', badge: '🦭', name: 'Predadora' },
  tropical_fish:  { borderColor: '#06B6D4', badge: '🪸', name: 'Recife' },
  blowfish:       { borderColor: '#EAB308', badge: '🐚', name: 'Espinhoso' },
  shark:          { borderColor: '#64748B', badge: '🐟', name: 'Caçador' },
  octopus:        { borderColor: '#8B5CF6', badge: '🐚', name: 'Abissal' },
  coral:          { borderColor: '#FB7185', badge: '🐠', name: 'Coral' },
  jellyfish:      { borderColor: '#C084FC', badge: '🐬', name: 'Luminosa' },

  // 🐉 AVES MAJESTOSAS & SANTUÁRIO MÍSTICO
  dragon:         { borderColor: '#10B981', badge: '🪷', name: 'Celestial' },
  dragon_face:    { borderColor: '#F59E0B', badge: '🐉', name: 'Sagrado' },
  phoenix:        { borderColor: '#EF4444', badge: '🐉', name: 'Imortal' },
  owl:            { borderColor: '#8B5CF6', badge: '🦇', name: 'Sábia' },
  eagle:          { borderColor: '#B45309', badge: '🪶', name: 'Soberana' },
  peacock:        { borderColor: '#06B6D4', badge: '🌸', name: 'Deslumbrante' },
  dove:           { borderColor: '#93C5FD', badge: '💮', name: 'Paz' },
  swan:           { borderColor: '#38BDF8', badge: '🪷', name: 'Serena' },
  flamingo:       { borderColor: '#F472B6', badge: '🐠', name: 'Bailarino' },
  parrot:         { borderColor: '#22C55E', badge: '🍌', name: 'Eco' },
  bat:            { borderColor: '#A855F7', badge: '🦉', name: 'Caverna' },
  turkey:         { borderColor: '#78350F', badge: '🐔', name: 'Altivo' },
  chicken:        { borderColor: '#F59E0B', badge: '🐓', name: 'Terreiro' },
  rooster:        { borderColor: '#EF4444', badge: '🐔', name: 'Despertar' },
  hatching_chick: { borderColor: '#FACC15', badge: '🐤', name: 'Vida' },
  baby_chick:     { borderColor: '#FDE047', badge: '🐔', name: 'Curioso' },
  front_chick:    { borderColor: '#FACC15', badge: '🌻', name: 'Dourado' },
  dodo:           { borderColor: '#64748B', badge: '🌰', name: 'Lenda' },
  goose:          { borderColor: '#06B6D4', badge: '🦆', name: 'Revoada' },
  black_bird:     { borderColor: '#334155', badge: '🦉', name: 'Mistério' },
  feather:        { borderColor: '#94A3B8', badge: '🦅', name: 'Leveza' },
  wing:           { borderColor: '#7DD3FC', badge: '🕊️', name: 'Ascensão' },

  // 🐾 FAUNA POLAR, SELVA & RÉPTEIS (Fase 3)
  wolf:           { borderColor: '#607D8B', badge: '❄️', name: 'Lobo' },
  polar_bear:     { borderColor: '#0288D1', badge: '🦭', name: 'Polar' },
  moose:          { borderColor: '#8D6E63', badge: '🐺', name: 'Alce' },
  llama:          { borderColor: '#FFB300', badge: '🐏', name: 'Lhama' },
  ram:            { borderColor: '#78909C', badge: '🐐', name: 'Carneiro' },
  goat:           { borderColor: '#9E9E9E', badge: '🐏', name: 'Cabra' },
  giraffe:        { borderColor: '#FBC02D', badge: '🦓', name: 'Girafa' },
  zebra:          { borderColor: '#212121', badge: '🦒', name: 'Zebra' },
  rhino:          { borderColor: '#546E7A', badge: '🐘', name: 'Rinoceronte' },
  hippo:          { borderColor: '#7E57C2', badge: '🐊', name: 'Hipopótamo' },
  leopard:        { borderColor: '#FF9800', badge: '🐅', name: 'Leopardo' },
  tiger_face:     { borderColor: '#FF6D00', badge: '🐅', name: 'Tigre' },
  tiger:          { borderColor: '#F4511E', badge: '🦁', name: 'Bengala' },
  gorilla:        { borderColor: '#37474F', badge: '🐒', name: 'Gorila' },
  orangutan:      { borderColor: '#E65100', badge: '🍌', name: 'Orangotango' },
  camel:          { borderColor: '#FFA000', badge: '🐫', name: 'Camelo' },
  two_hump_camel: { borderColor: '#FF8F00', badge: '🐪', name: 'Bactriano' },
  kangaroo:       { borderColor: '#8D6E63', badge: '🐰', name: 'Canguru' },
  sloth:          { borderColor: '#A1887F', badge: '🐨', name: 'Preguiça' },
  koala:          { borderColor: '#78909C', badge: '🦥', name: 'Coala' },
  skunk:          { borderColor: '#212121', badge: '🦡', name: 'Gambá' },
  badger:         { borderColor: '#455A64', badge: '🦨', name: 'Texugo' },
  beaver:         { borderColor: '#6D4C41', badge: '🦦', name: 'Castor' },
  otter:          { borderColor: '#00ACC1', badge: '🦫', name: 'Lontra' },
  crocodile:      { borderColor: '#2E7D32', badge: '🦛', name: 'Crocodilo' },
  snake:          { borderColor: '#43A047', badge: '🐸', name: 'Cobra' },
  sauropod:       { borderColor: '#00897B', badge: '🦖', name: 'Braquiossauro' },
  t_rex:          { borderColor: '#D84315', badge: '🦕', name: 'Tiranossauro' },
  mammoth:        { borderColor: '#5D4037', badge: '🐘', name: 'Mamute' },
  paw_prints:     { borderColor: '#FFA000', badge: '🐾', name: 'Trilha' },

  // 🌱 PLANTAS & ÁRVORES (Fase 4)
  sprout:           { borderColor: '#4CAF50', badge: '🪱', name: 'Broto' },
  potted_plant:     { borderColor: '#8D6E63', badge: '🐼', name: 'Bonsai' },
  pine_tree:        { borderColor: '#2E7D32', badge: '🐿️', name: 'Pinheiro' },
  deciduous_tree:   { borderColor: '#388E3C', badge: '🦉', name: 'Carvalho' },
  palm_tree:        { borderColor: '#7CB342', badge: '🐒', name: 'Palmeira' },
  cactus:           { borderColor: '#8BC34A', badge: '🐫', name: 'Cacto' },
  rice_plant:       { borderColor: '#FBC02D', badge: '🐁', name: 'Arroz' },
  herb:             { borderColor: '#43A047', badge: '🦌', name: 'Erva' },
  shamrock:         { borderColor: '#4CAF50', badge: '🐞', name: 'Trevo' },
  four_leaf_clover: { borderColor: '#2E7D32', badge: '✨', name: 'Fortuna' },
  maple_leaf:       { borderColor: '#E64A19', badge: '🐿️', name: 'Bordo' },
  fallen_leaves:    { borderColor: '#8D6E63', badge: '🦔', name: 'Outono' },
  wind_leaf:        { borderColor: '#7CB342', badge: '🐦', name: 'Vento' },
  empty_nest:       { borderColor: '#795548', badge: '🐦', name: 'Ninho' },
  nest_eggs:        { borderColor: '#8D6E63', badge: '🐣', name: 'Ninhada' },
  bare_tree:        { borderColor: '#78909C', badge: '❄️', name: 'Hibernal' },

  // 🐛 INSETOS & PEQUENOS RASTEJANTES (Fase 4)
  caterpillar:      { borderColor: '#7CB342', badge: '🦋', name: 'Lagarta' },
  ant:              { borderColor: '#5D4037', badge: '🍃', name: 'Formiga' },
  beetle:           { borderColor: '#00897B', badge: '🌲', name: 'Besouro' },
  cricket:          { borderColor: '#43A047', badge: '🐸', name: 'Grilo' },
  cockroach:        { borderColor: '#6D4C41', badge: '🐜', name: 'Barata' },
  spider:           { borderColor: '#455A64', badge: '🕸️', name: 'Aranha' },
  spider_web:       { borderColor: '#94A3B8', badge: '🕷️', name: 'Teia' },
  scorpion:         { borderColor: '#FFA000', badge: '🐫', name: 'Escorpião' },
  mosquito:         { borderColor: '#00ACC1', badge: '🐸', name: 'Mosquito' },
  fly:              { borderColor: '#607D8B', badge: '🐸', name: 'Mosca' },
  worm:             { borderColor: '#EC407A', badge: '🌱', name: 'Minhoca' },
  microbe:          { borderColor: '#00BFA5', badge: '🌱', name: 'Micróbio' },

  // 🐵 MAMÍFEROS ADICIONAIS & DOMÉSTICOS (Fase 4)
  monkey_face:      { borderColor: '#FFA000', badge: '🐒', name: 'Macaco' },
  dog_full:         { borderColor: '#FFB300', badge: '🐑', name: 'Pastor' },
  guide_dog:        { borderColor: '#FDD835', badge: '🐶', name: 'Guia' },
  service_dog:      { borderColor: '#546E7A', badge: '🦮', name: 'Serviço' },
  poodle:           { borderColor: '#AB47BC', badge: '💐', name: 'Poodle' },
  raccoon:          { borderColor: '#455A64', badge: '🦊', name: 'Guaxinim' },
  cat_full:         { borderColor: '#FB8C00', badge: '🐁', name: 'Gato' },
  black_cat:        { borderColor: '#37474F', badge: '🐱', name: 'Preto' },
  horse_face:       { borderColor: '#8D6E63', badge: '🐎', name: 'Cavalo' },
  horse:            { borderColor: '#6D4C41', badge: '🦓', name: 'Galope' },
  donkey:           { borderColor: '#78909C', badge: '🐎', name: 'Burro' },
  unicorn:          { borderColor: '#BA68C8', badge: '🐉', name: 'Unicórnio' },
  cow_face:         { borderColor: '#FFA000', badge: '🐄', name: 'Vaca' },
  cow:              { borderColor: '#424242', badge: '🐂', name: 'Leiteira' },
  ox:               { borderColor: '#5D4037', badge: '🐃', name: 'Boi' },
  water_buffalo:    { borderColor: '#455A64', badge: '🐂', name: 'Búfalo' },
  bison:            { borderColor: '#4E342E', badge: '🐂', name: 'Bisão' },
  pig_face:         { borderColor: '#F48FB1', badge: '🐖', name: 'Porquinho' },
  pig:              { borderColor: '#EC407A', badge: '🐗', name: 'Porco' },
  boar:             { borderColor: '#5D4037', badge: '🌰', name: 'Javali' },
  pig_nose:         { borderColor: '#F06292', badge: '🐷', name: 'Focinho' },
  sheep:            { borderColor: '#BDBDBD', badge: '🐏', name: 'Ovelha' },
  mouse_face:       { borderColor: '#90A4AE', badge: '🐁', name: 'Ratinho' },
  mouse:            { borderColor: '#9E9E9E', badge: '🐱', name: 'Camundongo' },
  rat:              { borderColor: '#607D8B', badge: '🐁', name: 'Rato' },
  hamster:          { borderColor: '#FFB300', badge: '🌻', name: 'Hamster' },
  rabbit_full:      { borderColor: '#B0BEC5', badge: '🐰', name: 'Lebre' },
};

/**
 * Mapeamento numérico arábico de identificação para acessibilidade (1 a 28)
 * Derivado dinamicamente do TileRegistry (Fonte Única da Verdade)
 */
export const ANIMAL_HELPER_INDEX: Record<AnimalValue, string> = TileRegistry.getAll().reduce(
  (acc, tile) => {
    acc[tile.value] = tile.helperIndex;
    return acc;
  },
  {} as Record<AnimalValue, string>
);
