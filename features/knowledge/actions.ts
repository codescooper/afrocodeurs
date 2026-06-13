"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { can } from "@/lib/permissions";
import { knowledgeSchema } from "@/lib/validators";
import { notify } from "@/features/notifications/notify";
import { award } from "@/features/reputation/award";

export type KnowledgeFormState = { error?: string } | undefined;

/** Normalise une chaîne optionnelle : "" → null. */
function orNull(value: string | undefined): string | null {
  return value && value.length > 0 ? value : null;
}

/** Génère un slug unique à partir du titre. */
async function uniqueSlug(base: string): Promise<string> {
  const root = slugify(base) || "ressource";
  let slug = root;
  let n = 2;
  while (
    await db.knowledge.findUnique({ where: { slug }, select: { id: true } })
  ) {
    slug = `${root}-${n++}`;
  }
  return slug;
}

/**
 * Création d'une ressource (Sprint 4). Selon le bouton : brouillon (DRAFT)
 * ou soumission à validation (SUBMITTED). Réservé aux contributeurs.
 */
export async function createKnowledgeAction(
  _prev: KnowledgeFormState,
  formData: FormData,
): Promise<KnowledgeFormState> {
  const session = await auth();
  if (!session?.user) return { error: "Vous devez être connecté." };
  if (!can(session.user.role, "knowledge:create")) {
    return { error: "Réservé aux contributeurs." };
  }

  const parsed = knowledgeSchema.safeParse({
    title: formData.get("title"),
    summary: formData.get("summary") || undefined,
    content: formData.get("content"),
    type: formData.get("type"),
    language: formData.get("language") || "fr",
    level: formData.get("level") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const submit = formData.get("intent") === "submit";
  const d = parsed.data;
  const slug = await uniqueSlug(d.title);

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
      authorId: session.user.id,
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
  const session = await auth();
  if (!session?.user) return;
  if (!can(session.user.role, "content:validate")) return;

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
      actorId: session.user.id,
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
      actorId: session.user.id,
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
