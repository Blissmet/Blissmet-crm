"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { deleteClientAction } from "@/lib/actions/clients";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { getDisplayName } from "@/lib/utils";
import type { ClientRow } from "@/types/database";

export function DeleteClientButton({
  client,
}: {
  client: Pick<ClientRow, "id" | "first_name" | "last_name" | "client_id">;
}) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteClientAction(client.id);

    if (!result.ok) {
      setDeleting(false);
      toast("Unable to delete client", {
        description: result.error,
        variant: "error",
      });
      return;
    }

    setOpen(false);
    router.push("/clients?notice=deleted");
  }

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        onClick={() => setOpen(true)}
        className="border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:border-red-900/60 dark:text-red-300 dark:hover:border-red-800 dark:hover:bg-red-950/50 dark:hover:text-red-200"
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
        Delete
      </Button>

      <ConfirmDialog
        open={open}
        title={`Delete ${getDisplayName(client)}?`}
        description={`This will permanently delete client ${client.client_id}, their profile, and all associated documents. This action cannot be undone.`}
        confirmLabel="Delete client"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => {
          if (!deleting) setOpen(false);
        }}
      />
    </>
  );
}
