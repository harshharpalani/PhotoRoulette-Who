import { useEffect, useRef, useState } from 'react';
import { RevealStyle } from '@photoroulette/shared';
import { createRevealStrategy, type RevealStrategy } from '../reveal/index.js';

interface RevealCanvasProps {
  blob: Blob | null;
  mediaType: 'image' | 'video';
  revealStyle: RevealStyle;
  duration: number;
}

export default function RevealCanvas({ blob, mediaType, revealStyle, duration }: RevealCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const strategyRef = useRef<RevealStrategy | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  // Create object URL from blob
  useEffect(() => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [blob]);

  // Run reveal animation
  useEffect(() => {
    if (!objectUrl || !containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = '';

    const actualStyle = revealStyle === RevealStyle.RANDOM
      ? [RevealStyle.GRADUAL_UNBLUR, RevealStyle.SLIDING_REVEAL, RevealStyle.PIXELATED_TO_CLEAR, RevealStyle.IMMEDIATE][Math.floor(Math.random() * 4)]
      : revealStyle;

    const strategy = createRevealStrategy(actualStyle);
    strategyRef.current = strategy;
    strategy.start(container, objectUrl, mediaType, duration);

    return () => {
      strategy.stop();
    };
  }, [objectUrl, revealStyle, duration, mediaType]);

  return (
    <div className="reveal-container" ref={containerRef}>
      {!blob && <div className="reveal-placeholder">Waiting for media...</div>}
    </div>
  );
}
