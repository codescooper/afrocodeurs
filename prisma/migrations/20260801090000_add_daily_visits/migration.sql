CREATE TABLE "DailyVisit" (
    "id" TEXT NOT NULL,
    "visitorDayHash" TEXT NOT NULL,
    "visitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DailyVisit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DailyVisit_visitorDayHash_key" ON "DailyVisit"("visitorDayHash");
CREATE INDEX "DailyVisit_visitedAt_idx" ON "DailyVisit"("visitedAt");
