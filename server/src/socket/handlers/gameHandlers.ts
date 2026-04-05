import type { TypedServer, TypedSocket } from '../index.js';
import { roomManager } from '../../game/RoomManager.js';
import { timingService } from '../../game/TimingService.js';
import { logger } from '../../utils/logger.js';

export function registerGameHandlers(io: TypedServer, socket: TypedSocket) {
  socket.on('guess:submit', ({ guessedPlayerId, clientTimestamp }) => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room) return;

    const reconciledTimestamp = timingService.reconcileTimestamp(socket.id, clientTimestamp);
    roomManager.submitGuess(room.code, socket.id, guessedPlayerId, reconciledTimestamp, io);
  });

  socket.on('media:upload', ({ roundIndex }, buffer) => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room) return;

    const round = room.rounds[room.currentRoundIndex];
    if (!round) return;

    // Broadcast the media to all players in the room
    socket.to(room.code).emit('media:broadcast', { mediaType: round.mediaType, roundNumber: room.currentRoundIndex }, buffer);
    // Also send to the uploader so they see it via the same path
    socket.emit('media:broadcast', { mediaType: round.mediaType, roundNumber: room.currentRoundIndex }, buffer);
    logger.info(`Media broadcast for round ${room.currentRoundIndex} in room ${room.code}`);
  });

  socket.on('vote:end-early', () => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room) return;

    room.earlyEndVotes.add(socket.id);
    const votesNeeded = Math.ceil(room.players.size / 2);
    const votesCast = room.earlyEndVotes.size;

    io.to(room.code).emit('vote:end-status', { votesNeeded, votesCast });

    if (votesCast >= votesNeeded) {
      roomManager.endGame(room.code, io);
    }
  });
}
