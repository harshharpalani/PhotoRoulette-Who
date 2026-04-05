import { TIMING_TIE_THRESHOLD_MS } from '@photoroulette/shared';
import type { GuessResult } from '@photoroulette/shared';

interface RawGuess {
  playerId: string;
  playerName: string;
  guessedPlayerId: string;
  reconciledTimestamp: number;
}

export function computeRoundScores(
  guesses: RawGuess[],
  correctPlayerId: string,
  totalPlayers: number,
): GuessResult[] {
  // Separate correct and incorrect guesses
  const correctGuesses = guesses
    .filter((g) => g.guessedPlayerId === correctPlayerId)
    .sort((a, b) => a.reconciledTimestamp - b.reconciledTimestamp);

  const incorrectGuesses = guesses.filter((g) => g.guessedPlayerId !== correctPlayerId);

  // Assign ranks with tie handling
  const results: GuessResult[] = [];
  let currentRank = 1;

  for (let i = 0; i < correctGuesses.length; i++) {
    const guess = correctGuesses[i];

    // Check if this guess ties with the previous one
    if (i > 0) {
      const timeDiff = Math.abs(guess.reconciledTimestamp - correctGuesses[i - 1].reconciledTimestamp);
      if (timeDiff > TIMING_TIE_THRESHOLD_MS) {
        currentRank = i + 1;
      }
      // If within threshold, keep the same rank as previous
    }

    const points = Math.max(0, totalPlayers - currentRank + 1);

    results.push({
      playerId: guess.playerId,
      playerName: guess.playerName,
      guessedPlayerId: guess.guessedPlayerId,
      isCorrect: true,
      reconciledTimestamp: guess.reconciledTimestamp,
      rank: currentRank,
      points,
    });
  }

  // Add incorrect guesses with 0 points
  for (const guess of incorrectGuesses) {
    results.push({
      playerId: guess.playerId,
      playerName: guess.playerName,
      guessedPlayerId: guess.guessedPlayerId,
      isCorrect: false,
      reconciledTimestamp: guess.reconciledTimestamp,
      rank: 0,
      points: 0,
    });
  }

  return results;
}
