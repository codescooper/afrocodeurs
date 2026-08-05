import Link from "next/link";
import { Trophy } from "lucide-react";

import { getLeaderboard } from "@/features/reputation/queries";
import { levelForPoints } from "@/features/reputation/constants";
import { EmptyState } from "@/components/atoms/empty-state";
import { Avatar } from "@/components/shared/avatar";
import { Podium } from "@/components/molecules/podium";

export const metadata = { title: "AfroMakers — Classement" };

/** Classement des AfroMakers par réputation (Build Before Consume), façon leaderboard. */
export default async function AfroMakersPage() {
  const board = await getLeaderboard(50);
  const [top3, rest] = [board.slice(0, 3), board.slice(3)];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <div className="flex items-center gap-2">
        <Trophy className="size-6 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">AfroMakers</h1>
      </div>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Celles et ceux qui construisent le plus. <em>Build Before Consume.</em>
      </p>

      {board.length === 0 ? (
        <EmptyState className="mt-8">
          Le classement se remplira au fil des contributions.
        </EmptyState>
      ) : (
        <>
          {top3.length > 0 && (
            <div className="mt-8">
              <Podium
                entries={top3.map((row) => ({
                  href: `/u/${row.user.username}`,
                  name: row.user.name ?? `@${row.user.username}`,
                  image: row.user.image,
                  points: row.points,
                  levelLabel: levelForPoints(row.points).label,
                }))}
              />
            </div>
          )}

          {rest.length > 0 && (
            <ol className="mt-6 flex flex-col gap-2">
              {rest.map((row, i) => {
                const level = levelForPoints(row.points);
                return (
                  <li key={row.user.id}>
                    <Link
                      href={`/u/${row.user.username}`}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3 transition-colors hover:bg-muted/40"
                    >
                      <span className="flex items-center gap-3">
                        <span className="w-6 text-center text-sm font-bold text-muted-foreground">
                          {i + 4}
                        </span>
                        <Avatar
                          image={row.user.image}
                          name={row.user.name ?? row.user.username}
                          size={32}
                        />
                        <span className="flex flex-col">
                          <span className="font-medium">
                            {row.user.name ?? `@${row.user.username}`}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {level.label}
                          </span>
                        </span>
                      </span>
                      <span className="font-bold text-primary">
                        {row.points} pts
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          )}
        </>
      )}
    </div>
  );
}
