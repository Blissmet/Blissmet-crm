import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";
import type { ClientStatus } from "@/types/database";

type BadgeVariant =
  | "neutral"
  | "blue"
  | "green"
  | "amber"
  | "red"
  | "violet"
  | "slate";

const badgeStyles: Record<BadgeVariant, string> = {
  neutral: "border-ink-200 bg-ink-50 text-ink-600",
  blue: "border-brand-100 bg-brand-50 text-brand-700",
  green:
    "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-300",
  amber:
    "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/50 dark:text-amber-300",
  red: "border-red-100 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-300",
  violet:
    "border-violet-100 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/50 dark:text-violet-300",
  slate:
    "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export function Badge({
  className,
  variant = "neutral",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium leading-5",
        badgeStyles[variant],
        className
      )}
      {...props}
    />
  );
}

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  return (
    <Badge variant={status === "Active" ? "green" : "slate"}>
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "Active" ? "bg-emerald-500" : "bg-slate-400"
        )}
        aria-hidden="true"
      />
      {status}
    </Badge>
  );
}

const documentColors: Record<string, BadgeVariant> = {
  "Aadhaar Card": "blue",
  "Offer Letter": "violet",
  "Payment Proof": "green",
  "Employment Contract": "amber",
  "Profile Photo": "slate",
  "Other Documents": "neutral",
};

export function DocumentTypeBadge({ type }: { type: string }) {
  return <Badge variant={documentColors[type] ?? "neutral"}>{type}</Badge>;
}
