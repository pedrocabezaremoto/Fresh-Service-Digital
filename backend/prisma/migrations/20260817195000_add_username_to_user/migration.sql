-- AlterTable
ALTER TABLE "users" ADD COLUMN "username" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- Seed: admin default puede entrar con username "admin"
UPDATE "users"
SET "username" = 'admin'
WHERE "email" = 'admin@freshservice.com'
  AND "role" = 'ADMIN'
  AND "username" IS NULL;
