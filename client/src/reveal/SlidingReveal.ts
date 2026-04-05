import type { RevealStrategy } from './index.js';

type Direction = 'left' | 'right' | 'top' | 'bottom';

export class SlidingReveal implements RevealStrategy {
  private animationFrame: number | null = null;
  private startTime: number | null = null;

  start(container: HTMLElement, mediaUrl: string, mediaType: 'image' | 'video', durationSeconds: number): void {
    const duration = durationSeconds * 1000;
    const directions: Direction[] = ['left', 'right', 'top', 'bottom'];
    const direction = directions[Math.floor(Math.random() * directions.length)];

    let element: HTMLImageElement | HTMLVideoElement;

    if (mediaType === 'video') {
      element = document.createElement('video');
      element.src = mediaUrl;
      element.muted = true;
      element.playsInline = true;
      element.autoplay = true;
      element.loop = true;
    } else {
      element = document.createElement('img');
      element.src = mediaUrl;
    }

    element.style.width = '100%';
    element.style.height = '100%';
    element.style.objectFit = 'contain';

    // Start fully hidden
    element.style.clipPath = this.getClipPath(direction, 0);
    container.appendChild(element);

    if (mediaType === 'video') {
      (element as HTMLVideoElement).play().catch(() => {});
    }

    this.startTime = performance.now();

    const animate = () => {
      if (this.startTime === null) return;

      const elapsed = performance.now() - this.startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Linear reveal
      element.style.clipPath = this.getClipPath(direction, progress);

      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(animate);
      } else {
        element.style.clipPath = 'none';
      }
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  private getClipPath(direction: Direction, progress: number): string {
    const p = (progress * 100).toFixed(1);

    switch (direction) {
      case 'left':
        return `inset(0 ${100 - parseFloat(p)}% 0 0)`;
      case 'right':
        return `inset(0 0 0 ${100 - parseFloat(p)}%)`;
      case 'top':
        return `inset(0 0 ${100 - parseFloat(p)}% 0)`;
      case 'bottom':
        return `inset(${100 - parseFloat(p)}% 0 0 0)`;
    }
  }

  stop(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    this.startTime = null;
  }
}
