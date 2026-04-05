import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSocket } from '../socket.js';
import { useGameState } from '../state/GameContext.js';
import { useSocketEvent } from '../hooks/useSocket.js';
import { useTimingSync } from '../hooks/useTimingSync.js';
import MediaPicker from '../components/MediaPicker.js';
import PlayerList from '../components/PlayerList.js';
import HostConfigPanel from '../components/HostConfigPanel.js';
import RoomCodeDisplay from '../components/RoomCodeDisplay.js';
import type { MediaManifestItem } from '@photoroulette/shared';
import { getMediaUploadGetter, setMediaUploadGetter } from '../media/mediaUploadStore.js';

export default function LobbyPage() {
  const { code } = useParams<{ code: string }>();
  const { state, dispatch } = useGameState();
  const navigate = useNavigate();

  // Start timing sync
  useTimingSync();

  // Listen for new players
  useSocketEvent('room:player-joined', ({ player }) => {
    dispatch({ type: 'ADD_PLAYER', player });
  });

  useSocketEvent('room:player-left', ({ playerId }) => {
    dispatch({ type: 'REMOVE_PLAYER', playerId });
  });

  useSocketEvent('lobby:player-ready', ({ playerId }) => {
    dispatch({ type: 'PLAYER_READY', playerId });
  });

  useSocketEvent('lobby:media-reset', () => {
    setMediaUploadGetter(null);
    dispatch({ type: 'RESET_MEDIA_READY_ALL' });
  });

  useSocketEvent('lobby:config-updated', ({ config }) => {
    dispatch({ type: 'UPDATE_CONFIG', config });
  });

  useSocketEvent('game:starting', ({ config, roundCount }) => {
    dispatch({ type: 'UPDATE_CONFIG', config });
    dispatch({ type: 'SET_PHASE', phase: 'starting' });
    navigate(`/game/${code}`);
  });

  // Handle media request from server during game
  useSocketEvent('media:request', async ({ roundIndex }) => {
    const mediaUploadGetter = getMediaUploadGetter();
    if (mediaUploadGetter) {
      try {
        const buffer = await mediaUploadGetter(roundIndex);
        const socket = getSocket();
        socket.emit('media:upload', { roundIndex }, buffer);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to access media';
        window.alert(message);
      }
    }
  });

  const handleMediaApproved = (
    manifest: MediaManifestItem[],
    getFileBuffer: (index: number) => Promise<ArrayBuffer>,
  ) => {
    setMediaUploadGetter(getFileBuffer);
    const socket = getSocket();
    socket.emit('player:media-ready', { mediaCount: manifest.length, manifest });
  };

  const handleConfigChange = (config: Partial<typeof state.gameConfig>) => {
    const socket = getSocket();
    socket.emit('host:config-update', config);
  };

  const handleStart = () => {
    const socket = getSocket();
    socket.emit('host:start-game');
  };

  const allReady = state.players.length >= 2 && state.players.every((p) => p.isMediaReady);

  return (
    <div className="page lobby-page">
      <RoomCodeDisplay code={code || ''} />

      <PlayerList players={state.players} currentPlayerId={state.playerId} />

      <MediaPicker
        key={state.gameConfig.mediaScope}
        mediaScope={state.gameConfig.mediaScope}
        onApproved={handleMediaApproved}
      />

      {state.isHost && (
        <HostConfigPanel
          config={state.gameConfig}
          onConfigChange={handleConfigChange}
          canStart={allReady}
          onStart={handleStart}
        />
      )}
    </div>
  );
}
