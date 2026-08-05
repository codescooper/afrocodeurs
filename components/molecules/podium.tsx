import Link from "next/link";
import { Trophy } from "lucide-react";

import { Avatar } from "@/components/shared/avatar";
import { cn } from "@/lib/utils";

export type PodiumEntry = {
  href: string;
  name: string;
  image?: string | null;
  points: number;
  levelLabel: string;
};

const MEDAL_STYLES = [
  { border: "border-primary", tint: "bg-primary/10", trophy: "text-primary", order: "order-2", pad: "pt-0" },
  { border: "border-border", tint: "bg-muted", trophy: "text-muted-foreground", order: "order-1", pad: "pt-6" },
  { border: "border-accent/40", tint: "bg-accent/10", trophy: "text-accent", order: "order-3", pad: "pt-8" },
];

/** Podium des 3 premiers AfroMakers façon leaderboard Codewars/HackerRank. */
export function Podium({ entries }: { entries: PodiumEntry[] }) {
  return (
    <div className="flex items-end gap-4">
      {entries.slice(0, 3).map((entry, i) => {
        const medal = MEDAL_STYLES[i];
        return (
          <Link
            key={entry.href}
            href={entry.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-2 rounded-lg border p-5 text-center transition-colors hover:bg-muted/40",
              medal.border,
              medal.tint,
              medal.order,
              medal.pad,
            )}
          >
            <Trophy className={cn("size-5", medal.trophy)} />
            <Avatar image={entry.image} name={entry.name} size={48} />
            <span className="font-semibold">{entry.name}</span>
            <span className="text-xs text-muted-foreground">{entry.levelLabel}</span>
            <span className="text-lg font-bold text-primary">{entry.points} pts</span>
          </Link>
        );
      })}
    </div>
  );
}
