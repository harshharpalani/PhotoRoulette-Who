import { RevealStyle, MIN_REVEAL_DURATION, MAX_REVEAL_DURATION } from '@photoroulette/shared';
import type { GameConfig } from '@photoroulette/shared';

interface HostConfigPanelProps {
  config: GameConfig;
  onConfigChange: (config: Partial<GameConfig>) => void;
  canStart: boolean;
  onStart: () => void;
}

const REVEAL_STYLE_LABELS: Record<RevealStyle, string> = {
  [RevealStyle.GRADUAL_UNBLUR]: 'Gradual Unblur',
  [RevealStyle.SLIDING_REVEAL]: 'Sliding Reveal',
  [RevealStyle.PIXELATED_TO_CLEAR]: 'Pixelated to Clear',
  [RevealStyle.IMMEDIATE]: 'Immediate',
  [RevealStyle.RANDOM]: 'Random (Mix)',
};

export default function HostConfigPanel({ config, onConfigChange, canStart, onStart }: HostConfigPanelProps) {
  return (
    <div className="host-config">
      <h3>Game Settings</h3>

      <div className="config-row">
        <label>Reveal Style</label>
        <select
          value={config.revealStyle}
          onChange={(e) => onConfigChange({ revealStyle: e.target.value as RevealStyle })}
          className="input"
        >
          {Object.entries(REVEAL_STYLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div className="config-row">
        <label>Reveal Duration: {config.revealDuration}s</label>
        <input
          type="range"
          min={MIN_REVEAL_DURATION}
          max={MAX_REVEAL_DURATION}
          value={config.revealDuration}
          onChange={(e) => onConfigChange({ revealDuration: parseInt(e.target.value) })}
        />
      </div>

      <div className="config-row">
        <label>Rounds: {config.numRounds}</label>
        <input
          type="range"
          min={3}
          max={20}
          value={config.numRounds}
          onChange={(e) => onConfigChange({ numRounds: parseInt(e.target.value) })}
        />
      </div>

      <button className="btn btn-primary" onClick={onStart} disabled={!canStart}>
        {canStart ? 'Start Game' : 'Waiting for all players...'}
      </button>
    </div>
  );
}
