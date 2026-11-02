import Link from "next/link";
import {
  ArrowRight,
  FileText,
  FolderOpen,
  UploadCloud,
  UserPlus,
} from "lucide-react";

import { DocumentTypeBadge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { ClientWithPhoto, RecentDocument } from "@/lib/types";
import { formatDateTime, getDisplayName } from "@/lib/utils";

type SuggestedClient = Pick<
  ClientWithPhoto,
  "id" | "first_name" | "last_name"
>;

export function LatestDocuments({
  documents,
  total,
  suggestedClient,
}: {
  documents: RecentDocument[];
  total: number;
  suggestedClient: SuggestedClient | null;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
        <div>
          <CardTitle>Latest documents</CardTitle>
          <p className="mt-0.5 text-[13px] text-ink-500">
            {total === 0
              ? "No files stored securely yet."
              : `${total} file${total === 1 ? "" : "s"} stored securely.`}
          </p>
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-100 bg-ink-50 text-ink-500">
          <FolderOpen className="h-4 w-4" aria-hidden="true" />
        </span>
      </CardHeader>
      <CardContent className="p-0 sm:p-0">
        {documents.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="No documents uploaded"
            description={
              suggestedClient
                ? `Open ${getDisplayName(suggestedClient)}'s profile to upload a file.`
                : "Add a client, then upload documents from their profile."
            }
            compact
            action={
              suggestedClient ? (
                <Link
                  href={`/clients/${suggestedClient.id}#documents`}
                  className={buttonStyles({ variant: "outline", size: "sm" })}
                >
                  <UploadCloud className="h-3.5 w-3.5" aria-hidden="true" />
                  Upload document
                </Link>
              ) : (
                <Link
                  href="/clients/new"
                  className={buttonStyles({ variant: "outline", size: "sm" })}
                >
                  <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
                  Add a client
                </Link>
              )
            }
          />
        ) : (
          <ul className="divide-y divide-ink-100">
            {documents.map((document) => (
              <li key={document.id}>
                <Link
                  href={`/clients/${document.client_id}`}
                  className="flex items-start gap-3 px-5 py-3.5 transition hover:bg-ink-50/60 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500 focus-visible:outline-none sm:px-6"
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ink-100 bg-ink-50 text-ink-500">
                    <FileText className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold text-ink-800">
                      {document.file_name}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-ink-500">
                      {document.clients
                        ? getDisplayName(document.clients)
                        : "Unknown client"}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <DocumentTypeBadge type={document.doc_type} />
                      <span className="text-[10px] text-ink-500">
                        {formatDateTime(document.uploaded_at)}
                      </span>
                    </div>
                  </div>
                  <ArrowRight
                    className="mt-2.5 h-3.5 w-3.5 shrink-0 text-ink-300"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
