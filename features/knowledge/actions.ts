"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { orNull, uniqueSlug } from "@/lib/utils";
import { guard, invalidMessage } from "@/lib/guard";
import { knowledgeSchema } from "@/lib/validators";
import { notify } from "@/features/notifications/notify";
import { award } from "@/features/reputation/award";

export type KnowledgeFormState = { error?: string } | undefined;

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
  });

  if (!parsed.success) return { error: invalidMessage(parsed.error) };

  const submit = formData.get("intent") === "submit";
  const d = parsed.data;
  const slug = await uniqueSlug(d.title, "ressource", async (s) =>
    Boolean(
      await db.knowledge.findUnique({ where: { slug: s }, select: { id: true } }),
    ),
  );

  await db.knowledge.create({
    data: {
      title: d.title,
      slug,
      summary: orNull(d.summary),
      content: d.content,
      type: d.type,
      language: d.language,
      level: orNull(d.level),
      status: submit ? "SUBMITTED" : "DRAFT",
      authorId: g.user.id,
    },
  });

  revalidatePath("/knowledge");
  revalidatePath("/dashboard/contributions");
  redirect(`/knowledge/${slug}`);
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
