import type { TypedServer, TypedSocket } from '../index.js';
import { roomManager } from '../../game/RoomManager.js';
import { logger } from '../../utils/logger.js';

export function registerRoomHandlers(io: TypedServer, socket: TypedSocket) {
  socket.on('room:create', ({ displayName }) => {
    const room = roomManager.createRoom(socket.id, displayName);
    socket.join(room.code);
    socket.emit('room:created', { roomCode: room.code, playerId: socket.id });
    logger.info(`Room ${room.code} created by ${displayName}`);
  });

  socket.on('room:join', ({ roomCode, displayName }) => {
    const result = roomManager.joinRoom(roomCode.toUpperCase(), socket.id, displayName);
    if (result.error) {
      socket.emit('room:error', { message: result.error });
      return;
    }
    socket.join(roomCode.toUpperCase());
    const room = roomManager.getRoom(roomCode.toUpperCase())!;
    const players = Array.from(room.players.values());
    socket.emit('room:joined', { roomCode: room.code, playerId: socket.id, players });
    socket.to(room.code).emit('room:player-joined', { player: room.players.get(socket.id)! });
    logger.info(`${displayName} joined room ${room.code}`);
  });

  socket.on('room:leave', () => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room) return;
    roomManager.leaveRoom(socket.id);
    socket.leave(room.code);
    io.to(room.code).emit('room:player-left', { playerId: socket.id });
    logger.info(`Player ${socket.id} left room ${room.code}`);
  });
}
