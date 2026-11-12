"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { LocateFixed } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createAfricaProjection } from "@/lib/africa-projection";
import styles from "./africa-presence-map.module.css";

type PresencePoint = { latitude: number; longitude: number; active: number; previous: number };

function project(latitude: number, longitude: number) {
  const projected = createAfricaProjection()([longitude, latitude]);
  return { x: projected?.[0] ?? 0, y: projected?.[1] ?? 0 };
}

export function AfricaPresenceMap({ mapGeometry, countryRanking }: { mapGeometry: ReactNode; countryRanking: Array<{ country: string; members: number }> }) {
  const [points, setPoints] = useState<PresencePoint[]>([]);
  const [message, setMessage] = useState("Le partage est facultatif. Ta position approximative reste affichée jusqu’à son retrait.");
  const [sharing, setSharing] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const allowSharing = useRef(false);
  const pendingPositions = useRef(new Set<Promise<Response>>());

  const refresh = useCallback(async () => {
    const response = await fetch("/api/presence", { cache: "no-store" });
    if (!response.ok) return;
    const data = (await response.json()) as { points: PresencePoint[] };
    setPoints(data.points);
  }, []);

  async function withdrawPresence() {
    allowSharing.current = false;
    setSharing(false);
    setWithdrawing(true);
    try {
      // Let already submitted heartbeats finish before deleting their stored point.
      await Promise.allSettled([...pendingPositions.current]);
      const response = await fetch("/api/presence", { method: "DELETE" });
      if (!response.ok) throw new Error("withdraw");
      setMessage("La position associée à ce navigateur a été retirée.");
      await refresh();
    } catch { setMessage("Impossible de retirer la position. Réessaie."); }
    finally { setWithdrawing(false); }
  }

  const sendPosition = useCallback(async (position: GeolocationPosition) => {
    if (!allowSharing.current) return;
    const request = fetch("/api/presence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
    });
    pendingPositions.current.add(request);
    let response: Response;
    try { response = await request; }
    finally { pendingPositions.current.delete(request); }
    if (!allowSharing.current) return;
    if (!response.ok) throw new Error("position");
    setSharing(true);
    setMessage("Tu es visible anonymement sur la carte.");
    await refresh();
  }, [refresh]);

  const enablePresence = useCallback(() => {
    if (!navigator.geolocation) {
      setMessage("La localisation n’est pas disponible sur cet appareil.");
      return;
    }
    setMessage("Demande de localisation en cours…");
    allowSharing.current = true;
    navigator.geolocation.getCurrentPosition(
      (position) => void sendPosition(position).catch(() => setMessage("Impossible d’enregistrer la position.")),
      () => setMessage("Localisation refusée. Aucune nouvelle position n’a été partagée."),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    );
  }, [sendPosition]);

  useEffect(() => {
    const initialRefresh = window.setTimeout(() => void refresh(), 0);
    const refreshTimer = window.setInterval(() => void refresh(), 30_000);
    return () => {
      window.clearTimeout(initialRefresh);
      window.clearInterval(refreshTimer);
    };
  }, [refresh]);

  useEffect(() => {
    if (!sharing) return;
    const pingTimer = window.setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => void sendPosition(position).catch(() => setMessage("Impossible d’actualiser la position.")),
        () => setSharing(false),
        { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
      );
    }, 60_000);
    return () => window.clearInterval(pingTimer);
  }, [sendPosition, sharing]);

  const totals = useMemo(() => points.reduce(
    (total, point) => ({ active: total.active + point.active, previous: total.previous + point.previous }),
    { active: 0, previous: 0 },
  ), [points]);

  return (
    <section className="mb-20 overflow-hidden rounded-3xl border border-border bg-[#f4b900] p-5 md:p-10">
      <div className="grid items-center gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-black/60">AfroCodeurs en direct</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-black md:text-5xl">Le continent code ensemble.</h2>
          <p className="mt-4 max-w-lg text-black/70">Toutes les positions partagées depuis le lancement sont représentées. Le vert indique une présence récente ; le gris, un partage plus ancien. Les positions sont approximatives et anonymes, sans lien avec les comptes membres.</p>
          <div className="mt-6 flex flex-wrap gap-5 text-sm font-semibold text-black">
            <span className="flex items-center gap-2"><i className="size-3 rounded-full bg-green-500 ring-4 ring-green-500/20" />{totals.active} présences récentes</span>
            <span className="flex items-center gap-2"><i className="size-3 rounded-full bg-neutral-500" />{totals.previous} précédemment</span>
          </div>
          <Button className="mt-7 gap-2" onClick={enablePresence} disabled={sharing || withdrawing}>
            <LocateFixed className="size-4" />{sharing ? "Présence activée" : "Me placer sur la carte"}
          </Button>
          <Button className="mt-3" variant="ghost" onClick={() => void withdrawPresence()} disabled={withdrawing}>
            {withdrawing ? "Retrait…" : "Retirer ma position"}
          </Button>
          <p className="mt-3 text-xs text-black/55" aria-live="polite">{message} Position arrondie à environ 50 km.</p>
          {countryRanking.length > 0 && <div className="mt-7 border-t border-black/15 pt-5"><p className="text-xs font-bold uppercase tracking-[.18em] text-black/60">AfroCodeurs dans le monde</p><ol className="mt-3 grid gap-2 sm:grid-cols-2">{countryRanking.map((item, index) => <li key={item.country} className="flex items-center justify-between gap-3 rounded-lg bg-black/5 px-3 py-2 text-sm text-black"><span><b className="mr-2 text-black/45">{index + 1}</b>{item.country}</span><strong>{item.members}</strong></li>)}</ol><p className="mt-2 text-xs text-black/50">Classement basé sur les pays renseignés volontairement dans les profils.</p></div>}
        </div>

        <svg className={styles.map} viewBox="0 0 720 750" role="img" aria-label="Carte des présences AfroCodeurs en Afrique">
          {mapGeometry}
          {points.map((point) => {
            const position = project(point.latitude, point.longitude);
            const active = point.active > 0;
            const count = point.active + point.previous;
            return (
              <g key={`${point.latitude}:${point.longitude}`} transform={`translate(${position.x} ${position.y})`}>
                {active && <circle className={styles.activeHalo} r="12" />}
                <circle className={active ? styles.active : styles.previous} r={count > 1 ? 9 : 6}>
                  <title>{`${point.active} présences récentes, ${point.previous} partages anciens`}</title>
                </circle>
                {count > 1 && <text className={styles.count} y="4">{count}</text>}
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
