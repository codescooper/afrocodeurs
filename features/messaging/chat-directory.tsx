"use client";
import { useEffect, useRef, useState } from "react";
import { MessageCircle, Search, X } from "lucide-react";
import { Avatar } from "@/components/shared/avatar";
import type { DockConversation } from "./chat-dock";

type Contact = { id: string; username: string; name: string | null; image: string | null; online: boolean };
type Contacts = { online: Contact[]; offline: Contact[]; nextOffset: number | null; moreOnline: boolean };
export function ChatDirectory({ onGeneral, onConversation, onClose, recent = [] }: { onGeneral: () => void; onConversation: (conversation: DockConversation) => void; onClose: () => void; recent?: DockConversation[] }) {
  const [query, setQuery] = useState("");
  const [contacts, setContacts] = useState<Contacts | null>(null);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState<string | null>(null);
  const [error, setError] = useState("");
  const generation = useRef(0);
  useEffect(() => {
    const version = ++generation.current;
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`/api/messages/contacts?q=${encodeURIComponent(query)}`, { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("Impossible de charger les membres.");
        const data = await response.json() as Contacts;
        if (generation.current === version) { setContacts(data); setError(""); }
      } catch (err) { if (!controller.signal.aborted && generation.current === version) setError(err instanceof Error ? err.message : "Connexion interrompue."); }
      finally { if (!controller.signal.aborted && generation.current === version) setLoading(false); }
    }
    const first = setTimeout(load, 250);
    const timer = setInterval(load, 15000);
    return () => { controller.abort(); clearTimeout(first); clearInterval(timer); };
  }, [query]);

  async function more() {
    if (contacts?.nextOffset == null || loading) return;
    const version = generation.current;
    setLoading(true);
    try {
      const response = await fetch(`/api/messages/contacts?q=${encodeURIComponent(query)}&offset=${contacts.nextOffset}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Chargement impossible.");
      const data = await response.json() as Contacts;
      if (version === generation.current) setContacts((current) => current ? { ...current, offline: [...current.offline, ...data.offline.filter((user) => !current.offline.some((item) => item.id === user.id))], nextOffset: data.nextOffset } : data);
    } catch { if (version === generation.current) setError("Chargement impossible. Réessayez."); }
    finally { if (version === generation.current) setLoading(false); }
  }
  async function start(user: Contact) {
    if (opening) return;
    setOpening(user.id); setError("");
    try {
      const response = await fetch("/api/messages/direct", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ recipientId: user.id }) });
      const data = await response.json() as { conversation?: DockConversation; error?: string };
      if (!response.ok || !data.conversation) throw new Error(data.error ?? "Discussion indisponible.");
      onConversation(data.conversation);
    } catch (err) { setError(err instanceof Error ? err.message : "Connexion interrompue."); }
    finally { setOpening(null); }
  }
  const list = (users: Contact[]) => users.map((user) => <button key={user.id} type="button" disabled={Boolean(opening)} onClick={() => void start(user)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted disabled:opacity-50" aria-label={`Discuter avec ${user.name ?? user.username}, ${user.online ? "en ligne" : "hors ligne"}`}>
    <span className="relative shrink-0"><Avatar image={user.image} name={user.name ?? user.username} size={36} /><span aria-hidden="true" className={`absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-popover ${user.online ? "bg-accent" : "bg-muted-foreground"}`} /></span>
    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{user.name ?? user.username}</span><span className="block truncate text-xs text-muted-foreground">@{user.username} · {user.online ? "En ligne" : "Hors ligne"}</span></span>
  </button>);
  return <section aria-label="Choisir une discussion" className="absolute bottom-16 right-0 flex max-h-[calc(100dvh-12rem)] w-[min(23rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-2xl">
    <header className="flex items-center justify-between border-b border-border px-4 py-3"><h2 className="font-semibold">Discussions</h2><button type="button" onClick={onClose} title="Fermer le panneau Chat" aria-label="Fermer le panneau Chat" className="rounded p-2 hover:bg-muted"><X className="size-4" /></button></header>
    <button type="button" onClick={onGeneral} className="flex items-center gap-3 border-b border-border px-4 py-3 text-left hover:bg-muted"><MessageCircle className="size-5 text-primary" /><span className="text-sm font-semibold">Chat général</span></button>
    {recent.length > 0 && <details className="border-b border-border"><summary className="cursor-pointer px-4 py-3 text-sm font-medium">Conversations récentes</summary><div className="max-h-40 overflow-y-auto">{recent.map((conversation) => <button key={conversation.id} type="button" onClick={() => onConversation(conversation)} aria-label={`Reprendre ${conversation.title}`} className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-muted"><Avatar image={conversation.image} name={conversation.title} size={28} /><span className="min-w-0 flex-1 truncate text-sm">{conversation.title}</span>{conversation.unread > 0 && <span className="text-xs font-semibold">{conversation.unread}</span>}</button>)}</div></details>}
    <label className="relative m-3 block"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><input aria-label="Rechercher un membre du chat" placeholder="Nom ou @utilisateur" value={query} onChange={(event) => { setQuery(event.target.value); setContacts(null); setLoading(true); }} className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm" /></label>
    <div className="min-h-0 overflow-y-auto">
      {error && <p role="alert" className="px-4 py-2 text-sm text-destructive">{error}</p>}
      {!contacts && loading && <p role="status" className="p-4 text-sm text-muted-foreground">Chargement…</p>}
      {contacts && <><h3 className="px-4 py-2 text-xs font-semibold text-muted-foreground">En ligne</h3>{list(contacts.online)}{!contacts.online.length && <p className="px-4 pb-3 text-xs text-muted-foreground">Aucun membre actif trouvé.</p>}{contacts.moreOnline && <p className="px-4 pb-3 text-xs text-muted-foreground">Affinez la recherche pour trouver d’autres membres.</p>}<h3 className="border-t border-border px-4 py-2 text-xs font-semibold text-muted-foreground">Hors ligne</h3>{list(contacts.offline)}{!contacts.offline.length && <p className="px-4 pb-3 text-xs text-muted-foreground">Aucun autre membre trouvé.</p>}{contacts.nextOffset !== null && <button type="button" disabled={loading} onClick={() => void more()} className="w-full p-3 text-sm underline">{loading ? "Chargement…" : "Voir davantage"}</button>}</>}
    </div>
  </section>;
}
