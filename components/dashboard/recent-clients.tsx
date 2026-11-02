import Link from "next/link";
import { ArrowRight, Clock3, UserPlus, Users } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { ClientStatusBadge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { ClientWithPhoto } from "@/lib/types";
import {
  formatDateTime,
  formatRelativeTime,
  getDisplayName,
} from "@/lib/utils";

export function RecentClients({ clients }: { clients: ClientWithPhoto[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
        <div>
          <CardTitle>Recent clients</CardTitle>
          <p className="mt-0.5 text-[13px] text-ink-500">
            Newest records and their most recent updates.
          </p>
        </div>
        <Link
          href="/clients"
          aria-label="View all clients"
          className="inline-flex shrink-0 items-center gap-1 rounded text-[12px] font-semibold text-brand-600 transition hover:text-brand-700 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        >
          View all
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </CardHeader>
      <CardContent className="p-0 sm:p-0">
        {clients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No clients yet"
            description="Add your first client to start building your client directory."
            compact
            action={
              <Link
                href="/clients/new"
                className={buttonStyles({ variant: "outline", size: "sm" })}
              >
                <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
                Add your first client
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-ink-100">
            {clients.map((client) => {
              const updated = formatRelativeTime(client.updated_at);

              return (
                <li key={client.id}>
                  <Link
                    href={`/clients/${client.id}`}
                    className="group flex items-center gap-3 px-5 py-4 transition hover:bg-ink-50/60 focus-visible:bg-ink-50/60 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500 focus-visible:outline-none sm:px-6"
                  >
                    <Avatar
                      src={client.photoSignedUrl}
                      firstName={client.first_name}
                      lastName={client.last_name}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-[14px] font-semibold text-ink-900">
                          {getDisplayName(client)}
                        </p>
                        <ClientStatusBadge status={client.status} />
                      </div>
                      <p className="mt-1 truncate text-[12px] text-ink-500">
                        {client.designation}
                        <span className="mx-1 text-ink-300" aria-hidden="true">
                          ·
                        </span>
                        {client.department}
                      </p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-ink-500 sm:hidden">
                        <span className="font-mono">{client.client_id}</span>
                        <span aria-hidden="true">·</span>
                        <time
                          dateTime={client.updated_at}
                          title={formatDateTime(client.updated_at)}
                        >
                          Updated {updated}
                        </time>
                      </p>
                    </div>
                    <div className="hidden shrink-0 text-right sm:block">
                      <p className="inline-flex items-center justify-end gap-1 text-[11px] font-medium text-ink-600">
                        <Clock3
                          className="h-3 w-3 text-ink-400"
                          aria-hidden="true"
                        />
                        <time
                          dateTime={client.updated_at}
                          title={formatDateTime(client.updated_at)}
                        >
                          Updated {updated}
                        </time>
                      </p>
                      <p className="mt-1 font-mono text-[10px] text-ink-500">
                        {client.client_id}
                      </p>
                    </div>
                    <ArrowRight
                      className="h-3.5 w-3.5 shrink-0 text-ink-300 transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
