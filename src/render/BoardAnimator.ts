export class BoardAnimator {
  private shuffleStartTime: number = -100000;
  private shuffleDuration: number = 500;
  private dealStartTime: number = -100000;
  private dealDuration: number = 420;

  public triggerShuffleAnimation(durationMs: number = 500): void {
    this.shuffleStartTime = performance.now();
    this.shuffleDuration = durationMs;
  }

  public triggerDealAnimation(durationMs: number = 420): void {
    this.dealStartTime = performance.now();
    this.dealDuration = durationMs;
  }

  public getShuffleStartTime(): number {
    return this.shuffleStartTime;
  }

  public getShuffleDuration(): number {
    return this.shuffleDuration;
  }

  public isShuffling(now: number): boolean {
    return now >= this.shuffleStartTime && now - this.shuffleStartTime < this.shuffleDuration;
  }

  public isDealing(now: number): boolean {
    return now >= this.dealStartTime && now - this.dealStartTime < this.dealDuration;
  }

  public getShuffleScaleX(now: number): number {
    const p = Math.max(0, Math.min(1, (now - this.shuffleStartTime) / this.shuffleDuration));
    return Math.abs(Math.cos(p * Math.PI));
  }

  public getDealParams(now: number, z: number): { dealAlpha: number; animOffset: number } {
    const elapsed = Math.max(0, now - this.dealStartTime);
    const zDelay = z * 55;
    const p = Math.max(0, Math.min(1, (elapsed - zDelay) / 220));
    return {
      dealAlpha: p,
      animOffset: (1 - this.easeOutBack(p)) * -24,
    };
  }

  public easeOutBack(x: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  }
}
