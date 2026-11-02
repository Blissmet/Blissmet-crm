import type { Metadata } from "next";

import { AppShell } from "@/components/layout/app-shell";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { admin, user } = await requireAdmin();

  return (
    <AppShell admin={admin} email={user.email ?? admin.email}>
      {children}
    </AppShell>
  );
}
