ALTER TABLE "Solution"
  ADD COLUMN "repositoryUrl" TEXT,
  ADD COLUMN "sector" TEXT NOT NULL DEFAULT 'OTHER',
  ADD COLUMN "lifecycle" TEXT NOT NULL DEFAULT 'EXPERIMENTAL',
  ADD COLUMN "licenseVerified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "countriesServed" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "languages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "contributionNeeds" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "africanContext" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 1;

CREATE TABLE "SolutionMaintainer" (
  "solutionId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SolutionMaintainer_pkey" PRIMARY KEY ("solutionId", "userId"),
  CONSTRAINT "SolutionMaintainer_solutionId_fkey" FOREIGN KEY ("solutionId") REFERENCES "Solution"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SolutionMaintainer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "SolutionMaintainer_userId_idx" ON "SolutionMaintainer"("userId");

CREATE TABLE "SolutionClaim" (
  "id" TEXT NOT NULL,
  "solutionId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "evidence" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "reviewNote" TEXT,
  "reviewerId" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SolutionClaim_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SolutionClaim_solutionId_fkey" FOREIGN KEY ("solutionId") REFERENCES "Solution"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SolutionClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SolutionClaim_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "SolutionClaim_solutionId_userId_key" ON "SolutionClaim"("solutionId", "userId");
CREATE INDEX "SolutionClaim_status_createdAt_idx" ON "SolutionClaim"("status", "createdAt");
CREATE INDEX "SolutionClaim_userId_idx" ON "SolutionClaim"("userId");
CREATE INDEX "SolutionClaim_reviewerId_idx" ON "SolutionClaim"("reviewerId");
