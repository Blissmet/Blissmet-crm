"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

import { Brand } from "@/components/brand";
import { Button, buttonStyles } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink-50 px-5 py-12">
      <div className="w-full max-w-md text-center">
        <div className="mb-8 flex justify-center">
          <Brand />
        </div>

        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-red-200 bg-red-50 text-red-500 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-300">
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        </span>

        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">
          Something went wrong
        </p>
        <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.03em] text-ink-900">
          We couldn&apos;t load this page
        </h1>
        <p className="mt-2 text-[13px] leading-6 text-ink-500">
          An unexpected error interrupted the request. Your data is safe. Try
          again, or return to the dashboard if the problem continues.
        </p>
        {error.digest ? (
          <p className="mt-3 font-mono text-[10px] text-ink-400">
            Reference: {error.digest}
          </p>
        ) : null}

        <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
          <Button type="button" onClick={reset} size="md">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </Button>
          <Link
            href="/dashboard"
            className={buttonStyles({ variant: "secondary", size: "md" })}
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
