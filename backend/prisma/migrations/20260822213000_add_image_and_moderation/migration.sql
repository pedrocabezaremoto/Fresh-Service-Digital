-- AlterTable
ALTER TABLE "chat_conversations" ADD COLUMN "paused" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "chat_conversations" ADD COLUMN "blocked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "chat_conversations" ADD COLUMN "imageCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "chat_messages" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'text';
ALTER TABLE "chat_messages" ADD COLUMN "imageUrl" TEXT;
