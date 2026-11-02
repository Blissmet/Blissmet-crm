"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth";
import { MAX_PHOTO_BYTES, PHOTO_MIME_TYPES } from "@/lib/constants";
import { STORAGE_BUCKET } from "@/lib/supabase/env";
import { getStoredObjectMetadata } from "@/lib/storage/server";
import { isValidPhotoPath } from "@/lib/storage/paths";
import { isUuid } from "@/lib/utils";
import { validateClientForm } from "@/lib/validation/clients";
import type { ClientFormState, MutationResult } from "./types";

const SAVE_ERROR =
  "We couldn't save this client. Please try again or contact support.";

function isDuplicateClientIdError(error: {
  code?: string;
  message?: string;
  details?: string;
}) {
  const searchable = `${error.message ?? ""} ${error.details ?? ""}`.toLowerCase();
  return (
    error.code === "23505" &&
    (searchable.includes("client_id") || searchable.includes("clients"))
  );
}

async function validateUploadedPhoto(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  path: string | null
) {
  if (!path) return { ok: true as const };

  if (!isValidPhotoPath(path)) {
    return {
      ok: false as const,
      error: "The profile photo reference is invalid. Please upload it again.",
    };
  }

  const metadata = await getStoredObjectMetadata(supabase, path);
  if (!metadata) {
    return {
      ok: false as const,
      error: "The uploaded profile photo could not be found. Please upload it again.",
    };
  }

  if (metadata.size <= 0 || metadata.size > MAX_PHOTO_BYTES) {
    return {
      ok: false as const,
      error: "Profile photos must be smaller than 5 MB.",
    };
  }

  if (
    metadata.mimeType &&
    !(PHOTO_MIME_TYPES as readonly string[]).includes(metadata.mimeType)
  ) {
    return {
      ok: false as const,
      error: "Profile photos must be a JPG, PNG, or WebP image.",
    };
  }

  return { ok: true as const };
}

export async function createClientRecordAction(
  _previousState: ClientFormState,
  formData: FormData
): Promise<ClientFormState> {
  const { supabase } = await requireAdmin();

  const validation = validateClientForm(formData);

  if (!validation.ok) {
    return {
      status: "error",
      message: "Please correct the highlighted fields and try again.",
      fieldErrors: validation.fieldErrors,
    };
  }

  const data = validation.data;

  const photoCheck = await validateUploadedPhoto(supabase, data.photo_url);
  if (!photoCheck.ok) {
    return {
      status: "error",
      message: photoCheck.error,
      fieldErrors: { photo_url: photoCheck.error },
    };
  }

  const { data: duplicate, error: duplicateError } = await supabase
    .from("clients")
    .select("id")
    .eq("client_id", data.client_id)
    .maybeSingle();

  if (duplicateError) {
    console.error("Client ID uniqueness check failed:", duplicateError.message);
    return {
      status: "error",
      message: SAVE_ERROR,
      fieldErrors: {},
    };
  }

  if (duplicate) {
    return {
      status: "error",
      message: "A client with this Client ID already exists.",
      fieldErrors: {
        client_id: "This Client ID is already in use. Choose a unique ID.",
      },
    };
  }

  const { data: created, error } = await supabase
    .from("clients")
    .insert(data)
    .select("id")
    .single();

  if (error || !created) {
    console.error("Unable to create client:", error?.message);

    if (error && isDuplicateClientIdError(error)) {
      return {
        status: "error",
        message: "A client with this Client ID already exists.",
        fieldErrors: {
          client_id: "This Client ID is already in use. Choose a unique ID.",
        },
      };
    }

    return { status: "error", message: SAVE_ERROR, fieldErrors: {} };
  }

  revalidatePath("/dashboard");
  revalidatePath("/clients");
  revalidatePath(`/clients/${created.id}`);

  redirect(`/clients/${created.id}?notice=created`);
}

export async function updateClientRecordAction(
  _previousState: ClientFormState,
  formData: FormData
): Promise<ClientFormState> {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();

  if (!isUuid(id)) {
    return {
      status: "error",
      message: "This client record is invalid.",
      fieldErrors: {},
    };
  }

  const validation = validateClientForm(formData);
  if (!validation.ok) {
    return {
      status: "error",
      message: "Please correct the highlighted fields and try again.",
      fieldErrors: validation.fieldErrors,
    };
  }

  const data = validation.data;

  const { data: existing, error: existingError } = await supabase
    .from("clients")
    .select("id, photo_url")
    .eq("id", id)
    .maybeSingle();

  if (existingError) {
    console.error("Unable to load client before update:", existingError.message);
    return { status: "error", message: SAVE_ERROR, fieldErrors: {} };
  }

  if (!existing) {
    return {
      status: "error",
      message: "This client no longer exists.",
      fieldErrors: {},
    };
  }

  const photoCheck = await validateUploadedPhoto(supabase, data.photo_url);
  if (!photoCheck.ok) {
    return {
      status: "error",
      message: photoCheck.error,
      fieldErrors: { photo_url: photoCheck.error },
    };
  }

  const { data: duplicate, error: duplicateError } = await supabase
    .from("clients")
    .select("id")
    .eq("client_id", data.client_id)
    .neq("id", id)
    .maybeSingle();

  if (duplicateError) {
    console.error("Client ID uniqueness check failed:", duplicateError.message);
    return { status: "error", message: SAVE_ERROR, fieldErrors: {} };
  }

  if (duplicate) {
    return {
      status: "error",
      message: "A client with this Client ID already exists.",
      fieldErrors: {
        client_id: "This Client ID is already in use. Choose a unique ID.",
      },
    };
  }

  const { data: updated, error } = await supabase
    .from("clients")
    .update(data)
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error || !updated) {
    console.error("Unable to update client:", error?.message);

    if (error && isDuplicateClientIdError(error)) {
      return {
        status: "error",
        message: "A client with this Client ID already exists.",
        fieldErrors: {
          client_id: "This Client ID is already in use. Choose a unique ID.",
        },
      };
    }

    return { status: "error", message: SAVE_ERROR, fieldErrors: {} };
  }

  if (existing.photo_url && existing.photo_url !== data.photo_url) {
    const { error: removeError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([existing.photo_url]);

    if (removeError) {
      console.error(
        "Client saved, but the previous profile photo could not be removed:",
        removeError.message
      );
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);

  redirect(`/clients/${id}?notice=updated`);
}

export async function deleteClientAction(
  clientId: string
): Promise<MutationResult> {
  if (!isUuid(clientId)) {
    return { ok: false, error: "This client record is invalid." };
  }

  const { supabase } = await requireAdmin();

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, photo_url")
    .eq("id", clientId)
    .maybeSingle();

  if (clientError) {
    console.error("Unable to load client before deletion:", clientError.message);
    return { ok: false, error: "We couldn't delete this client. Try again." };
  }

  if (!client) {
    return { ok: false, error: "This client no longer exists." };
  }

  const { data: clientDocuments, error: documentsError } = await supabase
    .from("documents")
    .select("file_url")
    .eq("client_id", clientId);

  if (documentsError) {
    console.error(
      "Unable to load client documents before deletion:",
      documentsError.message
    );
    return { ok: false, error: "We couldn't delete this client. Try again." };
  }

  const storagePaths = [
    ...(client.photo_url ? [client.photo_url] : []),
    ...(clientDocuments ?? []).map((document) => document.file_url),
  ];

  if (storagePaths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove(storagePaths);

    if (storageError) {
      console.error(
        "Unable to remove client files during deletion:",
        storageError.message
      );
      return {
        ok: false,
        error:
          "Some client files could not be removed. Please try again before deleting the record.",
      };
    }
  }

  const { error: deleteError } = await supabase
    .from("clients")
    .delete()
    .eq("id", clientId);

  if (deleteError) {
    console.error("Unable to delete client:", deleteError.message);
    return { ok: false, error: "We couldn't delete this client. Try again." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);

  return { ok: true, message: "Client deleted successfully." };
}
