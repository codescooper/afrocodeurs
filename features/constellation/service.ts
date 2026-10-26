import "server-only";
import { randomUUID } from "node:crypto";
import { Prisma, type PrismaClient, type UserRole } from "@prisma/client";
import { slugify } from "@/lib/utils";
import { hasRank } from "@/lib/permissions";
import { sendPush } from "@/features/notifications/push";
import { categoryForType } from "@/features/notifications/constants";
import { ventureSchema, type CollaborationCommand } from "./validators";
import type { z } from "zod";

export class VentureError extends Error {}
function fail(message: string): never { throw new VentureError(message); }
type Notice = { userId: string; title: string; type: string };
const blockedPair = (a: string, b: string) => ({ OR: [{ blockerId: a, blockedId: b }, { blockerId: b, blockedId: a }] });

async function notice(tx: Prisma.TransactionClient, queue: Notice[], userId: string, actorId: string, title: string, type = "VENTURE_DECISION") {
  if (userId === actorId) return;
  const user = await tx.user.findUnique({ where: { id: userId }, select: { notificationOptOut: true } });
  const category = categoryForType(type);
  if (!user || (category && user.notificationOptOut.includes(category))) return;
  await tx.notification.create({ data: { userId, type, title, body: "Une mise à jour t'attend dans ton espace Constellation.", link: "/dashboard/constellation" } });
  queue.push({ userId, title, type });
}

async function atomic<T>(db: PrismaClient, work: (tx: Prisma.TransactionClient, queue: Notice[]) => Promise<T>): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const queue: Notice[] = [];
    try {
      const result = await db.$transaction((tx) => work(tx, queue), { isolationLevel: "Serializable" });
      await Promise.all(queue.map((n) => sendPush(n.userId, { title: n.title, body: "Une mise à jour t'attend dans ton espace Constellation.", url: "/dashboard/constellation" }).catch(() => {})));
      return result;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2034" && attempt < 2) continue;
        if (error.code === "P2034") fail("Une autre mise à jour est en cours. Actualise puis réessaie.");
        if (error.code === "P2002") fail("Cette réalisation ou cette demande est déjà référencée.");
      }
      throw error;
    }
  }
  return fail("Réessaie dans un instant.");
}

export async function saveVenture(db: PrismaClient, userId: string, data: z.infer<typeof ventureSchema>) {
  return atomic(db, async (tx) => {
    if (data.openSourceProjectId) {
      const project = await tx.project.findFirst({ where: { id: data.openSourceProjectId, createdById: userId }, select: { id: true } });
      if (!project) fail("Le projet open source associé doit être un de tes projets.");
    }
    const fields = {
      name: data.name, summary: data.summary, description: data.description, country: data.country, sector: data.sector,
      websiteUrl: new URL(data.websiteUrl).href, logoUrl: data.logoUrl || null, screenshots: data.screenshots, needs: data.needs,
      openSourceProjectId: data.openSourceProjectId || null,
    };
    if (data.id) {
      const changed = await tx.communityVenture.updateMany({ where: { id: data.id, ownerId: userId, status: { not: "SUSPENDED" } }, data: { ...fields, status: "PENDING", reviewNote: null, revision: { increment: 1 } } });
      if (changed.count !== 1) fail("Cette fiche est introuvable ou suspendue par la modération.");
      return;
    }
    if (await tx.communityVenture.count({ where: { ownerId: userId } }) >= 20) fail("Tu as déjà vingt réalisations référencées. Contacte la modération.");
    await tx.communityVenture.create({ data: { ...fields, slug: `${slugify(data.name) || "realisation"}-${randomUUID().slice(0, 8)}`, ownerId: userId } });
  });
}

export async function reviewVenture(db: PrismaClient, actor: { id: string; role: UserRole }, input: { id: string; revision: number; status: "PUBLISHED" | "ARCHIVED"; note: string }) {
  if (!hasRank(actor.role, "MODERATOR")) fail("Action réservée à la modération.");
  return atomic(db, async (tx, queue) => {
    const venture = await tx.communityVenture.findUnique({ where: { id: input.id } });
    if (!venture || venture.status !== "PENDING" || venture.revision !== input.revision) fail("La fiche a changé depuis son ouverture. Recharge la page.");
    const selfReview = venture.ownerId === actor.id;
    if (selfReview && actor.role !== "ADMIN") fail("Une autre personne doit valider ta propre réalisation.");
    const result = await tx.communityVenture.updateMany({ where: { id: venture.id, status: "PENDING", revision: input.revision }, data: { status: input.status, reviewNote: input.note || null, revision: { increment: 1 } } });
    if (result.count !== 1) fail("La fiche vient d'être mise à jour.");
    await tx.auditLog.create({ data: {
      actorId: actor.id, action: "UPDATE", entityType: "COMMUNITY_VENTURE", entityId: venture.id,
      before: { status: venture.status, revision: venture.revision },
      after: { status: input.status, revision: input.revision + 1, reviewNote: input.note || null },
      metadata: { operation: "review", selfReview, reviewerRole: actor.role },
    } });
    await notice(tx, queue, venture.ownerId, actor.id, input.status === "PUBLISHED" ? "Ta réalisation rejoint la Constellation" : "Ta fiche nécessite des ajustements", "VENTURE_PUBLISHED");
  });
}

export async function archiveVenture(db: PrismaClient, userId: string, id: string) {
  return atomic(db, async (tx) => {
    const result = await tx.communityVenture.updateMany({ where: { id, ownerId: userId, status: { not: "SUSPENDED" } }, data: { status: "ARCHIVED", revision: { increment: 1 } } });
    if (result.count !== 1) fail("Fiche introuvable ou suspendue.");
    await tx.ventureCollaboration.updateMany({ where: { ventureId: id, status: "PENDING" }, data: { status: "CANCELLED" } });
  });
}

export async function collaborate(db: PrismaClient, userId: string, command: CollaborationCommand) {
  return atomic(db, async (tx, queue) => {
    if (command.command === "block" || command.command === "unblock") {
      if (command.id === userId) fail("Tu ne peux pas te bloquer toi-même.");
      if (command.command === "unblock") {
        await tx.ventureBlock.deleteMany({ where: { blockerId: userId, blockedId: command.id } });
        return;
      }
      if (!await tx.user.findUnique({ where: { id: command.id }, select: { id: true } })) fail("Membre introuvable.");
      await tx.ventureBlock.upsert({ where: { blockerId_blockedId: { blockerId: userId, blockedId: command.id } }, create: { blockerId: userId, blockedId: command.id }, update: {} });
      await tx.ventureCollaboration.updateMany({ where: { status: { in: ["PENDING", "ACCEPTED"] }, OR: [
        { applicantId: userId, venture: { ownerId: command.id } }, { applicantId: command.id, venture: { ownerId: userId } },
      ] }, data: { status: "CANCELLED" } });
      return;
    }
    if (command.command === "request") {
      const venture = await tx.communityVenture.findFirst({ where: { id: command.id, status: "PUBLISHED" } });
      if (!venture) fail("Cette réalisation n'est pas disponible.");
      if (venture.ownerId === userId) fail("Tu es déjà le porteur de cette réalisation.");
      if (await tx.ventureBlock.findFirst({ where: blockedPair(userId, venture.ownerId) })) fail("Cette collaboration n'est pas disponible.");
      if (await tx.ventureCollaboration.count({ where: { applicantId: userId, status: "PENDING" } }) >= 5) fail("Tu as déjà cinq propositions en attente.");
      await tx.ventureCollaboration.create({ data: { ventureId: venture.id, applicantId: userId, message: command.message } });
      await notice(tx, queue, venture.ownerId, userId, "Nouvelle proposition de collaboration", "VENTURE_REQUEST");
      return;
    }
    const request = await tx.ventureCollaboration.findUnique({ where: { id: command.id }, include: { venture: { select: { ownerId: true, status: true } } } });
    if (!request || (request.applicantId !== userId && request.venture.ownerId !== userId)) fail("Proposition introuvable.");
    if (command.status === "CANCELLED") {
      if (!["PENDING", "ACCEPTED"].includes(request.status)) fail("Cette proposition est déjà terminée.");
    } else {
      if (request.venture.ownerId !== userId || request.status !== "PENDING") fail("Tu ne peux pas prendre cette décision.");
      if (request.venture.status !== "PUBLISHED") fail("La fiche n'est plus publique.");
      if (await tx.ventureBlock.findFirst({ where: blockedPair(userId, request.applicantId) })) fail("Cette collaboration n'est pas disponible.");
    }
    const result = await tx.ventureCollaboration.updateMany({ where: { id: request.id, status: request.status }, data: { status: command.status } });
    if (result.count !== 1) fail("La proposition vient d'être traitée.");
    await notice(tx, queue, userId === request.venture.ownerId ? request.applicantId : request.venture.ownerId, userId, "Ta proposition de collaboration a évolué");
  });
}
