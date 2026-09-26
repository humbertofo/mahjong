import { TileDefinition, AnimalValue } from './types';

export interface AnimalDeckItem {
  val: AnimalValue;
  label: string;
}

export const ANIMALS: AnimalDeckItem[] = [
  // Clássicos
  { val: 'cat',       label: '🐱 Gatinho'    },
  { val: 'dog',       label: '🐶 Cachorro'   },
  { val: 'rabbit',    label: '🐰 Coelho'     },
  { val: 'fish',      label: '🐟 Peixinho'   },
  { val: 'bird',      label: '🐦 Passarinho' },
  { val: 'butterfly', label: '🦋 Borboleta'  },
  { val: 'turtle',    label: '🐢 Tartaruga'  },
  { val: 'frog',      label: '🐸 Sapo'       },
  { val: 'bee',       label: '🐝 Abelhinha'  },
  { val: 'elephant',  label: '🐘 Elefante'   },
  { val: 'lion',      label: '🦁 Leão'       },
  { val: 'fox',       label: '🦊 Raposa'     },
  { val: 'monkey',    label: '🐒 Macaco'     },
  { val: 'panda',     label: '🐼 Panda'      },
  { val: 'penguin',   label: '🐧 Pinguim'    },
  { val: 'duck',      label: '🦆 Pato'       },
  { val: 'snail',     label: '🐌 Lesma'      },
  { val: 'ladybug',   label: '🐞 Joaninha'   },

  // Novos Animais do Ecossistema
  { val: 'bear',      label: '🐻 Urso'       },
  { val: 'squirrel',  label: '🐿️ Esquilo'    },
  { val: 'dolphin',   label: '🐬 Golfinho'   },
  { val: 'hedgehog',  label: '🦔 Ouriço'     },

  // Adereços Naturais de Sinergia
  { val: 'banana',    label: '🍌 Banana'     },
  { val: 'acorn',     label: '🌰 Noz'        },
  { val: 'shell',     label: '🐚 Concha'     },
  { val: 'apple',     label: '🍎 Maçã'       },
  { val: 'honeycomb', label: '🍯 Favo de Mel'},

  // Peça Coringa Especial
  { val: 'chameleon', label: '🦎 Camaleão'   },
];

export function createAnimalDeck(): TileDefinition[] {
  const deck: TileDefinition[] = [];
  ANIMALS.forEach(({ val, label }) => {
    // 4 cópias de cada tipo para garantir multiplicidade de pares
    for (let copy = 0; copy < 4; copy++) {
      deck.push({
        id: `animal-${val}-${copy}`,
        suit: 'animal',
        value: val,
        label,
      });
    }
  });
  return deck;
}

/**
 * Regra de combinação entre duas peças:
 * 1. O Camaleão Dourado (Coringa) combina com QUALQUER outra peça!
 * 2. Peças idênticas (mesmo valor) combinam.
 * 3. Sinergias da Natureza (cruzadas):
 *    - Abelha 🐝 + Favo de Mel 🍯
 *    - Urso 🐻 + Mel 🍯 ou Peixe 🐟
 *    - Macaco 🐒 + Banana 🍌
 *    - Esquilo 🐿️ + Noz 🌰
 *    - Sapo 🐸 + Joaninha 🐞 ou Abelha 🐝
 *    - Golfinho 🐬 + Concha 🐚
 *    - Ouriço 🦔 + Maçã 🍎
 */
export function canMatch(tileA: TileDefinition, tileB: TileDefinition): boolean {
  if (tileA.id === tileB.id) return false;

  const vA = tileA.value;
  const vB = tileB.value;

  // 1. Coringa (Camaleão combina com qualquer coisa)
  if (vA === 'chameleon' || vB === 'chameleon') {
    return true;
  }

  // 2. Mesma espécie / valor
  if (vA === vB) {
    return true;
  }

  // 3. Sinergias Cruzadas da Natureza
  // Abelha + Favo de Mel
  if ((vA === 'bee' && vB === 'honeycomb') || (vA === 'honeycomb' && vB === 'bee')) {
    return true;
  }

  // Urso + Mel OU Urso + Peixe
  if ((vA === 'bear' && (vB === 'honeycomb' || vB === 'fish')) ||
      ((vA === 'honeycomb' || vA === 'fish') && vB === 'bear')) {
    return true;
  }

  // Macaco + Banana
  if ((vA === 'monkey' && vB === 'banana') || (vA === 'banana' && vB === 'monkey')) {
    return true;
  }

  // Esquilo + Noz (Acorn)
  if ((vA === 'squirrel' && vB === 'acorn') || (vA === 'acorn' && vB === 'squirrel')) {
    return true;
  }

  // Sapo + Insetos (Joaninha ou Abelha)
  if ((vA === 'frog' && (vB === 'ladybug' || vB === 'bee')) ||
      ((vA === 'ladybug' || vA === 'bee') && vB === 'frog')) {
    return true;
  }

  // Golfinho + Concha
  if ((vA === 'dolphin' && vB === 'shell') || (vA === 'shell' && vB === 'dolphin')) {
    return true;
  }

  // Ouriço + Maçã
  if ((vA === 'hedgehog' && vB === 'apple') || (vA === 'apple' && vB === 'hedgehog')) {
    return true;
  }

  // Gato + Peixe
  if ((vA === 'cat' && vB === 'fish') || (vA === 'fish' && vB === 'cat')) {
    return true;
  }

  return false;
}
