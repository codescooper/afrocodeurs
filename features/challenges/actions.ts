"use server";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { guard, invalidMessage } from "@/lib/guard";
import { challengeAnswerSchema, challengeSchema } from "@/lib/validators";
import { uniqueSlug } from "@/lib/utils";
import { award } from "@/features/reputation/award";
import { CHALLENGE_BASE_POINTS, HINT_PENALTIES, challengeScore } from "./constants";

export type ChallengeState = { error?: string; success?: string } | undefined;

function normalizeAnswer(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("fr").replace(/\s+/g, " ");
}

function hashAnswer(answer: string, salt: string) {
  return createHash("sha256").update(`${salt}:${normalizeAnswer(answer)}`).digest("hex");
}

export async function createChallengeAction(_: ChallengeState, formData: FormData): Promise<ChallengeState> {
  const g = await guard({ permission: "challenge:create", verified: true });
  if (!g.ok) return { error: g.error };
  const parsed = challengeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: invalidMessage(parsed.error) };

  const data = parsed.data;
  const slug = await uniqueSlug(data.title, "defi", async (candidate) => Boolean(await db.challenge.findUnique({ where: { slug: candidate }, select: { id: true } })));
  const salt = randomBytes(16).toString("hex");
  const hints = [data.hint1, data.hint2, data.hint3].flatMap((value, index) => {
    const content = value?.trim();
    return content ? [{ content, position: index + 1, penalty: HINT_PENALTIES[index] }] : [];
  });

  const challenge = await db.challenge.create({
    data: {
      title: data.title,
      slug,
      story: data.story?.trim() || null,
      instructions: data.instructions,
      difficulty: data.difficulty,
      mode: data.mode,
      basePoints: CHALLENGE_BASE_POINTS[data.difficulty],
      answerHash: hashAnswer(data.answer, salt),
      answerSalt: salt,
      completionCode: data.mode === "PIXEL_TERMINAL" ? data.answer : null,
      solutionExplanation: data.solutionExplanation,
      status: formData.get("intent") === "draft" ? "DRAFT" : "SUBMITTED",
      authorId: g.user.id,
      hints: { create: hints },
    },
  });
  redirect(`/challenges/${challenge.slug}`);
}

export async function submitChallengeAnswer(_: ChallengeState, formData: FormData): Promise<ChallengeState> {
  const g = await guard({ permission: "challenge:solve", verified: true });
  if (!g.ok) return { error: g.error };
  const id = formData.get("id");
  if (typeof id !== "string") return { error: "Défi introuvable." };
  const parsed = challengeAnswerSchema.safeParse({ answer: formData.get("answer") });
  if (!parsed.success) return { error: invalidMessage(parsed.error) };

  const challenge = await db.challenge.findUnique({ where: { id }, include: { hintUnlocks: { where: { userId: g.user.id }, select: { hint: { select: { penalty: true } } } } } });
  if (!challenge || challenge.status !== "PUBLISHED") return { error: "Ce défi n’est pas ouvert." };
  if (challenge.closeAt && challenge.closeAt <= new Date()) return { error: "La période de résolution est terminée." };
  if (await db.challengeSolve.findUnique({ where: { challengeId_userId: { challengeId: id, userId: g.user.id } } })) return { success: "Déjà résolue !" };
  if (challenge.mode === "PIXEL_TERMINAL") {
    const progress = await db.challengeProgress.findUnique({ where: { challengeId_userId: { challengeId: id, userId: g.user.id } }, select: { step: true } });
    if (!progress || progress.step < 8) return { error: "Terminez d’abord la mission interactive pour découvrir le flag." };
  }

  const attempts = await db.challengeAttempt.count({ where: { challengeId: id, userId: g.user.id } });
  if (attempts >= challenge.maxAttempts) return { error: "Nombre maximal de tentatives atteint." };
  const recent = await db.challengeAttempt.count({ where: { challengeId: id, userId: g.user.id, createdAt: { gte: new Date(Date.now() - 60_000) } } });
  if (recent >= 5) return { error: "Trop de tentatives. Patientez une minute." };

  const candidate = Buffer.from(hashAnswer(parsed.data.answer, challenge.answerSalt), "hex");
  const expected = Buffer.from(challenge.answerHash, "hex");
  const correct = candidate.length === expected.length && timingSafeEqual(candidate, expected);
  await db.challengeAttempt.create({ data: { challengeId: id, userId: g.user.id, correct } });
  if (!correct) {
    revalidatePath(`/challenges/${challenge.slug}`);
    return { error: `Ce n’est pas encore ça. Il vous reste ${challenge.maxAttempts - attempts - 1} tentative(s).` };
  }

  const penalties = challenge.hintUnlocks.reduce((sum, unlock) => sum + unlock.hint.penalty, 0);
  const score = challengeScore(challenge.basePoints, attempts + 1, penalties);
  await db.challengeSolve.create({ data: { challengeId: id, userId: g.user.id, score, attemptsUsed: attempts + 1, hintsUsed: challenge.hintUnlocks.length } });
  await award(g.user.id, "CHALLENGE_SOLVED", { type: "CHALLENGE", id });
  revalidatePath(`/challenges/${challenge.slug}`);
  revalidatePath("/challenges");
  return { success: `Bravo ! Énigme résolue : +${score} points.` };
}

export async function unlockHintAction(formData: FormData) {
  const g = await guard({ permission: "challenge:solve", verified: true });
  if (!g.ok) return;
  const hintId = formData.get("hintId");
  const slug = formData.get("slug");
  if (typeof hintId !== "string" || typeof slug !== "string") return;
  const hint = await db.challengeHint.findUnique({ where: { id: hintId }, select: { challengeId: true, challenge: { select: { status: true } } } });
  if (!hint || hint.challenge.status !== "PUBLISHED") return;
  await db.challengeHintUnlock.upsert({ where: { hintId_userId: { hintId, userId: g.user.id } }, create: { hintId, challengeId: hint.challengeId, userId: g.user.id }, update: {} });
  revalidatePath(`/challenges/${slug}`);
}

export async function moderateChallengeAction(formData: FormData) {
  const g = await guard({ permission: "challenge:moderate" });
  if (!g.ok) return;
  const id = formData.get("id");
  const decision = formData.get("decision");
  if (typeof id !== "string") return;
  const challenge = await db.challenge.findUnique({ where: { id }, select: { slug: true, authorId: true } });
  if (!challenge) return;
  const now = new Date();
  if (decision === "publish") {
    await db.$transaction([
      db.challenge.updateMany({
        where: { status: "PUBLISHED", id: { not: id } },
        data: { status: "CLOSED", closeAt: now },
      }),
      db.challenge.update({ where: { id }, data: { status: "PUBLISHED", publishAt: now, publishedAt: now, closeAt: new Date(now.getTime() + 7 * 86_400_000) } }),
    ]);
    await award(challenge.authorId, "CHALLENGE_CREATED", { type: "CHALLENGE", id });
  } else if (decision === "testing") await db.challenge.update({ where: { id }, data: { status: "TESTING" } });
  else if (decision === "reject") await db.challenge.update({ where: { id }, data: { status: "REJECTED" } });
  revalidatePath("/admin");
  revalidatePath("/challenges");
  revalidatePath(`/challenges/${challenge.slug}`);
}
