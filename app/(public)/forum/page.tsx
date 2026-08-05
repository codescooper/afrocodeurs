import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import type { QuestionStatus } from "@prisma/client";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { buttonVariants } from "@/components/ui/button";
import { QUESTION_STATUS_LABELS } from "@/features/forum/constants";
import { tallyVotes } from "@/features/forum/votes";
import { HubTemplate } from "@/components/templates/hub-template";
import { EmptyState } from "@/components/atoms/empty-state";
import { FilterPills } from "@/components/molecules/filter-pills";
import { VoteStatColumn } from "@/components/molecules/vote-stat-column";
import { SuggestionsRail } from "@/components/organisms/suggestions-rail";

export const metadata = { title: "Forum" };

/** Forum d'entraide — liste des questions (Sprint 5), façon Stack Overflow. */
export default async function ForumPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const session = await auth();
  const canAsk = can(session?.user?.role, "question:create");

  const [questions, statusCounts] = await Promise.all([
    db.question.findMany({
      where: status ? { status: status as QuestionStatus } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { username: true, name: true } },
        _count: { select: { answers: true } },
      },
    }),
    db.question.groupBy({ by: ["status"], _count: { status: true } }),
  ]);

  const tallies = await tallyVotes(
    questions.map((q) => ({ type: "QUESTION" as const, id: q.id })),
  );

  return (
    <HubTemplate
      title="Forum"
      description="Posez vos questions techniques, partagez vos réponses."
      rail={<SuggestionsRail />}
      action={
        canAsk ? (
          <Link href="/forum/new" className={buttonVariants({ size: "sm" })}>
            Poser une question
          </Link>
        ) : undefined
      }
    >
      {statusCounts.length > 0 && (
        <div className="mb-6">
          <FilterPills
            baseHref="/forum"
            paramName="status"
            active={status}
            options={statusCounts.map((s) => ({
              label: QUESTION_STATUS_LABELS[s.status],
              value: s.status,
              count: s._count.status,
            }))}
          />
        </div>
      )}

      {questions.length === 0 ? (
        <EmptyState>
          {status
            ? "Aucune question dans cet état pour l'instant."
            : "Aucune question pour le moment. Posez la première !"}
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-3">
          {questions.map((question) => {
            const tally = tallies.get(question.id) ?? { score: 0, mine: null };
            return (
              <li key={question.id}>
                <Link
                  href={`/forum/${question.slug}`}
                  className="flex items-start gap-4 rounded-lg border border-border bg-background p-4 transition-colors hover:bg-muted/40"
                >
                  <VoteStatColumn
                    score={tally.score}
                    answers={question._count.answers}
                    solved={question.status === "SOLVED"}
                  />
                  <span className="flex flex-col gap-1">
                    <span className="flex items-center gap-2 font-semibold">
                      {question.status === "SOLVED" && (
                        <CheckCircle2 className="size-4 text-accent" />
                      )}
                      {question.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {QUESTION_STATUS_LABELS[question.status]} · par{" "}
                      {question.author.name ?? `@${question.author.username}`}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </HubTemplate>
  );
}
