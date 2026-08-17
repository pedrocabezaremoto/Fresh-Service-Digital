-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "specialty" TEXT;

-- Data: Carlos "— Aires Split" → specialty + lastName limpio (sin prefijo)
UPDATE "users"
SET
  "specialty" = 'Aires Split',
  "lastName" = 'Aires Split'
WHERE "role" = 'TECHNICIAN'
  AND (
    "lastName" = 'Carlos — Aires Split'
    OR "lastName" = '— Aires Split'
    OR ("firstName" ILIKE 'Carlos' AND "lastName" ILIKE '%Aires Split%')
  );

-- Data: resto de técnicos con el hack de especialidad en lastName
UPDATE "users"
SET
  "specialty" = 'Aires de Ventana',
  "lastName" = 'Aires de Ventana'
WHERE "role" = 'TECHNICIAN'
  AND "specialty" IS NULL
  AND "lastName" ILIKE '%ventana%';

UPDATE "users"
SET
  "specialty" = 'General',
  "lastName" = TRIM(BOTH FROM regexp_replace("lastName", '^—\s*', ''))
WHERE "role" = 'TECHNICIAN'
  AND "specialty" IS NULL
  AND "lastName" ILIKE '%tonelada%';
