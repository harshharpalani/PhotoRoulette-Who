import type { TypedServer, TypedSocket } from '../index.js';
import { roomManager } from '../../game/RoomManager.js';
import { logger } from '../../utils/logger.js';

export function registerLobbyHandlers(io: TypedServer, socket: TypedSocket) {
  socket.on('player:media-ready', ({ mediaCount, manifest }) => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room) return;
    const player = room.players.get(socket.id);
    if (!player) return;
    if (!roomManager.isManifestAllowed(room.code, manifest)) {
      socket.emit('room:error', { message: 'This room is currently set to Photos only' });
      return;
    }

    player.isMediaReady = true;
    player.mediaCount = mediaCount;
    roomManager.setMediaManifest(socket.id, manifest);

    io.to(room.code).emit('lobby:player-ready', { playerId: socket.id });
    logger.info(`Player ${player.displayName} media ready in room ${room.code}`);
  });

  socket.on('host:config-update', (config) => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room || room.hostSocketId !== socket.id) return;

    const didChangeMediaScope = config.mediaScope && config.mediaScope !== room.config.mediaScope;
    Object.assign(room.config, config);
    if (didChangeMediaScope) {
      roomManager.resetMediaForRoom(room.code);
      io.to(room.code).emit('lobby:media-reset');
    }
    io.to(room.code).emit('lobby:config-updated', { config: room.config });
  });

  socket.on('host:kick-player', ({ playerId }) => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room || room.hostSocketId !== socket.id) return;
    if (playerId === socket.id) return; // Can't kick yourself

    const targetPlayer = room.players.get(playerId);
    if (!targetPlayer) return;

    logger.info(`Host kicked ${targetPlayer.displayName} from room ${room.code}`);

    // Notify the kicked player
    io.to(playerId).emit('room:kicked');

    // Remove from room
    roomManager.leaveRoom(playerId);

    // Make the kicked socket leave the Socket.IO room
    const targetSocket = io.sockets.sockets.get(playerId);
    if (targetSocket) {
      targetSocket.leave(room.code);
    }

    // Notify remaining players
    io.to(room.code).emit('room:player-left', { playerId });
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
      socket.emit('room:error', { message: 'Not all players have selected media yet' });
      return;
    }

    roomManager.startGame(room.code, io);
  });
}
