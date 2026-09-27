import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

const audioDir = path.resolve(process.cwd(), 'public/audio');

const zenFiles = [
  'bgm_zen_01.ogg',
  'bgm_zen_02.ogg',
  'bgm_zen_03.ogg',
  'bgm_zen_04.ogg',
  'bgm_zen_05.ogg',
];

console.log('--- Cortando as 5 faixas Zen para 1:40 (100s) e deletando o excedente ---');

for (let i = 0; i < zenFiles.length; i++) {
  const fileName = zenFiles[i];
  const srcPath = path.join(audioDir, fileName);
  const tempOgg = path.join(audioDir, `temp_${fileName}`);
  const baseName = fileName.replace('.ogg', '');
  const outMp3 = path.join(audioDir, `${baseName}.mp3`);

  if (!fs.existsSync(srcPath)) {
    console.warn(`Arquivo não encontrado: ${fileName}`);
    continue;
  }

  console.log(`[${i + 1}/5] Processando ${fileName} -> 1:40 (100s) com fades suaves...`);

  // 1. Gera versão OGG cortada de 100s (1:40) com fade in de 2s e fade out de 2.5s
  const cmdOgg = `ffmpeg -y -ss 0 -t 100 -i "${srcPath}" -af "afade=t=in:ss=0:d=2,afade=t=out:st=97.5:d=2.5" "${tempOgg}"`;
  execSync(cmdOgg, { stdio: 'ignore' });

  // 2. Gera também a versão MP3 de 100s a 128k para máxima compatibilidade
  const cmdMp3 = `ffmpeg -y -ss 0 -t 100 -i "${srcPath}" -af "afade=t=in:ss=0:d=2,afade=t=out:st=97.5:d=2.5" -b:a 128k "${outMp3}"`;
  execSync(cmdMp3, { stdio: 'ignore' });

  // 3. Substitui o arquivo OGG grande de 5 minutos pelo arquivo cortado de 1:40
  fs.unlinkSync(srcPath);
  fs.renameSync(tempOgg, srcPath);
}

// Remove arquivos temporários de teste caso existam
const testCut = path.join(audioDir, 'bgm_zen_01_cut.ogg');
if (fs.existsSync(testCut)) {
  fs.unlinkSync(testCut);
}

console.log('✓ Concluído! Todas as 5 faixas Zen foram reduzidas para 1:40 e o resto foi deletado.');
