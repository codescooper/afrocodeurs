"use client";

import { useEffect } from "react";

import { captureException } from "@/lib/observability";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureException(error, {
      boundary: "app/global-error",
      digest: error.digest,
    });
  }, [error]);

  return (
    <html lang="fr">
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          margin: 0,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ textAlign: "center", padding: "1rem", maxWidth: 420 }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>
            Erreur critique
          </h1>
          <p style={{ color: "#666", fontSize: "0.875rem" }}>
            L&apos;application a rencontré un problème inattendu. Recharge la
            page.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              borderRadius: "0.375rem",
              background: "#111",
              color: "#fff",
              border: 0,
              cursor: "pointer",
            }}
          >
            Recharger
          </button>
        </div>
      </body>
    </html>
  );
}
