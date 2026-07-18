// Espejo de la tabla de precios del frontend (src/lib/prices.js).
// Usado para el correo/proforma de citas viejas que no tienen priceUsd guardado.
const PRICES: Record<string, Record<string, number>> = {
  'Aire de Ventana':  { 'Mantenimiento Preventivo': 25, Reparación: 40, Diagnóstico: 15, 'Recarga de Gas': 30, Instalación: 45 },
  'Aire Split':       { 'Mantenimiento Preventivo': 35, Reparación: 55, Diagnóstico: 20, 'Recarga de Gas': 40, Instalación: 70 },
  'Aire 1 Tonelada':  { 'Mantenimiento Preventivo': 50, Reparación: 75, Diagnóstico: 30, 'Recarga de Gas': 55, Instalación: 90 },
  'Aire 2 Toneladas': { 'Mantenimiento Preventivo': 75, Reparación: 110, Diagnóstico: 40, 'Recarga de Gas': 80, Instalación: 130 },
  'Aire 3 Toneladas': { 'Mantenimiento Preventivo': 100, Reparación: 150, Diagnóstico: 55, 'Recarga de Gas': 105, Instalación: 170 },
};

export function priceUsd(brand?: string, model?: string): number {
  if (brand && model && PRICES[brand]?.[model] != null) return PRICES[brand][model];
  return 30;
}
