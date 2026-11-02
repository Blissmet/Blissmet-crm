"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/utils";
import type { LoginFormState } from "./types";

const LOGIN_ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: "The email or password you entered is incorrect.",
  email_not_confirmed: "This account has not been confirmed yet.",
  too_many_requests:
    "Too many sign-in attempts. Please wait a few minutes and try again.",
  user_banned: "This account has been suspended. Contact an administrator.",
};

function friendlyAuthError(message?: string, code?: string) {
  if (code && LOGIN_ERROR_MESSAGES[code]) return LOGIN_ERROR_MESSAGES[code];
  if (message?.toLowerCase().includes("invalid login credentials")) {
    return LOGIN_ERROR_MESSAGES.invalid_credentials;
  }
  if (message?.toLowerCase().includes("email not confirmed")) {
    return LOGIN_ERROR_MESSAGES.email_not_confirmed;
  }
  return "We couldn't sign you in. Please try again.";
}

export async function signInAction(
  _previousState: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const nextPath = safeNextPath(String(formData.get("next") ?? "/dashboard"));

  if (!email || !password) {
    return { error: "Enter your email address and password." };
  }

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { error: "Enter a valid email address." };
  }

  const supabase = await createClient();

  // Clear any previous, non-authorized session before establishing a new one.
  await supabase.auth.signOut();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { error: friendlyAuthError(error?.message, error?.code) };
  }

  const { data: admin, error: adminError } = await supabase
    .from("admin_users")
    .select("id")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (adminError) {
    console.error("Admin verification failed during sign in:", adminError.message);
    await supabase.auth.signOut();
    return {
      error:
        "We couldn't verify your CRM access. Please try again or contact an administrator.",
    };
  }

  if (!admin) {
    await supabase.auth.signOut();
    return {
      error:
        "This account is not authorized to access the CRM. Contact an administrator for access.",
    };
  }

  revalidatePath("/", "layout");
  redirect(nextPath);
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
