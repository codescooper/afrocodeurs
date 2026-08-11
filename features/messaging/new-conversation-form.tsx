"use client";

import { useActionState, useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/shared/avatar";
import { createConversationAction } from "./actions";

type Member = { id: string; username: string; name: string | null; image: string | null };
const field = "rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary";

export function NewConversationForm() {
  const [state, action, pending] = useActionState(createConversationAction, undefined);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Member[]>([]);
  const [selected, setSelected] = useState<Member[]>([]);

  useEffect(() => {
    if (query.trim().length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, { signal: controller.signal });
      if (response.ok) setResults(((await response.json()) as { users: Member[] }).users.filter((user) => !selected.some((item) => item.id === user.id)));
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, selected]);

  return <form action={action} className="flex flex-col gap-5">
    <input type="hidden" name="usernames" value={selected.map((user) => user.username).join(",")} />
    <label className="flex flex-col gap-2 text-sm font-medium">Membres
      {selected.length > 0 && <div className="flex flex-wrap gap-2">{selected.map((user) => <span key={user.id} className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs">@{user.username}<button type="button" aria-label={`Retirer ${user.username}`} onClick={() => setSelected((items) => items.filter((item) => item.id !== user.id))}><X className="size-3" /></button></span>)}</div>}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
        <input value={query} onChange={(event) => { setQuery(event.target.value); if (event.target.value.trim().length < 2) setResults([]); }} placeholder="Rechercher par nom ou @utilisateur" autoCapitalize="none" className={`${field} w-full pl-9`} />
        {query.trim().length >= 2 && results.length > 0 && <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-xl">{results.map((user) => <button key={user.id} type="button" onClick={() => { setSelected((items) => [...items, user]); setQuery(""); setResults([]); }} className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-muted"><Avatar image={user.image} name={user.name ?? user.username} size={32} /><span><b className="block text-sm">{user.name ?? user.username}</b><span className="text-xs text-muted-foreground">@{user.username}</span></span></button>)}</div>}
      </div>
      <span className="text-xs font-normal text-muted-foreground">Tapez au moins 2 caractères puis choisissez un membre.</span>
    </label>
    <label className="flex flex-col gap-1 text-sm font-medium">Nom du groupe (optionnel)<input name="title" maxLength={80} placeholder="Ex. Équipe Défi Abidjan" className={field} /><span className="text-xs font-normal text-muted-foreground">Obligatoire uniquement lorsque vous invitez plusieurs personnes.</span></label>
    {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
    <Button type="submit" disabled={pending || selected.length === 0}>{pending ? "Création…" : "Commencer la conversation"}</Button>
  </form>;
}
