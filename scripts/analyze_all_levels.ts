import { CATALOG_50_LAYOUTS } from '../src/core/layouts/index.js';
import { LEVEL_RULES_BY_NUMBER } from '../src/core/levelRules.js';
import { WORLDS } from '../src/core/layouts/worlds.js';

interface LevelStat {
  id: number;
  name: string;
  worldId: number;
  worldName: string;
  difficulty: string;
  totalSlots: number;
  waveCount: number;
  waveDistribution: number[];
  zMax: number;
  zDistribution: Record<number, number>;
  gridBounds: { minX: number; maxX: number; minY: number; maxY: number; width: number; height: number };
  initialFreeSlots: number;
  initialBlockedSlots: number;
  freeRatio: number;
  biome: string;
  allowedSpecials: string[];
  maxSpecialPairs: number;
  allowChameleon: boolean;
  chameleonChance: number;
}

function isSlotInitiallyFree(slot: { x: number; y: number; z: number }, allSlots: { x: number; y: number; z: number }[]): boolean {
  // Check if tile has any tile directly on top (same x, y with z > current.z, or overlapping z+1 within distance < 2)
  const hasTileAbove = allSlots.some(other => 
    other.z > slot.z && 
    Math.abs(other.x - slot.x) < 2 && 
    Math.abs(other.y - slot.y) < 2
  );
  if (hasTileAbove) return false;

  // Check left and right blocking on same z
  const hasLeft = allSlots.some(other => 
    other.z === slot.z && 
    (slot.x - other.x) > 0 && (slot.x - other.x) <= 2 &&
    Math.abs(other.y - slot.y) < 2
  );

  const hasRight = allSlots.some(other => 
    other.z === slot.z && 
    (other.x - slot.x) > 0 && (other.x - slot.x) <= 2 &&
    Math.abs(other.y - slot.y) < 2
  );

  return !hasLeft || !hasRight;
}

const stats: LevelStat[] = [];

for (let id = 1; id <= 50; id++) {
  const layout = CATALOG_50_LAYOUTS[id - 1];
  if (!layout) {
    console.error(`Layout ${id} not found!`);
    continue;
  }

  const worldId = Math.floor((id - 1) / 10) + 1;
  const world = WORLDS.find(w => w.id === worldId);
  const rules = LEVEL_RULES_BY_NUMBER[id] || {};

  const slots = layout.slots || [];
  const waveDistribution = layout.waves ? layout.waves.map(w => w.slots.length) : [slots.length];
  const waveCount = waveDistribution.length;

  let minX = 999, maxX = -999, minY = 999, maxY = -999, zMax = 0;
  const zDistribution: Record<number, number> = {};

  // For initial free slots, we evaluate wave 0 slots (or all slots if single wave)
  const activeFirstSlots = layout.waves && layout.waves.length > 0 ? layout.waves[0].slots : slots;

  for (const s of slots) {
    if (s.x < minX) minX = s.x;
    if (s.x > maxX) maxX = s.x;
    if (s.y < minY) minY = s.y;
    if (s.y > maxY) maxY = s.y;
    if (s.z > zMax) zMax = s.z;
    zDistribution[s.z] = (zDistribution[s.z] || 0) + 1;
  }

  let initialFree = 0;
  for (const s of activeFirstSlots) {
    if (isSlotInitiallyFree(s, activeFirstSlots)) {
      initialFree++;
    }
  }

  const initialBlocked = activeFirstSlots.length - initialFree;
  const freeRatio = activeFirstSlots.length > 0 ? Math.round((initialFree / activeFirstSlots.length) * 100) : 0;

  stats.push({
    id,
    name: layout.name,
    worldId,
    worldName: world ? world.name : `Mundo ${worldId}`,
    difficulty: layout.difficulty || 'medium',
    totalSlots: slots.length,
    waveCount,
    waveDistribution,
    zMax,
    zDistribution,
    gridBounds: { minX, maxX, minY, maxY, width: maxX - minX + 2, height: maxY - minY + 2 },
    initialFreeSlots: initialFree,
    initialBlockedSlots: initialBlocked,
    freeRatio,
    biome: rules.biome || 'meadow',
    allowedSpecials: rules.allowedSpecials || [],
    maxSpecialPairs: rules.maxSpecialPairs || 0,
    allowChameleon: !!rules.allowChameleon,
    chameleonChance: rules.chameleonChance || 0
  });
}

import * as fs from 'fs';
fs.writeFileSync('scripts/levels_analysis_dump.json', JSON.stringify(stats, null, 2), 'utf-8');
console.log('Successfully generated scripts/levels_analysis_dump.json with all 50 levels.');
