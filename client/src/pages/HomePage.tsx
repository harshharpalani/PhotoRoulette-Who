import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { connectSocket } from '../socket.js';
import { useGameState } from '../state/GameContext.js';

export default function HomePage() {
  const [joinCode, setJoinCode] = useState('');
  const { dispatch } = useGameState();
  const navigate = useNavigate();

  const handleCreate = () => {
    navigate('/join');
  };

  const handleJoin = () => {
    if (joinCode.trim()) {
      navigate(`/join/${joinCode.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="page home-page">
      <h1>Photo Roulette</h1>
      <p className="subtitle">Who?</p>

      <div className="home-actions">
        <button className="btn btn-primary" onClick={handleCreate}>
          Create Room
        </button>

        <div className="divider">or</div>

        <div className="join-input-group">
          <input
            type="text"
            placeholder="Enter room code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={5}
            className="input"
          />
          <button className="btn btn-secondary" onClick={handleJoin} disabled={!joinCode.trim()}>
            Join
          </button>
        </div>
      </div>
    </div>
  );
}
