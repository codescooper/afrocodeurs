"use client";

import { useEffect, useRef, useState } from "react";

const enabled = process.env.NEXT_PUBLIC_POW_ENABLED === "true";

type Phase = "idle" | "fetching" | "solving" | "ready" | "skip" | "error";

/**
 * Widget de preuve de travail (Hashcash). Placé DANS un <form>, il :
 *  1. demande un challenge à `/api/pow`,
 *  2. le résout dans un Web Worker (UI non figée),
 *  3. injecte la preuve en champs cachés `pow-challenge` / `pow-nonce`,
 *     lus côté serveur par `verifyPoW` (cf. features/auth/actions.ts).
 *
 * Sans `NEXT_PUBLIC_POW_ENABLED="true"` → rien (no-op, comme Turnstile en dev).
 * Le calcul démarre au montage : il est presque toujours fini avant que
 * l'utilisateur ait rempli le formulaire.
 */
export function PowWidget() {
  const [phase, setPhase] = useState<Phase>(enabled ? "fetching" : "idle");
  const [challenge, setChallenge] = useState("");
  const [nonce, setNonce] = useState("");

  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/pow", { cache: "no-store" });
        const data = (await res.json()) as {
          enabled?: boolean;
          challenge?: string;
          difficulty?: number;
        };
        if (cancelled) return;
        if (!data.enabled || !data.challenge || !data.difficulty) {
          setPhase("skip"); // serveur non activé : on laisse passer
          return;
        }

        setChallenge(data.challenge);
        setPhase("solving");

        const worker = new Worker("/pow-worker.js");
        workerRef.current = worker;
        worker.onmessage = (event: MessageEvent) => {
          const msg = event.data as { type: string; nonce?: number };
          if (msg.type === "found" && typeof msg.nonce === "number") {
            setNonce(String(msg.nonce));
            setPhase("ready");
            worker.terminate();
          }
        };
        worker.onerror = () => {
          setPhase("error");
          worker.terminate();
        };
        worker.postMessage({
          challenge: data.challenge,
          difficulty: data.difficulty,
        });
      } catch {
        if (!cancelled) setPhase("error");
      }
    })();

    return () => {
      cancelled = true;
      workerRef.current?.terminate();
    };
  }, []);

  if (!enabled) return null;

  return (
    <div className="text-xs text-muted-foreground" aria-live="polite">
      {(phase === "fetching" || phase === "solving") && (
        <span className="inline-flex items-center gap-2">
          <span className="size-3 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
          Vérification anti-robot…
        </span>
      )}
      {phase === "ready" && <span className="text-emerald-600">✓ Vérifié</span>}
      {phase === "error" && (
        <span className="text-destructive">
          Vérification indisponible — tu peux quand même envoyer.
        </span>
      )}

      {/* Preuve transmise au serveur avec le formulaire. */}
      <input type="hidden" name="pow-challenge" value={challenge} readOnly />
      <input type="hidden" name="pow-nonce" value={nonce} readOnly />
    </div>
  );
}
