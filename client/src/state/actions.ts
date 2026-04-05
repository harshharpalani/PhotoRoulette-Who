import type { Player, GameConfig, GuessResult, ScoreEntry, RevealStyle } from '@photoroulette/shared';

export type GameAction =
  | { type: 'SET_PLAYER_INFO'; playerId: string; displayName: string; isHost: boolean }
  | { type: 'SET_ROOM_CODE'; roomCode: string }
  | { type: 'SET_PLAYERS'; players: Player[] }
  | { type: 'ADD_PLAYER'; player: Player }
  | { type: 'REMOVE_PLAYER'; playerId: string }
  | { type: 'PLAYER_READY'; playerId: string }
  | { type: 'UPDATE_CONFIG'; config: GameConfig }
  | { type: 'SET_PHASE'; phase: GamePhase }
  | { type: 'START_ROUND'; roundNumber: number; revealStyle: RevealStyle; revealDuration: number; mediaType: 'image' | 'video' }
  | { type: 'SET_MEDIA_BLOB'; blob: Blob }
  | { type: 'SET_MY_GUESS'; playerId: string }
  | { type: 'ROUND_END'; ownerPlayerId: string; ownerName: string; guessResults: GuessResult[]; roundScores: Record<string, number> }
  | { type: 'UPDATE_SCORES'; scores: ScoreEntry[] }
  | { type: 'GAME_ENDED'; finalScores: ScoreEntry[]; winnerId: string; winnerName: string }
  | { type: 'UPDATE_TIMING'; clockOffset: number; rtt: number }
  | { type: 'TICK'; timeRemaining: number }
  | { type: 'VOTE_STATUS'; votesNeeded: number; votesCast: number }
  | { type: 'COUNTDOWN'; count: number }
  | { type: 'RESET_GAME' };

export type GamePhase = 'home' | 'joining' | 'lobby' | 'starting' | 'playing' | 'roundResult' | 'finalResult';
