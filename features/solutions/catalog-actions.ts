"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { guard, invalidMessage } from "@/lib/guard";
import { rateLimit } from "@/lib/rate-limit";
import { notify } from "@/features/notifications/notify";
import { solutionSchema } from "@/lib/validators";
import { catalogSchema, catalogValues, claimSchema, reviewClaimSchema } from "./catalog";
import { reviewSolutionClaim, SolutionAccessError } from "./claim-service";
import { lockSolution } from "./team-service";
import { checkGithubProof } from "./github-proof";

export type CatalogState = { error?: string; success?: string } | undefined;

export async function checkSolutionGithubProofAction(_previous: CatalogState, form: FormData): Promise<CatalogState> {
  const g = await guard({ verified: true });
  if (!g.ok) return { error: g.error };
  const id = form.get("id");
  if (typeof id !== "string" || id.length > 100) return { error: "Demande invalide." };
  if (!rateLimit(`solution-proof:${g.user.id}`, 10, 3600000).ok) return { error: "Trop de vérifications. Réessayez plus tard." };
  const claim = await db.solutionClaim.findUnique({ where: { id }, include: { solution: { select: { repositoryUrl: true, slug: true } } } });
  if (!claim || claim.userId !== g.user.id || claim.status !== "PENDING") return { error: "Demande introuvable ou déjà traitée." };
  try {
    await checkGithubProof(claim.solution.repositoryUrl, claim.id, g.user.id);
    const changed = await db.solutionClaim.updateMany({ where: { id, userId: g.user.id, status: "PENDING", solution: { repositoryUrl: claim.solution.repositoryUrl } }, data: { githubVerifiedAt: new Date(), githubVerifiedRepo: claim.solution.repositoryUrl } });
    if (!changed.count) return { error: "La demande ou le dépôt a changé. Rechargez la page." };
    revalidatePath(`/atlas/${claim.solution.slug}`); revalidatePath("/admin/atlas");
    return { success: "Marqueur GitHub vérifié. Un administrateur indépendant doit encore valider le lien entre le dépôt et cette solution." };
  } catch (error) { return { error: error instanceof SolutionAccessError ? error.message : "Vérification GitHub indisponible. Réessayez ou utilisez la vérification manuelle." }; }
}

export async function requestSolutionClaimAction(_previous: CatalogState, form: FormData): Promise<CatalogState> {
  const g = await guard({ verified: true });
  if (!g.ok) return { error: g.error };
  const parsed = claimSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: invalidMessage(parsed.error) };
  if (!rateLimit(`solution-claim:${g.user.id}`, 5, 3600000).ok) return { error: "Trop de demandes. Réessayez dans une heure." };
  const solution = await db.solution.findUnique({ where: { id: parsed.data.solutionId }, select: { slug: true } });
  if (!solution) return { error: "Solution introuvable." };
  const reopened = await db.solutionClaim.updateMany({ where: { solutionId: parsed.data.solutionId, userId: g.user.id, status: "REJECTED" }, data: { evidence: parsed.data.evidence, status: "PENDING", reviewNote: null, reviewerId: null, reviewedAt: null, githubVerifiedAt: null, githubVerifiedRepo: null, revision: { increment: 1 } } });
  // A unique row per member and solution prevents duplicate/concurrent claims.
  await db.solutionClaim.createMany({ data: [{ ...parsed.data, userId: g.user.id }], skipDuplicates: true });
  revalidatePath(`/atlas/${solution.slug}`);
  revalidatePath("/admin/atlas");
  return { success: reopened.count ? "Votre demande a été soumise à nouveau avec les nouvelles preuves." : "Votre demande est enregistrée. Une vérification indépendante est nécessaire avant tout accès." };
}

export async function reviewSolutionClaimAction(_previous: CatalogState, form: FormData): Promise<CatalogState> {
  const g = await guard({ verified: true });
  if (!g.ok) return { error: g.error };
  const parsed = reviewClaimSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: invalidMessage(parsed.error) };
  try {
    const result = await reviewSolutionClaim(db, g.user, parsed.data);
    revalidatePath("/admin/atlas");
    revalidatePath(`/atlas/${result.slug}`);
    try { await notify({ userId: result.userId, actorId: g.user.id, type: "SOLUTION_CLAIM", title: parsed.data.status === "APPROVED" ? "Gestion de la fiche accordée" : "Demande de gestion refusée", body: parsed.data.note, link: `/atlas/${result.slug}` }); } catch { console.error("Solution claim notification failed"); }
    return { success: "Décision enregistrée et journalisée." };
  } catch (error) {
    if (error instanceof SolutionAccessError) return { error: error.message };
    throw error;
  }
}

export async function updateSolutionCatalogAction(_previous: CatalogState, form: FormData): Promise<CatalogState> {
  const g = await guard({ verified: true });
  if (!g.ok) return { error: g.error };
  const schema = solutionSchema.merge(catalogSchema).extend({ id: z.string().min(1).max(100), revision: z.coerce.number().int().positive() });
  const parsed = schema.safeParse({ ...Object.fromEntries(form), ...catalogValues(form) });
  if (!parsed.success) return { error: invalidMessage(parsed.error) };
  const { id, revision, ...values } = parsed.data;
  try {
    const slug = await db.$transaction(async tx => {
      await lockSolution(tx, id);
      const before = await tx.solution.findUnique({ where: { id } });
      if (!before) throw new SolutionAccessError("Solution introuvable.");
      const member = await tx.solutionMaintainer.findUnique({ where: { solutionId_userId: { solutionId: id, userId: g.user.id } } });
      if (!member && g.user.role !== "ADMIN") throw new SolutionAccessError("Cette fiche est réservée à ses gestionnaires vérifiés.");
      const updated = await tx.solution.updateMany({ where: { id, revision }, data: { ...values, repositoryUrl: values.repositoryUrl || null, websiteUrl: values.websiteUrl || null, documentationUrl: values.documentationUrl || null, licenseVerified: before.license === (values.license ?? null) && before.repositoryUrl === (values.repositoryUrl || null) ? before.licenseVerified : false, revision: { increment: 1 } } });
      if (!updated.count) throw new SolutionAccessError("La fiche a été modifiée. Rechargez-la avant de réessayer ; votre saisie reste affichée.");
      await tx.auditLog.create({ data: { actorId: g.user.id, action: "UPDATE", entityType: "SOLUTION", entityId: id, before: { name: before.name, description: before.description, type: before.type, country: before.country, websiteUrl: before.websiteUrl, documentationUrl: before.documentationUrl, repositoryUrl: before.repositoryUrl, license: before.license, licenseVerified: before.licenseVerified, sector: before.sector, lifecycle: before.lifecycle, countriesServed: before.countriesServed, languages: before.languages, contributionNeeds: before.contributionNeeds, africanContext: before.africanContext, revision: before.revision }, after: { ...values, revision: revision + 1 }, metadata: { operation: "solution_catalog_edit" } } });
      return before.slug;
    });
    revalidatePath("/atlas"); revalidatePath(`/atlas/${slug}`);
    return { success: "Fiche mise à jour. Rechargez avant une nouvelle modification." };
  } catch (error) { if (error instanceof SolutionAccessError) return { error: error.message }; throw error; }
}

export async function verifySolutionLicenseAction(_previous: CatalogState, form: FormData): Promise<CatalogState> {
  const g = await guard({ verified: true });
  if (!g.ok) return { error: g.error };
  if (g.user.role !== "ADMIN") return { error: "Action réservée aux administrateurs." };
  const parsed = z.object({ id: z.string().min(1), revision: z.coerce.number().int().positive(), verified: z.enum(["yes", "no"]), note: z.string().trim().min(20).max(2000) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Précisez la décision et la source de licence vérifiée (20 caractères minimum)." };
  try {
    const slug = await db.$transaction(async tx => {
      const solution = await tx.solution.findUnique({ where: { id: parsed.data.id } });
      if (!solution) throw new SolutionAccessError("Solution introuvable.");
      if (parsed.data.verified === "yes" && (!solution.repositoryUrl || !solution.license)) throw new SolutionAccessError("Un dépôt source et une licence sont nécessaires.");
      const changed = await tx.solution.updateMany({ where: { id: solution.id, revision: parsed.data.revision }, data: { licenseVerified: parsed.data.verified === "yes", revision: { increment: 1 } } });
      if (!changed.count) throw new SolutionAccessError("La fiche a changé. Rechargez la page.");
      await tx.auditLog.create({ data: { actorId: g.user.id, action: "UPDATE", entityType: "SOLUTION", entityId: solution.id, before: { licenseVerified: solution.licenseVerified }, after: { licenseVerified: parsed.data.verified === "yes" }, metadata: { operation: "solution_license_review", note: parsed.data.note } } });
      return solution.slug;
    });
    revalidatePath("/atlas"); revalidatePath(`/atlas/${slug}`);
    return { success: "Vérification de licence enregistrée. Rechargez avant une nouvelle décision." };
  } catch (error) { if (error instanceof SolutionAccessError) return { error: error.message }; throw error; }
}
