CREATE TYPE "EventType" AS ENUM ('LIVE', 'WEBINAR', 'WORKSHOP', 'MEETUP', 'MENTORING', 'CONFERENCE');
CREATE TYPE "EventFormat" AS ENUM ('ONLINE', 'IN_PERSON', 'HYBRID');
CREATE TYPE "EventStatus" AS ENUM ('PUBLISHED', 'CANCELLED', 'COMPLETED');

CREATE TABLE "Event" (
  "id" TEXT NOT NULL, "title" TEXT NOT NULL, "slug" TEXT NOT NULL, "summary" TEXT NOT NULL, "description" TEXT NOT NULL,
  "type" "EventType" NOT NULL, "format" "EventFormat" NOT NULL, "status" "EventStatus" NOT NULL DEFAULT 'PUBLISHED',
  "startsAt" TIMESTAMP(3) NOT NULL, "endsAt" TIMESTAMP(3) NOT NULL, "timezone" TEXT NOT NULL DEFAULT 'Africa/Abidjan', "capacity" INTEGER,
  "platform" TEXT, "accessUrl" TEXT, "replayUrl" TEXT, "reminderSentAt" TIMESTAMP(3), "venue" TEXT, "city" TEXT, "country" TEXT,
  "organizerId" TEXT NOT NULL, "communityId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "EventRegistration" (
  "id" TEXT NOT NULL, "eventId" TEXT NOT NULL, "userId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EventRegistration_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");
CREATE INDEX "Event_status_startsAt_idx" ON "Event"("status", "startsAt");
CREATE INDEX "Event_communityId_startsAt_idx" ON "Event"("communityId", "startsAt");
CREATE UNIQUE INDEX "EventRegistration_eventId_userId_key" ON "EventRegistration"("eventId", "userId");
CREATE INDEX "EventRegistration_userId_createdAt_idx" ON "EventRegistration"("userId", "createdAt");
ALTER TABLE "Event" ADD CONSTRAINT "Event_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Event" ADD CONSTRAINT "Event_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "PlatformUpdate" ("id", "version", "title", "summary", "content", "category", "requestedBy", "sourceUrl", "published", "publishedAt", "updatedAt") VALUES
('community-request-events', 'Août 2026', 'Les événements physiques et digitaux arrivent sur AfroCodeurs', 'La communauté peut référencer des lives, ateliers, rencontres et mentorats, puis gérer les inscriptions et rappels.', E'## Ce qui a changé\n\n- événements en ligne, en présentiel ou hybrides ;\n- lives, webinaires, ateliers, rencontres, mentorat et conférences ;\n- dates, fuseau horaire, capacité et communauté associée ;\n- inscription et désistement ;\n- lien du direct réservé aux personnes inscrites ;\n- rappel automatique avant le début ;\n- calendrier général des événements à venir.', 'NOUVEAUTÉ', 'CodeScooper', '/explorer/comment-rendre-afrocodeurs-plus-interactive-et-engageante', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

UPDATE "ProductFeedback" SET "status" = 'IN_PROGRESS', "analysis" = 'Première étape livrée : événements physiques, digitaux et hybrides avec inscriptions, liens protégés et rappels. Les parcours de mentorat et le suivi global de l’engagement restent à développer.' WHERE "id" = 'inventory-engagement-events';
