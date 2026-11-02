import Link from "next/link";
import { UserX } from "lucide-react";

import { buttonStyles } from "@/components/ui/button";

export default function ClientNotFound() {
  return (
    <div className="flex min-h-[55vh] items-center justify-center animate-fade-in">
      <div className="w-full max-w-md text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-ink-200 bg-surface text-ink-400 shadow-sm">
          <UserX className="h-5 w-5" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-[22px] font-semibold tracking-[-0.03em] text-ink-900">
          Client not found
        </h1>
        <p className="mt-2 text-[13px] leading-6 text-ink-500">
          This client record may have been deleted, or the link is invalid.
          Return to the directory to find the client you need.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Link
            href="/clients"
            className={buttonStyles({ variant: "primary", size: "md" })}
          >
            Back to clients
          </Link>
          <Link
            href="/dashboard"
            className={buttonStyles({ variant: "secondary", size: "md" })}
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
