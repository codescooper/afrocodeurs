import Link from "next/link";
import { CheckCircle2, MessageSquare } from "lucide-react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { buttonVariants } from "@/components/ui/button";
import { QUESTION_STATUS_LABELS } from "@/features/forum/constants";

export const metadata = { title: "Forum" };

/** Forum d'entraide — liste des questions (Sprint 5). */
export default async function ForumPage() {
  const session = await auth();
  const canAsk = can(session?.user?.role, "question:create");
  const questions = await db.question.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { username: true, name: true } },
      _count: { select: { answers: true } },
    },
  });

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Forum</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Posez vos questions techniques, partagez vos réponses.
          </p>
        </div>
        {canAsk && (
          <Link href="/forum/new" className={buttonVariants({ size: "sm" })}>
            Poser une question
          </Link>
        )}
      </div>

      {questions.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Aucune question pour le moment. Posez la première !
        </div>
      ) : (
        <ul className="mt-8 flex flex-col gap-3">
          {questions.map((question) => (
            <li key={question.id}>
              <Link
                href={`/forum/${question.slug}`}
                className="flex items-start gap-4 rounded-lg border border-border bg-background p-4 transition-colors hover:bg-muted/40"
              >
                <span className="flex w-16 shrink-0 flex-col items-center gap-1 text-xs text-muted-foreground">
                  <MessageSquare className="size-4" />
                  {question._count.answers} rép.
                </span>
                <span className="flex flex-col gap-1">
                  <span className="flex items-center gap-2 font-semibold">
                    {question.status === "SOLVED" && (
                      <CheckCircle2 className="size-4 text-primary" />
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
          ))}
        </ul>
      )}
    </div>
  );
}
