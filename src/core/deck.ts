import { TileDefinition, AnimalValue } from './types';

/**
 * Baralho de Animais — 18 tipos × 4 cópias = 72 peças
 * Adequado para o layout Sabedoria-52 (usa 52 peças de 72 disponíveis).
 */

const ANIMALS: { val: AnimalValue; label: string }[] = [
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
];

export function createAnimalDeck(): TileDefinition[] {
  const deck: TileDefinition[] = [];
  ANIMALS.forEach(({ val, label }) => {
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

export function canMatch(tileA: TileDefinition, tileB: TileDefinition): boolean {
  if (tileA.id === tileB.id) return false;
  return tileA.suit === tileB.suit && tileA.value === tileB.value;
}
