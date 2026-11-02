import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  SIGNED_DOCUMENT_TTL_SECONDS,
  SIGNED_PHOTO_TTL_SECONDS,
} from "@/lib/constants";
import { STORAGE_BUCKET } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

type TypedSupabaseClient = SupabaseClient<Database>;

export type StoredObjectMetadata = {
  size: number;
  mimeType: string | null;
  etag: string | null;
};

export async function getStoredObjectMetadata(
  supabase: TypedSupabaseClient,
  path: string
): Promise<StoredObjectMetadata | null> {
  const separatorIndex = path.lastIndexOf("/");
  if (separatorIndex <= 0) return null;

  const folder = path.slice(0, separatorIndex);
  const fileName = path.slice(separatorIndex + 1);

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .list(folder, { search: fileName, limit: 100 });

  if (error) {
    console.error("Unable to inspect stored object:", error.message);
    return null;
  }

  const object = data?.find((entry) => entry.name === fileName);
  if (!object) return null;

  const metadata = object.metadata as
    | {
        size?: number;
        mimetype?: string;
        contentType?: string;
        eTag?: string;
      }
    | null
    | undefined;

  return {
    size: Number(metadata?.size ?? 0),
    mimeType: metadata?.mimetype ?? metadata?.contentType ?? null,
    etag: metadata?.eTag ? metadata.eTag.replace(/^"|"$/g, "") : null,
  };
}

/**
 * Reads the leading bytes of a private object without downloading the whole
 * file. Used to confirm the bytes really match the declared content type.
 */
export async function getStoredObjectPrefix(
  supabase: TypedSupabaseClient,
  path: string,
  length = 32
): Promise<Uint8Array | null> {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(path, 60);

  if (error || !data?.signedUrl) {
    console.error("Unable to sign object for type check:", error?.message);
    return null;
  }

  try {
    const response = await fetch(data.signedUrl, {
      headers: { Range: `bytes=0-${Math.max(length - 1, 0)}` },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Unable to read object prefix:", response.status);
      return null;
    }

    const buffer = new Uint8Array(await response.arrayBuffer());
    return buffer.slice(0, length);
  } catch (fetchError) {
    console.error("Unable to read object prefix:", fetchError);
    return null;
  }
}

export async function getSignedPhotoUrl(
  supabase: TypedSupabaseClient,
  path: string | null
) {
  if (!path) return null;

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(path, SIGNED_PHOTO_TTL_SECONDS);

  if (error) {
    console.error("Unable to sign profile photo URL:", error.message);
    return null;
  }

  return data.signedUrl;
}

export async function getSignedDocumentUrl(
  supabase: TypedSupabaseClient,
  path: string,
  downloadFileName?: string
) {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(
      path,
      SIGNED_DOCUMENT_TTL_SECONDS,
      downloadFileName ? { download: downloadFileName } : undefined
    );

  if (error) {
    console.error("Unable to sign document URL:", error.message);
    return null;
  }

  return data.signedUrl;
}

export async function attachSignedPhotos<
  T extends { photo_url: string | null },
>(supabase: TypedSupabaseClient, rows: T[]) {
  const uniquePaths = Array.from(
    new Set(rows.map((row) => row.photo_url).filter(Boolean))
  ) as string[];

  const signedEntries = await Promise.all(
    uniquePaths.map(async (path) => [path, await getSignedPhotoUrl(supabase, path)] as const)
  );

  const signedMap = new Map(signedEntries);

  return rows.map((row) => ({
    ...row,
    photoSignedUrl: row.photo_url ? signedMap.get(row.photo_url) ?? null : null,
  }));
}
