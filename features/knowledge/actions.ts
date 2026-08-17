"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { orNull, uniqueSlug } from "@/lib/utils";
import { guard, invalidMessage } from "@/lib/guard";
import { knowledgeSchema } from "@/lib/validators";
import { notify } from "@/features/notifications/notify";
import { award, awardVote } from "@/features/reputation/award";
import { recordAudit } from "@/features/audit/log";

export type KnowledgeFormState = { error?: string; createdSlug?: string } | undefined;

/**
 * Création d'une ressource (Sprint 4). Selon le bouton : brouillon (DRAFT)
 * ou soumission à validation (SUBMITTED). Réservé aux contributeurs.
 */
export async function createKnowledgeAction(
  _prev: KnowledgeFormState,
  formData: FormData,
): Promise<KnowledgeFormState> {
  const g = await guard({
    permission: "knowledge:create",
    verified: true,
    messages: { forbidden: "Réservé aux contributeurs." },
  });
  if (!g.ok) return { error: g.error };

  const parsed = knowledgeSchema.safeParse({
    title: formData.get("title"),
    summary: formData.get("summary") || undefined,
    content: formData.get("content"),
    type: formData.get("type"),
    language: formData.get("language") || "fr",
    level: formData.get("level") || undefined,
    externalUrl: formData.get("externalUrl") || "",
    provider: formData.get("provider") || undefined,
    durationMinutes: formData.get("durationMinutes") || undefined,
    isFree: formData.get("isFree") === "true",
  });

  if (!parsed.success) return { error: invalidMessage(parsed.error) };

  const submit = formData.get("intent") === "submit";
  const d = parsed.data;
  const slug = await uniqueSlug(d.title, "ressource", async (s) =>
    Boolean(
      await db.knowledge.findUnique({ where: { slug: s }, select: { id: true } }),
    ),
  );

  try {
    const knowledge = await db.knowledge.create({
      data: {
        title: d.title,
        slug,
        summary: orNull(d.summary),
        content: d.content,
        type: d.type,
        language: d.language,
        level: orNull(d.level),
        externalUrl: orNull(d.externalUrl),
        provider: orNull(d.provider),
        durationMinutes: d.durationMinutes ?? null,
        isFree: d.isFree,
        status: submit ? "SUBMITTED" : "DRAFT",
        authorId: g.user.id,
      },
    });
    await recordAudit({ actorId: g.user.id, action: "CREATE", entityType: "KNOWLEDGE", entityId: knowledge.id, after: { title: knowledge.title, content: knowledge.content, status: knowledge.status } });
  } catch (error) {
    console.error("knowledge creation failed", error);
    return { error: "La ressource n’a pas pu être enregistrée. Vos informations sont conservées à l’écran : réessayez dans un instant ou contactez l’équipe." };
  }

  revalidatePath("/knowledge");
  revalidatePath("/dashboard/contributions");
  return { createdSlug: slug };
}

/** Booster une ressource publiée — un seul boost par membre, retirable. */
export async function boostKnowledgeAction(formData: FormData): Promise<void> {
  const g = await guard({ permission: "content:vote", verified: true });
  if (!g.ok) return;

  const id = formData.get("id");
  const slug = formData.get("slug");
  if (typeof id !== "string" || typeof slug !== "string") return;

  const resource = await db.knowledge.findUnique({
    where: { id, status: "PUBLISHED" },
    select: { authorId: true },
  });
  if (!resource) return;

  const key = {
    userId: g.user.id,
    targetType: "KNOWLEDGE" as const,
    targetId: id,
  };
  const existing = await db.vote.findUnique({
    where: { userId_targetType_targetId: key },
  });

  if (existing) {
    await db.vote.delete({ where: { id: existing.id } });
  } else {
    await db.vote.create({ data: { ...key, value: "UP" } });
  }

  if (resource.authorId !== g.user.id) {
    await awardVote(resource.authorId, existing ? -1 : 1, {
      type: "KNOWLEDGE",
      id,
    });
  }

  revalidatePath(`/knowledge/${slug}`);
  revalidatePath("/knowledge");
}

/** Modération d'une ressource soumise (Sprint 4 / 8) : publier ou rejeter. */
export async function moderateKnowledgeAction(
  formData: FormData,
): Promise<void> {
  const g = await guard({ permission: "content:validate" });
  if (!g.ok) return;

  const id = formData.get("id");
  const decision = formData.get("decision");
  const slug = formData.get("slug");
  if (typeof id !== "string") return;

  if (decision === "publish") {
    const k = await db.knowledge.update({
      where: { id },
      data: { status: "PUBLISHED", publishedAt: new Date() },
      select: { authorId: true, title: true },
    });
    await notify({
      userId: k.authorId,
      actorId: g.user.id,
      type: "KNOWLEDGE_PUBLISHED",
      title: "Ta ressource a été publiée 🎉",
      body: `« ${k.title} » est désormais visible par la communauté.`,
      link:
        typeof slug === "string"
          ? `/knowledge/${slug}`
          : "/dashboard/contributions",
    });
    await award(k.authorId, "KNOWLEDGE_PUBLISHED", { type: "KNOWLEDGE", id });
  } else if (decision === "reject") {
    const k = await db.knowledge.update({
      where: { id },
      data: { status: "REJECTED" },
      select: { authorId: true, title: true },
    });
    await notify({
      userId: k.authorId,
      actorId: g.user.id,
      type: "KNOWLEDGE_REJECTED",
      title: "Ta ressource n'a pas été retenue",
      body: `« ${k.title} » n'a pas été publiée. Tu peux la retravailler et la soumettre à nouveau.`,
      link: "/dashboard/contributions",
    });
  } else {
    return;
  }

  if (typeof slug === "string") revalidatePath(`/knowledge/${slug}`);
  revalidatePath("/knowledge");
  revalidatePath("/dashboard/contributions");
}
