"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { useToast } from "./toast";

const NOTICES: Record<string, { title: string; description: string }> = {
  created: {
    title: "Client created",
    description: "The client record has been added successfully.",
  },
  updated: {
    title: "Client updated",
    description: "Your changes have been saved successfully.",
  },
  deleted: {
    title: "Client deleted",
    description: "The client and their documents were removed.",
  },
  document_deleted: {
    title: "Document deleted",
    description: "The document was removed from secure storage.",
  },
};

export function NoticeToast({
  notice,
  cleanPath,
}: {
  notice?: string;
  cleanPath: string;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const handled = useRef(false);

  useEffect(() => {
    if (!notice || handled.current) return;
    handled.current = true;

    const message = NOTICES[notice];
    if (message) {
      toast(message.title, {
        description: message.description,
        variant: "success",
      });
    }

    router.replace(cleanPath, { scroll: false });
  }, [cleanPath, notice, router, toast]);

  return null;
}
