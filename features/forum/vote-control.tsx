import { ChevronDown, ChevronUp } from "lucide-react";
import type { VoteValue } from "@prisma/client";

import { cn } from "@/lib/utils";
import { voteAction } from "./actions";

/** Contrôle de vote (haut/bas + score) pour une question ou une réponse. */
export function VoteControl({
  targetType,
  targetId,
  slug,
  score,
  mine,
  canVote,
}: {
  targetType: "QUESTION" | "ANSWER";
  targetId: string;
  slug: string;
  score: number;
  mine: VoteValue | null;
  canVote: boolean;
}) {
  const btn =
    "flex size-7 items-center justify-center rounded-md hover:bg-muted disabled:pointer-events-none disabled:opacity-40";

  return (
    <div className="flex flex-col items-center">
      <form action={voteAction}>
        <input type="hidden" name="targetType" value={targetType} />
        <input type="hidden" name="targetId" value={targetId} />
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="value" value="UP" />
        <button
          type="submit"
          disabled={!canVote}
          aria-label="Voter pour"
          className={cn(btn, mine === "UP" && "text-primary")}
        >
          <ChevronUp className="size-5" />
        </button>
      </form>

      <span className="text-sm font-semibold tabular-nums">{score}</span>

      <form action={voteAction}>
        <input type="hidden" name="targetType" value={targetType} />
        <input type="hidden" name="targetId" value={targetId} />
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="value" value="DOWN" />
        <button
          type="submit"
          disabled={!canVote}
          aria-label="Voter contre"
          className={cn(btn, mine === "DOWN" && "text-destructive")}
        >
          <ChevronDown className="size-5" />
        </button>
      </form>
    </div>
  );
}
