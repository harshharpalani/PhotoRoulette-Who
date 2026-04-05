import type { RevealStrategy } from './index.js';

export class GradualUnblur implements RevealStrategy {
  private animationFrame: number | null = null;
  private startTime: number | null = null;

  start(container: HTMLElement, mediaUrl: string, mediaType: 'image' | 'video', durationSeconds: number): void {
    const duration = durationSeconds * 1000;
    const maxBlur = 40;

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
    element.style.filter = `blur(${maxBlur}px)`;
    element.style.transition = 'none';

    container.appendChild(element);

    if (mediaType === 'video') {
      (element as HTMLVideoElement).play().catch(() => {});
    }

    this.startTime = performance.now();

    const animate = () => {
      if (this.startTime === null) return;

      const elapsed = performance.now() - this.startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-in curve: starts slow, accelerates — more dramatic reveal
      const eased = progress * progress;
      const blur = maxBlur * (1 - eased);

      element.style.filter = blur < 0.5 ? 'none' : `blur(${blur}px)`;

      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(animate);
      }
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  stop(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    this.startTime = null;
  }
}
