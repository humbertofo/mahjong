import { AnimalValue } from '../../types';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  CLASSIFICAÇÃO ECOLÓGICA DA FAUNA ZEN (TRAITS & CADEIA ALIMENTAR)
 *  Fornece consultas O(1) para Predação na Bandeja, Corte de Vinhas e Ciclo Dia/Noite
 * ═══════════════════════════════════════════════════════════════════════════
 */

// 🥩 PREDADORES ALFA (Ativam Predação na Bandeja sobre Presas)
export const ALPHA_PREDATOR_SET = new Set<AnimalValue>([
  'lion',
  'tiger',
  'tiger_face',
  'leopard',
  'wolf',
  'polar_bear',
  'bear',
  'shark',
  'orca',
  't_rex',
  'crocodile',
  'eagle',
]);

// 🐾 PRESAS NATURAIS (Alvos da Predação na Bandeja que liberam o slot)
export const PREY_SET = new Set<AnimalValue>([
  'rabbit',
  'rabbit_full',
  'mouse',
  'mouse_face',
  'rat',
  'hamster',
  'fish',
  'tropical_fish',
  'chicken',
  'baby_chick',
  'front_chick',
  'rooster',
  'duck',
  'sheep',
  'goat',
  'frog',
  'snail',
]);

// 🌿 HERBÍVOROS & INSETOS (Podam/devoram Vinhas da Selva vizinhas ao combinar)
export const VINE_PRUNER_SET = new Set<AnimalValue>([
  // Herbívoros
  'panda',
  'rabbit',
  'rabbit_full',
  'koala',
  'sloth',
  'llama',
  'ram',
  'goat',
  'giraffe',
  'zebra',
  'sheep',
  'cow',
  'cow_face',
  'ox',
  'water_buffalo',
  'bison',
  'horse',
  'horse_face',
  'donkey',
  'camel',
  'two_hump_camel',
  'elephant',
  'moose',
  'rhino',
  'hippo',
  // Insetos & Rastejantes
  'caterpillar',
  'ant',
  'beetle',
  'cricket',
  'cockroach',
  'snail',
  'worm',
  'bee',
  'ladybug',
  'butterfly',
]);

// ☀️ ESPÉCIES DIURNAS (Bônus de Harmonia +50% sob o Sol do Meio-Dia)
export const DIURNAL_SPECIES_SET = new Set<AnimalValue>([
  'eagle',
  'lion',
  'peacock',
  'rooster',
  'butterfly',
  'monkey',
  'monkey_face',
  'bee',
  'sunflower',
  'giraffe',
  'panda',
  'flamingo',
  'dove',
  'swan',
]);

// 🌙 ESPÉCIES NOTURNAS (Bioluminescência e Visão Noturna sob o Luar)
export const NOCTURNAL_SPECIES_SET = new Set<AnimalValue>([
  'owl',
  'bat',
  'wolf',
  'black_cat',
  'leopard',
  'spider',
  'cockroach',
  'cricket',
  'fox',
  'frog',
  'raccoon',
  'hedgehog',
]);

export class TileTraits {
  public static isPredator(value: AnimalValue): boolean {
    return ALPHA_PREDATOR_SET.has(value);
  }

  public static isPrey(value: AnimalValue): boolean {
    return PREY_SET.has(value);
  }

  public static isVinePruner(value: AnimalValue): boolean {
    return VINE_PRUNER_SET.has(value);
  }

  public static isDiurnal(value: AnimalValue): boolean {
    return DIURNAL_SPECIES_SET.has(value);
  }

  public static isNocturnal(value: AnimalValue): boolean {
    return NOCTURNAL_SPECIES_SET.has(value);
  }

  /**
   * Checa se um predador pode predar uma presa específica na bandeja
   */
  public static canPrey(predator: AnimalValue, prey: AnimalValue): boolean {
    if (!this.isPredator(predator) || !this.isPrey(prey)) return false;

    // Predadores aquáticos só predam peixes ou sapos
    if (predator === 'shark' || predator === 'orca') {
      return prey === 'fish' || prey === 'tropical_fish';
    }

    // Aves de rapina (águia) predam roedores, peixes e rãs
    if (predator === 'eagle') {
      return (
        prey === 'fish' ||
        prey === 'tropical_fish' ||
        prey === 'mouse' ||
        prey === 'mouse_face' ||
        prey === 'rat' ||
        prey === 'frog'
      );
    }

    // Predadores terrestres consomem qualquer presa terrestre ou peixe na margem
    return true;
  }
}
