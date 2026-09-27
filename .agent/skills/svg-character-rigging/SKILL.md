---
name: svg-character-rigging
description: Rigging e animação de personagens/mascotes vetoriais em SVG (Panda, Dragão, Guia Zen) com articulação de membros, pivôs estáveis, micro-expressões e coreografia com Anime.js em Vanilla TypeScript sem React.
---

# SVG Character Rigging & Animation (Vanilla TS & Mobile)

Guia prático para criação, articulação (*rigging*) e animação de mascotes/personagens em SVG (como Pandas, Dragões ou Guias Zen) para tutoriais, celebrações de vitória e reações no jogo, utilizando **Vanilla TypeScript + Anime.js** com eficiência energética para mobile.

---

## 🎯 Quando Usar Esta Skill

- Criação e animação de um mascote do jogo (ex: Panda Zen, Dragão da Sorte).
- Celebração de fase concluída (mascote comemorando, acenando ou batendo palmas).
- Tutorial visual ou assistente de dicas (mascote apontando para peças livres com a mão e piscando).
- Feedback expressivo sem palavras (inclinação de cabeça curiosa, sorriso de sucesso, tremor sutil ao errar).

---

## 🦴 Anatomia e Hierarquia do Rig em SVG

Um personagem em SVG deve ser desenhado em **grupos semânticos (`<g>`)** para que as partes girem e escalem a partir de pontos de articulação naturais (ombros, pescoço, base das orelhas):

```xml
<svg viewBox="0 0 200 200" id="zen-mascot" class="mascot-svg">
  <!-- Sombra no chão -->
  <ellipse id="mascot-shadow" cx="100" cy="185" rx="45" ry="10" fill="rgba(0,0,0,0.18)" />

  <g id="mascot-body" class="rig-body">
    <!-- Pés e Tronco -->
    <path id="torso" d="..." fill="#fdfbf7" />

    <!-- Braço Esquerdo (Pivô no Ombro Esquerdo) -->
    <g id="arm-left" class="rig-limb limb-arm-left">
      <path d="..." fill="#222" />
    </g>

    <!-- Braço Direito / Mão Indicadora (Pivô no Ombro Direito) -->
    <g id="arm-right" class="rig-limb limb-arm-right">
      <path d="..." fill="#222" />
    </g>

    <!-- Cabeça e Rosto (Pivô no Pescoço/Queixo) -->
    <g id="mascot-head" class="rig-head">
      <circle id="head-base" cx="100" cy="85" r="42" fill="#fdfbf7" />
      
      <!-- Orelhas com pivô na base -->
      <circle id="ear-left" cx="68" cy="55" r="14" fill="#222" />
      <circle id="ear-right" cx="132" cy="55" r="14" fill="#222" />

      <!-- Olhos (para efeito de piscar) -->
      <g id="eyes-group">
        <ellipse id="eye-left" cx="86" cy="82" rx="6" ry="8" fill="#111" />
        <ellipse id="eye-right" cx="114" cy="82" rx="6" ry="8" fill="#111" />
      </g>

      <!-- Focinho e Boca -->
      <path id="mouth" d="M 94,96 Q 100,102 106,96" stroke="#222" stroke-width="2.5" fill="none" />
    </g>
  </g>
</svg>
```

---

## 🎯 Pivôs Estáveis (A Regra de Ouro do Rigging)

Para evitar que membros se descolem do corpo durante rotações no SVG:

```css
/* Configuração essencial de pivô para evitar rotação na origem (0,0) */
.mascot-svg .rig-head {
  transform-box: fill-box;
  transform-origin: 50% 90%; /* Pescoço/base da cabeça */
}

.mascot-svg .limb-arm-right {
  transform-box: fill-box;
  transform-origin: 20% 20%; /* Articulação do ombro */
}

.mascot-svg .limb-arm-left {
  transform-box: fill-box;
  transform-origin: 80% 20%;
}

.mascot-svg #eyes-group {
  transform-box: fill-box;
  transform-origin: 50% 50%;
}
```

---

## 🎬 Coreografias com Anime.js (Vanilla TypeScript)

### 1. Piscar Natural de Olhos (Blink Cycle)
Animação ultrarrápida (150ms) achatando o eixo Y dos olhos:

```typescript
import anime from 'animejs';

export function triggerBlink(eyesSelector: string = '#eyes-group') {
  anime({
    targets: eyesSelector,
    scaleY: [
      { value: 0.1, duration: 80, easing: 'easeInQuad' },
      { value: 1, duration: 100, easing: 'easeOutQuad' },
    ],
  });
}
```

---

### 2. Gesto de Dica (Mascote Aponta com o Braço e Inclina a Cabeça)

```typescript
export function animateMascotPointing() {
  const tl = anime.timeline({
    easing: 'easeOutBack',
  });

  tl
    // 1. Cabeça inclina curiosa
    .add({
      targets: '#mascot-head',
      rotate: -12,
      duration: 300,
    })
    // 2. Braço direito se ergue apontando para o tabuleiro
    .add({
      targets: '#arm-right',
      rotate: 45,
      scale: 1.08,
      duration: 350,
    }, '-=200')
    // 3. Piscar confiante
    .add({
      targets: '#eyes-group',
      scaleY: [{ value: 0.1, duration: 70 }, { value: 1, duration: 90 }],
      duration: 200,
    });
}
```

---

### 3. Comemoração de Vitória (Pula e Bate Palmas)

```typescript
export function animateVictoryCelebration(onDone?: () => void) {
  const tl = anime.timeline({
    complete: onDone,
  });

  tl
    // Pulo do corpo com compressão da sombra
    .add({
      targets: '#mascot-body',
      y: [0, -35, 0],
      duration: 500,
      easing: 'easeInOutQuad',
    })
    .add({
      targets: '#mascot-shadow',
      scaleX: [1, 0.7, 1],
      opacity: [1, 0.4, 1],
      duration: 500,
      easing: 'easeInOutQuad',
    }, '-=500')
    // Braços abertos de celebração
    .add({
      targets: '#arm-left',
      rotate: [-10, -55, -20],
      duration: 450,
      easing: 'easeOutElastic(1, .6)',
    }, '-=400')
    .add({
      targets: '#arm-right',
      rotate: [10, 55, 20],
      duration: 450,
      easing: 'easeOutElastic(1, .6)',
    }, '-=450');
}
```

---

## 🔋 Regras de Eficiência para Mobile

1. **Repouso Estático:** Quando nenhuma ação estiver em curso, o mascote fica completamente parado. Não rode loops contínuos de respiração de 60fps no Canvas/DOM em repouso.
2. **Idle Timer Sutil:** Se o jogador ficar ocioso por mais de 10 segundos, dispare apenas um piscar único (`triggerBlink()`) para manter o charme vivo sem gastar bateria.
3. **Cancelamento Imediato:** Use `anime.remove('.mascot-svg *')` ao desmontar o componente ou fechar modais.
