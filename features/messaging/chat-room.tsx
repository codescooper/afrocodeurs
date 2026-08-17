"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ReportForm } from "@/features/admin/report-form";

export type ChatMessage = {
  id: string;
  body: string;
  createdAt: string;
  authorId: string;
  author: { username: string; name: string | null; image: string | null };
};

export function ChatRoom({ conversationId, currentUserId, initialMessages, compact = false, canModerate = false, initialHasMore = false }: {
  conversationId: string;
  currentUserId: string;
  initialMessages: ChatMessage[];
  compact?: boolean;
  canModerate?: boolean;
  initialHasMore?: boolean;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ChatMessage[] | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const latest = messages.at(-1)?.createdAt ?? new Date(0).toISOString();

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => {
    let active = true;
    async function refresh() {
      const response = await fetch(`/api/messages/${conversationId}?after=${encodeURIComponent(latest)}`, { cache: "no-store" });
      if (!response.ok || !active) return;
      const data = await response.json() as { messages: ChatMessage[] };
      if (data.messages.length) setMessages((current) => [...current, ...data.messages.filter((next) => !current.some((item) => item.id === next.id))]);
    }
    void refresh();
    const timer = setInterval(refresh, 4000);
    return () => { active = false; clearInterval(timer); };
  }, [conversationId, latest]);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!body.trim() || sending) return;
    setSending(true);
    setError("");
    const response = await fetch(`/api/messages/${conversationId}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ body }) });
    const data = await response.json() as { message?: ChatMessage; error?: string };
    if (!response.ok || !data.message) setError(data.error ?? "Envoi impossible.");
    else { setMessages((current) => [...current, data.message!]); setBody(""); }
    setSending(false);
  }

  async function remove(messageId: string) {
    const response = await fetch(`/api/messages/${conversationId}`, { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ messageId }) });
    if (response.ok) setMessages((current) => current.filter((message) => message.id !== messageId));
    else setError("Suppression impossible.");
  }

  async function loadOlder() {
    const before = messages[0]?.createdAt;
    if (!before || loadingOlder) return;
    setLoadingOlder(true);
    const response = await fetch(`/api/messages/${conversationId}?before=${encodeURIComponent(before)}`, { cache: "no-store" });
    const data = await response.json() as { messages?: ChatMessage[]; hasMore?: boolean };
    if (response.ok && data.messages) {
      setMessages((current) => [...data.messages!.filter((next) => !current.some((item) => item.id === next.id)), ...current]);
      setHasMore(Boolean(data.hasMore));
    }
    setLoadingOlder(false);
  }

  async function search(event: React.FormEvent) {
    event.preventDefault();
    if (!query.trim()) { setSearchResults(null); return; }
    const response = await fetch(`/api/messages/${conversationId}?q=${encodeURIComponent(query.trim())}`, { cache: "no-store" });
    const data = await response.json() as { messages?: ChatMessage[] };
    if (response.ok) setSearchResults(data.messages ?? []);
  }

  const visibleMessages = searchResults ?? messages;

  return <div className={cn("flex flex-col", compact ? "h-[min(62dvh,32rem)]" : "min-h-[65dvh]")}>
    <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-6">
      <form onSubmit={search} className="flex gap-2"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher dans le salon" className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-xs"/><Button type="submit" size="sm" variant="outline">Rechercher</Button>{searchResults && <Button type="button" size="sm" variant="ghost" onClick={() => { setQuery(""); setSearchResults(null); }}>Fermer</Button>}</form>
      {!searchResults && hasMore && <button type="button" onClick={() => void loadOlder()} disabled={loadingOlder} className="block w-full text-center text-xs font-medium text-muted-foreground underline">{loadingOlder ? "Chargement…" : "Charger les messages précédents"}</button>}
      {visibleMessages.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">{searchResults ? "Aucun message trouvé." : "Aucun message. Commencez la conversation."}</p>}
      {visibleMessages.map((message) => {
        const mine = message.authorId === currentUserId;
        return <div key={message.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
          <div className={cn("max-w-[85%] rounded-2xl px-4 py-2.5 sm:max-w-[70%]", mine ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-muted")}>
            <p className="mb-1 text-[11px] font-semibold opacity-70">{mine ? "Vous" : message.author.name ?? `@${message.author.username}`}</p>
            <p className="whitespace-pre-wrap break-words text-sm">{message.body}</p>
            <time className="mt-1 block text-[10px] opacity-60">{new Date(message.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</time>
            <div className="mt-1 flex flex-wrap items-center gap-2">{(mine || canModerate) && <button type="button" onClick={() => void remove(message.id)} className="inline-flex items-center gap-1 text-[10px] opacity-60 hover:opacity-100" aria-label="Supprimer le message"><Trash2 className="size-3" /> Supprimer</button>}{!mine && <ReportForm targetType="MESSAGE" targetId={message.id} />}</div>
          </div>
        </div>;
      })}
      <div ref={bottom} />
    </div>
    <form onSubmit={send} className="border-t border-border bg-background p-3">
      <div className="flex gap-2">
        <textarea value={body} onChange={(event) => setBody(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} rows={1} maxLength={2000} placeholder="Écrivez un message…" className="min-h-10 flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
        <Button type="submit" size="icon" disabled={sending || !body.trim()} aria-label="Envoyer"><Send /></Button>
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </form>
  </div>;
}
