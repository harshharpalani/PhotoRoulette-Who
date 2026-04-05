import { Server as HttpServer } from 'http';
import { Server, type Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@photoroulette/shared';
import { registerRoomHandlers } from './handlers/roomHandlers.js';
import { registerLobbyHandlers } from './handlers/lobbyHandlers.js';
import { registerGameHandlers } from './handlers/gameHandlers.js';
import { registerTimingHandlers } from './handlers/timingHandlers.js';
import { roomManager } from '../game/RoomManager.js';
import { logger } from '../utils/logger.js';

export type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
export type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

let io: TypedServer;

export function getIO(): TypedServer {
  return io;
}

export function setupSocketServer(httpServer: HttpServer) {
  io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    maxHttpBufferSize: 20e6, // 20MB for media uploads
  });

  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    registerRoomHandlers(io, socket);
    registerLobbyHandlers(io, socket);
    registerGameHandlers(io, socket);
    registerTimingHandlers(io, socket);

    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
      roomManager.handleDisconnect(socket.id);
    });
  });

  return io;
}
