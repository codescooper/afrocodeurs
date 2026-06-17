"use client";

import { useState, useTransition } from "react";
import { Bookmark } from "lucide-react";
import type { EntityType } from "@prisma/client";

import { toggleBookmarkAction } from "./actions";

export function SaveButton({
  targetType,
  targetId,
  initialSaved,
}: {
  targetType: EntityType;
  targetId: string;
  initialSaved: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      setSaved(await toggleBookmarkAction(targetType, targetId));
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
    >
      <Bookmark
        className={saved ? "size-4 fill-primary text-primary" : "size-4"}
      />
      {saved ? "Enregistré" : "Enregistrer"}
    </button>
  );
}
