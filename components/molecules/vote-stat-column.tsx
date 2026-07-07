import { cn } from "@/lib/utils";

/** Colonne de statistiques façon Stack Overflow : votes puis réponses (teintée si résolue). */
export function VoteStatColumn({
  score,
  answers,
  solved,
}: {
  score: number;
  answers: number;
  solved?: boolean;
}) {
  return (
    <div className="flex w-16 shrink-0 flex-col items-center gap-2 text-xs text-muted-foreground">
      <div className="flex flex-col items-center">
        <span className="text-base font-semibold text-foreground">{score}</span>
        <span>votes</span>
      </div>
      <div
        className={cn(
          "flex flex-col items-center rounded-md px-2 py-1",
          solved && "bg-accent/10",
        )}
      >
        <span
          className={cn(
            "text-base font-semibold",
            solved ? "text-accent" : "text-foreground",
          )}
        >
          {answers}
        </span>
        <span>rép.</span>
      </div>
    </div>
  );
}
