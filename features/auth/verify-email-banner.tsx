"use client";

import { useState, useTransition } from "react";

import { resendVerificationAction } from "@/features/auth/actions";

export function VerifyEmailBanner() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ done?: boolean; error?: string }>();

  function resend() {
    startTransition(async () => {
      const r = await resendVerificationAction();
      setResult(r ?? { error: "Échec de l'envoi." });
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
      {result?.done ? (
        <span>
          📧 Email de confirmation envoyé — vérifie ta boîte (et tes spams).
        </span>
      ) : (
        <>
          <span>Ton adresse email n&apos;est pas encore confirmée.</span>
          <button
            type="button"
            onClick={resend}
            disabled={pending}
            className="font-medium text-foreground underline disabled:opacity-50"
          >
            {pending ? "Envoi…" : "Renvoyer l'email"}
          </button>
        </>
      )}
      {result?.error && (
        <span className="text-destructive">{result.error}</span>
      )}
    </div>
  );
}
