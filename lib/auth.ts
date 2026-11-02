import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import type { AdminRow } from "@/types/database";

type AdminContext = {
  user: User;
  admin: AdminRow;
};

type SessionContext =
  | { user: null; admin: null }
  | { user: User; admin: AdminRow | null };

export const getAdminContext = cache(async (): Promise<AdminContext | null> => {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return null;

  const { data: admin, error: adminError } = await supabase
    .from("admin_users")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError) {
    console.error("Unable to verify administrator access:", adminError.message);
    return null;
  }

  if (!admin) return null;

  return { user, admin };
});

export const getSessionContext = cache(async (): Promise<SessionContext> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, admin: null };

  const { data: admin } = await supabase
    .from("admin_users")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return { user, admin };
});

/**
 * Authorization is enforced server-side, independently of route guards.
 * Every protected page and mutation must call this function.
 */
export async function requireAdmin() {
  const context = await getAdminContext();

  if (!context) {
    const session = await getSessionContext();

    if (!session.user) {
      redirect("/login");
    }

    redirect("/login?error=access_denied");
  }

  const supabase = await createClient();
  return { ...context, supabase };
}

export function getAdminDisplayName(admin: AdminRow, email?: string | null) {
  return admin.full_name?.trim() || email?.split("@")[0] || "Administrator";
}
