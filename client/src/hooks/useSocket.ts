import { useEffect, useRef } from 'react';
import { getSocket, type TypedClientSocket } from '../socket.js';
import type { ServerToClientEvents } from '@photoroulette/shared';

type EventName = keyof ServerToClientEvents;

export function useSocketEvent<E extends EventName>(
  event: E,
  handler: ServerToClientEvents[E],
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const socket = getSocket();
    const wrapper = (...args: unknown[]) => {
      (handlerRef.current as (...a: unknown[]) => void)(...args);
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    socket.on(event as any, wrapper as any);
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      socket.off(event as any, wrapper as any);
    };
  }, [event]);
}

export function useSocket(): TypedClientSocket {
  return getSocket();
}
