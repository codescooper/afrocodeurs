"use client";

import { useEffect, useState } from "react";

export function VisitCounter() {
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      const response = await fetch("/api/visits", { method: "POST" });
      if (!response.ok) return;
      const data = (await response.json()) as { total: number };
      setTotal(data.total);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div>
      <div className="text-2xl font-bold text-primary" aria-live="polite">
        {total === null ? "—" : total.toLocaleString("fr-FR")}
      </div>
      <div className="text-sm text-muted-foreground">Visites</div>
    </div>
  );
}
