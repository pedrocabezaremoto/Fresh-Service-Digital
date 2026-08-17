/** Etiquetas y estilos del catálogo de servicios (espejo de los enums Prisma). */

export const EQUIPMENT_LABELS = {
  VENTANA: 'Aire de Ventana',
  SPLIT: 'Aire Split',
  TONELADA_1: 'Aire 1 Tonelada',
  TONELADA_2: 'Aire 2 Toneladas',
  TONELADA_3: 'Aire 3 Toneladas',
  GENERAL: 'General',
};

export const EQUIPMENT_TYPES = Object.keys(EQUIPMENT_LABELS);

export const CATEGORY_LABELS = {
  MANTENIMIENTO: 'Mantenimiento',
  REPARACION: 'Reparación',
  INSTALACION: 'Instalación',
  DIAGNOSTICO: 'Diagnóstico',
  RECARGA: 'Recarga',
  OTRO: 'Otro',
};

export const SERVICE_CATEGORIES = Object.keys(CATEGORY_LABELS);

export const CATEGORY_STYLE = {
  MANTENIMIENTO: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  REPARACION: 'bg-amber-100 text-amber-700 ring-amber-200',
  INSTALACION: 'bg-sky-100 text-sky-700 ring-sky-200',
  DIAGNOSTICO: 'bg-violet-100 text-violet-700 ring-violet-200',
  RECARGA: 'bg-cyan-100 text-cyan-700 ring-cyan-200',
  OTRO: 'bg-slate-100 text-slate-700 ring-slate-200',
};

export const EQUIPMENT_STYLE = {
  VENTANA: 'bg-amber-100 text-amber-700 ring-amber-200',
  SPLIT: 'bg-sky-100 text-sky-700 ring-sky-200',
  TONELADA_1: 'bg-violet-100 text-violet-700 ring-violet-200',
  TONELADA_2: 'bg-indigo-100 text-indigo-700 ring-indigo-200',
  TONELADA_3: 'bg-fuchsia-100 text-fuchsia-700 ring-fuchsia-200',
  GENERAL: 'bg-slate-100 text-slate-700 ring-slate-200',
};

export const EQUIPMENT_BTU = {
  VENTANA: 12000,
  SPLIT: 18000,
  TONELADA_1: 12000,
  TONELADA_2: 24000,
  TONELADA_3: 36000,
  GENERAL: null,
  'Aire de Ventana': 12000,
  'Aire Split': 18000,
  'Aire 1 Tonelada': 12000,
  'Aire 2 Toneladas': 24000,
  'Aire 3 Toneladas': 36000,
};

/** Fallback si GET /services no responde (misma tabla que prices.js). */
export const FALLBACK_EQUIPOS = [
  { v: 'Aire de Ventana', type: 'VENTANA', btu: 12000 },
  { v: 'Aire Split', type: 'SPLIT', btu: 18000 },
  { v: 'Aire 1 Tonelada', type: 'TONELADA_1', btu: 12000 },
  { v: 'Aire 2 Toneladas', type: 'TONELADA_2', btu: 24000 },
  { v: 'Aire 3 Toneladas', type: 'TONELADA_3', btu: 36000 },
];

export const FALLBACK_SERVICIOS = [
  'Reparación',
  'Mantenimiento Preventivo',
  'Instalación',
  'Recarga de Gas',
  'Diagnóstico',
];
