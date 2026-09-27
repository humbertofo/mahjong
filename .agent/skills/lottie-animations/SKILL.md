---
name: lottie-animations
description: Integração de animações vetoriais Lottie e DotLottie offline em Vanilla TypeScript para micro-interações, ícones animados, tutoriais táteis e telas de vitória sem consumo de CPU ociosa.
---

# Lottie Animations (Offline & Mobile Performance)

Guia de implementação de animações vetoriais com **Lottie** e **DotLottie** em ambientes **Vanilla TypeScript + Vite** voltados para jogos mobile offline no Android.

---

## 🎯 Quando Usar Esta Skill

- Animação de celebração de vitória (troféu girando, confetes vetoriais, estrelas de avaliação da fase).
- Tutorial visual para idosos/iniciantes (mãozinha animada deslizando e tocando em duas peças livres).
- Ícones animados de micro-interação (lâmpada de dica ativando, botão de configurações girando suavemente).
- Feedback visual de carregamento rápido ou abertura de baú/fase concluída.

---

## 📦 Pacote Recomendado (Leve e Sem Dependência de Framework)

Para projetos sem React, utilize o player web oficial moderno:

```bash
npm install @lottiefiles/dotlottie-web
```

*Vantagem do DotLottie (.lottie):* Compactado em formato binário comprimido, reduzindo o tamanho do arquivo JSON em até 80%, ideal para empacotamento offline no APK Android via Capacitor.

---

## 🚀 Implementação em Vanilla TypeScript

### 1. Criando um Container de Animação Controlada

```typescript
import { DotLottie } from '@lottiefiles/dotlottie-web';

export class LottieCelebration {
  private dotLottie: DotLottie | null = null;
  private canvas: HTMLCanvasElement;

  constructor(container: HTMLElement, animationPath: string, onComplete?: () => void) {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'celebration-lottie-canvas';
    this.canvas.style.width = '240px';
    this.canvas.style.height = '240px';
    this.canvas.style.pointerEvents = 'none';
    container.appendChild(this.canvas);

    this.dotLottie = new DotLottie({
      canvas: this.canvas,
      src: animationPath, // Caminho local (ex: '/assets/animations/victory_trophy.lottie')
      loop: false,        // ⚠️ Não deixe em loop contínuo para economizar bateria
      autoplay: true,
    });

    if (onComplete) {
      this.dotLottie.addEventListener('complete', () => {
        onComplete();
      });
    }
  }

  public destroy() {
    if (this.dotLottie) {
      this.dotLottie.destroy();
      this.dotLottie = null;
    }
    this.canvas.remove();
  }
}
```

---

## 🀄 Casos de Uso no Mahjong

### A. Tutorial Interativo (Mãozinha Indicadora)
Em fases iniciais ou quando o jogador solicita "Como Jogar", uma animação Lottie em vetor guia o toque sem necessidade de vídeos pesados:

```typescript
export function showHintFinger(targetTileA: DOMRect, targetTileB: DOMRect) {
  const overlay = document.createElement('div');
  overlay.className = 'tutorial-finger-overlay';
  document.body.appendChild(overlay);

  const lottiePlayer = new DotLottie({
    canvas: overlay.appendChild(document.createElement('canvas')),
    src: '/assets/animations/hand_tap.lottie',
    loop: 2, // Executa 2 vezes e encerra
    autoplay: true,
  });

  lottiePlayer.addEventListener('complete', () => {
    lottiePlayer.destroy();
    overlay.remove();
  });
}
```

---

## 🔋 Regras de Ouro de Eficiência Energética

1. **Nunca use animações Lottie em repouso no HUD:** Se o ícone da lâmpada de dica tiver animação, ela só deve rodar quando ativada pelo jogador ou 1 ciclo sutil a cada 30 segundos, nunca em loop infinito.
2. **Destruição Imediata:** Sempre execute `dotLottie.destroy()` quando o modal for fechado ou a tela de vitória for dispensada. Deixar instâncias ativas consome ciclos de animação e retém referências de canvas na memória.
3. **Resolução de Tela Controlada:** Evite criar canvas de Lottie com resoluções desnecessariamente altas em celulares Android mais modestos.
