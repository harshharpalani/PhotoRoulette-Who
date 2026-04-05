let getFileBuffer: ((index: number) => Promise<ArrayBuffer>) | null = null;

export function setMediaUploadGetter(nextGetter: ((index: number) => Promise<ArrayBuffer>) | null) {
  getFileBuffer = nextGetter;
}

export function getMediaUploadGetter() {
  return getFileBuffer;
}
