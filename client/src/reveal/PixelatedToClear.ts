import type { RevealStrategy } from './index.js';

export class PixelatedToClear implements RevealStrategy {
  private animationFrame: number | null = null;
  private startTime: number | null = null;

  start(container: HTMLElement, mediaUrl: string, mediaType: 'image' | 'video', durationSeconds: number): void {
    const duration = durationSeconds * 1000;

    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d')!;

    if (mediaType === 'video') {
      const video = document.createElement('video');
      video.src = mediaUrl;
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = 'anonymous';

      video.addEventListener('loadeddata', () => {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        video.play().catch(() => {});
        this.startTime = performance.now();
        this.animateVideo(ctx, canvas, video, duration);
      });

      video.load();
    } else {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        this.startTime = performance.now();
        this.animateImage(ctx, canvas, img, duration);
      };
      img.src = mediaUrl;
    }
  }

  private animateImage(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, img: HTMLImageElement, duration: number) {
    const animate = () => {
      if (this.startTime === null) return;

      const elapsed = performance.now() - this.startTime;
      const progress = Math.min(elapsed / duration, 1);

      this.drawPixelated(ctx, canvas, img, progress);

      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(animate);
      }
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  private animateVideo(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, video: HTMLVideoElement, duration: number) {
    const animate = () => {
      if (this.startTime === null) return;

      const elapsed = performance.now() - this.startTime;
      const progress = Math.min(elapsed / duration, 1);

      this.drawPixelated(ctx, canvas, video, progress);

      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(animate);
      }
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  private drawPixelated(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    source: HTMLImageElement | HTMLVideoElement,
    progress: number,
  ) {
    const w = canvas.width;
    const h = canvas.height;

    // Ease-in: progress^2 so it starts very pixelated and clears up faster at the end
    const eased = progress * progress;

    // Scale from very small (4px wide) to full resolution
    const minScale = 4;
    const scale = minScale + (w - minScale) * eased;
    const sw = Math.max(minScale, Math.round(scale));
    const sh = Math.max(minScale, Math.round((sw / w) * h));

    // Draw at tiny size
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(source, 0, 0, sw, sh);

    // Scale back up with no smoothing for pixelated look
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(canvas, 0, 0, sw, sh, 0, 0, w, h);

    // At the very end, draw clean
    if (progress >= 0.98) {
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(source, 0, 0, w, h);
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
