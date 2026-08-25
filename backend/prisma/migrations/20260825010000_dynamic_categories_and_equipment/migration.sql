-- Crear tablas de opciones
CREATE TABLE "service_category_options" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "service_category_options_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "service_category_options_slug_key" ON "service_category_options"("slug");

CREATE TABLE "equipment_type_options" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "equipment_type_options_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "equipment_type_options_slug_key" ON "equipment_type_options"("slug");

-- Convertir columnas enum a texto
ALTER TABLE "services" ALTER COLUMN "category" TYPE TEXT USING "category"::text;
ALTER TABLE "services" ALTER COLUMN "equipmentType" TYPE TEXT USING "equipmentType"::text;

-- Borrar los tipos enum viejos
DROP TYPE IF EXISTS "ServiceCategory";
DROP TYPE IF EXISTS "EquipmentType";

-- Seed: insertar las opciones existentes
INSERT INTO "service_category_options" ("id", "slug", "label", "sortOrder") VALUES
  ('c1a10001-0000-4000-8000-000000000001', 'MANTENIMIENTO', 'Mantenimiento', 1),
  ('c1a10001-0000-4000-8000-000000000002', 'REPARACION', 'Reparación', 2),
  ('c1a10001-0000-4000-8000-000000000003', 'INSTALACION', 'Instalación', 3),
  ('c1a10001-0000-4000-8000-000000000004', 'DIAGNOSTICO', 'Diagnóstico', 4),
  ('c1a10001-0000-4000-8000-000000000005', 'RECARGA', 'Recarga', 5),
  ('c1a10001-0000-4000-8000-000000000006', 'OTRO', 'Otro', 6);

INSERT INTO "equipment_type_options" ("id", "slug", "label", "sortOrder") VALUES
  ('e2b20001-0000-4000-8000-000000000001', 'VENTANA', 'Aire de Ventana', 1),
  ('e2b20001-0000-4000-8000-000000000002', 'SPLIT', 'Aire Split', 2),
  ('e2b20001-0000-4000-8000-000000000003', 'TONELADA_1', 'Aire 1 Tonelada', 3),
  ('e2b20001-0000-4000-8000-000000000004', 'TONELADA_2', 'Aire 2 Toneladas', 4),
  ('e2b20001-0000-4000-8000-000000000005', 'TONELADA_3', 'Aire 3 Toneladas', 5),
  ('e2b20001-0000-4000-8000-000000000006', 'GENERAL', 'General', 6);
