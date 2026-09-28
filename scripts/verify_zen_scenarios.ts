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
  t1.suit = 'animal'; t1.value = 'panda';
  t2.suit = 'animal'; t2.value = 'panda';

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
  t1.suit = 'animal'; t1.value = 'panda';
  t2.suit = 'animal'; t2.value = 'panda';

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
    tiles[0].specialType = 'normal';
    eng.invalidateCache();
    const orphan = { ...tiles[0], id: `orphan-lvl-${lvl}`, inTray: true, isRemoved: false };
    (eng as any).trayController.setTray([orphan]);
    let r = eng.selectTile(tiles[0].id);
    if (r.synergy && ['frog_tongue', 'cat_paw', 'bear_feast', 'dolphin_sonar'].includes(r.synergy.type)) {
      eng.finalizeSynergyMatch([tiles[0]]);
    }
    if (!eng.isWaveCleared() || eng.getTray().length !== 0) {
      console.log(`❌ Falha na fase ${lvl + 1}: action=${r.action}, waveCleared=${eng.isWaveCleared()}, trayLen=${eng.getTray().length}, activeRemaining=${eng.getActiveBoardTiles().length}`);
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

// -------------------------------------------------------------
// CENÁRIO 10: Novas Mecânicas A (Vinhas da Selva) e D (Predação na Bandeja)
// -------------------------------------------------------------
console.log('\n🔹 Cenário 10: Vinhas da Selva (Poda Ecológica) e Predação na Bandeja');
{
  const engine = new BoardEngine(CATALOG_50_LAYOUTS[0], 0);
  const active = engine.getActiveBoardTiles();

  // Isola as peças do teste para evitar bloqueios laterais de layout
  for (let i = 5; i < active.length; i++) {
    active[i].position = { x: 100 + i * 4, y: 100, z: 0 };
  }

  // Teste A1: Vinhas da Selva bloqueiam saque direto
  const vineTile = active[0];
  vineTile.specialType = 'vines';
  vineTile.value = 'fish';
  vineTile.label = '🐟 Peixinho';
  vineTile.position = { x: 0, y: 0, z: 0 };

  const tryPickVine = engine.selectTile(vineTile.id);
  assert(tryPickVine.action === 'special_action', 'Toque em vinhas retorna special_action');
  assert(tryPickVine.specialEffect === 'vines_entangled', 'specialEffect identificado como vines_entangled');
  assert(vineTile.inTray === false, 'Peça enredada não entra na bandeja');

  // Teste A2: Poda de Vinhas por Herbívoro Adjacente
  const h1 = active[1];
  const h2 = active[2];
  h1.value = 'panda'; h1.label = '🐼 Panda';
  h2.value = 'panda'; h2.label = '🐼 Panda';
  // h1 adjacente a vineTile em Y (distância 2), totalmente livre nas laterais
  h1.position = { x: 0, y: 2, z: 0 };
  // h2 livre em outro quadrante
  h2.position = { x: 10, y: 2, z: 0 };

  engine.selectTile(h1.id);
  const matchHerbivores = engine.selectTile(h2.id);
  assert(matchHerbivores.action === 'matched', 'Par de pandas combinado com sucesso');
  assert((vineTile.specialType as string) === 'normal', 'Vinhas da peça adjacente foram podadas e consumidas');

  // Teste D1: Predação na Bandeja (Leão caça Coelho)
  const rabbit = active[3];
  const lion = active[4];
  rabbit.value = 'rabbit'; rabbit.label = '🐰 Coelho';
  lion.value = 'lion'; lion.label = '🦁 Leão';

  // Desloca para coordenadas 100% livres
  rabbit.position = { x: 20, y: 20, z: 0 };
  lion.position = { x: 30, y: 20, z: 0 };

  const startHarmony = engine.getHarmonyScore();
  engine.selectTile(rabbit.id);
  assert(engine.getTray().some((t) => t.id === rabbit.id), 'Coelho entrou na bandeja');

  const predationRes = engine.selectTile(lion.id);
  assert(predationRes.action === 'special_action', 'Predação acionada como special_action');
  assert(predationRes.specialEffect === 'predation', 'specialEffect é predation');
  assert(predationRes.predationResult !== undefined, 'predationResult foi preenchido');
  assert(predationRes.predationResult?.bonusHarmony === 300, 'Bônus de harmonia selvagem de 300 pts');
  assert(rabbit.isRemoved === true, 'Presa (coelho) foi consumida e removida');
  assert(rabbit.inTray === false, 'Presa não ocupa mais slot na bandeja');
  assert(engine.getTray().length === 1, 'Bandeja tem apenas 1 slot ocupado (pelo Leão)');
  assert(engine.getTray()[0].id === lion.id, 'Leão permanece na bandeja aguardando par');
  assert(engine.getHarmonyScore() === startHarmony + 300, 'Score total acrescido de 300 pts');

  // Teste D2: Undo da Predação
  const undoRes = engine.undo();
  assert(undoRes.success === true, 'Desfazer da predação executado com sucesso');
  assert(lion.inTray === false, 'Leão retornou da bandeja para o tabuleiro');
  assert(rabbit.inTray === true, 'Coelho ressuscitado e restaurado à bandeja');
  assert(rabbit.isRemoved === false, 'Coelho não está mais removido');
  assert(engine.getHarmonyScore() === startHarmony, 'Score de harmonia revertido com sucesso');
}

// -------------------------------------------------------------
// CENÁRIO 11: Novas Mecânicas B (Casulo Multi-Hit) e E (Ciclo Dia/Noite)
// -------------------------------------------------------------
console.log('\n🔹 Cenário 11: Ninho/Casulo Multi-Hit e Ciclo Dia & Noite');
{
  const engine = new BoardEngine(CATALOG_50_LAYOUTS[0], 0);
  const active = engine.getActiveBoardTiles();

  // Isola as peças do teste
  for (let i = 8; i < active.length; i++) {
    active[i].position = { x: 200 + i * 4, y: 200, z: 0 };
  }

  // 1. Configura um Casulo com 2 hits
  const cocoon = active[0];
  cocoon.specialType = 'cocoon';
  cocoon.value = 'caterpillar';
  cocoon.position = { x: 0, y: 0, z: 0 };
  cocoon.cocoonHits = 2;
  cocoon.initialCocoonHits = 2;

  // Par 1 adjacente ao casulo (p1 e p2)
  const p1 = active[1];
  const p2 = active[2];
  p1.value = 'fish'; p1.position = { x: 0, y: 2, z: 0 };
  p2.value = 'fish'; p2.position = { x: 10, y: 2, z: 0 };

  // 1º Impacto: Casulo racha (1/2)
  engine.selectTile(p1.id);
  const resCrack = engine.selectTile(p2.id);
  assert(resCrack.action === 'matched', 'Par 1 combinado');
  assert(cocoon.cocoonHits === 1, 'Casulo sofreu 1º impacto e agora tem 1 hit restante');
  assert(resCrack.crackedCocoons !== undefined && resCrack.crackedCocoons.length === 1, 'crackedCocoons registrado no resultado');
  assert(cocoon.specialType === 'cocoon', 'Casulo ainda é casulo, mas rachado');

  // Par 2 adjacente ao casulo (p3 e p4)
  const p3 = active[3];
  const p4 = active[4];
  p3.value = 'snail'; p3.position = { x: 2, y: 0, z: 0 };
  p4.value = 'snail'; p4.position = { x: 10, y: 6, z: 0 };

  // 2º Impacto: Casulo eclode!
  engine.selectTile(p3.id);
  const resHatch = engine.selectTile(p4.id);
  assert(resHatch.action === 'matched', 'Par 2 combinado');
  assert(cocoon.cocoonHits === 0, 'Casulo zerou hits restantes');
  assert((cocoon.specialType as string) === 'normal', 'specialType virou normal');
  assert((cocoon.value as string) === 'chameleon', 'Casulo transmutou para Camaleão místico');
  assert(resHatch.hatchedCocoons !== undefined && resHatch.hatchedCocoons.length === 1, 'hatchedCocoons registrado');

  // 2. Ciclo Dia & Noite
  // O motor inicia em 'day'
  assert(engine.getTimeOfDay() === 'day', 'Motor inicia no período do Dia (day)');

  // Par diurno sob o Dia ganha bônus solar (+150 pts extras)
  const eagle1 = active[5];
  const eagle2 = active[6];
  eagle1.value = 'eagle'; eagle1.position = { x: 30, y: 30, z: 0 };
  eagle2.value = 'eagle'; eagle2.position = { x: 40, y: 30, z: 0 };

  const scoreBeforeSolar = engine.getHarmonyScore();
  engine.selectTile(eagle1.id);
  const resSolar = engine.selectTile(eagle2.id);
  assert(resSolar.action === 'matched', 'Águias combinadas sob o Sol');
  // 100 base + 150 solar = +250
  assert(engine.getHarmonyScore() === scoreBeforeSolar + 250, 'Bônus Solar de 150 pts concedido a espécie diurna');

  // Força contagem para Noite (8 pares -> night)
  (engine as any).totalPairsMatchedCount = 8;
  assert(engine.getTimeOfDay() === 'night', 'Após 8 pares o período transita para a Noite (night)');

  // Par noturno sob a Noite (Coruja ativa visão noturna)
  const owl1 = active[7];
  const owl2 = { ...active[7], id: 'owl-pair-2', value: 'owl', position: { x: 50, y: 50, z: 0 }, isRemoved: false, inTray: false };
  owl1.value = 'owl'; owl1.position = { x: 46, y: 50, z: 0 };
  (engine as any).tiles.push(owl2);
  engine.invalidateCache();

  const scoreBeforeLunar = engine.getHarmonyScore();
  engine.selectTile(owl1.id);
  const resLunar = engine.selectTile(owl2.id);
  assert(resLunar.action === 'matched', 'Corujas combinadas sob o Luar');
  assert(engine.getHarmonyScore() === scoreBeforeLunar + 250, 'Bônus Lunar de 150 pts concedido a espécie noturna');
}

// -------------------------------------------------------------
// CENÁRIO 12: Novas Mecânicas C (Névoa dos Picos) e F (Selos Elementais & Chaves)
// -------------------------------------------------------------
console.log('\n🔹 Cenário 12: Névoa dos Picos & Selos Elementais com Chaves Místicas');
{
  const engine = new BoardEngine(CATALOG_50_LAYOUTS[0], 0);
  const active = engine.getActiveBoardTiles();

  // Isola peças não relacionadas
  for (let i = 10; i < active.length; i++) {
    active[i].position = { x: 300 + i * 4, y: 300, z: 0 };
  }

  // 1. Mecânica F: Selo Elemental (elementalSeal)
  const sealedTile = active[0];
  sealedTile.value = 'lotus';
  sealedTile.position = { x: 0, y: 0, z: 0 };
  sealedTile.elementalSeal = 'fire';

  // Verifica que a peça selada NÃO está livre no TileRuleEngine
  assert(!engine.isTileFree(sealedTile), 'Peça com Selo do Fogo está bloqueada no TileRuleEngine');

  // Toque na peça selada retorna special_action 'elemental_sealed'
  const resSealedClick = engine.selectTile(sealedTile.id);
  assert(resSealedClick.action === 'special_action', 'Clique na peça selada retorna special_action');
  assert(resSealedClick.specialEffect === 'elemental_sealed', 'specialEffect é elemental_sealed');
  assert(engine.getTray().length === 0, 'Peça selada não entrou na bandeja');

  // Configura par-chave do Fogo (elementalKey = 'fire')
  const keyTile1 = active[1];
  const keyTile2 = active[2];
  keyTile1.value = 'shell'; keyTile1.position = { x: 10, y: 10, z: 0 }; keyTile1.elementalKey = 'fire';
  keyTile2.value = 'shell'; keyTile2.position = { x: 20, y: 10, z: 0 }; keyTile2.elementalKey = 'fire';

  const scoreBeforeKey = engine.getHarmonyScore();
  engine.selectTile(keyTile1.id);
  const resKeyMatch = engine.selectTile(keyTile2.id);

  assert(resKeyMatch.action === 'matched', 'Par-Chave do Fogo combinado com sucesso');
  assert(resKeyMatch.unsealedTiles !== undefined && resKeyMatch.unsealedTiles.length === 1, 'unsealedTiles retornou a peça deslacrada');
  assert((sealedTile.elementalSeal as any) === undefined, 'Selo do Fogo foi rompido na peça');
  // 100 base + 200 quebra de selo = +300
  assert(engine.getHarmonyScore() === scoreBeforeKey + 300, 'Pontuação recebeu bônus de +200 por estilhaçar cúpula rúnica');
  assert(engine.isTileFree(sealedTile), 'Peça agora está livre para ser combinada!');

  // Reversibilidade (Undo da quebra do selo)
  const undoResult = engine.undo();
  assert(undoResult.success, 'Desfazer executado com sucesso');
  assert((sealedTile.elementalSeal as any) === 'fire', 'Selo do Fogo restaurado com perfeição após Undo');
  assert(!engine.isTileFree(sealedTile), 'Peça volta a estar bloqueada pela cúpula após Undo');
  assert(engine.getHarmonyScore() === scoreBeforeKey, 'Pontuação bônus do selo revertida com precisão');

  // 2. Mecânica C: Névoa dos Picos (isMisty)
  const mistyTile = active[3];
  mistyTile.value = 'lotus';
  mistyTile.position = { x: 2, y: 0, z: 0 }; // adjacente a active[4]
  mistyTile.isMisty = true;

  const neighborA = active[4];
  const neighborB = active[5];
  neighborA.value = 'frog'; neighborA.position = { x: 0, y: 0, z: 0 };
  neighborB.value = 'frog'; neighborB.position = { x: 30, y: 30, z: 0 };

  assert((mistyTile.isMisty as boolean) === true, 'Peça inicia encoberta por névoa');

  // Ao combinar par adjacente, o vento do match dissipa a névoa!
  engine.selectTile(neighborA.id);
  const resMistMatch = engine.selectTile(neighborB.id);

  assert(resMistMatch.action === 'matched', 'Vizinhos combinados com sucesso');
  assert((mistyTile.isMisty as boolean) === false, 'Névoa da peça adjacente foi dissipada pelo vento do match');
  assert(resMistMatch.clearedMistTiles !== undefined && resMistMatch.clearedMistTiles.length >= 1, 'clearedMistTiles reportado no resultado');

  // Reversibilidade do Undo da névoa
  engine.undo();
  assert((mistyTile.isMisty as boolean) === true, 'Névoa da peça foi restaurada após o Undo');
}

console.log('\n================================================================');
console.log(`📊 RESULTADO FINAL: ${passedTests} de ${totalTests} testes passaram com 100% de sucesso!`);
console.log('================================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
