import Link from "next/link";
import { Activity, ArrowRight, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MonthlyActivity = {
  key: string;
  label: string;
  count: number;
  start: string;
};

const COMPACT_THRESHOLD = 4;

export function ActivityChart({
  activity,
  total,
}: {
  activity: MonthlyActivity[];
  total: number;
}) {
  const max = Math.max(1, ...activity.map((month) => month.count));
  const compact = total < COMPACT_THRESHOLD;
  const peak = activity.reduce(
    (best, month) => (month.count > best.count ? month : best),
    activity[0] ?? { key: "", label: "", count: 0, start: "" }
  );
  const summary = activity
    .map((month) => `${month.label}: ${month.count}`)
    .join(", ");

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-50 text-brand-600">
              <Activity className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <CardTitle>Client activity</CardTitle>
          </div>
          <CardDescription>
            {compact
              ? "A compact view while your client history grows."
              : "New client records over the last six months."}
          </CardDescription>
        </div>
        <Badge variant={compact ? "neutral" : "blue"} className="mt-1 shrink-0">
          <TrendingUp className="h-3 w-3" aria-hidden="true" />
          {total} new
        </Badge>
      </CardHeader>

      <CardContent className={compact ? "pt-4" : "pt-6"}>
        {compact ? (
          <CompactChart
            activity={activity}
            max={max}
            total={total}
            peakLabel={peak.count > 0 ? peak.label : null}
            summary={summary}
          />
        ) : (
          <FullChart activity={activity} max={max} summary={summary} />
        )}
      </CardContent>
    </Card>
  );
}

function CompactChart({
  activity,
  max,
  total,
  peakLabel,
  summary,
}: {
  activity: MonthlyActivity[];
  max: number;
  total: number;
  peakLabel: string | null;
  summary: string;
}) {
  return (
    <div>
      <div
        className="flex items-end gap-2"
        role="img"
        aria-label={`New clients by month — ${summary}`}
      >
        {activity.map((month, index) => {
          const height =
            month.count === 0 ? 4 : Math.max(10, (month.count / max) * 100);
          const isCurrent = index === activity.length - 1;

          return (
            <div
              key={month.key}
              className="flex min-w-0 flex-1 flex-col items-center gap-2"
            >
              <div className="flex h-14 w-full items-end">
                <div
                  className={cn(
                    "w-full rounded-t-[4px]",
                    isCurrent
                      ? "bg-brand-600"
                      : month.count === 0
                        ? "bg-ink-100"
                        : "bg-brand-300"
                  )}
                  style={{ height: `${height}%` }}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium",
                  isCurrent ? "text-ink-800" : "text-ink-500"
                )}
              >
                {month.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-col gap-2 border-t border-ink-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[12px] leading-5 text-ink-500">
          {total === 0
            ? "No new clients in this period."
            : `${total} new client${total === 1 ? "" : "s"} in the last six months.`}
          {peakLabel ? ` Peak month: ${peakLabel}.` : ""}
        </p>
        <Link
          href="/clients?sort=newest"
          className="inline-flex shrink-0 items-center gap-1 rounded text-[11px] font-semibold text-brand-600 transition hover:text-brand-700 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        >
          View directory
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

function FullChart({
  activity,
  max,
  summary,
}: {
  activity: MonthlyActivity[];
  max: number;
  summary: string;
}) {
  return (
    <div role="group" aria-label={`New clients by month — ${summary}`}>
      <p className="sr-only">New clients by month: {summary}.</p>
      <div className="relative">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[176px]"
          aria-hidden="true"
        >
          {[0, 1, 2, 3].map((line) => (
            <div
              key={line}
              className="absolute inset-x-0 border-t border-dashed border-ink-100"
              style={{ top: `${line * 33.333}%` }}
            />
          ))}
        </div>

        <div className="relative flex h-[176px] items-end gap-2 sm:gap-4">
          {activity.map((month, index) => {
            const height =
              month.count === 0 ? 4 : Math.max(10, (month.count / max) * 100);
            const isCurrent = index === activity.length - 1;

            return (
              <div
                key={month.key}
                className="group flex h-full flex-1 flex-col items-center justify-end"
              >
                <span className="mb-1.5 text-[11px] font-semibold text-ink-500 tabular-nums">
                  {month.count}
                </span>
                <div
                  role="img"
                  aria-label={`${month.label}: ${month.count} new clients`}
                  title={`${month.label}: ${month.count} new client${month.count === 1 ? "" : "s"}`}
                  className={cn(
                    "w-full max-w-[54px] rounded-t-[5px] transition-colors",
                    isCurrent
                      ? "bg-brand-600"
                      : month.count === 0
                        ? "bg-ink-100"
                        : "bg-brand-300 group-hover:bg-brand-400"
                  )}
                  style={{ height: `${height}%` }}
                />
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex gap-2 border-t border-ink-100 pt-3 sm:gap-4">
          {activity.map((month, index) => (
            <div key={month.key} className="flex-1 text-center">
              <span
                className={cn(
                  "text-[11px] font-medium",
                  index === activity.length - 1
                    ? "text-ink-800"
                    : "text-ink-500"
                )}
              >
                {month.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
