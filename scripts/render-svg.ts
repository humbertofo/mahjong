import fs from 'node:fs';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Uso: npx tsx scripts/render-svg.ts <arquivo.svg> [saida.png] [largura]');
  process.exit(1);
}

const inputSvg = path.resolve(process.cwd(), args[0]);
if (!fs.existsSync(inputSvg)) {
  console.error(`❌ Erro: Arquivo SVG não encontrado: ${inputSvg}`);
  process.exit(1);
}

const outputPng = args[1] && !args[1].match(/^\d+$/)
  ? path.resolve(process.cwd(), args[1])
  : inputSvg.replace(/\.svg$/i, '.png');

const customWidth = args[2] ? parseInt(args[2], 10) : (args[1] && args[1].match(/^\d+$/) ? parseInt(args[1], 10) : undefined);

try {
  const svgContent = fs.readFileSync(inputSvg, 'utf-8');
  const opts: any = {};
  if (customWidth) {
    opts.fitTo = { mode: 'width', value: customWidth };
  }
  const resvg = new Resvg(svgContent, opts);
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();
  
  // Garantir diretório de saída
  const outDir = path.dirname(outputPng);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(outputPng, pngBuffer);
  console.log(`✅ Renderizado com sucesso: ${outputPng}`);
  console.log(`📏 Dimensões: ${pngData.width}x${pngData.height}px`);
} catch (err: any) {
  console.error('❌ Falha na renderização do SVG:', err?.message || err);
  process.exit(1);
}
