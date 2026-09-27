---
name: level-design-analysis
description: >-
  Auditoria completa, diagnóstico e geração padronizada de relatórios de Level Design
  (10 itens canônicos) para as 50 fases do Mahjong Solitaire, cobrindo progressão
  matemática, ondas, tiers de fauna, biomas, balanceamento e mapas de calor.
---

# 🀄 Level Design Analysis & Audit Skill

Esta skill fornece uma metodologia rigorosa e automatizada para auditoria, diagnóstico de curva de dificuldade e geração padronizada de relatórios de **Level Design** para o catálogo oficial de 50 fases do Mahjong Solitaire.

---

## 🎯 Quando Ativar Esta Skill

Ative esta skill sempre que o usuário solicitar:
- *"analise de fases"*, *"auditoria de level design"*, *"relatório das fases"*.
- Diagnóstico ou balanceamento da curva de progressão (peças, ondas, camadas Z).
- Avaliação da diversidade do deck, desbloqueio de espécies nos 10 Tiers ou distribuição de biomas.
- Verificação de problemas de escalada (colapsos de dificuldade, stubs ou regressões).

---

## 📋 A Estrutura Canônica dos 10 Itens Obrigatórios

Todo relatório de Level Design gerado por esta skill **DEVE** conter rigorosamente as seguintes 10 seções:

### 1. Visão Geral da Arquitetura de Progressão
Matriz canônica de organização do jogo (atualmente **10 Mundos × 5 Níveis = 50 fases**), acompanhada da tabela de parâmetros no código (`WORLDS`, `slots.length`, `waves[]`, `zMax`, `worldTier`, `allowedSpecials[]`, `BoardRenderer`).

### 2. Curva de Progressão — Contagem de Peças por Nível
Gráfico visual em barras ASCII com todas as 50 fases agrupadas por Mundo, contendo:
* Número da fase (01 a 50) e nome amigável.
* Barra de proporção de peças (`█`).
* Contagem total de peças (somatório de todas as ondas).
* Quantidade de ondas (1, 2 ou 3).
* Altura máxima de camadas (`zMax`).

### 3. Introdução de Mecânicas Especiais (Curadoria vs. Realidade)
Tabela cronológica de estreia de cada mecânica especial por mundo (Peças Puras, Sinergias, Camaleão, Baú, Gelo, Multi-Onda, Cipós, Rocha, Casulo, Travessia Fluvial, Espelho, Savana, Aves Sagradas e Shanghai), com comentário pedagógico sobre o timing didático.

### 4. Diversidade de Biomas e Cenários Temáticos
Tabela detalhada dos 10 Mundos cobrindo:
* Bioma dominante (`garden`, `forest`, `arctic`, `savanna`, `water`, `temple`).
* Descrição da arte procedural em Canvas 2D desenhada nas bordas pelo `BoardRenderer`.
* Garantia de vinheta central suave com contraste WCAG AAA para repouso visual.

### 5. Diversidade de Peças — Curadoria de 10 Tiers
Tabela do sistema progressivo de 10 Tiers de fauna (`tileTiers.ts` e `LevelDeckCurator.ts`), detalhando a quantidade de espécies disponíveis, famílias desbloqueadas e exemplos emblemáticos, com status de validação automatizada (`test:curation`).

### 6. Problemas Críticos Identificados & Status de Resolução
Tabela comparativa contendo:
* Problema diagnosticado (ex: stubs, colapsos, falha de zoom, violations).
* Gravidade (🔴 Crítico, 🟡 Moderado, 🟢 Menor).
* Solução técnica implementada no código.
* Status de resolução (✅ Resolvido / ⚠️ Pendente).

### 7. Análise de Ondas (Waves)
Métricas agregadas da distribuição de ondas por Mundo (quantas fases têm 1 onda, 2 ondas e 3 ondas), além da média de peças por fase em cada mundo, assegurando ausência de ondas curtas demais (< 30 peças).

### 8. Sumário de Notas Atualizado por Dimensão
Quadro avaliativo de 1 a 10 cobrindo as 7 dimensões fundamentais do jogo:
1. *Introdução de Mecânicas*
2. *Diversidade de Biomas & Arte*
3. *Curva de Peças (Volume)*
4. *Curadoria de Deck (Tiers)*
5. *Qualidade dos Layouts*
6. *Clímax Final (Fase 50)*
7. *Ergonomia e Acessibilidade*

### 9. Recomendações & Próximos Passos de Polimento
Checklist claro separando:
* **Concluído:** Ações já implementadas e validadas nos testes.
* **Oportunidades Futuras (Opcional):** Sugestões de micro-polimento (áudio procedural de clique de pedra por bioma, haptics táteis, partículas comemorativas).

### 10. Mapa Visual de Calor — Complexidade por Nível (1 a 50)
Matriz visual condensada das 50 fases dividida nos 10 mundos com ícones cromáticos:
* 🟩 **Fácil / Tutorial:** ≤ 40 peças, 1 onda, zMax ≤ 2
* 🟨 **Médio-Baixo:** 41 a 60 peças, 1 onda, zMax ≤ 3
* 🟧 **Médio:** 61 a 100 peças, 1–2 ondas, zMax ≤ 3
* 🟥 **Difícil:** 101 a 144 peças, 2–3 ondas, zMax ≤ 3
* 🔴 **Épico / Clímax:** 144 a 186 peças, 3 ondas, zMax = 3 a 4

---

## ⚡ Automação: Gerador do Relatório Via CLI

O projeto conta com o script nativo [`scripts/generate_level_report.ts`](file:///d:/Este%20Computador/Documentos/gihub/mahjong/scripts/generate_level_report.ts) que extrai os dados diretamente dos módulos TypeScript da esteira (`CATALOG_50_LAYOUTS`, `WORLDS`, `levelRules.ts`).

### Comandos Rápidos:

```bash
# 1. Imprime o relatório completo de 10 itens diretamente no terminal
npm run report:levels

# 2. Gera e salva o relatório diretamente em um arquivo Markdown específico
npx tsx scripts/generate_level_report.ts --save "caminho/do/arquivo.md"
```

---

## 🧪 Regras de Validação & QA Obrigatório

Antes de finalizar qualquer análise ou alteração nas fases, os seguintes testes devem ser executados:

```bash
# Valida solvabilidade matemática e ausência de overlaps nas 50 fases
npm run validate:levels

# Valida conformidade estrita de Tiers (0 violações em 2016 pares)
npm run test:curation

# Valida todos os 31 cenários de fim de jogo e regras Zen
npm run test:zen
```
