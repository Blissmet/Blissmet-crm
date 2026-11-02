"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { Camera, Loader2, Trash2, UploadCloud } from "lucide-react";

import { MAX_PHOTO_BYTES, PHOTO_ACCEPT, PHOTO_MIME_TYPES } from "@/lib/constants";
import { makePhotoPath } from "@/lib/storage/paths";
import { uploadPrivateFile } from "@/lib/storage/upload";
import { cn, formatBytes, getInitials } from "@/lib/utils";

type PhotoUploadProps = {
  firstName: string;
  lastName: string;
  initialPath: string | null;
  initialUrl: string | null;
  onUploadingChange?: (uploading: boolean) => void;
};

export function PhotoUpload({
  firstName,
  lastName,
  initialPath,
  initialUrl,
  onUploadingChange,
}: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [path, setPath] = useState(initialPath ?? "");
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    onUploadingChange?.(uploading);
  }, [onUploadingChange, uploading]);

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError("");

    if (!(PHOTO_MIME_TYPES as readonly string[]).includes(file.type)) {
      setError("Choose a JPG, PNG, or WebP image.");
      return;
    }

    if (file.size > MAX_PHOTO_BYTES) {
      setError(`Profile photos must be smaller than ${formatBytes(MAX_PHOTO_BYTES)}.`);
      return;
    }

    const previousPath = path;
    const previousPreview = previewUrl;
    const localPreview = URL.createObjectURL(file);
    setObjectUrl(localPreview);
    setPreviewUrl(localPreview);
    setUploading(true);
    setProgress(0);

    try {
      const nextPath = makePhotoPath(file.name, file.type);
      await uploadPrivateFile({
        file,
        path: nextPath,
        onProgress: setProgress,
      });
      setPath(nextPath);
    } catch (uploadError) {
      URL.revokeObjectURL(localPreview);
      setObjectUrl(null);
      setPath(previousPath);
      setPreviewUrl(previousPreview);
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "The profile photo could not be uploaded."
      );
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  function removePhoto() {
    if (uploading) return;
    setPath("");
    setPreviewUrl(null);
    setObjectUrl(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <input type="hidden" name="photo_url" value={path} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative">
          <span
            className={cn(
              "flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-brand-50 text-xl font-semibold text-brand-700 ring-1 ring-inset ring-brand-100",
              uploading && "opacity-70"
            )}
          >
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Profile photo preview"
                className="h-full w-full object-cover"
              />
            ) : firstName || lastName ? (
              <span aria-hidden="true">{getInitials(firstName, lastName)}</span>
            ) : (
              <Camera className="h-6 w-6 text-brand-400" aria-hidden="true" />
            )}
          </span>
          {uploading ? (
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-white/70">
              <Loader2 className="h-5 w-5 animate-spin text-brand-600" aria-hidden="true" />
            </span>
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-ink-200 bg-surface px-3 text-[12px] font-semibold text-ink-700 shadow-sm transition hover:bg-ink-50 focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <UploadCloud className="h-3.5 w-3.5" aria-hidden="true" />
              {previewUrl ? "Replace photo" : "Upload photo"}
            </button>
            {previewUrl && !uploading ? (
              <button
                type="button"
                onClick={removePhoto}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-medium text-ink-500 transition hover:bg-red-50 hover:text-red-600 focus-visible:ring-2 focus-visible:ring-red-500 dark:hover:bg-red-950/50 dark:hover:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                Remove
              </button>
            ) : null}
          </div>
          <p className="mt-2 text-[11px] leading-4 text-ink-400">
            JPG, PNG, or WebP. Maximum {formatBytes(MAX_PHOTO_BYTES)}.
          </p>

          {uploading ? (
            <div className="mt-2.5 max-w-xs" aria-live="polite">
              <div className="flex items-center justify-between text-[10px] font-medium text-ink-500">
                <span>Uploading profile photo</span>
                <span>{progress}%</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-100">
                <div
                  className="h-full rounded-full bg-brand-600 transition-[width] duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : null}

          {error ? (
            <p role="alert" className="mt-2 text-[11px] font-medium text-red-600 dark:text-red-400">
              {error}
            </p>
          ) : null}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={PHOTO_ACCEPT}
        onChange={handleFileChange}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}
