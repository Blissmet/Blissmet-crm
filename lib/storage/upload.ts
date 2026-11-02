"use client";

import "client-only";

import { createClient } from "@/lib/supabase/client";
import { STORAGE_BUCKET } from "@/lib/supabase/env";
import { encodeStoragePath } from "./paths";

type UploadOptions = {
  file: File;
  path: string;
  onProgress?: (percent: number) => void;
};

type StorageErrorResponse = {
  message?: string;
  error?: string;
};

export function uploadPrivateFile({
  file,
  path,
  onProgress,
}: UploadOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      reject(new Error("Supabase storage is not configured."));
      return;
    }

    const supabase = createClient();

    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (error || !session?.access_token) {
          reject(new Error("Your session expired. Please sign in again."));
          return;
        }

        const xhr = new XMLHttpRequest();
        const uploadUrl = `${supabaseUrl}/storage/v1/object/${STORAGE_BUCKET}/${encodeStoragePath(path)}`;

        xhr.open("POST", uploadUrl, true);
        xhr.setRequestHeader("Authorization", `Bearer ${session.access_token}`);
        xhr.setRequestHeader("apikey", anonKey);
        xhr.setRequestHeader("x-upsert", "false");
        xhr.setRequestHeader("cache-control", "3600");
        xhr.setRequestHeader("Content-Type", file.type);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            onProgress?.(Math.round((event.loaded / event.total) * 100));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            onProgress?.(100);
            resolve();
            return;
          }

          let message = "The file could not be uploaded.";
          try {
            const body = JSON.parse(xhr.responseText) as StorageErrorResponse;
            message = body.message || body.error || message;
          } catch {
            // Keep the generic message for non-JSON errors.
          }
          reject(new Error(message));
        };

        xhr.onerror = () => reject(new Error("A network error interrupted the upload."));
        xhr.onabort = () => reject(new Error("The upload was cancelled."));
        xhr.send(file);
      })
      .catch(() => {
        reject(new Error("Your session expired. Please sign in again."));
      });
  });
}

export async function removePrivateFile(path: string) {
  const supabase = createClient();
  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([path]);

  if (error) {
    console.error("Unable to remove orphaned storage object:", error.message);
  }
}
