CREATE TYPE "OpportunityType" AS ENUM ('JOB', 'INTERNSHIP', 'SCHOLARSHIP', 'FUNDING', 'COMPETITION', 'MENTORSHIP', 'EVENT', 'OTHER');
CREATE TYPE "OpportunityStatus" AS ENUM ('ACTIVE', 'CLOSED', 'ARCHIVED');
CREATE TYPE "OpportunityResponseKind" AS ENUM ('INTEREST', 'APPLICATION');

CREATE TABLE "Opportunity" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "organization" TEXT NOT NULL,
  "type" "OpportunityType" NOT NULL,
  "status" "OpportunityStatus" NOT NULL DEFAULT 'ACTIVE',
  "summary" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "requirements" TEXT,
  "location" TEXT,
  "isRemote" BOOLEAN NOT NULL DEFAULT false,
  "externalUrl" TEXT,
  "deadline" TIMESTAMP(3),
  "authorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OpportunityResponse" (
  "id" TEXT NOT NULL,
  "opportunityId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "kind" "OpportunityResponseKind" NOT NULL,
  "message" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OpportunityResponse_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Opportunity_slug_key" ON "Opportunity"("slug");
CREATE INDEX "Opportunity_status_createdAt_idx" ON "Opportunity"("status", "createdAt");
CREATE INDEX "Opportunity_type_idx" ON "Opportunity"("type");
CREATE INDEX "Opportunity_authorId_idx" ON "Opportunity"("authorId");
CREATE INDEX "Opportunity_deadline_idx" ON "Opportunity"("deadline");
CREATE UNIQUE INDEX "OpportunityResponse_opportunityId_userId_key" ON "OpportunityResponse"("opportunityId", "userId");
CREATE INDEX "OpportunityResponse_userId_idx" ON "OpportunityResponse"("userId");
CREATE INDEX "OpportunityResponse_opportunityId_kind_idx" ON "OpportunityResponse"("opportunityId", "kind");
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OpportunityResponse" ADD CONSTRAINT "OpportunityResponse_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OpportunityResponse" ADD CONSTRAINT "OpportunityResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
