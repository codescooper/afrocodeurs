"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

type TurnstileApi = {
  render: (container: HTMLElement, options: {
    sitekey: string; theme: string; "response-field": boolean;
    callback: (token: string) => void;
    "expired-callback": () => void;
    "error-callback": () => void;
  }) => string;
  remove: (id: string) => void;
  reset: (id: string) => void;
};
function getApi() { return (window as Window & { turnstile?: TurnstileApi }).turnstile; }

export function TurnstileWidget({ siteKey, onReadyChange }: {
  siteKey: string | null; onReadyChange?: (ready: boolean) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const active = useRef(false);
  const generation = useRef(0);
  const deadline = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [token, setToken] = useState("");
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const invalidateCallbacks = useCallback(() => { generation.current++; }, []);
  const fail = useCallback(() => {
    if (!active.current) return;
    clearTimeout(deadline.current);
    setToken(""); setFailed(true); onReadyChange?.(false);
  }, [onReadyChange]);
  const renderWidget = useCallback(() => {
    const api = getApi();
    if (!active.current || !siteKey || !api || !container.current || widget.current !== null) return;
    const current = ++generation.current;
    try {
      widget.current = api.render(container.current, {
        sitekey: siteKey, theme: "auto", "response-field": false,
        callback: (value) => {
          if (!active.current || generation.current !== current) return;
          clearTimeout(deadline.current);
          setToken(value); setFailed(false); onReadyChange?.(Boolean(value));
        },
        "expired-callback": () => {
          if (!active.current || generation.current !== current) return;
          setToken(""); onReadyChange?.(false);
          if (widget.current !== null) api.reset(widget.current);
        },
        "error-callback": () => { if (generation.current === current) fail(); },
      });
    } catch { fail(); }
  }, [siteKey, onReadyChange, fail]);
  useEffect(() => {
    active.current = true;
    if (!siteKey) { onReadyChange?.(true); return () => { active.current = false; }; }
    onReadyChange?.(false);
    const timer = setTimeout(renderWidget, 0);
    deadline.current = setTimeout(fail, 60_000);
    return () => {
      active.current = false;
      invalidateCallbacks();
      clearTimeout(timer); clearTimeout(deadline.current);
      if (widget.current !== null) getApi()?.remove(widget.current);
      widget.current = null;
    };
  }, [attempt, siteKey, onReadyChange, renderWidget, fail, invalidateCallbacks]);
  if (!siteKey) return null;
  return <>
    <Script src={`https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&retry=${attempt}`}
      async defer onReady={renderWidget} onError={fail} />
    <div ref={container} />
    <input type="hidden" name="cf-turnstile-response" value={token} readOnly />
    {failed && <p role="alert" className="text-sm text-destructive">
      La vérification Cloudflare n&apos;a pas abouti. Tes saisies sont conservées.{" "}
      <button type="button" className="underline" onClick={() => {
        setFailed(false); setToken(""); onReadyChange?.(false);
        setAttempt((current) => current + 1);
      }}>Réessayer la vérification</button>
    </p>}
  </>;
}
