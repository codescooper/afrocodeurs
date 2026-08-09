ALTER TYPE "EntityType" ADD VALUE IF NOT EXISTS 'CHALLENGE';

CREATE TYPE "ChallengeDifficulty" AS ENUM ('INITIATE', 'EXPLORER', 'HACKER', 'MASTER', 'LEGENDARY');
CREATE TYPE "ChallengeStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'TESTING', 'SCHEDULED', 'PUBLISHED', 'CLOSED', 'REJECTED', 'ARCHIVED');

CREATE TABLE "Challenge" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "story" TEXT,
  "instructions" TEXT NOT NULL,
  "difficulty" "ChallengeDifficulty" NOT NULL,
  "status" "ChallengeStatus" NOT NULL DEFAULT 'DRAFT',
  "basePoints" INTEGER NOT NULL,
  "answerHash" TEXT NOT NULL,
  "answerSalt" TEXT NOT NULL,
  "solutionExplanation" TEXT NOT NULL,
  "maxAttempts" INTEGER NOT NULL DEFAULT 30,
  "publishAt" TIMESTAMP(3),
  "closeAt" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3),
  "authorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ChallengeHint" ("id" TEXT NOT NULL, "challengeId" TEXT NOT NULL, "position" INTEGER NOT NULL, "content" TEXT NOT NULL, "penalty" INTEGER NOT NULL, CONSTRAINT "ChallengeHint_pkey" PRIMARY KEY ("id"));
CREATE TABLE "ChallengeHintUnlock" ("id" TEXT NOT NULL, "challengeId" TEXT NOT NULL, "hintId" TEXT NOT NULL, "userId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "ChallengeHintUnlock_pkey" PRIMARY KEY ("id"));
CREATE TABLE "ChallengeAttempt" ("id" TEXT NOT NULL, "challengeId" TEXT NOT NULL, "userId" TEXT NOT NULL, "correct" BOOLEAN NOT NULL DEFAULT false, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "ChallengeAttempt_pkey" PRIMARY KEY ("id"));
CREATE TABLE "ChallengeSolve" ("id" TEXT NOT NULL, "challengeId" TEXT NOT NULL, "userId" TEXT NOT NULL, "score" INTEGER NOT NULL, "attemptsUsed" INTEGER NOT NULL, "hintsUsed" INTEGER NOT NULL, "solvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "ChallengeSolve_pkey" PRIMARY KEY ("id"));

CREATE UNIQUE INDEX "Challenge_slug_key" ON "Challenge"("slug");
CREATE INDEX "Challenge_status_publishAt_idx" ON "Challenge"("status", "publishAt");
CREATE INDEX "Challenge_difficulty_idx" ON "Challenge"("difficulty");
CREATE INDEX "Challenge_authorId_idx" ON "Challenge"("authorId");
CREATE UNIQUE INDEX "ChallengeHint_challengeId_position_key" ON "ChallengeHint"("challengeId", "position");
CREATE UNIQUE INDEX "ChallengeHintUnlock_hintId_userId_key" ON "ChallengeHintUnlock"("hintId", "userId");
CREATE INDEX "ChallengeHintUnlock_challengeId_userId_idx" ON "ChallengeHintUnlock"("challengeId", "userId");
CREATE INDEX "ChallengeAttempt_challengeId_userId_createdAt_idx" ON "ChallengeAttempt"("challengeId", "userId", "createdAt");
CREATE UNIQUE INDEX "ChallengeSolve_challengeId_userId_key" ON "ChallengeSolve"("challengeId", "userId");
CREATE INDEX "ChallengeSolve_score_solvedAt_idx" ON "ChallengeSolve"("score", "solvedAt");
CREATE INDEX "ChallengeSolve_userId_idx" ON "ChallengeSolve"("userId");

ALTER TABLE "Challenge" ADD CONSTRAINT "Challenge_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChallengeHint" ADD CONSTRAINT "ChallengeHint_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChallengeHintUnlock" ADD CONSTRAINT "ChallengeHintUnlock_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChallengeHintUnlock" ADD CONSTRAINT "ChallengeHintUnlock_hintId_fkey" FOREIGN KEY ("hintId") REFERENCES "ChallengeHint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChallengeHintUnlock" ADD CONSTRAINT "ChallengeHintUnlock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChallengeAttempt" ADD CONSTRAINT "ChallengeAttempt_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChallengeAttempt" ADD CONSTRAINT "ChallengeAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChallengeSolve" ADD CONSTRAINT "ChallengeSolve_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChallengeSolve" ADD CONSTRAINT "ChallengeSolve_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
