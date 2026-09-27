import { BoardEngine } from '../src/core/BoardEngine';
import { CATALOG_50_LAYOUTS } from '../src/core/layouts/index';

console.log('================================================================');
console.log('🧪 VALIDAÇÃO EXAUSTIVA DE TODOS OS CENÁRIOS DE FIM DE FASE');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    console.error(`  ❌ [FAIL] ${testName} ${details ? '- ' + details : ''}`);
  }
}

// -------------------------------------------------------------
// CENÁRIO 1: Último par da mesa é combinado (MATCH), mas resta 1 peça no slot
// -------------------------------------------------------------
console.log('🔹 Cenário 1: Mesa acaba com MATCH e resta 1 peça no slot');
{
  const engine = new BoardEngine(CATALOG_50_LAYOUTS[0], 0);
  const active = engine.getActiveBoardTiles();
  const t1 = active[0];
  const t2 = active[1];
  t1.suit = 'bamboo'; t1.value = '1';
  t2.suit = 'bamboo'; t2.value = '1';

  // Remove o resto
  for (let i = 2; i < active.length; i++) active[i].isRemoved = true;

  // 1 Peça órfã no slot
  const orphan = { ...active[2], id: 'orphan-1', suit: 'circle' as any, value: '9', inTray: true, isRemoved: false };
  (engine as any).tray = [orphan];

  engine.selectTile(t1.id);
  const res = engine.selectTile(t2.id);

  assert(res.action === 'matched', 'Ação registrada como matched');
  assert(res.cosmicRescue !== undefined && res.cosmicRescue.length === 1, 'Resgate Cósmico detectou e retornou a peça órfã');
  assert(res.tray.length === 0, 'Bandeja ficou 100% vazia após resgate');
  assert(res.waveCleared === true, 'Onda marcada como concluída (waveCleared = true)');
  assert(engine.isVictory() === true, 'Vitória concedida com sucesso');
}

// -------------------------------------------------------------
// CENÁRIO 2: Mesa acaba com MATCH e restam 2 peças no slot
// -------------------------------------------------------------
console.log('\n🔹 Cenário 2: Mesa acaba com MATCH e restam 2 peças distintas no slot');
{
  const engine = new BoardEngine(CATALOG_50_LAYOUTS[0], 0);
  const active = engine.getActiveBoardTiles();
  const t1 = active[0];
  const t2 = active[1];
  t1.suit = 'bamboo'; t1.value = '1';
  t2.suit = 'bamboo'; t2.value = '1';

  for (let i = 2; i < active.length; i++) active[i].isRemoved = true;
  engine.invalidateCache();

  const orphan1 = { ...active[2], id: 'orphan-1', suit: 'circle' as any, value: '9', inTray: true, isRemoved: false };
  const orphan2 = { ...active[3], id: 'orphan-2', suit: 'character' as any, value: '5', inTray: true, isRemoved: false };
  (engine as any).tray = [orphan1, orphan2];

  engine.selectTile(t1.id);
  const res = engine.selectTile(t2.id);

  assert(res.cosmicRescue !== undefined && res.cosmicRescue.length === 2, 'Resgate Cósmico salvou ambas as 2 peças órfãs');
  assert(engine.getHarmonyScore() >= 400, 'Pontos bônus de harmonia zen concedidos');
  assert(engine.isVictory() === true, 'Vitória detectada mesmo com 2 peças no slot');
}

// -------------------------------------------------------------
// CENÁRIO 3: Última peça da mesa vai para a bandeja (ADDED sem par)
// -------------------------------------------------------------
console.log('\n🔹 Cenário 3: Última peça da mesa vai para a bandeja (ADDED)');
{
  const engine = new BoardEngine(CATALOG_50_LAYOUTS[0], 0);
  const active = engine.getActiveBoardTiles();
  const t1 = active[0];
  for (let i = 1; i < active.length; i++) active[i].isRemoved = true;
  engine.invalidateCache();

  const res = engine.selectTile(t1.id);

  assert(res.action === 'added', 'Ação registrada como added');
  assert(res.cosmicRescue !== undefined && res.cosmicRescue.length === 1, 'Resgate Cósmico disparado para a última peça');
  assert(res.tray.length === 0, 'Bandeja limpa');
  assert(res.waveCleared === true, 'Onda concluída');
  assert(engine.isVictory() === true, 'Vitória final concedida');
}

// -------------------------------------------------------------
// CENÁRIO 4: Sinergia teatral remove as últimas peças da mesa
// -------------------------------------------------------------
console.log('\n🔹 Cenário 4: Sinergia Teatral esvazia a mesa e resta peça no slot');
{
  const engine = new BoardEngine(CATALOG_50_LAYOUTS[0], 0);
  const active = engine.getActiveBoardTiles();
  const t1 = active[0];
  for (let i = 1; i < active.length; i++) active[i].isRemoved = true;
  engine.invalidateCache();

  const orphan = { ...active[1], id: 'orphan-s', suit: 'wind' as any, value: 'east', inTray: true, isRemoved: false };
  (engine as any).tray = [orphan];

  // Simula finalização teatral
  const rescued = engine.finalizeSynergyMatch([t1]);

  assert(rescued !== null && rescued.length === 1, 'finalizeSynergyMatch acionou o Resgate Cósmico');
  assert(engine.isWaveCleared() === true, 'isWaveCleared retorna true');
  assert(engine.isVictory() === true, 'isVictory retorna true após sinergia');
}

// -------------------------------------------------------------
// CENÁRIO 5: Marreta elimina a última peça da mesa
// -------------------------------------------------------------
console.log('\n🔹 Cenário 5: Marreta elimina a última peça da mesa e resta peça no slot');
{
  const engine = new BoardEngine(CATALOG_50_LAYOUTS[0], 0);
  const active = engine.getActiveBoardTiles();
  const t1 = active[0];
  for (let i = 1; i < active.length; i++) active[i].isRemoved = true;
  engine.invalidateCache();

  const orphan = { ...active[1], id: 'orphan-h', suit: 'dragon' as any, value: 'green', inTray: true, isRemoved: false };
  (engine as any).tray = [orphan];

  const hammerOk = engine.hammerRemove(t1.id);

  assert(hammerOk === true, 'Marreta executada');
  assert(engine.getActiveBoardTiles().length === 0, 'Mesa zerada');
  assert((engine as any).tray.length === 0, 'Slot da bandeja purificado');
  assert(engine.isVictory() === true, 'Vitória concedida após martelada final');
}

// -------------------------------------------------------------
// CENÁRIO 6: Fase Multi-Onda com purificação entre ondas
// -------------------------------------------------------------
console.log('\n🔹 Cenário 6: Fase Multi-Onda (Onda 1 esvazia com peça no slot -> Avança -> Onda 2)');
{
  const engine = new BoardEngine(CATALOG_50_LAYOUTS[14], 3); // Fase 15 (Cruz Sagrada - 78 peças) tem 2 ondas
  assert(engine.getTotalWaves() === 2, 'Fase 15 confirmada com 2 ondas');

  // Força fim da onda 1 com 1 peça no slot
  const activeW1 = engine.getActiveBoardTiles();
  for (let i = 1; i < activeW1.length; i++) activeW1[i].isRemoved = true;
  engine.invalidateCache();

  const resW1 = engine.selectTile(activeW1[0].id);
  assert(resW1.waveCleared === true, 'Onda 1 limpa com sucesso');
  assert(engine.hasMoreWaves() === true, 'Identifica corretamente que há mais ondas');
  assert(engine.isVictory() === false, 'Ainda não é vitória final pois há onda 2');

  // Avança para a Onda 2
  const advanced = engine.advanceToNextWave();
  assert(advanced === true, 'Avanço para a onda 2 efetuado com sucesso');
  assert(engine.getCurrentWave() === 2, 'Agora na onda 2');
  assert(engine.getActiveBoardTiles().length > 0, 'Onda 2 populada com peças novas');

  // Agora finaliza a Onda 2
  const activeW2 = engine.getActiveBoardTiles();
  for (let i = 1; i < activeW2.length; i++) activeW2[i].isRemoved = true;
  engine.invalidateCache();
  const resW2 = engine.selectTile(activeW2[0].id);

  assert(resW2.waveCleared === true, 'Onda 2 limpa');
  assert(engine.hasMoreWaves() === false, 'Não há mais ondas');
  assert(engine.isVictory() === true, 'Vitória final da fase 15 concedida');
}

// -------------------------------------------------------------
// CENÁRIO 7: Varredura nas 50 fases para garantir que todas suportam vitória limpa
// -------------------------------------------------------------
console.log('\n🔹 Cenário 7: Simulação de vitória e salvaguarda em TODAS as 50 fases');
let all50Passed = true;
for (let lvl = 0; lvl < CATALOG_50_LAYOUTS.length; lvl++) {
  const eng = new BoardEngine(CATALOG_50_LAYOUTS[lvl], lvl);
  const tiles = eng.getActiveBoardTiles();
  if (tiles.length > 0) {
    for (let i = 1; i < tiles.length; i++) tiles[i].isRemoved = true;
    eng.invalidateCache();
    (eng as any).tray = [{ ...tiles[0], id: `orphan-lvl-${lvl}`, inTray: true, isRemoved: false }];
    let r = eng.selectTile(tiles[0].id);
    if (r.action === 'special_action' && r.specialEffect === 'ice_cracked') {
      r = eng.selectTile(tiles[0].id);
    }
    if (r.synergy && ['frog_tongue', 'cat_paw', 'bear_feast', 'dolphin_sonar'].includes(r.synergy.type)) {
      eng.finalizeSynergyMatch([tiles[0]]);
    }
    if (!eng.isWaveCleared() || (eng as any).tray.length !== 0) {
      console.log(`❌ Falha na fase ${lvl + 1}: action=${r.action}, waveCleared=${eng.isWaveCleared()}, trayLen=${(eng as any).tray.length}, activeRemaining=${eng.getActiveBoardTiles().length}`);
      all50Passed = false;
    }
  }
}
assert(all50Passed, 'Todas as 50 fases concluem com sucesso com peça restante no slot');

console.log('\n================================================================');
console.log(`📊 RESULTADO FINAL: ${passedTests} de ${totalTests} testes passaram com 100% de sucesso!`);
console.log('================================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
