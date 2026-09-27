---
name: svg-animations
description: Técnicas e padrões de animação SVG artesanal (handcrafted), line drawing com pathLength, morphing de paths, máscaras dinâmicas e transições coordenadas com CSS e Anime.js para ícones e elementos visuais do Mahjong.
---

# SVG Animations & Handcrafted Vector Motion

Guia prático para geração de vetores SVG concebidos desde a origem para animação fluida, de alto desempenho e acessível, integrando-se ao fluxo de **Vanilla TypeScript** e **Anime.js** do projeto.

---

## 🎯 Quando Usar Esta Skill

- Criação de ícones animados artesanais (ex: lâmpada de Dica acendendo, seta circular de Desfazer voltando, cadeado abrindo em peças bloqueadas).
- Efeito de traçado que se desenha sozinho (*Stroke Drawing / Line Animation*).
- Efeitos de brilho e reflexo em pedras de Mahjong (*Shine / Sheen effect*) via máscaras `<mask viewBox>` e gradientes dinâmicos.
- Animações vetoriais leves com controle cirúrgico de coordenadas sem carregar vídeos ou bibliotecas pesadas.

---

## 📐 Fundamentos de Geometria de Paths Handcrafted

Para que um SVG seja facilmente animado por código, seus caminhos (`<path>`) devem ser limpos, com coordenadas absolutas/relativas claras e pontos de ancoragem bem definidos:

### Comandos Essenciais do atributo `d`:
* `M x y`: Move a caneta para o ponto inicial.
* `C x1 y1, x2 y2, x y`: Curva Bézier cúbica com 2 pontos de controle (essencial para arcos suaves de pedras e flores).
* `S x2 y2, x y`: Bézier suave espelhada (encadeia curvas contínuas sem dobras).
* `A rx ry rot large sweep x y`: Arco elíptico (ideal para semi-círculos e cantos arredondados precisos).
* `Z`: Fecha o caminho conectando de volta ao `M` inicial.

---

## ✏️ Técnica Canônica: Line Drawing com `pathLength="1"`

### O Grande Segredo: `pathLength="1"`
IAs frequentemente cometem o erro de calcular comprimentos de linha arbitrários em pixels (ex: `stroke-dasharray: 450px`). Se o ícone escalar, a velocidade da animação quebra. 

Ao definir `pathLength="1"` no elemento SVG, o navegador normaliza a extensão total do caminho para exatamente `1.0`.

```xml
<svg viewBox="0 0 48 48" class="animated-icon">
  <!-- pathLength="1" normaliza a matemática para 0.0 -> 1.0 -->
  <path 
    class="draw-path" 
    pathLength="1"
    d="M 12,24 A 12,12 0 1,1 36,24" 
    fill="none" 
    stroke="#ffd700" 
    stroke-width="3" 
    stroke-linecap="round"
  />
</svg>
```

### Animação via CSS:
```css
.draw-path {
  stroke-dasharray: 1;
  stroke-dashoffset: 1; /* Totalmente invisível no início */
  transition: stroke-dashoffset 400ms cubic-bezier(0.16, 1, 0.3, 1);
}

/* Ativação ao disparar a dica ou focar no botão */
.animated-icon.is-active .draw-path {
  stroke-dashoffset: 0; /* Linha desenhada por completo */
}
```

---

## 🔄 Transformações em SVG sem Quebrar Coordenadas

Dentro de um SVG, `transform-origin` padrão é `(0, 0)` do `viewBox`, e não o centro da forma. Para transformar elementos internos (girar ponteiros, pulsar glifos):

```css
.svg-center-rotate {
  /* ⚠️ Obrigatório para respeitar a caixa delimitadora do elemento interno */
  transform-box: fill-box;
  transform-origin: center;
  transition: transform 300ms ease-out;
}

.button-undo:active .svg-center-rotate {
  transform: rotate(-120deg) scale(0.9);
}
```

---

## 💎 Efeito de Brilho Dinâmico em Pedras (Sheen Effect via `<mask viewBox>`)

Efeito leve para celebrar combinações de pedras ou destacar peças livres sugeridas por dicas:

```xml
<svg viewBox="0 0 128 160" class="tile-sheen-svg">
  <defs>
    <!-- Gradiente linear que simula feixe de luz passando -->
    <linearGradient id="sheen-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0" />
      <stop offset="50%" stop-color="#ffffff" stop-opacity="0.6" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
    </linearGradient>

    <!-- Máscara no formato da pedra -->
    <mask id="tile-mask">
      <rect x="0" y="0" width="128" height="160" rx="12" fill="#ffffff" />
    </mask>
  </defs>

  <!-- Camada de brilho varrendo a pedra -->
  <g mask="url(#tile-mask)">
    <rect class="sheen-beam" x="-150" y="0" width="100" height="160" fill="url(#sheen-grad)" />
  </g>
</svg>
```

```css
@keyframes sweepSheen {
  0% { transform: translateX(-150px) skewX(-20deg); }
  100% { transform: translateX(300px) skewX(-20deg); }
}

.tile-sheen-svg.is-highlighted .sheen-beam {
  animation: sweepSheen 650ms ease-out forwards;
}
```

---

## ⚡ Integração com Anime.js & Render-on-Demand

Quando for orquestrar animações de SVG mais ricas via JavaScript, use a skill [`animejs`](file:///d:/Este%20Computador/Documentos/gihub/mahjong/.agent/skills/animejs/SKILL.md):

```typescript
import anime from 'animejs';

export function animateSvgHintPulse(svgElement: SVGSVGElement) {
  const path = svgElement.querySelector('.draw-path');
  if (!path) return;

  anime.timeline()
    .add({
      targets: path,
      strokeDashoffset: [1, 0],
      duration: 350,
      easing: 'easeOutQuad',
    })
    .add({
      targets: svgElement,
      scale: [1, 1.15, 1],
      duration: 300,
      easing: 'easeInOutSine',
    });
}
```

---

## 🛡️ Checklist de Performance & Acessibilidade Mobile

1. [ ] **`pathLength="1"` configurado:** Garante animação consistente de stroke em qualquer resolução.
2. [ ] **`transform-box: fill-box` aplicado:** Impede que rotações e escalas usem o canto superior esquerdo do viewBox.
3. [ ] **Sem loops infinitos em repouso:** Todas as animações SVG devem ter início e fim determinados para preservar 100% da bateria do dispositivo Android.
4. [ ] **Respeito a `prefers-reduced-motion`:**
```css
@media (prefers-reduced-motion: reduce) {
  .draw-path, .sheen-beam, .svg-center-rotate {
    animation: none !important;
    transition: none !important;
    stroke-dashoffset: 0 !important;
  }
}
```
