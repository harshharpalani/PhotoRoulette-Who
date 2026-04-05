import { useRef } from 'react';
import { useMediaFiles } from '../hooks/useMediaFiles.js';
import MediaPreview from './MediaPreview.js';
import { MediaScope } from '@photoroulette/shared';
import type { MediaManifestItem } from '@photoroulette/shared';

interface MediaPickerProps {
  mediaScope: MediaScope;
  onApproved: (manifest: MediaManifestItem[], getFileBuffer: (index: number) => Promise<ArrayBuffer>) => void;
}

export default function MediaPicker({ mediaScope, onApproved }: MediaPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    selectedFiles,
    isNativeIOS,
    permissionState,
    isReady,
    isLoading,
    warning,
    error,
    handleFilesSelected,
    loadFromCameraRoll,
    retryPermission,
    reroll,
    totalFiles,
  } = useMediaFiles(mediaScope);

  const handleSelectionApplied = (
    payload: Awaited<ReturnType<typeof handleFilesSelected>> | Awaited<ReturnType<typeof reroll>> | Awaited<ReturnType<typeof loadFromCameraRoll>>,
  ) => {
    if (!payload) return;
    onApproved(payload.manifest, payload.getFileBuffer);
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleSelectionApplied(await handleFilesSelected(e.target.files));
      // Let iOS re-open picker even if user picks the same set again.
      e.target.value = '';
    }
  };

  const handleReroll = async () => {
    handleSelectionApplied(await reroll());
  };

  const handleLoadCameraRoll = async () => {
    handleSelectionApplied(await loadFromCameraRoll());
  };

  const handleTryAgainPermission = async () => {
    await retryPermission();
  };

  const isPermissionGranted = permissionState === 'granted';

  if (isNativeIOS && !isPermissionGranted) {
    return (
      <div className="media-picker">
        <div className="media-picker-upload">
          <p>Camera Roll Access Required</p>
          <p className="text-muted">
            Full Photos access is required for automatic random selection.
          </p>
          <button className="btn btn-primary" onClick={handleTryAgainPermission} disabled={isLoading}>
            {isLoading ? 'Checking Access...' : 'Try Again'}
          </button>
          {error && <p className="error">{error}</p>}
          {permissionState === 'limited' && (
            <p className="text-muted">
              Limited access is not enough for this game mode.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="media-picker">
      {!isNativeIOS && (
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={mediaScope === MediaScope.PHOTOS_ONLY ? 'image/*' : 'image/*,video/*'}
          onChange={handleChange}
          style={{ display: 'none' }}
        />
      )}

      {selectedFiles.length === 0 ? (
        <div className="media-picker-upload">
          <p>{isNativeIOS ? 'Load Camera Roll' : 'Select your media'}</p>
          <p className="text-muted">
            {isNativeIOS
              ? 'Tap once to load your library and auto-pick a random set.'
              : 'The game will randomly choose from your selected files.'}
          </p>
          {isNativeIOS ? (
            <button className="btn btn-primary" onClick={handleLoadCameraRoll} disabled={isLoading}>
              {isLoading ? 'Loading Camera Roll...' : 'Load Camera Roll'}
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
              Choose Media
            </button>
          )}
          {error && <p className="error">{error}</p>}
        </div>
      ) : (
        <div className="media-picker-review">
          <p>
            Auto-selected {selectedFiles.length} random {selectedFiles.length === 1 ? 'item' : 'items'}
            {totalFiles > 0 ? ` from ${totalFiles}` : ''}.
          </p>
          <MediaPreview files={selectedFiles} />
          <div className="media-picker-actions">
            <button className="btn btn-secondary" onClick={handleReroll} disabled={isLoading}>
              Pick Different Random Set
            </button>
            {isNativeIOS ? (
              <button className="btn btn-primary" onClick={handleLoadCameraRoll} disabled={isLoading}>
                Reload From Camera Roll
              </button>
            ) : (
              <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                Choose Different Media
              </button>
            )}
          </div>
          {warning && <p className="text-muted">{warning}</p>}
          {error && <p className="error">{error}</p>}
          <div className="media-picker-done">
            {isReady && <p className="text-success">Media ready! Waiting for others...</p>}
          </div>
        </div>
      )}
    </div>
  );
}
