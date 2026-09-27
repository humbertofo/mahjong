import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

const audioDir = path.resolve(process.cwd(), 'public/audio');

const file1 = path.join(
  audioDir,
  'YTDown.com_YouTube_Media_uYU50tedsYg_Morning-lofi-Jazz-with-Donkey-Kong-Collection_009_128k.mp3'
);
const file2 = path.join(
  audioDir,
  'YTDown.com_YouTube_Media_QOyEbVjp-30_Donkey-Kong-Country-Lo-Fi-Beats-for-Banana-Collectors_007_128k.mp3'
);

// Verificação de existência
if (!fs.existsSync(file1) || !fs.existsSync(file2)) {
  console.error('Arquivos de origem não encontrados em public/audio/');
  process.exit(1);
}

// 12 fragmentos da faixa 1 (Duração total ~3037s)
// Fragmentos de 100 segundos (1:40) com fade-in de 2s e fade-out de 2.5s
const cutsSource1 = [
  60,   // 01:00 -> 02:40
  290,  // 04:50 -> 06:30
  520,  // 08:40 -> 10:20
  750,  // 12:30 -> 14:10
  980,  // 16:20 -> 18:00
  1210, // 20:10 -> 21:50
  1440, // 24:00 -> 25:40
  1670, // 27:50 -> 29:30
  1900, // 31:40 -> 33:20
  2130, // 35:30 -> 37:10
  2360, // 39:20 -> 41:00
  2590  // 43:10 -> 44:50
];

// 12 fragmentos da faixa 2 (Duração total ~4017s)
const cutsSource2 = [
  80,   // 01:20 -> 03:00
  390,  // 06:30 -> 08:10
  700,  // 11:40 -> 13:20
  1010, // 16:50 -> 18:30
  1320, // 22:00 -> 23:40
  1630, // 27:10 -> 28:50
  1940, // 32:20 -> 34:00
  2250, // 37:30 -> 39:10
  2560, // 42:40 -> 44:20
  2870, // 47:50 -> 49:30
  3180, // 53:00 -> 54:40
  3490  // 58:10 -> 59:50
];

console.log('--- Iniciando corte de 24 fragmentos de 1:40 (100 segundos) ---');

let index = 1;

for (const startSec of cutsSource1) {
  const pad = String(index).padStart(2, '0');
  const outFile = path.join(audioDir, `bgm_lofi_${pad}.mp3`);
  console.log(`[${index}/24] Gerando bgm_lofi_${pad}.mp3 a partir de ${startSec}s (Faixa 1)...`);
  
  const cmd = `ffmpeg -y -ss ${startSec} -t 100 -i "${file1}" -af "afade=t=in:ss=0:d=2,afade=t=out:st=97.5:d=2.5" -b:a 128k "${outFile}"`;
  execSync(cmd, { stdio: 'ignore' });
  index++;
}

for (const startSec of cutsSource2) {
  const pad = String(index).padStart(2, '0');
  const outFile = path.join(audioDir, `bgm_lofi_${pad}.mp3`);
  console.log(`[${index}/24] Gerando bgm_lofi_${pad}.mp3 a partir de ${startSec}s (Faixa 2)...`);
  
  const cmd = `ffmpeg -y -ss ${startSec} -t 100 -i "${file2}" -af "afade=t=in:ss=0:d=2,afade=t=out:st=97.5:d=2.5" -b:a 128k "${outFile}"`;
  execSync(cmd, { stdio: 'ignore' });
  index++;
}

console.log('✓ Concluído com sucesso! 24 fragmentos de 1:40 gerados.');
