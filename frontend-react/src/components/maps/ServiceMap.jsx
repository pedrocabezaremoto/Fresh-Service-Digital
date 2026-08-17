import { useMemo } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import {
  fixLeafletIcons,
  SJM_CENTER,
  SJM_ZOOM,
  OSM_TILE_URL,
  OSM_ATTRIBUTION,
} from './fixLeafletIcons';
import { STATUS } from '../../lib/status';

fixLeafletIcons();

/** Colores de marker por estado (círculos divIcon) */
export const MAP_STATUS_COLORS = {
  PENDING: '#f59e0b',
  ASSIGNED: '#3b82f6',
  IN_PROGRESS: '#8b5cf6',
  COMPLETED: '#10b981',
  CANCELLED: '#ef4444',
};

const LEGEND = [
  { key: 'PENDING', label: 'Pendiente' },
  { key: 'ASSIGNED', label: 'Asignada' },
  { key: 'IN_PROGRESS', label: 'En proceso' },
  { key: 'COMPLETED', label: 'Completada' },
  { key: 'CANCELLED', label: 'Cancelada' },
];

function markerIcon(status) {
  const color = MAP_STATUS_COLORS[status] || '#64748b';
  return L.divIcon({
    className: 'fsd-service-marker',
    html: `<div style="width:16px;height:16px;border-radius:9999px;background:${color};border:2px solid #ffffff;box-shadow:0 1px 4px rgba(15,23,42,0.35)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -10],
  });
}

function hasCoords(a) {
  return (
    a?.latitude != null &&
    a?.longitude != null &&
    Number.isFinite(Number(a.latitude)) &&
    Number.isFinite(Number(a.longitude))
  );
}

/**
 * ServiceMap — mapa multi-marker de todas las solicitudes con ubicación.
 *
 * Props:
 * - appointments: array de citas (con lat/lng/address/status/client/equipment/technician)
 * - filterStatus: string|null — si hay valor, solo ese status; null = todos
 * - height?: string (default "400px")
 */
export default function ServiceMap({
  appointments = [],
  filterStatus = null,
  height = '400px',
}) {
  const markers = useMemo(() => {
    let list = (appointments || []).filter(hasCoords);
    if (filterStatus) {
      list = list.filter((a) => a.status === filterStatus);
    }
    return list;
  }, [appointments, filterStatus]);

  const anyWithCoords = useMemo(
    () => (appointments || []).some(hasCoords),
    [appointments],
  );

  const emptyMessage = !anyWithCoords
    ? 'Ninguna solicitud tiene ubicación registrada'
    : filterStatus
      ? 'No hay solicitudes con ubicación en este filtro'
      : 'Ninguna solicitud tiene ubicación registrada';

  return (
    <div className="w-full space-y-3">
      <div
        className="relative w-full overflow-hidden rounded-2xl bg-slate-50 shadow-sm ring-1 ring-slate-200"
        style={{ height }}
      >
        {markers.length === 0 && (
          <div className="pointer-events-none absolute inset-0 z-[500] grid place-items-center bg-white/70 px-4 text-center backdrop-blur-[1px]">
            <p className="max-w-xs text-sm font-semibold text-ink-500">{emptyMessage}</p>
          </div>
        )}

        <MapContainer
          center={[SJM_CENTER.lat, SJM_CENTER.lng]}
          zoom={SJM_ZOOM}
          scrollWheelZoom
          className="h-full w-full"
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer attribution={OSM_ATTRIBUTION} url={OSM_TILE_URL} />
          {markers.map((a) => {
            const eq = a.equipment?.[0];
            const clientName = a.client
              ? `${a.client.firstName || ''} ${a.client.lastName || ''}`.trim()
              : 'Cliente';
            const service = eq
              ? `${eq.brand || ''}${eq.model ? ` · ${eq.model}` : ''}`.trim()
              : 'Servicio';
            const tech = a.technician
              ? `${a.technician.firstName || ''} ${a.technician.lastName || ''}`.trim()
              : null;
            const st = STATUS[a.status];
            const color = MAP_STATUS_COLORS[a.status] || '#64748b';

            return (
              <Marker
                key={a.id}
                position={[Number(a.latitude), Number(a.longitude)]}
                icon={markerIcon(a.status)}
              >
                <Popup>
                  <div style={{ minWidth: 160, fontSize: 13, lineHeight: 1.35 }}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{clientName}</div>
                    <div style={{ color: '#475569', marginBottom: 4 }}>{service}</div>
                    <div style={{ marginBottom: 4 }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 700,
                          background: `${color}22`,
                          color,
                        }}
                      >
                        {st?.label || a.status}
                      </span>
                    </div>
                    {tech ? (
                      <div style={{ color: '#334155', marginBottom: 2 }}>
                        Técnico: <strong>{tech}</strong>
                      </div>
                    ) : (
                      <div style={{ color: '#94a3b8', marginBottom: 2 }}>Sin técnico asignado</div>
                    )}
                    {a.address ? (
                      <div style={{ color: '#475569', marginTop: 4 }}>{a.address}</div>
                    ) : null}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-1">
        {LEGEND.map((item) => (
          <div key={item.key} className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-600">
            <span
              className="inline-block h-3 w-3 rounded-full ring-2 ring-white shadow-sm"
              style={{ background: MAP_STATUS_COLORS[item.key] }}
            />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}
