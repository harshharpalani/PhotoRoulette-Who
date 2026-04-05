import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { connectSocket, getSocket } from '../socket.js';
import { useGameState } from '../state/GameContext.js';

export default function JoinPage() {
  const { code } = useParams<{ code?: string }>();
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const { dispatch } = useGameState();
  const navigate = useNavigate();

  const isCreating = !code;

  useEffect(() => {
    const socket = connectSocket();

    socket.on('room:created', ({ roomCode, playerId }) => {
      dispatch({ type: 'SET_PLAYER_INFO', playerId, displayName, isHost: true });
      dispatch({ type: 'SET_ROOM_CODE', roomCode });
      dispatch({ type: 'SET_PHASE', phase: 'lobby' });
      navigate(`/lobby/${roomCode}`);
    });

    socket.on('room:joined', ({ roomCode, playerId, players }) => {
      dispatch({ type: 'SET_PLAYER_INFO', playerId, displayName, isHost: false });
      dispatch({ type: 'SET_ROOM_CODE', roomCode });
      dispatch({ type: 'SET_PLAYERS', players });
      dispatch({ type: 'SET_PHASE', phase: 'lobby' });
      navigate(`/lobby/${roomCode}`);
    });

    socket.on('room:error', ({ message }) => {
      setError(message);
    });

    return () => {
      socket.off('room:created');
      socket.off('room:joined');
      socket.off('room:error');
    };
  }, [displayName, dispatch, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    const socket = getSocket();
    if (isCreating) {
      socket.emit('room:create', { displayName: displayName.trim() });
    } else {
      socket.emit('room:join', { roomCode: code!, displayName: displayName.trim() });
    }
  };

  return (
    <div className="page join-page">
      <h2>{isCreating ? 'Create Room' : `Join Room ${code}`}</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Your display name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={20}
          className="input"
          autoFocus
        />
        <button className="btn btn-primary" type="submit" disabled={!displayName.trim()}>
          {isCreating ? 'Create' : 'Join'}
        </button>
      </form>

      {error && <p className="error">{error}</p>}
    </div>
  );
}
