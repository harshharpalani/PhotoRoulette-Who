import type { Player } from '@photoroulette/shared';

interface PlayerListProps {
  players: Player[];
  currentPlayerId: string | null;
  isHost?: boolean;
  onKick?: (playerId: string) => void;
}

export default function PlayerList({ players, currentPlayerId, isHost, onKick }: PlayerListProps) {
  return (
    <div className="player-list">
      {players.map((p) => (
        <div key={p.id} className={`player-item ${p.isMediaReady ? 'ready' : ''} ${p.id === currentPlayerId ? 'self' : ''}`}>
          <span className="player-name">
            {p.displayName}
            {p.isHost && <span className="host-badge">Host</span>}
            {p.id === currentPlayerId && <span className="you-badge">You</span>}
          </span>
          <span className="player-item-right">
            <span className={`player-status ${p.isMediaReady ? 'status-ready' : 'status-waiting'}`}>
              {p.isMediaReady ? 'Ready' : 'Selecting...'}
            </span>
            {isHost && !p.isHost && onKick && (
              <button
                className="btn-kick"
                onClick={() => onKick(p.id)}
                title={`Kick ${p.displayName}`}
              >
                ✕
              </button>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}
