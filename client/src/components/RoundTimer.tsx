interface RoundTimerProps {
  timeRemaining: number;
  totalTime: number;
}

export default function RoundTimer({ timeRemaining, totalTime }: RoundTimerProps) {
  const progress = totalTime > 0 ? timeRemaining / totalTime : 0;
  const isLow = timeRemaining <= 3;

  return (
    <div className="round-timer">
      <div className="timer-bar">
        <div
          className={`timer-fill ${isLow ? 'timer-low' : ''}`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <span className={`timer-text ${isLow ? 'timer-text-low' : ''}`}>{timeRemaining}s</span>
    </div>
  );
}
