import type { Metadata } from "next";
import { CalendarDays, FileLock2, UserCheck, Users, UserX } from "lucide-react";

import { ActivityChart } from "@/components/dashboard/activity-chart";
import { LatestDocuments } from "@/components/dashboard/latest-documents";
import { RecentClients } from "@/components/dashboard/recent-clients";
import { StatCard } from "@/components/dashboard/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { requireAdmin } from "@/lib/auth";
import { getDashboardData } from "@/lib/data/clients";

export const metadata: Metadata = {
  title: "Dashboard",
};

export const dynamic = "force-dynamic";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const { supabase, admin, user } = await requireAdmin();
  const data = await getDashboardData(supabase);

  const firstName =
    admin.full_name?.trim().split(/\s+/)[0] ||
    user.email?.split("@")[0] ||
    "there";

  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const inactiveRate =
    data.totalClients > 0
      ? Math.round((data.inactiveClients / data.totalClients) * 100)
      : 0;
  const newThisMonth = data.monthlyActivity.at(-1)?.count ?? 0;
  const totalLabel = `${data.totalClients} client${
    data.totalClients === 1 ? "" : "s"
  }`;
  const suggestedClient = data.recentClients[0] ?? null;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`${getGreeting()}, ${firstName}`}
        description="Here's what's happening across your client network today."
        actions={
          <span className="hidden h-10 items-center gap-2 rounded-lg border border-ink-200 bg-surface px-3.5 text-[12px] font-medium text-ink-600 shadow-sm sm:inline-flex">
            <CalendarDays
              className="h-3.5 w-3.5 text-ink-500"
              aria-hidden="true"
            />
            {today}
          </span>
        }
      />

      <section
        aria-label="Client statistics"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          label="Total clients"
          value={data.totalClients}
          description={
            newThisMonth > 0
              ? `${newThisMonth} new this month`
              : "No new clients this month"
          }
          icon={Users}
          tone="blue"
        />
        <StatCard
          label="Active clients"
          value={data.activeClients}
          description={
            data.totalClients > 0
              ? `${data.activeRate}% of ${totalLabel}`
              : "No clients yet"
          }
          icon={UserCheck}
          tone="green"
          meter={data.activeRate}
        />
        <StatCard
          label="Inactive clients"
          value={data.inactiveClients}
          description={
            data.totalClients > 0
              ? `${inactiveRate}% of ${totalLabel}`
              : "No clients yet"
          }
          icon={UserX}
          tone="slate"
          meter={inactiveRate}
        />
        <StatCard
          label="Documents"
          value={data.totalDocuments}
          description={
            data.totalDocuments === 0
              ? "No files uploaded yet"
              : "Private files with signed access"
          }
          icon={FileLock2}
          tone="violet"
        />
      </section>

      <section aria-label="Recent clients">
        <RecentClients clients={data.recentClients} />
      </section>

      <section
        aria-label="Client activity and documents"
        className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]"
      >
        <ActivityChart
          activity={data.monthlyActivity}
          total={data.activityTotal}
        />
        <LatestDocuments
          documents={data.recentDocuments}
          total={data.totalDocuments}
          suggestedClient={suggestedClient}
        />
      </section>
    </div>
  );
}
