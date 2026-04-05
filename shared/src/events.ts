import type { Player, GameConfig, GuessResult, MediaManifestItem, RevealStyle, ScoreEntry } from './types.js';

// ── Client → Server Events ──

export interface ClientToServerEvents {
  'room:create': (data: { displayName: string }) => void;
  'room:join': (data: { roomCode: string; displayName: string }) => void;
  'room:leave': () => void;
  'player:media-ready': (data: { mediaCount: number; manifest: MediaManifestItem[] }) => void;
  'host:config-update': (data: Partial<GameConfig>) => void;
  'host:start-game': () => void;
  'media:upload': (data: { roundIndex: number }, buffer: ArrayBuffer) => void;
  'guess:submit': (data: { guessedPlayerId: string; clientTimestamp: number }) => void;
  'vote:end-early': () => void;
  'timing:pong': (data: { clientReceiveTime: number; serverSendTime: number }) => void;
}

// ── Server → Client Events ──

export interface ServerToClientEvents {
  'room:created': (data: { roomCode: string; playerId: string }) => void;
  'room:joined': (data: { roomCode: string; playerId: string; players: Player[] }) => void;
  'room:player-joined': (data: { player: Player }) => void;
  'room:player-left': (data: { playerId: string }) => void;
  'room:error': (data: { message: string }) => void;
  'lobby:player-ready': (data: { playerId: string }) => void;
  'lobby:config-updated': (data: { config: GameConfig }) => void;
  'game:starting': (data: { config: GameConfig; roundCount: number }) => void;
  'game:countdown': (data: { count: number }) => void;
  'round:start': (data: {
    roundNumber: number;
    revealStyle: RevealStyle;
    revealDuration: number;
    mediaType: 'image' | 'video';
  }) => void;
  'media:request': (data: { roundIndex: number }) => void;
  'media:broadcast': (data: { mediaType: 'image' | 'video'; roundNumber: number }, buffer: ArrayBuffer) => void;
  'round:tick': (data: { timeRemaining: number }) => void;
  'round:end': (data: {
    ownerPlayerId: string;
    ownerName: string;
    guessResults: GuessResult[];
    roundScores: Record<string, number>;
  }) => void;
  'game:scores-update': (data: { scores: ScoreEntry[] }) => void;
  'game:ended': (data: { finalScores: ScoreEntry[]; winnerId: string; winnerName: string }) => void;
  'vote:end-status': (data: { votesNeeded: number; votesCast: number }) => void;
  'timing:ping': (data: { serverSendTime: number }) => void;
}
