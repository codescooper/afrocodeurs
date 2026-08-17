CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE');
CREATE TYPE "FeedbackCategory" AS ENUM ('BUG', 'MISSING_FEATURE', 'UX', 'CONTENT', 'PERFORMANCE', 'OTHER');
CREATE TYPE "FeedbackStatus" AS ENUM ('NEW', 'REVIEWING', 'ACCEPTED', 'REJECTED', 'CONVERTED');
CREATE TYPE "DevelopmentGoalStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'SHIPPED', 'CANCELLED');
ALTER TYPE "EntityType" ADD VALUE 'COMMENT';

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "actorId" TEXT,
  "action" "AuditAction" NOT NULL,
  "entityType" "EntityType" NOT NULL,
  "entityId" TEXT NOT NULL,
  "before" JSONB,
  "after" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductFeedback" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category" "FeedbackCategory" NOT NULL,
  "status" "FeedbackStatus" NOT NULL DEFAULT 'NEW',
  "priorityScore" INTEGER NOT NULL DEFAULT 1,
  "analysis" TEXT NOT NULL,
  "sourceUrl" TEXT,
  "sourceType" "EntityType",
  "sourceId" TEXT,
  "authorId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductFeedback_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DevelopmentGoal" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "status" "DevelopmentGoalStatus" NOT NULL DEFAULT 'PLANNED',
  "priority" INTEGER NOT NULL DEFAULT 1,
  "feedbackId" TEXT NOT NULL,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DevelopmentGoal_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DevelopmentGoal_feedbackId_key" ON "DevelopmentGoal"("feedbackId");
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");
CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx" ON "AuditLog"("entityType", "entityId", "createdAt");
CREATE INDEX "ProductFeedback_status_priorityScore_createdAt_idx" ON "ProductFeedback"("status", "priorityScore", "createdAt");
CREATE INDEX "ProductFeedback_sourceType_sourceId_idx" ON "ProductFeedback"("sourceType", "sourceId");
CREATE INDEX "ProductFeedback_authorId_idx" ON "ProductFeedback"("authorId");
CREATE INDEX "DevelopmentGoal_status_priority_createdAt_idx" ON "DevelopmentGoal"("status", "priority", "createdAt");

ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductFeedback" ADD CONSTRAINT "ProductFeedback_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DevelopmentGoal" ADD CONSTRAINT "DevelopmentGoal_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "ProductFeedback"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DevelopmentGoal" ADD CONSTRAINT "DevelopmentGoal_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
