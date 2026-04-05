import { RevealStyle } from '@photoroulette/shared';
import { GradualUnblur } from './GradualUnblur.js';
import { SlidingReveal } from './SlidingReveal.js';
import { PixelatedToClear } from './PixelatedToClear.js';
import { Immediate } from './Immediate.js';

export interface RevealStrategy {
  start(container: HTMLElement, mediaUrl: string, mediaType: 'image' | 'video', durationSeconds: number): void;
  stop(): void;
}

export function createRevealStrategy(style: RevealStyle): RevealStrategy {
  switch (style) {
    case RevealStyle.GRADUAL_UNBLUR:
      return new GradualUnblur();
    case RevealStyle.SLIDING_REVEAL:
      return new SlidingReveal();
    case RevealStyle.PIXELATED_TO_CLEAR:
      return new PixelatedToClear();
    case RevealStyle.IMMEDIATE:
    default:
      return new Immediate();
  }
}
