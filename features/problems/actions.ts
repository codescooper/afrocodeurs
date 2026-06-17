"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { orNull, parseList, uniqueSlug } from "@/lib/utils";
import { guard, invalidMessage } from "@/lib/guard";
import { problemSchema } from "@/lib/validators";
import { award } from "@/features/reputation/award";

export type ProblemFormState = { error?: string } | undefined;

/** Proposition d'un problème (Sprint 3). Statut initial : PROPOSED. */
export async function createProblemAction(
  _prev: ProblemFormState,
  formData: FormData,
): Promise<ProblemFormState> {
  const g = await guard({ permission: "problem:propose", verified: true });
  if (!g.ok) return { error: g.error };

  const parsed = problemSchema.safeParse({
    title: formData.get("title"),
    summary: formData.get("summary") || undefined,
    description: formData.get("description"),
    sector: formData.get("sector"),
    countries: parseList(formData.get("countries")),
    impactLevel: formData.get("impactLevel"),
    difficultyLevel: formData.get("difficultyLevel"),
  });

  if (!parsed.success) return { error: invalidMessage(parsed.error) };

  const d = parsed.data;
  const slug = await uniqueSlug(d.title, "probleme", async (s) =>
    Boolean(
      await db.problem.findUnique({ where: { slug: s }, select: { id: true } }),
    ),
  );

  const problem = await db.problem.create({
    data: {
      title: d.title,
      slug,
      summary: orNull(d.summary),
      description: d.description,
      sector: d.sector,
      countries: d.countries,
      impactLevel: d.impactLevel,
      difficultyLevel: d.difficultyLevel,
      createdById: g.user.id,
    },
  });
  await award(g.user.id, "PROBLEM_PROPOSED", {
    type: "PROBLEM",
    id: problem.id,
  });

  revalidatePath("/explorer");
  redirect(`/explorer/${slug}`);
}
