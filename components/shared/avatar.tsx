"use client";

import { useState } from "react";

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((w) => w[0]).join("");
  return (letters || name[0] || "?").toUpperCase();
}

/** Avatar d'un membre : photo si présente, sinon initiales sur fond de marque. */
export function Avatar({
  image,
  name,
  size = 40,
}: {
  image?: string | null;
  name: string;
  size?: number;
}) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  return (
    <span
      role="img"
      aria-label={name}
      className="relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 font-semibold text-primary"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
    >
      {initialsOf(name)}
      {image && failedImage !== image && (
        // User uploads and inline avatars must also work without image optimization.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" onError={() => setFailedImage(image)} className="absolute inset-0 size-full object-cover" />
      )}
    </span>
  );
}
