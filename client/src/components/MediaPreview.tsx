interface MediaFile {
  file: File;
  type: 'image' | 'video';
  url: string;
}

interface MediaPreviewProps {
  files: MediaFile[];
}

export default function MediaPreview({ files }: MediaPreviewProps) {
  return (
    <div className="media-preview-grid">
      {files.map((file, i) => (
        <div key={i} className="media-preview-item">
          {file.type === 'image' ? (
            <img src={file.url} alt={`Selection ${i + 1}`} />
          ) : (
            <video src={file.url} muted playsInline />
          )}
        </div>
      ))}
    </div>
  );
}
