import * as fs from 'fs';
import * as path from 'path';
import { TILE_CATALOG } from '../src/core/nature/tiles/tileCatalog';
import { getAnimalTier } from '../src/core/nature/tiles/tileTiers';
import { CATALOG_50_LAYOUTS } from '../src/core/layouts/index';
import { WORLDS } from '../src/core/layouts/worlds';

const outputDir = path.resolve(process.cwd(), 'docs/compendium');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('Gerando Compêndio Oficial...');

// ============================================================================
// 1. VOLUME I: MECÂNICAS E REGRAS ZEN
// ============================================================================
const vol1Content = `# 📜 Volume I: Manual de Mecânicas & Regras Zen

> **Bíblia de Game Design & Arquitetura de Regras do Mahjong Solitaire Offline**  
> Documento Canônico de Referência para Engenharia e Game Design.

---

## 🏛️ 1. Filosofia Central de Design (O Padrão Zen)

O **Mahjong Solitaire Offline** une o clássico jogo ancestral de Shanghai com mecânicas ecológicas contemporâneas. A experiência é regida por 4 pilares inegociáveis:

1. **Acessibilidade Sênior Extrema:** Alvos de toque nunca inferiores a 48×48px, contraste visual WCAG AAA (>7:1), numerais arábicos sutis de auxílio nas pedras e feedback multimodal triplo (visual, clique sonoro de marfim e haptic feedback).
2. **Zero Punição:** Sem cronômetros punitivos (sem Game Over por tempo), Desfazer ilimitado e Dicas gratuitas que nunca reduzem pontuação ou estrelas.
3. **Solvabilidade Matemática Absoluta:** 100% dos tabuleiros gerados são solúveis, garantidos por um pipeline de geração e retropropagação matemática.
4. **Eficiência Mobile Offline:** Zero chamadas de API de rede, renderização sob demanda (*dirty flag*) com 0% de CPU/GPU em repouso e 60 FPS consistentes.

---

## 🀄 2. Fundamentos do Tabuleiro & Regras Clássicas

### Coordenadas Tridimensionais (X, Y, Z)
Cada peça ocupa uma posição tridimensional na prancha:
* **X e Y:** Coordenadas de grade espacial na mesa.
* **Z (Camada):** Altura da peça no empilhamento (Camada 0 é a base; camadas superiores até Z=5 formam pirâmides, torres e megálitos).

### Critérios de Peça Livre (*Free Tile*)
Uma peça só pode ser selecionada pelo jogador se cumprir **duas condições simultâneas**:
1. **Desobstrução Superior (Eixo Z):** Nenhuma outra peça pode estar sobreposta (total ou parcialmente) na camada imediatamente acima ($Z + 1$).
2. **Desobstrução Lateral (Eixo X):** O lado esquerdo **OU** o lado direito da peça deve estar completamente livre de vizinhos na mesma camada $Z$.

---

## 📥 3. A Bandeja Zen (Mecânica Central de 4 Slots)

A **Bandeja Zen** (*Tray Bar*) é uma mecânica tátil de reserva de peças localizada na faixa inferior da tela, contendo **4 slots**:

\`\`\`mermaid
graph LR
    Tab[Tabuleiro de Peças] -- Toque / Voo --> Tray[Bandeja Zen: 4 Slots]
    Tray -- Par Formado --> Match[Combinação Eliminada + Pontos]
    Tray -- Desfazer --> Tab
\`\`\`

### Dinâmica da Bandeja:
1. **Voo da Peça (\`onTileFlightToTray\`):** Ao tocar em uma peça livre no tabuleiro, ela não exige encontrar o par imediatamente. Ela voa animadamente para o primeiro slot livre da bandeja.
2. **Formação de Par na Bandeja:**
   * Se o jogador colocar uma peça na bandeja e, posteriormente, tocar no par correspondente no tabuleiro, a combinação é liquidada imediatamente.
   * Se duas peças idênticas já estiverem na bandeja, elas se fundem e são eliminadas, liberando os 2 slots ocupados.
3. **Resgate Cósmico (\`Cosmic Rescue\`):**
   * Se todas as peças do tabuleiro forem eliminadas e restar **1 peça órfã solitária** na bandeja (decorrente de transmutação, predador ou combinação ímpar prévia), o jogo aciona automaticamente o *Resgate Cósmico*. Uma aura dourada envolve a peça, eliminando-a com bônus celestial e concedendo a vitória à partida.
4. **Caminho Obstruído (\`Deadlock\`):**
   * Se os 4 slots da bandeja forem preenchidos e não houver nenhuma peça livre no tabuleiro que combine com as peças da bandeja, o estado de *Caminho Obstruído* é detectado pelo \`TrayTacticalOracle\`, oferecendo ao jogador as opções de Desfazer (Undo) ou Embaralhar (Shuffle).

---

## ✨ 4. Mecânicas Especiais & Ecológicas

### 1. Trinca Sagrada Zen (\`Sacred Trio\`)
* Quando 3 peças idênticas de uma espécie mística ou sagrada se encontram na bandeja, uma harmonia tríplice é disparada.
* **Efeito:** Eliminação instantânea das 3 peças com bônus de **+500 pontos** de Harmonia e explosão de partículas douradas.

### 2. Predação Selvagem (\`Wild Predation\`)
* Mecânica que simula a cadeia alimentar natural diretamente nos slots da bandeja.
* **Comportamento:** Quando um **Predador de Topo** (ex: 🦁 Leão, 🦅 Águia, 🐺 Lobo) entra na bandeja enquanto uma **Presa Natural** (ex: 🐰 Coelho, 🐟 Peixinho, 🐁 Esquilo) já está ocupando um slot:
  * O predador consome a presa.
  * A presa é removida da bandeja, **liberando um slot**.
  * É concedido um **Bônus Selvagem de +300 pontos**.
  * O predador permanece na bandeja aguardando seu próprio par.
  * O sistema de **Desfazer (Undo)** ressuscita a presa e restaura o tabuleiro perfeitamente.

### 3. Camaleão Místico (\`Universal Wildcard\`)
* O 🦎 **Camaleão** é o curinga universal do jogo.
* **Compatibilidade:** Combina bidirecionalmente com **qualquer uma das 157 entidades** do catálogo (animais, flora, elementos ou míticos).
* Ao ser pareado com qualquer peça, o Camaleão assume sua essência e liberta o par.

### 4. Ninho e Casulo Multi-Hit (\`Multi-Hit Cocoon\`)
* Estrutura blindada que protege uma espécie rara.
* **Mecânica de Eclosão:** O casulo não pode ser pareado diretamente. Ele requer **2 impactos adjacentes** (matches realizados em peças imediatamente vizinhas).
  * 1º Impacto: O casulo racha visualmente e emite faíscas.
  * 2º Impacto: O casulo se estilhaça e transmuta instantaneamente na criatura mística que guardava em seu interior (ex: Camaleão ou Borboleta Imperial).

### 5. Névoa dos Picos & Selos Rúnicos Elementais
* **Névoa dos Picos:** Peças cobertas por névoa densa. Ao combinar uma peça adjacente, o vento do match dissipa a névoa, revelando a face oculta.
* **Selos Elementais (Cúpulas Rúnicas):** Peças envoltas por uma barreira elementar (Fogo, Gelo, Trovão, Vento) que impede sua seleção. Ao encontrar e combinar o **Par-Chave** do elemento correspondente na mesa, todos os selos daquele elemento se estilhaçam com bônus de **+200 pontos**.

### 6. Ciclo Dia & Noite (Solar e Lunar)
* A cada 8 combinações de pares, o ambiente transita suavemente entre o **Dia** (Sol) e a **Noite** (Luar).
* **Bônus Solar (+150 pts):** Concedido quando espécies diurnas (Águias, Cavalos, Borboletas, Girassóis) são combinadas sob a luz do Sol.
* **Bônus Lunar (+150 pts):** Concedido quando espécies noturnas (Corujas, Lobos, Morcegos, Vagalumes) são combinadas sob a luz da Lua.

---

## 🧰 5. Arsenal de Poderes Zen (Ferramentas)

| Ferramenta | Ícone | Função | Regra de Penalidade |
| :--- | :---: | :--- | :--- |
| **Desfazer** | ↩️ | Reverte a última jogada com 100% de integridade (desfaz voos, matches, predações e restaura pontuação). | **Ilimitado e Gratuito** |
| **Dica Zen** | 💡 | Ilumina com aura pulsante de esmeralda/âmbar o par livre mais estratégico da mesa. | **Gratuito (Zero perda de estrelas)** |
| **Embaralhar** | 🔀 | Redistribui as peças restantes mantendo comprovadamente a solvabilidade matemática. | **Gratuito (Sem Game Over)** |
| **Marreta Zen** | 🔨 | Destrói uma peça isolada ou obstáculo bloqueador específico no tabuleiro. | **3 Cargas Iniciais por Partida** |

---

## ⭐ 6. Sistema de Avaliação Zen (1 a 3 Estrelas)

O critério de estrelas premia a serenidade e a exploração de combos da natureza sem jamais punir o jogador casual:

* ⭐ **1 Estrela (Conclusão Básica):** Concedida ao limpar todas as peças do tabuleiro e esvaziar a bandeja.
* ⭐⭐ **2 Estrelas (Harmonia Natural):** Concedida ao poupar ferramentas de auxílio (sem usar Marreta/Embaralhar) **OU** ativar pelo menos 2 sinergias ecológicas na partida.
* ⭐⭐⭐ **3 Estrelas (Zen Máximo):** Concedida ao poupar ferramentas de auxílio **E** ativar pelo menos 2 sinergias ecológicas, demonstrando domínio e serenidade total.
`;

fs.writeFileSync(path.join(outputDir, '01_MECANICAS_E_REGRAS.md'), vol1Content, 'utf-8');
console.log('✅ Volume I gerado.');

// ============================================================================
// 2. VOLUME II: CATÁLOGO DE PEÇAS E FAUNA (157 ENTIDADES)
// ============================================================================
let vol2Content = `# 🐾 Volume II: Bestiário & Catálogo Oficial de Peças

> **Catálogo Oficial das 157 Entidades da Natureza, 10 Tiers Ecológicos e 211 Sinergias**  
> Fonte Única da Verdade para Identidade Visual, VFX, Áudio e Compatibilidade Ecológica.

---

## 📊 Estatísticas Gerais do Catálogo
* **Total de Entidades Únicas:** 157 peças
* **Tiers Progressivos:** 10 Tiers (descoberta escalonada do Mundo 1 ao 10)
* **Sinergias Ecológicas Mapeadas:** 211 conexões dirigidas
* **Categorias:** Animais (110), Flora (26), Elementos Naturais (12), Míticos (8), Curinga (1)
* **Distribuição de Biomas:** Jardim (51), Floresta (43), Savana (27), Água (22), Glacial/Ártico (14)

---

## 🌿 Distribuição das Entidades por Tier de Descoberta

`;

for (let tier = 1; tier <= 10; tier++) {
  const tierTiles = TILE_CATALOG.filter((t) => getAnimalTier(t.value) === tier);
  vol2Content += `### Tier ${tier} — ${WORLDS[tier - 1]?.title || 'Mundo ' + tier} (${tierTiles.length} Entidades)\n\n`;
  vol2Content += `| Emoji | Valor | Nome Oficial | Categoria | Bioma | Papel / Dieta | Sinergias Com | Áudio |\n`;
  vol2Content += `| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :---: |\n`;

  tierTiles.forEach((t) => {
    const synList = t.synergiesWith.length > 0 ? t.synergiesWith.join(', ') : '—';
    const audio = t.audio?.timbre || 'zen';
    vol2Content += `| ${t.emoji} | \`${t.value}\` | ${t.label} | \`${t.category}\` | ${t.biome} | ${t.dietOrRole || 'Zen'} | ${synList} | \`${audio}\` |\n`;
  });
  vol2Content += '\n';
}

vol2Content += `---

## 🔗 Matriz de Sinergias Ecológicas Especiais (Amostra Canônica)

Quando duas espécies com ligação ecológica são combinadas sequencialmente na mesma onda, é ativada uma **Sinergia da Natureza**, gerando partículas exclusivas, som harmonioso e bônus de pontuação:

| Par Ecológico | Título da Sinergia | Efeito Visual (VFX) | Timbre de Áudio |
| :--- | :--- | :--- | :--- |
| 🐱 Gatinho + 🐟 Peixinho | *Pata Ágil* | Faíscas Douradas | \`leaf\` |
| 🐶 Cachorro + 🐱 Gatinho | *Melhores Amigos* | Faíscas Brilhantes | \`wood\` |
| 🐰 Coelho + 🍎 Maçã Zen | *Salto Veloz* | Pétalas Rosadas | \`leaf\` |
| 🐟 Peixinho + 🐻 Urso Pardo | *Banquete do Rio* | Ondas de Água | \`water\` |
| 🐼 Panda Zen + 🎋 Bambu Sagrado | *Harmonia Zen* | Brisa de Folhas | \`zen\` |
| 🐝 Abelhinha + 🌻 Girassol | *Dança do Pólen* | Pólen Cintilante | \`wind\` |
| 🦁 Leão + 🦓 Zebra | *Soberania da Savana* | Rugido Solar | \`wood\` |
| 🦅 Águia + 🐍 Serpente | *Visão das Alturas* | Ventania Celestial | \`wind\` |
| 🐺 Lobo + 🌕 Luar Místico | *Uivo da Meia-Noite* | Luz Astral Azulada | \`zen\` |
| 🐬 Golfinho + 🌊 Onda Cristalina | *Salto Oceânico* | Respingo Cristalino | \`water\` |
`;

fs.writeFileSync(path.join(outputDir, '02_CATALOGO_PECAS_FAUNA.md'), vol2Content, 'utf-8');
console.log('✅ Volume II gerado.');

// ============================================================================
// 3. VOLUME III: ATLAS DOS MUNDOS E AS 50 FASES OFICIAIS
// ============================================================================
let vol3Content = `# 🗺️ Volume III: Atlas dos Biomas & Catálogo das 50 Fases

> **Atlas Geográfico dos 10 Mundos e Especificação Técnica das 50 Fases Oficiais**  
> Verificação e Validação Matemática: 50 de 50 fases aprovadas (100% solúveis).

---

## 🌍 Os 10 Mundos Zen da Campanha

\`\`\`mermaid
graph LR
    W1[1. Jardim do Aprendiz] --> W2[2. Bosque da Fortuna]
    W2 --> W3[3. Vale Glacial]
    W3 --> W4[4. Floresta de Bambu]
    W4 --> W5[5. Santuário de Pedra]
    W5 --> W6[6. Rios Ancestrais]
    W6 --> W7[7. Reino dos Espelhos]
    W7 --> W8[8. Savana dos Segredos]
    W8 --> W9[9. Cumes Celestiais]
    W9 --> W10[10. Templo dos Mestres]
\`\`\`

| Mundo | Bioma Central | Fases | Guardião Zen | Atmosfera / Tema |
| :---: | :--- | :---: | :---: | :--- |
| **Mundo 1** | Jardim (\`garden\`) | 1 a 5 | 🐼 Panda Filhote | Trilhas floridas, pétalas e pedras suaves para aprendizado |
| **Mundo 2** | Bosque (\`forest\`) | 6 a 10 | 🦊 Raposa Astuta | Clareiras iluminadas e revelação do Camaleão Dourado |
| **Mundo 3** | Vale Glacial (\`arctic\`) | 11 a 15 | 🐻‍❄️ Urso Polar | Cristais de gelo, águas gélidas e auroras boreais |
| **Mundo 4** | Floresta de Bambu (\`forest\`) | 16 a 20 | 🐼 Mestre Panda | Cipós da selva, copas densas e sabedoria ancestral |
| **Mundo 5** | Santuário de Pedra (\`savanna\`) | 21 a 25 | 🪨 Tartaruga Anciã | Megálitos milenares, rochas esculpidas e casulos rúnicos |
| **Mundo 6** | Rios Ancestrais (\`water\`) | 26 a 30 | 🐬 Golfinho Sagrado | Pontes suspensas, corredeiras e labirintos fluviais |
| **Mundo 7** | Reino dos Espelhos (\`garden\`) | 31 a 35 | 🦚 Pavão Imperial | Salões de mármore imperial, reflexos e simetrias mágicas |
| **Mundo 8** | Savana dos Segredos (\`savanna\`) | 36 a 40 | 🦁 Leão Imperial | Grandes predadores, sol dourado e chaves mestras |
| **Mundo 9** | Cumes Celestiais (\`arctic\`) | 41 a 45 | 🦅 Águia Dourada | Picos nevados, vento cortante e o voo do Dragão Vermelho |
| **Mundo 10** | Templo dos Mestres (\`garden\`) | 46 a 50 | ⛩️ Grande Dragão | O ápice do Mahjong tradicional: Classic Shanghai com 144 peças |

---

## 📋 Catálogo Técnico das 50 Fases Oficiais

`;

vol3Content += `| # | ID da Fase | Nome Oficial | Mundo | Dificuldade | Peças | Estrutura de Ondas | Descrição |\n`;
vol3Content += `| :-: | :--- | :--- | :-: | :---: | :-: | :---: | :--- |\n`;

CATALOG_50_LAYOUTS.forEach((layout, idx) => {
  const levelNum = idx + 1;
  const worldIndex = Math.floor(idx / 5) + 1;
  const world = WORLDS[worldIndex - 1];
  const wavesText = layout.waves && layout.waves.length > 1 ? `🌊 ${layout.waves.length} Ondas` : 'Onda Única';
  vol3Content += `| **${levelNum}** | \`${layout.id}\` | ${layout.name} | M${worldIndex} (${world.title}) | ${layout.difficulty} | **${layout.slots.length}** | ${wavesText} | ${layout.description} |\n`;
});

vol3Content += `\n---

## 🧬 Curadoria Ecológica de Baralho (\`LevelDeckCurator\`)

O gerador de partidas utiliza o **LevelDeckCurator** com as seguintes garantias matemáticas:
1. **Co-ocorrência Garantida (≥ 85%):** Nenhuma peça de sinergia é colocada no tabuleiro sem que seu parceiro ecológico esteja presente na mesma onda.
2. **Respeito aos Tiers:** Fases do Mundo $N$ só utilizam animais dos Tiers $1 \dots N$, garantindo progressão e novidade contínua.
3. **Equilíbrio de Naipes:** Proporção harmoniosa entre animais de bioma principal e companheiros para evitar repetição excessiva.
`;

fs.writeFileSync(path.join(outputDir, '03_ATLAS_MUNDOS_E_FASES.md'), vol3Content, 'utf-8');
console.log('✅ Volume III gerado.');

// ============================================================================
// 4. VOLUME IV: README / ÍNDICE MESTRE
// ============================================================================
const indexContent = `# 🀄 Compêndio Oficial do Mahjong Solitaire Offline

> **Bíblia de Game Design, Bestiário de Fauna, Atlas de Mundos e Arquitetura de Software**  
> Edição Canônica Unificada — Mahjong Solitaire Zen Offline v1.0.1.

---

## 📚 Estrutura da Enciclopédia

Esta documentação consolida 100% dos aspectos do jogo em três volumes detalhados:

* 📘 **[Volume I: Manual de Mecânicas & Regras Zen](./01_MECANICAS_E_REGRAS.md)**
  * Solvabilidade garantida por retropropagação matemática.
  * Mecânica tátil da Bandeja Zen (4 slots), Resgate Cósmico e Deadlock.
  * Efeitos especiais: Trinca Sagrada, Predação Selvagem, Camaleão Curinga, Ninhos Multi-Hit, Névoa dos Picos e Selos Elementais.
  * Ciclos Dia & Noite, Arsenal de Ferramentas Zen e Sistema 3★.

* 🐾 **[Volume II: Bestiário & Catálogo Oficial de Peças](./02_CATALOGO_PECAS_FAUNA.md)**
  * As 157 entidades da natureza divididas em 10 Tiers ecológicos.
  * Matriz das 211 conexões de sinergias da natureza.
  * Atributos visuais, numerais de acessibilidade sênior, VFX de partículas e áudio procedural.

* 🗺️ **[Volume III: Atlas dos Biomas & Catálogo das 50 Fases](./03_ATLAS_MUNDOS_E_FASES.md)**
  * Os 10 Mundos temáticos (Jardim, Bosque, Glacial, Bambu, Pedra, Rios, Espelhos, Savana, Cumes e Mestres).
  * Catálogo completo das 50 Fases oficiais (peças, ondas, dificuldade e formatos).
  * Pipeline matemático do \`LevelDeckCurator\`.

---

## 🏗️ Mapa Geral de Módulos (DDD Leve)

\`\`\`mermaid
graph TD
    UI[src/ui/ - UIManager, Modals & HUD] <--> RENDER[src/render/ - BoardRenderer 2D Nativo]
    RENDER <--> CORE[src/core/ - BoardEngine & Solvabilidade]
    CORE --> NATURE[src/core/nature/ - Biomas, Climas & Curadoria]
    CORE --> ENGINE[src/core/engine/ - Tray, Zen & Synergy]
    CORE --> LAYOUTS[src/core/layouts/ - 50 Fases Verificadas]
    UI --> AUDIO[src/audio/ - SoundManager & Haptics]
    UI --> STORAGE[src/storage/ - StorageManager Seguro]
\`\`\`

---

## 🎯 Glossário Terminológico

* **Peça Livre (*Free Tile*):** Peça sem sobreposição no eixo Z e com pelo menos um lado lateral (esquerdo ou direito) desimpedido.
* **Bandeja Zen (*Tray Bar*):** Área inferior de 4 slots onde peças reservadas repousam até completarem pares.
* **Resgate Cósmico (*Cosmic Rescue*):** Resgate automático de peça órfã restante no slot quando a mesa foi completamente limpa.
* **Caminho Obstruído (*Deadlock*):** Saturação dos 4 slots da bandeja sem pares viáveis disponíveis no tabuleiro.
* **Predação Selvagem:** Ação ecológica em que um carnívoro consome uma presa na bandeja, liberando espaço e gerando bônus.
* **Dirty Flag (*Render-on-Demand*):** Paradigma que suspende o redesenho do Canvas quando não há animações ativas, zerando o consumo ocioso de bateria.
`;

fs.writeFileSync(path.join(outputDir, 'README.md'), indexContent, 'utf-8');
console.log('✅ Volume IV (README) gerado.');
console.log('🎉 Enciclopédia e Compêndio criados com sucesso em docs/compendium/!');
