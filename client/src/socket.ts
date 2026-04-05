import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@photoroulette/shared';

export type TypedClientSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: TypedClientSocket | null = null;

export function getSocket(): TypedClientSocket {
  if (!socket) {
    socket = io({
      autoConnect: false,
      transports: ['websocket'],
    }) as TypedClientSocket;
  }
  return socket;
}

export function connectSocket(): TypedClientSocket {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  return s;
}

export function disconnectSocket() {
  if (socket?.connected) {
    socket.disconnect();
  }
}
