import type { TypedServer } from '../socket/index.js';
import type { Player, GameConfig, MediaManifestItem, GuessResult, ScoreEntry } from '@photoroulette/shared';
import {
  GameState,
  RevealStyle,
  ROOM_CODE_LENGTH,
  MAX_PLAYERS,
  MIN_PLAYERS,
  DEFAULT_REVEAL_DURATION,
  DEFAULT_NUM_ROUNDS,
  ROOM_CLEANUP_DELAY_MS,
  ROUND_RESULT_DISPLAY_SECONDS,
} from '@photoroulette/shared';
import { GameStateMachine } from './GameStateMachine.js';
import { RoundEngine, type RoundData } from './RoundEngine.js';
import { generateRoomCode } from '../utils/roomCode.js';
import { logger } from '../utils/logger.js';

interface Room {
  code: string;
  hostSocketId: string;
  players: Map<string, Player>;
  config: GameConfig;
  stateMachine: GameStateMachine;
  roundEngine: RoundEngine;
  rounds: RoundData[];
  currentRoundIndex: number;
  scores: Map<string, number>;
  earlyEndVotes: Set<string>;
  mediaManifests: Map<string, MediaManifestItem[]>;
  cleanupTimer: ReturnType<typeof setTimeout> | null;
}

class RoomManager {
  private rooms = new Map<string, Room>();
  private socketToRoom = new Map<string, string>();

  createRoom(socketId: string, displayName: string): Room {
    let code: string;
    do {
      code = generateRoomCode(ROOM_CODE_LENGTH);
    } while (this.rooms.has(code));

    const player: Player = {
      id: socketId,
      displayName,
      isHost: true,
      isMediaReady: false,
      mediaCount: 0,
    };

    const room: Room = {
      code,
      hostSocketId: socketId,
      players: new Map([[socketId, player]]),
      config: {
        revealStyle: RevealStyle.GRADUAL_UNBLUR,
        revealDuration: DEFAULT_REVEAL_DURATION,
        numRounds: DEFAULT_NUM_ROUNDS,
      },
      stateMachine: new GameStateMachine(),
      roundEngine: new RoundEngine(),
      rounds: [],
      currentRoundIndex: -1,
      scores: new Map(),
      earlyEndVotes: new Set(),
      mediaManifests: new Map(),
      cleanupTimer: null,
    };

    this.rooms.set(code, room);
    this.socketToRoom.set(socketId, code);
    return room;
  }

  joinRoom(
    roomCode: string,
    socketId: string,
    displayName: string,
  ): { error?: string } {
    const room = this.rooms.get(roomCode);
    if (!room) return { error: 'Room not found' };
    if (room.players.size >= MAX_PLAYERS) return { error: 'Room is full' };

    const state = room.stateMachine.state;
    if (state !== GameState.WAITING_FOR_PLAYERS && state !== GameState.LOBBY) {
      return { error: 'Game already in progress' };
    }

    const player: Player = {
      id: socketId,
      displayName,
      isHost: false,
      isMediaReady: false,
      mediaCount: 0,
    };

    room.players.set(socketId, player);
    this.socketToRoom.set(socketId, roomCode);

    // Transition to lobby if we have enough players
    if (room.players.size >= MIN_PLAYERS && room.stateMachine.canTransition('PLAYER_JOINED')) {
      room.stateMachine.transition('PLAYER_JOINED');
    }

    // Clear cleanup timer if someone rejoins
    if (room.cleanupTimer) {
      clearTimeout(room.cleanupTimer);
      room.cleanupTimer = null;
    }

    return {};
  }

  leaveRoom(socketId: string) {
    const roomCode = this.socketToRoom.get(socketId);
    if (!roomCode) return;

    const room = this.rooms.get(roomCode);
    if (!room) return;

    room.players.delete(socketId);
    room.mediaManifests.delete(socketId);
    room.earlyEndVotes.delete(socketId);
    this.socketToRoom.delete(socketId);

    // If room is empty, schedule cleanup
    if (room.players.size === 0) {
      room.cleanupTimer = setTimeout(() => {
        this.rooms.delete(roomCode);
        logger.info(`Room ${roomCode} cleaned up (empty)`);
      }, ROOM_CLEANUP_DELAY_MS);
      return;
    }

    // Transfer host if host left
    if (socketId === room.hostSocketId) {
      const newHost = room.players.keys().next().value!;
      room.hostSocketId = newHost;
      const hostPlayer = room.players.get(newHost)!;
      hostPlayer.isHost = true;
    }

    // Check if we dropped below minimum players
    if (room.players.size < MIN_PLAYERS && room.stateMachine.canTransition('PLAYER_LEFT')) {
      room.stateMachine.transition('PLAYER_LEFT');
    }
  }

  handleDisconnect(socketId: string) {
    const roomCode = this.socketToRoom.get(socketId);
    if (!roomCode) return;
    const room = this.rooms.get(roomCode);
    if (!room) return;

    // Emit player left to room before removing
    this.leaveRoom(socketId);
  }

  getRoom(roomCode: string): Room | undefined {
    return this.rooms.get(roomCode);
  }

  getRoomBySocket(socketId: string): Room | undefined {
    const code = this.socketToRoom.get(socketId);
    if (!code) return undefined;
    return this.rooms.get(code);
  }

  setMediaManifest(socketId: string, manifest: MediaManifestItem[]) {
    const room = this.getRoomBySocket(socketId);
    if (!room) return;
    room.mediaManifests.set(socketId, manifest);
  }

  startGame(roomCode: string, io: TypedServer) {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    try {
      room.stateMachine.transition('HOST_START');
    } catch {
      return;
    }

    // Reset scores
    room.scores.clear();
    room.earlyEndVotes.clear();
    for (const socketId of room.players.keys()) {
      room.scores.set(socketId, 0);
    }

    // Create round plan
    room.rounds = room.roundEngine.createRoundPlan(
      Array.from(room.players.keys()),
      room.mediaManifests,
      room.config.numRounds,
    );

    // Fill in owner names
    for (const round of room.rounds) {
      const player = room.players.get(round.ownerSocketId);
      if (player) round.ownerName = player.displayName;
    }

    room.currentRoundIndex = -1;

    io.to(roomCode).emit('game:starting', { config: room.config, roundCount: room.rounds.length });

    // Start first round after countdown
    this.advanceRound(roomCode, io);
  }

  private advanceRound(roomCode: string, io: TypedServer) {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    room.currentRoundIndex++;

    if (room.currentRoundIndex >= room.rounds.length) {
      this.endGame(roomCode, io);
      return;
    }

    const round = room.rounds[room.currentRoundIndex];

    room.roundEngine.startCountdown(roomCode, io, () => {
      try {
        room.stateMachine.transition('COUNTDOWN_DONE');
      } catch {
        // Already in correct state
      }

      room.roundEngine.startRound(
        roomCode,
        round,
        room.currentRoundIndex + 1,
        room.config.revealDuration,
        room.config.revealStyle,
        room.players.size,
        io,
        (results) => this.handleRoundEnd(roomCode, results, io),
      );
    });
  }

  submitGuess(
    roomCode: string,
    socketId: string,
    guessedPlayerId: string,
    reconciledTimestamp: number,
    io: TypedServer,
  ) {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    const round = room.rounds[room.currentRoundIndex];
    if (!round || !round.isActive) return;

    const player = room.players.get(socketId);
    if (!player) return;

    const added = room.roundEngine.addGuess(round, socketId, player.displayName, guessedPlayerId, reconciledTimestamp);
    if (!added) return;

    // Check if all players have guessed
    if (room.roundEngine.checkAllGuessed(round, room.players.size)) {
      try {
        room.stateMachine.transition('ALL_GUESSED');
      } catch {
        // Timer may have already ended the round
      }
      room.roundEngine.forceEndRound(round, room.players.size, (results) => {
        this.handleRoundEnd(roomCode, results, io);
      });
    }
  }

  private handleRoundEnd(roomCode: string, results: GuessResult[], io: TypedServer) {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    const round = room.rounds[room.currentRoundIndex];

    // Try to transition state machine
    try {
      if (room.stateMachine.state === GameState.ROUND_ACTIVE) {
        room.stateMachine.transition('ROUND_TIMER_EXPIRED');
      }
    } catch {
      // Already transitioned
    }

    // Update cumulative scores
    const roundScores: Record<string, number> = {};
    for (const result of results) {
      roundScores[result.playerId] = result.points;
      const current = room.scores.get(result.playerId) || 0;
      room.scores.set(result.playerId, current + result.points);
    }

    // Emit round end
    io.to(roomCode).emit('round:end', {
      ownerPlayerId: round.ownerSocketId,
      ownerName: round.ownerName,
      guessResults: results,
      roundScores,
    });

    // Emit updated scores
    const scoreEntries: ScoreEntry[] = Array.from(room.scores.entries())
      .map(([playerId, score]) => ({
        playerId,
        playerName: room.players.get(playerId)?.displayName || 'Unknown',
        score,
      }))
      .sort((a, b) => b.score - a.score);

    io.to(roomCode).emit('game:scores-update', { scores: scoreEntries });

    // Auto-advance after delay
    setTimeout(() => {
      if (room.currentRoundIndex >= room.rounds.length - 1) {
        // Last round
        try {
          room.stateMachine.transition('LAST_ROUND');
        } catch {
          // Already ended
        }
        this.endGame(roomCode, io);
      } else {
        try {
          room.stateMachine.transition('NEXT_ROUND');
        } catch {
          // Ignore
        }
        this.advanceRound(roomCode, io);
      }
    }, ROUND_RESULT_DISPLAY_SECONDS * 1000);
  }

  endGame(roomCode: string, io: TypedServer) {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    room.roundEngine.cleanup();

    const finalScores: ScoreEntry[] = Array.from(room.scores.entries())
      .map(([playerId, score]) => ({
        playerId,
        playerName: room.players.get(playerId)?.displayName || 'Unknown',
        score,
      }))
      .sort((a, b) => b.score - a.score);

    const winner = finalScores[0];

    io.to(roomCode).emit('game:ended', {
      finalScores,
      winnerId: winner?.playerId || '',
      winnerName: winner?.playerName || '',
    });

    // Reset for potential play again
    try {
      if (room.stateMachine.state !== GameState.GAME_ENDED) {
        // Force to game ended
      }
    } catch {
      // Ignore
    }
  }
}

export const roomManager = new RoomManager();
