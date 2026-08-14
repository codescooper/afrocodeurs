"use client";

import { useState, type ComponentPropsWithoutRef } from "react";

export function MarkdownImage({ src, alt, ...props }: ComponentPropsWithoutRef<"img">) {
  const [unavailable, setUnavailable] = useState(false);

  if (!src || unavailable) {
    return (
      <span className="markdown-image-unavailable" role="status">
        Image indisponible{alt ? ` : ${alt}` : ""}
      </span>
    );
  }

  return (
    // Les articles acceptent des images locales ou distantes aux dimensions inconnues.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...props}
      src={src}
      alt={alt ?? ""}
      loading="lazy"
      decoding="async"
      onError={() => setUnavailable(true)}
    />
  );
}
