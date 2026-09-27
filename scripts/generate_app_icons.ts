import * as fs from 'fs';
import * as path from 'path';
import { Resvg } from '@resvg/resvg-js';

const sourceImagePath = 'C:/Users/Humberto/.gemini/antigravity-ide/brain/76d7b133-d7de-4436-911b-087cfdb3c75a/mahjong_app_icon_1790551505799.jpg';
const resDir = path.resolve('android/app/src/main/res');

if (!fs.existsSync(sourceImagePath)) {
  console.error('Source image not found:', sourceImagePath);
  process.exit(1);
}

const imgBuf = fs.readFileSync(sourceImagePath);
const base64Data = imgBuf.toString('base64');
const dataUri = `data:image/jpeg;base64,${base64Data}`;

interface MipmapTarget {
  folder: string;
  iconSize: number;
  fgSize: number;
}

const targets: MipmapTarget[] = [
  { folder: 'mipmap-mdpi', iconSize: 48, fgSize: 108 },
  { folder: 'mipmap-hdpi', iconSize: 72, fgSize: 162 },
  { folder: 'mipmap-xhdpi', iconSize: 96, fgSize: 216 },
  { folder: 'mipmap-xxhdpi', iconSize: 144, fgSize: 324 },
  { folder: 'mipmap-xxxhdpi', iconSize: 192, fgSize: 432 },
];

function renderSvgToPng(svg: string, width: number, height: number): Buffer {
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: width,
    },
  });
  const rendered = resvg.render();
  return rendered.asPng();
}

console.log('🚀 Gerando ícones do APK a partir da arte conceitual...');

// 1. Atualizar ic_launcher_background.xml para o verde esmeralda zen
const bgXmlPath = path.join(resDir, 'values', 'ic_launcher_background.xml');
const bgXmlContent = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#092218</color>
</resources>
`;
fs.writeFileSync(bgXmlPath, bgXmlContent, 'utf-8');
console.log('✅ ic_launcher_background.xml atualizado para #092218');

// 2. Gerar para cada resolução mipmap
for (const t of targets) {
  const targetDir = path.join(resDir, t.folder);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // A. ic_launcher.png (quadrado / bordas padrão com imagem completa)
  const squareSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${t.iconSize}" height="${t.iconSize}" viewBox="0 0 1024 1024">
      <defs>
        <clipPath id="squircle">
          <rect x="0" y="0" width="1024" height="1024" rx="200" ry="200" />
        </clipPath>
      </defs>
      <rect width="1024" height="1024" fill="#092218" />
      <image href="${dataUri}" x="0" y="0" width="1024" height="1024" clip-path="url(#squircle)" />
    </svg>
  `;
  const squarePng = renderSvgToPng(squareSvg, t.iconSize, t.iconSize);
  fs.writeFileSync(path.join(targetDir, 'ic_launcher.png'), squarePng);

  // B. ic_launcher_round.png (máscara circular perfeita)
  const roundSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${t.iconSize}" height="${t.iconSize}" viewBox="0 0 1024 1024">
      <defs>
        <clipPath id="circle">
          <circle cx="512" cy="512" r="512" />
        </clipPath>
      </defs>
      <rect width="1024" height="1024" fill="#092218" />
      <image href="${dataUri}" x="0" y="0" width="1024" height="1024" clip-path="url(#circle)" />
    </svg>
  `;
  const roundPng = renderSvgToPng(roundSvg, t.iconSize, t.iconSize);
  fs.writeFileSync(path.join(targetDir, 'ic_launcher_round.png'), roundPng);

  // C. ic_launcher_foreground.png (Adaptive Icon — safe zone central 66% = 72dp)
  // O canvas tem 108dp. Para caber na safe zone (72dp), escalamos a imagem para ~82% do canvas
  const fgScale = 0.88;
  const fgImageSize = 1024 * fgScale;
  const fgOffset = (1024 - fgImageSize) / 2;

  const fgSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${t.fgSize}" height="${t.fgSize}" viewBox="0 0 1024 1024">
      <image href="${dataUri}" x="${fgOffset}" y="${fgOffset}" width="${fgImageSize}" height="${fgImageSize}" />
    </svg>
  `;
  const fgPng = renderSvgToPng(fgSvg, t.fgSize, t.fgSize);
  fs.writeFileSync(path.join(targetDir, 'ic_launcher_foreground.png'), fgPng);

  console.log(`✅ ${t.folder} gerado (icon: ${t.iconSize}px, fg: ${t.fgSize}px)`);
}

// 3. Salvar versões de alta resolução em public/ e public/assets/
const publicDir = path.resolve('public');
const highResSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 1024 1024">
    <defs>
      <clipPath id="app-clip">
        <rect x="0" y="0" width="1024" height="1024" rx="192" ry="192" />
      </clipPath>
    </defs>
    <rect width="1024" height="1024" fill="#092218" />
    <image href="${dataUri}" x="0" y="0" width="1024" height="1024" clip-path="url(#app-clip)" />
  </svg>
`;
const highResPng = renderSvgToPng(highResSvg, 512, 512);
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), highResPng);
fs.writeFileSync(path.join(publicDir, 'icon.png'), highResPng);

const publicAssetsDir = path.join(publicDir, 'assets');
if (!fs.existsSync(publicAssetsDir)) fs.mkdirSync(publicAssetsDir, { recursive: true });
fs.writeFileSync(path.join(publicAssetsDir, 'app-icon.png'), highResPng);

// Salvar também favicon em 64x64
const faviconPng = renderSvgToPng(highResSvg, 64, 64);
fs.writeFileSync(path.join(publicDir, 'favicon.png'), faviconPng);

console.log('🎉 Todos os ícones do APK e PWA foram gerados com sucesso!');
