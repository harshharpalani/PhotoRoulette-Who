import { TIMING_SAMPLE_WINDOW, TIMING_OUTLIER_SIGMA } from '@photoroulette/shared';

interface TimingSample {
  rtt: number;
  offset: number;
}

interface SocketTimingData {
  samples: TimingSample[];
  avgRtt: number;
  avgOffset: number;
  lastPingSentTime: number;
}

class TimingService {
  private socketData = new Map<string, SocketTimingData>();

  recordPingSent(socketId: string, serverSendTime: number) {
    let data = this.socketData.get(socketId);
    if (!data) {
      data = { samples: [], avgRtt: 0, avgOffset: 0, lastPingSentTime: 0 };
      this.socketData.set(socketId, data);
    }
    data.lastPingSentTime = serverSendTime;
  }

  processPong(socketId: string, serverSendTime: number, clientReceiveTime: number, serverReceiveTime: number) {
    const data = this.socketData.get(socketId);
    if (!data) return;

    const rtt = serverReceiveTime - serverSendTime;
    const oneWayLatency = rtt / 2;
    // offset = estimated (server_time - client_time)
    // At the moment the client received, server clock was at serverSendTime + oneWayLatency
    // So offset = (serverSendTime + oneWayLatency) - clientReceiveTime
    const offset = serverSendTime + oneWayLatency - clientReceiveTime;

    data.samples.push({ rtt, offset });

    // Keep rolling window
    if (data.samples.length > TIMING_SAMPLE_WINDOW) {
      data.samples.shift();
    }

    // Compute trimmed mean (discard outliers beyond 2 sigma)
    this.updateAverages(data);
  }

  private updateAverages(data: SocketTimingData) {
    if (data.samples.length === 0) return;

    if (data.samples.length < 3) {
      // Not enough samples for outlier rejection, use simple mean
      data.avgRtt = data.samples.reduce((sum, s) => sum + s.rtt, 0) / data.samples.length;
      data.avgOffset = data.samples.reduce((sum, s) => sum + s.offset, 0) / data.samples.length;
      return;
    }

    // Calculate mean and stddev for RTT to detect outliers
    const rttValues = data.samples.map((s) => s.rtt);
    const rttMean = rttValues.reduce((a, b) => a + b, 0) / rttValues.length;
    const rttVariance = rttValues.reduce((sum, v) => sum + (v - rttMean) ** 2, 0) / rttValues.length;
    const rttStdDev = Math.sqrt(rttVariance);

    // Filter out samples where RTT is beyond 2 sigma
    const threshold = TIMING_OUTLIER_SIGMA;
    const filtered = data.samples.filter(
      (s) => Math.abs(s.rtt - rttMean) <= threshold * rttStdDev
    );

    if (filtered.length === 0) {
      // All filtered out, use all samples
      data.avgRtt = rttMean;
      data.avgOffset = data.samples.reduce((sum, s) => sum + s.offset, 0) / data.samples.length;
      return;
    }

    data.avgRtt = filtered.reduce((sum, s) => sum + s.rtt, 0) / filtered.length;
    data.avgOffset = filtered.reduce((sum, s) => sum + s.offset, 0) / filtered.length;
  }

  reconcileTimestamp(socketId: string, clientTimestamp: number): number {
    const data = this.socketData.get(socketId);
    if (!data) return clientTimestamp; // No timing data, use as-is
    // Convert client timestamp to estimated server time
    return clientTimestamp + data.avgOffset;
  }

  getTimingData(socketId: string): SocketTimingData | undefined {
    return this.socketData.get(socketId);
  }

  removeSocket(socketId: string) {
    this.socketData.delete(socketId);
  }
}

export const timingService = new TimingService();
