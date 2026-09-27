---
name: lightweight-3d-effects
description: Efeitos de profundidade 2.5D, inclinação tátil (tilt), giroscópio e micro-interações pseudo-3D para enriquecer a experiência visual de peças e tabuleiros de Mahjong sem o peso de engines 3D completas.
---

# Lightweight 3D & 2.5D Effects (Mobile Tilt & Depth)

Guia de implementação de efeitos pseudo-3D, inclinação por toque (*touch tilt*), projeção de profundidade de camadas Z e paralaxe para jogos de tabuleiro em **Vanilla TypeScript / Canvas 2D**.

---

## 🎯 Quando Usar Esta Skill

- Criação da sensação táctil de que as peças de Mahjong são blocos físicos de marfim/bambu com espessura e relevo.
- Efeito de inclinação suave (*tilt*) na peça que está sendo tocada ou arrastada pelo dedo do jogador.
- Projeção de sombras realistas com base na altura da camada Z (uma peça na camada 5 projeta uma sombra mais suave e distante do que uma na camada 1).
- Efeito sutil de giroscópio opcional no tabuleiro (deslocamento leve de luz quando o jogador move o celular).

---

## 🀄 Efeito 2.5D em Peças de Mahjong (Isometric Tilt)

No Mahjong Solitaire, o aspecto visual de "pedra física" é construído desenhando três faces:
1. **Face Frontal (Top Face):** Onde o símbolo (Caractere, Bambu, Círculo, Dragão) é renderizado.
2. **Face Lateral Direita (Right Edge):** Espessura da pedra projetada em perspectiva.
3. **Face Inferior (Bottom Edge):** Base de madeira de bambu ou osso.

```typescript
export interface Tile2DProjection {
  x: number;
  y: number;
  width: number;
  height: number;
  depthZ: number; // Ex: 1 a 5
}

export function drawTile25D(
  ctx: CanvasRenderingContext2D,
  tile: Tile2DProjection,
  tiltFactorX: number = 0, // Variação leve ao tocar (-0.1 a 0.1)
  tiltFactorY: number = 0
) {
  const depth = tile.depthZ * 6;
  const offsetX = depth + tiltFactorX * 8;
  const offsetY = -depth + tiltFactorY * 8;

  ctx.save();
  ctx.translate(tile.x + offsetX, tile.y + offsetY);

  // 1. Sombra da base no chão (Drop Shadow)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.beginPath();
  ctx.roundRect(8, 12, tile.width, tile.height, 8);
  ctx.fill();

  // 2. Lateral da pedra (Borda 3D / Chanfro)
  ctx.fillStyle = '#dcd6c8'; // Cor da lateral de marfim
  ctx.beginPath();
  ctx.roundRect(0, 0, tile.width + 4, tile.height + 4, 8);
  ctx.fill();

  // 3. Traseira verde bambu (fatia inferior visível)
  ctx.fillStyle = '#205c3b';
  ctx.fillRect(tile.width, 4, 4, tile.height);
  ctx.fillRect(4, tile.height, tile.width, 4);

  // 4. Face Frontal da pedra
  ctx.fillStyle = '#fffdf7'; // Marfim limpo
  ctx.beginPath();
  ctx.roundRect(0, 0, tile.width, tile.height, 6);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}
```

---

## 👆 Inclinação Tátil (Touch Tilt Interaction)

Quando o jogador segura uma peça com o dedo antes de soltar ou confirmar a jogada, aplique um leve efeito de inclinação física para feedback tátil:

```typescript
export class TileTouchTilt {
  private activeTile: any = null;
  private startX = 0;
  private startY = 0;

  public onPointerDown(tile: any, clientX: number, clientY: number) {
    this.activeTile = tile;
    this.startX = clientX;
    this.startY = clientY;
    tile.elevation = 8; // Peça "levanta" da mesa
  }

  public onPointerMove(clientX: number, clientY: number) {
    if (!this.activeTile) return;

    // Calcula inclinação baseada na distância do toque inicial
    const deltaX = (clientX - this.startX) * 0.05;
    const deltaY = (clientY - this.startY) * 0.05;

    // Limita a inclinação máxima
    this.activeTile.tiltX = Math.max(-0.2, Math.min(0.2, deltaX));
    this.activeTile.tiltY = Math.max(-0.2, Math.min(0.2, deltaY));
  }

  public onPointerUp() {
    if (!this.activeTile) return;
    this.activeTile.elevation = 0;
    this.activeTile.tiltX = 0;
    this.activeTile.tiltY = 0;
    this.activeTile = null;
  }
}
```

---

## 📳 Sensor de Giroscópio Opcional (Efeito Mesa Viva)

Para dar uma sensação sutil de profundidade tridimensional ao movimentar o celular levemente nas mãos:

```typescript
export function setupParallaxGyroscope(onAngleChange: (angleX: number, angleY: number) => void) {
  if (typeof window.DeviceOrientationEvent === 'undefined') return;

  let lastUpdate = 0;
  const handleOrientation = (event: DeviceOrientationEvent) => {
    const now = performance.now();
    // Limita a atualização a no máximo 30hz para economizar bateria
    if (now - lastUpdate < 33) return;
    lastUpdate = now;

    const gamma = event.gamma || 0; // Inclinação Esquerda/Direita (-90 a 90)
    const beta = event.beta || 0;   // Inclinação Frente/Trás (-180 a 180)

    // Normaliza para uma faixa sutil (-1 a 1)
    const normX = Math.max(-1, Math.min(1, gamma / 30));
    const normY = Math.max(-1, Math.min(1, (beta - 45) / 30)); // 45 graus é a postura típica ao segurar o celular

    onAngleChange(normX, normY);
  };

  window.addEventListener('deviceorientation', handleOrientation, { passive: true });

  return () => {
    window.removeEventListener('deviceorientation', handleOrientation);
  };
}
```

---

## 🔋 Considerações de Performance Mobile

1. **Evite cálculos trigonométricos caros no render:** Use multiplicações simples e matrizes 2D de translação em vez de cálculos 3D completos.
2. **Desative o giroscópio quando o tabuleiro estiver ocioso:** Se não houver toque do usuário nos últimos 10 segundos, remova o listener de orientação para permitir que o processador do celular entre em repouso profundo.
