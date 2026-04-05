import type { GameConfig, GuessResult, Player, ScoreEntry, RevealStyle } from '@photoroulette/shared';
import { DEFAULT_REVEAL_DURATION, DEFAULT_NUM_ROUNDS, DEFAULT_MEDIA_SCOPE, RevealStyle as RS } from '@photoroulette/shared';
import type { GameAction, GamePhase } from './actions.js';

export interface GameState {
  roomCode: string | null;
  playerId: string | null;
  displayName: string;
  isHost: boolean;
  players: Player[];
  gameConfig: GameConfig;
  phase: GamePhase;
  countdown: number;
  currentRound: {
    roundNumber: number;
    revealStyle: RevealStyle;
    revealDuration: number;
    mediaBlob: Blob | null;
    mediaType: 'image' | 'video';
    ownerPlayerId: string | null;
    ownerName: string | null;
    guessResults: GuessResult[];
    roundScores: Record<string, number>;
    myGuess: string | null;
    timeRemaining: number;
  } | null;
  scores: ScoreEntry[];
  finalResult: {
    finalScores: ScoreEntry[];
    winnerId: string;
    winnerName: string;
  } | null;
  voteStatus: { votesNeeded: number; votesCast: number } | null;
}

export const initialGameState: GameState = {
  roomCode: null,
  playerId: null,
  displayName: '',
  isHost: false,
  players: [],
  gameConfig: {
    revealStyle: RS.GRADUAL_UNBLUR,
    revealDuration: DEFAULT_REVEAL_DURATION,
    numRounds: DEFAULT_NUM_ROUNDS,
    mediaScope: DEFAULT_MEDIA_SCOPE,
  },
  phase: 'home',
  countdown: 0,
  currentRound: null,
  scores: [],
  finalResult: null,
  voteStatus: null,
};

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_PLAYER_INFO':
      return { ...state, playerId: action.playerId, displayName: action.displayName, isHost: action.isHost };
    case 'SET_ROOM_CODE':
      return { ...state, roomCode: action.roomCode };
    case 'SET_PLAYERS':
      return { ...state, players: action.players };
    case 'ADD_PLAYER':
      return { ...state, players: [...state.players, action.player] };
    case 'REMOVE_PLAYER':
      return { ...state, players: state.players.filter((p) => p.id !== action.playerId) };
    case 'PLAYER_READY':
      return {
        ...state,
        players: state.players.map((p) => (p.id === action.playerId ? { ...p, isMediaReady: true } : p)),
      };
    case 'RESET_MEDIA_READY_ALL':
      return {
        ...state,
        players: state.players.map((p) => ({ ...p, isMediaReady: false, mediaCount: 0 })),
      };
    case 'UPDATE_CONFIG':
      return { ...state, gameConfig: action.config };
    case 'SET_PHASE':
      return { ...state, phase: action.phase };
    case 'COUNTDOWN':
      return { ...state, countdown: action.count };
    case 'START_ROUND':
      return {
        ...state,
        phase: 'playing',
        currentRound: {
          roundNumber: action.roundNumber,
          revealStyle: action.revealStyle,
          revealDuration: action.revealDuration,
          mediaBlob: null,
          mediaType: action.mediaType,
          ownerPlayerId: null,
          ownerName: null,
          guessResults: [],
          roundScores: {},
          myGuess: null,
          timeRemaining: action.revealDuration,
        },
      };
    case 'SET_MEDIA_BLOB':
      if (!state.currentRound) return state;
      return { ...state, currentRound: { ...state.currentRound, mediaBlob: action.blob } };
    case 'SET_MY_GUESS':
      if (!state.currentRound) return state;
      return { ...state, currentRound: { ...state.currentRound, myGuess: action.playerId } };
    case 'TICK':
      if (!state.currentRound) return state;
      return { ...state, currentRound: { ...state.currentRound, timeRemaining: action.timeRemaining } };
    case 'ROUND_END':
      if (!state.currentRound) return state;
      return {
        ...state,
        phase: 'roundResult',
        currentRound: {
          ...state.currentRound,
          ownerPlayerId: action.ownerPlayerId,
          ownerName: action.ownerName,
          guessResults: action.guessResults,
          roundScores: action.roundScores,
        },
      };
    case 'UPDATE_SCORES':
      return { ...state, scores: action.scores };
    case 'GAME_ENDED':
      return {
        ...state,
        phase: 'finalResult',
        finalResult: { finalScores: action.finalScores, winnerId: action.winnerId, winnerName: action.winnerName },
      };
    case 'VOTE_STATUS':
      return { ...state, voteStatus: { votesNeeded: action.votesNeeded, votesCast: action.votesCast } };
    case 'UPDATE_TIMING':
      return state; // Timing stored in refs, not state
    case 'RESET_GAME':
      return { ...initialGameState, roomCode: state.roomCode, playerId: state.playerId, displayName: state.displayName, isHost: state.isHost, players: state.players, phase: 'lobby' };
    default:
      return state;
  }
}
