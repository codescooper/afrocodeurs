"use server";

import type { EntityType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { guard } from "@/lib/guard";
import { analyzeFeedback } from "./analyze";

export type FeedbackState = { error?: string; success?: string } | undefined;
const feedbackSchema = z.object({ title: z.string().trim().min(8).max(180), description: z.string().trim().min(20).max(5000), sourceUrl: z.string().startsWith("/").max(500).optional() });

export async function submitProductFeedbackAction(_previous: FeedbackState, formData: FormData): Promise<FeedbackState> {
  const g = await guard({ verified: true });
  if (!g.ok) return { error: g.error };
  const parsed = feedbackSchema.safeParse({ title: formData.get("title"), description: formData.get("description"), sourceUrl: formData.get("sourceUrl") || undefined });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Demande invalide." };
  const analysis = analyzeFeedback(parsed.data.title, parsed.data.description);
  await db.productFeedback.create({ data: { ...parsed.data, ...analysis, authorId: g.user.id } });
  revalidatePath("/admin/feedback");
  return { success: "Merci ! La demande a été analysée et transmise à l’équipe." };
}

export async function promoteContentToFeedbackAction(formData: FormData): Promise<void> {
  const g = await guard({ permission: "report:handle" });
  if (!g.ok) return;
  const sourceType = formData.get("sourceType") as EntityType;
  const sourceId = formData.get("sourceId");
  const title = formData.get("title");
  const description = formData.get("description");
  const sourceUrl = formData.get("sourceUrl");
  if (!(sourceType === "QUESTION" || sourceType === "PROBLEM" || sourceType === "KNOWLEDGE") || typeof sourceId !== "string" || typeof title !== "string" || typeof description !== "string") return;
  const analysis = analyzeFeedback(title, description);
  await db.productFeedback.upsert({
    where: { id: `${sourceType.toLowerCase()}-${sourceId}` },
    create: { id: `${sourceType.toLowerCase()}-${sourceId}`, title, description, sourceType, sourceId, sourceUrl: typeof sourceUrl === "string" ? sourceUrl : null, authorId: g.user.id, ...analysis },
    update: { title, description, ...analysis },
  });
  revalidatePath("/admin/feedback");
}

export async function triageFeedbackAction(formData: FormData): Promise<void> {
  const g = await guard({ permission: "content:manage" });
  if (!g.ok) return;
  const id = formData.get("id");
  const decision = formData.get("decision");
  if (typeof id !== "string" || !["review", "reject", "convert"].includes(String(decision))) return;
  if (decision === "review") await db.productFeedback.update({ where: { id }, data: { status: "REVIEWING" } });
  if (decision === "reject") await db.productFeedback.update({ where: { id }, data: { status: "REJECTED" } });
  if (decision === "convert") {
    const feedback = await db.productFeedback.findUnique({ where: { id } });
    if (!feedback) return;
    await db.$transaction([
      db.developmentGoal.upsert({ where: { feedbackId: id }, create: { feedbackId: id, title: feedback.title, summary: feedback.description, priority: feedback.priorityScore, createdById: g.user.id }, update: { title: feedback.title, summary: feedback.description, priority: feedback.priorityScore } }),
      db.productFeedback.update({ where: { id }, data: { status: "CONVERTED" } }),
    ]);
  }
  revalidatePath("/admin/feedback");
  revalidatePath("/roadmap");
}

export async function updateDevelopmentGoalAction(formData: FormData): Promise<void> {
  const g = await guard({ permission: "content:manage" });
  if (!g.ok) return;
  const id = formData.get("id");
  const status = formData.get("status");
  if (typeof id !== "string" || !(status === "PLANNED" || status === "IN_PROGRESS" || status === "SHIPPED" || status === "CANCELLED")) return;
  await db.developmentGoal.update({ where: { id }, data: { status } });
  revalidatePath("/admin/feedback");
  revalidatePath("/roadmap");
}
