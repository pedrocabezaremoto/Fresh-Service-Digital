-- CreateTable
CREATE TABLE "carousel_images" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "alt" TEXT NOT NULL DEFAULT '',
    "position" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "width" INTEGER,
    "height" INTEGER,
    "sizeBytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carousel_images_pkey" PRIMARY KEY ("id")
);
