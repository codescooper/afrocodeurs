import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, CheckCircle2 } from "lucide-react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { Markdown } from "@/components/shared/markdown";
import { tallyVotes } from "@/features/forum/votes";
import { VoteControl } from "@/features/forum/vote-control";
import { AnswerForm } from "@/features/forum/answer-form";
import { CommentForm } from "@/features/forum/comment-form";
import { acceptAnswerAction } from "@/features/forum/actions";
import { QUESTION_STATUS_LABELS } from "@/features/forum/constants";
import { ReportForm } from "@/features/admin/report-form";

/** Page détail d'une question : votes, réponses, acceptation, commentaires. */
export default async function QuestionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  const userId = session?.user?.id;

  const question = await db.question.findUnique({
    where: { slug },
    include: {
      author: { select: { username: true, name: true } },
      answers: {
        include: { author: { select: { username: true, name: true } } },
        orderBy: [{ isAccepted: "desc" }, { createdAt: "asc" }],
      },
    },
  });
  if (!question) notFound();

  const comments = await db.comment.findMany({
    where: { targetType: "QUESTION", targetId: question.id },
    include: { author: { select: { username: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  const tally = await tallyVotes(
    [
      { type: "QUESTION" as const, id: question.id },
      ...question.answers.map((a) => ({ type: "ANSWER" as const, id: a.id })),
    ],
    userId,
  );
  const qVote = tally.get(question.id) ?? { score: 0, mine: null };

  const isQuestionAuthor = userId === question.authorId;
  const canVote = can(session?.user?.role, "content:vote");
  const canAnswer = can(session?.user?.role, "answer:create");
  const canComment = can(session?.user?.role, "content:comment");

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <Link
        href="/forum"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Toutes les questions
      </Link>

      <div className="mt-4 flex items-start gap-4">
        <VoteControl
          targetType="QUESTION"
          targetId={question.id}
          slug={question.slug}
          score={qVote.score}
          mine={qVote.mine}
          canVote={canVote}
        />
        <div className="flex-1">
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
            {QUESTION_STATUS_LABELS[question.status]}
          </span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">
            {question.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Par {question.author.name ?? `@${question.author.username}`}
          </p>
          <article className="mt-4">
            <Markdown>{question.body}</Markdown>
          </article>

          {userId && (
            <div className="mt-3">
              <ReportForm targetType="QUESTION" targetId={question.id} />
            </div>
          )}

          <div className="mt-6 border-t border-border pt-4">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Commentaires
            </h2>
            <ul className="mt-2 flex flex-col gap-2">
              {comments.map((comment) => (
                <li key={comment.id} className="text-sm">
                  <span className="text-muted-foreground">
                    {comment.body} —{" "}
                    <span className="font-medium text-foreground">
                      {comment.author.name ?? `@${comment.author.username}`}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            {canComment && (
              <div className="mt-3">
                <CommentForm
                  targetType="QUESTION"
                  targetId={question.id}
                  slug={question.slug}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">
          {question.answers.length} réponse
          {question.answers.length > 1 ? "s" : ""}
        </h2>

        <ul className="mt-4 flex flex-col gap-6">
          {question.answers.map((answer) => {
            const aVote = tally.get(answer.id) ?? { score: 0, mine: null };
            return (
              <li key={answer.id} className="flex items-start gap-4">
                <VoteControl
                  targetType="ANSWER"
                  targetId={answer.id}
                  slug={question.slug}
                  score={aVote.score}
                  mine={aVote.mine}
                  canVote={canVote}
                />
                <div className="flex-1">
                  {answer.isAccepted && (
                    <span className="mb-2 flex items-center gap-1.5 text-sm font-medium text-primary">
                      <CheckCircle2 className="size-4" />
                      Réponse acceptée
                    </span>
                  )}
                  <article>
                    <Markdown>{answer.body}</Markdown>
                  </article>
                  <div className="mt-2 flex items-center gap-4">
                    <span className="text-xs text-muted-foreground">
                      {answer.author.name ?? `@${answer.author.username}`}
                    </span>
                    {isQuestionAuthor && !answer.isAccepted && (
                      <form action={acceptAnswerAction}>
                        <input type="hidden" name="answerId" value={answer.id} />
                        <input type="hidden" name="slug" value={question.slug} />
                        <button
                          type="submit"
                          className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary"
                        >
                          <Check className="size-3.5" />
                          Accepter
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-8 border-t border-border pt-6">
          <h3 className="font-semibold">Votre réponse</h3>
          {canAnswer ? (
            <div className="mt-3">
              <AnswerForm questionId={question.id} slug={question.slug} />
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              <Link href="/login" className="font-medium text-foreground underline">
                Connectez-vous
              </Link>{" "}
              pour répondre.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
