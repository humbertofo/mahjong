import { ALL_LAYOUTS } from '../../core/layouts';
import { StorageManager } from '../../storage/StorageManager';
import confetti from 'canvas-confetti';

export class GameEndModals {
  public static showVictoryModal(
    timeSeconds: number,
    toolsRemaining: number,
    harmonyScore: number,
    levelStats: { stars: number },
    currentLevelIndex: number
  ): void {
    const nextLevelIdx = currentLevelIndex + 1;
    const stars = levelStats.stars;
    const m = Math.floor(timeSeconds / 60).toString().padStart(2, '0');
    const s = (timeSeconds % 60).toString().padStart(2, '0');

    const layout = ALL_LAYOUTS[currentLevelIndex];
    const levelSubEl = document.getElementById('victory-level-subtitle');
    if (levelSubEl) {
      levelSubEl.textContent = `FASE ${currentLevelIndex + 1} · ${layout ? layout.name.toUpperCase() : 'CONCLUÍDA'}`;
    }

    const titleEl = document.getElementById('victory-title');
    if (titleEl) {
      titleEl.textContent = stars === 3 ? 'Vitória Iluminada!' : 'Fase Concluída!';
    }

    const starsEl = document.getElementById('victory-stars');
    if (starsEl) {
      starsEl.innerHTML = `
        <div class="zen-star-slot ${stars >= 1 ? 'earned' : 'empty'}" style="--star-delay: 0.15s">
          <span class="star-glyph">⭐</span>
        </div>
        <div class="zen-star-slot main-star ${stars >= 2 ? 'earned' : 'empty'}" style="--star-delay: 0.35s">
          <span class="star-glyph">⭐</span>
        </div>
        <div class="zen-star-slot ${stars >= 3 ? 'earned' : 'empty'}" style="--star-delay: 0.55s">
          <span class="star-glyph">⭐</span>
        </div>
      `;
    }

    const timeEl = document.getElementById('victory-time');
    if (timeEl) timeEl.textContent = `${m}:${s}`;

    const scoreEl = document.getElementById('victory-score');
    if (scoreEl) scoreEl.textContent = `+${harmonyScore.toLocaleString('pt-BR')} pts`;

    const detailEl = document.getElementById('victory-stars-detail');
    if (detailEl) {
      detailEl.innerHTML = `
        <div class="zen-star-row ${stars >= 1 ? 'earned' : ''}">
          <span class="row-star-icon">${stars >= 1 ? '⭐' : '☆'}</span>
          <span class="row-star-text">1★ Tabuleiro Limpo</span>
          <span class="row-star-status">${stars >= 1 ? 'Concluído' : 'Pendente'}</span>
        </div>
        <div class="zen-star-row ${stars >= 2 ? 'earned' : ''}">
          <span class="row-star-icon">${stars >= 2 ? '⭐' : '☆'}</span>
          <span class="row-star-text">2★ ${toolsRemaining > 0 ? `Ferramentas (${toolsRemaining})` : 'Maestria Zen'}</span>
          <span class="row-star-status">${stars >= 2 ? 'Concluído' : 'Pendente'}</span>
        </div>
        <div class="zen-star-row ${stars >= 3 ? 'earned' : ''}">
          <span class="row-star-icon">${stars >= 3 ? '⭐' : '☆'}</span>
          <span class="row-star-text">3★ Harmonia Plena</span>
          <span class="row-star-status">${stars >= 3 ? 'Concluído' : 'Pendente'}</span>
        </div>
      `;
    }

    const unlockEl = document.getElementById('victory-next-unlock');
    const unlockName = document.getElementById('victory-unlock-name');
    if (unlockEl && unlockName) {
      if (nextLevelIdx < ALL_LAYOUTS.length) {
        unlockName.textContent = `"${ALL_LAYOUTS[nextLevelIdx].name}" desbloqueada!`;
        unlockEl.classList.remove('hidden');
      } else {
        unlockName.textContent = '👑 Mestre Zen! Todas as 50 fases foram concluídas!';
        unlockEl.classList.remove('hidden');
      }
    }

    const nextBtn = document.getElementById('btn-next-level') as HTMLButtonElement | null;
    if (nextBtn) nextBtn.style.display = nextLevelIdx < ALL_LAYOUTS.length ? '' : 'none';

    const modal = document.getElementById('modal-victory');
    modal?.classList.remove('hidden');
    this.launchVictoryConfetti();
  }

  public static launchVictoryConfetti(): void {
    const end = Date.now() + 2800;
    const frame = () => {
      confetti({
        particleCount: 7,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF8FD8'],
      });
      confetti({
        particleCount: 7,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF8FD8'],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }

  public static launchWaveConfetti(): void {
    confetti({
      particleCount: 28,
      spread: 70,
      origin: { y: 0.45 },
      colors: ['#F472B6', '#FBBF24', '#34D399', '#60A5FA', '#FBCFE8'],
    });
  }

  public static showWaveCleared(
    currentWave: number,
    totalWaves: number,
    onAdvance: () => void
  ): void {
    const waveModal = document.getElementById('modal-wave-cleared');
    const titleEl = document.getElementById('wave-cleared-title');
    const subtitleEl = document.getElementById('wave-cleared-subtitle');
    const nextWaveBtn = document.getElementById('btn-next-wave');
    const nextInfoEl = document.getElementById('wave-reward-next-info');
    const stepperEl = document.getElementById('wave-cleared-stepper');

    if (titleEl) titleEl.textContent = `Onda ${currentWave} Concluída! 🌸`;
    if (subtitleEl) subtitleEl.textContent = `Prepare-se para a Onda ${currentWave + 1} de ${totalWaves}!`;
    if (nextInfoEl) nextInfoEl.textContent = `Onda ${currentWave + 1} de ${totalWaves}`;

    if (stepperEl) {
      let stepsHtml = '';
      for (let i = 1; i <= totalWaves; i++) {
        const isDone = i <= currentWave;
        const isNext = i === currentWave + 1;
        stepsHtml += `
          <div class="wave-step-node ${isDone ? 'done' : ''} ${isNext ? 'next' : ''}">
            <div class="wave-step-circle">${isDone ? '✓' : i}</div>
            <span class="wave-step-name">Onda ${i}</span>
          </div>
        `;
        if (i < totalWaves) {
          stepsHtml += `<div class="wave-step-line ${isDone ? 'done' : ''}"></div>`;
        }
      }
      stepperEl.innerHTML = stepsHtml;
    }

    const advance = () => {
      if (waveModal) waveModal.classList.add('hidden');
      onAdvance();
    };

    if (nextWaveBtn) {
      nextWaveBtn.onclick = (e) => {
        e.stopPropagation();
        advance();
      };
    }

    if (waveModal) {
      waveModal.onclick = (e) => {
        if (e.target === waveModal) {
          advance();
        }
      };
      waveModal.classList.remove('hidden');
    }

    this.launchWaveConfetti();
  }

  public static renderStats(): void {
    const container = document.getElementById('stats-content');
    if (!container) return;

    const g = StorageManager.getGlobalStats();
    const winRate = g.totalGamesPlayed > 0
      ? Math.round((g.totalGamesWon / g.totalGamesPlayed) * 100)
      : 0;
    const avgTime = g.totalGamesWon > 0
      ? Math.round(g.totalTimePlayed / g.totalGamesWon)
      : 0;
    const avgM = Math.floor(avgTime / 60).toString().padStart(2, '0');
    const avgS = (avgTime % 60).toString().padStart(2, '0');

    const totalStars = ALL_LAYOUTS.reduce((acc, l) => acc + StorageManager.getLevelStats(l.id).stars, 0);
    const totalPossibleStars = ALL_LAYOUTS.length * 3;
    const streakDays = g.currentStreak;
    const streakLabel = streakDays === 1 ? 'dia seguido' : 'dias seguidos';

    container.innerHTML = `
      <!-- Card da Sequência Zen (Chama Acolhedora) -->
      <div class="stats-streak-banner">
        <div class="stats-streak-flame-box">
          <span class="stats-streak-flame">🔥</span>
        </div>
        <div class="stats-streak-content">
          <div class="stats-streak-header">
            <span class="stats-streak-title">Sequência de Dedicação</span>
            <span class="stats-streak-badge">${streakDays} ${streakLabel}</span>
          </div>
          <div class="stats-streak-motto">"A paciência floresce no silêncio da mente"</div>
        </div>
      </div>

      <!-- Grid Visual Zen de Estatísticas -->
      <div class="stats-grid-zen">
        <div class="stat-card stat-emerald">
          <div class="stat-card-icon">🎮</div>
          <div class="stat-card-data">
            <div class="stat-value">${g.totalGamesPlayed}</div>
            <div class="stat-label">Partidas</div>
          </div>
        </div>

        <div class="stat-card stat-amber">
          <div class="stat-card-icon">🏆</div>
          <div class="stat-card-data">
            <div class="stat-value">${g.totalGamesWon}</div>
            <div class="stat-label">Vitórias Zen</div>
          </div>
        </div>

        <div class="stat-card stat-cyan">
          <div class="stat-card-icon">🎯</div>
          <div class="stat-card-data">
            <div class="stat-value">${winRate}%</div>
            <div class="stat-label">Taxa de Vitória</div>
          </div>
        </div>

        <div class="stat-card stat-blue">
          <div class="stat-card-icon">⏱️</div>
          <div class="stat-card-data">
            <div class="stat-value">${avgM}:${avgS}</div>
            <div class="stat-label">Tempo Médio</div>
          </div>
        </div>

        <div class="stat-card stat-purple">
          <div class="stat-card-icon">🐾</div>
          <div class="stat-card-data">
            <div class="stat-value">${g.totalPairsMatched.toLocaleString('pt-BR')}</div>
            <div class="stat-label">Pares Feitos</div>
          </div>
        </div>

        <div class="stat-card stat-teal">
          <div class="stat-card-icon">🌿</div>
          <div class="stat-card-data">
            <div class="stat-value">${(g.totalSynergiesTriggered || 0).toLocaleString('pt-BR')}</div>
            <div class="stat-label">Sinergias Despertadas</div>
          </div>
        </div>

        <div class="stat-card stat-gold">
          <div class="stat-card-icon">⭐</div>
          <div class="stat-card-data">
            <div class="stat-value">${totalStars}/${totalPossibleStars}</div>
            <div class="stat-label">Estrelas Totais</div>
          </div>
        </div>

        <div class="stat-card stat-rose">
          <div class="stat-card-icon">🏔️</div>
          <div class="stat-card-data">
            <div class="stat-value">Fase ${g.highestLevelUnlocked + 1}</div>
            <div class="stat-label">Cume dos Biomas</div>
          </div>
        </div>
      </div>

      <!-- Rodapé com Garantia 100% Offline e Privacidade -->
      <div class="stats-footer-note">
        <span class="stats-footer-icon">🔒</span>
        <span>Progresso salvo localmente no aparelho · 100% Offline</span>
      </div>
    `;
  }
}
