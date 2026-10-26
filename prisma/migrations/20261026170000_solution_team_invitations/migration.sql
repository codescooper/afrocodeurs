ALTER TABLE "SolutionClaim" ADD COLUMN "githubVerifiedAt" TIMESTAMP(3), ADD COLUMN "githubVerifiedRepo" TEXT;

CREATE TABLE "SolutionInvitation" (
  "id" TEXT NOT NULL,
  "solutionId" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "recipientId" TEXT NOT NULL,
  "kind" TEXT NOT NULL DEFAULT 'COLLABORATE',
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SolutionInvitation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SolutionInvitation_solutionId_fkey" FOREIGN KEY ("solutionId") REFERENCES "Solution"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SolutionInvitation_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SolutionInvitation_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "SolutionInvitation_solutionId_status_idx" ON "SolutionInvitation"("solutionId", "status");
CREATE INDEX "SolutionInvitation_recipientId_status_idx" ON "SolutionInvitation"("recipientId", "status");
CREATE INDEX "SolutionInvitation_senderId_idx" ON "SolutionInvitation"("senderId");
CREATE UNIQUE INDEX "SolutionInvitation_pending_key" ON "SolutionInvitation"("solutionId", "recipientId") WHERE "status" = 'PENDING';
