-- CreateEnum
CREATE TYPE "ServiceCategory" AS ENUM ('MANTENIMIENTO', 'REPARACION', 'INSTALACION', 'DIAGNOSTICO', 'RECARGA', 'OTRO');

-- CreateEnum
CREATE TYPE "EquipmentType" AS ENUM ('VENTANA', 'SPLIT', 'TONELADA_1', 'TONELADA_2', 'TONELADA_3', 'GENERAL');

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ServiceCategory" NOT NULL,
    "equipmentType" "EquipmentType" NOT NULL,
    "priceUsd" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "services_name_equipmentType_key" ON "services"("name", "equipmentType");

-- AlterTable
ALTER TABLE "appointments" ADD COLUMN "serviceId" TEXT;

-- CreateIndex
CREATE INDEX "appointments_serviceId_idx" ON "appointments"("serviceId");

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed: 25 combinaciones (5 equipos × 5 servicios) migradas desde prices.js
INSERT INTO "services" ("id", "name", "category", "equipmentType", "priceUsd", "description", "isActive", "sortOrder", "createdAt", "updatedAt") VALUES
  ('a1b2c3d4-e5f6-4a10-8b01-000000000001', 'Mantenimiento Preventivo', 'MANTENIMIENTO', 'VENTANA',    25,  'Limpieza y revisión preventiva del equipo', true, 10, NOW(), NOW()),
  ('a1b2c3d4-e5f6-4a10-8b01-000000000002', 'Reparación',               'REPARACION',    'VENTANA',    40,  'Diagnóstico y reparación del equipo', true, 11, NOW(), NOW()),
  ('a1b2c3d4-e5f6-4a10-8b01-000000000003', 'Instalación',              'INSTALACION',   'VENTANA',    45,  'Instalación profesional del equipo', true, 12, NOW(), NOW()),
  ('a1b2c3d4-e5f6-4a10-8b01-000000000004', 'Recarga de Gas',           'RECARGA',       'VENTANA',    30,  'Recarga de gas refrigerante', true, 13, NOW(), NOW()),
  ('a1b2c3d4-e5f6-4a10-8b01-000000000005', 'Diagnóstico',              'DIAGNOSTICO',   'VENTANA',    15,  'Evaluación técnica del equipo', true, 14, NOW(), NOW()),

  ('a1b2c3d4-e5f6-4a10-8b01-000000000006', 'Mantenimiento Preventivo', 'MANTENIMIENTO', 'SPLIT',      35,  'Limpieza y revisión preventiva del equipo', true, 20, NOW(), NOW()),
  ('a1b2c3d4-e5f6-4a10-8b01-000000000007', 'Reparación',               'REPARACION',    'SPLIT',      55,  'Diagnóstico y reparación del equipo', true, 21, NOW(), NOW()),
  ('a1b2c3d4-e5f6-4a10-8b01-000000000008', 'Instalación',              'INSTALACION',   'SPLIT',      70,  'Instalación profesional del equipo', true, 22, NOW(), NOW()),
  ('a1b2c3d4-e5f6-4a10-8b01-000000000009', 'Recarga de Gas',           'RECARGA',       'SPLIT',      40,  'Recarga de gas refrigerante', true, 23, NOW(), NOW()),
  ('a1b2c3d4-e5f6-4a10-8b01-00000000000a', 'Diagnóstico',              'DIAGNOSTICO',   'SPLIT',      20,  'Evaluación técnica del equipo', true, 24, NOW(), NOW()),

  ('a1b2c3d4-e5f6-4a10-8b01-00000000000b', 'Mantenimiento Preventivo', 'MANTENIMIENTO', 'TONELADA_1', 50,  'Limpieza y revisión preventiva del equipo', true, 30, NOW(), NOW()),
  ('a1b2c3d4-e5f6-4a10-8b01-00000000000c', 'Reparación',               'REPARACION',    'TONELADA_1', 75,  'Diagnóstico y reparación del equipo', true, 31, NOW(), NOW()),
  ('a1b2c3d4-e5f6-4a10-8b01-00000000000d', 'Instalación',              'INSTALACION',   'TONELADA_1', 90,  'Instalación profesional del equipo', true, 32, NOW(), NOW()),
  ('a1b2c3d4-e5f6-4a10-8b01-00000000000e', 'Recarga de Gas',           'RECARGA',       'TONELADA_1', 55,  'Recarga de gas refrigerante', true, 33, NOW(), NOW()),
  ('a1b2c3d4-e5f6-4a10-8b01-00000000000f', 'Diagnóstico',              'DIAGNOSTICO',   'TONELADA_1', 30,  'Evaluación técnica del equipo', true, 34, NOW(), NOW()),

  ('a1b2c3d4-e5f6-4a10-8b01-000000000010', 'Mantenimiento Preventivo', 'MANTENIMIENTO', 'TONELADA_2', 75,  'Limpieza y revisión preventiva del equipo', true, 40, NOW(), NOW()),
  ('a1b2c3d4-e5f6-4a10-8b01-000000000011', 'Reparación',               'REPARACION',    'TONELADA_2', 110, 'Diagnóstico y reparación del equipo', true, 41, NOW(), NOW()),
  ('a1b2c3d4-e5f6-4a10-8b01-000000000012', 'Instalación',              'INSTALACION',   'TONELADA_2', 130, 'Instalación profesional del equipo', true, 42, NOW(), NOW()),
  ('a1b2c3d4-e5f6-4a10-8b01-000000000013', 'Recarga de Gas',           'RECARGA',       'TONELADA_2', 80,  'Recarga de gas refrigerante', true, 43, NOW(), NOW()),
  ('a1b2c3d4-e5f6-4a10-8b01-000000000014', 'Diagnóstico',              'DIAGNOSTICO',   'TONELADA_2', 40,  'Evaluación técnica del equipo', true, 44, NOW(), NOW()),

  ('a1b2c3d4-e5f6-4a10-8b01-000000000015', 'Mantenimiento Preventivo', 'MANTENIMIENTO', 'TONELADA_3', 100, 'Limpieza y revisión preventiva del equipo', true, 50, NOW(), NOW()),
  ('a1b2c3d4-e5f6-4a10-8b01-000000000016', 'Reparación',               'REPARACION',    'TONELADA_3', 150, 'Diagnóstico y reparación del equipo', true, 51, NOW(), NOW()),
  ('a1b2c3d4-e5f6-4a10-8b01-000000000017', 'Instalación',              'INSTALACION',   'TONELADA_3', 170, 'Instalación profesional del equipo', true, 52, NOW(), NOW()),
  ('a1b2c3d4-e5f6-4a10-8b01-000000000018', 'Recarga de Gas',           'RECARGA',       'TONELADA_3', 105, 'Recarga de gas refrigerante', true, 53, NOW(), NOW()),
  ('a1b2c3d4-e5f6-4a10-8b01-000000000019', 'Diagnóstico',              'DIAGNOSTICO',   'TONELADA_3', 55,  'Evaluación técnica del equipo', true, 54, NOW(), NOW());
