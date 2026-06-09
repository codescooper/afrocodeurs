"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { can } from "@/lib/permissions";
import { problemSchema } from "@/lib/validators";

export type ProblemFormState = { error?: string } | undefined;

/** Normalise une chaîne optionnelle : "" → null. */
function orNull(value: string | undefined): string | null {
  return value && value.length > 0 ? value : null;
}

/** Transforme une saisie « a, b, c » en tableau nettoyé. */
function parseList(value: FormDataEntryValue | null): string[] {
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

/** Génère un slug unique à partir du titre (suffixe -2, -3… si collision). */
async function uniqueSlug(base: string): Promise<string> {
  const root = slugify(base) || "probleme";
  let slug = root;
  let n = 2;
  while (
    await db.problem.findUnique({ where: { slug }, select: { id: true } })
  ) {
    slug = `${root}-${n++}`;
  }
  return slug;
}

/** Proposition d'un problème (Sprint 3). Statut initial : PROPOSED. */
export async function createProblemAction(
  _prev: ProblemFormState,
  formData: FormData,
): Promise<ProblemFormState> {
  const session = await auth();
  if (!session?.user) return { error: "Vous devez être connecté." };
  if (!can(session.user.role, "problem:propose")) {
    return { error: "Action non autorisée." };
  }

  const parsed = problemSchema.safeParse({
    title: formData.get("title"),
    summary: formData.get("summary") || undefined,
    description: formData.get("description"),
    sector: formData.get("sector"),
    countries: parseList(formData.get("countries")),
    impactLevel: formData.get("impactLevel"),
    difficultyLevel: formData.get("difficultyLevel"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const d = parsed.data;
  const slug = await uniqueSlug(d.title);

  await db.problem.create({
    data: {
      title: d.title,
      slug,
      summary: orNull(d.summary),
      description: d.description,
      sector: d.sector,
      countries: d.countries,
      impactLevel: d.impactLevel,
      difficultyLevel: d.difficultyLevel,
      createdById: session.user.id,
    },
  });

  revalidatePath("/explorer");
  redirect(`/explorer/${slug}`);
}
