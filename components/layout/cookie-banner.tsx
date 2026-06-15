"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "ac-cookie-consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Déféré pour éviter un setState synchrone dans l'effet (lint react-hooks).
    const t = setTimeout(() => {
      try {
        if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
      } catch {
        /* localStorage indisponible : on n'affiche rien */
      }
    }, 0);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  function accept() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 p-4 backdrop-blur md:inset-x-auto md:bottom-4 md:left-1/2 md:w-[min(40rem,90vw)] md:-translate-x-1/2 md:rounded-lg md:border">
      <div className="flex flex-col gap-3 text-sm md:flex-row md:items-center md:justify-between">
        <p className="text-muted-foreground">
          On utilise uniquement des cookies nécessaires au fonctionnement (ta
          session de connexion). Aucun pistage publicitaire.{" "}
          <Link href="/confidentialite" className="underline">
            En savoir plus
          </Link>
          .
        </p>
        <button
          type="button"
          onClick={accept}
          className="shrink-0 rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground"
        >
          J&apos;ai compris
        </button>
      </div>
    </div>
  );
}
