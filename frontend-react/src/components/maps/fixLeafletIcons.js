/**
 * Fix del bug clásico de Leaflet + Vite/Webpack:
 * las URLs de los íconos del marker se resuelven mal y el pin sale roto/invisible.
 * Hay que fijar las rutas explícitamente con los assets del paquete.
 */
import L from 'leaflet';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

let fixed = false;

export function fixLeafletIcons() {
  if (fixed) return;
  // Evita que Leaflet intente concatenar rutas relativas rotas
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
  });
  fixed = true;
}

/** Centro por defecto: San Juan de los Morros, Guárico, Venezuela */
export const SJM_CENTER = { lat: 9.91, lng: -67.36 };
export const SJM_ZOOM = 13;

export const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
