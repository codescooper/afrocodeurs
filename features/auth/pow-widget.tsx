"use client";

import { useEffect, useRef, useState } from "react";

type Phase = "idle" | "fetching" | "solving" | "ready" | "error";

const FETCH_TIMEOUT_MS = 10_000;
const SOLVE_TIMEOUT_MS = 60_000;

type PowWidgetProps = {
  enabled: boolean;
  onReadyChange?: (ready: boolean) => void;
};

/**
 * Widget de preuve de travail (Hashcash). Placé DANS un <form>, il :
 *  1. demande un challenge à `/api/pow`,
 *  2. le résout dans un Web Worker (UI non figée),
 *  3. injecte la preuve en champs cachés `pow-challenge` / `pow-nonce`,
 *     lus côté serveur par `verifyPoW` (cf. features/auth/actions.ts).
 *
 * L'activation est fournie par le serveur a chaque ouverture du formulaire.
 * Le calcul démarre au montage : il est presque toujours fini avant que
 * l'utilisateur ait rempli le formulaire.
 */
export function PowWidget({ enabled, onReadyChange }: PowWidgetProps) {
  const [phase, setPhase] = useState<Phase>(enabled ? "fetching" : "idle");
  const [challenge, setChallenge] = useState("");
  const [nonce, setNonce] = useState("");
  const [attempt, setAttempt] = useState(0);

  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    if (!enabled) {
      onReadyChange?.(true);
      return;
    }

    let cancelled = false;
    const abortController = new AbortController();
    let fetchTimeout: ReturnType<typeof setTimeout> | undefined;
    let solveTimeout: ReturnType<typeof setTimeout> | undefined;
    let expiryTimeout: ReturnType<typeof setTimeout> | undefined;
    onReadyChange?.(false);

    (async () => {
      try {
        fetchTimeout = setTimeout(() => abortController.abort(), FETCH_TIMEOUT_MS);
        const res = await fetch("/api/pow", {
          cache: "no-store",
          signal: abortController.signal,
        });
        if (!res.ok) throw new Error(`PoW HTTP ${res.status}`);
        const data = (await res.json()) as {
          enabled?: boolean;
          challenge?: string;
          difficulty?: number;
          expiresAt?: number;
        };
        clearTimeout(fetchTimeout);
        if (cancelled) return;
        if (!data.enabled || !data.challenge || !data.difficulty || !data.expiresAt || data.expiresAt <= Date.now()) throw new Error("PoW configuration or challenge unavailable");
        expiryTimeout = setTimeout(() => {
          onReadyChange?.(false);
          setNonce("");
          setPhase("fetching");
          setAttempt((current) => current + 1);
        }, Math.max(1, data.expiresAt - Date.now()));

        setChallenge(data.challenge);
        setPhase("solving");

        const worker = new Worker("/pow-worker.js");
        workerRef.current = worker;
        solveTimeout = setTimeout(() => {
          worker.terminate();
          workerRef.current = null;
          if (!cancelled) {
            setPhase("error");
            onReadyChange?.(false);
          }
        }, SOLVE_TIMEOUT_MS);
        worker.onmessage = (event: MessageEvent) => {
          if (cancelled) return;
          const msg = event.data as { type: string; nonce?: number };
          if (msg.type === "found" && typeof msg.nonce === "number") {
            clearTimeout(solveTimeout);
            setNonce(String(msg.nonce));
            setPhase("ready");
            onReadyChange?.(true);
            worker.terminate();
            workerRef.current = null;
          }
        };
        worker.onerror = () => {
          if (cancelled) return;
          clearTimeout(solveTimeout);
          setPhase("error");
          onReadyChange?.(false);
          worker.terminate();
          workerRef.current = null;
        };
        worker.postMessage({
          challenge: data.challenge,
          difficulty: data.difficulty,
        });
      } catch {
        clearTimeout(fetchTimeout);
        if (!cancelled) {
          setPhase("error");
          onReadyChange?.(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      abortController.abort();
      clearTimeout(fetchTimeout);
      clearTimeout(solveTimeout);
      clearTimeout(expiryTimeout);
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, [attempt, enabled, onReadyChange]);

  if (!enabled) return null;

  return (
    <div className="text-xs text-muted-foreground" aria-live="polite">
      {(phase === "fetching" || phase === "solving") && (
        <span className="inline-flex items-center gap-2">
          <span className="size-3 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
          Vérification anti-robot…
        </span>
      )}
      {phase === "ready" && <span className="text-emerald-600">✓ Preuve de travail validée</span>}
      {phase === "error" && (
        <span className="inline-flex flex-wrap items-center gap-2 text-destructive">
          Vérification indisponible. Tes saisies sont conservées.
          <button
            type="button"
            className="font-medium underline underline-offset-2"
            onClick={() => {
              setPhase("fetching");
              setChallenge("");
              setNonce("");
              onReadyChange?.(false);
              setAttempt((value) => value + 1);
            }}
          >
            Réessayer
          </button>
        </span>
      )}

      {/* Preuve transmise au serveur avec le formulaire. */}
      <input type="hidden" name="pow-challenge" value={challenge} readOnly />
      <input type="hidden" name="pow-nonce" value={nonce} readOnly />
    </div>
  );
}
