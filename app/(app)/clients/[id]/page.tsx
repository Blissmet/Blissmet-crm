import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BriefcaseBusiness,
  CalendarDays,
  Clock3,
  IdCard,
  Mail,
  MapPin,
  NotebookPen,
  Pencil,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Avatar } from "@/components/ui/avatar";
import {
  Badge,
  ClientStatusBadge,
} from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NoticeToast } from "@/components/ui/notice-toast";
import { DeleteClientButton } from "@/components/clients/delete-client-button";
import { SensitiveValue } from "@/components/clients/sensitive-value";
import { DocumentManager } from "@/components/documents/document-manager";
import { requireAdmin } from "@/lib/auth";
import { getClientById, getClientDocuments } from "@/lib/data/clients";
import {
  formatDate,
  formatDateTime,
  getDisplayName,
} from "@/lib/utils";

type ClientDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export const metadata: Metadata = {
  title: "Client profile",
};

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({
  params,
  searchParams,
}: ClientDetailPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const { supabase } = await requireAdmin();
  const client = await getClientById(supabase, id);

  if (!client) notFound();

  const documents = await getClientDocuments(supabase, client.id);
  const name = getDisplayName(client);
  const rawNotice = Array.isArray(query.notice)
    ? query.notice[0]
    : query.notice;

  return (
    <div className="space-y-5 animate-fade-in">
      <NoticeToast notice={rawNotice} cleanPath={`/clients/${client.id}`} />

      <Breadcrumbs
        items={[
          { label: "Clients", href: "/clients" },
          { label: name },
        ]}
      />

      <Card className="overflow-hidden">
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Avatar
                src={client.photoSignedUrl}
                firstName={client.first_name}
                lastName={client.last_name}
                size="2xl"
                className="ring-4 ring-ink-50"
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-[24px] font-semibold tracking-[-0.03em] text-ink-900">
                    {name}
                  </h1>
                  <ClientStatusBadge status={client.status} />
                </div>
                <p className="mt-1 text-[13px] font-medium text-ink-600">
                  {client.designation}
                  <span className="mx-1.5 text-ink-300">·</span>
                  {client.department}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-ink-200 bg-ink-50 px-2 py-1 font-mono text-[11px] font-medium text-ink-600">
                    <IdCard className="h-3.5 w-3.5 text-ink-400" aria-hidden="true" />
                    {client.client_id}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-ink-500">
                    <CalendarDays className="h-3.5 w-3.5 text-ink-400" aria-hidden="true" />
                    Joined {formatDate(client.date_of_joining)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Link
                href={`/clients/${client.id}/edit`}
                className={buttonStyles({ variant: "primary", size: "md" })}
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
                Edit client
              </Link>
              <DeleteClientButton client={client} />
            </div>
          </div>

          <div className="mt-5 grid gap-3 border-t border-ink-100 pt-4 sm:grid-cols-2 lg:grid-cols-3">
            <ContactLine
              icon={Mail}
              label="Email"
              href={`mailto:${client.email}`}
              value={client.email}
            />
            <ContactLine
              icon={Phone}
              label="Phone"
              href={`tel:${client.phone.replace(/\s/g, "")}`}
              value={client.phone}
            />
            <ContactLine
              icon={BriefcaseBusiness}
              label="Employment"
              value={client.employment_type}
            />
          </div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <DetailCard
            title="Employment information"
            description="Role and engagement details."
            icon={BriefcaseBusiness}
          >
            <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
              <DetailItem label="Client ID" value={client.client_id} mono />
              <DetailItem label="Department" value={client.department} />
              <DetailItem label="Designation" value={client.designation} />
              <DetailItem
                label="Employment type"
                value={<Badge variant="neutral">{client.employment_type}</Badge>}
              />
              <DetailItem
                label="Date of joining"
                value={formatDate(client.date_of_joining)}
              />
              <DetailItem
                label="Total experience"
                value={
                  client.total_experience !== null
                    ? `${client.total_experience} year${client.total_experience === 1 ? "" : "s"}`
                    : "—"
                }
              />
            </dl>
          </DetailCard>

          <DetailCard
            title="Personal information"
            description="Identity details for this client."
            icon={UserRound}
          >
            <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
              <DetailItem
                label="Date of birth"
                value={formatDate(client.date_of_birth)}
              />
              <DetailItem label="Gender" value={client.gender || "—"} />
              <DetailItem
                label="Aadhaar number"
                value={<SensitiveValue value={client.aadhaar} />}
              />
            </dl>
          </DetailCard>

          <DetailCard
            title="Address & notes"
            description="Location and internal context."
            icon={MapPin}
          >
            <div className="space-y-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-400">
                  Address
                </p>
                <p className="mt-1.5 whitespace-pre-line text-[13px] leading-6 text-ink-700">
                  {client.address || "No address provided."}
                </p>
              </div>
              <div className="border-t border-ink-100 pt-4">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-400">
                  <NotebookPen className="h-3 w-3" aria-hidden="true" />
                  Notes
                </p>
                <p className="mt-1.5 whitespace-pre-line text-[13px] leading-6 text-ink-600">
                  {client.notes || "No internal notes have been added."}
                </p>
              </div>
            </div>
          </DetailCard>
        </div>

        <div className="space-y-4">
          <DetailCard
            title="Contact information"
            description="Direct contact channels."
            icon={Mail}
          >
            <div className="space-y-4">
              <ContactRow
                icon={Mail}
                label="Email address"
                value={client.email}
                href={`mailto:${client.email}`}
              />
              <ContactRow
                icon={Phone}
                label="Phone number"
                value={client.phone}
                href={`tel:${client.phone.replace(/\s/g, "")}`}
              />
              <ContactRow
                icon={Phone}
                label="Work phone"
                value={client.work_phone || "—"}
                href={
                  client.work_phone
                    ? `tel:${client.work_phone.replace(/\s/g, "")}`
                    : undefined
                }
              />
            </div>
          </DetailCard>

          <DetailCard
            title="Account details"
            description="Record status and audit metadata."
            icon={ShieldCheck}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[12px] text-ink-500">Status</span>
                <ClientStatusBadge status={client.status} />
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-ink-100 pt-4">
                <span className="text-[12px] text-ink-500">Documents</span>
                <span className="text-[12px] font-semibold text-ink-800">
                  {documents.length}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3 border-t border-ink-100 pt-4">
                <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-500">
                  <Clock3 className="h-3.5 w-3.5 text-ink-400" aria-hidden="true" />
                  Created
                </span>
                <span className="text-right text-[11px] leading-5 text-ink-600">
                  {formatDateTime(client.created_at)}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3 border-t border-ink-100 pt-4">
                <span className="text-[12px] text-ink-500">Last updated</span>
                <span className="text-right text-[11px] leading-5 text-ink-600">
                  {formatDateTime(client.updated_at)}
                </span>
              </div>
            </div>
          </DetailCard>

          <div className="rounded-xl border border-brand-100 bg-brand-50/70 p-4">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
              <div>
                <p className="text-[12px] font-semibold text-brand-900">
                  Protected client record
                </p>
                <p className="mt-1 text-[11px] leading-5 text-brand-800/80 dark:text-brand-200/90">
                  Contact, identity, and document data are available only to
                  authorized CRM administrators.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DocumentManager
        clientId={client.id}
        clientName={name}
        documents={documents}
      />
    </div>
  );
}

function DetailCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-3 pb-4">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-ink-100 bg-ink-50 text-ink-500">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <CardTitle>{title}</CardTitle>
          <p className="mt-0.5 text-[12px] text-ink-500">{description}</p>
        </div>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}

function DetailItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-400">
        {label}
      </dt>
      <dd
        className={`mt-1.5 break-words text-[13px] font-medium text-ink-800 ${
          mono ? "font-mono text-[12px]" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function ContactRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-ink-100 bg-ink-50 text-ink-400">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] font-semibold uppercase tracking-[0.07em] text-ink-400">
          {label}
        </span>
        <span className="mt-0.5 block truncate text-[12px] font-medium text-ink-700">
          {value}
        </span>
      </span>
    </>
  );

  return href ? (
    <a
      href={href}
      className="flex items-center gap-2.5 rounded-lg transition hover:text-brand-700 focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      {content}
    </a>
  ) : (
    <div className="flex items-center gap-2.5">{content}</div>
  );
}

function ContactLine({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <>
      <Icon className="h-3.5 w-3.5 shrink-0 text-ink-400" aria-hidden="true" />
      <span className="truncate text-[12px] text-ink-600">
        <span className="text-ink-400">{label}: </span>
        {value}
      </span>
    </>
  );

  return href ? (
    <a
      href={href}
      className="flex min-w-0 items-center gap-2 rounded transition hover:text-brand-700 focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      {content}
    </a>
  ) : (
    <div className="flex min-w-0 items-center gap-2">{content}</div>
  );
}
