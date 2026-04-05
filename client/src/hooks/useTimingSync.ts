import { useEffect, useRef } from 'react';
import { getSocket } from '../socket.js';

export function useTimingSync() {
  const clockOffsetRef = useRef(0);
  const rttRef = useRef(0);

  useEffect(() => {
    const socket = getSocket();

    const handlePing = ({ serverSendTime }: { serverSendTime: number }) => {
      const clientReceiveTime = performance.timeOrigin + performance.now();
      socket.emit('timing:pong', { clientReceiveTime, serverSendTime });
    };

    socket.on('timing:ping', handlePing);
    return () => {
      socket.off('timing:ping', handlePing);
    };
  }, []);

  const getHighResTimestamp = () => performance.timeOrigin + performance.now();

  return { clockOffsetRef, rttRef, getHighResTimestamp };
}
