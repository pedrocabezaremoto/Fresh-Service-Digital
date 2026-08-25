-- AlterTable
ALTER TABLE "equipment_type_options" ADD COLUMN "description" TEXT;

UPDATE "equipment_type_options" SET "description" = 'Unidades de ventana de todas las marcas' WHERE "slug" = 'VENTANA';
UPDATE "equipment_type_options" SET "description" = 'Sistemas mini y maxi split, interior y exterior' WHERE "slug" = 'SPLIT';
UPDATE "equipment_type_options" SET "description" = 'Equipos de 3 a 5 toneladas para comercios y locales' WHERE "slug" LIKE 'TONELADA%' AND "description" IS NULL;
