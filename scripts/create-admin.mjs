#!/usr/bin/env node

/**
 * Provision or update a CRM administrator.
 *
 * Usage:
 *   npm run admin:create -- admin@example.com "a-strong-password" "Admin Name"
 *
 * Required environment:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   (never expose this in client code)
 */

import { createClient } from "@supabase/supabase-js";

const [emailArg, passwordArg, ...nameParts] = process.argv.slice(2);
const email = emailArg?.trim().toLowerCase();
const password = passwordArg;
const fullName = nameParts.join(" ").trim() || null;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Load .env.local for the URL and set SUPABASE_SERVICE_ROLE_KEY in your shell."
  );
  process.exit(1);
}

if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error("Usage: npm run admin:create -- <email> <password> [full name]");
  process.exit(1);
}

if (!password || password.length < 12) {
  console.error("Password must be at least 12 characters.");
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function findUserByEmail(targetEmail) {
  let page = 1;

  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 100,
    });

    if (error) throw error;

    const user = data.users.find(
      (candidate) => candidate.email?.toLowerCase() === targetEmail
    );

    if (user) return user;
    if (data.users.length < 100) return null;
    page += 1;
  }

  return null;
}

async function main() {
  let user = await findUserByEmail(email);
  let created = false;

  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (error) throw error;
    user = data.user;
    created = true;
  } else {
    const { error } = await admin.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (error) throw error;
  }

  if (!user) throw new Error("Supabase did not return a user record.");

  const { error: adminError } = await admin.from("admin_users").upsert(
    {
      user_id: user.id,
      email,
      full_name: fullName,
      role: "admin",
    },
    { onConflict: "user_id" }
  );

  if (adminError) throw adminError;

  console.log(
    `${created ? "Created" : "Updated"} administrator ${email} (${user.id}).`
  );
}

main().catch((error) => {
  console.error("Failed to provision administrator:", error.message ?? error);
  process.exit(1);
});
