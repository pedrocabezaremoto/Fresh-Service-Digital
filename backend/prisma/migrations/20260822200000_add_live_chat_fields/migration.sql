-- AlterTable
ALTER TABLE "chat_conversations" ADD COLUMN "operatorActive" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "chat_conversations" ADD COLUMN "operatorName" TEXT;
ALTER TABLE "chat_conversations" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active';
ALTER TABLE "chat_conversations" ADD COLUMN "unreadByAdmin" INTEGER NOT NULL DEFAULT 0;
