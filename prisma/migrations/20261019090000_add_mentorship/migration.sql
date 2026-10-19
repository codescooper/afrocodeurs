ALTER TYPE "EntityType" ADD VALUE 'MENTORSHIP_OFFER';
ALTER TYPE "EntityType" ADD VALUE 'MENTORSHIP_REQUEST';
CREATE TYPE "MentorshipStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'COMPLETED');

CREATE TABLE "MentorshipOffer" (
  "id" TEXT NOT NULL,
  "mentorId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "topics" TEXT[] NOT NULL,
  "languages" TEXT[] NOT NULL,
  "availability" TEXT NOT NULL,
  "capacity" INTEGER NOT NULL DEFAULT 2,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "suspendedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MentorshipOffer_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MentorshipOffer_capacity_check" CHECK ("capacity" BETWEEN 1 AND 5)
);
CREATE TABLE "MentorshipRequest" (
  "id" TEXT NOT NULL,
  "offerId" TEXT NOT NULL,
  "menteeId" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "status" "MentorshipStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MentorshipRequest_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "MentorshipBlock" (
  "id" TEXT NOT NULL,
  "blockerId" TEXT NOT NULL,
  "blockedId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MentorshipBlock_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MentorshipBlock_self_check" CHECK ("blockerId" <> "blockedId")
);
CREATE UNIQUE INDEX "MentorshipOffer_mentorId_key" ON "MentorshipOffer"("mentorId");
CREATE INDEX "MentorshipOffer_active_suspendedAt_idx" ON "MentorshipOffer"("active", "suspendedAt");
CREATE UNIQUE INDEX "MentorshipRequest_offerId_menteeId_key" ON "MentorshipRequest"("offerId", "menteeId");
CREATE INDEX "MentorshipRequest_menteeId_createdAt_idx" ON "MentorshipRequest"("menteeId", "createdAt");
CREATE INDEX "MentorshipRequest_offerId_status_idx" ON "MentorshipRequest"("offerId", "status");
CREATE UNIQUE INDEX "MentorshipBlock_blockerId_blockedId_key" ON "MentorshipBlock"("blockerId", "blockedId");
CREATE INDEX "MentorshipBlock_blockedId_idx" ON "MentorshipBlock"("blockedId");
ALTER TABLE "MentorshipOffer" ADD CONSTRAINT "MentorshipOffer_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MentorshipRequest" ADD CONSTRAINT "MentorshipRequest_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "MentorshipOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MentorshipRequest" ADD CONSTRAINT "MentorshipRequest_menteeId_fkey" FOREIGN KEY ("menteeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MentorshipBlock" ADD CONSTRAINT "MentorshipBlock_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MentorshipBlock" ADD CONSTRAINT "MentorshipBlock_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
