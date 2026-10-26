"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { guard, invalidMessage } from "@/lib/guard";
import { rateLimit } from "@/lib/rate-limit";
import { usernameSchema } from "@/lib/validators";
import { notify } from "@/features/notifications/notify";
import { SolutionAccessError } from "./claim-service";
import { inviteSolutionManager, respondSolutionInvitation, removeSolutionManager } from "./team-service";
import type { CatalogState } from "./catalog-actions";

async function refresh(solutionId: string) {
  const solution = await db.solution.findUnique({ where: { id: solutionId }, select: { slug: true } });
  if (solution) {
    revalidatePath(`/atlas/${solution.slug}`);
    revalidatePath(`/atlas/${solution.slug}/edit`);
  }
  revalidatePath("/dashboard/atlas");
  return solution;
}

export async function inviteSolutionManagerAction(_state: CatalogState, form: FormData): Promise<CatalogState> {
  const g = await guard({ verified: true });
  if (!g.ok) return { error: g.error };
  const parsed = z.object({ solutionId: z.string().min(1).max(100), username: usernameSchema, kind: z.enum(["COLLABORATE", "TRANSFER"]) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: invalidMessage(parsed.error) };
  if (!rateLimit(`solution-invite:${g.user.id}`, 10, 3600000).ok) return { error: "Trop d’invitations. Réessayez dans une heure." };
  try {
    const result = await inviteSolutionManager(db, g.user, parsed.data);
    const solution = await refresh(parsed.data.solutionId);
    try { await notify({ userId: result.recipientId, actorId: g.user.id, type: "SOLUTION_TEAM", title: "Invitation à gérer une solution", body: parsed.data.kind === "TRANSFER" ? "Un gestionnaire vous propose de reprendre son accès. Votre acceptation est nécessaire." : "Vous êtes invité à rejoindre l’équipe de gestion d’une fiche Atlas.", link: "/dashboard/atlas" }); } catch { console.error("Solution team notification failed"); }
    return { success: `Invitation envoyée pour ${solution?.slug ?? "cette solution"}. Elle expire dans sept jours.` };
  } catch (error) { if (error instanceof SolutionAccessError) return { error: error.message }; throw error; }
}

export async function respondSolutionInvitationAction(_state: CatalogState, form: FormData): Promise<CatalogState> {
  const g = await guard({ verified: true });
  if (!g.ok) return { error: g.error };
  const parsed = z.object({ id: z.string().min(1).max(100), decision: z.enum(["ACCEPT", "DECLINE", "CANCEL"]) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: invalidMessage(parsed.error) };
  try {
    const result = await respondSolutionInvitation(db, g.user, parsed.data);
    await refresh(result.solutionId);
    try { await notify({ userId: result.recipientId, actorId: g.user.id, type: "SOLUTION_TEAM", title: "Réponse à votre invitation Atlas", body: result.status === "ACCEPTED" ? "L’invitation a été acceptée." : "L’invitation a été refusée ou annulée.", link: "/dashboard/atlas" }); } catch { console.error("Solution team response notification failed"); }
    return { success: "Réponse enregistrée. Rechargez pour consulter vos accès à jour." };
  } catch (error) { if (error instanceof SolutionAccessError) return { error: error.message }; throw error; }
}

export async function removeSolutionManagerAction(_state: CatalogState, form: FormData): Promise<CatalogState> {
  const g = await guard({ verified: true });
  if (!g.ok) return { error: g.error };
  const parsed = z.object({ solutionId: z.string().min(1).max(100), userId: z.string().min(1).max(100), note: z.string().trim().min(20, "Indiquez le motif du retrait (20 caractères minimum).").max(2000), confirmed: z.literal("on", { error: "Confirmez le retrait de l’accès." }) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: invalidMessage(parsed.error) };
  try {
    await removeSolutionManager(db, g.user, parsed.data);
    await refresh(parsed.data.solutionId);
    try { await notify({ userId: parsed.data.userId, actorId: g.user.id, type: "SOLUTION_TEAM", title: "Accès de gestion retiré", body: parsed.data.note, link: "/dashboard/atlas" }); } catch { console.error("Solution access notification failed"); }
    return { success: "Accès retiré et décision journalisée." };
  } catch (error) { if (error instanceof SolutionAccessError) return { error: error.message }; throw error; }
}
