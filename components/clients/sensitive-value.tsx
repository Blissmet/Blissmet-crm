"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { maskAadhaar } from "@/lib/utils";

export function SensitiveValue({ value }: { value: string | null }) {
  const [visible, setVisible] = useState(false);

  if (!value) return <span className="text-ink-400">—</span>;

  const formatted = value.replace(/(\d{4})(?=\d)/g, "$1 ");

  return (
    <span className="inline-flex items-center gap-2">
      <span className="font-mono text-[13px] tracking-wide text-ink-700">
        {visible ? formatted : maskAadhaar(value)}
      </span>
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className="rounded p-1 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 focus-visible:ring-2 focus-visible:ring-brand-500"
        aria-label={visible ? "Hide Aadhaar number" : "Show Aadhaar number"}
        title={visible ? "Hide Aadhaar number" : "Show Aadhaar number"}
      >
        {visible ? (
          <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
        ) : (
          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
        )}
      </button>
    </span>
  );
}
