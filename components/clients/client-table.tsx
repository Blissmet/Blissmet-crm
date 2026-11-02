import Link from "next/link";
import { ArrowRight, Eye, Pencil } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import {
  Badge,
  ClientStatusBadge,
} from "@/components/ui/badge";
import type { ClientWithPhoto } from "@/lib/types";
import { formatDate, getDisplayName } from "@/lib/utils";

export function ClientTable({ clients }: { clients: ClientWithPhoto[] }) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[1040px] border-collapse text-left">
          <thead>
            <tr className="border-b border-ink-200 bg-ink-50/80">
              <th
                scope="col"
                className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.09em] text-ink-500"
              >
                Client
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.09em] text-ink-500"
              >
                Client ID
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.09em] text-ink-500"
              >
                Phone
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.09em] text-ink-500"
              >
                Department
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.09em] text-ink-500"
              >
                Employment
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.09em] text-ink-500"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.09em] text-ink-500"
              >
                Joined
              </th>
              <th
                scope="col"
                className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.09em] text-ink-500"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {clients.map((client) => (
              <tr
                key={client.id}
                className="group bg-surface transition-colors hover:bg-ink-50/50"
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={client.photoSignedUrl}
                      firstName={client.first_name}
                      lastName={client.last_name}
                      size="md"
                    />
                    <div className="min-w-0">
                      <Link
                        href={`/clients/${client.id}`}
                        className="block truncate text-[13px] font-semibold text-ink-900 transition hover:text-brand-700 focus-visible:rounded focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                      >
                        {getDisplayName(client)}
                      </Link>
                      <p className="mt-0.5 max-w-[200px] truncate text-[11px] text-ink-500">
                        {client.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5">
                  <span className="rounded bg-ink-50 px-1.5 py-0.5 font-mono text-[11px] font-medium text-ink-600">
                    {client.client_id}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-[12px] text-ink-600">
                  {client.phone}
                </td>
                <td className="px-4 py-3.5">
                  <p className="max-w-[170px] truncate text-[12px] font-medium text-ink-700">
                    {client.department}
                  </p>
                  <p className="mt-0.5 max-w-[170px] truncate text-[11px] text-ink-500">
                    {client.designation}
                  </p>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5">
                  <Badge variant="neutral">{client.employment_type}</Badge>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5">
                  <ClientStatusBadge status={client.status} />
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-[12px] text-ink-500">
                  {formatDate(client.date_of_joining)}
                </td>
                <td className="whitespace-nowrap px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/clients/${client.id}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 transition hover:bg-surface hover:text-brand-700 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-brand-500"
                      aria-label={`View ${getDisplayName(client)}`}
                      title="View client"
                    >
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    </Link>
                    <Link
                      href={`/clients/${client.id}/edit`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 transition hover:bg-surface hover:text-brand-700 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-brand-500"
                      aria-label={`Edit ${getDisplayName(client)}`}
                      title="Edit client"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-ink-100 md:hidden">
        {clients.map((client) => (
          <li key={client.id} className="bg-surface p-4">
            <div className="flex items-start gap-3">
              <Avatar
                src={client.photoSignedUrl}
                firstName={client.first_name}
                lastName={client.last_name}
                size="lg"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/clients/${client.id}`}
                    className="rounded text-[14px] font-semibold text-ink-900 hover:text-brand-700 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                  >
                    {getDisplayName(client)}
                  </Link>
                  <ClientStatusBadge status={client.status} />
                </div>
                <p className="mt-1 truncate text-[12px] text-ink-500">
                  {client.designation} · {client.department}
                </p>
                <p className="mt-1 truncate text-[11px] text-ink-500">
                  {client.email}
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border border-ink-100 bg-ink-50/50 p-3">
              <Detail label="Client ID" value={client.client_id} mono />
              <Detail label="Phone" value={client.phone} />
              <Detail label="Employment" value={client.employment_type} />
              <Detail label="Joined" value={formatDate(client.date_of_joining)} />
            </div>

            <div className="mt-3 flex items-center justify-between">
              <Link
                href={`/clients/${client.id}`}
                className="inline-flex items-center gap-1 rounded text-[12px] font-semibold text-brand-600 hover:text-brand-700 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
              >
                View profile
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
              <Link
                href={`/clients/${client.id}/edit`}
                className="inline-flex items-center gap-1.5 rounded-md border border-ink-200 bg-surface px-2.5 py-1.5 text-[11px] font-medium text-ink-600 shadow-sm transition hover:bg-ink-50 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
              >
                <Pencil className="h-3 w-3" aria-hidden="true" />
                Edit
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

function Detail({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-ink-500">
        {label}
      </p>
      <p
        className={`mt-0.5 truncate text-[11px] font-medium text-ink-700 ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
