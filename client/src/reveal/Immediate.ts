import type { RevealStrategy } from './index.js';

export class Immediate implements RevealStrategy {
  start(container: HTMLElement, mediaUrl: string, mediaType: 'image' | 'video', _durationSeconds: number): void {
    let element: HTMLImageElement | HTMLVideoElement;

    if (mediaType === 'video') {
      element = document.createElement('video');
      element.src = mediaUrl;
      element.muted = true;
      element.playsInline = true;
      element.autoplay = true;
      element.loop = true;
      element.controls = true;
    } else {
      element = document.createElement('img');
      element.src = mediaUrl;
    }

    element.style.width = '100%';
    element.style.height = '100%';
    element.style.objectFit = 'contain';
    element.classList.add('reveal-fade-in');

    container.appendChild(element);

    if (mediaType === 'video') {
      (element as HTMLVideoElement).play().catch(() => {});
    }
  }

  stop(): void {
    // Nothing to clean up
  }
}
