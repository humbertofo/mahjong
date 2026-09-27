import { BoardLayout } from '../types';
import { WorldGroup, WORLDS } from './worlds';

import { level01Layout } from './levels/level01_garden_tutorial';
import { level02Layout } from './levels/level02_beginner_step';
import { level03Layout } from './levels/level03_mini_zen';
import { level04Layout } from './levels/level04_heart_wisdom';
import { level05Layout } from './levels/level05_mini_traditional';
import { level06Layout } from './levels/level06_jade_butterfly';
import { level07Layout } from './levels/level07_royal_diamond';
import { level08Layout } from './levels/level08_forest_reindeer';
import { level09Layout } from './levels/level09_morning_star';
import { level10Layout } from './levels/level10_peace_wall';
import { level11Layout } from './levels/level11_radiant_smile';
import { level12Layout } from './levels/level12_lucky_clover';
import { level13Layout } from './levels/level13_short_4_winds';
import { level14Layout } from './levels/level14_fiesta_viva';
import { level15Layout } from './levels/level15_animal_cross';
import { level16Layout } from './levels/level16_stellar_orbit';
import { level17Layout } from './levels/level17_twin_waves';
import { level18Layout } from './levels/level18_panda_wisdom';
import { level19Layout } from './levels/level19_retro_joystick';
import { level20Layout } from './levels/level20_bamboo_valley';
import { level21Layout } from './levels/level21_stone_arena';
import { level22Layout } from './levels/level22_rising_sun';
import { level23Layout } from './levels/level23_ruby_heart';
import { level24Layout } from './levels/level24_wisdom_52';
import { level25Layout } from './levels/level25_saturn_rings';
import { level26Layout } from './levels/level26_celestial_pong';
import { level27Layout } from './levels/level27_mystic_labyrinth';
import { level28Layout } from './levels/level28_guardian_totem';
import { level29Layout } from './levels/level29_river_bridge';
import { level30Layout } from './levels/level30_earth_pillars';
import { level31Layout } from './levels/level31_three_crowns';
import { level32Layout } from './levels/level32_iron_chains';
import { level33Layout } from './levels/level33_mystic_swirl';
import { level34Layout } from './levels/level34_polar_star';
import { level35Layout } from './levels/level35_golden_dome';
import { level36Layout } from './levels/level36_four_winds';
import { level37Layout } from './levels/level37_olympic_stadium';
import { level38Layout } from './levels/level38_master_key';
import { level39Layout } from './levels/level39_pentagram_sanctuary';
import { level40Layout } from './levels/level40_lost_atlantis';
import { level41Layout } from './levels/level41_spiral_galaxy';
import { level42Layout } from './levels/level42_four_bridges';
import { level43Layout } from './levels/level43_ziggurat_temple';
import { level44Layout } from './levels/level44_four_hills';
import { level45Layout } from './levels/level45_red_dragon';
import { level46Layout } from './levels/level46_celestial_cloud';
import { level47Layout } from './levels/level47_imperial_cat';
import { level48Layout } from './levels/level48_soaring_eagle';
import { level49Layout } from './levels/level49_sacred_altar';
import { level50Layout } from './levels/level50_classic_shanghai';

export { WORLDS, type WorldGroup };

/**
 * ═══════════════════════════════════════════════════════════════
 *  ESTEIRA OFICIAL DE FASES (50 NÍVEIS MODULARES)
 *  Cada nível é um módulo isolado em src/core/layouts/levels/
 * ═══════════════════════════════════════════════════════════════
 */
export const CATALOG_50_LAYOUTS: BoardLayout[] = [
  level01Layout,
  level02Layout,
  level03Layout,
  level04Layout,
  level05Layout,
  level06Layout,
  level07Layout,
  level08Layout,
  level09Layout,
  level10Layout,
  level11Layout,
  level12Layout,
  level13Layout,
  level14Layout,
  level15Layout,
  level16Layout,
  level17Layout,
  level18Layout,
  level19Layout,
  level20Layout,
  level21Layout,
  level22Layout,
  level23Layout,
  level24Layout,
  level25Layout,
  level26Layout,
  level27Layout,
  level28Layout,
  level29Layout,
  level30Layout,
  level31Layout,
  level32Layout,
  level33Layout,
  level34Layout,
  level35Layout,
  level36Layout,
  level37Layout,
  level38Layout,
  level39Layout,
  level40Layout,
  level41Layout,
  level42Layout,
  level43Layout,
  level44Layout,
  level45Layout,
  level46Layout,
  level47Layout,
  level48Layout,
  level49Layout,
  level50Layout,
];

export const ALL_LAYOUTS: BoardLayout[] = CATALOG_50_LAYOUTS;

export function getLayoutById(id: string): BoardLayout {
  const found = ALL_LAYOUTS.find((l) => l.id === id);
  if (!found) {
    console.warn(`[getLayoutById] Layout "${id}" não encontrado, usando o primeiro como fallback`);
    return ALL_LAYOUTS[0];
  }
  return found;
}

export function getLayoutByLevelNumber(levelNum: number): BoardLayout {
  const index = Math.max(0, Math.min(levelNum - 1, ALL_LAYOUTS.length - 1));
  return ALL_LAYOUTS[index];
}
