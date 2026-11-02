"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";

import { signOutAction } from "@/lib/actions/auth";
import type { AdminRow } from "@/types/database";
import { cn, getInitialsFromName } from "@/lib/utils";
import { Brand } from "@/components/brand";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { buttonStyles } from "@/components/ui/button";
import { ToastProvider } from "@/components/ui/toast";

type AppShellProps = {
  admin: AdminRow;
  email: string;
  children: ReactNode;
};

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    isActive: (pathname: string) => pathname === "/dashboard",
  },
  {
    label: "Clients",
    href: "/clients",
    icon: Users,
    isActive: (pathname: string) =>
      pathname === "/clients" || pathname.startsWith("/clients/"),
  },
];

function getPageContext(pathname: string) {
  if (pathname === "/dashboard") return "Dashboard";
  if (pathname === "/clients") return "Clients";
  if (pathname === "/clients/new") return "Clients / New client";
  if (/^\/clients\/[^/]+\/edit$/.test(pathname)) return "Clients / Edit client";
  if (/^\/clients\/[^/]+$/.test(pathname)) return "Clients / Client profile";
  return "Workspace";
}

function SidebarContent({
  admin,
  email,
  pathname,
  onNavigate,
}: {
  admin: AdminRow;
  email: string;
  pathname: string;
  onNavigate?: () => void;
}) {
  const displayName = admin.full_name?.trim() || email.split("@")[0];

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center border-b border-ink-100 px-5">
        <Brand />
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-5">
        <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500">
          Workspace
        </p>
        <nav className="mt-2 space-y-1" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => {
            const active = item.isActive(pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex h-10 items-center gap-3 rounded-lg px-3 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-ink-600 hover:bg-ink-50 hover:text-ink-900"
                )}
              >
                <Icon
                  className={cn(
                    "h-[17px] w-[17px]",
                    active
                      ? "text-brand-600"
                      : "text-ink-400 group-hover:text-ink-600"
                  )}
                  strokeWidth={active ? 2.2 : 1.9}
                  aria-hidden="true"
                />
                <span className="flex-1">{item.label}</span>
                {active ? (
                  <ChevronRight
                    className="h-3.5 w-3.5 text-brand-400"
                    aria-hidden="true"
                  />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="my-5 border-t border-ink-100" />

        <div className="rounded-xl border border-ink-100 bg-ink-50/70 p-3.5">
          <div className="flex items-center gap-2 text-ink-700">
            <ShieldCheck className="h-4 w-4 text-brand-600" aria-hidden="true" />
            <p className="text-[12px] font-semibold">Secure workspace</p>
          </div>
          <p className="mt-1.5 text-[11px] leading-[17px] text-ink-500">
            Client records and documents are protected by admin-only access.
          </p>
        </div>
      </div>

      <div className="shrink-0 border-t border-ink-100 p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy text-[11px] font-semibold text-white">
            {getInitialsFromName(displayName)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-semibold text-ink-800">
              {displayName}
            </p>
            <p className="truncate text-[11px] text-ink-500">{email}</p>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 focus-visible:ring-2 focus-visible:ring-brand-500"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
        </div>
        <p className="px-2 pt-1 text-[10px] text-ink-500">
          Blissmet CRM · Administrator
        </p>
      </div>
    </div>
  );
}

export function AppShell({ admin, email, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const mobileNavRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!mobileOpen) return;

    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const focusTimer = window.setTimeout(
      () => closeButtonRef.current?.focus(),
      50
    );

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileOpen(false);
        return;
      }

      if (event.key !== "Tab" || !mobileNavRef.current) return;

      const focusable = Array.from(
        mobileNavRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => element.offsetParent !== null);

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [mobileOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = search.trim();
    router.push(query ? `/clients?q=${encodeURIComponent(query)}` : "/clients");
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-ink-50">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-brand-700 focus:shadow-elevated focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          Skip to content
        </a>

        <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] border-r border-ink-200 bg-surface lg:block">
          <SidebarContent admin={admin} email={email} pathname={pathname} />
        </aside>

        {mobileOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
            />
            <aside
              ref={mobileNavRef}
              id="mobile-navigation"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation"
              className="absolute inset-y-0 left-0 w-[280px] animate-fade-in border-r border-ink-200 bg-surface shadow-elevated"
            >
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100 hover:text-ink-700 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                aria-label="Close navigation"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
              <SidebarContent
                admin={admin}
                email={email}
                pathname={pathname}
                onNavigate={() => setMobileOpen(false)}
              />
            </aside>
          </div>
        ) : null}

        <div className="lg:pl-[260px]">
          <header className="sticky top-0 z-20 border-b border-ink-200 bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/90">
            <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
              <button
                ref={menuButtonRef}
                type="button"
                onClick={() => setMobileOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100 hover:text-ink-900 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 lg:hidden"
                aria-label="Open navigation"
                aria-expanded={mobileOpen}
                aria-controls="mobile-navigation"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </button>

              <div className="lg:hidden">
                <Brand compact />
              </div>

              <p className="hidden min-w-0 items-center gap-1.5 truncate text-[12px] font-medium text-ink-500 lg:flex">
                <span>Workspace</span>
                <ChevronRight className="h-3 w-3" aria-hidden="true" />
                <span className="text-ink-700">{getPageContext(pathname)}</span>
              </p>

              <div className="ml-auto flex items-center gap-2">
                <form
                  onSubmit={handleSearch}
                  role="search"
                  className="relative hidden w-56 sm:block md:w-64"
                >
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search clients..."
                    aria-label="Search clients"
                    className="h-9 w-full rounded-lg border border-ink-200 bg-ink-50/60 pl-9 pr-3 text-[12px] text-ink-800 outline-none transition placeholder:text-ink-400 focus:border-brand-400 focus:bg-surface focus:ring-4 focus:ring-brand-500/10"
                  />
                </form>

                <AnimatedThemeToggler />

                {pathname !== "/clients/new" ? (
                  <>
                    <Link
                      href="/clients/new"
                      className={buttonStyles({
                        variant: "primary",
                        size: "md",
                        className:
                          "hidden shadow-md shadow-brand-600/15 sm:inline-flex",
                      })}
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                      Add client
                    </Link>
                    <Link
                      href="/clients/new"
                      className={buttonStyles({
                        variant: "primary",
                        size: "icon",
                        className:
                          "shadow-md shadow-brand-600/15 sm:hidden",
                      })}
                      aria-label="Add client"
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </>
                ) : null}
              </div>
            </div>
          </header>

          <main
            id="main-content"
            tabIndex={-1}
            className="mx-auto w-full max-w-[1480px] px-4 py-6 focus:outline-none sm:px-6 sm:py-8 lg:px-8"
          >
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
