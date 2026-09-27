import { CATALOG_50_LAYOUTS } from '../index';
import { BoardEngine } from '../../BoardEngine';

console.log('========================================================================');
console.log('🔍 PIPELINE DE VALIDAÇÃO DA ESTEIRA DE LAYOUTS (50 FASES)');
console.log('========================================================================\n');

let totalErrors = 0;
let passedCount = 0;

CATALOG_50_LAYOUTS.forEach((layout, idx) => {
  const levelNum = idx + 1;
  const engine = new BoardEngine(layout);
  const totalWaves = engine.getTotalWaves();
  let levelOk = true;

  for (let w = 1; w <= totalWaves; w++) {
    const tiles = engine.getActiveBoardTiles();
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, maxZ = 0;
    
    tiles.forEach(t => {
      minX = Math.min(minX, t.position.x);
      maxX = Math.max(maxX, t.position.x);
      minY = Math.min(minY, t.position.y);
      maxY = Math.max(maxY, t.position.y);
      maxZ = Math.max(maxZ, t.position.z);
    });

    const cols = (maxX - minX + 2) / 2;
    const rows = (maxY - minY + 2) / 2;

    const availW = 348;
    const availH = 628;
    const baseW = 48;
    const baseH = 64;
    const baseD = 6;
    const scaleX = availW / (cols * baseW + maxZ * baseD);
    const scaleY = availH / (rows * baseH + maxZ * baseD);
    const scale = Math.min(scaleX, scaleY, 2.8);
    const tileW = Math.round(baseW * scale);
    const tileH = Math.round(baseH * scale);
    const heightCov = Math.round(((rows * tileH) / availH) * 100);

    // Validação de paridade
    if (tiles.length % 2 !== 0) {
      console.error(`❌ [Fase ${levelNum} Onda ${w}/${totalWaves}] Contagem ímpar de peças: ${tiles.length}`);
      levelOk = false;
      totalErrors++;
    }

    // Validação de tamanho
    if (tileW < 50) {
      console.error(`❌ [Fase ${levelNum} Onda ${w}/${totalWaves}] Peça menor que 50px: ${tileW}px`);
      levelOk = false;
      totalErrors++;
    }

    // Validação de altura útil
    if (heightCov < 70) {
      console.warn(`⚠️ [Fase ${levelNum} Onda ${w}/${totalWaves}] Altura ocupada baixa: ${heightCov}%`);
    }

    if (w < totalWaves) {
      engine.advanceToNextWave();
    }
  }

  if (levelOk) {
    passedCount++;
  }
});

console.log(`\n========================================================================`);
console.log(`📊 RESULTADO DA ESTEIRA: ${passedCount} de 50 fases aprovadas (${totalErrors} erros)`);
console.log(`========================================================================`);

if (totalErrors > 0) {
  process.exit(1);
} else {
  console.log('🎉 ESTEIRA 100% LIMPA E PRONTA PARA PRODUÇÃO!');
}
