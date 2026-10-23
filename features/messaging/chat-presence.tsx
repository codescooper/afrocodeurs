"use client";
import { useEffect } from "react";
import { CHAT_ACTIVE_MS, CHAT_HEARTBEAT_MS } from "./presence";

export function ChatPresenceHeartbeat() {
  useEffect(() => {
    let lastActivity = Date.now();
    const activity = () => { lastActivity = Date.now(); };
    const beat = () => {
      if (document.visibilityState !== "visible" || Date.now() - lastActivity >= CHAT_ACTIVE_MS) return;
      void fetch("/api/messages/presence", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }).catch(() => {});
    };
    window.addEventListener("pointerdown", activity);
    window.addEventListener("keydown", activity);
    window.addEventListener("focus", activity);
    document.addEventListener("visibilitychange", activity);
    beat();
    const timer = setInterval(beat, CHAT_HEARTBEAT_MS);
    return () => {
      clearInterval(timer);
      window.removeEventListener("pointerdown", activity);
      window.removeEventListener("keydown", activity);
      window.removeEventListener("focus", activity);
      document.removeEventListener("visibilitychange", activity);
    };
  }, []);
  return null;
}
