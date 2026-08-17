import type { AuditAction, EntityType, Prisma } from "@prisma/client";

import { db } from "@/lib/db";

type AuditInput = {
  actorId: string;
  action: AuditAction;
  entityType: EntityType;
  entityId: string;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
  metadata?: Prisma.InputJsonValue;
};

/** Interface unique de l'historique : toute mutation utilisateur passe ici. */
export async function recordAudit(input: AuditInput) {
  return db.auditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      before: input.before,
      after: input.after,
      metadata: input.metadata,
    },
  });
}
