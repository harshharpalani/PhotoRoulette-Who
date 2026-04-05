import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSocket } from '../socket.js';
import { useGameState } from '../state/GameContext.js';
import { useSocketEvent } from '../hooks/useSocket.js';
import { useTimingSync } from '../hooks/useTimingSync.js';
import RevealCanvas from '../components/RevealCanvas.js';
import PlayerGuessBar from '../components/PlayerGuessBar.js';
import RoundTimer from '../components/RoundTimer.js';
import ScoreBoard from '../components/ScoreBoard.js';
import VoteEndModal from '../components/VoteEndModal.js';

export default function GamePage() {
  const { code } = useParams<{ code: string }>();
  const { state, dispatch } = useGameState();
  const navigate = useNavigate();
  const { getHighResTimestamp } = useTimingSync();
  const [hasVotedEnd, setHasVotedEnd] = useState(false);
  const getFileBufferRef = useRef<((index: number) => Promise<ArrayBuffer>) | null>(null);

  // Listen for game countdown
  useSocketEvent('game:countdown', ({ count }) => {
    dispatch({ type: 'COUNTDOWN', count });
  });

  // Listen for round start
  useSocketEvent('round:start', ({ roundNumber, revealStyle, revealDuration, mediaType }) => {
    dispatch({ type: 'START_ROUND', roundNumber, revealStyle, revealDuration, mediaType });
  });

  // Listen for media broadcast
  useSocketEvent('media:broadcast', ((data: { mediaType: 'image' | 'video'; roundNumber: number }, buffer: ArrayBuffer) => {
    const blob = new Blob([buffer], {
      type: data.mediaType === 'video' ? 'video/mp4' : 'image/jpeg',
    });
    dispatch({ type: 'SET_MEDIA_BLOB', blob });
  }) as any);

  // Handle media request (in case player is asked to upload during game)
  useSocketEvent('media:request', (async ({ roundIndex }: { roundIndex: number }) => {
    if (getFileBufferRef.current) {
      const buffer = await getFileBufferRef.current(roundIndex);
      getSocket().emit('media:upload', { roundIndex }, buffer);
    }
  }) as any);

  // Listen for tick
  useSocketEvent('round:tick', ({ timeRemaining }) => {
    dispatch({ type: 'TICK', timeRemaining });
  });

  // Listen for round end
  useSocketEvent('round:end', ({ ownerPlayerId, ownerName, guessResults, roundScores }) => {
    dispatch({ type: 'ROUND_END', ownerPlayerId, ownerName, guessResults, roundScores });
  });

  // Listen for score updates
  useSocketEvent('game:scores-update', ({ scores }) => {
    dispatch({ type: 'UPDATE_SCORES', scores });
  });

  // Listen for game end
  useSocketEvent('game:ended', ({ finalScores, winnerId, winnerName }) => {
    dispatch({ type: 'GAME_ENDED', finalScores, winnerId, winnerName });
    navigate(`/results/${code}`);
  });

  // Listen for vote status
  useSocketEvent('vote:end-status', ({ votesNeeded, votesCast }) => {
    dispatch({ type: 'VOTE_STATUS', votesNeeded, votesCast });
  });

  const handleGuess = (playerId: string) => {
    if (state.currentRound?.myGuess) return;
    const clientTimestamp = getHighResTimestamp();
    dispatch({ type: 'SET_MY_GUESS', playerId });
    getSocket().emit('guess:submit', { guessedPlayerId: playerId, clientTimestamp });
  };

  const handleVoteEnd = () => {
    setHasVotedEnd(true);
    getSocket().emit('vote:end-early');
  };

  // Starting countdown
  if (state.phase === 'starting') {
    return (
      <div className="page game-page">
        <div className="countdown-display">
          <span className="countdown-number">{state.countdown || '...'}</span>
          <p>Get ready!</p>
        </div>
      </div>
    );
  }

  // Round result
  if (state.phase === 'roundResult' && state.currentRound) {
    const round = state.currentRound;
    return (
      <div className="page game-page">
        <h2>Round {round.roundNumber} Results</h2>
        <p className="round-owner">
          It was <strong>{round.ownerName}</strong>&apos;s photo!
        </p>
        <div className="round-results">
          {round.guessResults
            .filter((g) => g.isCorrect)
            .sort((a, b) => a.rank - b.rank)
            .map((g) => (
              <div key={g.playerId} className="result-item correct">
                <span className="result-rank">#{g.rank}</span>
                <span className="result-name">{g.playerName}</span>
                <span className="result-points">+{g.points}</span>
              </div>
            ))}
          {round.guessResults
            .filter((g) => !g.isCorrect)
            .map((g) => (
              <div key={g.playerId} className="result-item incorrect">
                <span className="result-rank">--</span>
                <span className="result-name">{g.playerName}</span>
                <span className="result-points">+0</span>
              </div>
            ))}
        </div>
        <ScoreBoard scores={state.scores} currentPlayerId={state.playerId} />
      </div>
    );
  }

  // Active round
  return (
    <div className="page game-page">
      {state.currentRound && (
        <>
          <div className="game-header">
            <span>Round {state.currentRound.roundNumber}</span>
            <VoteEndModal voteStatus={state.voteStatus} onVote={handleVoteEnd} hasVoted={hasVotedEnd} />
          </div>

          <RoundTimer
            timeRemaining={state.currentRound.timeRemaining}
            totalTime={state.currentRound.revealDuration}
          />

          <RevealCanvas
            blob={state.currentRound.mediaBlob}
            mediaType={state.currentRound.mediaType}
            revealStyle={state.currentRound.revealStyle}
            duration={state.currentRound.revealDuration}
          />

          <PlayerGuessBar
            players={state.players}
            currentPlayerId={state.playerId}
            myGuess={state.currentRound.myGuess}
            onGuess={handleGuess}
            disabled={!state.currentRound.mediaBlob}
          />
        </>
      )}
    </div>
  );
}
