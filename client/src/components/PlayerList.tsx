import type { Player } from '@photoroulette/shared';

interface PlayerListProps {
  players: Player[];
  currentPlayerId: string | null;
}

export default function PlayerList({ players, currentPlayerId }: PlayerListProps) {
  return (
    <div className="player-list">
      {players.map((p) => (
        <div key={p.id} className={`player-item ${p.isMediaReady ? 'ready' : ''} ${p.id === currentPlayerId ? 'self' : ''}`}>
          <span className="player-name">
            {p.displayName}
            {p.isHost && <span className="host-badge">Host</span>}
            {p.id === currentPlayerId && <span className="you-badge">You</span>}
          </span>
          <span className={`player-status ${p.isMediaReady ? 'status-ready' : 'status-waiting'}`}>
            {p.isMediaReady ? 'Ready' : 'Selecting...'}
          </span>
        </div>
      ))}
    </div>
  );
}
