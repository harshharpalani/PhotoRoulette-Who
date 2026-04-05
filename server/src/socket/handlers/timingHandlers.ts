import type { TypedServer, TypedSocket } from '../index.js';
import { timingService } from '../../game/TimingService.js';
import { TIMING_SYNC_INTERVAL_MS } from '@photoroulette/shared';

export function registerTimingHandlers(_io: TypedServer, socket: TypedSocket) {
  // Start periodic ping for this socket
  const pingInterval = setInterval(() => {
    const serverSendTime = Date.now();
    socket.emit('timing:ping', { serverSendTime });
    timingService.recordPingSent(socket.id, serverSendTime);
  }, TIMING_SYNC_INTERVAL_MS);

  socket.on('timing:pong', ({ clientReceiveTime, serverSendTime }) => {
    const serverReceiveTime = Date.now();
    timingService.processPong(socket.id, serverSendTime, clientReceiveTime, serverReceiveTime);
  });

  socket.on('disconnect', () => {
    clearInterval(pingInterval);
    timingService.removeSocket(socket.id);
  });
}
