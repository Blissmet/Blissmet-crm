import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { CLIENTS_PAGE_SIZE, DASHBOARD_RECENT_LIMIT } from "@/lib/constants";
import { attachSignedPhotos, getSignedPhotoUrl } from "@/lib/storage/server";
import type {
  ClientListFilters,
  ClientSort,
  ClientWithPhoto,
  RecentDocument,
} from "@/lib/types";
import { formatMonth, isUuid } from "@/lib/utils";
import type { Database, DocumentRow } from "@/types/database";

type TypedSupabaseClient = SupabaseClient<Database>;

const SEARCH_FIELDS = [
  "first_name",
  "last_name",
  "email",
  "phone",
  "client_id",
] as const;

const SORT_OPTIONS: readonly ClientSort[] = [
  "newest",
  "oldest",
  "name_asc",
  "name_desc",
];

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export function parseClientFilters(searchParams: {
  [key: string]: string | string[] | undefined;
}): ClientListFilters {
  const q = firstValue(searchParams.q).trim().slice(0, 120);
  const rawStatus = firstValue(searchParams.status);
  const status =
    rawStatus === "Active" || rawStatus === "Inactive" ? rawStatus : "";
  const rawSort = firstValue(searchParams.sort) as ClientSort;
  const sort = SORT_OPTIONS.includes(rawSort) ? rawSort : "newest";
  const rawPage = Number.parseInt(firstValue(searchParams.page), 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  return { q, status, sort, page };
}

function cleanSearchToken(token: string) {
  return token.replace(/[(),%_\\+]/g, " ").trim().slice(0, 80);
}

export async function getClients(
  supabase: TypedSupabaseClient,
  filters: ClientListFilters
) {
  let query = supabase.from("clients").select("*", { count: "exact" });

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.q) {
    const tokens = filters.q
      .split(/\s+/)
      .map(cleanSearchToken)
      .filter(Boolean)
      .slice(0, 4);

    for (const token of tokens) {
      const expression = SEARCH_FIELDS.map(
        (field) => `${field}.ilike.%${token}%`
      ).join(",");
      query = query.or(expression);
    }
  }

  switch (filters.sort) {
    case "oldest":
      query = query.order("created_at", { ascending: true });
      break;
    case "name_asc":
      query = query
        .order("first_name", { ascending: true })
        .order("last_name", { ascending: true });
      break;
    case "name_desc":
      query = query
        .order("first_name", { ascending: false })
        .order("last_name", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const from = (filters.page - 1) * CLIENTS_PAGE_SIZE;
  const to = from + CLIENTS_PAGE_SIZE - 1;

  const { data, error, count } = await query.range(from, to);

  if (error) {
    console.error("Unable to load clients:", error.message);
    throw new Error("Unable to load clients.");
  }

  const total = count ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / CLIENTS_PAGE_SIZE));

  // A filter or deletion can leave the requested page out of range.
  if (filters.page > pageCount && total > 0) {
    return getClients(supabase, { ...filters, page: pageCount });
  }

  const clients = await attachSignedPhotos(supabase, data ?? []);

  return {
    clients: clients as ClientWithPhoto[],
    total,
    page: Math.min(filters.page, pageCount),
    pageCount,
  };
}

export async function getClientById(
  supabase: TypedSupabaseClient,
  id: string
): Promise<ClientWithPhoto | null> {
  if (!isUuid(id)) return null;

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Unable to load client:", error.message);
    throw new Error("Unable to load this client.");
  }

  if (!data) return null;

  const photoSignedUrl = await getSignedPhotoUrl(supabase, data.photo_url);
  return { ...data, photoSignedUrl };
}

export async function getClientDocuments(
  supabase: TypedSupabaseClient,
  clientId: string
): Promise<DocumentRow[]> {
  if (!isUuid(clientId)) return [];

  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("client_id", clientId)
    .order("uploaded_at", { ascending: false });

  if (error) {
    console.error("Unable to load client documents:", error.message);
    throw new Error("Unable to load client documents.");
  }

  return data ?? [];
}

type MonthlyActivity = {
  key: string;
  label: string;
  count: number;
  start: string;
};

export type DashboardData = {
  totalClients: number;
  activeClients: number;
  inactiveClients: number;
  totalDocuments: number;
  recentClients: ClientWithPhoto[];
  recentDocuments: RecentDocument[];
  monthlyActivity: MonthlyActivity[];
  activeRate: number;
  activityTotal: number;
};

export async function getDashboardData(
  supabase: TypedSupabaseClient
): Promise<DashboardData> {
  const now = new Date();
  const currentMonthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  );

  const months = Array.from({ length: 6 }, (_, index) => {
    const start = new Date(
      Date.UTC(
        currentMonthStart.getUTCFullYear(),
        currentMonthStart.getUTCMonth() - (5 - index),
        1
      )
    );
    const end = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1)
    );

    return {
      key: start.toISOString().slice(0, 7),
      label: formatMonth(start),
      start: start.toISOString(),
      end: end.toISOString(),
    };
  });

  const [
    totalResult,
    activeResult,
    inactiveResult,
    documentsResult,
    recentClientsResult,
    recentDocumentsResult,
    ...monthlyResults
  ] = await Promise.all([
    supabase.from("clients").select("*", { count: "exact", head: true }),
    supabase
      .from("clients")
      .select("*", { count: "exact", head: true })
      .eq("status", "Active"),
    supabase
      .from("clients")
      .select("*", { count: "exact", head: true })
      .eq("status", "Inactive"),
    supabase.from("documents").select("*", { count: "exact", head: true }),
    supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(DASHBOARD_RECENT_LIMIT),
    supabase
      .from("documents")
      .select(
        "id, client_id, doc_type, file_name, uploaded_at, clients(first_name, last_name, client_id)"
      )
      .order("uploaded_at", { ascending: false })
      .limit(DASHBOARD_RECENT_LIMIT)
      .returns<RecentDocument[]>(),
    ...months.map((month) =>
      supabase
        .from("clients")
        .select("*", { count: "exact", head: true })
        .gte("created_at", month.start)
        .lt("created_at", month.end)
    ),
  ]);

  const queryResults = [
    totalResult,
    activeResult,
    inactiveResult,
    documentsResult,
    recentClientsResult,
    recentDocumentsResult,
    ...monthlyResults,
  ];

  const failed = queryResults.find((result) => result.error);
  if (failed?.error) {
    console.error("Unable to load dashboard data:", failed.error.message);
    throw new Error("Unable to load dashboard data.");
  }

  const recentClients = await attachSignedPhotos(
    supabase,
    recentClientsResult.data ?? []
  );

  const monthlyActivity: MonthlyActivity[] = months.map((month, index) => ({
    key: month.key,
    label: month.label,
    count: monthlyResults[index]?.count ?? 0,
    start: month.start,
  }));

  const totalClients = totalResult.count ?? 0;
  const activeClients = activeResult.count ?? 0;

  return {
    totalClients,
    activeClients,
    inactiveClients: inactiveResult.count ?? 0,
    totalDocuments: documentsResult.count ?? 0,
    recentClients: recentClients as ClientWithPhoto[],
    recentDocuments: recentDocumentsResult.data ?? [],
    monthlyActivity,
    activeRate:
      totalClients > 0 ? Math.round((activeClients / totalClients) * 100) : 0,
    activityTotal: monthlyActivity.reduce((sum, month) => sum + month.count, 0),
  };
}
