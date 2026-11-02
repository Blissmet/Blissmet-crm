import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { PageHeader } from "@/components/ui/page-header";
import { ClientForm } from "@/components/clients/client-form";
import { requireAdmin } from "@/lib/auth";
import { getClientById } from "@/lib/data/clients";
import { getDisplayName } from "@/lib/utils";

type EditClientPageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Edit client",
};

export const dynamic = "force-dynamic";

export default async function EditClientPage({ params }: EditClientPageProps) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const client = await getClientById(supabase, id);

  if (!client) notFound();

  const name = getDisplayName(client);

  return (
    <div className="animate-fade-in">
      <Breadcrumbs
        items={[
          { label: "Clients", href: "/clients" },
          { label: name, href: `/clients/${client.id}` },
          { label: "Edit" },
        ]}
      />
      <PageHeader
        title={`Edit ${name}`}
        description={`Update ${client.client_id}'s profile, employment details, and personal information.`}
        className="mb-5"
      />
      <ClientForm mode="edit" initialClient={client} />
    </div>
  );
}
