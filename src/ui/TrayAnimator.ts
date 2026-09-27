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

    flyer.style.transition = 'none';
    flyer.style.left = `${startX}px`;
    flyer.style.top  = `${startY}px`;
    flyer.style.width = `${width}px`;
    flyer.style.height = `${height}px`;
    flyer.style.transform = 'scale(1.05)';
    flyer.style.display = 'block';

    void flyer.offsetWidth;

    requestAnimationFrame(() => {
      flyer.style.transition = 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)';
      flyer.style.left = `${targetRect.left}px`;
      flyer.style.top  = `${targetRect.top}px`;
      flyer.style.width = `${targetRect.width}px`;
      flyer.style.height = `${targetRect.height}px`;
      flyer.style.transform = 'scale(1)';
    });

    setTimeout(() => {
      flyer.style.display = 'none';
      flyerItem.inUse = false;
      onArrival();
    }, 220);
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

    flyer.style.transition = 'none';
    flyer.style.left = `${slotRect.left}px`;
    flyer.style.top  = `${slotRect.top}px`;
    flyer.style.width = `${slotRect.width}px`;
    flyer.style.height = `${slotRect.height}px`;
    flyer.style.transform = 'scale(1)';
    flyer.style.display = 'block';

    void flyer.offsetWidth;

    requestAnimationFrame(() => {
      flyer.style.transition = 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)';
      flyer.style.left = `${targetLeft}px`;
      flyer.style.top  = `${targetTop}px`;
      flyer.style.width = `${targetWidth}px`;
      flyer.style.height = `${targetHeight}px`;
      flyer.style.transform = 'scale(1.04)';
    });

    setTimeout(() => {
      flyer.style.display = 'none';
      flyerItem.inUse = false;
      onArrival();
    }, 220);
  }

  public spawnLotusManaSparks(badges: HTMLElement[], fromX?: number, fromY?: number): void {
    const validBadges = badges.filter(Boolean);
    const startX = fromX ?? window.innerWidth / 2;
    const startY = fromY ?? window.innerHeight / 2;

    validBadges.forEach((badge, bIdx) => {
      const bRect = badge.getBoundingClientRect();
      const spark = document.createElement('div');
      spark.className = 'golden-mana-spark';
      spark.textContent = '✨';
      spark.style.cssText = `
        position: fixed;
        left: ${startX}px;
        top: ${startY}px;
        font-size: 1.5rem;
        z-index: 1000;
        pointer-events: none;
        transition: all 0.55s cubic-bezier(0.16, 1, 0.3, 1) ${bIdx * 0.08}s;
      `;
      document.body.appendChild(spark);

      requestAnimationFrame(() => {
        spark.style.left = `${bRect.left + bRect.width / 2}px`;
        spark.style.top = `${bRect.top + bRect.height / 2}px`;
        spark.style.transform = 'scale(1.5)';
        spark.style.opacity = '0.95';
      });

      setTimeout(() => {
        spark.remove();
        badge.classList.add('sparkle-pulse');
        setTimeout(() => badge.classList.remove('sparkle-pulse'), 800);
      }, 650);
    });
  }
}
