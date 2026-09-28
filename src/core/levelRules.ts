import { LevelRuleDefinition } from './types';
import { WORLDS } from './layouts/worlds';

/**
 * ═══════════════════════════════════════════════════════════════════
 *  SISTEMA OFICIAL DE LEVEL DESIGN & PROGRESSÃO (10 MUNDOS / 50 NÍVEIS)
 *  Curadoria: 5 fases por mundo, escalada didática e celebrações frequentes
 * ═══════════════════════════════════════════════════════════════════
 */

// Mapeamento de introdução de mecânicas e celebrações por mundo
export const MECHANIC_INTRODUCTIONS: Record<number, string> = {
  1:  '🌸 Bem-vindo ao Jardim do Aprendiz! Toque em peças livres nas bordas para formar pares.',
  4:  '🍯 Sinergia Descoberta: Abelhas e Favos de Mel combinam entre si com pontos bônus!',
  6:  '🦎 Mundo 2: Bosque da Fortuna! O Camaleão Dourado estreou e combina com qualquer peça!',
  8:  '🎁 Baú da Fortuna: combine-o para ganhar super bônus de harmonia e ferramentas!',
  11: '❄️ Mundo 3: Vale Glacial! Dê um toque nas peças congeladas para descongelá-las!',
  15: '🌊 Sistema Multi-Onda: limpe o primeiro tabuleiro e uma nova onda descerá em seguida!',
  16: '🎋 Mundo 4: Floresta de Bambu! Corte os cipós combinando herbívoros ou insetos vizinhos!',
  21: '🪨 Mundo 5: Santuário de Pedra! O Ciclo Dia & Noite ☀️🌙 começa: a cada 4 pares a luz muda com bônus solares e lunares! Bandeja agora com 3 espaços.',
  24: '🥚 Ninho dos Casulos: cause 2 impactos vizinhos para rachar e chocar uma criatura mística rara!',
  26: '🌊 Mundo 6: Rios Ancestrais! Explore pontes e corredores com novas criaturas aquáticas e trincas sagradas!',
  31: '🪞 Mundo 7: Reino dos Espelhos! O Espelho assume a forma do último animal combinado!',
  36: '🦁 Mundo 8: Savana dos Segredos! Cadeia Alimentar ativa: predadores caçam na bandeja! Névoa dos Picos 🌫️ esconde vales profundos.',
  41: '🦅 Mundo 9: Cumes Celestiais! Cúpulas de Selos Elementais 🔒 protegem peças sagradas! Combine o Par-Chave 🗝️ para rompê-las!',
  46: '⛩️ Mundo 10: Templo dos Mestres! A apoteose final com todas as mecânicas cósmicas: domine o Classic Shanghai com 144 peças!',
};

export const LEVEL_RULES_BY_NUMBER: Record<number, Partial<LevelRuleDefinition>> = {
  // ─── MUNDO 1: JARDIM DO APRENDIZ (Fases 01 a 05) ─────────────────────────
  1:  { biome: 'garden', allowedSpecials: [], allowChameleon: false },
  2:  { biome: 'garden', allowedSpecials: [], allowChameleon: false },
  3:  { biome: 'garden', allowedSpecials: [], allowChameleon: false },
  4:  { biome: 'garden', allowedSpecials: [], allowChameleon: false },
  5:  { biome: 'garden', allowedSpecials: [], allowChameleon: false },

  // ─── MUNDO 2: BOSQUE DA FORTUNA (Fases 06 a 10) ──────────────────────────
  6:  { biome: 'forest', allowedSpecials: [], allowChameleon: true, chameleonChance: 1.0 }, // Estreia Camaleão
  7:  { biome: 'forest', allowedSpecials: [], allowChameleon: true, chameleonChance: 0.5 },
  8:  { biome: 'forest', allowedSpecials: ['chest'], maxSpecialPairs: 1, allowChameleon: false }, // Estreia Baú
  9:  { biome: 'forest', allowedSpecials: ['chest'], maxSpecialPairs: 1, allowChameleon: true, chameleonChance: 0.5 },
  10: { biome: 'forest', allowedSpecials: ['chest'], maxSpecialPairs: 1, allowChameleon: true, chameleonChance: 0.6 },

  // ─── MUNDO 3: VALE GLACIAL (Fases 11 a 15) ───────────────────────────────
  11: { biome: 'arctic', allowedSpecials: ['ice'], maxSpecialPairs: 1, allowChameleon: false }, // Estreia Gelo
  12: { biome: 'arctic', allowedSpecials: ['ice', 'chest'], maxSpecialPairs: 1, allowChameleon: true, chameleonChance: 0.4 },
  13: { biome: 'arctic', allowedSpecials: ['ice'], maxSpecialPairs: 1, allowChameleon: false },
  14: { biome: 'arctic', allowedSpecials: ['ice', 'vines'], maxSpecialPairs: 1, allowChameleon: false },
  15: { biome: 'arctic', allowedSpecials: ['ice', 'chest'], maxSpecialPairs: 1, allowChameleon: true, chameleonChance: 0.4 }, // Estreia Multi-Onda

  // ─── MUNDO 4: FLORESTA DE BAMBU (Fases 16 a 20) ──────────────────────────
  16: { biome: 'forest',  allowedSpecials: ['vines'], maxSpecialPairs: 2, allowChameleon: false },
  17: { biome: 'forest',  allowedSpecials: ['vines', 'chest'], maxSpecialPairs: 1, allowChameleon: true, chameleonChance: 0.5 },
  18: { biome: 'forest',  allowedSpecials: ['vines', 'ice'], maxSpecialPairs: 2, allowChameleon: false },
  19: { biome: 'forest',  allowedSpecials: ['vines', 'chest'], maxSpecialPairs: 2, allowChameleon: true, chameleonChance: 0.5 },
  20: { biome: 'forest',  allowedSpecials: ['vines', 'ice', 'chest'], maxSpecialPairs: 2, allowChameleon: true, chameleonChance: 0.7 },

  // ─── MUNDO 5: SANTUÁRIO DE PEDRA (Fases 21 a 25) ─────────────────────────
  21: { biome: 'savanna', allowedSpecials: ['rock'], maxSpecialPairs: 1, allowChameleon: false }, // Estreia Rocha
  22: { biome: 'savanna', allowedSpecials: ['rock', 'chest'], maxSpecialPairs: 1, allowChameleon: true, chameleonChance: 0.5 },
  23: { biome: 'savanna', allowedSpecials: ['rock', 'ice'], maxSpecialPairs: 2, allowChameleon: false },
  24: { biome: 'savanna', allowedSpecials: ['cocoon'], maxSpecialPairs: 1, allowChameleon: false }, // Estreia Casulo
  25: { biome: 'arctic',  allowedSpecials: ['cocoon', 'rock'], maxSpecialPairs: 2, allowChameleon: true, chameleonChance: 0.5 },

  // ─── MUNDO 6: RIOS ANCESTRAIS (Fases 26 a 30) ────────────────────────────
  26: { biome: 'water',   allowedSpecials: ['cocoon', 'vines'], maxSpecialPairs: 2, allowChameleon: false },
  27: { biome: 'water',   allowedSpecials: ['rock', 'ice', 'vines'], maxSpecialPairs: 2, allowChameleon: true, chameleonChance: 0.5 },
  28: { biome: 'water',   allowedSpecials: ['cocoon', 'rock', 'chest'], maxSpecialPairs: 2, allowChameleon: true, chameleonChance: 0.5 },
  29: { biome: 'water',   allowedSpecials: ['cocoon', 'vines', 'ice'], maxSpecialPairs: 2, allowChameleon: true, chameleonChance: 0.6 },
  30: { biome: 'water',   allowedSpecials: ['rock', 'cocoon', 'ice', 'vines', 'chest'], maxSpecialPairs: 3, allowChameleon: true, chameleonChance: 0.7 },

  // ─── MUNDO 7: REINO DOS ESPELHOS (Fases 31 a 35) ─────────────────────────
  31: { biome: 'arctic',  allowedSpecials: ['mirror'], maxSpecialPairs: 1, allowChameleon: false }, // Estreia Espelho
  32: { biome: 'arctic',  allowedSpecials: ['mirror', 'ice'], maxSpecialPairs: 2, allowChameleon: false },
  33: { biome: 'arctic',  allowedSpecials: ['mirror', 'vines'], maxSpecialPairs: 2, allowChameleon: true, chameleonChance: 0.5 },
  34: { biome: 'arctic',  allowedSpecials: ['mirror', 'ice', 'chest'], maxSpecialPairs: 2, allowChameleon: false },
  35: { biome: 'savanna', allowedSpecials: ['mirror', 'rock'], maxSpecialPairs: 2, allowChameleon: true, chameleonChance: 0.5 },

  // ─── MUNDO 8: SAVANA DOS SEGREDOS (Fases 36 a 40) ────────────────────────
  36: { biome: 'savanna', allowedSpecials: ['mirror', 'vines', 'rock'], maxSpecialPairs: 2, allowChameleon: false },
  37: { biome: 'savanna', allowedSpecials: ['mirror', 'ice', 'vines'], maxSpecialPairs: 2, allowChameleon: true, chameleonChance: 0.6 },
  38: { biome: 'savanna', allowedSpecials: ['mirror', 'cocoon', 'rock'], maxSpecialPairs: 3, allowChameleon: true, chameleonChance: 0.6 },
  39: { biome: 'savanna', allowedSpecials: ['mirror', 'cocoon', 'rock'], maxSpecialPairs: 3, allowChameleon: true, chameleonChance: 0.7 },
  40: { biome: 'savanna', allowedSpecials: ['mirror', 'ice', 'vines', 'rock', 'chest'], maxSpecialPairs: 3, allowChameleon: true, chameleonChance: 0.8 },

  // ─── MUNDO 9: CUMES CELESTIAIS (Fases 41 a 45) ───────────────────────────
  41: { biome: 'forest',  allowedSpecials: ['mirror', 'ice', 'rock'], maxSpecialPairs: 3, allowChameleon: true, chameleonChance: 0.8 },
  42: { biome: 'forest',  allowedSpecials: ['mirror', 'vines', 'cocoon'], maxSpecialPairs: 3, allowChameleon: true, chameleonChance: 0.8 },
  43: { biome: 'savanna', allowedSpecials: ['mirror', 'rock', 'chest', 'ice'], maxSpecialPairs: 3, allowChameleon: true, chameleonChance: 0.8 },
  44: { biome: 'forest',  allowedSpecials: ['mirror', 'vines', 'cocoon', 'chest'], maxSpecialPairs: 3, allowChameleon: true, chameleonChance: 0.8 },
  45: { biome: 'savanna', allowedSpecials: ['mirror', 'rock', 'vines', 'ice'], maxSpecialPairs: 3, allowChameleon: true, chameleonChance: 0.85 },

  // ─── MUNDO 10: TEMPLO DOS MESTRES (Fases 46 a 50) ────────────────────────
  46: { biome: 'garden',  allowedSpecials: ['mirror', 'cocoon', 'chest', 'ice'], maxSpecialPairs: 3, allowChameleon: true, chameleonChance: 0.85 },
  47: { biome: 'garden',  allowedSpecials: ['mirror', 'chest'], maxSpecialPairs: 2, allowChameleon: true, chameleonChance: 0.6 },
  48: { biome: 'arctic',  allowedSpecials: ['mirror', 'ice', 'rock', 'chest', 'vines'], maxSpecialPairs: 4, allowChameleon: true, chameleonChance: 0.9 },
  49: { biome: 'forest',  allowedSpecials: ['mirror', 'cocoon', 'ice', 'vines', 'rock'], maxSpecialPairs: 4, allowChameleon: true, chameleonChance: 0.95 },
  50: { biome: 'garden',  allowedSpecials: ['mirror', 'cocoon', 'ice', 'vines', 'rock', 'chest'], maxSpecialPairs: 4, allowChameleon: true, chameleonChance: 1.0 },
};

/**
 * Calcula as metas de pontuação de 1, 2 e 3 estrelas com base no número de peças e ondas
 */
export function calculateStarThresholds(totalSlots: number): [number, number, number] {
  const star1 = 100;
  const star2 = Math.round(totalSlots * 90);
  const star3 = Math.round(totalSlots * 175);
  return [star1, star2, star3];
}

// Mapeamento canônico de layout.id para número da fase (1 a 50)
export const LAYOUT_ID_TO_LEVEL: Record<string, number> = {
  'garden-tutorial': 1,
  'beginner-step': 2,
  'mini-zen': 3,
  'heart-wisdom': 4,
  'mini-traditional': 5,
  'jade-butterfly': 6,
  'royal-diamond': 7,
  'forest-reindeer': 8,
  'morning-star': 9,
  'peace-wall': 10,
  'radiant-smile': 11,
  'lucky-clover': 12,
  'short-4-winds': 13,
  'fiesta-viva': 14,
  'animal-cross': 15,
  'stellar-orbit': 16,
  'twin-waves': 17,
  'panda-wisdom': 18,
  'retro-joystick': 19,
  'bamboo-valley': 20,
  'stone-arena': 21,
  'rising-sun': 22,
  'ruby-heart': 23,
  'wisdom-52': 24,
  'saturn-rings': 25,
  'celestial-pong': 26,
  'mystic-labyrinth': 27,
  'guardian-totem': 28,
  'river-bridge': 29,
  'earth-pillars': 30,
  'three-crowns': 31,
  'iron-chains': 32,
  'mystic-swirl': 33,
  'polar-star': 34,
  'golden-dome': 35,
  'four-winds': 36,
  'olympic-stadium': 37,
  'master-key': 38,
  'pentagram-sanctuary': 39,
  'lost-atlantis': 40,
  'spiral-galaxy': 41,
  'four-bridges': 42,
  'ziggurat-temple': 43,
  'four-hills': 44,
  'red-dragon': 45,
  'celestial-cloud': 46,
  'imperial-cat': 47,
  'soaring-eagle': 48,
  'sacred-altar': 49,
  'classic-shanghai': 50,
};

/**
 * Retorna as regras completas de level design para qualquer nível (1 a 50)
 */
export function getLevelRules(levelInput: number | string, totalSlots: number = 72): LevelRuleDefinition {
  let levelNumber = 1;
  if (typeof levelInput === 'string') {
    if (LAYOUT_ID_TO_LEVEL[levelInput]) {
      levelNumber = LAYOUT_ID_TO_LEVEL[levelInput];
    } else {
      const match = levelInput.match(/\d+/);
      levelNumber = match ? parseInt(match[0], 10) : 1;
    }
  } else if (typeof levelInput === 'number') {
    levelNumber = Math.max(1, Math.min(50, Math.floor(levelInput) + 1));
  }
  levelNumber = Math.max(1, Math.min(50, levelNumber));

  // Identificar Mundo a partir de WORLDS oficial
  const world = WORLDS.find((w) => levelNumber >= w.levelRange[0] && levelNumber <= w.levelRange[1]) || WORLDS[0];
  const worldId = world.id;
  const worldTitle = world.title;
  const worldTier = Math.min(10, Math.max(1, Math.ceil(levelNumber / 5)));

  const overrides = LEVEL_RULES_BY_NUMBER[levelNumber] || {};
  const mechanicIntro = MECHANIC_INTRODUCTIONS[levelNumber];
  const starThresholds = calculateStarThresholds(totalSlots);

  return {
    levelNumber,
    worldId,
    worldTitle,
    worldTier,
    biome: overrides.biome || 'garden',
    allowedSpecials: overrides.allowedSpecials ?? [],
    maxSpecialPairs: overrides.maxSpecialPairs ?? 1,
    allowChameleon: overrides.allowChameleon ?? false,
    chameleonChance: overrides.chameleonChance ?? 0.5,
    mechanicIntro,
    starThresholds,
    maxTraySlots: overrides.maxTraySlots ?? (levelNumber >= 21 ? 3 : 4),
  };
}
