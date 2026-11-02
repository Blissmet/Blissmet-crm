"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth";
import {
  DOCUMENT_MIME_TYPES,
  DOCUMENT_TYPES,
  MAX_DOCUMENT_BYTES,
} from "@/lib/constants";
import { STORAGE_BUCKET } from "@/lib/supabase/env";
import {
  isMimeTypeConsistentWithExtension,
  isValidDocumentPath,
} from "@/lib/storage/paths";
import {
  getSignedDocumentUrl,
  getStoredObjectMetadata,
  getStoredObjectPrefix,
} from "@/lib/storage/server";
import { matchesDeclaredFileType } from "@/lib/storage/signatures";
import { isUuid } from "@/lib/utils";
import type {
  DocumentUploadPayload,
  MutationResult,
  RegisterDocumentResult,
  SignedUrlResult,
} from "./types";

function isValidFileName(value: string) {
  return (
    value.length >= 1 &&
    value.length <= 255 &&
    !/[\u0000-\u001f\u007f/\\]/.test(value)
  );
}

function sanitizeDownloadFileName(fileName: string) {
  const cleaned = fileName
    .replace(/[\u0000-\u001f\u007f"\\/]/g, "_")
    .trim();

  return cleaned.length > 0 ? cleaned.slice(0, 255) : "document";
}

export async function registerDocumentAction(
  payload: DocumentUploadPayload
): Promise<RegisterDocumentResult> {
  const { supabase } = await requireAdmin();

  if (!isUuid(payload.clientId)) {
    return { ok: false, error: "This client record is invalid." };
  }

  if (!(DOCUMENT_TYPES as readonly string[]).includes(payload.docType)) {
    return { ok: false, error: "Select a valid document category." };
  }

  const fileName = payload.fileName.trim();
  if (!isValidFileName(fileName)) {
    return { ok: false, error: "The document name is invalid." };
  }

  if (!isValidDocumentPath(payload.path, payload.clientId)) {
    return { ok: false, error: "The uploaded file path is invalid." };
  }

  if (
    !Number.isFinite(payload.size) ||
    payload.size <= 0 ||
    payload.size > MAX_DOCUMENT_BYTES
  ) {
    return { ok: false, error: "Documents must be smaller than 10 MB." };
  }

  if (!(DOCUMENT_MIME_TYPES as readonly string[]).includes(payload.mimeType)) {
    return { ok: false, error: "This file type is not supported." };
  }

  if (!isMimeTypeConsistentWithExtension(fileName, payload.mimeType)) {
    return {
      ok: false,
      error: "The file extension does not match the file type.",
    };
  }

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id")
    .eq("id", payload.clientId)
    .maybeSingle();

  if (clientError) {
    console.error("Unable to verify document client:", clientError.message);
    return { ok: false, error: "We couldn't save this document. Try again." };
  }

  if (!client) {
    return { ok: false, error: "This client no longer exists." };
  }

  const metadata = await getStoredObjectMetadata(supabase, payload.path);
  if (!metadata) {
    return {
      ok: false,
      error: "The uploaded file could not be verified. Please upload it again.",
    };
  }

  if (metadata.size <= 0 || metadata.size > MAX_DOCUMENT_BYTES) {
    return { ok: false, error: "Documents must be smaller than 10 MB." };
  }

  if (
    metadata.mimeType &&
    !(DOCUMENT_MIME_TYPES as readonly string[]).includes(metadata.mimeType)
  ) {
    return { ok: false, error: "This file type is not supported." };
  }

  if (metadata.mimeType && metadata.mimeType !== payload.mimeType) {
    return {
      ok: false,
      error: "The stored file type does not match the upload.",
    };
  }

  if (!metadata.etag) {
    return {
      ok: false,
      error: "The uploaded file could not be verified. Please upload it again.",
    };
  }

  const prefix = await getStoredObjectPrefix(supabase, payload.path);

  if (!prefix || !matchesDeclaredFileType(prefix, payload.mimeType)) {
    return {
      ok: false,
      error: "The uploaded file content does not match its type.",
    };
  }

  const { data: document, error: insertError } = await supabase
    .from("documents")
    .insert({
      client_id: payload.clientId,
      doc_type: payload.docType,
      file_name: fileName,
      file_url: payload.path,
      content_etag: metadata.etag,
      content_size: metadata.size,
    })
    .select("id")
    .single();

  if (insertError || !document) {
    console.error("Unable to register document:", insertError?.message);
    return { ok: false, error: "We couldn't save this document. Try again." };
  }

  revalidatePath(`/clients/${payload.clientId}`);
  revalidatePath("/dashboard");

  return { ok: true, documentId: document.id };
}

export async function getDocumentUrlAction(
  documentId: string,
  download = false
): Promise<SignedUrlResult> {
  if (!isUuid(documentId)) {
    return { ok: false, error: "This document is invalid." };
  }

  const { supabase } = await requireAdmin();

  const { data: document, error } = await supabase
    .from("documents")
    .select("id, file_url, file_name, content_etag, content_size")
    .eq("id", documentId)
    .maybeSingle();

  if (error) {
    console.error("Unable to load document for signing:", error.message);
    return { ok: false, error: "We couldn't open this document. Try again." };
  }

  if (!document) {
    return { ok: false, error: "This document no longer exists." };
  }

  const metadata = await getStoredObjectMetadata(supabase, document.file_url);

  if (!metadata) {
    return { ok: false, error: "This document file could not be found." };
  }

  const etagMismatch =
    document.content_etag !== null && metadata.etag !== document.content_etag;
  const sizeMismatch =
    document.content_size !== null && metadata.size !== document.content_size;

  if (etagMismatch || sizeMismatch) {
    console.error("Document integrity check failed:", {
      documentId,
      expectedEtag: document.content_etag,
      actualEtag: metadata.etag,
      expectedSize: document.content_size,
      actualSize: metadata.size,
    });
    return {
      ok: false,
      error: "This document failed its integrity check and was not opened.",
    };
  }

  const signedUrl = await getSignedDocumentUrl(
    supabase,
    document.file_url,
    download ? sanitizeDownloadFileName(document.file_name) : undefined
  );

  if (!signedUrl) {
    return { ok: false, error: "We couldn't open this document. Try again." };
  }

  return { ok: true, url: signedUrl };
}

export async function deleteDocumentAction(
  documentId: string
): Promise<MutationResult> {
  if (!isUuid(documentId)) {
    return { ok: false, error: "This document is invalid." };
  }

  const { supabase } = await requireAdmin();

  const { data: document, error: documentError } = await supabase
    .from("documents")
    .select("id, client_id, file_url")
    .eq("id", documentId)
    .maybeSingle();

  if (documentError) {
    console.error("Unable to load document for deletion:", documentError.message);
    return { ok: false, error: "We couldn't delete this document. Try again." };
  }

  if (!document) {
    return { ok: false, error: "This document no longer exists." };
  }

  const { error: storageError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([document.file_url]);

  if (storageError) {
    console.error("Unable to delete document file:", storageError.message);
    return { ok: false, error: "The stored file could not be deleted. Try again." };
  }

  const { error: deleteError } = await supabase
    .from("documents")
    .delete()
    .eq("id", documentId);

  if (deleteError) {
    console.error("Unable to delete document record:", deleteError.message);
    return {
      ok: false,
      error: "The document file was removed, but its record could not be updated.",
    };
  }

  revalidatePath(`/clients/${document.client_id}`);
  revalidatePath("/dashboard");

  return { ok: true, message: "Document deleted successfully." };
}
