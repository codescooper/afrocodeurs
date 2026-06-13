"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

import { cn } from "@/lib/utils";
import { markNotificationsReadAction } from "@/features/notifications/actions";

type Notif = {
  id: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

const POLL_MS = 15000;

/** Cloche de notifications : badge de non-lues, panneau, et toasts en temps réel (polling). */
export function NotificationBell() {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; title: string }[]>([]);
  const seen = useRef<Set<string>>(new Set());
  const initialized = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const poll = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data: { unreadCount: number; notifications: Notif[] } =
        await res.json();
      setCount(data.unreadCount);
      setItems(data.notifications);

      // Toasts pour les nouvelles non-lues — mais pas au tout premier chargement.
      const fresh = data.notifications.filter(
        (n) => !n.read && !seen.current.has(n.id),
      );
      data.notifications.forEach((n) => seen.current.add(n.id));
      if (initialized.current && fresh.length > 0) {
        setToasts((t) => [
          ...t,
          ...fresh.map((n) => ({ id: n.id, title: n.title })),
        ]);
        fresh.forEach((n) =>
          setTimeout(
            () => setToasts((t) => t.filter((x) => x.id !== n.id)),
            6000,
          ),
        );
      }
      initialized.current = true;
    } catch {
      /* réseau indisponible — on retentera au prochain tick */
    }
  }, []);

  useEffect(() => {
    const first = setTimeout(poll, 0); // différé : le premier chargement
    const iv = setInterval(poll, POLL_MS);
    const onVisible = () => {
      if (!document.hidden) poll();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(first);
      clearInterval(iv);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [poll]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const markAllRead = async () => {
    await markNotificationsReadAction();
    setCount(0);
    setItems((it) => it.map((n) => ({ ...n, read: true })));
  };

  return (
    <div ref={containerRef} className="relative">
      <style>{`@keyframes nb-up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${count > 0 ? ` (${count} non lues)` : ""}`}
        className="relative flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <Bell className="size-5" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-lg border border-border bg-background shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <span className="text-sm font-semibold">Notifications</span>
            {count > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Tout marquer lu
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                Aucune notification.
              </p>
            ) : (
              items.map((n) => {
                const inner = (
                  <span className="flex flex-col gap-0.5">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      {!n.read && (
                        <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                      )}
                      {n.title}
                    </span>
                    <span className="line-clamp-2 text-xs text-muted-foreground">
                      {n.body}
                    </span>
                  </span>
                );
                const className = cn(
                  "block border-b border-border px-4 py-3 last:border-0 hover:bg-muted/50",
                  !n.read && "bg-primary/5",
                );
                return n.link ? (
                  <Link
                    key={n.id}
                    href={n.link}
                    className={className}
                    onClick={() => setOpen(false)}
                  >
                    {inner}
                  </Link>
                ) : (
                  <div key={n.id} className={className}>
                    {inner}
                  </div>
                );
              })
            )}
          </div>
          <Link
            href="/dashboard/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-border px-4 py-2 text-center text-xs font-medium hover:bg-muted/50"
          >
            Voir toutes les notifications
          </Link>
        </div>
      )}

      {/* Toasts « push up » */}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{ animation: "nb-up 0.25s ease-out" }}
            className="pointer-events-auto flex max-w-xs items-center gap-2 rounded-lg border border-border bg-background px-4 py-3 shadow-lg"
          >
            <Bell className="size-4 shrink-0 text-primary" />
            <span className="text-sm font-medium">{t.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
