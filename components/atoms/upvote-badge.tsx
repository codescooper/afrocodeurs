import { ChevronUp } from "lucide-react";

/** Badge de score façon Product Hunt (flèche + compteur). */
export function UpvoteBadge({ score }: { score: number }) {
  return (
    <div className="flex shrink-0 flex-col items-center justify-center rounded-md border border-border px-2.5 py-1.5 text-primary">
      <ChevronUp className="size-4" />
      <span className="text-sm font-semibold">{score}</span>
    </div>
  );
}
