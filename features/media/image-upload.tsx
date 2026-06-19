"use client";

import { useRef, useState, useTransition } from "react";
import type { ChangeEvent } from "react";
import { ImagePlus } from "lucide-react";

/**
 * Bouton d'upload d'image : envoie le fichier à `POST /api/upload`, puis remonte
 * l'URL publique (et un nom dérivé) au parent via `onUploaded`. Réutilisable
 * partout où l'on veut insérer une image (éditeurs Markdown, etc.).
 */
export function ImageUploadButton({
  onUploaded,
  label = "Image",
}: {
  onUploaded: (url: string, name: string) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function onPick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(undefined);
    startTransition(async () => {
      try {
        const body = new FormData();
        body.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body });
        const data: { url?: string; error?: string } = await res
          .json()
          .catch(() => ({}));
        if (!res.ok || !data.url) {
          setError(data.error ?? "Échec de l'upload.");
          return;
        }
        const name = file.name.replace(/\.[^.]+$/, "") || "image";
        onUploaded(data.url, name);
      } catch {
        setError("Échec de l'upload.");
      } finally {
        if (inputRef.current) inputRef.current.value = "";
      }
    });
  }

  return (
    <span className="inline-flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={onPick}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={pending}
        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground underline transition-colors hover:text-foreground disabled:opacity-50"
      >
        <ImagePlus className="size-3.5" />
        {pending ? "Envoi…" : label}
      </button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </span>
  );
}
