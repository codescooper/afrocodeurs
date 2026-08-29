"use server";

import type { EntityType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { guard } from "@/lib/guard";
import { analyzeFeedback } from "./analyze";
import {
  linkFeedbackToGoal,
  promoteSourceFeedback,
  triageFeedback,
  updateGoalStatus,
} from "./lifecycle";

export type FeedbackState = { error?: string; success?: string } | undefined;
const feedbackSchema = z.object({ title: z.string().trim().min(8).max(180), description: z.string().trim().min(20).max(5000), sourceUrl: z.string().startsWith("/").max(500).optional() });

export async function submitProductFeedbackAction(_previous: FeedbackState, formData: FormData): Promise<FeedbackState> {
  const g = await guard({ verified: true });
  if (!g.ok) return { error: g.error };
  const parsed = feedbackSchema.safeParse({ title: formData.get("title"), description: formData.get("description"), sourceUrl: formData.get("sourceUrl") || undefined });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Demande invalide." };
  const analysis = analyzeFeedback(parsed.data.title, parsed.data.description);
  await db.$transaction(async (tx) => {
    const feedback = await tx.productFeedback.create({ data: { ...parsed.data, ...analysis, authorId: g.user.id } });
    await tx.auditLog.create({
      data: {
        actorId: g.user.id,
        action: "CREATE",
        entityType: "PRODUCT_FEEDBACK",
        entityId: feedback.id,
        after: { title: feedback.title, status: feedback.status, authorId: feedback.authorId },
      },
    });
  });
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
  await promoteSourceFeedback({
    sourceType,
    sourceId,
    title,
    description,
    sourceUrl: typeof sourceUrl === "string" ? sourceUrl : null,
    actorId: g.user.id,
  });
  revalidatePath("/admin/feedback");
}

export async function triageFeedbackAction(formData: FormData): Promise<void> {
  const g = await guard({ permission: "content:manage" });
  if (!g.ok) return;
  const id = formData.get("id");
  const decision = formData.get("decision");
  if (typeof id !== "string" || !["review", "reject", "convert"].includes(String(decision))) return;
  await triageFeedback(id, decision as "review" | "reject" | "convert", g.user.id);
  revalidatePath("/admin/feedback");
  revalidatePath("/updates");
}

export async function linkFeedbackToGoalAction(formData: FormData): Promise<void> {
  const g = await guard({ permission: "content:manage" });
  if (!g.ok) return;
  const feedbackId = formData.get("feedbackId");
  const goalId = formData.get("goalId");
  if (typeof feedbackId !== "string" || typeof goalId !== "string") return;
  await linkFeedbackToGoal(feedbackId, goalId, g.user.id);
  revalidatePath("/admin/feedback");
  revalidatePath("/updates");
}

export async function updateDevelopmentGoalAction(formData: FormData): Promise<void> {
  const g = await guard({ permission: "content:manage" });
  if (!g.ok) return;
  const id = formData.get("id");
  const status = formData.get("status");
  if (typeof id !== "string" || !(status === "PLANNED" || status === "IN_PROGRESS" || status === "SHIPPED" || status === "CANCELLED")) return;
  await updateGoalStatus(id, status, g.user.id);
  revalidatePath("/admin/feedback");
  revalidatePath("/updates");
  revalidatePath("/dashboard");
}
