"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { orNull, uniqueSlug } from "@/lib/utils";
import { guard, invalidMessage } from "@/lib/guard";
import { solutionSchema } from "@/lib/validators";
import { award } from "@/features/reputation/award";

export type SolutionFormState = { error?: string } | undefined;

/** Proposition d'une solution à l'AfroAtlas (Sprint 6). */
export async function createSolutionAction(
  _prev: SolutionFormState,
  formData: FormData,
): Promise<SolutionFormState> {
  const g = await guard({ permission: "solution:propose", verified: true });
  if (!g.ok) return { error: g.error };

  const parsed = solutionSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    type: formData.get("type"),
    country: formData.get("country") || undefined,
    websiteUrl: formData.get("websiteUrl") || "",
    documentationUrl: formData.get("documentationUrl") || "",
    license: formData.get("license") || undefined,
  });

  if (!parsed.success) return { error: invalidMessage(parsed.error) };

  const d = parsed.data;
  const slug = await uniqueSlug(d.name, "solution", async (s) =>
    Boolean(
      await db.solution.findUnique({ where: { slug: s }, select: { id: true } }),
    ),
  );

  const solution = await db.solution.create({
    data: {
      name: d.name,
      slug,
      description: d.description,
      type: d.type,
      country: orNull(d.country),
      websiteUrl: orNull(d.websiteUrl),
      documentationUrl: orNull(d.documentationUrl),
      license: orNull(d.license),
      createdById: g.user.id,
    },
  });
  await award(g.user.id, "SOLUTION_ADDED", {
    type: "SOLUTION",
    id: solution.id,
  });

  revalidatePath("/atlas");
  redirect(`/atlas/${slug}`);
}
