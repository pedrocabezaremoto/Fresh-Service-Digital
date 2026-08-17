import { useCallback, useEffect, useRef, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import { LocateFixed } from 'lucide-react';
import {
  fixLeafletIcons,
  SJM_CENTER,
  SJM_ZOOM,
  OSM_TILE_URL,
  OSM_ATTRIBUTION,
} from './fixLeafletIcons';

fixLeafletIcons();

const NOMINATIM_MIN_INTERVAL_MS = 1100; // Nominatim: máx. ~1 req/s

/**
 * Solo vuela el mapa cuando el padre pide un destino (GPS),
 * no en cada drag del marker (evita pelear con el arrastre).
 */
function MapFlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (!target || target.lat == null || target.lng == null) return;
    map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 15), { duration: 0.6 });
  }, [map, target]);
  return null;
}

/**
 * Marker arrastrable; notifica dragend al padre.
 */
function DraggableMarker({ position, onDragEnd }) {
  const markerRef = useRef(null);

  return (
    <Marker
      draggable
      position={[position.lat, position.lng]}
      ref={markerRef}
      eventHandlers={{
        dragend() {
          const marker = markerRef.current;
          if (!marker) return;
          const { lat, lng } = marker.getLatLng();
          onDragEnd({ lat, lng });
        },
      }}
    />
  );
}

/**
 * LocationPicker — mapa interactivo para que el cliente elija el domicilio del servicio.
 *
 * Props:
 * - onLocationChange({ latitude, longitude, address })
 * - initialPosition?: { lat, lng }
 * - height?: string (default "300px")
 */
export default function LocationPicker({
  onLocationChange,
  initialPosition,
  height = '300px',
}) {
  const start = initialPosition?.lat != null && initialPosition?.lng != null
    ? { lat: Number(initialPosition.lat), lng: Number(initialPosition.lng) }
    : SJM_CENTER;

  const [position, setPosition] = useState(start);
  const [flyTarget, setFlyTarget] = useState(null);
  const [address, setAddress] = useState('');
  const [geoMsg, setGeoMsg] = useState('');
  const [lookingUp, setLookingUp] = useState(false);

  const lastNominatimAt = useRef(0);
  const pendingLookup = useRef(null);
  const addressRef = useRef('');
  const onChangeRef = useRef(onLocationChange);
  onChangeRef.current = onLocationChange;

  const emit = useCallback((lat, lng, addr) => {
    onChangeRef.current?.({
      latitude: lat,
      longitude: lng,
      address: addr ?? '',
    });
  }, []);

  const reverseGeocode = useCallback(async (lat, lng) => {
    const wait = Math.max(0, NOMINATIM_MIN_INTERVAL_MS - (Date.now() - lastNominatimAt.current));
    if (wait > 0) {
      await new Promise((r) => setTimeout(r, wait));
    }
    const ticket = Symbol('lookup');
    pendingLookup.current = ticket;
    setLookingUp(true);
    try {
      lastNominatimAt.current = Date.now();
      const url =
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}` +
        `&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=0`;
      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'Accept-Language': 'es',
        },
      });
      if (pendingLookup.current !== ticket) return null;
      if (!res.ok) return null;
      const data = await res.json();
      return data.display_name || null;
    } catch {
      return null;
    } finally {
      if (pendingLookup.current === ticket) setLookingUp(false);
    }
  }, []);

  const applyPosition = useCallback(
    async (lat, lng, { fly = false } = {}) => {
      setPosition({ lat, lng });
      if (fly) setFlyTarget({ lat, lng, t: Date.now() });
      const name = await reverseGeocode(lat, lng);
      if (name) {
        addressRef.current = name;
        setAddress(name);
        emit(lat, lng, name);
      } else {
        emit(lat, lng, addressRef.current);
      }
    },
    [emit, reverseGeocode],
  );

  // Primera emisión al montar (default o initialPosition)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const name = await reverseGeocode(start.lat, start.lng);
      if (cancelled) return;
      if (name) {
        addressRef.current = name;
        setAddress(name);
        emit(start.lat, start.lng, name);
      } else {
        emit(start.lat, start.lng, '');
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPosition?.lat, initialPosition?.lng]);

  function handleUseMyLocation() {
    setGeoMsg('');
    if (!navigator.geolocation) {
      setGeoMsg('Tu navegador no soporta geolocalización.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        applyPosition(lat, lng, { fly: true });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGeoMsg('Permiso de ubicación denegado. Puedes arrastrar el pin manualmente.');
        } else {
          setGeoMsg('No se pudo obtener tu ubicación. Arrastra el pin en el mapa.');
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  }

  function handleAddressEdit(e) {
    const value = e.target.value;
    addressRef.current = value;
    setAddress(value);
    emit(position.lat, position.lng, value);
  }

  return (
    <div className="w-full space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleUseMyLocation}
          className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-sm font-bold text-brand-700 ring-1 ring-brand-100 transition hover:bg-brand-100 cursor-pointer"
        >
          <LocateFixed size={16} />
          Usar mi ubicación
        </button>
        {lookingUp && (
          <span className="text-xs font-medium text-ink-500">Buscando dirección…</span>
        )}
      </div>

      {geoMsg && (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-100">
          {geoMsg}
        </p>
      )}

      <div
        className="w-full overflow-hidden rounded-2xl shadow-sm ring-1 ring-slate-200"
        style={{ height }}
      >
        <MapContainer
          center={[start.lat, start.lng]}
          zoom={SJM_ZOOM}
          scrollWheelZoom
          className="h-full w-full"
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer attribution={OSM_ATTRIBUTION} url={OSM_TILE_URL} />
          <MapFlyTo target={flyTarget} />
          <DraggableMarker
            position={position}
            onDragEnd={({ lat, lng }) => applyPosition(lat, lng)}
          />
        </MapContainer>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-ink-700" htmlFor="fsd-map-address">
          Dirección del servicio
        </label>
        <input
          id="fsd-map-address"
          type="text"
          value={address}
          onChange={handleAddressEdit}
          placeholder="Se completa al mover el pin; puedes editarla"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-ink-900 shadow-sm outline-none ring-brand-400 transition focus:ring-2"
        />
        <p className="mt-1 text-xs text-ink-500">
          Arrastra el pin o usa tu GPS. La dirección se rellena sola y puedes corregirla.
        </p>
      </div>
    </div>
  );
}
