import type { TypedServer } from '../socket/index.js';
import type { MediaManifestItem, GuessResult } from '@photoroulette/shared';
import { COUNTDOWN_SECONDS, ROUND_RESULT_DISPLAY_SECONDS } from '@photoroulette/shared';
import { computeRoundScores } from './ScoreEngine.js';
import { logger } from '../utils/logger.js';

interface RawGuess {
  playerId: string;
  playerName: string;
  guessedPlayerId: string;
  reconciledTimestamp: number;
}

export interface RoundData {
  ownerSocketId: string;
  ownerName: string;
  mediaIndex: number;
  mediaType: 'image' | 'video';
  guesses: RawGuess[];
  isActive: boolean;
}

export class RoundEngine {
  private roundTimer: ReturnType<typeof setTimeout> | null = null;
  private tickInterval: ReturnType<typeof setInterval> | null = null;
  private countdownTimer: ReturnType<typeof setTimeout> | null = null;

  createRoundPlan(
    playerSocketIds: string[],
    mediaManifests: Map<string, MediaManifestItem[]>,
    numRounds: number,
  ): RoundData[] {
    const rounds: RoundData[] = [];
    // Build a pool of all available media items across all players
    const pool: { socketId: string; manifest: MediaManifestItem }[] = [];
    for (const [socketId, manifest] of mediaManifests) {
      for (const item of manifest) {
        pool.push({ socketId, manifest: item });
      }
    }

    // Shuffle and pick numRounds items, trying to distribute evenly
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, numRounds);

    for (const item of selected) {
      rounds.push({
        ownerSocketId: item.socketId,
        ownerName: '', // will be filled in by RoomManager
        mediaIndex: item.manifest.index,
        mediaType: item.manifest.type,
        guesses: [],
        isActive: false,
      });
    }

    return rounds;
  }

  startCountdown(roomCode: string, io: TypedServer, onComplete: () => void) {
    let count = COUNTDOWN_SECONDS;

    io.to(roomCode).emit('game:countdown', { count });

    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        io.to(roomCode).emit('game:countdown', { count });
      } else {
        clearInterval(interval);
        onComplete();
      }
    }, 1000);

    this.countdownTimer = interval as unknown as ReturnType<typeof setTimeout>;
  }

  startRound(
    roomCode: string,
    round: RoundData,
    roundNumber: number,
    revealDuration: number,
    revealStyle: string,
    totalPlayers: number,
    io: TypedServer,
    onRoundEnd: (results: GuessResult[]) => void,
  ) {
    round.isActive = true;

    io.to(roomCode).emit('round:start', {
      roundNumber,
      revealStyle: revealStyle as any,
      revealDuration,
      mediaType: round.mediaType,
    });

    // Request media from the owner
    const ownerSocket = io.sockets.sockets.get(round.ownerSocketId);
    if (ownerSocket) {
      ownerSocket.emit('media:request', { roundIndex: round.mediaIndex });
    }

    // Start countdown ticker
    let timeRemaining = revealDuration;
    this.tickInterval = setInterval(() => {
      timeRemaining--;
      if (timeRemaining >= 0) {
        io.to(roomCode).emit('round:tick', { timeRemaining });
      }
    }, 1000);

    // Round timer
    this.roundTimer = setTimeout(() => {
      this.endRound(round, totalPlayers, onRoundEnd);
    }, revealDuration * 1000);
  }

  addGuess(round: RoundData, playerId: string, playerName: string, guessedPlayerId: string, reconciledTimestamp: number): boolean {
    // Reject duplicate guesses
    if (round.guesses.some((g) => g.playerId === playerId)) {
      return false;
    }

    round.guesses.push({ playerId, playerName, guessedPlayerId, reconciledTimestamp });
    return true;
  }

  checkAllGuessed(round: RoundData, totalPlayers: number): boolean {
    // -1 because the media owner shouldn't guess their own photo
    return round.guesses.length >= totalPlayers - 1;
  }

  forceEndRound(round: RoundData, totalPlayers: number, onRoundEnd: (results: GuessResult[]) => void) {
    this.endRound(round, totalPlayers, onRoundEnd);
  }

  private endRound(round: RoundData, totalPlayers: number, onRoundEnd: (results: GuessResult[]) => void) {
    if (!round.isActive) return;
    round.isActive = false;

    if (this.roundTimer) {
      clearTimeout(this.roundTimer);
      this.roundTimer = null;
    }
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }

    const results = computeRoundScores(round.guesses, round.ownerSocketId, totalPlayers);
    onRoundEnd(results);
  }

  cleanup() {
    if (this.roundTimer) clearTimeout(this.roundTimer);
    if (this.tickInterval) clearInterval(this.tickInterval);
    if (this.countdownTimer) clearTimeout(this.countdownTimer);
    this.roundTimer = null;
    this.tickInterval = null;
    this.countdownTimer = null;
  }
}
