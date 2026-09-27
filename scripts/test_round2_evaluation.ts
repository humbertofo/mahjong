import { LevelDeckCurator } from '../src/core/nature/LevelDeckCurator';
import { canMatch } from '../src/core/deck';
import { TileRegistry } from '../src/core/nature/tiles/TileRegistry';
import { TileBiome } from '../src/core/types';
import { BoardEngine } from '../src/core/BoardEngine';
import { ZenPowerManager } from '../src/core/engine/ZenPowerManager';

console.log('═══════════════════════════════════════════════════════════════');
console.log('🧪 SEGUNDA RODADA DE AVALIAÇÃO EXAUSTIVA — 157 ENTIDADES');
console.log('═══════════════════════════════════════════════════════════════\n');

// 1. GERAÇÃO EM TODOS OS BIOMAS E TAMANHOS
console.log('🔹 Teste 1: Geração de ondas em todos os 5 biomas e 6 tamanhos de prancha');
const biomes: TileBiome[] = ['garden', 'forest', 'savanna', 'water', 'arctic'];
const sizes = [8, 16, 24, 36, 50, 72];
let totalWavesGenerated = 0;

for (const b of biomes) {
  for (const s of sizes) {
    const pairs = LevelDeckCurator.curateWavePairs(b, s, 0, true, 0.5);
    if (pairs.length !== s) {
      throw new Error(`Tamanho incorreto em ${b}: pedido ${s}, retornado ${pairs.length}`);
    }
    for (const [p1, p2] of pairs) {
      if (!p1.value || !p2.value) throw new Error('Peça sem valor na onda');
      if (!canMatch(p1, p2)) throw new Error(`Par não combina: ${p1.value} e ${p2.value}`);
    }
    totalWavesGenerated++;
  }
}
console.log(`  ✅ [PASS] ${totalWavesGenerated} ondas geradas com 100% de pares compatíveis.`);

// 2. SIMETRIA BIDIRECIONAL DE TODAS AS SINERGIAS
console.log('\n🔹 Teste 2: Validação de simetria bidirecional em todas as sinergias registradas');
const allTiles = TileRegistry.getAll();
let totalSynergiesChecked = 0;
for (const t of allTiles) {
  for (const synVal of t.synergiesWith) {
    const tA = { id: 'a', suit: 'animal' as const, value: t.value, label: t.label };
    const tB = { id: 'b', suit: 'animal' as const, value: synVal, label: synVal };
    if (!canMatch(tA, tB) || !canMatch(tB, tA)) {
      throw new Error(`Sinergia assimétrica entre ${t.value} e ${synVal}`);
    }
    totalSynergiesChecked++;
  }
}
console.log(`  ✅ [PASS] ${totalSynergiesChecked} conexões de sinergia validadas bidirecionalmente.`);

// 3. CAMALEÃO CORINGA UNIVERSAL
console.log('\n🔹 Teste 3: Compatibilidade universal do Camaleão com todas as 157 entidades');
const cham = { id: 'cham', suit: 'animal' as const, value: 'chameleon' as const, label: 'Camaleão' };
for (const t of allTiles) {
  const target = { id: 'target', suit: 'animal' as const, value: t.value, label: t.label };
  if (!canMatch(cham, target) || !canMatch(target, cham)) {
    throw new Error(`Camaleão falhou em combinar com ${t.value}`);
  }
}
console.log('  ✅ [PASS] Camaleão combina universalmente com as 157 entidades em ambas as ordens.');

// 4. EMBARALHAMENTO ZEN PRESERVAÇÃO DE PARIDADE
console.log('\n🔹 Teste 4: Embaralhamento Zen (Shuffle) e preservação estrita de integridade');
const testLayout = {
  id: 'test_layout',
  name: 'Layout Teste',
  description: 'Teste',
  difficulty: 'Fácil' as const,
  slots: [
    { x: 0, y: 0, z: 0 }, { x: 2, y: 0, z: 0 },
    { x: 4, y: 0, z: 0 }, { x: 6, y: 0, z: 0 },
    { x: 0, y: 2, z: 0 }, { x: 2, y: 2, z: 0 },
    { x: 4, y: 2, z: 0 }, { x: 6, y: 2, z: 0 },
  ],
};
const engine = new BoardEngine(testLayout, 0);
const activeBefore = engine.getActiveBoardTiles();
const valuesBefore = activeBefore.map((t) => t.value).sort();
ZenPowerManager.shuffleRemaining(activeBefore, () => {});
const activeAfter = engine.getActiveBoardTiles();
const valuesAfter = activeAfter.map((t) => t.value).sort();

if (valuesBefore.length !== valuesAfter.length) {
  throw new Error('Número de peças alterado após embaralhamento');
}
for (let i = 0; i < valuesBefore.length; i++) {
  if (valuesBefore[i] !== valuesAfter[i]) {
    throw new Error('Valores de peças corrompidos após embaralhamento');
  }
}
console.log('  ✅ [PASS] Embaralhamento preserva 100% da integridade e composição das peças.');

// 5. TESTE DE DICA ZEN (HINT)
console.log('\n🔹 Teste 5: Localização e validação de Dica Zen');
const freeTiles = engine.getFreeTiles();
const hint = ZenPowerManager.getHintPair(freeTiles, engine.getTray());
if (hint) {
  const t1 = engine.getTiles().find((t) => t.id === hint.tile1Id);
  const t2 = engine.getTiles().find((t) => t.id === hint.tile2Id);
  if (!t1 || !t2 || !canMatch(t1, t2)) {
    throw new Error('Dica retornou par inválido');
  }
  console.log(`  ✅ [PASS] Dica Zen encontrou e validou par livre: ${t1.label} + ${t2.label}`);
} else {
  console.log('  ℹ️ [INFO] Nenhuma dica necessária no layout de teste.');
}

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('🎉 RESULTADO: TODOS OS TESTES DA RODADA 2 FORAM APROVADOS COM 100% DE SUCESSO!');
console.log('═══════════════════════════════════════════════════════════════\n');
