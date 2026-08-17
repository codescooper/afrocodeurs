"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { MessageCircle, MessagesSquare, Plus, X } from "lucide-react";
import { ChatRoom } from "./chat-room";

type Summary = {
  authenticated: boolean;
  currentUserId: string;
  verified: boolean;
  general: { id: string; updatedAt: string } | null;
  conversations: Array<{ id: string; title: string; image: string | null; preview: string; updatedAt: string; unread: number }>;
};

export function ChatDock() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [open, setOpen] = useState(false);
  const [generalUnread, setGeneralUnread] = useState(false);
  const refresh = useCallback(async () => {
    const response = await fetch("/api/messages/summary", { cache: "no-store" });
    if (!response.ok) { setSummary(null); return; }
    const next = await response.json() as Summary;
    setSummary(next);
    const lastSeen = localStorage.getItem("afrocodeurs:general-chat-seen");
    setGeneralUnread(Boolean(next.general && (!lastSeen || next.general.updatedAt > lastSeen)));
  }, []);

  useEffect(() => {
    const first = setTimeout(refresh, 0);
    const timer = setInterval(refresh, 10000);
    return () => { clearTimeout(first); clearInterval(timer); };
  }, [refresh]);

  if (!summary?.authenticated || !summary.general) return null;
  const unread = summary.conversations.reduce((total, item) => total + item.unread, 0);

  return <aside className="fixed bottom-20 right-3 z-40 flex max-w-[calc(100vw-1.5rem)] items-end gap-2 md:bottom-4 md:right-4 md:max-w-[calc(100vw-2rem)]" aria-label="Messagerie instantanée">
    {open && <section className="absolute bottom-16 right-0 max-h-[calc(100dvh-10rem)] w-[min(24rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-border bg-background shadow-2xl md:max-h-[calc(100dvh-6rem)] md:w-[min(24rem,calc(100vw-2rem))]">
      <header className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-3">
        <div><h2 className="font-semibold">Chat général</h2><p className="text-xs text-muted-foreground">Tous les membres connectés</p></div>
        <button type="button" onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-muted" aria-label="Fermer le chat"><X className="size-4" /></button>
      </header>
      {summary.verified ? <ChatRoom conversationId={summary.general.id} currentUserId={summary.currentUserId} initialMessages={[]} compact /> : <p className="p-6 text-sm text-muted-foreground">Confirmez votre adresse e-mail pour participer au chat général.</p>}
    </section>}

    <div className="hidden items-center gap-2 sm:flex">
      <Link href="/messages/new" title="Nouvelle conversation" className="grid size-10 place-items-center rounded-full border border-border bg-background shadow-lg hover:bg-muted"><Plus className="size-4" /></Link>
      {summary.conversations.slice(0, 3).reverse().map((conversation) => <Link key={conversation.id} href={`/messages/${conversation.id}`} title={`${conversation.title} — ${conversation.preview}`} className="relative grid size-11 place-items-center overflow-hidden rounded-full border-2 border-background bg-secondary text-xs font-bold shadow-lg">
        {conversation.image ? <span className="size-full bg-cover bg-center" style={{ backgroundImage: `url(${conversation.image})` }} /> : conversation.title.slice(0, 2).toUpperCase()}
        {conversation.unread > 0 && <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] text-destructive-foreground">{Math.min(conversation.unread, 99)}</span>}
      </Link>)}
    </div>
    <button type="button" onClick={() => setOpen((value) => { const next = !value; if (next && summary.general) { localStorage.setItem("afrocodeurs:general-chat-seen", summary.general.updatedAt); setGeneralUnread(false); } return next; })} className="relative grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-xl transition-transform hover:scale-105" aria-expanded={open} aria-label="Ouvrir le chat général">
      {open ? <MessagesSquare className="size-6" /> : <MessageCircle className="size-6" />}
      {unread > 0 && <span className="absolute -right-1 -top-1 grid min-h-6 min-w-6 place-items-center rounded-full bg-destructive px-1 text-xs text-destructive-foreground">{Math.min(unread, 99)}</span>}
      {unread === 0 && generalUnread && <span className="absolute right-0 top-0 size-3 rounded-full bg-destructive ring-2 ring-background" />}
    </button>
  </aside>;
}
