import { Capacitor } from '@capacitor/core';
import { Camera, type CameraPermissionState } from '@capacitor/camera';
import { Media, type MediaAsset } from '@capacitor-community/media';
import { Filesystem } from '@capacitor/filesystem';
import { MediaScope } from '@photoroulette/shared';
import type { MediaManifestItem } from '@photoroulette/shared';

export type MediaPermissionState = 'unknown' | 'granted' | 'limited' | 'denied';

export interface MediaPreviewItem {
  type: 'image' | 'video';
  name: string;
  url: string;
  previewKind: 'image' | 'video';
}

export interface MediaSelectionResult {
  manifest: MediaManifestItem[];
  previews: MediaPreviewItem[];
  totalAvailable: number;
  warning?: string;
}

export interface MediaService {
  checkOrRequestLaunchPermission(): Promise<MediaPermissionState>;
  ensurePermissionBeforeMediaUse(): Promise<MediaPermissionState>;
  loadRandomSelection(options: { count: number; scope: MediaScope }): Promise<MediaSelectionResult | null>;
  getFileBuffer(index: number): Promise<ArrayBuffer>;
  reroll(): Promise<MediaSelectionResult | null>;
  getPermissionState(): MediaPermissionState;
  subscribePermission(listener: (state: MediaPermissionState) => void): () => void;
  clearSelection(): void;
  setWebInputFiles?(files: FileList): void;
}

interface NativeAsset {
  identifier: string;
  name: string;
  type: 'image' | 'video';
  previewUrl: string;
}

function isMediaFile(file: File) {
  return file.type.startsWith('image/') || file.type.startsWith('video/');
}

function stripBase64Prefix(data: string): string {
  const commaIndex = data.indexOf(',');
  if (data.startsWith('data:') && commaIndex >= 0) {
    return data.slice(commaIndex + 1);
  }
  return data;
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function reservoirSample<T>(items: T[], count: number): T[] {
  if (count <= 0 || items.length === 0) return [];
  const size = Math.min(count, items.length);
  const reservoir: T[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (i < size) {
      reservoir.push(item);
      continue;
    }
    const j = Math.floor(Math.random() * (i + 1));
    if (j < size) reservoir[j] = item;
  }
  return reservoir;
}

function cameraPermissionToMediaPermission(state: CameraPermissionState): MediaPermissionState {
  if (state === 'granted') return 'granted';
  if (state === 'limited') return 'limited';
  if (state === 'prompt' || state === 'prompt-with-rationale') return 'unknown';
  return 'denied';
}

function buildManifest(items: { type: 'image' | 'video'; name: string }[]): MediaManifestItem[] {
  return items.map((item, index) => ({
    index,
    type: item.type,
    name: item.name,
  }));
}

abstract class BaseMediaService {
  protected permissionState: MediaPermissionState = 'unknown';
  private permissionListeners = new Set<(state: MediaPermissionState) => void>();

  protected setPermissionState(next: MediaPermissionState) {
    this.permissionState = next;
    for (const listener of this.permissionListeners) {
      listener(next);
    }
  }

  getPermissionState(): MediaPermissionState {
    return this.permissionState;
  }

  subscribePermission(listener: (state: MediaPermissionState) => void): () => void {
    this.permissionListeners.add(listener);
    return () => {
      this.permissionListeners.delete(listener);
    };
  }

  abstract clearSelection(): void;
}

class WebMediaService extends BaseMediaService implements MediaService {
  private allFiles: File[] = [];
  private selectedFiles: File[] = [];
  private selectedPreviews: MediaPreviewItem[] = [];
  private lastCount = 0;
  private lastScope: MediaScope | null = null;

  constructor() {
    super();
    this.setPermissionState('granted');
  }

  setWebInputFiles(files: FileList) {
    this.allFiles = Array.from(files).filter(isMediaFile);
    this.clearSelection();
  }

  async checkOrRequestLaunchPermission(): Promise<MediaPermissionState> {
    return this.permissionState;
  }

  async ensurePermissionBeforeMediaUse(): Promise<MediaPermissionState> {
    return this.permissionState;
  }

  async loadRandomSelection(options: { count: number; scope: MediaScope }): Promise<MediaSelectionResult | null> {
    this.lastCount = options.count;
    this.lastScope = options.scope;

    const available = this.allFiles.filter((file) => (
      options.scope === MediaScope.PHOTOS_ONLY ? file.type.startsWith('image/') : isMediaFile(file)
    ));

    if (available.length === 0) {
      this.clearSelection();
      return null;
    }

    this.selectedFiles = reservoirSample(available, options.count);
    this.selectedPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    this.selectedPreviews = this.selectedFiles.map((file) => {
      const type: 'image' | 'video' = file.type.startsWith('video/') ? 'video' : 'image';
      return {
        type,
        name: file.name,
        url: URL.createObjectURL(file),
        previewKind: type,
      };
    });

    return {
      manifest: buildManifest(this.selectedPreviews),
      previews: this.selectedPreviews,
      totalAvailable: available.length,
      warning: available.length < options.count
        ? `Only ${available.length} eligible media items were found.`
        : undefined,
    };
  }

  async getFileBuffer(index: number): Promise<ArrayBuffer> {
    const file = this.selectedFiles[index];
    if (!file) throw new Error(`No selected media found for index ${index}`);
    return file.arrayBuffer();
  }

  async reroll(): Promise<MediaSelectionResult | null> {
    if (!this.lastScope || this.lastCount <= 0) return null;
    return this.loadRandomSelection({ count: this.lastCount, scope: this.lastScope });
  }

  clearSelection() {
    this.selectedFiles = [];
    this.selectedPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    this.selectedPreviews = [];
  }
}

class NativeIosMediaService extends BaseMediaService implements MediaService {
  private launchPermissionPrompted = false;
  private availableAssets: NativeAsset[] = [];
  private selectedAssets: NativeAsset[] = [];
  private lastCount = 0;
  private lastScope: MediaScope | null = null;

  constructor() {
    super();
    this.setPermissionState('unknown');
  }

  private async checkPermissionOnly(): Promise<MediaPermissionState> {
    const status = await Camera.checkPermissions();
    const mapped = cameraPermissionToMediaPermission(status.photos);
    this.setPermissionState(mapped);
    return mapped;
  }

  async checkOrRequestLaunchPermission(): Promise<MediaPermissionState> {
    let state = await this.checkPermissionOnly();
    if (!this.launchPermissionPrompted) {
      this.launchPermissionPrompted = true;
      if (state !== 'granted') {
        const requested = await Camera.requestPermissions({ permissions: ['photos'] });
        state = cameraPermissionToMediaPermission(requested.photos);
        this.setPermissionState(state);
      }
    }
    return state;
  }

  async ensurePermissionBeforeMediaUse(): Promise<MediaPermissionState> {
    let state = await this.checkPermissionOnly();
    if (state !== 'granted') {
      const requested = await Camera.requestPermissions({ permissions: ['photos'] });
      state = cameraPermissionToMediaPermission(requested.photos);
      this.setPermissionState(state);
    }
    return state;
  }

  private toNativeAsset(item: MediaAsset): NativeAsset {
    const type: 'image' | 'video' = typeof item.duration === 'number' ? 'video' : 'image';
    return {
      identifier: item.identifier,
      name: `${type}-${item.identifier.slice(-8)}`,
      type,
      previewUrl: `data:image/jpeg;base64,${item.data}`,
    };
  }

  private async fetchEligibleAssets(scope: MediaScope): Promise<NativeAsset[]> {
    const seen = new Map<string, NativeAsset>();
    let quantity = 250;
    let previousCount = -1;
    const maxQuantity = 6000;

    while (quantity <= maxQuantity) {
      const response = await Media.getMedias({
        quantity,
        types: scope === MediaScope.PHOTOS_ONLY ? 'photos' : 'all',
        thumbnailWidth: 220,
        thumbnailHeight: 220,
        thumbnailQuality: 70,
        sort: [{ key: 'creationDate', ascending: false }],
      });

      for (const media of response.medias) {
        const asset = this.toNativeAsset(media);
        if (scope === MediaScope.PHOTOS_ONLY && asset.type !== 'image') continue;
        seen.set(asset.identifier, asset);
      }

      if (seen.size === previousCount || response.medias.length < quantity) {
        break;
      }

      previousCount = seen.size;
      quantity += 500;
    }

    return Array.from(seen.values());
  }

  private createSelection(assets: NativeAsset[], count: number): MediaSelectionResult | null {
    if (assets.length === 0) {
      this.selectedAssets = [];
      return null;
    }

    this.selectedAssets = reservoirSample(assets, count);
    const previews: MediaPreviewItem[] = this.selectedAssets.map((asset) => ({
      type: asset.type,
      name: asset.name,
      url: asset.previewUrl,
      // Native media plugin returns JPEG thumbnails for preview.
      previewKind: 'image',
    }));

    return {
      manifest: buildManifest(previews),
      previews,
      totalAvailable: assets.length,
      warning: assets.length < count
        ? `Only ${assets.length} eligible media items were found.`
        : undefined,
    };
  }

  async loadRandomSelection(options: { count: number; scope: MediaScope }): Promise<MediaSelectionResult | null> {
    this.lastCount = options.count;
    this.lastScope = options.scope;
    const permissionState = await this.ensurePermissionBeforeMediaUse();
    if (permissionState !== 'granted') {
      this.clearSelection();
      return null;
    }

    this.availableAssets = await this.fetchEligibleAssets(options.scope);
    return this.createSelection(this.availableAssets, options.count);
  }

  async getFileBuffer(index: number): Promise<ArrayBuffer> {
    const permissionState = await this.ensurePermissionBeforeMediaUse();
    if (permissionState !== 'granted') {
      throw new Error('Full photo access is required to upload media.');
    }

    const selected = this.selectedAssets[index];
    if (!selected) throw new Error(`No selected media found for index ${index}`);

    const { path } = await Media.getMediaByIdentifier({ identifier: selected.identifier });
    const file = await Filesystem.readFile({ path });
    if (typeof file.data !== 'string') {
      return file.data.arrayBuffer();
    }
    const cleanBase64 = stripBase64Prefix(file.data);
    return base64ToArrayBuffer(cleanBase64);
  }

  async reroll(): Promise<MediaSelectionResult | null> {
    if (this.availableAssets.length === 0 || this.lastCount <= 0 || !this.lastScope) {
      return null;
    }
    return this.createSelection(this.availableAssets, this.lastCount);
  }

  clearSelection() {
    this.selectedAssets = [];
  }
}

export function isNativeIOSMedia(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
}

let mediaServiceSingleton: MediaService | null = null;

export function getMediaService(): MediaService {
  if (!mediaServiceSingleton) {
    mediaServiceSingleton = isNativeIOSMedia()
      ? new NativeIosMediaService()
      : new WebMediaService();
  }
  return mediaServiceSingleton;
}
