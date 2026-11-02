import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { ClientListFilters } from "@/lib/types";
import { buildQueryString, cn } from "@/lib/utils";

type PaginationProps = {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  filters: ClientListFilters;
};

function pageHref(filters: ClientListFilters, page: number) {
  return `/clients${buildQueryString({
    q: filters.q,
    status: filters.status,
    sort: filters.sort !== "newest" ? filters.sort : "",
    page: page > 1 ? page : "",
  })}`;
}

function getVisiblePages(page: number, pageCount: number) {
  if (pageCount <= 5) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  if (page <= 3) return [1, 2, 3, 4, pageCount];
  if (page >= pageCount - 2) {
    return [1, pageCount - 3, pageCount - 2, pageCount - 1, pageCount];
  }
  return [1, page - 1, page, page + 1, pageCount];
}

export function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  filters,
}: PaginationProps) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const visiblePages = getVisiblePages(page, pageCount);

  return (
    <div className="flex flex-col gap-3 border-t border-ink-200 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <p className="text-[11px] text-ink-500">
        Showing <span className="font-semibold text-ink-700">{from}</span>–
        <span className="font-semibold text-ink-700">{to}</span> of{" "}
        <span className="font-semibold text-ink-700">{total}</span> client
        {total === 1 ? "" : "s"}
      </p>

      <nav
        className="flex items-center gap-1"
        aria-label="Client list pagination"
      >
        {page > 1 ? (
          <Link
            href={pageHref(filters, page - 1)}
            className="flex h-8 items-center gap-1 rounded-lg border border-ink-200 bg-surface px-2.5 text-[11px] font-medium text-ink-600 shadow-sm transition hover:bg-ink-50 focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Previous</span>
          </Link>
        ) : (
          <span
            className="flex h-8 items-center gap-1 rounded-lg border border-ink-100 px-2.5 text-[11px] font-medium text-ink-300"
            aria-disabled="true"
          >
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Previous</span>
          </span>
        )}

        <div className="hidden items-center gap-1 sm:flex">
          {visiblePages.map((visiblePage, index) => {
            const previousPage = visiblePages[index - 1];
            const showEllipsis =
              previousPage !== undefined && visiblePage - previousPage > 1;

            return (
              <span key={visiblePage} className="flex items-center gap-1">
                {showEllipsis ? (
                  <span className="px-1 text-[11px] text-ink-300">…</span>
                ) : null}
                <Link
                  href={pageHref(filters, visiblePage)}
                  aria-current={visiblePage === page ? "page" : undefined}
                  className={cn(
                    "flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-[11px] font-semibold transition focus-visible:ring-2 focus-visible:ring-brand-500",
                    visiblePage === page
                      ? "bg-brand-600 text-white shadow-sm"
                      : "text-ink-500 hover:bg-ink-100 hover:text-ink-800"
                  )}
                >
                  {visiblePage}
                </Link>
              </span>
            );
          })}
        </div>

        <span className="px-2 text-[11px] font-medium text-ink-500 sm:hidden">
          Page {page} of {pageCount}
        </span>

        {page < pageCount ? (
          <Link
            href={pageHref(filters, page + 1)}
            className="flex h-8 items-center gap-1 rounded-lg border border-ink-200 bg-surface px-2.5 text-[11px] font-medium text-ink-600 shadow-sm transition hover:bg-ink-50 focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label="Next page"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        ) : (
          <span
            className="flex h-8 items-center gap-1 rounded-lg border border-ink-100 px-2.5 text-[11px] font-medium text-ink-300"
            aria-disabled="true"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        )}
      </nav>
    </div>
  );
}
