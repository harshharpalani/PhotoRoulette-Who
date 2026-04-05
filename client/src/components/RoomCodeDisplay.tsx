import { useState } from 'react';

interface RoomCodeDisplayProps {
  code: string;
}

export default function RoomCodeDisplay({ code }: RoomCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const shareLink = `${window.location.origin}/join/${code}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = shareLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="room-code-display">
      <div className="room-code-label">Room Code</div>
      <div className="room-code-value">{code}</div>
      <button className="btn btn-secondary btn-sm" onClick={copyLink}>
        {copied ? 'Copied!' : 'Copy Link'}
      </button>
    </div>
  );
}
