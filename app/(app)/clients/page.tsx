import type { Metadata } from "next";
import Link from "next/link";
import { SearchX, UserPlus, Users } from "lucide-react";

import { ClientFilters } from "@/components/clients/client-filters";
import { ClientTable } from "@/components/clients/client-table";
import { Pagination } from "@/components/clients/pagination";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { NoticeToast } from "@/components/ui/notice-toast";
import { PageHeader } from "@/components/ui/page-header";
import { requireAdmin } from "@/lib/auth";
import { CLIENTS_PAGE_SIZE } from "@/lib/constants";
import { getClients, parseClientFilters } from "@/lib/data/clients";
import { buildQueryString } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Clients",
};

export const dynamic = "force-dynamic";

type ClientsPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const params = await searchParams;
  const filters = parseClientFilters(params);
  const { supabase } = await requireAdmin();
  const result = await getClients(supabase, filters);

  const rawNotice = Array.isArray(params.notice)
    ? params.notice[0]
    : params.notice;

  const hasFilters = Boolean(
    filters.q || filters.status || filters.sort !== "newest"
  );

  const cleanPath = `/clients${buildQueryString({
    q: filters.q,
    status: filters.status,
    sort: filters.sort !== "newest" ? filters.sort : "",
    page: result.page > 1 ? result.page : "",
  })}`;

  return (
    <div className="space-y-5 animate-fade-in">
      <NoticeToast notice={rawNotice} cleanPath={cleanPath} />

      <PageHeader
        title="Clients"
        description="Manage client profiles, employment records, and sensitive documents from one secure directory."
      />

      <Card className="overflow-hidden">
        <div className="border-b border-ink-200 bg-surface">
          <ClientFilters
            key={`${filters.q}-${filters.status}-${filters.sort}`}
            initialQuery={filters.q}
            initialStatus={filters.status}
            initialSort={filters.sort}
          />
        </div>

        {result.clients.length === 0 ? (
          <EmptyState
            icon={hasFilters ? SearchX : Users}
            title={hasFilters ? "No clients match your search" : "Your client directory is empty"}
            description={
              hasFilters
                ? "Try a different name, Client ID, email, or phone number, or clear the active filters."
                : "Add your first client to start building a complete, searchable client directory."
            }
            action={
              hasFilters ? (
                <Link
                  href="/clients"
                  className={buttonStyles({ variant: "secondary", size: "sm" })}
                >
                  Clear filters
                </Link>
              ) : (
                <Link
                  href="/clients/new"
                  className={buttonStyles({ variant: "outline", size: "sm" })}
                >
                  <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
                  Add first client
                </Link>
              )
            }
          />
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-ink-100 bg-surface px-4 py-2.5 sm:px-5">
              <p className="text-[11px] font-medium text-ink-500">
                {result.total} client{result.total === 1 ? "" : "s"}
                {hasFilters ? " matched" : " in directory"}
              </p>
              {filters.status ? (
                <p className="text-[11px] text-ink-500">
                  Status: <span className="font-medium text-ink-700">{filters.status}</span>
                </p>
              ) : null}
            </div>
            <ClientTable clients={result.clients} />
            <Pagination
              page={result.page}
              pageCount={result.pageCount}
              total={result.total}
              pageSize={CLIENTS_PAGE_SIZE}
              filters={filters}
            />
          </>
        )}
      </Card>
    </div>
  );
}
