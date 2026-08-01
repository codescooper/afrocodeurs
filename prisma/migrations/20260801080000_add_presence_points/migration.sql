CREATE TABLE "PresencePoint" (
    "id" TEXT NOT NULL,
    "visitorKey" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "firstSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PresencePoint_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PresencePoint_visitorKey_key" ON "PresencePoint"("visitorKey");
CREATE INDEX "PresencePoint_lastSeen_idx" ON "PresencePoint"("lastSeen");
