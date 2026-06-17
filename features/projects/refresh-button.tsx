"use client";

import { useFormStatus } from "react-dom";

import { refreshProjectAction } from "./actions";
import { Button } from "@/components/ui/button";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="outline" disabled={pending}>
      {pending ? "Synchro…" : "Rafraîchir depuis GitHub"}
    </Button>
  );
}

/** Bouton mainteneur : resynchronise la roadmap avec le dépôt GitHub. */
export function RefreshButton({
  projectId,
  slug,
}: {
  projectId: string;
  slug: string;
}) {
  return (
    <form action={refreshProjectAction}>
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="slug" value={slug} />
      <Submit />
    </form>
  );
}
