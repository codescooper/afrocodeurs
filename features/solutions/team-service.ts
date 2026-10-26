import "server-only";
import type { Prisma, PrismaClient, UserRole } from "@prisma/client";
import { SolutionAccessError } from "./claim-service";

type Actor = { id: string; role: UserRole };

// All membership changes take the same solution-row lock, including claim review.
export async function lockSolution(tx: Prisma.TransactionClient, id: string) {
  const rows = await tx.$queryRaw<{ id: string }[]>`SELECT "id" FROM "Solution" WHERE "id" = ${id} FOR UPDATE`;
  if (!rows.length) throw new SolutionAccessError("Solution introuvable.");
}

export async function inviteSolutionManager(db: PrismaClient, actor: Actor, input: { solutionId: string; username: string; kind: "COLLABORATE" | "TRANSFER" }) {
  return db.$transaction(async tx => {
    await lockSolution(tx, input.solutionId);
    const member = await tx.solutionMaintainer.findUnique({ where: { solutionId_userId: { solutionId: input.solutionId, userId: actor.id } } });
    if (!member && actor.role !== "ADMIN") throw new SolutionAccessError("Seuls les gestionnaires et administrateurs peuvent inviter.");
    if (!member && input.kind === "TRANSFER") throw new SolutionAccessError("Vous ne pouvez transférer que votre propre accès.");
    const recipient = await tx.user.findUnique({ where: { username: input.username }, select: { id: true, emailVerified: true } });
    if (!recipient?.emailVerified) throw new SolutionAccessError("Ce membre est introuvable ou son email n’est pas vérifié.");
    if (recipient.id === actor.id) throw new SolutionAccessError("Vous disposez déjà de votre propre accès.");
    if (await tx.solutionMaintainer.findUnique({ where: { solutionId_userId: { solutionId: input.solutionId, userId: recipient.id } } })) throw new SolutionAccessError("Ce membre gère déjà la fiche.");
    const expiresAt = new Date(Date.now() + 7 * 86400000);
    await tx.solutionInvitation.updateMany({ where: { solutionId: input.solutionId, recipientId: recipient.id, status: "PENDING", expiresAt: { lte: new Date() } }, data: { status: "EXPIRED" } });
    if (await tx.solutionInvitation.findFirst({ where: { solutionId: input.solutionId, recipientId: recipient.id, status: "PENDING" } })) throw new SolutionAccessError("Une invitation est déjà en attente pour ce membre.");
    const invitation = await tx.solutionInvitation.create({ data: { solutionId: input.solutionId, senderId: actor.id, recipientId: recipient.id, kind: input.kind, expiresAt } });
    await tx.auditLog.create({ data: { actorId: actor.id, action: "UPDATE", entityType: "SOLUTION", entityId: input.solutionId, metadata: { operation: "solution_team_invite", invitationId: invitation.id, recipientId: recipient.id, kind: input.kind } } });
    return { recipientId: recipient.id };
  });
}

export async function respondSolutionInvitation(db: PrismaClient, actor: Actor, input: { id: string; decision: "ACCEPT" | "DECLINE" | "CANCEL" }) {
  return db.$transaction(async tx => {
    const found = await tx.solutionInvitation.findUnique({ where: { id: input.id } });
    if (!found) throw new SolutionAccessError("Invitation introuvable.");
    await lockSolution(tx, found.solutionId);
    const invitation = await tx.solutionInvitation.findUniqueOrThrow({ where: { id: input.id } });
    if (input.decision === "CANCEL" ? invitation.senderId !== actor.id && actor.role !== "ADMIN" : invitation.recipientId !== actor.id) throw new SolutionAccessError("Cette invitation ne vous appartient pas.");
    if (invitation.status !== "PENDING") throw new SolutionAccessError("Cette invitation a déjà été traitée.");
    if (input.decision !== "CANCEL" && invitation.expiresAt <= new Date()) throw new SolutionAccessError("Cette invitation a expiré. Demandez-en une nouvelle.");
    if (input.decision === "ACCEPT") {
      const sender = await tx.user.findUnique({ where: { id: invitation.senderId }, select: { role: true } });
      const member = await tx.solutionMaintainer.findUnique({ where: { solutionId_userId: { solutionId: invitation.solutionId, userId: invitation.senderId } } });
      if (!member && (sender?.role !== "ADMIN" || invitation.kind === "TRANSFER")) throw new SolutionAccessError("L’auteur ne dispose plus des droits nécessaires. Demandez une nouvelle invitation.");
      await tx.solutionMaintainer.upsert({ where: { solutionId_userId: { solutionId: invitation.solutionId, userId: actor.id } }, create: { solutionId: invitation.solutionId, userId: actor.id }, update: {} });
      if (invitation.kind === "TRANSFER") await tx.solutionMaintainer.deleteMany({ where: { solutionId: invitation.solutionId, userId: invitation.senderId } });
    }
    const status = input.decision === "ACCEPT" ? "ACCEPTED" : input.decision === "DECLINE" ? "DECLINED" : "CANCELLED";
    await tx.solutionInvitation.update({ where: { id: invitation.id }, data: { status } });
    await tx.auditLog.create({ data: { actorId: actor.id, action: "UPDATE", entityType: "SOLUTION", entityId: invitation.solutionId, metadata: { operation: "solution_team_response", invitationId: invitation.id, kind: invitation.kind, status, senderId: invitation.senderId, recipientId: invitation.recipientId } } });
    return { solutionId: invitation.solutionId, recipientId: invitation.senderId, status };
  });
}

export async function removeSolutionManager(db: PrismaClient, actor: Actor, input: { solutionId: string; userId: string; note: string }) {
  return db.$transaction(async tx => {
    await lockSolution(tx, input.solutionId);
    if (actor.id !== input.userId && actor.role !== "ADMIN") throw new SolutionAccessError("Seul un administrateur peut retirer l’accès d’un autre gestionnaire.");
    const member = await tx.solutionMaintainer.findUnique({ where: { solutionId_userId: { solutionId: input.solutionId, userId: input.userId } } });
    if (!member) throw new SolutionAccessError("Cet accès n’existe plus.");
    if (await tx.solutionMaintainer.count({ where: { solutionId: input.solutionId } }) <= 1) throw new SolutionAccessError("Transférez d’abord l’accès : la fiche doit garder au moins un gestionnaire.");
    await tx.solutionMaintainer.delete({ where: { solutionId_userId: { solutionId: input.solutionId, userId: input.userId } } });
    await tx.solutionInvitation.updateMany({ where: { solutionId: input.solutionId, senderId: input.userId, status: "PENDING" }, data: { status: "CANCELLED" } });
    await tx.auditLog.create({ data: { actorId: actor.id, action: "UPDATE", entityType: "SOLUTION", entityId: input.solutionId, metadata: { operation: "solution_team_remove", userId: input.userId, note: input.note } } });
  });
}
