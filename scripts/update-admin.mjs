#!/usr/bin/env node

/**
 * Update an existing CRM administrator's login email, password, or display name.
 *
 * Usage:
 *   npm run admin:update -- --current admin@example.com --password "new-password"
 *   npm run admin:update -- --current admin@example.com --email new@example.com --password "new-password" --name "Admin Name"
 *
 * Required environment:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   (never expose this in client code)
 */

import { createClient } from "@supabase/supabase-js";

function readFlag(name) {
  const args = process.argv.slice(2);

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === `--${name}`) {
      return args[index + 1] ?? "";
    }
    if (arg.startsWith(`--${name}=`)) {
      return arg.slice(name.length + 3);
    }
  }

  return undefined;
}

function hasFlag(name) {
  return process.argv.slice(2).some((arg) => arg === `--${name}`);
}

const help = `Update a CRM administrator.

Usage:
  npm run admin:update -- --current <existing-email> [options]
  npm run admin:update -- --user-id <auth-user-id> [options]

Options:
  --email <new-email>       Change the login email (the CRM "username").
  --password <password>     Set a new password (minimum 12 characters).
  --name "Full Name"        Change the display name.
  --current <email>         Existing login email, used to find the admin.
  --user-id <uuid>          Existing auth user id (alternative to --current).
  --help                    Show this message.

If exactly one administrator exists, --current and --user-id are optional.
`;

if (hasFlag("help")) {
  console.log(help);
  process.exit(0);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
      "For local development, run this through npm so .env.local is loaded.\n" +
      "For a hosted project, create .env.admin.local and use admin:update:hosted."
  );
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const currentEmail = readFlag("current")?.trim().toLowerCase();
const userId = readFlag("user-id")?.trim();
const newEmailRaw = readFlag("email");
const newEmail = newEmailRaw?.trim().toLowerCase();
const password = readFlag("password");
const nameFlagPresent = hasFlag("name");
const fullName = readFlag("name")?.trim() ?? "";

if (newEmailRaw !== undefined && (!newEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(newEmail))) {
  console.error("The new email address is not valid.");
  process.exit(1);
}

if (password !== undefined && password.length < 12) {
  console.error("Password must be at least 12 characters.");
  process.exit(1);
}

let resolvedByDefault = null;

if (!currentEmail && !userId) {
  const { data: admins, error } = await admin
    .from("admin_users")
    .select("user_id, email, full_name")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Unable to list administrators:", error.message);
    process.exit(1);
  }

  if (!admins || admins.length !== 1) {
    console.error(
      "Specify --current <email> or --user-id <uuid>.\n" +
        "Administrators:\n" +
        (admins ?? [])
          .map((row) => `  - ${row.email} (${row.user_id})`)
          .join("\n")
    );
    process.exit(1);
  }

  resolvedByDefault = admins[0];
}

let adminRow = resolvedByDefault ?? null;

if (!adminRow && userId) {
  const { data, error } = await admin
    .from("admin_users")
    .select("user_id, email, full_name")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Unable to find administrator:", error.message);
    process.exit(1);
  }

  adminRow = data;
}

if (!adminRow && currentEmail) {
  const { data, error } = await admin
    .from("admin_users")
    .select("user_id, email, full_name")
    .eq("email", currentEmail)
    .maybeSingle();

  if (error) {
    console.error("Unable to find administrator:", error.message);
    process.exit(1);
  }

  adminRow = data;
}

if (!adminRow) {
  console.error(`No administrator found for ${userId ?? currentEmail}.`);
  process.exit(1);
}

const emailChanged = Boolean(newEmail) && newEmail !== adminRow.email;
const passwordChanged = password !== undefined;
const nameChanged = nameFlagPresent && (fullName || null) !== (adminRow.full_name ?? null);

if (!emailChanged && !passwordChanged && !nameChanged) {
  console.log("Nothing to update. Pass --email, --password, and/or --name.");
  process.exit(0);
}

const authUpdate = {};

if (emailChanged) {
  authUpdate.email = newEmail;
  authUpdate.email_confirm = true;
}

if (passwordChanged) {
  authUpdate.password = password;
}

if (nameFlagPresent) {
  authUpdate.user_metadata = { full_name: fullName || null };
}

const { error: authError } = await admin.auth.admin.updateUserById(
  adminRow.user_id,
  authUpdate
);

if (authError) {
  console.error("Unable to update the auth user:", authError.message);
  process.exit(1);
}

const recordUpdate = {};

if (emailChanged) recordUpdate.email = newEmail;
if (nameFlagPresent) recordUpdate.full_name = fullName || null;

if (Object.keys(recordUpdate).length > 0) {
  const { error: recordError } = await admin
    .from("admin_users")
    .update(recordUpdate)
    .eq("user_id", adminRow.user_id);

  if (recordError) {
    console.error(
      "The auth user was updated, but the admin_users record could not be synced:",
      recordError.message
    );
    process.exit(1);
  }
}

console.log(`Updated administrator ${adminRow.email}.`);
console.log(`  Login email: ${emailChanged ? `${adminRow.email} -> ${newEmail}` : "unchanged"}`);
console.log(`  Password:    ${passwordChanged ? "updated" : "unchanged"}`);
console.log(`  Display name:${nameChanged ? ` ${fullName || "(cleared)"}` : " unchanged"}`);
console.log("Sign out of the CRM and sign back in with the new credentials.");
