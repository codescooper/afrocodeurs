"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

type Status = "idle" | "running" | "done";

const DIFFICULTIES = [12, 14, 16, 18, 20, 22];

/**
 * Démo interactive du proof-of-work (Hashcash). Tout se passe dans le
 * navigateur (Web Worker `/pow-worker.js`) : aucun secret ni serveur requis.
 * Objectif pédagogique — voir l'asymétrie « produire coûte / vérifier est
 * gratuit », et sentir le coût *exponentiel* en montant la difficulté.
 */
export default function PowLabPage() {
  const [difficulty, setDifficulty] = useState(18);
  const [status, setStatus] = useState<Status>("idle");
  const [attempts, setAttempts] = useState(0);
  const [ms, setMs] = useState(0);
  const [result, setResult] = useState<{ nonce: number; hash: string } | null>(
    null,
  );

  const workerRef = useRef<Worker | null>(null);
  const startRef = useRef(0);

  useEffect(() => () => workerRef.current?.terminate(), []);

  function run() {
    workerRef.current?.terminate();
    setStatus("running");
    setAttempts(0);
    setMs(0);
    setResult(null);

    // Challenge factice unique (en prod il est signé par le serveur).
    const rnd = crypto.getRandomValues(new Uint8Array(16));
    const salt = Array.from(rnd, (b) => b.toString(16).padStart(2, "0")).join("");
    const challenge = `demo:${salt}:${difficulty}`;

    startRef.current = performance.now();
    const worker = new Worker("/pow-worker.js");
    workerRef.current = worker;
    worker.onmessage = (event: MessageEvent) => {
      const msg = event.data as {
        type: string;
        attempts?: number;
        nonce?: number;
        hash?: string;
      };
      if (msg.type === "progress" && typeof msg.attempts === "number") {
        setAttempts(msg.attempts);
        setMs(performance.now() - startRef.current);
      } else if (msg.type === "found" && msg.hash) {
        setAttempts(msg.nonce! + 1);
        setMs(performance.now() - startRef.current);
        setResult({ nonce: msg.nonce!, hash: msg.hash });
        setStatus("done");
        worker.terminate();
      }
    };
    worker.postMessage({ challenge, difficulty });
  }

  const seconds = ms / 1000;
  const rate = seconds > 0 ? Math.round(attempts / seconds) : 0;
  const leadingZeros = result ? (result.hash.match(/^0*/)?.[0].length ?? 0) : 0;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 py-8">
      <div>
        <p className="text-sm font-medium text-accent">Labs · Recherche appliquée</p>
        <h1 className="text-2xl font-bold">Preuve de travail (Hashcash), en vrai</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Le navigateur cherche un <code>nonce</code> tel que{" "}
          <code>SHA-256(challenge:nonce)</code> commence par assez de zéros.
          Trouver coûte du temps ; <strong>vérifier ne coûte qu&apos;un seul
          hash</strong>. C&apos;est toute l&apos;astuce anti-bot — la même que
          sur notre{" "}
          <Link href="/register" className="underline">
            page d&apos;inscription
          </Link>
          .
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Difficulté : <strong>{difficulty} bits</strong> de zéro en tête
          <input
            type="range"
            min={DIFFICULTIES[0]}
            max={DIFFICULTIES[DIFFICULTIES.length - 1]}
            step={2}
            value={difficulty}
            onChange={(e) => setDifficulty(Number(e.target.value))}
            disabled={status === "running"}
            className="accent-primary"
          />
          <span className="text-xs text-muted-foreground">
            Chaque +1 bit double le travail attendu (~2^{difficulty} essais).
          </span>
        </label>

        <Button onClick={run} disabled={status === "running"} size="lg">
          {status === "running" ? "Calcul en cours…" : "Lancer le calcul"}
        </Button>

        <div className="grid grid-cols-3 gap-3 text-center text-sm">
          <Metric label="Essais" value={attempts.toLocaleString("fr-FR")} />
          <Metric label="Temps" value={`${seconds.toFixed(2)} s`} />
          <Metric
            label="Vitesse"
            value={rate ? `${rate.toLocaleString("fr-FR")} h/s` : "—"}
          />
        </div>

        {result && (
          <div className="flex flex-col gap-2 rounded-md bg-muted/50 p-3 text-sm">
            <div>
              <span className="text-muted-foreground">Nonce trouvé : </span>
              <strong>{result.nonce.toLocaleString("fr-FR")}</strong>
            </div>
            <div className="break-all font-mono text-xs">
              <span className="rounded bg-emerald-500/20 text-emerald-700">
                {result.hash.slice(0, leadingZeros)}
              </span>
              {result.hash.slice(leadingZeros)}
            </div>
            <p className="text-xs text-muted-foreground">
              Le serveur n&apos;a qu&apos;à refaire <em>ce</em> hash unique pour
              confirmer la preuve. Un robot, lui, devrait répéter les{" "}
              {attempts.toLocaleString("fr-FR")} essais à <em>chaque</em> requête.
            </p>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Astuce : relance en 12 puis en 22 bits pour sentir l&apos;explosion du
        coût. C&apos;est cette courbe qui ruine le spam de masse tout en restant
        indolore pour un humain.
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border p-2">
      <div className="text-lg font-bold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
