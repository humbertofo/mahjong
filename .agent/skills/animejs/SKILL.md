---
name: animejs
description: Orquestração de animações baseadas em timelines, micro-interações, efeitos de stagger e manipulação de propriedades de Canvas/SVG com Anime.js em Vanilla TypeScript para jogos mobile offline e interfaces táteis.
---

# Anime.js Animation Choreography (Vanilla TypeScript)

Guia prático para criação de timelines de animação, efeitos de cascata (*stagger*), transições de UI e animações de peças de jogo com **Anime.js** em projetos **100% Vanilla TypeScript** sem dependências de React.

---

## 🎯 Quando Usar Esta Skill

- Coreografia de abertura do tabuleiro de Mahjong (distribuição em cascata das 144 peças ao iniciar a fase).
- Animação de combinação de peças (*Match & Fly*): elevação no eixo Z, brilho e vôo suave para fora da prancha.
- Feedback de erro tátil: tremor suave (*shake*) ao tentar tocar em uma peça bloqueada pelas laterais ou topo.
- Efeito de embaralhamento (*Shuffle*): rotação e rearranjo suave das peças restantes.
- Transições de modais e botões da interface (Menu, Desfazer, Dica) com amortecimento suave (*spring/elastic*).

---

## 📦 Instalação & Setup Leve

Anime.js é extremamente leve (~9KB gzipped) e não possui dependências externas:

```bash
npm install animejs
npm install -D @types/animejs
```

Importação recomendada:
```typescript
import anime from 'animejs';
```

---

## 🀄 Padrões de Animação para o Mahjong

### 1. Match & Fly (Eliminação de Par de Pedras)
Quando duas peças compatíveis são combinadas, anime suas propriedades visuais e notifique o renderizador a cada frame:

```typescript
import anime from 'animejs';
import { BoardRenderer } from '../render/BoardRenderer';

export function animateMatchPair(
  tileA: { x: number; y: number; scale: number; alpha: number; elevationZ: number },
  tileB: { x: number; y: number; scale: number; alpha: number; elevationZ: number },
  renderer: BoardRenderer,
  onComplete: () => void
) {
  // Cria timeline orquestrada
  const tl = anime.timeline({
    easing: 'easeOutQuad',
    update: () => {
      // ⚠️ Render-on-demand: redesenha o canvas somente durante a animação
      renderer.requestFrame();
    },
    complete: () => {
      onComplete();
    },
  });

  tl
    // Passo 1: Elevação e escala rápida (peças sobem da mesa)
    .add({
      targets: [tileA, tileB],
      scale: 1.15,
      elevationZ: '+=15',
      duration: 180,
      easing: 'easeOutBack',
    })
    // Passo 2: Desvanecimento com subida suave
    .add({
      targets: [tileA, tileB],
      alpha: 0,
      scale: 1.25,
      y: '-=30',
      duration: 220,
      easing: 'easeInQuad',
    }, '-=50'); // Inicia 50ms antes do fim do passo 1
}
```

---

### 2. Peça Bloqueada (Tremor de Feedback / Shake)
Quando o jogador toca em uma peça que não pode ser selecionada (bloqueada à esquerda/direita ou coberta por cima):

```typescript
export function animateBlockedTile(
  tile: { x: number; originalX: number },
  renderer: BoardRenderer
) {
  anime({
    targets: tile,
    x: [
      { value: tile.originalX - 4, duration: 50 },
      { value: tile.originalX + 4, duration: 50 },
      { value: tile.originalX - 3, duration: 50 },
      { value: tile.originalX + 3, duration: 50 },
      { value: tile.originalX, duration: 50 },
    ],
    easing: 'easeInOutSine',
    update: () => renderer.requestFrame(),
    complete: () => {
      tile.x = tile.originalX;
      renderer.requestFrame();
    },
  });
}
```

---

### 3. Distribuição de Tabuleiro em Cascata (Stagger Deal)
Efeito visual de impacto no início da partida, distribuindo as peças em ondas:

```typescript
export function animateBoardDeal(
  tiles: Array<{ x: number; y: number; targetY: number; alpha: number }>,
  renderer: BoardRenderer,
  onDone: () => void
) {
  // Prepara as peças acima da tela
  tiles.forEach((t) => {
    t.y = t.targetY - 120;
    t.alpha = 0;
  });

  anime({
    targets: tiles,
    y: (t: any) => t.targetY,
    alpha: 1,
    delay: anime.stagger(12, { from: 'center' }), // Onda radial a partir do centro
    duration: 400,
    easing: 'easeOutBack',
    update: () => renderer.requestFrame(),
    complete: onDone,
  });
}
```

---

### 4. Micro-Interações de Botões da UI (Touch Feedback)
Amortecimento elástico para botões inferiores (Desfazer, Dica, Menu) para uma sensação tátil premium no toque com o polegar:

```typescript
export function attachButtonSpringAnimation(buttonElement: HTMLElement) {
  buttonElement.addEventListener('pointerdown', () => {
    anime.remove(buttonElement);
    anime({
      targets: buttonElement,
      scale: 0.92,
      duration: 120,
      easing: 'easeOutQuad',
    });
  });

  const restore = () => {
    anime.remove(buttonElement);
    anime({
      targets: buttonElement,
      scale: 1,
      duration: 280,
      easing: 'spring(1, 80, 10, 0)', // Spring physics: mass, stiffness, damping, velocity
    });
  };

  buttonElement.addEventListener('pointerup', restore);
  buttonElement.addEventListener('pointercancel', restore);
}
```

---

## ⚡ Boas Práticas e Performance Mobile

1. **Sempre cancele animações ativas com `anime.remove(target)`** antes de iniciar uma nova no mesmo objeto (evita conflitos e desperdício de CPU).
2. **Integração com `requestFrame()`**: Não use loops contínuos de renderização. O callback `update` do Anime.js é o ponto exato para pedir que o renderer desenhe um único frame.
3. **Mantenha durações curtas (150ms a 350ms)**: Jogadores casuais e seniores valorizam responsividade imediata. Animações lentas (>500ms) causam sensação de lentidão no jogo.
