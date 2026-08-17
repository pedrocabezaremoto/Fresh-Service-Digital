/* Imágenes de stock para refrigeración.
   Las imágenes de servicios AC están en public/ (generadas localmente).
   Las demás usan Unsplash con IDs verificados.
   Los slots del admin (GET /site-images) pisan estos defaults si hay custom. */
import { API_BASE } from './api';

const U = (id, w = 1000) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

/** Defaults del sitio. No borrar: son el fallback si la API no responde. */
export const IMG = {
  technician: '/img-tech-ac.png', // técnico haciendo mantenimiento a un split
  repair: '/img-tonnage-ac.png', // Aires por Toneladas (condensadores industriales)
  maintenance: '/img-window-ac.png', // Aires de Ventana (unidad de ventana)
  install: '/img-split-ac.png', // Aires Split (split mural)
  comfort: U('photo-1599696848652-f0ff23bc911f', 1200), // interior confortable
  appliance: U('photo-1565538810643-b5bdb714032a', 900), // electrodoméstico (neveras)
  heroTech: '/img-tech-ac.png',
};

export const SITE_IMAGE_SLOTS = [
  { slot: 'hero', label: 'Hero principal', hint: '1920×800 px', defaultKey: 'heroTech' },
  { slot: 'service_ventana', label: 'Aires de Ventana', hint: '800×600 px', defaultKey: 'maintenance' },
  { slot: 'service_split', label: 'Aires Split', hint: '800×600 px', defaultKey: 'install' },
  { slot: 'service_toneladas', label: 'Aires por Toneladas', hint: '800×600 px', defaultKey: 'repair' },
  { slot: 'technician', label: 'Técnico', hint: '800×1000 px', defaultKey: 'technician' },
];

const SLOT_TO_KEY = {
  hero: 'heroTech',
  service_ventana: 'maintenance',
  service_split: 'install',
  service_toneladas: 'repair',
  technician: 'technician',
};

/** GET /site-images → mapa slot → URL. Si falla, objeto vacío (se usan defaults). */
export async function fetchSiteImageMap() {
  const res = await fetch(`${API_BASE}/site-images`);
  if (!res.ok) return {};
  const list = await res.json();
  const map = {};
  if (Array.isArray(list)) {
    list.forEach((img) => {
      if (img?.slot && img?.url) map[img.slot] = img;
    });
  }
  return map;
}

/** Combina customs del admin con los PNG/Unsplash de fallback. */
export function mergeSiteImages(bySlot = {}) {
  const next = { ...IMG };
  Object.entries(SLOT_TO_KEY).forEach(([slot, key]) => {
    const custom = bySlot[slot];
    const url = typeof custom === 'string' ? custom : custom?.url;
    if (url) next[key] = url;
  });
  return next;
}

/* object-position por imagen: el split mural está arriba (~20%) de la foto;
   con object-cover centrado en banners anchos queda pared vacía. */
export const IMG_OBJECT_POSITION = {
  [IMG.install]: 'object-[center_22%]',
};

export function imgObjectClass(src) {
  return IMG_OBJECT_POSITION[src] || '';
}
