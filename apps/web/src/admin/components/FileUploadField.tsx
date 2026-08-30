import { useRef, useState } from 'react';
import { Button } from '@/components/Button';
import { useToast } from '@/components/toast/ToastContext';
import { uploadAsset, type AssetKind } from '@/lib/adminApi';
import { ApiError } from '@/lib/api';

/**
 * Uploads one asset and reports back the stored path.
 *
 * The accept attribute and the size check here exist only to avoid sending a
 * file that will obviously be rejected. The server sniffs the actual bytes,
 * enforces its own cap and generates the storage path — the filename chosen
 * here is never used for anything but display (C5).
 */
export function FileUploadField({
  label,
  kind,
  accept,
  hint,
  currentPath,
  currentUrl,
  onUploaded,
  onCleared,
}: {
  label: string;
  kind: AssetKind;
  accept: string;
  hint?: string;
  currentPath: string | null;
  currentUrl?: string | null;
  onUploaded: (path: string, url: string | null) => void;
  onCleared: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const toast = useToast();

  const handleFile = async (file: File) => {
    setIsUploading(true);

    try {
      // The previous path travels with the request so the server can remove
      // the orphan once the new object is committed.
      const result = await uploadAsset(kind, file, currentPath);
      onUploaded(result.path, result.url);
      toast.success('File uploaded.');
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'That file could not be uploaded.');
    } finally {
      setIsUploading(false);
      // Allows re-selecting the same file after a failure.
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-text">{label}</p>

      <div className="flex flex-wrap items-center gap-3 rounded-control border border-border bg-surface p-3">
        {currentUrl ? (
          <AssetPreview url={currentUrl} kind={kind} />
        ) : (
          <p className="text-sm text-subtle">No file yet</p>
        )}

        <div className="ml-auto flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
          >
            {isUploading ? 'Uploading…' : currentPath ? 'Replace' : 'Upload'}
          </Button>

          {currentPath && (
            <Button variant="ghost" size="sm" disabled={isUploading} onClick={onCleared}>
              Remove
            </Button>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
      </div>

      {hint && <p className="text-xs text-subtle">{hint}</p>}
    </div>
  );
}

function AssetPreview({ url, kind }: { url: string; kind: AssetKind }) {
  if (kind === 'resume' || url.endsWith('.pdf')) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer noopener"
        className="text-sm text-accent underline-offset-4 hover:underline"
      >
        View current file
      </a>
    );
  }

  return <img src={url} alt="" className="h-14 w-20 rounded border border-border object-cover" />;
}
