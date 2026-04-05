import { useState, useCallback, useRef, useEffect } from 'react';
import { MEDIA_SELECTION_COUNT } from '@photoroulette/shared';
import type { MediaManifestItem, MediaScope } from '@photoroulette/shared';
import {
  getMediaService,
  isNativeIOSMedia,
  type MediaPermissionState,
  type MediaPreviewItem,
  type MediaSelectionResult,
} from '../media/mediaService.js';

export interface ApprovedMediaPayload {
  manifest: MediaManifestItem[];
  getFileBuffer: (index: number) => Promise<ArrayBuffer>;
}

function toApprovedPayload(
  result: MediaSelectionResult,
  getFileBuffer: (index: number) => Promise<ArrayBuffer>,
): ApprovedMediaPayload {
  return {
    manifest: result.manifest,
    getFileBuffer,
  };
}

export function useMediaFiles(mediaScope: MediaScope) {
  const mediaServiceRef = useRef(getMediaService());
  const mediaService = mediaServiceRef.current;
  const isNativeIOS = isNativeIOSMedia();
  const [selectedFiles, setSelectedFiles] = useState<MediaPreviewItem[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [totalFiles, setTotalFiles] = useState(0);
  const [warning, setWarning] = useState('');
  const [error, setError] = useState('');
  const [permissionState, setPermissionState] = useState<MediaPermissionState>(mediaService.getPermissionState());

  useEffect(() => {
    return mediaService.subscribePermission((state) => {
      setPermissionState(state);
    });
  }, [mediaService]);

  useEffect(() => {
    // Keep UI in sync with launch-time permission checks.
    void mediaService.checkOrRequestLaunchPermission();
  }, [mediaService]);

  useEffect(() => {
    mediaService.clearSelection();
    setSelectedFiles([]);
    setIsReady(false);
    setTotalFiles(0);
    setWarning('');
    setError('');
  }, [mediaScope, mediaService]);

  useEffect(() => {
    return () => {
      mediaService.clearSelection();
    };
  }, [mediaService]);

  const applySelection = useCallback(async (
    selector: () => Promise<MediaSelectionResult | null>,
  ): Promise<ApprovedMediaPayload | null> => {
    setIsLoading(true);
    setError('');
    try {
      const result = await selector();
      if (!result) {
        setSelectedFiles([]);
        setTotalFiles(0);
        setWarning('');
        setIsReady(false);
        if (isNativeIOS && permissionState !== 'granted') {
          setError('Full photo access is required before media can be selected.');
        } else {
          setError('No eligible media found.');
        }
        return null;
      }

      setSelectedFiles(result.previews);
      setTotalFiles(result.totalAvailable);
      setWarning(result.warning || '');
      setIsReady(true);
      return toApprovedPayload(result, (index) => mediaService.getFileBuffer(index));
    } catch (err) {
      setIsReady(false);
      setSelectedFiles([]);
      setTotalFiles(0);
      setWarning('');
      setError(err instanceof Error ? err.message : 'Failed to load media');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isNativeIOS, mediaService, permissionState]);

  const handleFilesSelected = useCallback(async (files: FileList): Promise<ApprovedMediaPayload | null> => {
    if (!mediaService.setWebInputFiles) return null;
    mediaService.setWebInputFiles(files);
    return applySelection(() => mediaService.loadRandomSelection({
      count: MEDIA_SELECTION_COUNT,
      scope: mediaScope,
    }));
  }, [applySelection, mediaScope, mediaService]);

  const loadFromCameraRoll = useCallback(async (): Promise<ApprovedMediaPayload | null> => {
    return applySelection(() => mediaService.loadRandomSelection({
      count: MEDIA_SELECTION_COUNT,
      scope: mediaScope,
    }));
  }, [applySelection, mediaScope, mediaService]);

  const reroll = useCallback(async (): Promise<ApprovedMediaPayload | null> => {
    return applySelection(() => mediaService.reroll());
  }, [applySelection, mediaService]);

  const retryPermission = useCallback(async (): Promise<MediaPermissionState> => {
    setIsLoading(true);
    setError('');
    try {
      const state = await mediaService.ensurePermissionBeforeMediaUse();
      if (state !== 'granted') {
        setError('Full photo access is required to continue.');
      }
      return state;
    } finally {
      setIsLoading(false);
    }
  }, [mediaService]);

  return {
    selectedFiles,
    isReady,
    isLoading,
    totalFiles,
    warning,
    error,
    permissionState,
    isNativeIOS,
    handleFilesSelected,
    loadFromCameraRoll,
    reroll,
    retryPermission,
  };
}
