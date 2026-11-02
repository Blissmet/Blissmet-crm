import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { PageHeader } from "@/components/ui/page-header";
import { ClientForm } from "@/components/clients/client-form";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Add client",
};

export const dynamic = "force-dynamic";

export default async function NewClientPage() {
  await requireAdmin();

  return (
    <div className="animate-fade-in">
      <Breadcrumbs
        items={[
          { label: "Clients", href: "/clients" },
          { label: "Add client" },
        ]}
      />
      <PageHeader
        title="Add new client"
        description="Create a complete client profile. You can add documents after the record is saved."
        className="mb-5"
      />
      <ClientForm mode="create" />
    </div>
  );
}
