---
name: pixijs-2d
description: Otimização e renderização 2D de alta performance com PixiJS v8 / WebGL para jogos 2D, spritesheets, batching de peças, sombreamento de camadas Z 2.5D, partículas de combinação e integração estrita com render-on-demand para conservação de bateria mobile.
---

# PixiJS 2D Rendering (Mobile & Render-on-Demand)

Guia de engenharia para renderização 2D acelerada por GPU usando **PixiJS v8** em ambientes mobile (Android/Capacitor), com foco em altíssimo desempenho (60fps+), consumo mínimo de bateria e arquitetura *render-on-demand*.

---

## 🎯 Quando Usar Esta Skill

- Construção e refatoração de renderizadores de tabuleiro de Mahjong e jogos 2D em Canvas/WebGL.
- Otimização de draw calls com Spritesheets e Batch Containers (renderizar 144+ pedras em 1 draw call).
- Criação de efeitos visuais 2.5D: elevação de camadas Z, sombras projetadas dinâmicas e filtros de realce.
- Sistemas de partículas leves (explosão de brilho/partículas ao combinar peças).
- Implementação de renderização sob demanda (*render-on-demand*) para zero consumo de CPU/GPU em repouso.

---

## ⚡ Regra de Ouro: Render-on-Demand (Bateria & Térmica)

Em jogos casuais e de tabuleiro no mobile, **nunca execute um loop contínuo de `requestAnimationFrame` em repouso**. A taxa de quadros deve ser **0 FPS** quando nada estiver se movendo.

```typescript
import { Application } from 'pixi.js';

export async function setupPixiApp(canvas: HTMLCanvasElement): Promise<Application> {
  const app = new Application();

  await app.init({
    canvas,
    width: window.innerWidth,
    height: window.innerHeight,
    resolution: Math.min(window.devicePixelRatio || 1, 2), // Evita resoluções excessivas (3x+) em telas 4K mobile
    autoDensity: true,
    antialias: true,
    backgroundColor: 0x141e1b, // Fundo escuro do jogo
    autoStart: false, // ⚠️ CRUCIAL: Desativa o ticker contínuo automático
  });

  // Pare o ticker imediatamente para garantir repouso
  app.ticker.stop();

  // Força 1 render inicial do tabuleiro
  app.render();

  return app;
}
```

### Como renderizar durante animações:
Quando houver um tween ou animação acontecendo (ex: peça se movendo ou brilhando):
1. Inicie o ticker temporariamente: `app.ticker.start()`.
2. Quando a animação terminar: `app.ticker.stop()`.
3. Ou, para atualizações pontuais (ex: clique ou seleção de peça), chame manualmente: `app.render()`.

---

## 🀄 Arquitetura de Tabuleiro Mahjong (Z-Layers & Batching)

### 1. Spritesheets e Texturas
Carregue todos os grafismos das pedras em um atlas único (Spritesheet). Isso permite que o PixiJS agrupe todas as 144 peças em uma única chamada de desenho WebGL (*batching*).

```typescript
import { Assets, Sprite, Container } from 'pixi.js';

export class BoardContainer extends Container {
  private tilesLayer = new Container();
  private shadowsLayer = new Container();
  private effectsLayer = new Container();

  constructor() {
    super();
    // Separação de camadas para ordenação e sombras
    this.addChild(this.shadowsLayer);
    this.addChild(this.tilesLayer);
    this.addChild(this.effectsLayer);
  }

  public addTile(textureKey: string, gridX: number, gridY: number, layerZ: number) {
    const texture = Assets.get(textureKey);
    const sprite = new Sprite(texture);

    // Deslocamento 2.5D baseado na camada Z
    const zOffsetX = layerZ * 6;
    const zOffsetY = -layerZ * 6;

    sprite.x = gridX + zOffsetX;
    sprite.y = gridY + zOffsetY;

    // Sombra projetada no shadowsLayer
    const shadow = new Sprite(texture);
    shadow.tint = 0x000000;
    shadow.alpha = 0.25 * Math.min(layerZ, 3);
    shadow.x = sprite.x + 8;
    shadow.y = sprite.y + 12;

    this.shadowsLayer.addChild(shadow);
    this.tilesLayer.addChild(sprite);
  }
}
```

---

## ✨ Sistema de Partículas de Combinação (Match Effect)

Efeito leve e limpo de partículas quando duas peças compatíveis são eliminadas:

```typescript
import { Container, Graphics } from 'pixi.js';

export class MatchParticleExplosion extends Container {
  private particles: Array<{ g: Graphics; vx: number; vy: number; life: number }> = [];

  constructor(x: number, y: number, color: number = 0xffd700) {
    super();
    this.x = x;
    this.y = y;

    const count = 16;
    for (let i = 0; i < count; i++) {
      const g = new Graphics();
      g.circle(0, 0, 3 + Math.random() * 3);
      g.fill(color);

      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 2 + Math.random() * 4;

      this.particles.push({
        g,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1, // Leve subida
        life: 1.0,
      });

      this.addChild(g);
    }
  }

  public update(deltaRatio: number): boolean {
    let alive = false;
    for (const p of this.particles) {
      if (p.life > 0) {
        p.g.x += p.vx * deltaRatio;
        p.g.y += p.vy * deltaRatio;
        p.vy += 0.15 * deltaRatio; // Gravidade sutil
        p.life -= 0.03 * deltaRatio;
        p.g.alpha = Math.max(0, p.life);
        p.g.scale.set(p.life);
        alive = true;
      }
    }
    return alive; // Retorna false quando todas as partículas sumirem para destruição
  }
}
```

---

## 📱 Ciclo de Vida Mobile (Capacitor)

Sempre que a aplicação for minimizada ou entrar em segundo plano, desative os tickers do PixiJS e libere temporariamente contextos pesados:

```typescript
import { App as CapApp } from '@capacitor/app';

export function bindPixiToAppLifecycle(pixiApp: Application) {
  CapApp.addListener('appStateChange', ({ isActive }) => {
    if (!isActive) {
      // App em segundo plano: suspende tudo
      pixiApp.ticker.stop();
    } else {
      // App retornou ao primeiro plano: redesenha uma vez
      pixiApp.render();
    }
  });
}
```

---

## 📋 Checklist de Qualidade PixiJS Mobile

1. [ ] **Render-on-demand:** `autoStart: false` no `Application.init`, `ticker.stop()` chamado em repouso.
2. [ ] **Resolução balanceada:** Limitar `resolution` ao teto de 2 para evitar explosão de memória de GPU em telas Quad HD/4K.
3. [ ] **Culling de objetos:** Não renderizar peças ou sombras fora do viewport se houver zoom ou corte de câmera.
4. [ ] **Destruição explícita:** Chamar `.destroy({ children: true, texture: false })` ao desmontar containers para evitar vazamento de memória (Memory Leaks).
