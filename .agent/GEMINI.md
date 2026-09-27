# 🀄 Mahjong Solitaire Offline - Regras Mestras do Projeto

## 📋 Visão Geral
Jogo de Mahjong Solitaire (Shanghai / Taipei com mecânicas Zen de Natureza) 100% offline para Android, desenvolvido em **Vite + TypeScript + HTML5 Canvas 2D nativo** e empacotado via **Capacitor 6**.
O produto une o clássico Mahjong com mecânicas autorais de **Biomas, Climas, Sinergias e Bandeja Zen**, com foco extremo em usabilidade, ergonomia e acessibilidade para pessoas da terceira idade e jogadores casuais (legibilidade máxima, peças grandes, sem pressão de tempo, dicas e desfazer ilimitados).

---

## 🛠️ Stack Tecnológica & Arquitetura
* **Frontend Core:** TypeScript 5 (Strict), Vite 6, Vanilla CSS com variáveis de design system.
* **Engine Visual:** HTML5 Canvas 2D puro nativo (sem dependência de PixiJS) com sombreamento 2.5D, chanfros de marfim/jade, render-on-demand (*dirty flag*) e sistema próprio de partículas FX.
* **Áudio & Haptics:** Web Audio API com sintetizador/samples autênticos de toque de pedra de marfim (*clack*) e `@capacitor/haptics`.
* **Mobile Runtime & OTA:** Capacitor 6 (`@capacitor/core`, `@capacitor/android`, `@capacitor/haptics`) com suporte a atualizações OTA locais via `@capawesome/capacitor-live-update`.
* **Offline-First:** Sem chamadas a APIs externas; catálogo com mais de 50 pranchas, áudio procedural e gerador matemático rodam 100% localmente.

---

## 🌿 Mecânicas Centrais do Jogo
1. **Solitaire Clássico com Garantia de Vitória:** Todos os tabuleiros gerados são matematicamente solúveis (validados via pipeline de retropropagação).
2. **Biomas & Climas Naturais:** Efeitos climáticos sazonais (Sol, Chuva, Vento) e biomas temáticos (`src/core/nature/`) que influenciam sutilmente regras e atmosfera.
3. **Sinergias & Pedras Especiais:** Combinações especiais gerenciadas pelo `SynergyDirector` com animações dedicadas.
4. **Bandeja Zen (Tray Controller):** Mecânica tátil de reserva de peças que voam do tabuleiro para a bandeja inferior (`onTileFlightToTray`).
5. **Poderes Zen & Resgate Cósmico:** Recursos de auxílio generosos (Dicas, Embaralhamento e Cosmic Rescue) sem punição ao jogador.

---

## 🎨 Princípios de Design & Acessibilidade Sênior
1. **Legibilidade Suprema:** Peças nítidas com numerais arábicos sutis de auxílio nas pedras de Caracteres e Flores para identificação imediata.
2. **Zero Punição:** Desfazer ilimitado, Dicas gratuitas que brilham suavemente e Embaralhamento sem perda de estrelas ou pontuação.
3. **Ergonomia Mobile:** Botões inferiores ampliados para toque com o polegar (mínimo 48x48px), suporte a orientação paisagem e alvos de toque generosos.
4. **Eficiência Energética:** Renderização sob demanda (*render-on-demand*) para zero consumo de CPU/GPU em repouso e suspensão imediata ao minimizar o app. Detalhes em [.agent/rules/mobile-performance.md](file:///d:/Este%20Computador/Documentos/gihub/mahjong/.agent/rules/mobile-performance.md).

---

## 🧪 Scripts de Validação & QA Local
* `npm run test:zen`: Executa testes de cenários Zen (`scripts/verify_zen_scenarios.ts`).
* `npm run validate:levels`: Valida solvabilidade matemática e consistência das pranchas (`levelValidator.ts`).
* `npm run render:svg`: Renderiza vetores SVG para PNG via Node.js para inspeção visual multimodal com `view_file`.
* `npm run graphcode:audit`: Realiza auditoria estática de consistência e integridade de módulos.

---

## 🛑 Regras Operacionais de Git & Deploy
* **NUNCA executar `git push` ou enviar alterações para o GitHub sem pedido explícito do usuário.** Todo o desenvolvimento, testes locais e validações devem permanecer estritamente no ambiente local.

