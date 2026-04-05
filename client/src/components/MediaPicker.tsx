import { useRef } from 'react';
import { useMediaFiles } from '../hooks/useMediaFiles.js';
import MediaPreview from './MediaPreview.js';

interface MediaPickerProps {
  onApproved: (manifest: { index: number; type: 'image' | 'video'; name: string }[], getFileBuffer: (index: number) => Promise<ArrayBuffer>) => void;
}

export default function MediaPicker({ onApproved }: MediaPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    selectedFiles,
    isApproved,
    handleFilesSelected,
    approve,
    reroll,
    getManifest,
    getFileBuffer,
    totalFiles,
  } = useMediaFiles();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFilesSelected(e.target.files);
    }
  };

  const handleApprove = () => {
    approve();
    onApproved(getManifest(), getFileBuffer);
  };

  return (
    <div className="media-picker">
      {selectedFiles.length === 0 ? (
        <div className="media-picker-upload">
          <p>Select your photos and videos</p>
          <p className="text-muted">The game will randomly pick from your selection</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleChange}
            style={{ display: 'none' }}
          />
          <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()}>
            Choose Files
          </button>
        </div>
      ) : !isApproved ? (
        <div className="media-picker-review">
          <p>Selected {selectedFiles.length} of {totalFiles} items:</p>
          <MediaPreview files={selectedFiles} />
          <div className="media-picker-actions">
            <button className="btn btn-primary" onClick={handleApprove}>
              Approve Selection
            </button>
            <button className="btn btn-secondary" onClick={reroll}>
              Re-roll
            </button>
          </div>
        </div>
      ) : (
        <div className="media-picker-done">
          <p className="text-success">Media approved! Waiting for others...</p>
        </div>
      )}
    </div>
  );
}
