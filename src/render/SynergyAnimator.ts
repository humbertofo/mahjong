import { PlacedTile } from '../core/types';

export type SynergyTheme =
  | 'fruit'
  | 'nut'
  | 'orchard'
  | 'zen'
  | 'bee'
  | 'chameleon'
  | 'penguin'
  | 'panda'
  | 'shield'
  | 'rabbit'
  | 'fox'
  | 'friends'
  | 'butterfly'
  | 'elephant'
  | 'duck'
  | 'lion'
  | 'bird'
  | 'snail';

export type SynergyAnimation =
  | {
      id: string;
      type: 'frog_tongue';
      startX: number;
      startY: number;
      targetX: number;
      targetY: number;
      startTime: number;
      duration: number;
      victimTile?: PlacedTile;
      onComplete?: () => void;
    }
  | {
      id: string;
      type: 'cat_paw';
      targetX: number;
      targetY: number;
      startTime: number;
      duration: number;
      onComplete?: () => void;
    }
  | {
      id: string;
      type: 'bear_claw';
      targetX: number;
      targetY: number;
      startTime: number;
      duration: number;
      onComplete?: () => void;
    }
  | {
      id: string;
      type: 'dolphin_sonar';
      startX: number;
      startY: number;
      targetX: number;
      targetY: number;
      startTime: number;
      duration: number;
      onComplete?: () => void;
    }
  | {
      id: string;
      type: 'bee_swarm';
      startX: number;
      startY: number;
      targetX: number;
      targetY: number;
      startTime: number;
      duration: number;
      onComplete?: () => void;
    }
  | {
      id: string;
      type: 'monkey_jump';
      startX: number;
      startY: number;
      targetX: number;
      targetY: number;
      startTime: number;
      duration: number;
      onComplete?: () => void;
    }
  | {
      id: string;
      type: 'penguin_slide';
      startX: number;
      startY: number;
      targetX: number;
      targetY: number;
      startTime: number;
      duration: number;
      onComplete?: () => void;
    }
  | {
      id: string;
      type: 'panda_zen';
      targetX: number;
      targetY: number;
      startTime: number;
      duration: number;
      onComplete?: () => void;
    }
  | {
      id: string;
      type: 'elephant_crush';
      targetX: number;
      targetY: number;
      startTime: number;
      duration: number;
      onComplete?: () => void;
    }
  | {
      id: string;
      type: 'micro_burst';
      targetX: number;
      targetY: number;
      startTime: number;
      duration: number;
      theme: SynergyTheme;
      onComplete?: () => void;
    };

export class SynergyAnimator {
  private activeAnimations: SynergyAnimation[] = [];

  public hasActiveAnimations(): boolean {
    return this.activeAnimations.length > 0;
  }

  public clear(): void {
    this.activeAnimations.forEach((anim) => {
      if (anim.type === 'frog_tongue' && anim.victimTile) {
        anim.victimTile.inSynergyPulled = false;
      }
    });
    this.activeAnimations = [];
  }

  /**
   * Dispara a animação teatral da língua elástica do sapo
   */
  public triggerFrogTongue(
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    victimTile?: PlacedTile,
    onComplete?: () => void
  ): void {
    this.activeAnimations.push({
      id: `frog_${Date.now()}_${Math.random()}`,
      type: 'frog_tongue',
      startX,
      startY,
      targetX,
      targetY,
      startTime: performance.now(),
      duration: 1050,
      victimTile,
      onComplete,
    });
  }

  /**
   * Dispara a animação da patada felina com anéis de água
   */
  public triggerCatPaw(
    targetX: number,
    targetY: number,
    onComplete?: () => void
  ): void {
    this.activeAnimations.push({
      id: `cat_${Date.now()}_${Math.random()}`,
      type: 'cat_paw',
      targetX,
      targetY,
      startTime: performance.now(),
      duration: 950,
      onComplete,
    });
  }

  /**
   * Dispara a animação da garra do urso com respingos de mel
   */
  public triggerBearClaw(
    targetX: number,
    targetY: number,
    onComplete?: () => void
  ): void {
    this.activeAnimations.push({
      id: `bear_${Date.now()}_${Math.random()}`,
      type: 'bear_claw',
      targetX,
      targetY,
      startTime: performance.now(),
      duration: 1000,
      onComplete,
    });
  }

  /**
   * Dispara o eco sonar com ondas circulares concêntricas do golfinho
   */
  public triggerDolphinSonar(
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    onComplete?: () => void
  ): void {
    this.activeAnimations.push({
      id: `sonar_${Date.now()}_${Math.random()}`,
      type: 'dolphin_sonar',
      startX,
      startY,
      targetX,
      targetY,
      startTime: performance.now(),
      duration: 1050,
      onComplete,
    });
  }

  /**
   * Dispara o enxame de abelhas douradas em espiral
   */
  public triggerBeeSwarm(
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    onComplete?: () => void
  ): void {
    this.activeAnimations.push({
      id: `bee_${Date.now()}_${Math.random()}`,
      type: 'bee_swarm',
      startX,
      startY,
      targetX,
      targetY,
      startTime: performance.now(),
      duration: 850,
      onComplete,
    });
  }

  /**
   * Dispara o salto do macaco na copa em arco de cipó
   */
  public triggerMonkeyJump(
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    onComplete?: () => void
  ): void {
    this.activeAnimations.push({
      id: `monkey_${Date.now()}_${Math.random()}`,
      type: 'monkey_jump',
      startX,
      startY,
      targetX,
      targetY,
      startTime: performance.now(),
      duration: 900,
      onComplete,
    });
  }

  /**
   * Dispara o deslize glacial do pinguim
   */
  public triggerPenguinSlide(
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    onComplete?: () => void
  ): void {
    this.activeAnimations.push({
      id: `penguin_${Date.now()}_${Math.random()}`,
      type: 'penguin_slide',
      startX,
      startY,
      targetX,
      targetY,
      startTime: performance.now(),
      duration: 850,
      onComplete,
    });
  }

  /**
   * Dispara a meditação zen do panda
   */
  public triggerPandaZen(
    targetX: number,
    targetY: number,
    onComplete?: () => void
  ): void {
    this.activeAnimations.push({
      id: `panda_${Date.now()}_${Math.random()}`,
      type: 'panda_zen',
      targetX,
      targetY,
      startTime: performance.now(),
      duration: 950,
      onComplete,
    });
  }

  /**
   * Dispara o impacto monumental do elefante
   */
  public triggerElephantCrush(
    targetX: number,
    targetY: number,
    onComplete?: () => void
  ): void {
    this.activeAnimations.push({
      id: `elephant_${Date.now()}_${Math.random()}`,
      type: 'elephant_crush',
      targetX,
      targetY,
      startTime: performance.now(),
      duration: 800,
      onComplete,
    });
  }

  /**
   * Dispara micro-sinergias temáticas no Canvas FX com temas ricos
   */
  public triggerMicroBurst(
    targetX: number,
    targetY: number,
    theme: SynergyTheme,
    onComplete?: () => void
  ): void {
    this.activeAnimations.push({
      id: `micro_${Date.now()}_${Math.random()}`,
      type: 'micro_burst',
      targetX,
      targetY,
      startTime: performance.now(),
      duration: 480,
      theme,
      onComplete,
    });
  }

  /**
   * Renderiza todas as animações ativas no Canvas 2D
   */
  public render(ctx: CanvasRenderingContext2D, now: number): void {
    if (this.activeAnimations.length === 0) return;

    for (let i = this.activeAnimations.length - 1; i >= 0; i--) {
      const anim = this.activeAnimations[i];
      const elapsed = now - anim.startTime;
      const progress = Math.min(1, Math.max(0, elapsed / anim.duration));

      if (progress >= 1) {
        if (anim.type === 'frog_tongue' && anim.victimTile) {
          anim.victimTile.inSynergyPulled = false;
        }
        if (anim.onComplete) {
          anim.onComplete();
        }
        this.activeAnimations.splice(i, 1);
        continue;
      }

      if (anim.type === 'frog_tongue') {
        this.renderFrogTongue(ctx, anim, progress);
      } else if (anim.type === 'cat_paw') {
        this.renderCatPaw(ctx, anim, progress);
      } else if (anim.type === 'bear_claw') {
        this.renderBearClaw(ctx, anim, progress);
      } else if (anim.type === 'dolphin_sonar') {
        this.renderDolphinSonar(ctx, anim, progress);
      } else if (anim.type === 'bee_swarm') {
        this.renderBeeSwarm(ctx, anim, progress);
      } else if (anim.type === 'monkey_jump') {
        this.renderMonkeyJump(ctx, anim, progress);
      } else if (anim.type === 'penguin_slide') {
        this.renderPenguinSlide(ctx, anim, progress);
      } else if (anim.type === 'panda_zen') {
        this.renderPandaZen(ctx, anim, progress);
      } else if (anim.type === 'elephant_crush') {
        this.renderElephantCrush(ctx, anim, progress);
      } else if (anim.type === 'micro_burst') {
        this.renderMicroBurst(ctx, anim, progress);
      }
    }
  }

  // ─── 🐸 Renderização da Língua Elástica do Sapo ────────────────────────────

  private renderFrogTongue(
    ctx: CanvasRenderingContext2D,
    anim: Extract<SynergyAnimation, { type: 'frog_tongue' }>,
    p: number
  ): void {
    const { startX, startY, targetX, targetY } = anim;

    // Ponto de controle da curva de Bézier (arco elástico ascendente)
    const midX = (startX + targetX) / 2;
    const ctrlX = midX + (targetY - startY) * 0.15;
    const ctrlY = Math.min(startY, targetY) - 55;

    // Função de ponto ao longo da curva quadrática
    const getBezierPoint = (t: number) => {
      const u = 1 - t;
      const x = u * u * startX + 2 * u * t * ctrlX + t * t * targetX;
      const y = u * u * startY + 2 * u * t * ctrlY + t * t * targetY;
      return { x, y };
    };

    let headT = 0;
    let isStuck = false;
    let isRetracting = false;

    if (p < 0.4) {
      // Fase 1: Extensão elástica rápida (0 -> 400ms)
      const t = p / 0.4;
      headT = this.easeOutBack(t);
    } else if (p < 0.55) {
      // Fase 2: Fixação adesiva na presa com tremor de impacto (400 -> 550ms)
      headT = 1.0;
      isStuck = true;
    } else {
      // Fase 3: Retração rápida puxando a presa de volta (550 -> 1050ms)
      const t = (p - 0.55) / 0.45;
      headT = 1.0 - this.easeInOutCubic(t);
      isRetracting = true;
      if (anim.victimTile) {
        anim.victimTile.inSynergyPulled = true;
      }
    }

    const clampedHeadT = Math.max(0, Math.min(1, headT));
    const headPos = getBezierPoint(clampedHeadT);

    ctx.save();

    // 1. Desenhar corpo elástico da língua (Rosa Carmim com brilho suave)
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Brilho exterior suave
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    const steps = 24;
    for (let i = 1; i <= steps; i++) {
      const stepT = (i / steps) * clampedHeadT;
      const pt = getBezierPoint(stepT);
      ctx.lineTo(pt.x, pt.y);
    }
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
    ctx.lineWidth = 14;
    ctx.stroke();

    // Linha principal da língua
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    for (let i = 1; i <= steps; i++) {
      const stepT = (i / steps) * clampedHeadT;
      const pt = getBezierPoint(stepT);
      ctx.lineTo(pt.x, pt.y);
    }
    ctx.strokeStyle = '#F43F5E';
    ctx.lineWidth = 7;
    ctx.stroke();

    // Destaque luminoso central
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    for (let i = 1; i <= steps; i++) {
      const stepT = (i / steps) * clampedHeadT;
      const pt = getBezierPoint(stepT);
      ctx.lineTo(pt.x, pt.y);
    }
    ctx.strokeStyle = '#FECDD3';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 2. Ponta redonda adesiva (bulbo mucoso com brilho especular)
    ctx.fillStyle = '#E11D48';
    ctx.beginPath();
    ctx.arc(headPos.x, headPos.y, 11, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(headPos.x - 3, headPos.y - 3, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // 3. Estrelinhas de impacto e adesão quando atinge a presa
    if (isStuck) {
      const wobble = Math.sin(p * 50) * 3;
      ctx.strokeStyle = '#FDE047';
      ctx.lineWidth = 2;
      for (let a = 0; a < 4; a++) {
        const ang = (a * Math.PI) / 2 + wobble * 0.1;
        const dist = 14 + wobble;
        ctx.beginPath();
        ctx.moveTo(headPos.x + Math.cos(ang) * 6, headPos.y + Math.sin(ang) * 6);
        ctx.lineTo(headPos.x + Math.cos(ang) * dist, headPos.y + Math.sin(ang) * dist);
        ctx.stroke();
      }
    }

    // 4. Desenha a presa presa sendo rebocada durante a retração!
    if (isRetracting && anim.victimTile) {
      ctx.save();
      ctx.translate(headPos.x, headPos.y);
      ctx.rotate((1 - clampedHeadT) * 0.4);
      // Miniatura da peça capturada voando
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.strokeStyle = '#F43F5E';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-16, -20, 32, 40, 6);
      ctx.fill();
      ctx.stroke();

      // Emoji da presa
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const icon = anim.victimTile.value === 'ladybug' ? '🐞' : (anim.victimTile.value === 'bee' ? '🐝' : '🪲');
      ctx.fillText(icon, 0, 0);
      ctx.restore();
    }

    ctx.restore();
  }

  // ─── 🐱 Renderização da Patada Felina ─────────────────────────────────────

  private renderCatPaw(
    ctx: CanvasRenderingContext2D,
    anim: Extract<SynergyAnimation, { type: 'cat_paw' }>,
    p: number
  ): void {
    const { targetX, targetY } = anim;

    ctx.save();
    // 1. Ondas d'água circulares concêntricas no alvo
    if (p > 0.25) {
      const waveP = (p - 0.25) / 0.75;
      for (let w = 0; w < 3; w++) {
        const r = (waveP * 45) + w * 12;
        const alpha = Math.max(0, (1 - waveP) * 0.6);
        ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(targetX, targetY + 10, r, r * 0.5, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // 2. Patinha descendo e recolhendo
    const pawYOffset = p < 0.4
      ? -70 + this.easeOutBack(p / 0.4) * 70
      : (p < 0.65 ? 0 : -(p - 0.65) * 140);

    const pawAlpha = p < 0.85 ? 1 : Math.max(0, 1 - (p - 0.85) / 0.15);

    ctx.globalAlpha = pawAlpha;
    ctx.translate(targetX, targetY + pawYOffset);

    // Almofada principal da pata
    ctx.fillStyle = '#FFE4E6';
    ctx.strokeStyle = '#FDA4AF';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, -5, 20, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 4 Dedinhos fofos com almofadinhas rosas
    const toeAngles = [-0.6, -0.2, 0.2, 0.6];
    toeAngles.forEach((ang) => {
      const tx = Math.sin(ang) * 22;
      const ty = -18 - Math.cos(ang) * 4;
      ctx.fillStyle = '#FB7185';
      ctx.beginPath();
      ctx.ellipse(tx, ty, 6, 7, ang * 0.4, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  // ─── 🐻 Renderização da Garra do Urso ─────────────────────────────────────

  private renderBearClaw(
    ctx: CanvasRenderingContext2D,
    anim: Extract<SynergyAnimation, { type: 'bear_claw' }>,
    p: number
  ): void {
    const { targetX, targetY } = anim;

    ctx.save();
    ctx.translate(targetX, targetY);

    // 3 marcas de garras rasgando diagonalmente
    const slashP = Math.min(1, p / 0.4);
    const alpha = p > 0.5 ? Math.max(0, 1 - (p - 0.5) / 0.5) : 1;

    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#F59E0B'; // Mel dourado
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';

    const offsets = [-20, 0, 20];
    offsets.forEach((off) => {
      const len = slashP * 50;
      ctx.beginPath();
      ctx.moveTo(off - len * 0.5, -25 + (len * 0.2));
      ctx.lineTo(off + len * 0.5, 25);
      ctx.stroke();
    });

    // Gotas de mel dourado caindo
    if (p > 0.3) {
      const dropP = (p - 0.3) / 0.7;
      ctx.fillStyle = '#FBBF24';
      for (let i = 0; i < 4; i++) {
        const dx = (i - 1.5) * 16;
        const dy = 15 + dropP * 25 + i * 4;
        ctx.beginPath();
        ctx.ellipse(dx, dy, 3.5, 5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  // ─── 🐬 Renderização do Eco Sonar do Golfinho ─────────────────────────────

  private renderDolphinSonar(
    ctx: CanvasRenderingContext2D,
    anim: Extract<SynergyAnimation, { type: 'dolphin_sonar' }>,
    p: number
  ): void {
    const { startX, startY, targetX, targetY } = anim;

    ctx.save();
    const dx = targetX - startX;
    const dy = targetY - startY;
    const totalDist = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);

    // 3 ondas cônicas viajando pelo mar
    for (let w = 0; w < 3; w++) {
      const waveP = (p * 1.3 - w * 0.2);
      if (waveP > 0 && waveP < 1) {
        const currDist = waveP * totalDist;
        const wx = startX + Math.cos(angle) * currDist;
        const wy = startY + Math.sin(angle) * currDist;
        const radius = Math.max(0.1, 18 + waveP * 35);
        const alpha = Math.sin(waveP * Math.PI) * 0.75;

        ctx.strokeStyle = `rgba(45, 212, 191, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(wx, wy, radius, angle - 0.7, angle + 0.7);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  // ─── 🐝 Renderização do Enxame de Abelhas Douradas ─────────────────────────

  private renderBeeSwarm(
    ctx: CanvasRenderingContext2D,
    anim: Extract<SynergyAnimation, { type: 'bee_swarm' }>,
    p: number
  ): void {
    const { startX, startY, targetX, targetY } = anim;
    ctx.save();

    const currentX = startX + (targetX - startX) * p;
    const currentY = startY + (targetY - startY) * p;

    // Nuvem de 6 abelhinhas em espiral dourada
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3 + p * 12;
      const spiralRadius = 15 + Math.sin(p * Math.PI) * 20;
      const bx = currentX + Math.cos(angle) * spiralRadius;
      const by = currentY + Math.sin(angle) * spiralRadius;

      ctx.fillStyle = '#EAB308';
      ctx.beginPath();
      ctx.arc(bx, by, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Mini asas brancas
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.beginPath();
      ctx.ellipse(bx - 2, by - 3, 2, 3.5, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // ─── 🐒 Renderização do Salto na Copa do Macaco ────────────────────────────

  private renderMonkeyJump(
    ctx: CanvasRenderingContext2D,
    anim: Extract<SynergyAnimation, { type: 'monkey_jump' }>,
    p: number
  ): void {
    const { startX, startY, targetX, targetY } = anim;
    ctx.save();

    const midX = (startX + targetX) / 2;
    const peakY = Math.min(startY, targetY) - 90;

    // Arco quadrático de salto
    const u = 1 - p;
    const x = u * u * startX + 2 * u * p * midX + p * p * targetX;
    const y = u * u * startY + 2 * u * p * peakY + p * p * targetY;

    // Rastro de folhas do cipó
    ctx.strokeStyle = '#15803D';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(midX, peakY, x, y);
    ctx.stroke();

    // Emoji de macaco no topo do salto
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🐒', x, y);

    ctx.restore();
  }

  // ─── 🐧 Renderização do Deslize Glacial do Pinguim ─────────────────────────

  private renderPenguinSlide(
    ctx: CanvasRenderingContext2D,
    anim: Extract<SynergyAnimation, { type: 'penguin_slide' }>,
    p: number
  ): void {
    const { startX, startY, targetX, targetY } = anim;
    ctx.save();

    const currX = startX + (targetX - startX) * p;
    const currY = startY + (targetY - startY) * p;

    // Trilha de gelo ciano cintilante
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(currX, currY);
    ctx.stroke();

    // Cristais de gelo e pinguim
    ctx.font = '26px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🐧', currX, currY);

    ctx.restore();
  }

  // ─── 🐼 Renderização da Meditação Zen do Panda ─────────────────────────────

  private renderPandaZen(
    ctx: CanvasRenderingContext2D,
    anim: Extract<SynergyAnimation, { type: 'panda_zen' }>,
    p: number
  ): void {
    const { targetX, targetY } = anim;
    ctx.save();

    const alpha = Math.max(0, 1 - p);
    const radius = 25 + p * 60;

    // Anéis concêntricos de calmaria zen
    ctx.strokeStyle = `rgba(34, 197, 94, ${alpha * 0.8})`;
    ctx.lineWidth = 4 * (1 - p);
    ctx.beginPath();
    ctx.arc(targetX, targetY, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Símbolo do Panda central
    ctx.globalAlpha = alpha;
    ctx.font = '32px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🐼', targetX, targetY);

    ctx.restore();
  }

  // ─── 🐘 Renderização do Impacto Monumental do Elefante ─────────────────────

  private renderElephantCrush(
    ctx: CanvasRenderingContext2D,
    anim: Extract<SynergyAnimation, { type: 'elephant_crush' }>,
    p: number
  ): void {
    const { targetX, targetY } = anim;
    ctx.save();

    const alpha = Math.max(0, 1 - p);
    const waveRadius = 15 + p * 80;

    // Onda de choque circular de impacto
    ctx.strokeStyle = `rgba(139, 92, 246, ${alpha})`;
    ctx.lineWidth = 6 * (1 - p);
    ctx.beginPath();
    ctx.arc(targetX, targetY, waveRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Pedregulhos voando para fora
    ctx.fillStyle = '#64748B';
    for (let i = 0; i < 6; i++) {
      const ang = (i * Math.PI) / 3;
      const d = waveRadius * 0.85;
      const px = targetX + Math.cos(ang) * d;
      const py = targetY + Math.sin(ang) * d;
      ctx.beginPath();
      ctx.arc(px, py, 4 * (1 - p), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // ─── 🍌🌰🍎 Renderização de Micro-Sinergias & Temas Especiais ──────────────

  private renderMicroBurst(
    ctx: CanvasRenderingContext2D,
    anim: Extract<SynergyAnimation, { type: 'micro_burst' }>,
    p: number
  ): void {
    const { targetX, targetY, theme } = anim;
    ctx.save();

    const clampedP = Math.max(0, Math.min(1, p));
    const alpha = Math.max(0, 1 - clampedP);
    const radius = Math.max(0.1, 20 + clampedP * 35);

    let baseColor = '#FACC15';
    let accentChar = '✨';

    switch (theme) {
      case 'fruit': baseColor = '#FACC15'; accentChar = '🍌'; break;
      case 'nut': baseColor = '#B45309'; accentChar = '🌰'; break;
      case 'orchard': baseColor = '#F43F5E'; accentChar = '🍎'; break;
      case 'zen': baseColor = '#10B981'; accentChar = '🍃'; break;
      case 'bee': baseColor = '#EAB308'; accentChar = '🍯'; break;
      case 'chameleon': baseColor = '#00E676'; accentChar = '🦎'; break;
      case 'penguin': baseColor = '#38BDF8'; accentChar = '❄️'; break;
      case 'panda': baseColor = '#22C55E'; accentChar = '🎋'; break;
      case 'shield': baseColor = '#0284C7'; accentChar = '🛡️'; break;
      case 'rabbit': baseColor = '#EC4899'; accentChar = '🌸'; break;
      case 'fox': baseColor = '#EA580C'; accentChar = '🔥'; break;
      case 'friends': baseColor = '#F59E0B'; accentChar = '💖'; break;
      case 'butterfly': baseColor = '#A855F7'; accentChar = '🦋'; break;
      case 'elephant': baseColor = '#8B5CF6'; accentChar = '🪨'; break;
      case 'duck': baseColor = '#00ACC1'; accentChar = '💧'; break;
      case 'lion': baseColor = '#F59E0B'; accentChar = '☀️'; break;
      case 'bird': baseColor = '#60A5FA'; accentChar = '🪶'; break;
      case 'snail': baseColor = '#84CC16'; accentChar = '🐌'; break;
    }

    // 1. Halo expansivo de energia
    ctx.beginPath();
    ctx.arc(targetX, targetY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = baseColor;
    ctx.globalAlpha = alpha * 0.7;
    ctx.lineWidth = Math.max(0.1, 3.5 * (1 - clampedP));
    ctx.stroke();

    // 2. 4 Fagulinhas giratórias em órbita
    ctx.globalAlpha = alpha;
    ctx.fillStyle = baseColor;
    for (let i = 0; i < 4; i++) {
      const ang = (i * Math.PI) / 2 + clampedP * 4;
      const dist = radius * 0.75;
      const px = targetX + Math.cos(ang) * dist;
      const py = targetY + Math.sin(ang) * dist;
      const sparkRadius = Math.max(0.1, 3.5 * (1 - clampedP));
      ctx.beginPath();
      ctx.arc(px, py, sparkRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Mini emoji sutil no centro
    ctx.globalAlpha = alpha * 0.9;
    ctx.font = '22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(accentChar, targetX, targetY - p * 15);

    ctx.restore();
  }

  // ─── Easing Helpers ────────────────────────────────────────────────────────

  private easeOutBack(x: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  }

  private easeInOutCubic(x: number): number {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  }
}
