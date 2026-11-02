export const PHOTO_EXTENSIONS = ["jpg", "jpeg", "png", "webp"] as const;
export const DOCUMENT_EXTENSIONS = [
  "pdf",
  "jpg",
  "jpeg",
  "png",
  "webp",
  "doc",
  "docx",
] as const;

export function getExtension(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  return extension;
}

const MIME_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
};

export function makePhotoPath(fileName: string, mimeType?: string) {
  const extension = getExtension(fileName);
  const safeExtension = (PHOTO_EXTENSIONS as readonly string[]).includes(
    extension
  )
    ? extension
    : MIME_EXTENSION[mimeType ?? ""] ?? "jpg";

  return `clients/photos/${crypto.randomUUID()}-${Date.now()}.${safeExtension}`;
}

export function makeDocumentPath(
  clientUuid: string,
  fileName: string,
  mimeType?: string
) {
  const extension = getExtension(fileName);
  const safeExtension = (DOCUMENT_EXTENSIONS as readonly string[]).includes(
    extension
  )
    ? extension
    : MIME_EXTENSION[mimeType ?? ""] ?? "pdf";

  return `clients/${clientUuid}/documents/${crypto.randomUUID()}.${safeExtension}`;
}

export function isMimeTypeConsistentWithExtension(
  fileName: string,
  mimeType: string
) {
  const extension = getExtension(fileName);
  const expected = MIME_EXTENSION[mimeType];
  if (!expected) return false;
  if (extension === expected) return true;
  if (expected === "jpg" && extension === "jpeg") return true;
  return false;
}

export function isValidPhotoPath(path: string) {
  return /^clients\/photos\/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}-\d{10,16}\.(jpg|jpeg|png|webp)$/i.test(
    path
  );
}

export function isValidDocumentPath(path: string, clientUuid: string) {
  const escapedClientId = clientUuid.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(
    `^clients/${escapedClientId}/documents/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\\.(pdf|jpg|jpeg|png|webp|doc|docx)$`,
    "i"
  ).test(path);
}

export function encodeStoragePath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}
