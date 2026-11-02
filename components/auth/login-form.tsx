"use client";

import { useActionState, useState } from "react";
import { AlertCircle, Eye, EyeOff, LockKeyhole } from "lucide-react";

import { signInAction } from "@/lib/actions/auth";
import { INITIAL_LOGIN_FORM_STATE } from "@/lib/actions/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [state, formAction, pending] = useActionState(
    signInAction,
    INITIAL_LOGIN_FORM_STATE
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input type="hidden" name="next" value={nextPath} />

      {state.error ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-[13px] leading-5 text-red-700 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-300"
        >
          <AlertCircle
            className="mt-0.5 h-4 w-4 shrink-0"
            aria-hidden="true"
          />
          <span>{state.error}</span>
        </div>
      ) : null}

      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="text-[13px] font-medium text-ink-700"
        >
          Email address
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="admin@company.com"
          required
          autoFocus
          className="h-11"
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="text-[13px] font-medium text-ink-700"
        >
          Password
        </label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter your password"
            required
            className="h-11 pr-11"
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-md text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        className="h-11 w-full"
        loading={pending}
        loadingText="Signing in..."
      >
        <LockKeyhole className="h-4 w-4" aria-hidden="true" />
        Sign in to workspace
      </Button>

      <p className="text-center text-[11px] leading-5 text-ink-400">
        Access is restricted to manually authorized administrators.
      </p>
    </form>
  );
}
