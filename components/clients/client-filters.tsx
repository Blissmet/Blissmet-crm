"use client";

import { useRef, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Search, SlidersHorizontal, X } from "lucide-react";

import { CLIENT_STATUSES } from "@/lib/constants";
import type { ClientSort } from "@/lib/types";
import { Select } from "@/components/ui/select";
import { buttonStyles } from "@/components/ui/button";

type ClientFiltersProps = {
  initialQuery: string;
  initialStatus: string;
  initialSort: ClientSort;
};

const SORT_OPTIONS: Array<{ value: ClientSort; label: string }> = [
  { value: "newest", label: "Recently added" },
  { value: "oldest", label: "Oldest first" },
  { value: "name_asc", label: "Name A–Z" },
  { value: "name_desc", label: "Name Z–A" },
];

export function ClientFilters({
  initialQuery,
  initialStatus,
  initialSort,
}: ClientFiltersProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const hasFilters = Boolean(initialQuery || initialStatus || initialSort !== "newest");

  function submitSearch() {
    const form = formRef.current;
    if (!form) return;

    const formData = new FormData(form);
    const query = String(formData.get("q") ?? "").trim();
    const status = String(formData.get("status") ?? "");
    const sort = String(formData.get("sort") ?? "newest");

    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (status) params.set("status", status);
    if (sort && sort !== "newest") params.set("sort", sort);

    const queryString = params.toString();
    startTransition(() => {
      router.push(queryString ? `/clients?${queryString}` : "/clients");
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitSearch();
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      role="search"
      className="flex flex-col gap-2.5 p-3.5 sm:p-4 lg:flex-row lg:items-center"
    >
      <div className="relative min-w-0 flex-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
          aria-hidden="true"
        />
        <input
          type="search"
          name="q"
          defaultValue={initialQuery}
          placeholder="Search by name, Client ID, email, or phone..."
          aria-label="Search clients"
          className="h-10 w-full rounded-lg border border-ink-200 bg-surface pl-9 pr-3 text-sm text-ink-900 shadow-sm outline-none transition placeholder:text-ink-400 hover:border-ink-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
        />
      </div>

      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 lg:flex-none">
          <SlidersHorizontal
            className="hidden h-4 w-4 shrink-0 text-ink-400 sm:block"
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1 sm:w-[132px] sm:flex-none">
            <Select
              name="status"
              defaultValue={initialStatus}
              aria-label="Filter by status"
              onChange={() => formRef.current?.requestSubmit()}
              className="h-10 bg-surface"
            >
              <option value="">All statuses</option>
              {CLIENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="min-w-0 flex-1 sm:w-[156px] sm:flex-none">
          <Select
            name="sort"
            defaultValue={initialSort}
            aria-label="Sort clients"
            onChange={() => formRef.current?.requestSubmit()}
            className="h-10 bg-surface"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className={buttonStyles({
            variant: "primary",
            size: "md",
            className: "shrink-0 px-3.5",
          })}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Search className="h-4 w-4" aria-hidden="true" />
          )}
          <span className="hidden sm:inline">Search</span>
        </button>

        {hasFilters ? (
          <Link
            href="/clients"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label="Clear filters"
            title="Clear filters"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    </form>
  );
}
