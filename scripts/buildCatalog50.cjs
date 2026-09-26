const https = require('https');
const fs = require('fs');

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Node' } }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    });
  });
}

function parseLayout(content) {
  const lines = content.split(/\r?\n/);
  let level = -1;
  let y = 0;
  const rawSlots = [];

  for (const line of lines) {
    if (line.startsWith('# Level')) {
      level++;
      y = 0;
    } else if (level >= 0 && !line.startsWith('#') && line.length > 0) {
      for (let x = 0; x < line.length; x++) {
        if (line[x] === '1') {
          rawSlots.push({ x, y, z: level });
        }
      }
      y++;
    }
  }

  if (rawSlots.length === 0) return [];

  // Normalize coordinates: subtract minimums so minX >= 0, minY >= 0
  // Maintain parity (even/odd) by using even shifts
  const minX = Math.min(...rawSlots.map(s => s.x));
  const minY = Math.min(...rawSlots.map(s => s.y));

  const shiftX = minX % 2 === 0 ? minX : minX - 1;
  const shiftY = minY % 2 === 0 ? minY : minY - 1;

  return rawSlots.map(s => ({
    x: s.x - shiftX,
    y: s.y - shiftY,
    z: s.z
  }));
}

// 50 Levels definitions
const LEVEL_SPECS = [
  // === MUNDO 1: JARDIM DO APRENDIZ (Fácil, 30-72 peças) ===
  {
    num: 1,
    world: 'Mundo 1: Jardim do Aprendiz',
    id: 'garden-tutorial',
    name: 'Jardim Tutorial',
    description: 'Aprenda os fundamentos em um jardim harmonioso com poucas peças.',
    difficulty: 'Fácil',
    source: 'local:garden36'
  },
  {
    num: 2,
    world: 'Mundo 1: Jardim do Aprendiz',
    id: 'beginner-step',
    name: 'Primeiros Passos',
    description: 'Layout compacto retangular ideal para praticar pares.',
    difficulty: 'Fácil',
    source: 'mahseum:public/boards/solitile/beginner.layout'
  },
  {
    num: 3,
    world: 'Mundo 1: Jardim do Aprendiz',
    id: 'mini-zen',
    name: 'Jardim Zen',
    description: 'Disposição suave de pedras em camadas relaxantes.',
    difficulty: 'Fácil',
    source: 'local:miniZen'
  },
  {
    num: 4,
    world: 'Mundo 1: Jardim do Aprendiz',
    id: 'heart-wisdom',
    name: 'Coração Sagrado',
    description: 'Silhueta afetuosa de coração com peças bem distribuídas.',
    difficulty: 'Fácil',
    source: 'local:wisdomHeart'
  },
  {
    num: 5,
    world: 'Mundo 1: Jardim do Aprendiz',
    id: 'mini-traditional',
    name: 'Mini Clássico',
    description: 'Versão em miniatura da tradicional pirâmide de marfim.',
    difficulty: 'Fácil',
    source: 'mahseum:public/boards/pysolfc/mini_traditional_3.layout'
  },
  {
    num: 6,
    world: 'Mundo 1: Jardim do Aprendiz',
    id: 'jade-butterfly',
    name: 'Borboleta de Jade',
    description: 'Asas abertas com simetria perfeita e jogabilidade fluida.',
    difficulty: 'Fácil',
    source: 'local:butterfly'
  },
  {
    num: 7,
    world: 'Mundo 1: Jardim do Aprendiz',
    id: 'royal-diamond',
    name: 'Diamante Imperial',
    description: 'Forma geométrica facetada com centro elevado.',
    difficulty: 'Fácil',
    source: 'local:diamond'
  },
  {
    num: 8,
    world: 'Mundo 1: Jardim do Aprendiz',
    id: 'forest-reindeer',
    name: 'Rena da Floresta',
    description: 'Silhueta nórdica inspirada na natureza e na fauna silvestre.',
    difficulty: 'Fácil',
    source: 'mahseum:public/boards/pysolfc/reindeer_3.layout'
  },
  {
    num: 9,
    world: 'Mundo 1: Jardim do Aprendiz',
    id: 'morning-star',
    name: 'Estrela Guia',
    description: 'Padrão estelar radiante que ilumina o caminho dos aprendizes.',
    difficulty: 'Fácil',
    source: 'mahseum:public/boards/pysolfc/half_star.layout'
  },
  {
    num: 10,
    world: 'Mundo 1: Jardim do Aprendiz',
    id: 'peace-wall',
    name: 'Muralha da Paz',
    description: 'Uma muralha baixa e contínua com desbloqueio lateral agradável.',
    difficulty: 'Fácil',
    source: 'mahseum:public/boards/pysolfc/half_wall.layout'
  },

  // === MUNDO 2: REINO DAS CRIATURAS (Fácil-Médio, 72-88 peças) ===
  {
    num: 11,
    world: 'Mundo 2: Vale das Criaturas',
    id: 'radiant-smile',
    name: 'Sorriso Radiante',
    description: 'Desenho cativante em formato de sorriso acolhedor.',
    difficulty: 'Fácil',
    source: 'mahseum:public/boards/pysolfc/half_smile.layout'
  },
  {
    num: 12,
    world: 'Mundo 2: Vale das Criaturas',
    id: 'lucky-clover',
    name: 'Trevo da Sorte',
    description: 'Quatro folhas simétricas trazendo prosperidade e foco.',
    difficulty: 'Médio',
    source: 'mahseum:public/boards/ogs-mahjong/clubs_4.layout'
  },
  {
    num: 13,
    world: 'Mundo 2: Vale das Criaturas',
    id: 'short-4-winds',
    name: 'Brisa Oriental',
    description: 'Os ventos cardeais soprando em direção ao centro do tabuleiro.',
    difficulty: 'Médio',
    source: 'mahseum:public/boards/ogs-mahjong/test_short_4_winds.layout'
  },
  {
    num: 14,
    world: 'Mundo 2: Vale das Criaturas',
    id: 'fiesta-viva',
    name: 'Celebração Festiva',
    description: 'Estrutura alegre e dinâmica com alas desdobradas.',
    difficulty: 'Médio',
    source: 'mahseum:public/boards/step5/viva.layout'
  },
  {
    num: 15,
    world: 'Mundo 2: Vale das Criaturas',
    id: 'animal-cross',
    name: 'Cruz Sagrada',
    description: 'Cruz protetora dos animais da floresta com elevação central.',
    difficulty: 'Médio',
    source: 'local:cross'
  },
  {
    num: 16,
    world: 'Mundo 2: Vale das Criaturas',
    id: 'stellar-orbit',
    name: 'Órbita Celeste',
    description: 'Anéis concêntricos que giram em torno do sol interior.',
    difficulty: 'Médio',
    source: 'mahseum:public/boards/pysolfc/orbital_3.layout'
  },
  {
    num: 17,
    world: 'Mundo 2: Vale das Criaturas',
    id: 'twin-waves',
    name: 'Ondas Gêmeas',
    description: 'Curvas suaves ondulando no leito de um rio sagrado.',
    difficulty: 'Médio',
    source: 'mahseum:public/boards/step5/sinus_twins_2.layout'
  },
  {
    num: 18,
    world: 'Mundo 2: Vale das Criaturas',
    id: 'panda-wisdom',
    name: 'Refúgio do Panda',
    description: 'Níveis escalonados inspirados nas montanhas de Sichuan.',
    difficulty: 'Médio',
    source: 'mahseum:public/boards/step5/ta-internal.layout'
  },
  {
    num: 19,
    world: 'Mundo 2: Vale das Criaturas',
    id: 'retro-joystick',
    name: 'Controle Retrô',
    description: 'Homenagem divertida aos clássicos arcades dos anos 80.',
    difficulty: 'Médio',
    source: 'mahseum:public/boards/step5/joystick_2.layout'
  },
  {
    num: 20,
    world: 'Mundo 2: Vale das Criaturas',
    id: 'bamboo-valley',
    name: 'Vale do Bambu',
    description: 'Degraus firmes e retos entrelaçados como galhos de bambuzal.',
    difficulty: 'Médio',
    source: 'mahseum:public/boards/step5/dsf_2.layout'
  },

  // === MUNDO 3: LABIRINTOS E SANTUÁRIOS (Médio, 92-118 peças) ===
  {
    num: 21,
    world: 'Mundo 3: Labirintos e Santuários',
    id: 'stone-arena',
    name: 'Arena de Pedra',
    description: 'Pátio murado onde os mestres aprimoram sua concentração.',
    difficulty: 'Médio',
    source: 'mahseum:public/boards/step5/quake_3_arena_2.layout'
  },
  {
    num: 22,
    world: 'Mundo 3: Labirintos e Santuários',
    id: 'rising-sun',
    name: 'Ilhas do Sol Poente',
    description: 'Arquipélago com pontes de pedras e relevo fascinante.',
    difficulty: 'Médio',
    source: 'mahseum:public/boards/pysolfc/japan_3.layout'
  },
  {
    num: 23,
    world: 'Mundo 3: Labirintos e Santuários',
    id: 'ruby-heart',
    name: 'Coração de Rubi',
    description: 'Grande coração multicamadas repleto de peças empilhadas.',
    difficulty: 'Médio',
    source: 'mahseum:public/boards/step5/heart_2.layout'
  },
  {
    num: 24,
    world: 'Mundo 3: Labirintos e Santuários',
    id: 'wisdom-52',
    name: 'Sabedoria Ancestral',
    description: 'Composição clássica balanceada com alta densidade central.',
    difficulty: 'Médio',
    source: 'local:wisdom52'
  },
  {
    num: 25,
    world: 'Mundo 3: Labirintos e Santuários',
    id: 'saturn-rings',
    name: 'Anéis de Saturno',
    description: 'O planeta dos anéis em toda sua glória e complexidade.',
    difficulty: 'Médio',
    source: 'mahseum:public/boards/step5/saturn_3.layout'
  },
  {
    num: 26,
    world: 'Mundo 3: Labirintos e Santuários',
    id: 'celestial-pong',
    name: 'Duelo Celestial',
    description: 'Duas barreiras opostas guardando o centro do cosmos.',
    difficulty: 'Médio',
    source: 'mahseum:public/boards/step5/pong_2.layout'
  },
  {
    num: 27,
    world: 'Mundo 3: Labirintos e Santuários',
    id: 'mystic-labyrinth',
    name: 'Labirinto Místico',
    description: 'Caminhos entrelaçados exigindo visão estratégica de longo alcance.',
    difficulty: 'Médio',
    source: 'mahseum:public/boards/ogs-mahjong/labyrinth_3.layout'
  },
  {
    num: 28,
    world: 'Mundo 3: Labirintos e Santuários',
    id: 'guardian-totem',
    name: 'Totem dos Guardiões',
    description: 'Escultura vertical reverenciada pelos antigos protetores.',
    difficulty: 'Médio',
    source: 'mahseum:public/boards/ogs-mahjong/totem_2.layout'
  },
  {
    num: 29,
    world: 'Mundo 3: Labirintos e Santuários',
    id: 'river-bridge',
    name: 'Ponte das Lótus',
    description: 'Passarela de marfim sobre o rio sagrado coberto de flores.',
    difficulty: 'Médio',
    source: 'mahseum:public/boards/pysolfc/river_bridge_3.layout'
  },
  {
    num: 30,
    world: 'Mundo 3: Labirintos e Santuários',
    id: 'earth-pillars',
    name: 'Pilares da Terra',
    description: 'Colunas robustas erguidas nas quatro esquinas do mundo.',
    difficulty: 'Médio',
    source: 'mahseum:public/boards/ogs-mahjong/pillars_4.layout'
  },

  // === MUNDO 4: GRANDES ESTRUTURAS (Médio-Difícil, 120-136 peças) ===
  {
    num: 31,
    world: 'Mundo 4: Grandes Estruturas',
    id: 'three-crowns',
    name: 'Três Coroas',
    description: 'O símbolo da soberania e da virtude inabalável.',
    difficulty: 'Médio',
    source: 'mahseum:public/boards/step5/3_crowns_2.layout'
  },
  {
    num: 32,
    world: 'Mundo 4: Grandes Estruturas',
    id: 'iron-chains',
    name: 'Correntes de Bronze',
    description: 'Elos interligados com dezenas de peças sobrepostas.',
    difficulty: 'Médio',
    source: 'mahseum:public/boards/ogs-mahjong/chains_2.layout'
  },
  {
    num: 33,
    world: 'Mundo 4: Grandes Estruturas',
    id: 'mystic-swirl',
    name: 'Vórtice Dourado',
    description: 'Um redemoinho cósmico que atrai toda a atenção do jogador.',
    difficulty: 'Difícil',
    source: 'mahseum:public/boards/ogs-mahjong/swirl_2.layout'
  },
  {
    num: 34,
    world: 'Mundo 4: Grandes Estruturas',
    id: 'polar-star',
    name: 'Estrela Polar',
    description: 'Grande estrela no centro do céu noturno cercada de camadas.',
    difficulty: 'Difícil',
    source: 'mahseum:public/boards/ogs-mahjong/star_4.layout'
  },
  {
    num: 35,
    world: 'Mundo 4: Grandes Estruturas',
    id: 'golden-dome',
    name: 'Cúpula Imperial',
    description: 'Teto abobadado do palácio de verão com elevações majestosas.',
    difficulty: 'Difícil',
    source: 'mahseum:public/boards/step5/the_dome_1.layout'
  },
  {
    num: 36,
    world: 'Mundo 4: Grandes Estruturas',
    id: 'four-winds',
    name: 'Os Quatro Ventos',
    description: 'Rosa dos ventos imponente abrangendo todo o horizonte.',
    difficulty: 'Difícil',
    source: 'mahseum:public/boards/ogs-mahjong/4_winds_2.layout'
  },
  {
    num: 37,
    world: 'Mundo 4: Grandes Estruturas',
    id: 'olympic-stadium',
    name: 'Coliseu das Feras',
    description: 'Arena circular em degraus com profundidade impressionante.',
    difficulty: 'Difícil',
    source: 'mahseum:public/boards/ogs-mahjong/stadion_2.layout'
  },
  {
    num: 38,
    world: 'Mundo 4: Grandes Estruturas',
    id: 'master-key',
    name: 'Chave Mestra',
    description: 'A chave para abrir os tesouros e segredos mais profundos.',
    difficulty: 'Difícil',
    source: 'mahseum:public/boards/ogs-mahjong/key_2.layout'
  },
  {
    num: 39,
    world: 'Mundo 4: Grandes Estruturas',
    id: 'pentagram-sanctuary',
    name: 'Santuário Pentagrama',
    description: 'Estrela de cinco pontas com harmonia perfeita dos elementos.',
    difficulty: 'Difícil',
    source: 'mahseum:public/boards/ogs-mahjong/penta_2.layout'
  },
  {
    num: 40,
    world: 'Mundo 4: Grandes Estruturas',
    id: 'lost-atlantis',
    name: 'Atlântida Lendária',
    description: 'As torres e canais da lendária cidade perdida do oceano.',
    difficulty: 'Difícil',
    source: 'mahseum:public/boards/ogs-mahjong/atlantis_2.layout'
  },

  // === MUNDO 5: TEMPLO DOS MESTRES (Difícil, 140-144 peças) ===
  {
    num: 41,
    world: 'Mundo 5: Templo dos Mestres',
    id: 'spiral-galaxy',
    name: 'Galáxia Espiral',
    description: 'Braços gravitacionais repletos de estrelas e constelações.',
    difficulty: 'Difícil',
    source: 'mahseum:public/boards/ogs-mahjong/galaxy_2.layout'
  },
  {
    num: 42,
    world: 'Mundo 5: Templo dos Mestres',
    id: 'four-bridges',
    name: 'As Quatro Pontes',
    description: 'Clássico imortal de travessias elevadas e conexões profundas.',
    difficulty: 'Difícil',
    source: 'mahseum:public/boards/gnome-mahjongg/four_bridges.layout'
  },
  {
    num: 43,
    world: 'Mundo 5: Templo dos Mestres',
    id: 'ziggurat-temple',
    name: 'O Ziggurat Sagrado',
    description: 'Pirâmide de cinco terraços escalonados da antiga Babilônia.',
    difficulty: 'Difícil',
    source: 'mahseum:public/boards/gnome-mahjongg/the_ziggurat.layout'
  },
  {
    num: 44,
    world: 'Mundo 5: Templo dos Mestres',
    id: 'four-hills',
    name: 'Quatro Colinas',
    description: 'Relevo verdejante com quatro cumes que desafiam sua visão.',
    difficulty: 'Difícil',
    source: 'mahseum:public/boards/green-mahjong/four_hills.layout'
  },
  {
    num: 45,
    world: 'Mundo 5: Templo dos Mestres',
    id: 'red-dragon',
    name: 'Dragão Vermelho',
    description: 'A criatura mais poderosa da mitologia protegendo o marfim.',
    difficulty: 'Difícil',
    source: 'mahseum:public/boards/gnome-mahjongg/red_dragon.layout'
  },
  {
    num: 46,
    world: 'Mundo 5: Templo dos Mestres',
    id: 'celestial-cloud',
    name: 'Nuvem dos Imortais',
    description: 'Camadas etéreas e densas flutuando na morada dos deuses.',
    difficulty: 'Difícil',
    source: 'mahseum:public/boards/gnome-mahjongg/cloud.layout'
  },
  {
    num: 47,
    world: 'Mundo 5: Templo dos Mestres',
    id: 'imperial-cat',
    name: 'O Grande Tigre',
    description: 'Silhueta majestosa do felino guardião da floresta proibida.',
    difficulty: 'Difícil',
    source: 'mahseum:public/boards/kmahjongg/cat.layout'
  },
  {
    num: 48,
    world: 'Mundo 5: Templo dos Mestres',
    id: 'soaring-eagle',
    name: 'Águia Imperial',
    description: 'A soberana dos céus com envergadura magnífica de 144 peças.',
    difficulty: 'Difícil',
    source: 'mahseum:public/boards/kmahjongg/eagle.layout'
  },
  {
    num: 49,
    world: 'Mundo 5: Templo dos Mestres',
    id: 'sacred-altar',
    name: 'Altar Proibido',
    description: 'Estrutura monumental de oferendas reverenciada por gerações.',
    difficulty: 'Difícil',
    source: 'mahseum:public/boards/kmahjongg/altar.layout'
  },
  {
    num: 50,
    world: 'Mundo 5: Templo dos Mestres',
    id: 'classic-shanghai',
    name: 'Taipei Clássico (Shanghai)',
    description: 'O ápice definitivo do Mahjong Solitaire tradicional.',
    difficulty: 'Difícil',
    source: 'mahseum:public/boards/gnome-mahjongg/taipei.layout'
  }
];

// Helper to get local slots from existing files
function getLocalSlots(sourceKey) {
  // We can load from existing files
  if (sourceKey === 'local:garden36') {
    // 30 pieces
    const slots = [];
    for (let x = 4; x <= 16; x += 2) {
      for (let y = 4; y <= 8; y += 2) {
        slots.push({ x, y, z: 0 }); // 7 x 3 = 21
      }
    }
    slots.push({ x: 2, y: 6, z: 0 });
    slots.push({ x: 18, y: 6, z: 0 });
    slots.push({ x: 8, y: 6, z: 1 });
    slots.push({ x: 10, y: 6, z: 1 });
    slots.push({ x: 12, y: 6, z: 1 });
    slots.push({ x: 14, y: 6, z: 1 });
    slots.push({ x: 10, y: 6, z: 2 });
    slots.push({ x: 12, y: 6, z: 2 });
    slots.push({ x: 11, y: 6, z: 3 }); // wait, total: 21+2+4+2+1 = 30
    // let's ensure even: if 30, it is even! Wait 21 + 2 + 4 + 2 + 1 = 30!
    return slots;
  }
  if (sourceKey === 'local:miniZen') {
    const slots = [];
    for (let x = 6; x <= 16; x += 2) {
      for (let y = 4; y <= 10; y += 2) {
        slots.push({ x, y, z: 0 }); // 6 x 4 = 24
      }
    }
    for (let x = 8; x <= 14; x += 2) {
      for (let y = 6; y <= 8; y += 2) {
        slots.push({ x, y, z: 1 }); // 4 x 2 = 8
      }
    }
    slots.push({ x: 10, y: 6, z: 2 });
    slots.push({ x: 12, y: 6, z: 2 });
    slots.push({ x: 10, y: 8, z: 2 });
    slots.push({ x: 12, y: 8, z: 2 }); // 4
    return slots; // total 36
  }
  if (sourceKey === 'local:wisdomHeart') {
    const s0 = [
      [8, 2], [14, 2],
      [6, 4], [8, 4], [10, 4], [12, 4], [14, 4], [16, 4],
      [4, 6], [6, 6], [8, 6], [10, 6], [12, 6], [14, 6], [16, 6], [18, 6],
      [6, 8], [8, 8], [10, 8], [12, 8], [14, 8], [16, 8],
      [8, 10], [10, 10], [12, 10], [14, 10],
      [10, 12], [12, 12],
      [11, 14],
    ];
    // In original wisdomHeart: 48 pieces
    const slots = [];
    s0.forEach(([x, y]) => slots.push({ x, y, z: 0 }));
    const s1 = [
      [8, 4], [14, 4],
      [8, 6], [10, 6], [12, 6], [14, 6],
      [8, 8], [10, 8], [12, 8], [14, 8],
      [10, 10], [12, 10],
      [11, 12],
    ];
    s1.forEach(([x, y]) => slots.push({ x, y, z: 1 }));
    const s2 = [
      [10, 6], [12, 6],
      [10, 8], [12, 8],
      [11, 10],
    ];
    s2.forEach(([x, y]) => slots.push({ x, y, z: 2 }));
    slots.push({ x: 11, y: 7, z: 3 });
    // Normalize even count
    if (slots.length % 2 !== 0) slots.pop();
    return slots;
  }
  if (sourceKey === 'local:butterfly') {
    const slots = [];
    for (let y = 2; y <= 10; y += 2) {
      slots.push({ x: 10, y, z: 0 }); // 5 peças corpo
    }
    const leftWing = [
      [4, 2], [6, 2], [8, 2],
      [2, 4], [4, 4], [6, 4], [8, 4],
      [2, 6], [4, 6], [6, 6], [8, 6],
      [4, 8], [6, 8], [8, 8],
      [6, 10], [8, 10]
    ];
    leftWing.forEach(([x, y]) => {
      slots.push({ x, y, z: 0 });
      slots.push({ x: 20 - x, y, z: 0 });
    });
    const leftL2 = [
      [4, 4], [6, 4],
      [4, 6], [6, 6],
      [6, 8]
    ];
    leftL2.forEach(([x, y]) => {
      slots.push({ x, y, z: 1 });
      slots.push({ x: 20 - x, y, z: 1 });
    });
    slots.push({ x: 10, y: 4, z: 1 });
    slots.push({ x: 10, y: 6, z: 1 });
    slots.push({ x: 10, y: 8, z: 1 });
    if (slots.length % 2 !== 0) slots.pop();
    return slots;
  }
  if (sourceKey === 'local:diamond') {
    const slots = [];
    for (let r = 0; r <= 5; r++) {
      const y = r * 2;
      const span = r <= 2 ? (r + 1) * 2 : (5 - r + 1) * 2;
      const startX = 10 - span + 2;
      for (let i = 0; i < span; i++) {
        slots.push({ x: startX + i * 2, y, z: 0 });
      }
    }
    for (let y = 4; y <= 8; y += 2) {
      for (let x = 8; x <= 12; x += 2) {
        slots.push({ x, y, z: 1 });
      }
    }
    slots.push({ x: 10, y: 6, z: 2 });
    if (slots.length % 2 !== 0) slots.pop();
    return slots;
  }
  if (sourceKey === 'local:cross') {
    const slots = [];
    for (let y = 0; y <= 16; y += 2) {
      for (let x = 8; x <= 12; x += 2) {
        slots.push({ x, y, z: 0 });
      }
    }
    for (let x = 0; x <= 20; x += 2) {
      for (let y = 6; y <= 10; y += 2) {
        if (x < 8 || x > 12) {
          slots.push({ x, y, z: 0 });
        }
      }
    }
    for (let y = 4; y <= 12; y += 2) {
      for (let x = 8; x <= 12; x += 2) {
        slots.push({ x, y, z: 1 });
      }
    }
    for (let x = 4; x <= 16; x += 2) {
      for (let y = 6; y <= 10; y += 2) {
        if ((x < 8 || x > 12) && (y >= 6 && y <= 10)) {
          slots.push({ x, y, z: 1 });
        }
      }
    }
    slots.push({ x: 10, y: 8, z: 2 });
    if (slots.length % 2 !== 0) slots.pop();
    return slots;
  }
  if (sourceKey === 'local:wisdom52') {
    const slots = [];
    for (let y = 0; y <= 14; y += 2) {
      for (let x = 4; x <= 20; x += 2) {
        slots.push({ x, y, z: 0 }); // 9 x 8 = 72
      }
    }
    for (let y = 4; y <= 10; y += 2) {
      for (let x = 8; x <= 16; x += 2) {
        slots.push({ x, y, z: 1 }); // 5 x 4 = 20
      }
    }
    slots.push({ x: 12, y: 6, z: 2 });
    slots.push({ x: 12, y: 8, z: 2 });
    slots.push({ x: 10, y: 7, z: 2 });
    slots.push({ x: 14, y: 7, z: 2 }); // 4
    return slots; // 72 + 20 + 4 = 96
  }
  return [];
}

async function main() {
  console.log('Downloading and compiling 50 layouts...');
  const compiled = [];

  for (const spec of LEVEL_SPECS) {
    let slots = [];
    if (spec.source.startsWith('local:')) {
      slots = getLocalSlots(spec.source);
    } else {
      const url = `https://raw.githubusercontent.com/ffalt/mahseum/main/${spec.source.replace('mahseum:', '')}`;
      const raw = await fetch(url);
      slots = parseLayout(raw);
    }

    // Safety checks
    if (slots.length === 0) {
      console.error(`ERROR: Empty slots for level ${spec.num} (${spec.name})!`);
      process.exit(1);
    }

    if (slots.length % 2 !== 0) {
      console.warn(`WARNING: Level ${spec.num} (${spec.name}) has odd count ${slots.length}. Adjusting...`);
      slots.pop();
    }

    console.log(`[Level ${spec.num.toString().padStart(2, ' ')}] ${spec.name.padEnd(28, ' ')} -> ${slots.length} peças (Z: 0..${Math.max(...slots.map(s => s.z))})`);

    compiled.push({
      ...spec,
      slots
    });
  }

  // Generate TypeScript code
  let ts = `// ═══════════════════════════════════════════════════════════════════\n`;
  ts += `// CATALOGO OFICIAL DE 50 NÍVEIS — MAHJONG SOLITAIRE (100% OFFLINE)\n`;
  ts += `// Curadoria: Clássicos de KMahjongg, Gnome, Pysolfc, OGS & Solitile\n`;
  ts += `// ═══════════════════════════════════════════════════════════════════\n\n`;
  ts += `import { BoardLayout, LayoutSlot } from '../types';\n\n`;

  ts += `export interface WorldGroup {\n`;
  ts += `  id: string;\n`;
  ts += `  title: string;\n`;
  ts += `  description: string;\n`;
  ts += `  levelRange: [number, number];\n`;
  ts += `}\n\n`;

  ts += `export const WORLDS: WorldGroup[] = [\n`;
  ts += `  {\n`;
  ts += `    id: 'world-1',\n`;
  ts += `    title: 'Mundo 1: Jardim do Aprendiz',\n`;
  ts += `    description: 'Começo suave e relaxante com poucas peças (30 a 72).',\n`;
  ts += `    levelRange: [1, 10]\n`;
  ts += `  },\n`;
  ts += `  {\n`;
  ts += `    id: 'world-2',\n`;
  ts += `    title: 'Mundo 2: Vale das Criaturas',\n`;
  ts += `    description: 'Silhuetas de animais e formas dinâmicas (72 a 88 peças).',\n`;
  ts += `    levelRange: [11, 20]\n`;
  ts += `  },\n`;
  ts += `  {\n`;
  ts += `    id: 'world-3',\n`;
  ts += `    title: 'Mundo 3: Labirintos & Santuários',\n`;
  ts += `    description: 'Padrões complexos e camadas concêntricas (92 a 118 peças).',\n`;
  ts += `    levelRange: [21, 30]\n`;
  ts += `  },\n`;
  ts += `  {\n`;
  ts += `    id: 'world-4',\n`;
  ts += `    title: 'Mundo 4: Grandes Estruturas',\n`;
  ts += `    description: 'Monumentos majestosos de alta estratégia (120 a 136 peças).',\n`;
  ts += `    levelRange: [31, 40]\n`;
  ts += `  },\n`;
  ts += `  {\n`;
  ts += `    id: 'world-5',\n`;
  ts += `    title: 'Mundo 5: Templo dos Mestres',\n`;
  ts += `    description: 'Os maiores clássicos do Mahjong Solitaire de 144 peças.',\n`;
  ts += `    levelRange: [41, 50]\n`;
  ts += `  }\n`;
  ts += `];\n\n`;

  // Output layouts array
  ts += `export const CATALOG_50_LAYOUTS: BoardLayout[] = [\n`;
  for (const l of compiled) {
    ts += `  {\n`;
    ts += `    id: ${JSON.stringify(l.id)},\n`;
    ts += `    name: ${JSON.stringify(l.name)},\n`;
    ts += `    description: ${JSON.stringify(l.description)},\n`;
    ts += `    difficulty: ${JSON.stringify(l.difficulty)},\n`;
    ts += `    slots: [\n`;
    // Chunk slots into lines of 4 for clean formatting
    for (let i = 0; i < l.slots.length; i += 4) {
      const slice = l.slots.slice(i, i + 4);
      const str = slice.map(s => `{ x: ${s.x}, y: ${s.y}, z: ${s.z} }`).join(', ');
      ts += `      ${str},\n`;
    }
    ts += `    ]\n`;
    ts += `  },\n`;
  }
  ts += `];\n`;

  fs.writeFileSync('src/core/layouts/catalog50.ts', ts, 'utf8');
  console.log(`\nSUCCESS! Created src/core/layouts/catalog50.ts with 50 layouts!`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
