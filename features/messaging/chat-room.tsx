"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChatMessage = { id: string; body: string; createdAt: string; authorId: string; author: { username: string; name: string | null; image: string | null } };

export function ChatRoom({ conversationId, currentUserId, initialMessages }: { conversationId: string; currentUserId: string; initialMessages: ChatMessage[] }) {
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const latest = messages.at(-1)?.createdAt ?? new Date(0).toISOString();

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => {
    const timer = setInterval(async () => {
      const response = await fetch(`/api/messages/${conversationId}?after=${encodeURIComponent(latest)}`, { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json() as { messages: ChatMessage[] };
      if (data.messages.length) setMessages((current) => [...current, ...data.messages.filter((next) => !current.some((item) => item.id === next.id))]);
    }, 4000);
    return () => clearInterval(timer);
  }, [conversationId, latest]);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!body.trim() || sending) return;
    setSending(true); setError("");
    const response = await fetch(`/api/messages/${conversationId}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ body }) });
    const data = await response.json() as { message?: ChatMessage; error?: string };
    if (!response.ok || !data.message) setError(data.error ?? "Envoi impossible.");
    else { setMessages((current) => [...current, data.message!]); setBody(""); }
    setSending(false);
  }

  return <div className="flex min-h-[65dvh] flex-col"><div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-6">{messages.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">Aucun message. Commencez la conversation.</p>}{messages.map((message) => { const mine = message.authorId === currentUserId; return <div key={message.id} className={cn("flex", mine ? "justify-end" : "justify-start")}><div className={cn("max-w-[85%] rounded-2xl px-4 py-2.5 sm:max-w-[70%]", mine ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-muted")}><p className="mb-1 text-[11px] font-semibold opacity-70">{mine ? "Vous" : message.author.name ?? `@${message.author.username}`}</p><p className="whitespace-pre-wrap break-words text-sm">{message.body}</p><time className="mt-1 block text-[10px] opacity-60">{new Date(message.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</time></div></div>; })}<div ref={bottom} /></div><form onSubmit={send} className="sticky bottom-0 border-t border-border bg-background p-3"><div className="flex gap-2"><textarea value={body} onChange={(event) => setBody(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} rows={1} maxLength={2000} placeholder="Écrivez un message…" className="min-h-10 flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" /><Button type="submit" size="icon" disabled={sending || !body.trim()} aria-label="Envoyer"><Send /></Button></div>{error && <p className="mt-2 text-xs text-destructive">{error}</p>}</form></div>;
}
