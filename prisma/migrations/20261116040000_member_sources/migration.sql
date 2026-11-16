CREATE TABLE "MemberSource" ("id" TEXT PRIMARY KEY, "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE, "kind" TEXT NOT NULL, "url" TEXT NOT NULL, "consentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "lastCheckedAt" TIMESTAMP(3), "lastError" TEXT);
CREATE UNIQUE INDEX "MemberSource_userId_url_key" ON "MemberSource"("userId", "url");
CREATE TABLE "MemberUpdate" ("id" TEXT PRIMARY KEY, "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE, "sourceId" TEXT REFERENCES "MemberSource"("id") ON DELETE CASCADE, "externalId" TEXT NOT NULL, "title" TEXT NOT NULL, "url" TEXT NOT NULL, "summary" TEXT NOT NULL, "publishedAt" TIMESTAMP(3), "approvedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE UNIQUE INDEX "MemberUpdate_userId_externalId_key" ON "MemberUpdate"("userId", "externalId");
CREATE INDEX "MemberUpdate_approvedAt_idx" ON "MemberUpdate"("approvedAt");
