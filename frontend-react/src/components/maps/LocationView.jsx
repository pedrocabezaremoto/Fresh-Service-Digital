import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { Navigation } from 'lucide-react';
import {
  fixLeafletIcons,
  OSM_TILE_URL,
  OSM_ATTRIBUTION,
} from './fixLeafletIcons';

fixLeafletIcons();

/**
 * LocationView — mapa de solo lectura (técnico / admin).
 *
 * Props:
 * - latitude, longitude — coordenadas del servicio
 * - address — texto del popup
 * - height?: string (default "200px")
 * - showNavigationButton?: boolean — botón "Cómo llegar" → Google Maps
 */
export default function LocationView({
  latitude,
  longitude,
  address,
  height = '200px',
  showNavigationButton = false,
}) {
  const hasCoords =
    latitude !== null &&
    latitude !== undefined &&
    longitude !== null &&
    longitude !== undefined &&
    Number.isFinite(Number(latitude)) &&
    Number.isFinite(Number(longitude));

  if (!hasCoords) {
    return (
      <div className="w-full rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm font-medium text-ink-500 ring-1 ring-slate-100">
        Ubicación no registrada
      </div>
    );
  }

  const lat = Number(latitude);
  const lng = Number(longitude);
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(lat)},${encodeURIComponent(lng)}`;

  return (
    <div className="w-full space-y-2">
      <div
        className="w-full overflow-hidden rounded-2xl shadow-sm ring-1 ring-slate-200"
        style={{ height }}
      >
        <MapContainer
          center={[lat, lng]}
          zoom={15}
          scrollWheelZoom={false}
          dragging={false}
          doubleClickZoom={false}
          zoomControl={false}
          touchZoom={false}
          keyboard={false}
          className="h-full w-full"
          style={{ height: '100%', width: '100%', cursor: 'default' }}
        >
          <TileLayer attribution={OSM_ATTRIBUTION} url={OSM_TILE_URL} />
          <Marker position={[lat, lng]}>
            {address ? <Popup>{address}</Popup> : null}
          </Marker>
        </MapContainer>
      </div>

      {showNavigationButton && (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-brand-gradient px-4 py-2 text-sm font-bold text-white shadow-glow transition hover:shadow-glow-lg hover:brightness-105"
        >
          <Navigation size={16} />
          Cómo llegar
        </a>
      )}
    </div>
  );
}
