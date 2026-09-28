# 📱 Diretrizes Mobile, Bateria e Performance

Este documento define padrões de engenharia para garantir máxima autonomia de bateria, estabilidade térmica e acessibilidade mobile no **Mahjong Solitaire**.

---

## 🔋 1. Otimização de Bateria e Ciclo de Vida

### Renderização Sob Demanda (*Dirty Flag*)
- **Zero CPU/GPU ociosa**: Mahjong é um jogo baseado em turnos/tabuleiro estático. Não utilize loops infinitos contínuos de 60 FPS quando o jogo estiver ocioso.
- **Padrão de renderização**:
  - Redesenhe o Canvas apenas sob demanda (`requestRender()` acionado por toque, redimensionamento ou alteração de estado).
  - Use loops contínuos de `requestAnimationFrame` exclusivamente durante animações ativas (ex: peças deslizando, brilho pulsante de dica). Quando a animação terminar, o loop deve dormir.

### Gerenciamento de Segundo Plano (*Background Pause*)
- Quando o app perder o foco ou for minimizado no Android (via `@capacitor/app` ouvindo `appStateChange`):
  - Suspender imediatamente todos os tickers/render loops.
  - Pausar temporizadores de partida e sintetizadores de áudio.
  - Retomar o estado somente quando `isActive: true`.

---

## 👆 2. Ergonomia e Entrada por Toque (Acessibilidade Sênior)

### Alvos de Toque (*Touch Targets*)
- **Mínimo recomendado**: Todos os botões interativos (Desfazer, Dica, Embaralhar, Menu, Configurações) devem respeitar a área mínima de toque de **48×48 px** (WCAG/Material Design).
- **Tolerância de Hitbox nas Peças**:
  - Implementar uma margem de tolerância suave no cálculo de toque das peças do tabuleiro para evitar toques perdidos ou frustração em dedos menos precisos.

### Prevenção de Gestos Conflitantes
- Desabilitar gestos nativos indesejados no Canvas (ex: duplo toque para zoom, pull-to-refresh e seleção acidental de texto) via CSS:
  ```css
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  ```

---

## 🖥️ 3. Resolução Gráfica e Nitidez (High-DPI / DPR)

- **Ajuste de Nitidez para Telas OLED / Retina**:
  - Telas mobile operam com `window.devicePixelRatio >= 2.0` ou `3.0`.
  - O Canvas deve ter suas dimensões de buffer escaladas pelo DPR e reduzidas via CSS:
    ```typescript
    const dpr = Math.min(window.devicePixelRatio || 1, 2.0);
    canvas.width = Math.floor(cssWidth * dpr);
    canvas.height = Math.floor(cssHeight * dpr);
    ctx.scale(dpr, dpr);
    ```
  - Evitar DPR excessivo (>2.0): Em telas mobile de 6" (380-450 PPI), DPR 2.0 já atinge o padrão Retina (>280 DPI efetivos). Travar o teto em 2.0 economiza ~55% de largura de banda de memória GPU e VRAM sem perda perceptível de qualidade visual.

---

## 📦 4. Empacotamento Android & Live Updates (Google Play)

- **Formato de Distribuição**: Gerar builds de produção em **Android App Bundle (.aab)** com suporte estrito a 64-bit (`arm64-v8a`, `x86_64`).
- **Live Updates OTA (`@capawesome/capacitor-live-update`)**:
  - Catálogos de pranchas e correções leves são gerenciados por [`LiveUpdateManager.ts`](file:///d:/Este%20Computador/Documentos/gihub/mahjong/src/core/LiveUpdateManager.ts).
  - O app nunca bloqueia o usuário caso esteja sem internet: o bundle local instalado é carregado instantaneamente (Zero Loading / Offline-First).
- **Feedback Tátil (`@capacitor/haptics`)**:
  - Haptics são disparados apenas em eventos-chave (toque bem-sucedido em peça livre, combinação eliminada e vitória).
  - Evitar vibrações longas ou repetitivas para preservar a bateria e a tranquilidade da experiência Zen.

