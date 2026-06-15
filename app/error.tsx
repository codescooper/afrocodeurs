"use client";

import { useEffect } from "react";

import { captureException } from "@/lib/observability";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureException(error, { boundary: "app/error", digest: error.digest });
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-bold">Une erreur est survenue</h1>
      <p className="text-sm text-muted-foreground">
        Quelque chose s&apos;est mal passé de notre côté. Réessaie dans un
        instant.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Réessayer
      </button>
    </div>
  );
}
