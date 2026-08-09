CREATE TYPE "ChallengeMode" AS ENUM ('CLASSIC', 'PIXEL_TERMINAL');
ALTER TABLE "Challenge" ADD COLUMN "mode" "ChallengeMode" NOT NULL DEFAULT 'CLASSIC';
ALTER TABLE "Challenge" ADD COLUMN "completionCode" TEXT;

CREATE TABLE "ChallengeProgress" (
  "id" TEXT NOT NULL,
  "challengeId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "step" INTEGER NOT NULL DEFAULT 0,
  "inventory" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "completedAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChallengeProgress_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ChallengeProgress_challengeId_userId_key" ON "ChallengeProgress"("challengeId", "userId");
CREATE INDEX "ChallengeProgress_userId_idx" ON "ChallengeProgress"("userId");
ALTER TABLE "ChallengeProgress" ADD CONSTRAINT "ChallengeProgress_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChallengeProgress" ADD CONSTRAINT "ChallengeProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
