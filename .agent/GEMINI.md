# 🀄 Mahjong Solitaire Offline - Regras Mestras do Projeto

## 📋 Visão Geral
Jogo de Mahjong Solitaire (Shanghai / Taipei) 100% offline para Android, desenvolvido em **Vite + TypeScript + HTML5 Canvas/PixiJS** e empacotado via **Capacitor 6**.
O produto tem foco extremo em usabilidade, ergonomia e acessibilidade para pessoas da terceira idade / jogadores casuais (com especial atenção para legibilidade, peças grandes, sem pressão de tempo, dicas e desfazer ilimitados).

## 🛠️ Stack Tecnológica
* **Frontend Core:** TypeScript (Strict), Vite, Vanilla CSS com variáveis de design system.
* **Engine Visual:** HTML5 Canvas 2D / PixiJS v8 para renderização acelerada por GPU a 60fps+ com sombreamento 2.5D de camadas Z.
* **Áudio:** Web Audio API com samples de áudio autênticos de toque de pedra de marfim (*clack*).
* **Mobile Runtime:** Capacitor 6 (`@capacitor/core`, `@capacitor/android`, `@capacitor/haptics`).
* **Offline-First:** Sem chamadas a APIs externas; todo o catálogo de pranchas, áudios e gerador matemático rodam 100% localmente.

## 🎨 Princípios de Design & Acessibilidade
1. **Legibilidade Suprema:** Peças nítidas com numerais arábicos sutis de auxílio nas pedras de Caracteres e Flores para identificação imediata.
2. **Zero Punição:** Desfazer ilimitado, Dicas gratuitas que brilham suavemente e Embaralhamento sem perda de progresso.
3. **Ergonomia Mobile:** Botões inferiores ampliados para toque com o polegar, suporte a tela cheia e orientação paisagem imersiva.
