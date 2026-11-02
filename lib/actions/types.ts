export type FieldErrors = Record<string, string | undefined>;

export type ClientFormState = {
  status: "idle" | "error";
  message: string;
  fieldErrors: FieldErrors;
};

export const INITIAL_CLIENT_FORM_STATE: ClientFormState = {
  status: "idle",
  message: "",
  fieldErrors: {},
};

export type LoginFormState = {
  error: string;
};

export const INITIAL_LOGIN_FORM_STATE: LoginFormState = {
  error: "",
};

export type MutationResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

export type SignedUrlResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export type RegisterDocumentResult =
  | { ok: true; documentId: string }
  | { ok: false; error: string };

export type DocumentUploadPayload = {
  clientId: string;
  docType: string;
  fileName: string;
  path: string;
  mimeType: string;
  size: number;
};
