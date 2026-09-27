import { PlacedTile } from '../core/types';

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
        const radius = 18 + waveP * 35;
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
