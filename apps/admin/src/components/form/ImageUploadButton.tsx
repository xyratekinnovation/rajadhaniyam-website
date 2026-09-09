import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { uploadsApi } from "@/services/api/uploads";

export function ImageUploadButton({ onUploaded }: { onUploaded: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setIsUploading(true);
    try {
      const { url } = await uploadsApi.upload(file);
      onUploaded(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <button
        type="button"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
        className="flex h-9 items-center gap-1.5 whitespace-nowrap rounded-md border border-[var(--admin-border)] px-3 text-xs font-medium text-[var(--admin-text)] hover:bg-[var(--admin-bg)] disabled:opacity-60"
      >
        {isUploading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Upload className="h-3.5 w-3.5" />
        )}
        {isUploading ? "Uploading..." : "Upload"}
      </button>
    </>
  );
}
