/** Etiquetas y estilos del catálogo de servicios.
 *  Los labels/slugs ahora se cargan de la BD.
 *  Estos mapeos son FALLBACK para cuando la BD no responde.
 */

// Paleta de colores para badges (se asigna rotativamente)
const BADGE_COLORS = [
  'bg-emerald-100 text-emerald-700 ring-emerald-200',
  'bg-amber-100 text-amber-700 ring-amber-200',
  'bg-sky-100 text-sky-700 ring-sky-200',
  'bg-violet-100 text-violet-700 ring-violet-200',
  'bg-cyan-100 text-cyan-700 ring-cyan-200',
  'bg-rose-100 text-rose-700 ring-rose-200',
  'bg-indigo-100 text-indigo-700 ring-indigo-200',
  'bg-fuchsia-100 text-fuchsia-700 ring-fuchsia-200',
  'bg-slate-100 text-slate-700 ring-slate-200',
];

export function getCategoryStyle(slug, index = 0) {
  const i = index < 0 ? 0 : index;
  return BADGE_COLORS[i % BADGE_COLORS.length];
}

export function getEquipmentStyle(slug, index = 0) {
  const i = index < 0 ? 0 : index;
  return BADGE_COLORS[i % BADGE_COLORS.length];
}

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
