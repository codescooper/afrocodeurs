"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { can } from "@/lib/permissions";
import { solutionSchema } from "@/lib/validators";

export type SolutionFormState = { error?: string } | undefined;

/** Normalise une chaîne optionnelle : "" → null. */
function orNull(value: string | undefined): string | null {
  return value && value.length > 0 ? value : null;
}

/** Génère un slug unique à partir du nom. */
async function uniqueSlug(base: string): Promise<string> {
  const root = slugify(base) || "solution";
  let slug = root;
  let n = 2;
  while (
    await db.solution.findUnique({ where: { slug }, select: { id: true } })
  ) {
    slug = `${root}-${n++}`;
  }
  return slug;
}

/** Proposition d'une solution à l'AfroAtlas (Sprint 6). */
export async function createSolutionAction(
  _prev: SolutionFormState,
  formData: FormData,
): Promise<SolutionFormState> {
  const session = await auth();
  if (!session?.user) return { error: "Vous devez être connecté." };
  if (!can(session.user.role, "solution:propose")) {
    return { error: "Action non autorisée." };
  }

  const parsed = solutionSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    type: formData.get("type"),
    country: formData.get("country") || undefined,
    websiteUrl: formData.get("websiteUrl") || "",
    documentationUrl: formData.get("documentationUrl") || "",
    license: formData.get("license") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const d = parsed.data;
  const slug = await uniqueSlug(d.name);

  await db.solution.create({
    data: {
      name: d.name,
      slug,
      description: d.description,
      type: d.type,
      country: orNull(d.country),
      websiteUrl: orNull(d.websiteUrl),
      documentationUrl: orNull(d.documentationUrl),
      license: orNull(d.license),
      createdById: session.user.id,
    },
  });

  revalidatePath("/atlas");
  redirect(`/atlas/${slug}`);
}
