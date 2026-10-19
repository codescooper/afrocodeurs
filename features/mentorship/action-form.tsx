"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { mentorshipAction } from "./actions";
export function MentorshipForm({ fields, label, children }: { fields: Record<string, string>; label: string; children?: React.ReactNode }) {
  const [state, action, pending] = useActionState(mentorshipAction, undefined);
  return <form action={action} className="flex flex-col gap-3">
    {Object.entries(fields).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
    {children}
    <Button variant="outline" type="submit" disabled={pending} className="self-start">{pending ? "En cours…" : label}</Button>
    <p role="status" className={state?.error ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>{state?.error ?? (state?.success ? "Enregistré." : "")}</p>
  </form>;
}
