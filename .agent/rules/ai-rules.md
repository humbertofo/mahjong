# Diretrizes Técnicas e Design System

## 1. Código e Tipagem
- **TypeScript Strict**: Nenhuma variável deve usar `any`. Modele com interfaces estritas (`Tile`, `TileType`, `Suit`, `Coordinates`, `BoardState`).
- **Arquitetura Desacoplada**:
  - `src/core/`: Lógica pura de regras, coordenadas 3D, detecção de peças livres e gerador de solvabilidade (sem acoplamento com DOM/Canvas).
  - `src/render/`: Motor de desenho das peças 2.5D, cálculo de sombras e projeções isométricas/ortogonais.
  - `src/audio/`: Sintetizador/reprodutor de efeitos sonoros com Web Audio API.
  - `src/ui/`: Gerenciador de telas, HUD, botões táteis e feedback visual.
  - `src/storage/`: Persistência local segura.

## 2. Design System Tokens (CSS)
- **Cores da Mesa:**
  - Feltro Verde Clássico: `#153E2A`
  - Madeira Mogno: `#2C1810`
  - Jardim Zen Dark: `#12161A`
- **Cores das Peças:**
  - Face da Pedra: `#FDFBF7` (Marfim acetinado)
  - Chanfro Lateral 3D: `#1E3F20` (Jade) / `#3A2312` (Madeira)
  - Sombra Z: `rgba(0, 0, 0, 0.35)`
  - Destaque Selecionada: `#F59E0B` (Âmbar/Dourado)
  - Dica Ativa (Hint): `#10B981` (Verde Esmeralda pulsante)
- **Tipografia:** Fonte limpa e legível (Outfit / Inter / Sans-serif) com numerais nítidos para visibilidade sênior.
