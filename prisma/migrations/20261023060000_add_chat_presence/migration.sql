CREATE TABLE "ChatPresence" (
  "userId" TEXT NOT NULL,
  "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChatPresence_pkey" PRIMARY KEY ("userId")
);
CREATE INDEX "ChatPresence_lastSeen_idx" ON "ChatPresence"("lastSeen");
ALTER TABLE "ChatPresence" ADD CONSTRAINT "ChatPresence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
