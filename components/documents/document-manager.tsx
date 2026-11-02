"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  Eye,
  FileText,
  FolderOpen,
  Loader2,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";

import {
  deleteDocumentAction,
  getDocumentUrlAction,
  registerDocumentAction,
} from "@/lib/actions/documents";
import {
  DOCUMENT_MIME_TYPES,
  DOCUMENT_TYPES,
  FILE_ACCEPT,
  MAX_DOCUMENT_BYTES,
} from "@/lib/constants";
import {
  DOCUMENT_EXTENSIONS,
  getExtension,
  isMimeTypeConsistentWithExtension,
  makeDocumentPath,
} from "@/lib/storage/paths";
import { removePrivateFile, uploadPrivateFile } from "@/lib/storage/upload";
import { cn, formatBytes, formatDateTime } from "@/lib/utils";
import { DocumentTypeBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import type { DocumentRow } from "@/types/database";

type DocumentManagerProps = {
  clientId: string;
  clientName: string;
  documents: DocumentRow[];
};

type UploadStage = "uploading" | "saving" | null;
type BusyAction = { id: string; action: "open" | "download" } | null;

export function DocumentManager({
  clientId,
  clientName,
  documents,
}: DocumentManagerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const [docType, setDocType] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [stage, setStage] = useState<UploadStage>(null);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [busyAction, setBusyAction] = useState<BusyAction>(null);
  const [documentToDelete, setDocumentToDelete] = useState<DocumentRow | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    function scrollToDocuments() {
      if (window.location.hash !== "#documents") return;

      const section = document.getElementById("documents");
      if (!section) return;

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      section.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    }

    scrollToDocuments();
    window.addEventListener("hashchange", scrollToDocuments);

    return () => window.removeEventListener("hashchange", scrollToDocuments);
  }, []);

  function selectFile(nextFile: File | null) {
    setUploadError("");
    if (!nextFile) {
      setFile(null);
      return;
    }

    if (!(DOCUMENT_MIME_TYPES as readonly string[]).includes(nextFile.type)) {
      setFile(null);
      setUploadError(
        "Choose a PDF, JPG, PNG, WebP, DOC, or DOCX file."
      );
      return;
    }

    if (
      !(DOCUMENT_EXTENSIONS as readonly string[]).includes(
        getExtension(nextFile.name)
      ) ||
      !isMimeTypeConsistentWithExtension(nextFile.name, nextFile.type)
    ) {
      setFile(null);
      setUploadError("The file extension does not match the file type.");
      return;
    }

    if (nextFile.size <= 0) {
      setFile(null);
      setUploadError("The selected file is empty.");
      return;
    }

    if (nextFile.size > MAX_DOCUMENT_BYTES) {
      setFile(null);
      setUploadError(
        `Documents must be smaller than ${formatBytes(MAX_DOCUMENT_BYTES)}.`
      );
      return;
    }

    if (nextFile.name.length > 255) {
      setFile(null);
      setUploadError("The file name must be 255 characters or fewer.");
      return;
    }

    setFile(nextFile);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    selectFile(event.target.files?.[0] ?? null);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    if (stage) return;
    selectFile(event.dataTransfer.files?.[0] ?? null);
  }

  function resetUpload() {
    setFile(null);
    setDocType("");
    setProgress(0);
    setUploadError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleUpload() {
    if (!file) {
      setUploadError("Select a file to upload.");
      return;
    }
    if (!docType) {
      setUploadError("Select a document category.");
      return;
    }

    setUploadError("");
    setStage("uploading");
    setProgress(0);

    const path = makeDocumentPath(clientId, file.name, file.type);
    let uploaded = false;
    let registered = false;

    try {
      await uploadPrivateFile({
        file,
        path,
        onProgress: setProgress,
      });
      uploaded = true;
      setStage("saving");

      const result = await registerDocumentAction({
        clientId,
        docType,
        fileName: file.name,
        path,
        mimeType: file.type,
        size: file.size,
      });

      if (!result.ok) {
        throw new Error(result.error);
      }

      registered = true;
      toast("Document uploaded", {
        description: `${file.name} was added to ${clientName}'s profile.`,
        variant: "success",
      });
      resetUpload();
      router.refresh();
    } catch (error) {
      if (uploaded && !registered) {
        await removePrivateFile(path);
      }

      const message =
        error instanceof Error
          ? error.message
          : "The document could not be uploaded.";
      setUploadError(message);
      toast("Upload failed", {
        description: message,
        variant: "error",
      });
    } finally {
      setStage(null);
      setProgress(0);
    }
  }

  async function handleDocumentAction(
    document: DocumentRow,
    download: boolean
  ) {
    const action = download ? "download" : "open";
    setBusyAction({ id: document.id, action });

    let popup: Window | null = null;
    if (!download) {
      popup = window.open("about:blank", "_blank");
      if (popup) popup.opener = null;
    }

    try {
      const result = await getDocumentUrlAction(document.id, download);

      if (!result.ok) {
        throw new Error(result.error);
      }

      if (download) {
        const link = window.document.createElement("a");
        link.href = result.url;
        link.download = document.file_name;
        link.rel = "noopener noreferrer";
        window.document.body.appendChild(link);
        link.click();
        link.remove();
      } else if (popup) {
        popup.location.href = result.url;
      } else {
        window.open(result.url, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      popup?.close();
      toast("Unable to open document", {
        description:
          error instanceof Error
            ? error.message
            : "The document could not be opened.",
        variant: "error",
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function handleDeleteDocument() {
    if (!documentToDelete) return;

    setDeleting(true);
    const result = await deleteDocumentAction(documentToDelete.id);
    setDeleting(false);

    if (!result.ok) {
      toast("Unable to delete document", {
        description: result.error,
        variant: "error",
      });
      return;
    }

    setDocumentToDelete(null);
    toast("Document deleted", {
      description: "The file has been removed from secure storage.",
      variant: "success",
    });
    router.refresh();
  }

  return (
    <section
      id="documents"
      aria-labelledby="documents-heading"
      className="scroll-mt-24"
    >
      <div className="overflow-hidden rounded-xl border border-ink-200 bg-surface shadow-card">
        <div className="flex flex-col justify-between gap-2 border-b border-ink-100 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
          <div>
            <h2
              id="documents-heading"
              className="text-[15px] font-semibold tracking-[-0.01em] text-ink-900"
            >
              Documents
            </h2>
            <p className="mt-0.5 text-[12px] leading-5 text-ink-500">
              Private files are stored securely and accessed with temporary
              signed links.
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-ink-200 bg-ink-50 px-2.5 py-1 text-[11px] font-medium text-ink-500">
            <FolderOpen className="h-3.5 w-3.5" aria-hidden="true" />
            {documents.length} file{documents.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="grid gap-0 lg:grid-cols-[340px_minmax(0,1fr)]">
          <div className="border-b border-ink-100 bg-ink-50/40 p-5 lg:border-b-0 lg:border-r lg:p-6">
            <h3 className="text-[13px] font-semibold text-ink-800">
              Upload a document
            </h3>
            <p className="mt-0.5 text-[11px] leading-5 text-ink-500">
              PDF, image, or Word document up to{" "}
              {formatBytes(MAX_DOCUMENT_BYTES)}.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label
                  htmlFor="document-category"
                  className="mb-1.5 block text-[11px] font-medium text-ink-600"
                >
                  Category <span className="text-red-500">*</span>
                </label>
                <Select
                  id="document-category"
                  value={docType}
                  onChange={(event) => setDocType(event.target.value)}
                  disabled={Boolean(stage)}
                  className="h-9 bg-surface text-[12px]"
                >
                  <option value="">Select category</option>
                  {DOCUMENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </Select>
              </div>

              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  if (!stage) setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                className={cn(
                  "relative rounded-xl border border-dashed p-4 text-center transition focus-within:ring-2 focus-within:ring-brand-500 focus-within:ring-offset-2",
                  dragActive
                    ? "border-brand-400 bg-brand-50"
                    : "border-ink-200 bg-surface hover:border-ink-300",
                  stage && "opacity-70"
                )}
              >
                <input
                  ref={inputRef}
                  id="document-file"
                  type="file"
                  accept={FILE_ACCEPT}
                  onChange={handleFileChange}
                  disabled={Boolean(stage)}
                  aria-label="Choose a document file"
                  className="sr-only"
                />
                {file ? (
                  <div className="text-left">
                    <div className="flex items-start gap-2.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-brand-100 bg-brand-50 text-brand-600">
                        <FileText className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-semibold text-ink-800">
                          {file.name}
                        </p>
                        <p className="mt-0.5 text-[10px] text-ink-400">
                          {formatBytes(file.size)}
                        </p>
                      </div>
                      {!stage ? (
                        <button
                          type="button"
                          onClick={() => selectFile(null)}
                          className="rounded p-1 text-ink-500 transition hover:bg-ink-100 hover:text-ink-700 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                          aria-label="Remove selected file"
                        >
                          <X className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      ) : null}
                    </div>
                    {!stage ? (
                      <label
                        htmlFor="document-file"
                        className="mt-3 inline-block cursor-pointer text-[10px] font-semibold text-brand-600 hover:text-brand-700"
                      >
                        Choose a different file
                      </label>
                    ) : null}
                  </div>
                ) : (
                  <>
                    <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-ink-200 bg-ink-50 text-ink-400">
                      <UploadCloud className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <p className="mt-2.5 text-[11px] font-medium text-ink-700">
                      Drag and drop, or{" "}
                      <label
                        htmlFor="document-file"
                        className={cn(
                          "cursor-pointer text-brand-600 hover:text-brand-700",
                          stage && "pointer-events-none"
                        )}
                      >
                        browse
                      </label>
                    </p>
                    <p className="mt-1 text-[10px] leading-4 text-ink-400">
                      PDF, JPG, PNG, WebP, DOC, DOCX
                    </p>
                  </>
                )}
              </div>

              {stage ? (
                <div className="rounded-lg border border-brand-100 bg-brand-50/60 p-3" aria-live="polite">
                  <div className="flex items-center justify-between text-[10px] font-medium text-brand-700">
                    <span className="inline-flex items-center gap-1.5">
                      <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                      {stage === "uploading"
                        ? "Uploading securely"
                        : "Saving document record"}
                    </span>
                    <span>{stage === "uploading" ? `${progress}%` : ""}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-brand-100">
                    <div
                      className={cn(
                        "h-full rounded-full bg-brand-600 transition-[width] duration-200",
                        stage === "saving" && "animate-pulse"
                      )}
                      style={{
                        width: stage === "saving" ? "100%" : `${progress}%`,
                      }}
                    />
                  </div>
                </div>
              ) : null}

              {uploadError ? (
                <p role="alert" className="text-[11px] font-medium leading-4 text-red-600 dark:text-red-400">
                  {uploadError}
                </p>
              ) : null}

              <Button
                type="button"
                onClick={handleUpload}
                loading={Boolean(stage)}
                loadingText={stage === "saving" ? "Saving..." : "Uploading..."}
                disabled={!file || !docType || Boolean(stage)}
                className="w-full"
                size="md"
              >
                <UploadCloud className="h-4 w-4" aria-hidden="true" />
                Upload document
              </Button>
            </div>
          </div>

          <div className="min-w-0">
            {documents.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No documents yet"
                description={`Uploaded files for ${clientName} will appear here with secure open, download, and delete controls.`}
              />
            ) : (
              <ul className="divide-y divide-ink-100">
                {documents.map((document) => {
                  const isOpening =
                    busyAction?.id === document.id &&
                    busyAction.action === "open";
                  const isDownloading =
                    busyAction?.id === document.id &&
                    busyAction.action === "download";

                  return (
                    <li
                      key={document.id}
                      className="flex flex-col gap-3 px-4 py-4 transition hover:bg-ink-50/40 sm:flex-row sm:items-center sm:px-5"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-ink-100 bg-ink-50 text-ink-500">
                        <FileText className="h-4 w-4" aria-hidden="true" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] font-semibold text-ink-800">
                          {document.file_name}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <DocumentTypeBadge type={document.doc_type} />
                          <span className="text-[10px] text-ink-400">
                            Uploaded {formatDateTime(document.uploaded_at)}
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-0.5 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleDocumentAction(document, false)}
                          disabled={Boolean(busyAction) || deleting}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 transition hover:bg-surface hover:text-brand-700 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-wait disabled:opacity-50"
                          aria-label={`Open ${document.file_name}`}
                          title="Open in new tab"
                        >
                          {isOpening ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDocumentAction(document, true)}
                          disabled={Boolean(busyAction) || deleting}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 transition hover:bg-surface hover:text-brand-700 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-wait disabled:opacity-50"
                          aria-label={`Download ${document.file_name}`}
                          title="Download"
                        >
                          {isDownloading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                          ) : (
                            <Download className="h-3.5 w-3.5" aria-hidden="true" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDocumentToDelete(document)}
                          disabled={Boolean(busyAction) || deleting}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 transition hover:bg-red-50 hover:text-red-600 focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-red-950/50 dark:hover:text-red-400"
                          aria-label={`Delete ${document.file_name}`}
                          title="Delete document"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(documentToDelete)}
        title="Delete this document?"
        description={
          documentToDelete
            ? `"${documentToDelete.file_name}" will be permanently removed from secure storage. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete document"
        loading={deleting}
        onConfirm={handleDeleteDocument}
        onClose={() => {
          if (!deleting) setDocumentToDelete(null);
        }}
      />
    </section>
  );
}
