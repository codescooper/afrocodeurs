"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { guard, invalidMessage } from "@/lib/guard";
import { orNull, uniqueSlug } from "@/lib/utils";
import { notify } from "@/features/notifications/notify";
import { opportunityResponseSchema, opportunitySchema } from "./validators";

export type OpportunityFormState = { error?: string; success?: string } | undefined;

export async function createOpportunityAction(_: OpportunityFormState, formData: FormData): Promise<OpportunityFormState> {
  const g = await guard({ verified: true });
  if (!g.ok) return { error: g.error };
  const parsed = opportunitySchema.safeParse({
    title: formData.get("title"), organization: formData.get("organization"), type: formData.get("type"),
    summary: formData.get("summary"), description: formData.get("description"), requirements: formData.get("requirements") || undefined,
    location: formData.get("location") || undefined, externalUrl: formData.get("externalUrl") || "", deadline: formData.get("deadline") || "",
    isRemote: formData.get("isRemote") === "true",
  });
  if (!parsed.success) return { error: invalidMessage(parsed.error) };
  const d = parsed.data;
  const slug = await uniqueSlug(d.title, "opportunite", async (value) => Boolean(await db.opportunity.findUnique({ where: { slug: value }, select: { id: true } })));
  await db.opportunity.create({ data: {
    title: d.title, slug, organization: d.organization, type: d.type, summary: d.summary, description: d.description,
    requirements: orNull(d.requirements), location: orNull(d.location), externalUrl: orNull(d.externalUrl), isRemote: d.isRemote,
    deadline: d.deadline ? new Date(`${d.deadline}T23:59:59.999Z`) : null, authorId: g.user.id,
  } });
  revalidatePath("/opportunities");
  redirect(`/opportunities/${slug}`);
}

export async function respondToOpportunityAction(_: OpportunityFormState, formData: FormData): Promise<OpportunityFormState> {
  const g = await guard({ verified: true });
  if (!g.ok) return { error: g.error };
  const parsed = opportunityResponseSchema.safeParse({ opportunityId: formData.get("opportunityId"), kind: formData.get("kind"), message: formData.get("message") || undefined });
  if (!parsed.success) return { error: invalidMessage(parsed.error) };
  const opportunity = await db.opportunity.findUnique({ where: { id: parsed.data.opportunityId }, select: { id: true, slug: true, title: true, authorId: true, status: true } });
  if (!opportunity || opportunity.status !== "ACTIVE") return { error: "Cette opportunité n’accepte plus de réponses." };
  if (opportunity.authorId === g.user.id) return { error: "Vous êtes l’auteur de cette opportunité." };
  await db.opportunityResponse.upsert({
    where: { opportunityId_userId: { opportunityId: opportunity.id, userId: g.user.id } },
    create: { opportunityId: opportunity.id, userId: g.user.id, kind: parsed.data.kind, message: orNull(parsed.data.message) },
    update: { kind: parsed.data.kind, message: orNull(parsed.data.message) },
  });
  await notify({
    userId: opportunity.authorId, actorId: g.user.id, type: "OPPORTUNITY_RESPONSE",
    title: parsed.data.kind === "APPLICATION" ? "Nouvelle candidature" : "Nouveau membre intéressé",
    body: `@${g.user.username} a répondu à « ${opportunity.title} ».`, link: `/opportunities/${opportunity.slug}`,
  });
  revalidatePath(`/opportunities/${opportunity.slug}`);
  return { success: parsed.data.kind === "APPLICATION" ? "Votre candidature a été transmise." : "Votre intérêt a été enregistré." };
}
