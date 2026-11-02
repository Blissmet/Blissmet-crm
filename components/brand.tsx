import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[6px]",
        className
      )}
      aria-hidden="true"
    >
      <Image
        src="/blissmet-logo.png"
        alt=""
        width={499}
        height={479}
        priority
        className="h-full w-full object-cover"
      />
    </span>
  );
}

export function Brand({
  variant = "default",
  href = "/dashboard",
  compact = false,
}: {
  variant?: "default" | "light";
  href?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-2.5 rounded-lg focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
      aria-label="Blissmet CRM home"
    >
      <BrandMark />
      {!compact ? (
        <span className="flex items-baseline gap-2">
          <span
            className={cn(
              "text-[17px] font-semibold tracking-[-0.03em]",
              variant === "light" ? "text-white" : "text-ink-900"
            )}
          >
            Blissmet
          </span>
          {" "}
          <span
            className={cn(
              "rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em]",
              variant === "light"
                ? "border-white/20 text-blue-100"
                : "border-ink-200 bg-ink-50 text-ink-500"
            )}
          >
            CRM
          </span>
        </span>
      ) : null}
    </Link>
  );
}
