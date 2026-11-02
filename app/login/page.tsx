import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Files,
  LockKeyhole,
  ShieldCheck,
  Users,
} from "lucide-react";

import { Brand } from "@/components/brand";
import { LoginForm } from "@/components/auth/login-form";
import { signOutAction } from "@/lib/actions/auth";
import { getSessionContext } from "@/lib/auth";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { buttonStyles } from "@/components/ui/button";
import { safeNextPath } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Sign in",
};

type LoginPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const FEATURES = [
  {
    icon: Users,
    title: "A single client view",
    description: "Keep every profile, role, and contact detail organized.",
  },
  {
    icon: Files,
    title: "Secure document storage",
    description: "Private files with short-lived, admin-authorized access.",
  },
  {
    icon: ShieldCheck,
    title: "Enterprise access control",
    description: "Row-level security and manually provisioned accounts.",
  },
];

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const session = await getSessionContext();

  if (session.admin) {
    redirect("/dashboard");
  }

  const rawNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const nextPath = safeNextPath(rawNext);
  const accessDenied = Boolean(session.user && !session.admin);
  const email = session.user?.email ?? "";

  return (
    <div className="relative min-h-screen bg-surface lg:grid lg:grid-cols-[1.05fr_1fr]">
      <div className="absolute right-5 top-4 z-20 lg:right-8 lg:top-8">
        <AnimatedThemeToggler className="bg-surface/80 backdrop-blur" />
      </div>

      <aside className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-navy p-10 lg:flex xl:p-14">
        <div className="bg-grid-pattern absolute inset-0 opacity-70" aria-hidden="true" />
        <div
          className="absolute -right-36 top-20 h-80 w-80 rounded-full border border-blue-400/10"
          aria-hidden="true"
        />
        <div
          className="absolute -right-20 top-36 h-52 w-52 rounded-full border border-blue-400/10"
          aria-hidden="true"
        />

        <div className="relative z-10">
          <Brand variant="light" href="/login" />
        </div>

        <div className="relative z-10 max-w-lg">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-300/15 bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-blue-100">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-300" />
            Internal client operations
          </p>
          <h1 className="text-balance text-[38px] font-semibold leading-[1.14] tracking-[-0.035em] text-white xl:text-[44px]">
            Client relationships, managed with{" "}
            <span className="relative inline-block whitespace-nowrap">
              clarity.
              <svg
                className="pointer-events-none absolute -bottom-2 left-0 h-3.5 w-full overflow-visible"
                viewBox="0 0 220 18"
                fill="none"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  className="scribble-path"
                  pathLength="1"
                  d="M3 12.5C35 6.5 66 4.5 101 8.5c30 3.4 64 1.2 116-3.2"
                  stroke="url(#scribble-gradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  className="scribble-path scribble-path-delayed"
                  pathLength="1"
                  d="M8 16c42-5 88-4.5 136-2.5 24 .9 44 .3 68-2.2"
                  stroke="rgba(147, 197, 253, 0.55)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient
                    id="scribble-gradient"
                    x1="0"
                    y1="0"
                    x2="220"
                    y2="0"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#93c5fd" />
                    <stop offset="0.55" stopColor="#60a5fa" />
                    <stop offset="1" stopColor="#38bdf8" />
                  </linearGradient>
                </defs>
              </svg>
            </span>
          </h1>
          <p className="mt-5 max-w-md text-[14px] leading-6 text-slate-300">
            A focused workspace for your team to manage client records, keep
            sensitive documents secure, and stay on top of every relationship.
          </p>

          <div className="mt-10 space-y-5">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="flex gap-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-blue-200">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-[13px] font-medium text-white">
                      {feature.title}
                    </p>
                    <p className="mt-0.5 text-[12px] leading-5 text-slate-400">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-5 text-[11px] text-slate-500">
          <span>© {new Date().getFullYear()} Blissmet. All rights reserved.</span>
          <span className="inline-flex items-center gap-1.5">
            <LockKeyhole className="h-3 w-3" aria-hidden="true" />
            Protected workspace
          </span>
        </div>
      </aside>

      <main className="flex min-h-screen flex-col">
        <div className="flex h-16 items-center border-b border-ink-100 px-5 lg:hidden">
          <Brand href="/login" />
        </div>

        <div className="flex flex-1 items-center justify-center px-5 py-12 sm:px-8">
          <div className="w-full max-w-[400px] animate-fade-in">
            <div className="mb-8">
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl border border-brand-100 bg-brand-50 text-brand-600">
                <LockKeyhole className="h-5 w-5" aria-hidden="true" />
              </div>
              <h2 className="text-[26px] font-semibold tracking-[-0.03em] text-ink-900">
                {accessDenied ? "Access required" : "Welcome back"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-ink-500">
                {accessDenied
                  ? "Your account is authenticated, but it is not authorized for this CRM."
                  : "Sign in with your administrator account to continue."}
              </p>
            </div>

            {accessDenied ? (
              <div className="space-y-5">
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/50">
                  <p className="text-[13px] font-medium text-amber-900 dark:text-amber-200">
                    CRM access not provisioned
                  </p>
                  <p className="mt-1 text-[12px] leading-5 text-amber-800 dark:text-amber-300">
                    You are signed in as{" "}
                    <span className="font-medium">{email}</span>. Ask a
                    Blissmet administrator to add your account, or sign out and
                    use an authorized account.
                  </p>
                </div>

                <form action={signOutAction}>
                  <button
                    type="submit"
                    className={buttonStyles({
                      variant: "primary",
                      size: "lg",
                      className: "w-full",
                    })}
                  >
                    Sign out and use another account
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </form>

                <p className="text-center text-[11px] leading-5 text-ink-400">
                  For security, CRM data is only available to accounts listed in
                  the administrator directory.
                </p>
              </div>
            ) : (
              <>
                <LoginForm nextPath={nextPath} />
                <div className="mt-8 border-t border-ink-100 pt-5">
                  <p className="text-[11px] leading-5 text-ink-400">
                    Need access? Contact your CRM administrator. Public
                    registration is disabled.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="px-5 py-5 text-center text-[10px] text-ink-400 lg:hidden">
          © {new Date().getFullYear()} Blissmet CRM
        </div>
      </main>
    </div>
  );
}
