ALTER TYPE "EntityType" ADD VALUE 'COMMUNITY_VENTURE';
ALTER TYPE "EntityType" ADD VALUE 'VENTURE_COLLABORATION';
CREATE TYPE "VentureStatus" AS ENUM ('PENDING', 'PUBLISHED', 'ARCHIVED', 'SUSPENDED');
CREATE TYPE "VentureCollaborationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED');
CREATE TABLE "CommunityVenture" (
  "id" TEXT NOT NULL, "slug" TEXT NOT NULL, "name" TEXT NOT NULL,
  "summary" TEXT NOT NULL, "description" TEXT NOT NULL, "country" CHAR(2) NOT NULL,
  "sector" TEXT NOT NULL, "websiteUrl" TEXT NOT NULL, "logoUrl" TEXT,
  "screenshots" TEXT[] DEFAULT ARRAY[]::TEXT[], "needs" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "status" "VentureStatus" NOT NULL DEFAULT 'PENDING', "reviewNote" TEXT,
  "revision" INTEGER NOT NULL DEFAULT 1, "ownerId" TEXT NOT NULL,
  "openSourceProjectId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CommunityVenture_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CommunityVenture_country_check" CHECK ("country" ~ '^[A-Z]{2}$'),
  CONSTRAINT "CommunityVenture_revision_check" CHECK ("revision" > 0)
);
CREATE TABLE "VentureCollaboration" (
  "id" TEXT NOT NULL, "ventureId" TEXT NOT NULL, "applicantId" TEXT NOT NULL,
  "message" TEXT NOT NULL, "status" "VentureCollaborationStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VentureCollaboration_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "VentureBlock" (
  "id" TEXT NOT NULL, "blockerId" TEXT NOT NULL, "blockedId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VentureBlock_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "VentureBlock_self_check" CHECK ("blockerId" <> "blockedId")
);
CREATE UNIQUE INDEX "CommunityVenture_slug_key" ON "CommunityVenture"("slug");
CREATE UNIQUE INDEX "CommunityVenture_websiteUrl_key" ON "CommunityVenture"("websiteUrl");
CREATE INDEX "CommunityVenture_status_country_sector_createdAt_idx" ON "CommunityVenture"("status", "country", "sector", "createdAt");
CREATE INDEX "CommunityVenture_status_sector_createdAt_idx" ON "CommunityVenture"("status", "sector", "createdAt");
CREATE INDEX "CommunityVenture_ownerId_idx" ON "CommunityVenture"("ownerId");
CREATE INDEX "CommunityVenture_openSourceProjectId_idx" ON "CommunityVenture"("openSourceProjectId");
CREATE UNIQUE INDEX "VentureCollaboration_ventureId_applicantId_key" ON "VentureCollaboration"("ventureId", "applicantId");
CREATE INDEX "VentureCollaboration_applicantId_status_idx" ON "VentureCollaboration"("applicantId", "status");
CREATE INDEX "VentureCollaboration_ventureId_status_createdAt_idx" ON "VentureCollaboration"("ventureId", "status", "createdAt");
CREATE UNIQUE INDEX "VentureBlock_blockerId_blockedId_key" ON "VentureBlock"("blockerId", "blockedId");
CREATE INDEX "VentureBlock_blockedId_idx" ON "VentureBlock"("blockedId");
ALTER TABLE "CommunityVenture" ADD CONSTRAINT "CommunityVenture_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommunityVenture" ADD CONSTRAINT "CommunityVenture_openSourceProjectId_fkey" FOREIGN KEY ("openSourceProjectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "VentureCollaboration" ADD CONSTRAINT "VentureCollaboration_ventureId_fkey" FOREIGN KEY ("ventureId") REFERENCES "CommunityVenture"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VentureCollaboration" ADD CONSTRAINT "VentureCollaboration_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VentureBlock" ADD CONSTRAINT "VentureBlock_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VentureBlock" ADD CONSTRAINT "VentureBlock_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
