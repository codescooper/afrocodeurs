"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { EntityType } from "@prisma/client";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { can } from "@/lib/permissions";
import { answerSchema, commentSchema, questionSchema } from "@/lib/validators";

export type ForumFormState = { error?: string } | undefined;

/** Génère un slug unique de question. */
async function uniqueSlug(base: string): Promise<string> {
  const root = slugify(base) || "question";
  let slug = root;
  let n = 2;
  while (
    await db.question.findUnique({ where: { slug }, select: { id: true } })
  ) {
    slug = `${root}-${n++}`;
  }
  return slug;
}

/** Poser une question (Sprint 5). Statut initial : OPEN. */
export async function createQuestionAction(
  _prev: ForumFormState,
  formData: FormData,
): Promise<ForumFormState> {
  const session = await auth();
  if (!session?.user) return { error: "Vous devez être connecté." };
  if (!can(session.user.role, "question:create")) {
    return { error: "Action non autorisée." };
  }

  const parsed = questionSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const slug = await uniqueSlug(parsed.data.title);
  await db.question.create({
    data: {
      title: parsed.data.title,
      slug,
      body: parsed.data.body,
      authorId: session.user.id,
    },
  });

  revalidatePath("/forum");
  redirect(`/forum/${slug}`);
}

/** Répondre à une question (Sprint 5). Passe la question à ANSWERED si OPEN. */
export async function createAnswerAction(
  _prev: ForumFormState,
  formData: FormData,
): Promise<ForumFormState> {
  const session = await auth();
  if (!session?.user) return { error: "Vous devez être connecté." };
  if (!can(session.user.role, "answer:create")) {
    return { error: "Action non autorisée." };
  }

  const parsed = answerSchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const questionId = formData.get("questionId");
  const slug = formData.get("slug");
  if (typeof questionId !== "string") return { error: "Question introuvable." };

  await db.answer.create({
    data: {
      questionId,
      body: parsed.data.body,
      authorId: session.user.id,
    },
  });
  await db.question.updateMany({
    where: { id: questionId, status: "OPEN" },
    data: { status: "ANSWERED" },
  });

  if (typeof slug === "string") revalidatePath(`/forum/${slug}`);
  return undefined;
}

/** Voter (UP/DOWN) sur une question ou une réponse — togglable (Sprint 5). */
export async function voteAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user) return;
  if (!can(session.user.role, "content:vote")) return;

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
        userId: session.user.id,
        targetType,
        targetId,
      },
    },
  });

  if (!existing) {
    await db.vote.create({
      data: { userId: session.user.id, targetType, targetId, value },
    });
  } else if (existing.value === value) {
    await db.vote.delete({ where: { id: existing.id } });
  } else {
    await db.vote.update({ where: { id: existing.id }, data: { value } });
  }

  if (typeof slug === "string") revalidatePath(`/forum/${slug}`);
}

/** Accepter une réponse (Sprint 5). Réservé à l'auteur de la question. */
export async function acceptAnswerAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user) return;

  const answerId = formData.get("answerId");
  const slug = formData.get("slug");
  if (typeof answerId !== "string") return;

  const answer = await db.answer.findUnique({
    where: { id: answerId },
    select: { questionId: true, question: { select: { authorId: true } } },
  });
  if (!answer) return;
  if (answer.question.authorId !== session.user.id) return;

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

  if (typeof slug === "string") revalidatePath(`/forum/${slug}`);
}

/** Commenter une question ou une réponse (Sprint 5). */
export async function addCommentAction(
  _prev: ForumFormState,
  formData: FormData,
): Promise<ForumFormState> {
  const session = await auth();
  if (!session?.user) return { error: "Vous devez être connecté." };
  if (!can(session.user.role, "content:comment")) {
    return { error: "Action non autorisée." };
  }

  const parsed = commentSchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const rawType = formData.get("targetType");
  const targetId = formData.get("targetId");
  const slug = formData.get("slug");
  if (rawType !== "QUESTION" && rawType !== "ANSWER") {
    return { error: "Cible invalide." };
  }
  if (typeof targetId !== "string") return { error: "Cible invalide." };

  const targetType: EntityType = rawType;
  await db.comment.create({
    data: { body: parsed.data.body, authorId: session.user.id, targetType, targetId },
  });

  if (typeof slug === "string") revalidatePath(`/forum/${slug}`);
  return undefined;
}
