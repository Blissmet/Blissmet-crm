import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

import { Brand } from "@/components/brand";
import { buttonStyles } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-ink-50 px-5 py-12">
      <div className="w-full max-w-md text-center">
        <div className="mb-8 flex justify-center">
          <Brand />
        </div>

        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-ink-200 bg-surface text-ink-400 shadow-sm">
          <Compass className="h-5 w-5" aria-hidden="true" />
        </span>

        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">
          404 — Not found
        </p>
        <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.03em] text-ink-900">
          This page doesn&apos;t exist
        </h1>
        <p className="mt-2 text-[13px] leading-6 text-ink-500">
          The page may have been moved, or the link you followed is no longer
          available. Return to your workspace to keep working.
        </p>

        <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
          <Link
            href="/dashboard"
            className={buttonStyles({ variant: "primary", size: "md" })}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to dashboard
          </Link>
          <Link
            href="/clients"
            className={buttonStyles({ variant: "secondary", size: "md" })}
          >
            View clients
          </Link>
        </div>
      </div>
    </main>
  );
}
