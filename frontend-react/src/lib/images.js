/* Imágenes de stock para refrigeración.
   Las imágenes de servicios AC están en public/ (generadas localmente).
   Las demás usan Unsplash con IDs verificados. */
const U = (id, w = 1000) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const IMG = {
  technician: '/img-tech-ac.png', // técnico haciendo mantenimiento a un split
  repair: '/img-tonnage-ac.png', // Aires por Toneladas (condensadores industriales)
  maintenance: '/img-window-ac.png', // Aires de Ventana (unidad de ventana)
  install: '/img-split-ac.png', // Aires Split (split mural)
  comfort: U('photo-1599696848652-f0ff23bc911f', 1200), // interior confortable
  appliance: U('photo-1565538810643-b5bdb714032a', 900), // electrodoméstico (neveras)
  heroTech: '/img-tech-ac.png',
};

/* object-position por imagen: el split mural está arriba (~20%) de la foto;
   con object-cover centrado en banners anchos queda pared vacía. */
export const IMG_OBJECT_POSITION = {
  [IMG.install]: 'object-[center_22%]',
};

export function imgObjectClass(src) {
  return IMG_OBJECT_POSITION[src] || '';
}

