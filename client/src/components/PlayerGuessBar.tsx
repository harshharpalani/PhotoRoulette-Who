import type { Player } from '@photoroulette/shared';

interface PlayerGuessBarProps {
  players: Player[];
  currentPlayerId: string | null;
  myGuess: string | null;
  onGuess: (playerId: string) => void;
  disabled: boolean;
}

export default function PlayerGuessBar({ players, currentPlayerId, myGuess, onGuess, disabled }: PlayerGuessBarProps) {
  const otherPlayers = players.filter((p) => p.id !== currentPlayerId);

  return (
    <div className="guess-bar">
      <p className="guess-label">{myGuess ? 'Guess locked!' : 'Whose is it?'}</p>
      <div className="guess-buttons">
        {otherPlayers.map((p) => (
          <button
            key={p.id}
            className={`guess-btn ${myGuess === p.id ? 'guess-selected' : ''} ${myGuess && myGuess !== p.id ? 'guess-dimmed' : ''}`}
            onClick={() => onGuess(p.id)}
            disabled={disabled || !!myGuess}
          >
            {p.displayName}
          </button>
        ))}
      </div>
    </div>
  );
}
