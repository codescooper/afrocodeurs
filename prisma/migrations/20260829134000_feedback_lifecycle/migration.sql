-- Un même objectif peut désormais regrouper plusieurs retours indépendants.
ALTER TABLE "ProductFeedback" ADD COLUMN "developmentGoalId" TEXT;

UPDATE "ProductFeedback" AS feedback
SET "developmentGoalId" = goal."id"
FROM "DevelopmentGoal" AS goal
WHERE goal."feedbackId" = feedback."id";

ALTER TABLE "DevelopmentGoal" DROP CONSTRAINT "DevelopmentGoal_feedbackId_fkey";
DROP INDEX "DevelopmentGoal_feedbackId_key";
ALTER TABLE "DevelopmentGoal" DROP COLUMN "feedbackId";

CREATE INDEX "ProductFeedback_developmentGoalId_idx"
ON "ProductFeedback"("developmentGoalId");

ALTER TABLE "ProductFeedback"
ADD CONSTRAINT "ProductFeedback_developmentGoalId_fkey"
FOREIGN KEY ("developmentGoalId") REFERENCES "DevelopmentGoal"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- Une nouveauté livrée peut être reliée sans ambiguïté à son objectif.
ALTER TABLE "PlatformUpdate" ADD COLUMN "developmentGoalId" TEXT;
CREATE UNIQUE INDEX "PlatformUpdate_developmentGoalId_key"
ON "PlatformUpdate"("developmentGoalId");
ALTER TABLE "PlatformUpdate"
ADD CONSTRAINT "PlatformUpdate_developmentGoalId_fkey"
FOREIGN KEY ("developmentGoalId") REFERENCES "DevelopmentGoal"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- Le journal d'audit couvre maintenant tout le cycle produit.
ALTER TYPE "EntityType" ADD VALUE IF NOT EXISTS 'PRODUCT_FEEDBACK';
ALTER TYPE "EntityType" ADD VALUE IF NOT EXISTS 'DEVELOPMENT_GOAL';
ALTER TYPE "EntityType" ADD VALUE IF NOT EXISTS 'PLATFORM_UPDATE';

-- Rétablit l'auteur du contenu source au lieu de l'administrateur ayant fait le tri.
UPDATE "ProductFeedback" AS feedback
SET "authorId" = question."authorId"
FROM "Question" AS question
WHERE feedback."sourceType" = 'QUESTION'
  AND feedback."sourceId" = question."id";

UPDATE "ProductFeedback" AS feedback
SET "authorId" = problem."createdById"
FROM "Problem" AS problem
WHERE feedback."sourceType" = 'PROBLEM'
  AND feedback."sourceId" = problem."id";

UPDATE "ProductFeedback" AS feedback
SET "authorId" = knowledge."authorId"
FROM "Knowledge" AS knowledge
WHERE feedback."sourceType" = 'KNOWLEDGE'
  AND feedback."sourceId" = knowledge."id";

-- Les deux signalements indépendants du menu transparent alimentent le même objectif.
UPDATE "ProductFeedback" AS duplicate
SET "developmentGoalId" = canonical."developmentGoalId",
    "status" = 'CONVERTED',
    "analysis" = 'Signalement indépendant rattaché à l’objectif existant sur la lisibilité du menu en mode sombre.'
FROM "ProductFeedback" AS canonical
WHERE duplicate."id" = 'cmt51254e00qw01rtjuq2ztuh'
  AND canonical."id" = 'cmsx6eap7000k01rtj5qo39jt'
  AND canonical."developmentGoalId" IS NOT NULL;

-- Aligne les demandes existantes sur l'état de leur objectif.
UPDATE "ProductFeedback" AS feedback
SET "status" = CASE goal."status"
  WHEN 'PLANNED' THEN 'CONVERTED'::"FeedbackStatus"
  WHEN 'IN_PROGRESS' THEN 'IN_PROGRESS'::"FeedbackStatus"
  WHEN 'SHIPPED' THEN 'RESOLVED'::"FeedbackStatus"
  WHEN 'CANCELLED' THEN 'REJECTED'::"FeedbackStatus"
END
FROM "DevelopmentGoal" AS goal
WHERE feedback."developmentGoalId" = goal."id";

-- Nettoyage des demandes historiques déjà livrées ou encore partiellement actives.
UPDATE "Problem" SET "status" = 'ARCHIVED'
WHERE "id" IN (
  'cmso03oj3002g01p6ankzc36z',
  'cmso0luwf000001mgc3r5nud7',
  'cmsrncxnd00ca01mqsxfy82wi',
  'cmss4ls1400dj01mq5680lr1z',
  'cmt2wlpir00kn01rtsm9spxva'
);

UPDATE "Problem" SET "status" = 'ACTIVE'
WHERE "id" IN (
  'cmset4ppe00bc01mgo0b13obh',
  'cmso1b698000c01mgo5mjmq6g'
);

UPDATE "Question" SET "status" = 'SOLVED'
WHERE "id" = 'cmsfzeofx00mt01mg4a81gvx9';

-- Les sources liées à un objectif suivent désormais son avancement initial.
UPDATE "Problem" AS problem
SET "status" = CASE goal."status"
  WHEN 'PLANNED' THEN 'VALIDATED'::"ProblemStatus"
  WHEN 'IN_PROGRESS' THEN 'ACTIVE'::"ProblemStatus"
  ELSE 'ARCHIVED'::"ProblemStatus"
END
FROM "ProductFeedback" AS feedback
JOIN "DevelopmentGoal" AS goal ON goal."id" = feedback."developmentGoalId"
WHERE feedback."sourceType" = 'PROBLEM'
  AND feedback."sourceId" = problem."id";

UPDATE "Question" AS question
SET "status" = CASE goal."status"
  WHEN 'SHIPPED' THEN 'SOLVED'::"QuestionStatus"
  WHEN 'CANCELLED' THEN 'CLOSED'::"QuestionStatus"
  ELSE 'ANSWERED'::"QuestionStatus"
END
FROM "ProductFeedback" AS feedback
JOIN "DevelopmentGoal" AS goal ON goal."id" = feedback."developmentGoalId"
WHERE feedback."sourceType" = 'QUESTION'
  AND feedback."sourceId" = question."id";
