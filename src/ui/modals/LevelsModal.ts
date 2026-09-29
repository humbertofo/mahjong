import { ALL_LAYOUTS, WORLDS } from '../../core/layouts';
import { StorageManager } from '../../storage/StorageManager';
import { soundManager } from '../../audio/SoundManager';
import { hapticManager } from '../../audio/HapticManager';
import { getLevelRules } from '../../core/levelRules';
import { LevelDeckCurator } from '../../core/nature/LevelDeckCurator';

export class LevelsModal {
  public static renderLevelsList(
    currentLevelIndex: number,
    onSelectLevel: (idx: number) => void,
    showToast: (msg: string) => void
  ): void {
    const tabsContainer = document.getElementById('levels-world-tabs');
    const mapViewport = document.getElementById('levels-map-viewport');
    const mapContent = document.getElementById('levels-map-content');
    const mapSvg = document.getElementById('levels-map-svg');
    const previewCard = document.getElementById('atom-level-preview');
    const previewClose = document.getElementById('atom-preview-close');
    const btnPlay = document.getElementById('btn-atom-play');

    if (!mapContent || !mapSvg) return;

    if (previewCard) previewCard.classList.add('hidden');

    if (previewClose && previewCard) {
      previewClose.onclick = () => {
        soundManager.playTileClick();
        hapticManager.impactLight();
        previewCard.classList.add('hidden');
      };
    }

    // Fragmento de alta performance para inserção atômica única no DOM
    const contentFrag = document.createDocumentFragment();

    const worldHabitats = [
      { icon: '🌸', name: 'Jardim' },
      { icon: '🍃', name: 'Bosque' },
      { icon: '❄️', name: 'Glacial' },
      { icon: '🎋', name: 'Bambu' },
      { icon: '🪨', name: 'Pedra' },
      { icon: '🌊', name: 'Rios' },
      { icon: '🪞', name: 'Espelhos' },
      { icon: '🦁', name: 'Savana' },
      { icon: '🦅', name: 'Cumes' },
      { icon: '⛩️', name: 'Mestres' },
    ];

    // Preencher Tabs de Navegação Rápida entre Mundos via DocumentFragment
    if (tabsContainer) {
      const tabsFrag = document.createDocumentFragment();

      WORLDS.forEach((world, wIdx) => {
        const habitat = worldHabitats[wIdx] || { icon: '🌿', name: `Mundo ${wIdx + 1}` };
        const tab = document.createElement('button');
        tab.className = 'world-nav-tab';
        const isCurrentWorld = currentLevelIndex >= world.levelRange[0] - 1 && currentLevelIndex < world.levelRange[1];
        if (isCurrentWorld) {
          tab.classList.add('active');
          setTimeout(() => {
            tab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
          }, 120);
        }
        tab.innerHTML = `<span class="world-tab-icon">${habitat.icon}</span> <span class="world-tab-name">${habitat.name}</span>`;
        tab.addEventListener('click', () => {
          soundManager.playTileClick();
          hapticManager.impactLight();
          tabsContainer.querySelectorAll('.world-nav-tab').forEach((t) => t.classList.remove('active'));
          tab.classList.add('active');
          const portal = document.getElementById(`world-portal-${world.id}`);
          portal?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        tabsFrag.appendChild(tab);
      });

      tabsContainer.innerHTML = '';
      tabsContainer.appendChild(tabsFrag);
    }

    // Atualizar Contador Geral de Estrelas no Topo
    const totalStars = ALL_LAYOUTS.reduce((acc, l) => acc + StorageManager.getLevelStats(l.id).stars, 0);
    const starsHeader = document.getElementById('levels-header-stars');
    if (starsHeader) starsHeader.textContent = `⭐ ${totalStars} / ${ALL_LAYOUTS.length * 3}`;

    // Geometria Responsiva do Mapa
    const viewWidth = mapViewport ? mapViewport.clientWidth : 360;
    const baseWidth = Math.max(340, Math.min(480, viewWidth || 360));
    const centerX = baseWidth / 2;
    const xAmplitude = Math.min(100, Math.max(76, (baseWidth - 140) / 2));
    const nodeSpacingY = 96;
    const portalHeight = 62;

    interface RoutePoint {
      x: number;
      y: number;
      isUnlocked: boolean;
      type: 'portal' | 'node';
      idx?: number;
      isCurrent?: boolean;
      layout?: typeof ALL_LAYOUTS[0];
    }

    const route: RoutePoint[] = [];
    let currentY = 40;

    WORLDS.forEach((world, wIdx) => {
      const [startLvl, endLvl] = world.levelRange;
      const worldLayouts = ALL_LAYOUTS.slice(startLvl - 1, endLvl);

      let completedInWorld = 0;
      let starsInWorld = 0;
      worldLayouts.forEach((l) => {
        const stats = StorageManager.getLevelStats(l.id);
        if (stats.completed) {
          completedInWorld++;
          starsInWorld += stats.stars;
        }
      });

      const habitat = worldHabitats[wIdx] || { icon: '🌿', name: `Mundo ${wIdx + 1}` };
      
      // Espaçamento limpo antes de cada portal de bioma
      if (wIdx > 0) {
        currentY += 46;
      }

      const portal = document.createElement('div');
      portal.id = `world-portal-${world.id}`;
      portal.className = `atom-world-portal portal-biome-${wIdx + 1}`;
      const portalCenterY = currentY + portalHeight / 2;
      portal.style.top = `${portalCenterY}px`;
      portal.style.left = `${centerX}px`;
      portal.innerHTML = `
        <div class="portal-badge-emblem">${habitat.icon}</div>
        <div class="world-portal-info">
          <div class="world-portal-title">${world.title}</div>
          <div class="world-portal-desc">${world.description}</div>
        </div>
        <div class="world-portal-progress">
          <span class="portal-progress-num">${completedInWorld}/${worldLayouts.length}</span>
          <span class="portal-progress-stars">⭐ ${starsInWorld}</span>
        </div>
      `;
      contentFrag.appendChild(portal);

      const firstUnlockedInWorld = StorageManager.isLevelUnlocked(startLvl - 1);
      
      // Ponto de transição superior do portal
      route.push({
        x: centerX,
        y: portalCenterY - portalHeight / 2,
        isUnlocked: firstUnlockedInWorld,
        type: 'portal',
      });
      // Ponto de transição inferior do portal
      route.push({
        x: centerX,
        y: portalCenterY + portalHeight / 2,
        isUnlocked: firstUnlockedInWorld,
        type: 'portal',
      });

      currentY += portalHeight + 52;

      worldLayouts.forEach((layout, offset) => {
        const idx = startLvl - 1 + offset;
        const isUnlocked = StorageManager.isLevelUnlocked(idx);
        const isCurrent = idx === currentLevelIndex;

        const xOffset = Math.sin(offset * 0.74 + wIdx * 0.55) * xAmplitude;
        const nodeX = centerX + xOffset;
        const nodeY = currentY;

        route.push({
          x: nodeX,
          y: nodeY,
          isUnlocked,
          type: 'node',
          idx,
          isCurrent,
          layout,
        });

        currentY += nodeSpacingY;
      });

      currentY += 16;
    });

    const totalHeight = currentY + 50;
    mapContent.style.width = `${baseWidth}px`;
    mapContent.style.height = `${totalHeight}px`;
    mapSvg.style.width = `${baseWidth}px`;
    mapSvg.style.height = `${totalHeight}px`;
    mapSvg.setAttribute('viewBox', `0 0 ${baseWidth} ${totalHeight}`);
    mapSvg.setAttribute('preserveAspectRatio', 'none');

    // Vagalumes e partículas zen ambientais no mapa
    for (let f = 0; f < 18; f++) {
      const firefly = document.createElement('div');
      firefly.className = 'map-ambient-firefly';
      const fx = Math.random() * (baseWidth - 50) + 25;
      const fy = (f / 18) * totalHeight + (Math.random() * 80 - 40);
      firefly.style.left = `${fx}px`;
      firefly.style.top = `${Math.max(16, fy)}px`;
      firefly.style.animationDelay = `${(f * 0.45).toFixed(2)}s`;
      firefly.style.animationDuration = `${6 + (f % 5) * 1.8}s`;
      contentFrag.appendChild(firefly);
    }

    // Desenhar caminhos orgânicos suaves (S-Curves) via buffer de string atômica
    const svgPaths: string[] = [];
    for (let i = 0; i < route.length - 1; i++) {
      const p1 = route[i];
      const p2 = route[i + 1];

      // Nunca desenhar linha atravessando o interior do portal de bioma
      if (p1.type === 'portal' && p2.type === 'portal') {
        continue;
      }

      // Curva natural de rio com curvatura fluida
      const dy = p2.y - p1.y;
      const cp1x = p1.x + (p2.x - p1.x) * 0.15;
      const cp1y = p1.y + dy * 0.45;
      const cp2x = p2.x - (p2.x - p1.x) * 0.15;
      const cp2y = p2.y - dy * 0.45;

      const pathData = `M ${p1.x} ${p1.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;

      if (p2.isUnlocked) {
        const isLeadingToCurrent = Boolean(p2.isCurrent);

        if (isLeadingToCurrent) {
          // Veio de fronteira ativo (ouro cintilante conduzindo à fase atual)
          svgPaths.push(`<path d="${pathData}" class="map-path-frontier-glow" />`);
          svgPaths.push(`<path d="${pathData}" class="map-path-frontier" />`);
          svgPaths.push(`<path d="${pathData}" class="map-path-flow" />`);
        } else {
          // Veio concluído padrão (verde jade reluzente sólido)
          svgPaths.push(`<path d="${pathData}" class="map-path-glow" />`);
          svgPaths.push(`<path d="${pathData}" class="map-path-unlocked" />`);
        }
      } else {
        svgPaths.push(`<path d="${pathData}" class="map-path-locked" />`);
      }
    }
    mapSvg.innerHTML = svgPaths.join('');

    // Renderizar nós atômicos limpos
    route.filter((p) => p.type === 'node' && p.layout).forEach((pt) => {
      const layout = pt.layout!;
      const idx = pt.idx!;
      const stats = StorageManager.getLevelStats(layout.id);
      const isCompleted = stats.completed;
      const biomeIdx = Math.floor(idx / 5) + 1;

      const node = document.createElement('div');
      node.className = `atom-node biome-node-${biomeIdx}${pt.isCurrent ? ' current' : ''}${isCompleted ? ' completed' : ''}${!pt.isUnlocked ? ' locked' : ''}`;
      node.style.left = `${pt.x}px`;
      node.style.top = `${pt.y}px`;

      const orbitalHtml = pt.isCurrent
        ? `
          <div class="zen-halo-wrap">
            <div class="zen-pulse-ring"></div>
            <div class="zen-lotus-aura"></div>
            <div class="zen-firefly-glow"></div>
          </div>
        `
        : '';

      const starsHtml = isCompleted
        ? `<div class="atom-stars">${'⭐'.repeat(stats.stars)}</div>`
        : '';

      const currentBadgeHtml = pt.isCurrent
        ? `<div class="atom-current-badge"><span class="badge-pulse-dot"></span> Fase ${idx + 1} · ${layout.name}</div>`
        : '';

      node.innerHTML = `
        ${orbitalHtml}
        <div class="atom-core">${pt.isUnlocked ? idx + 1 : '🔒'}</div>
        ${starsHtml}
        ${currentBadgeHtml}
      `;

      node.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!pt.isUnlocked) {
          soundManager.playBlockedSound();
          hapticManager.impactLight();
          showToast('Fase bloqueada! Complete a fase anterior primeiro.');
          return;
        }

        soundManager.playTileClick();
        hapticManager.impactLight();

        if (previewCard) {
          const badge = document.getElementById('atom-preview-badge');
          const name = document.getElementById('atom-preview-name');
          const meta = document.getElementById('atom-preview-meta');
          const desc = document.getElementById('atom-preview-desc');
          const starsEl = document.getElementById('atom-preview-stars');
          const bestEl = document.getElementById('atom-preview-best');

          if (badge) badge.textContent = `${idx + 1}`;
          if (name) name.textContent = layout.name;
          if (meta) meta.textContent = `${layout.difficulty} · ${layout.slots.length} peças`;
          if (desc) desc.textContent = layout.description;

          const synContainer = document.getElementById('atom-preview-synergies');
          if (synContainer) {
            const rules = getLevelRules(idx);
            const levelSynergies = LevelDeckCurator.getLevelSynergies(rules.biome);
            if (levelSynergies.length > 0) {
              synContainer.innerHTML = `
                <div class="atom-preview-syn-header">🌿 Sinergias deste Bioma</div>
                <div class="atom-preview-syn-list">
                  ${levelSynergies
                    .slice(0, 3)
                    .map(
                      (s) => `
                    <div class="atom-preview-syn-pill" title="${s.description}">
                      <span class="syn-pill-icon">${s.icon}</span>
                      <span class="syn-pill-title">${s.title}</span>
                    </div>
                  `
                    )
                    .join('')}
                </div>
              `;
            } else {
              synContainer.innerHTML = '';
            }
          }

          if (starsEl) {
            starsEl.textContent = isCompleted
              ? '⭐'.repeat(stats.stars) + '☆'.repeat(3 - stats.stars)
              : 'Ainda não jogada';
          }

          if (bestEl) {
            let recordText = stats.bestTimeSeconds
              ? `Tempo Zen: ${Math.floor(stats.bestTimeSeconds / 60)}m ${stats.bestTimeSeconds % 60}s`
              : 'Sem recorde';
            if (stats.bestScore) {
              recordText += ` · 🌸 ${stats.bestScore.toLocaleString('pt-BR')} pts`;
            }
            bestEl.textContent = recordText;
          }

          if (btnPlay) {
            btnPlay.onclick = () => {
              soundManager.playTileClick();
              hapticManager.impactLight();
              onSelectLevel(idx);
            };
          }

          previewCard.classList.remove('hidden');
        } else {
          onSelectLevel(idx);
        }
      });

      contentFrag.appendChild(node);
    });

    // Inserção atômica única no DOM vivo (Zero reflows intermediários)
    mapContent.innerHTML = '';
    mapContent.appendChild(contentFrag);

    requestAnimationFrame(() => {
      const activeNode = mapContent.querySelector('.atom-node.current');
      activeNode?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }
}
