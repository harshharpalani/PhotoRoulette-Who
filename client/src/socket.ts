import { io, Socket } from 'socket.io-client';
import { Capacitor } from '@capacitor/core';
import type { ClientToServerEvents, ServerToClientEvents } from '@photoroulette/shared';

export type TypedClientSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: TypedClientSocket | null = null;

export function getSocket(): TypedClientSocket {
  if (!socket) {
    const isNative = Capacitor.isNativePlatform();
    const nativeServerUrl = import.meta.env.VITE_SERVER_URL as string | undefined;
    if (isNative && !nativeServerUrl) {
      // Native builds cannot use capacitor://localhost for socket backend connections.
      console.warn('VITE_SERVER_URL is not set for native app; socket connection may fail.');
    }

    socket = io(isNative ? nativeServerUrl : undefined, {
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
