import { TileDefinition, TileBiome, AnimalValue } from '../types';
import { TileRegistry } from './tiles/TileRegistry';

export interface LevelSynergyInfo {
  title: string;
  icon: string;
  description: string;
  partnerValues: [AnimalValue, AnimalValue];
  partnerLabels: [string, string];
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  CURADOR ECOLÓGICO DE BARALHO & SINERGIAS (LEVEL DECK CURATOR)
 *  Garante co-ocorrência biológica (≥85%) de parceiros de sinergia na mesma
 *  onda e seleciona fauna/elementos perfeitamente harmonizados com o bioma.
 * ═══════════════════════════════════════════════════════════════════════════
 */
export class LevelDeckCurator {
  /**
   * Biomas complementares para preenchimento de diversidade quando necessário
   */
  private static readonly COMPANION_BIOMES: Record<TileBiome, TileBiome[]> = {
    water: ['garden', 'arctic', 'forest'],
    arctic: ['water', 'forest'],
    forest: ['garden', 'savanna', 'water'],
    savanna: ['forest', 'water'],
    garden: ['forest', 'water', 'savanna'],
  };

  /**
   * Constrói os pares da onda garantindo que animais e seus alvos sinérgicos
   * coexistam no mesmo tabuleiro, eliminando cenários de parceiros ausentes.
   */
  public static curateWavePairs(
    biome: TileBiome,
    pairsNeeded: number,
    waveIndex: number,
    allowChameleon: boolean = true,
    chameleonChance: number = 0.25,
    worldTier: number = 10
  ): [TileDefinition, TileDefinition][] {
    const selectedPairs: [TileDefinition, TileDefinition][] = [];
    // Filtra apenas espécies desbloqueadas até o mundo/tier atual
    const allEntities = TileRegistry.getByMaxTier(worldTier);

    // 1. Filtrar entidades do bioma principal e companheiros ordenados
    const primaryEntities = allEntities.filter((e) => e.biome === biome);
    const companionList = this.COMPANION_BIOMES[biome] || [];
    const companionEntities = allEntities.filter((e) =>
      companionList.includes(e.biome)
    );

    // Conjunto de candidatos disponíveis com salvaguarda de densidade
    let pool = [...primaryEntities, ...companionEntities];
    if (pool.length < 8) {
      pool = [...allEntities];
    }

    // 2. Mapear pares de sinergia viáveis no pool (ambos devem estar no tier)
    const synergyCouples: [AnimalValue, AnimalValue][] = [];
    const seenCouples = new Set<string>();

    for (const ent of (primaryEntities.length > 0 ? primaryEntities : allEntities)) {
      for (const synVal of ent.synergiesWith) {
        if (TileRegistry.getTier(synVal) > worldTier) continue;
        const coupleKey = [ent.value, synVal].sort().join('::');
        if (!seenCouples.has(coupleKey)) {
          seenCouples.add(coupleKey);
          synergyCouples.push([ent.value, synVal]);
        }
      }
    }

    // Embaralhar as duplas de sinergia para variar a cada partida
    synergyCouples.sort(() => Math.random() - 0.5);

    const resolveSuit = (cat: string): import('../types').TileSuit => {
      if (cat === 'flora') return 'flora';
      if (cat === 'mythic') return 'mythic';
      if (cat === 'natural_element') return 'element';
      return 'animal';
    };

    // 3. Adicionar duplas de sinergia garantindo co-ocorrência (2 pares por dupla)
    let addedPairsCount = 0;
    for (const [valA, valB] of synergyCouples) {
      if (addedPairsCount + 2 > pairsNeeded) break;

      const entA = TileRegistry.get(valA);
      const entB = TileRegistry.get(valB);

      // Adiciona par A
      selectedPairs.push([
        {
          id: `animal-${entA.value}_w${waveIndex}_p1_${addedPairsCount}`,
          suit: resolveSuit(entA.category),
          value: entA.value,
          label: entA.label,
        },
        {
          id: `animal-${entA.value}_w${waveIndex}_p2_${addedPairsCount}`,
          suit: resolveSuit(entA.category),
          value: entA.value,
          label: entA.label,
        },
      ]);
      addedPairsCount++;

      // Adiciona par B (parceiro sinérgico garantido!)
      selectedPairs.push([
        {
          id: `animal-${entB.value}_w${waveIndex}_p1_${addedPairsCount}`,
          suit: resolveSuit(entB.category),
          value: entB.value,
          label: entB.label,
        },
        {
          id: `animal-${entB.value}_w${waveIndex}_p2_${addedPairsCount}`,
          suit: resolveSuit(entB.category),
          value: entB.value,
          label: entB.label,
        },
      ]);
      addedPairsCount++;
    }

    // 4. Se ainda faltam pares para preencher a quota da onda, completa com o pool temático
    const fallbackPool = [...pool].sort(() => Math.random() - 0.5);
    let fallbackIdx = 0;

    while (addedPairsCount < pairsNeeded) {
      const ent = fallbackPool[fallbackIdx % fallbackPool.length];
      selectedPairs.push([
        {
          id: `animal-${ent.value}_w${waveIndex}_p1_${addedPairsCount}`,
          suit: resolveSuit(ent.category),
          value: ent.value,
          label: ent.label,
        },
        {
          id: `animal-${ent.value}_w${waveIndex}_p2_${addedPairsCount}`,
          suit: resolveSuit(ent.category),
          value: ent.value,
          label: ent.label,
        },
      ]);
      addedPairsCount++;
      fallbackIdx++;
    }

    // 5. Inserção do Camaleão Coringa se permitido
    if (allowChameleon && pairsNeeded >= 4 && Math.random() < chameleonChance) {
      const chamDef: TileDefinition = {
        id: `animal-chameleon-wave-${waveIndex}`,
        suit: 'animal',
        value: 'chameleon',
        label: '🦎 Camaleão',
      };
      selectedPairs[0] = [
        chamDef,
        { ...chamDef, id: `${chamDef.id}_pair` },
      ];
    }

    return selectedPairs;
  }

  private static readonly SYNERGY_PAIR_TITLES: Record<string, string> = {
    'bear::honeycomb': 'Banquete de Mel',
    'bear::fish': 'Pesca do Urso',
    'fish::penguin': 'Mergulho Glacial',
    'cat::fish': 'Pata Ágil',
    'cat::dog': 'Harmonia Amiga',
    'shell::turtle': 'Casco Ancestral',
    'dolphin::shell': 'Eco Sonar',
    'apple::hedgehog': 'Pomar Silvestre',
    'apple::rabbit': 'Salto do Pomar',
    'bee::honeycomb': 'Enxame Dourado',
    'banana::monkey': 'Salto na Copa',
    'acorn::squirrel': 'Toca de Inverno',
    'frog::ladybug': 'Língua Veloz',
    'acorn::panda': 'Bambu Zen',
    'acorn::elephant': 'Passo Monumental',
    'duck::fish': 'Mergulho na Lagoa',
    'butterfly::lotus': 'Metamorfose Floral',
    'butterfly::cherry_blossom': 'Metamorfose Floral',
    'frog::lotus': 'Lagoa Serena',
    'bee::sunflower': 'Dança Solar',
    'ladybug::rose': 'Guardiã Floral',
    'monkey::hibiscus': 'Brisa Tropical',
    'rabbit::tulip': 'Jardim Florido',
    'panda::white_flower': 'Paz dos Bosques',
    'bee::daisy': 'Campo Aberto',
    'hedgehog::hyacinth': 'Perfume Silvestre',
    'bouquet::dog': 'Harmonia Floral',
    'bear::wilted_flower': 'Resiliência Glacial',
    'fish::seal': 'Deslize no Gelo',
    'penguin::seal': 'Harmonia Glacial',
    'bear::whale': 'Gigantes do Norte',
    'fish::whale': 'Banquete Glacial',
    'dolphin::spouting_whale': 'Canto dos Mares',
    'orca::seal': 'Sentinelas do Ártico',
    'coral::tropical_fish': 'Cores do Recife',
    'blowfish::shell': 'Defesa Espinhosa',
    'fish::shark': 'Caçador dos Mares',
    'octopus::shell': 'Camuflagem Abissal',
    'dolphin::jellyfish': 'Dança Bioluminescente',
    'dragon::lotus': 'Dragão Celestial',
    'dragon::phoenix': 'União Mítica',
    'dragon::dragon_face': 'Chama Sagrada',
    'bat::owl': 'Sentinelas da Noite',
    'eagle::feather': 'Visão Panorâmica',
    'cherry_blossom::peacock': 'Leque Deslumbrante',
    'dove::white_flower': 'Bênção da Calma',
    'lotus::swan': 'Graça na Lagoa',
    'flamingo::tropical_fish': 'Harmonia Rosa',
    'banana::parrot': 'Eco das Matas',
    'chicken::turkey': 'Dança Campestre',
    'chicken::rooster': 'Despertar Solar',
    'baby_chick::hatching_chick': 'Novo Despertar',
    'baby_chick::chicken': 'Terreiro Zen',
    'front_chick::sunflower': 'Fofura Matinal',
    'acorn::dodo': 'Passo Esquecido',
    'duck::goose': 'Revoada na Lagoa',
    'black_bird::owl': 'Voo da Penumbra',
    'bird::feather': 'Leveza do Vento',
    'dove::wing': 'Ascensão Livre',
    'polar_bear::wolf': 'Aliança Polar',
    'moose::wolf': 'Sentinelas do Norte',
    'llama::ram': 'Passo dos Andes',
    'goat::ram': 'Picos das Montanhas',
    'giraffe::zebra': 'Vigia da Savana',
    'elephant::rhino': 'Impacto Blindado',
    'crocodile::hippo': 'Domínio das Águas',
    'leopard::tiger': 'Predadores da Selva',
    'tiger::tiger_face': 'Fúria Felina',
    'gorilla::monkey': 'Irmandade da Copa',
    'banana::orangutan': 'Paz da Selva',
    'camel::two_hump_camel': 'Caravana Solar',
    'kangaroo::rabbit': 'Salto Mestre',
    'koala::sloth': 'Calma Absoluta',
    'badger::skunk': 'Defensores da Mata',
    'beaver::otter': 'Engenheiros do Rio',
    'frog::snake': 'Sombra da Grama',
    'sauropod::t_rex': 'Confronto Pré-Histórico',
    'elephant::mammoth': 'Linhagem Ancestral',
    'dog::paw_prints': 'Trilha do Melhor Amigo',
    'bird::grapes': 'Voo Rasante',
    'fox::grapes': 'Rastro Astuto',
    'lion::sun': 'Rugido Radiante',
    'leaf::snail': 'Passo Sereno',
    'sprout::worm': 'Germinação',
    'panda::potted_plant': 'Cultivo Zen',
    'pine_tree::squirrel': 'Sombra da Mata',
    'bear::pine_tree': 'Guardião dos Bosques',
    'bird::deciduous_tree': 'Copa Acolhedora',
    'deciduous_tree::owl': 'Copa Sábia',
    'monkey::palm_tree': 'Brisa Tropical',
    'cactus::camel': 'Reserva Solar',
    'mouse::rice_plant': 'Colheita Zen',
    'herb::turtle': 'Graça dos Bosques',
    'ladybug::shamrock': 'Sorte Simples',
    'four_leaf_clover::ladybug': 'Trevo da Fortuna',
    'maple_leaf::squirrel': 'Outono Dourado',
    'fallen_leaves::hedgehog': 'Caminho de Outono',
    'bird::wind_leaf': 'Sopro Livre',
    'bird::empty_nest': 'Refúgio na Copa',
    'bird::nest_eggs': 'Novo Ciclo',
    'bare_tree::owl': 'Silêncio do Inverno',
    'bare_tree::wolf': 'Uivo Hibernal',
    'butterfly::caterpillar': 'Metamorfose',
    'ant::fallen_leaves': 'Força Coletiva',
    'beetle::pine_tree': 'Carapaça de Ferro',
    'cricket::frog': 'Canto Noturno',
    'ant::cockroach': 'Resistência Imparável',
    'spider::spider_web': 'Fio de Seda',
    'camel::scorpion': 'Ferrão do Sol',
    'frog::mosquito': 'Zumbido do Brejo',
    'chameleon::fly': 'Bote Veloz',
    'fly::frog': 'Reflexos Ágeis',
    'microbe::sprout': 'Vida Primordial',
    'monkey::monkey_face': 'Travessura Tropical',
    'dog_full::sheep': 'Pastoreio Leal',
    'dog::guide_dog': 'Guia Companheiro',
    'dog::service_dog': 'Guardião Dedicado',
    'bouquet::poodle': 'Elegância Pura',
    'fox::raccoon': 'Mãos Ágeis',
    'cat::cat_full': 'Caçador Sereno',
    'black_cat::cat': 'Mistério da Meia-Noite',
    'horse::horse_face': 'Espírito Veloz',
    'horse::zebra': 'Galope Livre',
    'donkey::horse': 'Paciência Firme',
    'dragon::unicorn': 'Brilho Sagrado',
    'cow::cow_face': 'Manhã Serena',
    'cow::ox': 'Pasto Abundante',
    'ox::water_buffalo': 'Força da Terra',
    'bison::ox': 'Estouro da Manada',
    'pig::pig_face': 'Alegria do Chiqueiro',
    'boar::pig': 'Fartura no Campo',
    'pig::pig_nose': 'Faro Aguçado',
    'ram::sheep': 'Rebanho de Algodão',
    'mouse::mouse_face': 'Astúcia Minúscula',
    'cat::mouse': 'Perseguição Silenciosa',
    'mouse::rat': 'Sobrevivente Ágil',
    'hamster::sunflower': 'Bolsa de Grãos',
    'rabbit::rabbit_full': 'Salto no Campo',
  };

  /**
   * Retorna a lista descritiva de sinergias ativas e possíveis para um bioma de fase
   */
  public static getLevelSynergies(biome: TileBiome): LevelSynergyInfo[] {
    const primaryEntities = TileRegistry.getAll().filter((e) => e.biome === biome);
    const companions = this.COMPANION_BIOMES[biome] || [];
    const pool = TileRegistry.getAll().filter(
      (e) => e.biome === biome || companions.includes(e.biome)
    );

    const synergies: LevelSynergyInfo[] = [];
    const seen = new Set<string>();

    for (const ent of primaryEntities) {
      for (const partnerVal of ent.synergiesWith) {
        const partner = pool.find((p) => p.value === partnerVal);
        if (!partner) continue;

        const key = [ent.value, partner.value].sort().join('::');
        if (seen.has(key)) continue;
        seen.add(key);

        const title = this.SYNERGY_PAIR_TITLES[key] || ent.synergyTitle || `${ent.label} & ${partner.label}`;
        const icon = `${ent.emoji}${partner.emoji}`;
        const description = `${ent.label} e ${partner.label} interagem liberando pares e bônus de harmonia zen.`;

        synergies.push({
          title,
          icon,
          description,
          partnerValues: [ent.value, partner.value],
          partnerLabels: [ent.label, partner.label],
        });
      }
    }

    return synergies;
  }
}
