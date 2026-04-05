import type { TypedServer, TypedSocket } from '../index.js';
import { roomManager } from '../../game/RoomManager.js';
import { logger } from '../../utils/logger.js';

export function registerLobbyHandlers(io: TypedServer, socket: TypedSocket) {
  socket.on('player:media-ready', ({ mediaCount, manifest }) => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room) return;
    const player = room.players.get(socket.id);
    if (!player) return;

    player.isMediaReady = true;
    player.mediaCount = mediaCount;
    roomManager.setMediaManifest(socket.id, manifest);

    io.to(room.code).emit('lobby:player-ready', { playerId: socket.id });
    logger.info(`Player ${player.displayName} media ready in room ${room.code}`);
  });

  socket.on('host:config-update', (config) => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room || room.hostSocketId !== socket.id) return;

    Object.assign(room.config, config);
    io.to(room.code).emit('lobby:config-updated', { config: room.config });
  });

  socket.on('host:start-game', () => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room || room.hostSocketId !== socket.id) return;

    const players = Array.from(room.players.values());
    if (players.length < 2) {
      socket.emit('room:error', { message: 'Need at least 2 players to start' });
      return;
    }
    if (!players.every((p) => p.isMediaReady)) {
      socket.emit('room:error', { message: 'Not all players have approved their media' });
      return;
    }

    roomManager.startGame(room.code, io);
  });
}
