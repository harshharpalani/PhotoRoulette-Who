import { useParams, useNavigate } from 'react-router-dom';
import { getSocket } from '../socket.js';
import { useGameState } from '../state/GameContext.js';

export default function ResultsPage() {
  const { code } = useParams<{ code: string }>();
  const { state, dispatch } = useGameState();
  const navigate = useNavigate();

  const handlePlayAgain = () => {
    dispatch({ type: 'RESET_GAME' });
    navigate(`/lobby/${code}`);
  };

  const handleLeave = () => {
    getSocket().emit('room:leave');
    navigate('/');
  };

  if (!state.finalResult) {
    return (
      <div className="page results-page">
        <p>Loading results...</p>
      </div>
    );
  }

  const { finalScores, winnerName } = state.finalResult;

  return (
    <div className="page results-page">
      <h1>Game Over!</h1>

      <div className="winner-display">
        <p className="winner-label">Winner</p>
        <p className="winner-name">{winnerName}</p>
        <p className="winner-score">{finalScores[0]?.score} pts</p>
      </div>

      <div className="final-scores">
        {finalScores.map((entry, i) => (
          <div
            key={entry.playerId}
            className={`final-score-item ${entry.playerId === state.playerId ? 'score-self' : ''} ${i === 0 ? 'first-place' : ''}`}
          >
            <span className="score-rank">#{i + 1}</span>
            <span className="score-name">{entry.playerName}</span>
            <span className="score-value">{entry.score} pts</span>
          </div>
        ))}
      </div>

      <div className="results-actions">
        {state.isHost && (
          <button className="btn btn-primary" onClick={handlePlayAgain}>
            Play Again
          </button>
        )}
        <button className="btn btn-secondary" onClick={handleLeave}>
          Leave
        </button>
      </div>
    </div>
  );
}
