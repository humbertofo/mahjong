import { CATALOG_50_LAYOUTS } from '../src/core/layouts/index.js';
import { getLevelRules } from '../src/core/levelRules.js';
import { LevelDeckCurator } from '../src/core/nature/LevelDeckCurator.js';
import { TileRegistry } from '../src/core/nature/tiles/index.js';

console.log('════════════════════════════════════════════════════════════════');
console.log('🧪 TESTE AUTOMATIZADO DA CURADORIA DE TIERS NOS 10 MUNDOS (50 FASES)');
console.log('════════════════════════════════════════════════════════════════');

let totalPairsAudited = 0;
let violationsCount = 0;

for (let lvl = 1; lvl <= 50; lvl++) {
  const layout = CATALOG_50_LAYOUTS[lvl - 1];
  const rules = getLevelRules(layout.id, layout.slots.length);
  const expectedTier = Math.min(10, Math.max(1, Math.ceil(lvl / 5)));

  if (rules.worldTier !== expectedTier) {
    console.error(`❌ [Fase ${lvl}] worldTier inconsistente: esperado ${expectedTier}, obtido ${rules.worldTier}`);
    violationsCount++;
  }

  const waves = layout.waves && layout.waves.length > 0 ? layout.waves : [{ waveNumber: 1, slots: layout.slots }];

  waves.forEach((w, wIdx) => {
    const slotsCount = w.slots.length % 2 === 0 ? w.slots.length : w.slots.length - 1;
    const pairsNeeded = slotsCount / 2;
    const pairs = LevelDeckCurator.curateWavePairs(
      rules.biome,
      pairsNeeded,
      wIdx,
      rules.allowChameleon,
      rules.chameleonChance,
      rules.worldTier || 10
    );

    if (pairs.length !== pairsNeeded) {
      console.error(`❌ [Fase ${lvl} Onda ${wIdx + 1}] Pares insuficientes: esperado ${pairsNeeded}, obtido ${pairs.length}`);
      violationsCount++;
    }

    pairs.forEach(([p1, p2]) => {
      totalPairsAudited++;
      const t1 = TileRegistry.getTier(p1.value);
      const t2 = TileRegistry.getTier(p2.value);

      if (t1 > expectedTier) {
        console.error(`❌ [Fase ${lvl}] Peça p1 ${p1.value} (tier ${t1}) excede o worldTier máximo ${expectedTier}`);
        violationsCount++;
      }
      if (t2 > expectedTier) {
        console.error(`❌ [Fase ${lvl}] Peça p2 ${p2.value} (tier ${t2}) excede o worldTier máximo ${expectedTier}`);
        violationsCount++;
      }
    });
  });
}

console.log(`\n📊 RESULTADO DA AUDITORIA:`);
console.log(`   - Fases testadas: 50/50`);
console.log(`   - Pares gerados e auditados: ${totalPairsAudited}`);
console.log(`   - Violações de Tier detectadas: ${violationsCount}`);

if (violationsCount === 0) {
  console.log(`🎉 SUCESSO TOTAL! 100% dos pares respeitam os 10 Tiers de descoberta progressiva sem exceções!`);
} else {
  process.exit(1);
}
