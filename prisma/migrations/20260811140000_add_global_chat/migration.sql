ALTER TYPE "ConversationType" ADD VALUE 'GLOBAL';

ALTER TABLE "Conversation" ADD COLUMN "slug" TEXT;
CREATE UNIQUE INDEX "Conversation_slug_key" ON "Conversation"("slug");
