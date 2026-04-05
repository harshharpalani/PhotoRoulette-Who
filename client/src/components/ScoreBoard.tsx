import type { ScoreEntry } from '@photoroulette/shared';

interface ScoreBoardProps {
  scores: ScoreEntry[];
  currentPlayerId: string | null;
}

export default function ScoreBoard({ scores, currentPlayerId }: ScoreBoardProps) {
  if (scores.length === 0) return null;

  return (
    <div className="scoreboard">
      <h3>Leaderboard</h3>
      <div className="score-list">
        {scores.map((entry, i) => (
          <div
            key={entry.playerId}
            className={`score-item ${entry.playerId === currentPlayerId ? 'score-self' : ''}`}
          >
            <span className="score-rank">#{i + 1}</span>
            <span className="score-name">{entry.playerName}</span>
            <span className="score-value">{entry.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
