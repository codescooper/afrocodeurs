"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LocateFixed } from "lucide-react";

import { Button } from "@/components/ui/button";
import styles from "./africa-presence-map.module.css";

type PresencePoint = { latitude: number; longitude: number; active: number; previous: number };
const MAP = { minLongitude: -20, maxLongitude: 52, minLatitude: -37, maxLatitude: 38 };

function project(latitude: number, longitude: number) {
  return {
    x: ((longitude - MAP.minLongitude) / (MAP.maxLongitude - MAP.minLongitude)) * 720,
    y: ((MAP.maxLatitude - latitude) / (MAP.maxLatitude - MAP.minLatitude)) * 750,
  };
}

export function AfricaPresenceMap() {
  const [points, setPoints] = useState<PresencePoint[]>([]);
  const [message, setMessage] = useState("Active ta position pour apparaître en vert.");
  const [sharing, setSharing] = useState(false);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/presence", { cache: "no-store" });
    if (!response.ok) return;
    const data = (await response.json()) as { points: PresencePoint[] };
    setPoints(data.points);
  }, []);

  const sendPosition = useCallback(async (position: GeolocationPosition) => {
    const response = await fetch("/api/presence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
    });
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
    navigator.geolocation.getCurrentPosition(
      (position) => void sendPosition(position).catch(() => setMessage("Impossible d’enregistrer la position.")),
      () => setMessage("Autorisation refusée — tu restes invisible."),
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
        (position) => void sendPosition(position),
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
          <p className="mt-4 max-w-lg text-black/70">Chaque lumière verte représente une présence active. Les points gris montrent les zones visitées durant les 30 derniers jours.</p>
          <div className="mt-6 flex flex-wrap gap-5 text-sm font-semibold text-black">
            <span className="flex items-center gap-2"><i className="size-3 rounded-full bg-green-500 ring-4 ring-green-500/20" />{totals.active} en ligne</span>
            <span className="flex items-center gap-2"><i className="size-3 rounded-full bg-neutral-500" />{totals.previous} précédemment</span>
          </div>
          <Button className="mt-7 gap-2" onClick={enablePresence} disabled={sharing}>
            <LocateFixed className="size-4" />{sharing ? "Présence activée" : "Me placer sur la carte"}
          </Button>
          <p className="mt-3 text-xs text-black/55" aria-live="polite">{message} Position arrondie à environ 50 km.</p>
        </div>

        <svg className={styles.map} viewBox="0 0 720 750" role="img" aria-label="Carte des présences AfroCodeurs en Afrique">
          <path className={styles.land} d="M183 33 312 12l115 30 92 65 88 19 61 67-28 56-48 24-16 71-62 63-38 104-83 167-52 55-45-78-14-105-62-62-29-101-53-66-2-87-68-74 42-88 53-33Z" />
          <path className={styles.countryLines} d="M119 176h458M160 260l423 25M190 353l350 39M235 464l232 34M286 562l145 24M282 52l-17 426M383 41l-18 606M493 91l-55 413M570 151l-76 266" />
          {points.map((point) => {
            const position = project(point.latitude, point.longitude);
            const active = point.active > 0;
            const count = point.active + point.previous;
            return (
              <g key={`${point.latitude}:${point.longitude}`} transform={`translate(${position.x} ${position.y})`}>
                {active && <circle className={styles.activeHalo} r="12" />}
                <circle className={active ? styles.active : styles.previous} r={count > 1 ? 9 : 6}>
                  <title>{active ? `${point.active} en ligne` : `${point.previous} visite passée`}</title>
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
