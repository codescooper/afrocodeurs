"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ExternalLink, MessageCircle, Minus, Plus, X } from "lucide-react";
import { ChatRoom } from "./chat-room";
import { Avatar } from "@/components/shared/avatar";
import { ChatDirectory } from "./chat-directory";
import { ChatPresenceHeartbeat } from "./chat-presence";
import { bubbleVisible } from "./bubbles";

export type DockConversation = { id: string; title: string; image: string | null; href?: string; preview: string; updatedAt: string; unread: number; lastMessageAuthorId?: string | null };
type Conversation = DockConversation;
type Summary = { authenticated: boolean; currentUserId: string; verified: boolean; general: { id: string; updatedAt: string } | null; conversations: Conversation[] };

export function ChatDock() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/messages/summary", { cache: "no-store" });
      if (response.status === 401) { setSummary(null); return; }
      if (response.ok) setSummary(await response.json() as Summary);
    } catch { /* Keep the window during a temporary network failure. */ }
  }, []);
  useEffect(() => {
    const first = setTimeout(refresh, 0);
    const timer = setInterval(refresh, 10000);
    return () => { clearTimeout(first); clearInterval(timer); };
  }, [refresh]);
  return summary?.authenticated && summary.general ? <DockSession key={summary.currentUserId} summary={summary} refresh={refresh} /> : null;
}

// Root-layout state keeps mounted windows and drafts across client navigation.
function DockSession({ summary, refresh }: { summary: Summary; refresh: () => Promise<void> }) {
  const [active, setActive] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Conversation[]>([]);
  const [unavailable, setUnavailable] = useState<string[]>([]);
  const [seenGeneral, setSeenGeneral] = useState<string | null>(null);
  const [directoryOpen, setDirectoryOpen] = useState(false);
  const storageKey = `afrocodeurs:chat-dismissed:${summary.currentUserId}`;
  const [dismissed, setDismissed] = useState<Record<string, string>>(() => {
    try {
      const data = JSON.parse(sessionStorage.getItem(storageKey) ?? "{}");
      return data && typeof data === "object" && !Array.isArray(data) ? Object.fromEntries(Object.entries(data).filter(([id, value]) => id.length < 150 && typeof value === "string").slice(-200)) as Record<string, string> : {};
    } catch { return {}; }
  });
  const conversations = summary.conversations.filter((item) => !unavailable.includes(item.id));
  const unread = conversations.reduce((total, item) => total + item.unread, 0);
  const general = summary.general!;
  function open(conversation: Conversation) {
    setDirectoryOpen(false);
    setDismissed((current) => {
      if (!(conversation.id in current)) return current;
      const next = { ...current };
      delete next[conversation.id];
      try { sessionStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* Storage is optional. */ }
      return next;
    });
    setRooms((current) => current.some((room) => room.id === conversation.id) ? current : [...current, conversation]);
    setActive(conversation.id);
    if (conversation.id === general.id) setSeenGeneral(general.updatedAt);
  }
  function closeBubble(conversation: Conversation) {
    setDismissed((current) => {
      const next = Object.fromEntries(Object.entries({ ...current, [conversation.id]: conversation.updatedAt }).slice(-200));
      try { sessionStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* Private browsing may disable storage. */ }
      return next;
    });
    dismiss(conversation.id);
  }
  function dismiss(id: string) {
    setRooms((current) => current.filter((room) => room.id !== id));
    setActive((current) => current === id ? null : current);
    void refresh();
  }
  return <aside className="fixed bottom-20 right-3 z-40 flex max-w-[calc(100vw-1.5rem)] items-end gap-2 md:bottom-4 md:right-4" aria-label="Messagerie instantanée">
    <ChatPresenceHeartbeat />
    {directoryOpen && <ChatDirectory recent={conversations} onClose={() => setDirectoryOpen(false)} onGeneral={() => open({ id: general.id, title: "Chat général", image: null, preview: "", updatedAt: general.updatedAt, unread: 0 })} onConversation={open} />}
    {rooms.map((room) => {
      const latest = conversations.find((item) => item.id === room.id) ?? room;
      return <section key={room.id} hidden={active !== room.id} aria-label={`Discussion : ${latest.title}`} className="absolute bottom-16 right-0 w-[min(24rem,calc(100vw-1.5rem))] overflow-hidden rounded-lg border border-border bg-background shadow-2xl">
        <header className="flex items-center gap-2 border-b border-border bg-muted/50 px-3 py-2">
          <Avatar image={latest.image} name={latest.title} size={32} /><h2 className="min-w-0 flex-1 truncate text-sm font-semibold">{latest.title}</h2>
          <Link href={latest.href ?? `/messages/${room.id}`} onClick={() => setActive(null)} title="Ouvrir la page complète" aria-label="Ouvrir la page complète" className="rounded p-2 hover:bg-muted"><ExternalLink className="size-4" /></Link>
          <button type="button" onClick={() => setActive(null)} title="Réduire la discussion" aria-label="Réduire la discussion" className="rounded p-2 hover:bg-muted"><Minus className="size-4" /></button>
          <button type="button" onClick={() => closeBubble(latest)} title="Fermer la discussion" aria-label="Fermer la discussion" className="rounded p-2 hover:bg-muted"><X className="size-4" /></button>
        </header>
        {summary.verified ? <ChatRoom conversationId={room.id} currentUserId={summary.currentUserId} initialMessages={[]} compact paused={active !== room.id} onUnavailable={() => { setUnavailable((current) => [...new Set([...current, room.id])]); dismiss(room.id); }} /> : <p className="p-6 text-sm text-muted-foreground">Confirmez votre adresse e-mail pour participer.</p>}
      </section>;
    })}
    <div className="flex items-center gap-2">
      <Link href="/messages/new" title="Nouvelle conversation" aria-label="Nouvelle conversation" className="grid size-10 shrink-0 place-items-center rounded-full border border-border bg-background shadow-lg hover:bg-muted"><Plus className="size-4" /></Link>
      {conversations.filter((item) => bubbleVisible(item, dismissed, summary.currentUserId)).slice(0, 3).reverse().map((conversation) => <div key={conversation.id} className="relative size-11 shrink-0"><button type="button" onClick={() => open(conversation)} aria-label={conversation.title} aria-expanded={active === conversation.id} title={`${conversation.title} : ${conversation.preview}`} className="relative grid size-11 shrink-0 place-items-center rounded-full border-2 border-background bg-background shadow-lg">
        <Avatar image={conversation.image} name={conversation.title} size={40} />
        {conversation.unread > 0 && <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] text-destructive-foreground">{Math.min(conversation.unread, 99)}</span>}
      </button><button type="button" onClick={() => closeBubble(conversation)} title={`Fermer la bulle ${conversation.title}`} aria-label={`Fermer la bulle ${conversation.title}`} className="absolute -left-1 -top-2 z-10 grid size-6 place-items-center rounded-full border border-border bg-popover text-popover-foreground shadow"><X className="size-3" /></button></div>)}
    </div>
    <button type="button" onClick={() => { setDirectoryOpen((current) => !current); setActive(null); }} title="Discussions" className="relative grid size-14 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-xl" aria-expanded={directoryOpen} aria-label="Ouvrir le panneau Chat">
      <MessageCircle className="size-6" />
      {unread > 0 && <span className="absolute -right-1 -top-1 grid min-h-6 min-w-6 place-items-center rounded-full bg-destructive px-1 text-xs text-destructive-foreground">{Math.min(unread, 99)}</span>}
      {unread === 0 && seenGeneral !== general.updatedAt && <span className="absolute right-0 top-0 size-3 rounded-full bg-destructive ring-2 ring-background" />}
    </button>
  </aside>;
}
