CREATE TABLE "KitDownloadEvent" (
    "id" TEXT NOT NULL,
    "kit" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "referrer" TEXT NOT NULL,
    "browser" TEXT NOT NULL,
    "os" TEXT NOT NULL,
    "device" TEXT NOT NULL,
    "automated" BOOLEAN NOT NULL DEFAULT false,
    "bytes" INTEGER NOT NULL,
    "version" TEXT NOT NULL,
    CONSTRAINT "KitDownloadEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "KitDownloadEvent_kit_createdAt_idx" ON "KitDownloadEvent"("kit", "createdAt");
CREATE INDEX "KitDownloadEvent_createdAt_idx" ON "KitDownloadEvent"("createdAt");
