"use client";

import Script from "next/script";

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/**
 * Widget Cloudflare Turnstile. Placé DANS un <form>, il injecte un champ caché
 * `cf-turnstile-response` lu côté serveur. Sans clé publique → rien (dev).
 */
export function TurnstileWidget() {
  if (!siteKey) return null;
  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        async
        defer
      />
      <div className="cf-turnstile" data-sitekey={siteKey} data-theme="auto" />
    </>
  );
}
