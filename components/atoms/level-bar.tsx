import { cn } from "@/lib/utils";

/** Barre de niveau en segments (impact, difficulté…) — 1 à `max`. */
export function LevelBar({
  value,
  max = 5,
  label,
}: {
  value: number;
  max?: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="shrink-0">{label}</span>
      <div className="flex gap-0.5">
        {Array.from({ length: max }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 w-3 rounded-sm",
              i < value ? "bg-primary" : "bg-muted",
            )}
          />
        ))}
      </div>
    </div>
  );
}
