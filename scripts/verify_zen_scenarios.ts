import { BoardEngine } from '../src/core/BoardEngine';
import { CATALOG_50_LAYOUTS } from '../src/core/layouts/index';
import { TrayTacticalOracle } from '../src/core/nature/TrayTacticalOracle';

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

// -------------------------------------------------------------
// CENÁRIO 8: Trinca Sagrada Zen (3 peças) & Transmutação da 4ª Peça em Camaleão & Undo
// -------------------------------------------------------------
console.log('\n🔹 Cenário 8: Trinca Sagrada Zen (3 peças) & Transmutação da 4ª em Camaleão');
{
  const engine = new BoardEngine(CATALOG_50_LAYOUTS[0], 0);
  const free = engine.getFreeTiles();

  // Configura 4 peças livres de Golfinho (d1, d2, d3, d4) e 1 Leão (l1)
  const d1 = free[0];
  const d2 = free[1];
  const d3 = free[2];
  const d4 = free[3];
  const l1 = free[4] || engine.getActiveBoardTiles().find(t => ![d1.id, d2.id, d3.id, d4.id].includes(t.id))!;

  d1.value = 'dolphin'; d1.suit = 'animal'; d1.specialType = 'normal';
  d2.value = 'dolphin'; d2.suit = 'animal'; d2.specialType = 'normal';
  d3.value = 'dolphin'; d3.suit = 'animal'; d3.specialType = 'normal';
  d4.value = 'dolphin'; d4.suit = 'animal'; d4.specialType = 'normal';
  l1.value = 'lion'; l1.suit = 'animal'; l1.specialType = 'normal';
  engine.invalidateCache();

  // 1. Jogar d1 e d2 (Par normal)
  engine.selectTile(d1.id);
  const matchRes = engine.selectTile(d2.id);
  assert(matchRes.action === 'matched', 'Par d1 e d2 combinado com sucesso');
  assert(matchRes.trioCandidateSpecies === 'dolphin', 'Candidato a Trinca consagrado como dolphin');
  assert(engine.getActiveTrioCandidate() === 'dolphin', 'Engine reporta dolphin como ativo para Trinca');

  // 2. Jogar d3 (A 3ª peça - Trinca Sagrada)
  const scoreBefore = engine.getHarmonyScore();
  const trioRes = engine.selectTile(d3.id);
  assert(trioRes.action === 'trio_matched', 'Ação registrada como trio_matched');
  assert(trioRes.isTrioMatch === true, 'isTrioMatch marcado como true');
  assert(trioRes.trioTile?.id === d3.id, 'trioTile referencia d3');
  assert(d3.isRemoved === true, 'd3 foi recolhido do tabuleiro');
  assert(trioRes.tray.length === 0, 'Bandeja permaneceu limpa (3ª peça não ocupa slot)');

  // 3. Validar Clima disparado
  assert(trioRes.climateTriggered?.climate === 'ocean_surge', 'Clima de Água (Ocean Surge) invocado determinísticamente');
  assert(engine.getHarmonyScore() >= scoreBefore + 500, 'Bônus épico de Harmonia Zen (+500 pts) concedido');

  // 4. Validar transmutação da 4ª peça em Camaleão Coringa
  const mutatedTile = trioRes.mutations?.[0]?.tile;
  assert(mutatedTile !== undefined, 'Houve mutação registrada para a 4ª peça');
  assert(mutatedTile?.value === 'chameleon', 'Peça restante foi transmutada em chameleon');
  assert(mutatedTile?.specialType === 'chameleon', 'specialType agora é chameleon');
  assert(mutatedTile?.label.includes('Camaleão') === true, 'label atualizado com glifo do Camaleão');

  // 5. Testar Desfazer (Undo) da Trinca
  const undoRes = engine.undo();
  assert(undoRes.success === true, 'Undo da Trinca executado com sucesso');
  assert(undoRes.type === 'tile_restored', 'Tipo de restauração foi tile_restored');
  assert(d3.isRemoved === false, 'd3 foi restaurado ao tabuleiro');
  assert(mutatedTile?.value === 'dolphin', 'Peça mutada revertida de volta para dolphin original');
  assert(mutatedTile?.specialType === 'normal', 'specialType restaurado para normal');
  assert(engine.getActiveTrioCandidate() === null, 'Candidato a Trinca limpo após Undo');
}

// -------------------------------------------------------------
// CENÁRIO 9: Radar Tático da Bandeja (Tray Tactical Oracle)
// -------------------------------------------------------------
console.log('\n🔹 Cenário 9: Radar Tático da Bandeja (Tray Tactical Oracle)');
{
  const tileA1 = { id: 'a1', suit: 'animal', value: 'panda', x: 0, y: 0, z: 0, isRemoved: false, inTray: false, label: '🐼 Panda' } as any;
  const tileA2 = { id: 'a2', suit: 'animal', value: 'panda', x: 2, y: 0, z: 0, isRemoved: false, inTray: false, label: '🐼 Panda' } as any;
  const tileB1 = { id: 'b1', suit: 'animal', value: 'acorn', x: 4, y: 0, z: 0, isRemoved: false, inTray: false, label: '🌰 Noz' } as any;
  const tileC1 = { id: 'c1', suit: 'animal', value: 'tiger', x: 6, y: 0, z: 0, isRemoved: false, inTray: false, label: '🐯 Tigre' } as any;

  // 1. Bandeja Vazia com pares livres
  const oracle1 = TrayTacticalOracle.evaluate([], [tileA1, tileA2], [tileA1, tileA2], 'Bosque Sereno', '🌿');
  assert(oracle1.type === 'board_zen', 'Bandeja vazia detecta estado zen do tabuleiro');
  assert(oracle1.title === 'Bosque Sereno', 'Título exibe nome do bioma atual');

  // 2. Par Livre (Peça na bandeja tem par 100% livre na mesa)
  const trayTilePanda = { ...tileA1, id: 'tray-panda', inTray: true };
  const oracle2 = TrayTacticalOracle.evaluate([trayTilePanda], [tileA2], [tileA2]);
  assert(oracle2.type === 'pair_free', 'Detecta oportunidade imediata de Par Livre');
  assert(oracle2.actionableTileId === tileA2.id, 'Identifica o ID da peça livre para esvaziar slot');

  // 3. Sinergia Livre (Peça na bandeja tem parceiro de sinergia livre na mesa: Panda + Noz)
  const oracle3 = TrayTacticalOracle.evaluate([trayTilePanda], [tileB1], [tileB1]);
  assert(oracle3.type === 'synergy_free', 'Detecta oportunidade de Sinergia livre');
  assert(oracle3.title.includes('Bambu Zen') || oracle3.title.includes('Sinergia'), 'Título menciona sinergia ativável');

  // 4. Peça Bloqueada (Peça na bandeja tem cópia no tabuleiro, mas nenhuma está livre)
  const oracle4 = TrayTacticalOracle.evaluate([trayTilePanda], [], [tileA2]);
  assert(oracle4.type === 'pair_blocked', 'Alerta que par está bloqueado nas laterais');

  // 5. Bandeja em Risco (3/4 slots ocupados sem par livre)
  const tray3 = [
    trayTilePanda,
    { id: 't2', suit: 'animal', value: 'crane', inTray: true } as any,
    { id: 't3', suit: 'animal', value: 'lotus', inTray: true } as any,
  ];
  const oracle5 = TrayTacticalOracle.evaluate(tray3, [tileC1], [tileC1]);
  assert(oracle5.type === 'tray_warning', 'Alerta de Risco Elevado quando 3/4 slots preenchidos');
  assert(oracle5.title.includes('3/4'), 'Indica visualmente 3/4 slots no alerta');

  // 6. Bandeja Cheia (4/4 slots ocupados)
  const tray4 = [...tray3, { id: 't4', suit: 'animal', value: 'fox', inTray: true } as any];
  const oracle6 = TrayTacticalOracle.evaluate(tray4, [tileC1], [tileC1]);
  assert(oracle6.type === 'tray_warning', 'Alerta Crítico de Bandeja Cheia (4/4)');
  assert(oracle6.title.includes('4/4'), 'Indica claramente Bandeja Cheia (4/4)');
}

console.log('\n================================================================');
console.log(`📊 RESULTADO FINAL: ${passedTests} de ${totalTests} testes passaram com 100% de sucesso!`);
console.log('================================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
