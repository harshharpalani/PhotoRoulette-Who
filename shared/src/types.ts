export enum RevealStyle {
  GRADUAL_UNBLUR = 'gradual_unblur',
  SLIDING_REVEAL = 'sliding_reveal',
  PIXELATED_TO_CLEAR = 'pixelated_to_clear',
  IMMEDIATE = 'immediate',
  RANDOM = 'random',
}

export enum MediaScope {
  PHOTOS_ONLY = 'photos_only',
  PHOTOS_AND_VIDEOS = 'photos_and_videos',
}

export enum GameState {
  WAITING_FOR_PLAYERS = 'waiting_for_players',
  LOBBY = 'lobby',
  STARTING = 'starting',
  ROUND_ACTIVE = 'round_active',
  ROUND_RESULT = 'round_result',
  GAME_ENDED = 'game_ended',
}

export interface Player {
  id: string;
  displayName: string;
  isHost: boolean;
  isMediaReady: boolean;
  mediaCount: number;
}

export interface GameConfig {
  revealStyle: RevealStyle;
  revealDuration: number; // seconds, 5-10
  numRounds: number;
  mediaScope: MediaScope;
}

export interface MediaManifestItem {
  index: number;
  type: 'image' | 'video';
  name: string;
}

export interface GuessResult {
  playerId: string;
  playerName: string;
  guessedPlayerId: string;
  isCorrect: boolean;
  reconciledTimestamp: number;
  rank: number;
  points: number;
}

export interface RoundResult {
  roundNumber: number;
  ownerPlayerId: string;
  ownerName: string;
  mediaType: 'image' | 'video';
  guessResults: GuessResult[];
}

export interface ScoreEntry {
  playerId: string;
  playerName: string;
  score: number;
}
