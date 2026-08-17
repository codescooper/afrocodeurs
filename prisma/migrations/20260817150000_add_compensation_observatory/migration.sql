CREATE TYPE "CompensationKind" AS ENUM ('SALARY', 'FREELANCE', 'CONTRACT');
CREATE TYPE "CompensationPeriod" AS ENUM ('MONTH', 'YEAR', 'DAY', 'HOUR', 'PROJECT');
CREATE TABLE "CompensationReport" ("id" TEXT NOT NULL, "kind" "CompensationKind" NOT NULL, "role" TEXT NOT NULL, "country" TEXT NOT NULL, "experienceYears" INTEGER NOT NULL, "amountMin" INTEGER NOT NULL, "amountMax" INTEGER NOT NULL, "currency" TEXT NOT NULL, "period" "CompensationPeriod" NOT NULL, "remote" BOOLEAN NOT NULL DEFAULT false, "clientType" TEXT, "technologies" TEXT[] DEFAULT ARRAY[]::TEXT[], "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "CompensationReport_pkey" PRIMARY KEY ("id"));
CREATE INDEX "CompensationReport_country_role_idx" ON "CompensationReport"("country", "role");
CREATE INDEX "CompensationReport_kind_createdAt_idx" ON "CompensationReport"("kind", "createdAt");

INSERT INTO "PlatformUpdate" ("id", "version", "title", "summary", "content", "category", "requestedBy", "sourceUrl", "published", "publishedAt", "updatedAt") VALUES
('community-request-compensation', 'Août 2026', 'Un observatoire anonyme des salaires et tarifs', 'Les membres peuvent partager des fourchettes de rémunération sans associer leur identité à la donnée.', E'## Ce qui a changé\n\n- salaires, tarifs freelance et missions ;\n- fourchette, devise et période ;\n- métier, pays et expérience ;\n- travail à distance, technologies et type de client ;\n- aucune identité enregistrée avec la contribution ;\n- consignes contre les informations nominatives.', 'NOUVEAUTÉ', 'Dylan', '/forum/qu-est-ce-qui-manque-a-cette-plateforme-et-comment-voulez-vous-l-apporter-en-plus', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
UPDATE "ProductFeedback" SET "status"='RESOLVED', "analysis"='Observatoire anonyme livré avec salaires, tarifs, missions, contexte technique et protections de confidentialité.' WHERE "id"='inventory-compensation-data';
