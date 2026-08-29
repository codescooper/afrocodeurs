CREATE TYPE "DiscordSyncStatus" AS ENUM (
  'NOT_REQUESTED',
  'PENDING',
  'SYNCED',
  'FAILED'
);

ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'COURSE';

ALTER TABLE "Event"
ADD COLUMN "discordEventId" TEXT,
ADD COLUMN "discordEventUrl" TEXT,
ADD COLUMN "discordSyncStatus" "DiscordSyncStatus" NOT NULL DEFAULT 'NOT_REQUESTED',
ADD COLUMN "discordSyncError" TEXT,
ADD COLUMN "discordSyncedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Event_discordEventId_key" ON "Event"("discordEventId");
