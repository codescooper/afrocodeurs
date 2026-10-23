"use client";
import { startTransition, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { collaborationAction, archiveVentureAction, reviewVentureAction } from "./actions";
export function VentureActionForm({ fields, label, kind = "collaboration", children }: {
  fields: Record<string, string>; label: string; kind?: "collaboration" | "archive" | "review"; children?: React.ReactNode;
}) {
  const action = kind === "archive" ? archiveVentureAction : kind === "review" ? reviewVentureAction : collaborationAction;
  const [state, submit, pending] = useActionState(action, undefined);
  return <form action={submit} onSubmit={(event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => submit(data));
  }} className="flex flex-col gap-3">
    {Object.entries(fields).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
    {children}
    <Button type="submit" variant="outline" disabled={pending || Boolean(state?.success)} className="self-start">{pending ? "En cours…" : label}</Button>
    {(state?.error || state?.success) && <p role="status" className={state.error ? "text-sm text-destructive" : "text-sm text-accent"}>{state.error ?? state.success}</p>}
  </form>;
}
