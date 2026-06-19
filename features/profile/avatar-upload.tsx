"use client";

import { useRef, useState, useTransition } from "react";
import type { ChangeEvent } from "react";

import { Avatar } from "@/components/shared/avatar";
import { updateAvatarAction } from "./actions";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Lit un fichier image, recadre en carré 256px et renvoie un data URL JPEG léger. */
async function toAvatarDataUrl(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas indisponible");
    const scale = Math.max(size / img.width, size / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
    return canvas.toDataURL("image/jpeg", 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function AvatarUpload({
  initialImage,
  name,
}: {
  initialImage: string | null;
  name: string;
}) {
  const [image, setImage] = useState(initialImage);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function onPick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(undefined);
    startTransition(async () => {
      try {
        const dataUrl = await toAvatarDataUrl(file);
        const res = await updateAvatarAction(dataUrl);
        if (res?.error) setError(res.error);
        else setImage(dataUrl);
      } catch {
        setError("Impossible de lire cette image.");
      }
    });
  }

  function remove() {
    startTransition(async () => {
      await updateAvatarAction(null);
      setImage(null);
    });
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar image={image} name={name} size={72} />
      <div className="flex flex-col items-start gap-1">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={onPick}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
          className="rounded-md border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
        >
          {pending ? "Envoi…" : "Changer la photo"}
        </button>
        {image && (
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className="text-xs text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
          >
            Retirer la photo
          </button>
        )}
        {error && <p className="text-xs text-destructive">{error}</p>}
        <p className="text-xs text-muted-foreground">
          Recadrée en carré automatiquement (JPEG/PNG).
        </p>
      </div>
    </div>
  );
}
