import "server-only";
import type { PrismaClient, UserRole } from "@prisma/client";

export class SolutionAccessError extends Error {}

export async function reviewSolutionClaim(database: PrismaClient, actor: { id: string; role: UserRole }, input: { id: string; status: "APPROVED" | "REJECTED"; note: string }) {
  if (actor.role !== "ADMIN") throw new SolutionAccessError("Cette décision est réservée aux administrateurs.");
  return database.$transaction(async tx => {
    const claim = await tx.solutionClaim.findUnique({ where: { id: input.id }, include: { solution: { select: { slug: true } } } });
    if (!claim || claim.status !== "PENDING") throw new SolutionAccessError("Cette demande n’est plus en attente.");
    if (claim.userId === actor.id) throw new SolutionAccessError("Un autre administrateur doit vérifier votre demande.");
    await tx.$queryRaw`SELECT "id" FROM "Solution" WHERE "id" = ${claim.solutionId} FOR UPDATE`;
    const updated = await tx.solutionClaim.updateMany({ where: { id: claim.id, status: "PENDING" }, data: { status: input.status, reviewNote: input.note, reviewerId: actor.id, reviewedAt: new Date() } });
    if (updated.count !== 1) throw new SolutionAccessError("Cette demande vient d’être traitée. Rechargez la page.");
    if (input.status === "APPROVED") await tx.solutionMaintainer.upsert({ where: { solutionId_userId: { solutionId: claim.solutionId, userId: claim.userId } }, create: { solutionId: claim.solutionId, userId: claim.userId }, update: {} });
    await tx.auditLog.create({ data: { actorId: actor.id, action: "UPDATE", entityType: "SOLUTION", entityId: claim.solutionId, before: { claimStatus: "PENDING" }, after: { claimStatus: input.status }, metadata: { operation: "solution_claim_review", claimId: claim.id, claimantId: claim.userId, note: input.note } } });
    return { userId: claim.userId, slug: claim.solution.slug };
  });
}
