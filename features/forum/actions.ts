"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { EntityType } from "@prisma/client";

import { db } from "@/lib/db";
import { uniqueSlug } from "@/lib/utils";
import { guard, invalidMessage } from "@/lib/guard";
import { answerSchema, commentSchema, questionSchema } from "@/lib/validators";
import { notify } from "@/features/notifications/notify";
import { award, awardVote } from "@/features/reputation/award";

export type ForumFormState = { error?: string } | undefined;

/** Poser une question (Sprint 5). Statut initial : OPEN. */
export async function createQuestionAction(
  _prev: ForumFormState,
  formData: FormData,
): Promise<ForumFormState> {
  const g = await guard({ permission: "question:create", verified: true });
  if (!g.ok) return { error: g.error };

  const parsed = questionSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
  });
  if (!parsed.success) return { error: invalidMessage(parsed.error) };

  const slug = await uniqueSlug(parsed.data.title, "question", async (s) =>
    Boolean(
      await db.question.findUnique({ where: { slug: s }, select: { id: true } }),
    ),
  );
  const question = await db.question.create({
    data: {
      title: parsed.data.title,
      slug,
      body: parsed.data.body,
      authorId: g.user.id,
    },
  });
  await award(g.user.id, "QUESTION_ASKED", {
    type: "QUESTION",
    id: question.id,
  });

  revalidatePath("/forum");
  redirect(`/forum/${slug}`);
}

/** Répondre à une question (Sprint 5). Passe la question à ANSWERED si OPEN. */
export async function createAnswerAction(
  _prev: ForumFormState,
  formData: FormData,
): Promise<ForumFormState> {
  const g = await guard({ permission: "answer:create", verified: true });
  if (!g.ok) return { error: g.error };

  const parsed = answerSchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) return { error: invalidMessage(parsed.error) };

  const questionId = formData.get("questionId");
  const slug = formData.get("slug");
  if (typeof questionId !== "string") return { error: "Question introuvable." };

  const answer = await db.answer.create({
    data: {
      questionId,
      body: parsed.data.body,
      authorId: g.user.id,
    },
  });
  await award(g.user.id, "ANSWER_POSTED", {
    type: "ANSWER",
    id: answer.id,
  });
  await db.question.updateMany({
    where: { id: questionId, status: "OPEN" },
    data: { status: "ANSWERED" },
  });

  const question = await db.question.findUnique({
    where: { id: questionId },
    select: { authorId: true, title: true },
  });
  await notify({
    userId: question?.authorId,
    actorId: g.user.id,
    type: "ANSWER",
    title: "Nouvelle réponse à ta question",
    body: question
      ? `Quelqu'un a répondu à « ${question.title} ».`
      : "Quelqu'un a répondu à ta question.",
    link: typeof slug === "string" ? `/forum/${slug}` : null,
  });

  if (typeof slug === "string") revalidatePath(`/forum/${slug}`);
  return undefined;
}

/** Voter (UP/DOWN) sur une question ou une réponse — togglable (Sprint 5). */
export async function voteAction(formData: FormData): Promise<void> {
  const g = await guard({ permission: "content:vote" });
  if (!g.ok) return;

  const rawType = formData.get("targetType");
  const targetId = formData.get("targetId");
  const value = formData.get("value");
  const slug = formData.get("slug");
  if (rawType !== "QUESTION" && rawType !== "ANSWER") return;
  if (typeof targetId !== "string") return;
  if (value !== "UP" && value !== "DOWN") return;

  const targetType: EntityType = rawType;
  const existing = await db.vote.findUnique({
    where: {
      userId_targetType_targetId: {
        userId: g.user.id,
        targetType,
        targetId,
      },
    },
  });

  if (!existing) {
    await db.vote.create({
      data: { userId: g.user.id, targetType, targetId, value },
    });
  } else if (existing.value === value) {
    await db.vote.delete({ where: { id: existing.id } });
  } else {
    await db.vote.update({ where: { id: existing.id }, data: { value } });
  }

  // Réputation de l'auteur du contenu (sur les upvotes uniquement).
  const oldWasUp = existing?.value === "UP";
  const removed = existing != null && existing.value === value;
  const newIsUp = !removed && value === "UP";
  const delta = (newIsUp ? 1 : 0) - (oldWasUp ? 1 : 0);
  if (delta !== 0) {
    const author =
      targetType === "QUESTION"
        ? (
            await db.question.findUnique({
              where: { id: targetId },
              select: { authorId: true },
            })
          )?.authorId
        : (
            await db.answer.findUnique({
              where: { id: targetId },
              select: { authorId: true },
            })
          )?.authorId;
    if (author && author !== g.user.id) {
      await awardVote(author, delta, { type: targetType, id: targetId });
    }
  }

  if (typeof slug === "string") revalidatePath(`/forum/${slug}`);
}

/** Accepter une réponse (Sprint 5). Réservé à l'auteur de la question. */
export async function acceptAnswerAction(formData: FormData): Promise<void> {
  const g = await guard();
  if (!g.ok) return;

  const answerId = formData.get("answerId");
  const slug = formData.get("slug");
  if (typeof answerId !== "string") return;

  const answer = await db.answer.findUnique({
    where: { id: answerId },
    select: {
      questionId: true,
      authorId: true,
      question: { select: { authorId: true } },
    },
  });
  if (!answer) return;
  if (answer.question.authorId !== g.user.id) return;

  await db.$transaction([
    db.answer.updateMany({
      where: { questionId: answer.questionId },
      data: { isAccepted: false },
    }),
    db.answer.update({ where: { id: answerId }, data: { isAccepted: true } }),
    db.question.update({
      where: { id: answer.questionId },
      data: { status: "SOLVED" },
    }),
  ]);

  if (answer.authorId !== g.user.id) {
    await award(answer.authorId, "ANSWER_ACCEPTED", {
      type: "ANSWER",
      id: answerId,
    });
  }

  await notify({
    userId: answer.authorId,
    actorId: g.user.id,
    type: "ANSWER_ACCEPTED",
    title: "Ta réponse a été acceptée 🎉",
    body: "L'auteur de la question a retenu ta réponse comme solution.",
    link: typeof slug === "string" ? `/forum/${slug}` : null,
  });

  if (typeof slug === "string") revalidatePath(`/forum/${slug}`);
}

/** Commenter une question ou une réponse (Sprint 5). */
export async function addCommentAction(
  _prev: ForumFormState,
  formData: FormData,
): Promise<ForumFormState> {
  const g = await guard({ permission: "content:comment", verified: true });
  if (!g.ok) return { error: g.error };

  const parsed = commentSchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) return { error: invalidMessage(parsed.error) };

  const rawType = formData.get("targetType");
  const targetId = formData.get("targetId");
  const slug = formData.get("slug");
  if (rawType !== "QUESTION" && rawType !== "ANSWER") {
    return { error: "Cible invalide." };
  }
  if (typeof targetId !== "string") return { error: "Cible invalide." };

  const targetType: EntityType = rawType;
  await db.comment.create({
    data: { body: parsed.data.body, authorId: g.user.id, targetType, targetId },
  });

  const recipientId =
    targetType === "QUESTION"
      ? (
          await db.question.findUnique({
            where: { id: targetId },
            select: { authorId: true },
          })
        )?.authorId
      : (
          await db.answer.findUnique({
            where: { id: targetId },
            select: { authorId: true },
          })
        )?.authorId;
  await notify({
    userId: recipientId,
    actorId: g.user.id,
    type: "COMMENT",
    title:
      targetType === "QUESTION"
        ? "Nouveau commentaire sur ta question"
        : "Nouveau commentaire sur ta réponse",
    body: "Quelqu'un a commenté ton contenu sur le forum.",
    link: typeof slug === "string" ? `/forum/${slug}` : null,
  });

  if (typeof slug === "string") revalidatePath(`/forum/${slug}`);
  return undefined;
}
