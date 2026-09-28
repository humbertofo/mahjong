import { PlacedTile } from '../core/types';
import { TileRenderer } from '../render/TileRenderer';

export class TrayAnimator {
  private flyerPool: { el: HTMLElement; canvas: HTMLCanvasElement; inUse: boolean }[] = [];

  public renderTileToCanvas(
    canvas: HTMLCanvasElement,
    tile: PlacedTile,
    tileRenderer: TileRenderer
  ): void {
    tileRenderer.renderTrayCard(canvas, tile, 62, 82);
  }

  private getFlyerFromPool(): { el: HTMLElement; canvas: HTMLCanvasElement; inUse: boolean } {
    let item = this.flyerPool.find((f) => !f.inUse);
    if (!item) {
      const el = document.createElement('div');
      el.className = 'flying-tile-card';
      el.style.cssText = `
        position: fixed;
        z-index: 1000;
        pointer-events: none;
        display: none;
        box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        border-radius: 8px;
        overflow: hidden;
      `;
      const canvas = document.createElement('canvas');
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      el.appendChild(canvas);
      document.body.appendChild(el);
      item = { el, canvas, inUse: false };
      this.flyerPool.push(item);
    }
    item.inUse = true;
    return item;
  }

  public animateTileToTray(
    tile: PlacedTile,
    startX: number,
    startY: number,
    width: number,
    height: number,
    targetSlot: HTMLElement,
    tileRenderer: TileRenderer,
    onArrival: () => void
  ): void {
    const targetRect = targetSlot.getBoundingClientRect();
    const flyerItem = this.getFlyerFromPool();
    const flyer = flyerItem.el;
    const canvas = flyerItem.canvas;

    this.renderTileToCanvas(canvas, tile, tileRenderer);

    const scaleX = targetRect.width / width;
    const scaleY = targetRect.height / height;

    flyer.style.transition = 'none';
    flyer.style.left = '0px';
    flyer.style.top = '0px';
    flyer.style.width = `${width}px`;
    flyer.style.height = `${height}px`;
    flyer.style.transformOrigin = 'top left';
    flyer.style.transform = `translate3d(${startX}px, ${startY}px, 0) scale(1.05)`;
    flyer.style.willChange = 'transform';
    flyer.style.display = 'block';

    requestAnimationFrame(() => {
      flyer.style.transition = 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)';
      flyer.style.transform = `translate3d(${targetRect.left}px, ${targetRect.top}px, 0) scale(${scaleX}, ${scaleY})`;
    });

    setTimeout(() => {
      flyer.style.display = 'none';
      flyer.style.willChange = 'auto';
      flyerItem.inUse = false;
      onArrival();
    }, 230);
  }

  public animateTileFromTrayToBoard(
    tile: PlacedTile,
    fromSlotEl: HTMLElement,
    targetLeft: number,
    targetTop: number,
    targetWidth: number,
    targetHeight: number,
    tileRenderer: TileRenderer,
    onArrival: () => void
  ): void {
    const slotRect = fromSlotEl.getBoundingClientRect();
    const flyerItem = this.getFlyerFromPool();
    const flyer = flyerItem.el;
    const canvas = flyerItem.canvas;

    this.renderTileToCanvas(canvas, tile, tileRenderer);

    const startScaleX = slotRect.width / targetWidth;
    const startScaleY = slotRect.height / targetHeight;

    flyer.style.transition = 'none';
    flyer.style.left = '0px';
    flyer.style.top = '0px';
    flyer.style.width = `${targetWidth}px`;
    flyer.style.height = `${targetHeight}px`;
    flyer.style.transformOrigin = 'top left';
    flyer.style.transform = `translate3d(${slotRect.left}px, ${slotRect.top}px, 0) scale(${startScaleX}, ${startScaleY})`;
    flyer.style.willChange = 'transform';
    flyer.style.display = 'block';

    requestAnimationFrame(() => {
      flyer.style.transition = 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)';
      flyer.style.transform = `translate3d(${targetLeft}px, ${targetTop}px, 0) scale(1.04)`;
    });

    setTimeout(() => {
      flyer.style.display = 'none';
      flyer.style.willChange = 'auto';
      flyerItem.inUse = false;
      onArrival();
    }, 230);
  }

  public spawnLotusManaSparks(badges: HTMLElement[], fromX?: number, fromY?: number): void {
    const validBadges = badges.filter(Boolean);
    const startX = fromX ?? window.innerWidth / 2;
    const startY = fromY ?? window.innerHeight / 2;

    validBadges.forEach((badge, bIdx) => {
      const bRect = badge.getBoundingClientRect();
      const destX = bRect.left + bRect.width / 2;
      const destY = bRect.top + bRect.height / 2;
      const spark = document.createElement('div');
      spark.className = 'golden-mana-spark';
      spark.textContent = '✨';
      spark.style.cssText = `
        position: fixed;
        left: 0;
        top: 0;
        font-size: 1.5rem;
        z-index: 1000;
        pointer-events: none;
        transform: translate3d(${startX}px, ${startY}px, 0) scale(0.6);
        opacity: 0.95;
        will-change: transform, opacity;
        transition: transform 0.55s cubic-bezier(0.16, 1, 0.3, 1) ${bIdx * 0.08}s, opacity 0.55s ease ${bIdx * 0.08}s;
      `;
      document.body.appendChild(spark);

      requestAnimationFrame(() => {
        spark.style.transform = `translate3d(${destX}px, ${destY}px, 0) scale(1.5)`;
        spark.style.opacity = '1';
      });

      setTimeout(() => {
        spark.remove();
        badge.classList.add('sparkle-pulse');
        setTimeout(() => badge.classList.remove('sparkle-pulse'), 800);
      }, 650);
    });
  }
}
