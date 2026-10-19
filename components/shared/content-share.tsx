"use client";

import { useState } from "react";
import { Copy, MessageCircle, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { publicShareUrl, whatsappShareUrl } from "@/lib/content-share";

export function ContentShare({ title, path }: { title: string; path: string }) {
  const [message, setMessage] = useState("");
  const [fallbackUrl, setFallbackUrl] = useState("");

  function url() {
    return publicShareUrl(path, window.location.origin);
  }

  async function copy() {
    const href = url();
    try {
      await navigator.clipboard.writeText(href);
      setFallbackUrl("");
      setMessage("Lien copié.");
    } catch {
      setFallbackUrl(href);
      setMessage("Sélectionne le lien ci-dessous pour le copier.");
    }
  }

  async function share() {
    setMessage("");
    if (!navigator.share) return copy();
    try {
      await navigator.share({ title, url: url() });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      await copy();
    }
  }

  return (
    <div className="my-3">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Partager ce contenu">
        <Button type="button" variant="outline" size="sm" onClick={() => {
          window.open(whatsappShareUrl(title, url()), "_blank", "noopener,noreferrer");
        }}>
          <MessageCircle aria-hidden="true" /> WhatsApp
        </Button>
        <Button type="button" variant="ghost" size="icon" title="Partager" aria-label="Partager" onClick={share}>
          <Share2 aria-hidden="true" />
        </Button>
        <Button type="button" variant="ghost" size="icon" title="Copier le lien" aria-label="Copier le lien" onClick={copy}>
          <Copy aria-hidden="true" />
        </Button>
      </div>
      <p role="status" className="text-xs text-muted-foreground">{message}</p>
      {fallbackUrl && <input className="mt-2 w-full rounded-md border border-border p-2 text-sm" aria-label="Lien à copier" value={fallbackUrl} readOnly onFocus={(event) => event.currentTarget.select()} />}
    </div>
  );
}
