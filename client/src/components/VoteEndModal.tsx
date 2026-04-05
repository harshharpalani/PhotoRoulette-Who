interface VoteEndModalProps {
  voteStatus: { votesNeeded: number; votesCast: number } | null;
  onVote: () => void;
  hasVoted: boolean;
}

export default function VoteEndModal({ voteStatus, onVote, hasVoted }: VoteEndModalProps) {
  return (
    <div className="vote-end">
      <button className="btn btn-secondary btn-sm" onClick={onVote} disabled={hasVoted}>
        {hasVoted ? 'Vote Cast' : 'Vote to End'}
      </button>
      {voteStatus && (
        <span className="vote-count">
          {voteStatus.votesCast}/{voteStatus.votesNeeded} votes
        </span>
      )}
    </div>
  );
}
