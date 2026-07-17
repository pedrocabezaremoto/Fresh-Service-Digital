-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "technicianId" TEXT;

-- CreateIndex
CREATE INDEX "appointments_technicianId_idx" ON "appointments"("technicianId");

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

