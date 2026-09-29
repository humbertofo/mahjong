---
name: mobile-webview-performance
description: Padrões avançados de performance, telemetria de zero overhead, mitigação de bugs de GPU/WebViews (Mali/Adreno/WebKit), CSS containment seguro e render-on-demand para aplicações e jogos web/mobile offline.
---

# Mobile WebView Performance & Rendering Pitfalls

Guia agnóstico e definitivo de engenharia para aplicações e jogos híbridos (Capacitor, Cordova, PWA, Electron, WebView Android e iOS Safari). Focado em **60 FPS estáveis, zero jank, mitigação de bugs de rasterização de GPU e ausência de consumo ocioso de bateria**.

---

## 🎯 Quando Usar Esta Skill

- Desenvolvimento ou auditoria de interfaces gráficas rodando dentro de WebViews (Android WebView / iOS WKWebView).
- Otimização de framerate, estabilização de frametime (< 16.6ms) e eliminação de *jank* (quedas bruscas de quadros).
- Diagnóstico de anomalias visuais em telas mobile (caixas pretas ao redor de círculos, artefatos de corte, inversão de canal alfa).
- Implementação de telemetria diagnóstica de baixo custo para profiling em dispositivos reais de baixo/médio custo.
- Desenho e escalonamento de pranchas, mapas de fases (Saga maps) e componentes táticos sem sobrecarga de renderização.

---

## 🚫 1. As Armadilhas Críticas de CSS Containment & GPU Blending

Em WebViews móveis aceleradas por hardware (GPUs ARM Mali-Gxx, Qualcomm Adreno e Apple Bionic), o pipeline do Skia/Blink trata certas propriedades de CSS como gatilhos para alocação de buffers e texturas offscreen isoladas.

### A. O Perigo de `contain: paint` e `content-visibility: auto`

#### O Problema:
Quando você aplica `contain: paint` ou `content-visibility: auto` em elementos pequenos (< 100 itens na tela) que possuem:
- `box-shadow` com grande raio de propagação (*blur radius*)
- `border-radius: 50%` (nós circulares, badges, avatares)
- Auras com `radial-gradient` ou filtros `filter: blur(...)`
- Pseudo-elementos com expansão negativa (`inset: -14px`)

O navegador cria uma **caixa de corte retangular estrita** correspondente ao *bounding box* do elemento pai. Na GPU Mali/Adreno, os pixels translúcidos que transbordam são recortados com bordas rígidas e o blending do buffer offscreen com o fundo gera **caixas quadradas escuras ou pretas visíveis ao redor dos círculos**.

#### Regra de Ouro:
> **NUNCA use `contain: paint` ou `content-visibility: auto` em nós circulares ou elementos com sombras/halos luminosos.**
> Use containment apenas para blocos estritamente retangulares, opacos e em listas virtuais com milhares de itens simples.

```css
/* ❌ ANTI-PATTERN: Gera caixas quadradas escuras na GPU móvel */
.round-node {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  box-shadow: 0 0 20px rgba(245, 158, 11, 0.9);
  contain: layout style paint;      /* <- RECORTA O HALO EM QUADRADO */
  content-visibility: auto;         /* <- CRIA BUFFER OFFSCREEN COM ARTEFATO */
}

/* ✅ PADRÃO CORRETO: Renderização limpa e difusão esférica perfeita */
.round-node {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  box-shadow: 0 0 20px rgba(245, 158, 11, 0.9);
  /* Sem contain: paint. Deixe o compositor nativo desenhar sem recorte */
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}
```

---

### B. Bug de Blending em Pseudo-Elementos Transmutados (`::before` / `::after`)

#### O Problema:
Colocar pseudo-elementos (`::before`) com `border-radius: 50%`, `transform: rotate(...)` e cor semitransparente (`rgba(255, 255, 255, 0.5)`) para simular "reflexos de luz" em nós que já sofrem transforms causa **inversão de canal alfa (alfa premultiplicado incorreto)** no driver da GPU móvel. O reflexo branco vira um **buraco preto ou hematoma escuro** na tela.

#### Solução:
Construa o relevo e brilho 3D **no próprio background e nas sombras internas** do elemento pai:

```css
/* ❌ ANTI-PATTERN: Pseudo-elemento que inverte cor na Mali GPU */
.crystal-ball::before {
  content: '';
  position: absolute;
  top: 4px;
  left: 6px;
  width: 14px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.6);
  transform: rotate(-30deg); /* Suscetível a falhas de blending */
}

/* ✅ PADRÃO CORRETO: Efeito 3D nativo imune a falhas de composição */
.crystal-ball {
  background: linear-gradient(145deg, #10b981, #047857);
  border: 2px solid #a7f3d0;
  box-shadow: 
    0 4px 14px rgba(16, 185, 129, 0.6),        /* Sombra externa difusa */
    inset 0 2px 6px rgba(255, 255, 255, 0.55),  /* Brilho superior de marfim/cristal */
    inset 0 -3px 6px rgba(0, 0, 0, 0.35);       /* Sombra inferior de profundidade */
}
```

---

## 📊 2. Telemetria Diagnóstica de Zero Overhead

Para manter 60 FPS consistentes em qualquer hardware sem introduzir gargalos de CPU pela própria coleta, utilize amostragem não-bloqueante:

```typescript
export interface DiagnosticTelemetry {
  fps: number;
  avgFrameTimeMs: number;
  slowFramesCount: number;    // Quadros > 16.6ms
  janksCount: number;         // Quadros > 33.3ms
  memoryHeapUsedMB?: number;
  gpuRenderer: string;
  devicePixelRatio: number;
  screenOrientation: string;
}

export class RuntimeTelemetryCollector {
  private lastTime = performance.now();
  private frameCount = 0;
  private slowFrames = 0;
  private janks = 0;
  private totalFrameTime = 0;

  public onFrame(now: number): void {
    const delta = now - this.lastTime;
    this.lastTime = now;
    
    // Ignorar quadros gigantes gerados ao voltar do background
    if (delta > 200) return;

    this.frameCount++;
    this.totalFrameTime += delta;

    if (delta > 33.3) {
      this.janks++;
      this.slowFrames++;
    } else if (delta > 16.6) {
      this.slowFrames++;
    }
  }

  public getSnapshot(): DiagnosticTelemetry {
    let gpu = 'Desconhecida';
    try {
      const gl = document.createElement('canvas').getContext('webgl');
      const ext = gl?.getExtension('WEBGL_debug_renderer_info');
      if (gl && ext) {
        gpu = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || 'Desconhecida';
      }
    } catch {}

    const memory = (performance as any).memory;

    return {
      fps: this.frameCount > 0 ? Math.round(1000 / (this.totalFrameTime / this.frameCount)) : 60,
      avgFrameTimeMs: Number((this.totalFrameTime / Math.max(1, this.frameCount)).toFixed(2)),
      slowFramesCount: this.slowFrames,
      janksCount: this.janks,
      memoryHeapUsedMB: memory ? Number((memory.usedJSHeapSize / (1024 * 1024)).toFixed(2)) : undefined,
      gpuRenderer: gpu,
      devicePixelRatio: window.devicePixelRatio || 1,
      screenOrientation: screen.orientation?.type || 'unknown'
    };
  }
}
```

---

## 🔋 3. Renderização Sob Demanda (*Dirty Flag*) & Teto de DPR

### A. Teto de DPR (Device Pixel Ratio Capping)
Em celulares com telas QuadHD ou Full HD+ de alta densidade (DPR 2.75 ou 3.0), o Canvas aloca uma quantidade massiva de pixels (ex: 1080x2400 x 3 = milhões de fragmentos por frame). 

Trave o teto em `2.0`:
```typescript
// Trava ideal: fidelidade visual Retina com economia de até 55% de fillrate
const safeDPR = Math.min(window.devicePixelRatio || 1, 2.0);
canvas.width = Math.floor(cssWidth * safeDPR);
canvas.height = Math.floor(cssHeight * safeDPR);
ctx.scale(safeDPR, safeDPR);
```

### B. O Padrão Dirty Flag
Nunca use `requestAnimationFrame` em repouso. O app só desenha quando o estado muda:
```typescript
class CanvasEngine {
  private isDirty = false;

  public markDirty(): void {
    if (this.isDirty) return;
    this.isDirty = true;
    requestAnimationFrame(this.render.bind(this));
  }

  private render(): void {
    if (!this.isDirty) return;
    this.drawScene();
    this.isDirty = false;
  }
}
```

---

## 🗺️ 4. Mapas de Fases e Trilhas em SVG (Saga Pathing)

Ao conectar nós de progressão com curvas Bézier em SVG:

1. **Separação Estrita de Estados de Trilha:**
   * **Caminho Concluído:** Veio sólido, limpo e reluzente. Não aplique pontilhados móveis em caminhos já vencidos.
   * **Caminho de Fronteira Ativo:** O único segmento que liga o último nó concluído ao nó atual deve receber animação de fluxo (energia/partículas) em direção à fase corrente.
   * **Caminho Bloqueado:** Linha tênue, discreta e pontilhada em tom neutro/cinza.
2. **Desvio de Portais e Marcos:**
   * Nunca desenhe o traço SVG cruzando o interior de cards de mundos ou marcos intermediários:
     ```typescript
     if (p1.type === 'portal' && p2.type === 'portal') {
       continue; // Salta o interior do card; conecta no topo e recomeça na base
     }
     ```
   * Cards de marcos devem ter plano de fundo sólido e opaco com `backdrop-filter: blur(12px)` para garantir que nenhum elemento do fundo transpareça no texto.

---

## 💾 5. Persistência Offline Blindada & Safe Fallback

Em ambientes móveis, o `localStorage` pode lançar exceções inesperadas (`QuotaExceededError`, `SecurityError` em navegação anônima ou I/O crash em desligamento de tela). Garanta persistência resiliente com memória RAM transparente:

```typescript
export class SafeStorage {
  private static memoryFallback: Record<string, string> = {};

  public static setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      this.memoryFallback[key] = value;
    }
  }

  public static getItem(key: string): string | null {
    try {
      const val = localStorage.getItem(key);
      return val !== null ? val : (this.memoryFallback[key] || null);
    } catch {
      return this.memoryFallback[key] || null;
    }
  }
}
```
