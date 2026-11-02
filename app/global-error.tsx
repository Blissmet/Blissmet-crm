"use client";

import { RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
          color: "#0f172a",
          fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          padding: "24px",
        }}
      >
        <main style={{ maxWidth: "420px", textAlign: "center" }}>
          <p
            style={{
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#64748b",
            }}
          >
            Blissmet CRM
          </p>
          <h1
            style={{
              marginTop: "8px",
              fontSize: "26px",
              fontWeight: 600,
              letterSpacing: "-0.03em",
            }}
          >
            The application encountered an error
          </h1>
          <p
            style={{
              marginTop: "8px",
              fontSize: "13px",
              lineHeight: 1.6,
              color: "#475569",
            }}
          >
            Reload the application to continue. If the problem persists, contact
            your CRM administrator.
          </p>
          {error.digest ? (
            <p
              style={{
                marginTop: "12px",
                fontFamily: "ui-monospace, monospace",
                fontSize: "10px",
                color: "#94a3b8",
              }}
            >
              Reference: {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "24px",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              height: "40px",
              padding: "0 16px",
              borderRadius: "8px",
              border: "none",
              background: "#1d4ed8",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <RefreshCw size={16} aria-hidden="true" />
            Reload application
          </button>
        </main>
      </body>
    </html>
  );
}
