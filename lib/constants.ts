export const CLIENT_STATUSES = ["Active", "Inactive"] as const;

export const EMPLOYMENT_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
  "Freelance",
] as const;

export const GENDERS = [
  "Male",
  "Female",
  "Non-binary",
  "Prefer not to say",
] as const;

export const DOCUMENT_TYPES = [
  "Aadhaar Card",
  "Offer Letter",
  "Payment Proof",
  "Employment Contract",
  "Profile Photo",
  "Other Documents",
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export const DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const PHOTO_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const FILE_ACCEPT =
  ".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,application/pdf,image/jpeg,image/png,image/webp,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export const PHOTO_ACCEPT =
  ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";

export const CLIENTS_PAGE_SIZE = 10;
export const DASHBOARD_RECENT_LIMIT = 5;
export const SIGNED_PHOTO_TTL_SECONDS = 15 * 60;
export const SIGNED_DOCUMENT_TTL_SECONDS = 60;
