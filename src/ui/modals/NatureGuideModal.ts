import { SoundManager } from '../../audio/SoundManager';
import { HapticManager } from '../../audio/HapticManager';

/**
 * Módulo de Hidratação Tardia (Lazy Hydration) do Guia da Natureza.
 * Reduz a árvore de nós do DOM inicial no cold start do Android em ~400 elementos,
 * injetando o markup apenas no primeiro toque do usuário no botão de Ajuda ou Clima.
 */
export class NatureGuideModal {
  private static isHydrated: boolean = false;

  public static hydrateGuide(soundManager: SoundManager, hapticManager: HapticManager): void {
    if (this.isHydrated) return;

    const modal = document.getElementById('modal-nature-guide');
    if (!modal) return;

    modal.innerHTML = `
      <div class="modal-card nature-guide-card">
        <div class="modal-header">
          <div class="nature-guide-title-box">
            <span class="guide-title-icon">📖</span>
            <h2>Guia da Natureza</h2>
          </div>
          <button class="modal-close" aria-label="Fechar Guia">&times;</button>
        </div>

        <!-- Abas de Navegação -->
        <div class="guide-nav-tabs">
          <button class="guide-tab-btn active" data-tab="synergies">🐾 Sinergias</button>
          <button class="guide-tab-btn" data-tab="climates">🌦️ Climas</button>
          <button class="guide-tab-btn" data-tab="specials">🪺 Especiais</button>
          <button class="guide-tab-btn" data-tab="tips">💡 Dicas</button>
        </div>

        <!-- Conteúdo rolável das abas -->
        <div class="modal-body guide-body-content">
          <!-- ABA 1: SINERGIAS ANIMAIS & NATUREZA -->
          <div id="guide-tab-synergies" class="guide-tab-pane active">
            <p class="guide-intro-text">
              Descubra as deliciosas conexões ecológicas da natureza! Ao combinar animais com seus alimentos favoritos ou habitat, você ativa a <strong>Resolução em Cascata</strong>: resgate de peças presas na bandeja, colheita de pares do tabuleiro ou dádivas de harmonia zen:
            </p>

            <!-- Seção 1: Caça & Banquete -->
            <div class="guide-section-title">👑 Caça & Banquete Silvestre</div>

            <div class="synergy-card">
              <div class="synergy-header">
                <div class="synergy-icons"><span>🐸</span> <span class="math-op">+</span> <span>🐞</span> <span class="math-sep">/</span> <span>🐝</span></div>
                <h4>Língua Ágil do Sapo</h4>
              </div>
              <p class="synergy-desc">O Sapo estica sua língua elástica e <strong>pesca insetos da bandeja</strong> para abri-la ou captura um par completo de insetos direto da mesa!</p>
            </div>

            <div class="synergy-card">
              <div class="synergy-header">
                <div class="synergy-icons"><span>🐱</span> <span class="math-op">+</span> <span>🐟</span></div>
                <h4>Pata Ágil do Gato</h4>
              </div>
              <p class="synergy-desc">O Gato dá uma patada rápida na beira da lagoa e <strong>pesca peixes que estejam ocupando a bandeja</strong> ou colhe um par completo do tabuleiro!</p>
            </div>

            <div class="synergy-card">
              <div class="synergy-header">
                <div class="synergy-icons"><span>🐻</span> <span class="math-op">+</span> <span>🍯</span> <span class="math-sep">/</span> <span>🐟</span></div>
                <h4>O Banquete do Urso</h4>
              </div>
              <p class="synergy-desc">O Urso combina com Mel ou Peixe, <strong>devora o alimento preso na bandeja</strong> para liberar espaço ou recolhe o banquete completo na mesa!</p>
            </div>

            <div class="synergy-card">
              <div class="synergy-header">
                <div class="synergy-icons"><span>🐧</span> <span class="math-op">+</span> <span>🐟</span></div>
                <h4>Deslize Glacial do Pinguim</h4>
              </div>
              <p class="synergy-desc">O Pinguim desliza veloz pelo manto de gelo e <strong>recolhe peixes no caminho</strong> ou desocupa peixes que estavam retidos na sua bandeja!</p>
            </div>

            <div class="synergy-card">
              <div class="synergy-header">
                <div class="synergy-icons"><span>🦔</span> <span class="math-op">+</span> <span>🍎</span></div>
                <h4>Espinho Coletor do Ouriço</h4>
              </div>
              <p class="synergy-desc">O Ouriço rola pelo pomar e <strong>espeta um par completo de maçãs</strong> em seus espinhos ou recolhe a fruta esquecida na bandeja!</p>
            </div>

            <!-- Seção 2: Coleta & Forrageamento -->
            <div class="guide-section-title">🌰 Coleta & Forrageamento</div>

            <div class="synergy-card">
              <div class="synergy-header">
                <div class="synergy-icons"><span>🐒</span> <span class="math-op">+</span> <span>🍌</span></div>
                <h4>Salto na Copa do Macaco</h4>
              </div>
              <p class="synergy-desc">O Macaco combina com a Banana, salta acrobaticamente pelas árvores e <strong>reorganiza as peças da mesa alegremente</strong> abrindo novos caminhos livres!</p>
            </div>

            <div class="synergy-card">
              <div class="synergy-header">
                <div class="synergy-icons"><span>🐝</span> <span class="math-op">+</span> <span>🍯</span></div>
                <h4>Dança das Abelhas</h4>
              </div>
              <p class="synergy-desc">A Abelha combina com o Favo de Mel para soltar um enxame dourado que <strong>colhe mel da bandeja com doçura</strong> ou recolhe o favo da mesa!</p>
            </div>

            <div class="synergy-card">
              <div class="synergy-header">
                <div class="synergy-icons"><span>🐿️</span> <span class="math-op">+</span> <span>🌰</span></div>
                <h4>Toca de Inverno do Esquilo</h4>
              </div>
              <p class="synergy-desc">O Esquilo combina com a Noz e <strong>recolhe nozes ou resgata sementes da bandeja</strong> para sua despensa secreta de inverno!</p>
            </div>

            <div class="synergy-card">
              <div class="synergy-header">
                <div class="synergy-icons"><span>🐰</span> <span class="math-op">+</span> <span>🍎</span></div>
                <h4>Salto Ágil do Coelho</h4>
              </div>
              <p class="synergy-desc">O Coelho dá um salto gracioso pelo pomar, <strong>colhe maçãs no tabuleiro</strong> e mordisca frutas da bandeja para abrir espaço!</p>
            </div>

            <div class="synergy-card">
              <div class="synergy-header">
                <div class="synergy-icons"><span>🦊</span> <span class="math-op">+</span> <span>🍇</span></div>
                <h4>Rastro Astuto da Raposa</h4>
              </div>
              <p class="synergy-desc">A Raposa entra sorrateiramente nos vinhedos, <strong>recolhendo cachos de uvas do tabuleiro e da bandeja</strong> com elegância sem deixar rastros!</p>
            </div>

            <div class="synergy-card">
              <div class="synergy-header">
                <div class="synergy-icons"><span>🐦</span> <span class="math-op">+</span> <span>🍇</span></div>
                <h4>Voo Rasante do Pássaro</h4>
              </div>
              <p class="synergy-desc">O Pássaro sobrevoa o vinhedo em voo rasante, <strong>colhe o par de uvas</strong> e acalma o tabuleiro com seu canto matinal sereno!</p>
            </div>

            <div class="synergy-card">
              <div class="synergy-header">
                <div class="synergy-icons"><span>🐌</span> <span class="math-op">+</span> <span>🍃</span></div>
                <h4>Passo Sereno do Caracol</h4>
              </div>
              <p class="synergy-desc">O Caracol desliza com máxima calma sobre a folha fresca, <strong>trazendo foco pleno, desocupando a bandeja</strong> e espalhando harmonia zen!</p>
            </div>

            <!-- Seção 3: Guardiões dos Mares & Savana -->
            <div class="guide-section-title">🌊 Guardiões dos Mares & Savana</div>

            <div class="synergy-card">
              <div class="synergy-header">
                <div class="synergy-icons"><span>🐬</span> <span class="math-op">+</span> <span>🐚</span></div>
                <h4>Eco Sonar do Golfinho</h4>
              </div>
              <p class="synergy-desc">O Golfinho emite ondas de sonar cristalinas, <strong>ilumina conchas livres e resgata conchas da bandeja</strong> para as profundezas marinhas!</p>
            </div>

            <div class="synergy-card">
              <div class="synergy-header">
                <div class="synergy-icons"><span>🐢</span> <span class="math-op">+</span> <span>🐚</span></div>
                <h4>Escudo de Carapaça da Tartaruga</h4>
              </div>
              <p class="synergy-desc">A Tartaruga usa sua paciência milenar para <strong>proteger e recolher conchas da bandeja</strong> e do tabuleiro com equilíbrio inabalável!</p>
            </div>

            <div class="synergy-card">
              <div class="synergy-header">
                <div class="synergy-icons"><span>🐼</span> <span class="math-op">+</span> <span>🎋</span> <span class="math-sep">/</span> <span>🌰</span></div>
                <h4>Bambu Zen do Panda</h4>
              </div>
              <p class="synergy-desc">O Panda colhe brotos de bambu e sementes com sabedoria ancestral, <strong>aliviando a bandeja com serenidade</strong> e concedendo harmonia extra!</p>
            </div>

            <div class="synergy-card">
              <div class="synergy-header">
                <div class="synergy-icons"><span>🐘</span> <span class="math-op">+</span> <span>🌰</span> <span class="math-sep">/</span> <span>🪨</span></div>
                <h4>Impacto Monumental do Elefante</h4>
              </div>
              <p class="synergy-desc">A manada de elefantes pisa com força colossal, <strong>estremecendo peças pesadas para fora do tabuleiro</strong> e resgatando a bandeja com sua tromba!</p>
            </div>

            <div class="synergy-card">
              <div class="synergy-header">
                <div class="synergy-icons"><span>🦆</span> <span class="math-op">+</span> <span>🐟</span></div>
                <h4>Mergulho na Lagoa do Pato</h4>
              </div>
              <p class="synergy-desc">O Patinho mergulha na água límpida e <strong>pesca peixes da bandeja e da mesa</strong> gerando marolas calmantes de serenidade!</p>
            </div>

            <div class="synergy-card">
              <div class="synergy-header">
                <div class="synergy-icons"><span>🐶</span> <span class="math-op">+</span> <span>🐱</span> <span class="math-sep">/</span> <span>🐟</span></div>
                <h4>Harmonia Doméstica</h4>
              </div>
              <p class="synergy-desc">Cão e Gato brincam juntos em pura amizade e lealdade, <strong>unindo forças para resgatar peças da bandeja</strong> com carinho fraternal!</p>
            </div>

            <div class="synergy-card">
              <div class="synergy-header">
                <div class="synergy-icons"><span>🦁</span> <span class="math-op">+</span> <span>☀️</span></div>
                <h4>Rugido Radiante do Leão</h4>
              </div>
              <p class="synergy-desc">O Rei da Savana ruge majestoso sob o sol dourado, <strong>iluminando a mesa, recolhendo o sol da bandeja</strong> e trazendo calor nobre!</p>
            </div>

            <!-- Seção 4: Flores & Botânica -->
            <div class="guide-section-title">🌺 Flores & Botânica Zen</div>

            <div class="synergy-card">
              <div class="synergy-header">
                <div class="synergy-icons"><span>🦋</span> <span class="math-op">+</span> <span>🌸</span> <span class="math-sep">/</span> <span>🪷</span></div>
                <h4>Metamorfose Floral da Borboleta</h4>
              </div>
              <p class="synergy-desc">O bater de asas suave da Borboleta poliniza flores de lótus e cerejeiras, <strong>purificando a bandeja com leveza zen</strong> e graça natural!</p>
            </div>

            <div class="synergy-card">
              <div class="synergy-header">
                <div class="synergy-icons"><span>🌺</span> <span class="math-op">+</span> <span>🌸</span> <span class="math-sep">/</span> <span>🌻</span></div>
                <h4>Jardim Zen & Polinizadores</h4>
              </div>
              <p class="synergy-desc">Flores de lótus, girassóis, cerejeiras e rosas se unem a abelhas e joaninhas, <strong>espalhando pólen curativo e concedendo grandes bônus de harmonia</strong>!</p>
            </div>

            <!-- Seção 5: Santuário Místico & Coringa -->
            <div class="guide-section-title">🐉 Santuário Místico & Coringa</div>

            <div class="synergy-card">
              <div class="synergy-header">
                <div class="synergy-icons"><span>🦎</span> <span class="math-op">+</span> <span>✨</span></div>
                <h4>Camaleão Holográfico (Coringa)</h4>
              </div>
              <p class="synergy-desc">A criatura mais adaptável da natureza! O Camaleão se <strong>transforma instantaneamente em qualquer animal</strong> com quem for pareado para fechar a jogada!</p>
            </div>

            <div class="synergy-card">
              <div class="synergy-header">
                <div class="synergy-icons"><span>🐉</span> <span class="math-op">+</span> <span>🪷</span> <span class="math-sep">/</span> <span>🦄</span></div>
                <h4>Harmonia Celestial Mística</h4>
              </div>
              <p class="synergy-desc">Dragão Celestial, Fênix Sagrada e Unicórnio Místico despertam energias transcendentais, <strong>concedendo a bênção suprema de pontuação (+300 pts)</strong>!</p>
            </div>

            <div class="synergy-card">
              <div class="synergy-header">
                <div class="synergy-icons"><span>🐋</span> <span class="math-op">+</span> <span>🦭</span> <span class="math-sep">/</span> <span>🦈</span></div>
                <h4>Abismo Oceânico & Polar</h4>
              </div>
              <p class="synergy-desc">Baleias, focas, orcas e tubarões conectam as marés profundas, <strong>purificando as correntes marítimas do tabuleiro</strong> com harmonia glacial!</p>
            </div>
          </div>

          <!-- ABA 2: CLIMAS DA NATUREZA -->
          <div id="guide-tab-climates" class="guide-tab-pane hidden">
            <p class="guide-intro-text">
              Ao combinar pares consecutivos da mesma família ecológica ou manter um ritmo ágil de combinações (<em>Streak</em>), você desperta os 7 Grandes Poderes Elementais da Natureza:
            </p>

            <div class="climate-card climate-water">
              <div class="climate-badge">🌊 Maré Alta Purificadora</div>
              <p class="climate-req">Gatilho: 2 pares aquáticos em sequência (Peixe, Golfinho, Pato, Tartaruga, Baleia, Foca)</p>
              <p class="climate-desc">Uma onda límpida <strong>lava e esvazia totalmente as peças da bandeja</strong>, e a correnteza tem chance de <strong>eliminar +1 par extra na mesa</strong>!</p>
            </div>

            <div class="climate-card climate-sun">
              <div class="climate-badge">☀️ Onda de Calor</div>
              <p class="climate-req">Gatilho: 2 pares da savana / sol (Leão, Elefante, Macaco, Girafa, Camelo, Cão)</p>
              <p class="climate-desc">Derrete instantaneamente todas as <strong>Peças de Gelo ❄️</strong> do tabuleiro e transmuta uma peça comum em <strong>Camaleão Coringa 🦎</strong>!</p>
            </div>

            <div class="climate-card climate-ice">
              <div class="climate-badge">❄️ Nevasca Ártica</div>
              <p class="climate-req">Gatilho: 2 pares polares (Pinguim, Urso Polar, Lobo, Foca)</p>
              <p class="climate-desc">O sopro congelante colhe um par completo do tabuleiro e presenteia você com <strong>+1 Dica Gratuita 💡</strong>!</p>
            </div>

            <div class="climate-card climate-wind">
              <div class="climate-badge">🍂 Vendaval de Outono</div>
              <p class="climate-req">Gatilho: 2 pares florestais (Pássaro, Raposa, Esquilo, Panda, Ouriço, Coruja)</p>
              <p class="climate-desc">Uma revoada de folhas douradas <strong>corta todas as Vinhas de Cipó 🌿</strong> da mesa e restaura <strong>+1 Misturar 🔀</strong>!</p>
            </div>

            <div class="climate-card climate-spring">
              <div class="climate-badge">🌸 Brisa da Primavera</div>
              <p class="climate-req">Gatilho: 2 pares de jardim / flora (Borboleta, Abelha, Coelho, Joaninha, Flores, Brotos)</p>
              <p class="climate-desc">Faz desabrochar a vida silvestre: <strong>choca todos os Casulos e Ovos 🥚</strong> do tabuleiro em peças livres e concede bônus de harmonia zen!</p>
            </div>

            <div class="climate-card climate-moon">
              <div class="climate-badge">🌕 Noite de Lua Cheia</div>
              <p class="climate-req">Gatilho: Sequência contínua de 4 acertos rápidos sem pausa (Streak 4+)</p>
              <p class="climate-desc">O tabuleiro é banhado por vaga-lumes reluzentes que <strong>iluminam com serenidade 1 par livre</strong> na mesa, sem confusão visual!</p>
            </div>

            <div class="climate-card climate-storm">
              <div class="climate-badge">🌧️ Tempestade Zen</div>
              <p class="climate-req">Gatilho: Sequência de 3 acertos ágeis consecutivos</p>
              <p class="climate-desc">Um relâmpago dourado abençoa a partida e <strong>recarrega +1 Marreta Zen 🔨</strong>!</p>
            </div>
          </div>

          <!-- ABA 3: PEÇAS ESPECIAIS & ELEMENTOS -->
          <div id="guide-tab-specials" class="guide-tab-pane hidden">
            <p class="guide-intro-text">
              Conheça os elementos vivos, obstáculos e relíquias que habitam os tabuleiros ancestrais:
            </p>

            <div class="special-card">
              <div class="special-icon">🦎</div>
              <div class="special-info">
                <h4>O Camaleão Dourado (Coringa)</h4>
                <p>Combina com <strong>qualquer animal</strong>! Se você colocar um bicho na bandeja e tocar no Camaleão, ele assume a mesma forma e fecha o par!</p>
              </div>
            </div>

            <div class="special-card">
              <div class="special-icon">❄️</div>
              <div class="special-info">
                <h4>Peça Congelada (Gelo)</h4>
                <p>Trancada e imóvel pelo frio. Para libertá-la, desobstrua suas laterais ou invoque o calor radiante da <strong>Onda de Calor ☀️</strong>!</p>
              </div>
            </div>

            <div class="special-card">
              <div class="special-icon">🥚</div>
              <div class="special-info">
                <h4>Casulo / Ovo Surpresa</h4>
                <p>Guarda um ser misterioso em seu interior. Choca ao combinar pares ao seu redor ou com a <strong>Brisa da Primavera 🌸</strong>, revelando peças livres!</p>
              </div>
            </div>

            <div class="special-card">
              <div class="special-icon">🪨</div>
              <div class="special-info">
                <h4>Rocha Ancestral (Bloqueio)</h4>
                <p>Pedra milenar que bloqueia passagens e corredores. Pode ser quebrada com a <strong>Marreta Zen 🔨</strong> ou desobstruída liberando ambos os lados.</p>
              </div>
            </div>

            <div class="special-card">
              <div class="special-icon">🌿</div>
              <div class="special-info">
                <h4>Vinhas de Cipó</h4>
                <p>Raízes que enlaçam a peça impedindo seu movimento até que as vizinhas sejam removidas ou o <strong>Vendaval de Outono 🍂</strong> corte as amarras.</p>
              </div>
            </div>

            <div class="special-card">
              <div class="special-icon">🎁</div>
              <div class="special-info">
                <h4>Baú da Fortuna</h4>
                <p>Um relicário dourado escondido no tabuleiro! Ao combinar o par, você ganha de presente <strong>+1 Marreta 🔨, +1 Dica 💡 ou +1 Embaralhar 🔀</strong>!</p>
              </div>
            </div>

            <div class="special-card">
              <div class="special-icon">🪞</div>
              <div class="special-info">
                <h4>Espelho Místico</h4>
                <p>Superfície mágica reluzente que assume a forma exata do <strong>último animal que você combinou</strong> na mesa!</p>
              </div>
            </div>
          </div>

          <!-- ABA 4: DICAS & MECÂNICAS ZEN -->
          <div id="guide-tab-tips" class="guide-tab-pane hidden">
            <p class="guide-intro-text">
              Regras suaves, acessibilidade sênior e recursos de conforto pensados para um jogo 100% relaxante e livre de estresse:
            </p>

            <div class="tip-box">
              <h4>🎯 A Bandeja Zen de 4 Slots</h4>
              <p>Ao tocar em uma peça livre, ela é guardada com carinho na bandeja inferior. Quando duas peças iguais se encontram na bandeja, o par se une e evapora com festa! Atenção: mantenha sempre espaço livre nos 4 slots para continuar combinando.</p>
            </div>

            <div class="tip-box">
              <h4>↩️ Desfazer Ilimitado & Sem Pressa</h4>
              <p>Aqui não existe punição nem pressa! Errou uma jogada ou quer tentar um caminho diferente? O botão <strong>Desfazer ↩️</strong> devolve as peças para o tabuleiro sem perda de estrelas ou pontuação.</p>
            </div>

            <div class="tip-box">
              <h4>💡 Dicas Gratuitas & Guiadas</h4>
              <p>Travou o olhar? O botão <strong>Dica 💡</strong> acende suavemente o melhor par disponível no momento para que você nunca fique preso, sem custo de recursos.</p>
            </div>

            <div class="tip-box">
              <h4>🔨 A Marreta Salvadora</h4>
              <p>A bandeja está cheia ou uma pedra bloqueia seu caminho? Ative a <strong>Marreta 🔨</strong> e toque na peça que deseja remover instantaneamente para reabrir o fluxo da partida.</p>
            </div>

            <div class="tip-box">
              <h4>🔀 Misturar com Garantia de Vitória</h4>
              <p>Reorganiza todas as peças restantes na mesa com validação matemática garantida: todo tabuleiro gerado possui solução comprovada sem empates forçados.</p>
            </div>

            <div class="tip-box">
              <h4>🌟 Resgate Cósmico (Proteção Anti-Derrota)</h4>
              <p>Se a sua bandeja encher sem pares ou o tabuleiro ficar sem jogadas, o <strong>Resgate Cósmico</strong> entra em ação automaticamente para salvar o jogo e reabrir espaços seguros!</p>
            </div>

            <div class="tip-box">
              <h4>👆 Toque Longo / Inspetor de Peças</h4>
              <p>Durante a partida, você pode <strong>segurar o dedo por 1 segundo</strong> em qualquer animal ou elemento para inspecionar seu nome, bioma, família e parceiros sinérgicos.</p>
            </div>

            <div class="tip-box">
              <h4>🔢 Numeração de Acessibilidade Sênior</h4>
              <p>Todas as peças contam com numerais arábicos sutis no cantinho (1 a 28) para facilitar a identificação visual imediata de espécies semelhantes para idosos e baixa visão.</p>
            </div>
          </div>
        </div>
      </div>
    `;

    // Conectar eventos das abas
    modal.querySelectorAll('.guide-tab-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const tab = target.dataset.tab;
        if (!tab) return;

        modal.querySelectorAll('.guide-tab-btn').forEach((b) => b.classList.remove('active'));
        target.classList.add('active');

        modal.querySelectorAll('.guide-tab-pane').forEach((pane) => pane.classList.add('hidden'));
        modal.querySelector(`#guide-tab-${tab}`)?.classList.remove('hidden');
        soundManager.playTileClick();
        hapticManager.impactLight();
      });
    });

    // Conectar botão de fechar do modal
    modal.querySelectorAll('.modal-close').forEach((btn) => {
      btn.addEventListener('click', () => {
        soundManager.playTileClick();
        hapticManager.impactLight();
        modal.classList.add('hidden');
      });
    });

    this.isHydrated = true;
  }
}
