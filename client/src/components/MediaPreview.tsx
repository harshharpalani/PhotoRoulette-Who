interface MediaPreviewFile {
  type: 'image' | 'video';
  name: string;
  url: string;
  previewKind: 'image' | 'video';
}

interface MediaPreviewProps {
  files: MediaPreviewFile[];
}

export default function MediaPreview({ files }: MediaPreviewProps) {
  return (
    <div className="media-preview-grid">
      {files.map((file, i) => (
        <div key={i} className="media-preview-item">
          {file.previewKind === 'image' ? (
            <img src={file.url} alt={file.name || `Selection ${i + 1}`} />
          ) : (
            <video src={file.url} muted playsInline />
          )}
        </div>
      ))}
    </div>
  );
}
