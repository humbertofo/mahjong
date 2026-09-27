import { PlacedTile, SynergyResult, AnimalValue } from '../../types';
import { TileRegistry } from '../tiles/TileRegistry';
import { TheatricalSynergies } from './handlers/TheatricalSynergies';
import { ForagingSynergies } from './handlers/ForagingSynergies';

export class SynergyRegistry {
  /**
   * Avalia declarativamente todas as possíveis sinergias da natureza
   * com suporte a Resolução em Cascata (Bandeja ➔ Mesa ➔ Dádiva Zen)
   */
  public static evaluate(
    t1: PlacedTile,
    t2: PlacedTile,
    getActiveBoardTiles: () => PlacedTile[],
    onShuffleRemaining: () => void,
    tray: PlacedTile[] = []
  ): SynergyResult | null {
    const v1 = t1.value;
    const v2 = t2.value;

    // 1. Camaleão Coringa
    const chameleon = ForagingSynergies.checkWildcardChameleon(v1, v2);
    if (chameleon) return chameleon;

    const activeTiles = getActiveBoardTiles();

    // 2. Sinergias Teatrais Cênicas
    const frog = TheatricalSynergies.checkFrogTongue(v1, v2, activeTiles, tray);
    if (frog) return frog;

    const cat = TheatricalSynergies.checkCatPaw(v1, v2, activeTiles, tray);
    if (cat) return cat;

    const bear = TheatricalSynergies.checkBearFeast(v1, v2, activeTiles, tray);
    if (bear) return bear;

    const dolphin = TheatricalSynergies.checkDolphinSonar(v1, v2, activeTiles, tray);
    if (dolphin) return dolphin;

    const penguin = TheatricalSynergies.checkPenguinSlide(v1, v2, activeTiles, tray);
    if (penguin) return penguin;

    const panda = TheatricalSynergies.checkPandaZen(v1, v2, activeTiles, tray);
    if (panda) return panda;

    const elephant = TheatricalSynergies.checkElephantCrush(v1, v2, activeTiles, tray);
    if (elephant) return elephant;

    // 3. Sinergias de Forrageamento e Colheita
    const bee = ForagingSynergies.checkBeeHoney(v1, v2, activeTiles, tray);
    if (bee) return bee;

    const monkey = ForagingSynergies.checkMonkeyBanana(v1, v2, onShuffleRemaining);
    if (monkey) return monkey;

    const squirrel = ForagingSynergies.checkSquirrelAcorn(v1, v2, activeTiles, tray);
    if (squirrel) return squirrel;

    const hedgehog = ForagingSynergies.checkHedgehogApple(v1, v2, activeTiles, tray);
    if (hedgehog) return hedgehog;

    const turtle = ForagingSynergies.checkTurtleShield(v1, v2, activeTiles, tray);
    if (turtle) return turtle;

    const rabbit = ForagingSynergies.checkRabbitHop(v1, v2, activeTiles, tray);
    if (rabbit) return rabbit;

    const fox = ForagingSynergies.checkFoxTrail(v1, v2, activeTiles, tray);
    if (fox) return fox;

    const dogCat = ForagingSynergies.checkDogCatHarmony(v1, v2, activeTiles, tray);
    if (dogCat) return dogCat;

    const butterfly = ForagingSynergies.checkButterflyFlap(v1, v2, activeTiles, tray);
    if (butterfly) return butterfly;

    const duck = ForagingSynergies.checkDuckSplash(v1, v2, activeTiles, tray);
    if (duck) return duck;

    const lion = ForagingSynergies.checkLionRoar(v1, v2, activeTiles, tray);
    if (lion) return lion;

    const bird = ForagingSynergies.checkBirdSwoop(v1, v2, activeTiles, tray);
    if (bird) return bird;

    const snail = ForagingSynergies.checkSnailZen(v1, v2, activeTiles, tray);
    if (snail) return snail;

    // 4. Sinergias Dinâmicas da Flora & Reino Marinho (Laços da Natureza)
    if (v1 !== v2 && (TileRegistry.areSynergistic(v1, v2) || TileRegistry.areSynergistic(v2, v1))) {
      const ent1 = TileRegistry.get(v1);
      const ent2 = TileRegistry.get(v2);
      const title = ent1.synergyTitle || ent2.synergyTitle || `${ent1.label} & ${ent2.label}`;
      const isFlora = ent1.category === 'flora' || ent2.category === 'flora';
      const isMarine = ent1.biome === 'water' || ent2.biome === 'water' || ent1.biome === 'arctic' || ent2.biome === 'arctic';
      const isMythic = ent1.category === 'mythic' || ent2.category === 'mythic';
      const type: import('../../types').SynergyType = isMythic
        ? 'mythic_harmony'
        : isFlora
        ? 'floral_harmony'
        : isMarine
        ? 'marine_abyss'
        : 'nature_harmony';

      return {
        type,
        title: isMythic ? `🐉 ${title}!` : `✨ ${title}!`,
        description: `${ent1.label} e ${ent2.label} uniram-se em perfeita harmonia com a natureza!`,
        bonusScore: isMythic ? 300 : 220,
      };
    }

    return null;
  }

  /**
   * Determina se dois valores formam um par de sinergia da natureza
   * Fonte Única de Verdade delegada ao TileRegistry canônico
   */
  public static areSynergistic(v1: string, v2: string): boolean {
    return TileRegistry.areSynergistic(v1 as AnimalValue, v2 as AnimalValue);
  }

  /**
   * Determina se uma sinergia requer animação cênica teatral mantendo atores visíveis
   */
  public static isTheatrical(synergy: SynergyResult | null | undefined): boolean {
    if (!synergy) return false;
    return (
      synergy.type === 'frog_tongue' ||
      synergy.type === 'cat_paw' ||
      synergy.type === 'bear_feast' ||
      synergy.type === 'dolphin_sonar'
    );
  }
}
