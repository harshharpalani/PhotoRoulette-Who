import { useState, useCallback, useRef } from 'react';
import { MEDIA_SELECTION_COUNT } from '@photoroulette/shared';
import type { MediaManifestItem } from '@photoroulette/shared';

interface MediaFile {
  file: File;
  type: 'image' | 'video';
  url: string;
}

export function useMediaFiles() {
  const allFilesRef = useRef<File[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<MediaFile[]>([]);
  const [approvedFiles, setApprovedFiles] = useState<MediaFile[]>([]);
  const [isApproved, setIsApproved] = useState(false);

  const handleFilesSelected = useCallback((files: FileList) => {
    const mediaFiles = Array.from(files).filter(
      (f) => f.type.startsWith('image/') || f.type.startsWith('video/')
    );
    allFilesRef.current = mediaFiles;
    pickRandom(mediaFiles);
  }, []);

  const pickRandom = useCallback((files?: File[]) => {
    const source = files || allFilesRef.current;
    if (source.length === 0) return;

    const count = Math.min(MEDIA_SELECTION_COUNT, source.length);
    const shuffled = [...source].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, count);

    // Revoke old URLs
    selectedFiles.forEach((f) => URL.revokeObjectURL(f.url));

    const newSelection = picked.map((file) => ({
      file,
      type: (file.type.startsWith('video/') ? 'video' : 'image') as 'image' | 'video',
      url: URL.createObjectURL(file),
    }));
    setSelectedFiles(newSelection);
    setIsApproved(false);
  }, [selectedFiles]);

  const approve = useCallback(() => {
    setApprovedFiles(selectedFiles);
    setIsApproved(true);
  }, [selectedFiles]);

  const reroll = useCallback(() => {
    pickRandom();
  }, [pickRandom]);

  const getManifest = useCallback((): MediaManifestItem[] => {
    return approvedFiles.map((f, i) => ({
      index: i,
      type: f.type,
      name: f.file.name,
    }));
  }, [approvedFiles]);

  const getFileBuffer = useCallback(async (index: number): Promise<ArrayBuffer> => {
    return approvedFiles[index].file.arrayBuffer();
  }, [approvedFiles]);

  return {
    selectedFiles,
    approvedFiles,
    isApproved,
    handleFilesSelected,
    approve,
    reroll,
    getManifest,
    getFileBuffer,
    totalFiles: allFilesRef.current.length,
  };
}
