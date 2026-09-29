---
name: modern-web-design
description: Princípios de design moderno, ergonomia tátil mobile, contraste visual acessível (WCAG AAA), paletas OKLCH e tipografia fluida com foco em acessibilidade para idosos e jogos casuais.
---

# Modern Web Design (Acessibilidade & Ergonomia Mobile)

Guia de design system, ergonomia e interface para jogos e aplicações mobile offline, focado em **máxima legibilidade, conforto tátil para idosos/jogadores casuais e estética moderna premium** (Dark Mode, OKLCH, micro-interações).

---

## 🎯 Quando Usar Esta Skill

- Criação ou refinamento de componentes de interface (menus, modais de fases, botões de ação e HUD de jogo).
- Definição de paletas de cores com conformidade **WCAG AAA** (mínimo 7:1 de contraste para leitura instantânea por seniores).
- Ajuste de dimensões de toque para alcance confortável do polegar (*thumb-friendly*).
- Tipografia responsiva e fluida com `clamp()` para suporte de telas pequenas (celulares compactos) até tablets em modo paisagem.
- Harmonização de feedback audiovisual e tátil (*Haptic Feedback*).

---

## 🧓 Pilares de Acessibilidade para a Terceira Idade

### 1. Ergonomia e Áreas de Toque (Touch Targets)
- **Dimensão mínima obrigatória:** 48x48px para botões secundários.
- **Dimensão recomendada para botões principais:** 56px a 64px de altura na barra de controle inferior.
- **Espaçamento entre botões:** Pelo menos 12px de distância para evitar toques acidentais por dedos trêmulos.
- **Posicionamento:** Botões críticos (Desfazer, Dica, Embaralhar) concentrados no terço inferior da tela, ao alcance natural dos polegares em modo paisagem ou retrato.

```css
/* Exemplo de botão ergonômico acessível */
.action-button {
  min-height: 56px;
  min-width: 56px;
  padding: 12px 20px;
  border-radius: 16px;
  font-size: clamp(1rem, 0.9rem + 0.5vw, 1.25rem);
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  touch-action: manipulation; /* Elimina o delay de 300ms de toque duplo no mobile */
  user-select: none;
}
```

---

## 🎨 Sistema de Cores OKLCH & Alto Contraste (WCAG AAA)

O espaço de cores **OKLCH** oferece percepção uniforme de brilho (*perceptual lightness*), garantindo que contrastes calculados funcionem exatamente como o olho humano percebe.

```css
:root {
  /* Fundo profundo sem preto puro (reduz fadiga ocular) */
  --bg-primary: oklch(18% 0.02 160);       /* Verde musgo escuro clássico de mesa */
  --bg-surface: oklch(24% 0.03 160);       /* Superfícies de cards e modais */
  --bg-surface-elevated: oklch(30% 0.04 160);

  /* Texto e ícones de alto contraste (Ratio > 9:1 contra o fundo) */
  --text-primary: oklch(98% 0.01 90);      /* Marfim claro nítido */
  --text-secondary: oklch(82% 0.03 90);    /* Marfim suave */
  --text-muted: oklch(68% 0.04 90);

  /* Acentos de destaque */
  --accent-gold: oklch(80% 0.18 85);       /* Dourado imperial para dicas e vitórias */
  --accent-jade: oklch(72% 0.16 150);      /* Verde jade para seleções ativas */
  --accent-ruby: oklch(62% 0.22 25);       /* Vermelho cereja para ações de alerta */

  /* Pedras do Mahjong (Visual Marfim / Bambu) */
  --tile-face: oklch(96% 0.02 90);         /* Face clara de marfim */
  --tile-edge: oklch(86% 0.04 90);         /* Chanfro lateral 2.5D */
  --tile-back: oklch(50% 0.14 140);        /* Traseira verde bambu */
  --tile-selected: oklch(90% 0.15 95);     /* Brilho âmbar de seleção */
}
```

---

## 🔤 Tipografia Fluida com `clamp()`

Evita textos minúsculos em celulares compactos e fontes desproporcionalmente gigantes em tablets:

```css
:root {
  /* Escala tipográfica fluida baseada no viewport */
  --font-xs: clamp(0.75rem, 0.70rem + 0.2vw, 0.85rem);
  --font-sm: clamp(0.875rem, 0.82rem + 0.3vw, 1.00rem);
  --font-base: clamp(1.00rem, 0.92rem + 0.4vw, 1.15rem);
  --font-lg: clamp(1.20rem, 1.10rem + 0.6vw, 1.45rem);
  --font-xl: clamp(1.50rem, 1.35rem + 0.9vw, 1.90rem);
  --font-title: clamp(1.80rem, 1.60rem + 1.2vw, 2.50rem);
}
```

---

## 📳 Feedback Multimodal Síncrono (Visual + Áudio + Tátil)

Para pessoas idosas, o reforço sensorial triplo elimina qualquer dúvida se uma ação foi registrada:

1. **Visual (< 50ms):** A peça ou botão sofre leve escala (0.95x) e borda de realce imediatamente ao encostar o dedo (`pointerdown`).
2. **Áudio:** Som seco de pedra de marfim (*clack* autêntico).
3. **Tátil (Capacitor Haptics):** Vibração ultracurta (*Light* para seleção, *Medium* para combinação, *Warning* para peça bloqueada).

```typescript
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export async function triggerHaptic(style: ImpactStyle = ImpactStyle.Light) {
  try {
    await Haptics.impact({ style });
  } catch {
    // Ignora graciosamente em navegadores web sem suporte
  }
}
```

---

## 🚫 Princípios de "Zero Frustração"

1. **Sem temporizadores punitivos:** Se houver cronômetro, ele deve ser puramente informativo, nunca causando "Game Over".
2. **Desfazer ilimitado:** Um jogador deve poder voltar quantos passos desejar sem penalidade de pontuação.
3. **Dicas claras:** As peças sugeridas pela dica devem pulsar suavemente em ouro/âmbar sem piscar agressivamente (prevenção contra desconforto visual e fotossensibilidade).

---

## 🪟 HUD Não-Invasivo (Zero-Distraction Interaction)

1. **Nunca obstrua a área de jogo/interação principal:** Toasts efêmeros, popups de eventos secundários (ex: ciclo solar/lunar, mudanças cosméticas de clima) jamais devem cobrir o centro do tabuleiro ou a área onde o jogador está tomando decisões.
2. **Ancoragem em Faixas Estáticas:** Notificações contextuais devem ser passivas e ancoradas nas extremidades (barra de sub-HUD superior ou inferior) sem sobreposição flutuante sobre alvos de toque.
3. **Feedback de Estado sem Interrupção:** Mudanças de estado devem ser comunicadas por partículas ambientais sutis ou atualização de texto no HUD, sem modais bloqueantes a cada rodada.

---

## 🗺️ Mapas de Fases e Trilhas em SVG (Saga Pathing)

1. **Hierarquia Visual de Caminhos:**
   * **Caminhos Concluídos:** Veio sólido, limpo e reluzente. Nunca aplique pontilhados móveis ou traços interrompidos sobre trechos já vencidos.
   * **Fronteira Ativa (Caminho para o Objetivo):** Destaque luminoso com feixe sutil de partículas/pulso direcionado exclusivamente ao nó corrente a ser jogado.
   * **Caminhos Bloqueados:** Linha sutil tracejada em tom suave e discreto.
2. **Desvio Limpo em Marcos e Portais:**
   * Linhas de conexão SVG jamais devem atravessar o miolo ou o texto de cards de transição/portais. A linha conecta na borda superior do marco e recomeça da borda inferior.
   * Cards de marcos devem ter planos de fundo ricos e opacos (com `backdrop-filter: blur(12px)`) para garantir leitura perfeita.

