import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: number;
  description: string;
  icon: LucideIcon;
  tone: "blue" | "green" | "slate" | "violet";
  meter?: number;
};

const tones = {
  blue: {
    icon: "bg-brand-50 text-brand-600 ring-brand-100",
    accent: "bg-brand-500",
    meter: "bg-brand-500",
  },
  green: {
    icon: "bg-emerald-50 text-emerald-600 ring-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900/60",
    accent: "bg-emerald-500",
    meter: "bg-emerald-500",
  },
  slate: {
    icon: "bg-slate-100 text-slate-500 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700",
    accent: "bg-slate-400",
    meter: "bg-slate-400",
  },
  violet: {
    icon: "bg-violet-50 text-violet-600 ring-violet-100 dark:bg-violet-950/50 dark:text-violet-300 dark:ring-violet-900/60",
    accent: "bg-violet-500",
    meter: "bg-violet-500",
  },
};

export function StatCard({
  label,
  value,
  description,
  icon: Icon,
  tone,
  meter,
}: StatCardProps) {
  const styles = tones[tone];
  const clampedMeter =
    meter === undefined ? undefined : Math.min(100, Math.max(0, meter));

  return (
    <Card className="relative overflow-hidden p-5">
      <span
        className={cn("absolute inset-x-0 top-0 h-0.5", styles.accent)}
        aria-hidden="true"
      />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[12px] font-medium text-ink-600">{label}</p>
          <p className="mt-2 text-[30px] font-semibold leading-none tracking-[-0.04em] text-ink-900 tabular-nums">
            {new Intl.NumberFormat("en-US").format(value)}
          </p>
        </div>
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
            styles.icon
          )}
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} aria-hidden="true" />
        </span>
      </div>

      {clampedMeter !== undefined ? (
        <div
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink-100"
          aria-hidden="true"
        >
          <div
            className={cn("h-full rounded-full", styles.meter)}
            style={{ width: `${clampedMeter}%` }}
          />
        </div>
      ) : null}

      <p
        className={cn(
          "text-[11px] leading-5 text-ink-500",
          clampedMeter !== undefined ? "mt-2" : "mt-4"
        )}
      >
        {description}
      </p>
    </Card>
  );
}
