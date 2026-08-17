import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Loader2, Snowflake, Plus, MessageCircle, FileText,
  MapPin, ChevronDown, ChevronUp,
} from 'lucide-react';
import Button from '../components/Button';
import LocationView from '../components/maps/LocationView';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useRate } from '../context/RateContext';
import { priceUsd } from '../lib/prices';
import { formatBs, formatUsd } from '../lib/money';
import { STATUS, fmtDate, fmtTime } from '../lib/status';

function hasCoords(a) {
  return (
    a?.latitude != null &&
    a?.longitude != null &&
    Number.isFinite(Number(a.latitude)) &&
    Number.isFinite(Number(a.longitude))
  );
}

function StatCard({ value, label, accent }) {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100 shadow-sm sm:p-5">
      <div className={`h-1 w-10 rounded-full ${accent}`} />
      <div className="mt-3 font-display text-3xl font-extrabold text-ink-900">{value}</div>
      <div className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</div>
    </div>
  );
}

export default function ClienteDashboard() {
  const { user } = useAuth();
  const { rate } = useRate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openMapId, setOpenMapId] = useState(null);
  // Remontar mapas al rotar (Leaflet no se redimensiona solo; no tocamos LocationView)
  const [mapTick, setMapTick] = useState(0);

  const priceOf = (a) => a.priceUsd ?? priceUsd(a.equipment?.[0]?.brand, a.equipment?.[0]?.model);
  const money = (usd) => formatBs(usd, rate) || formatUsd(usd);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getClientAppointments(user.id);
        setItems(data);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user.id]);

  useEffect(() => {
    const bump = () => setMapTick((t) => t + 1);
    window.addEventListener('orientationchange', bump);
    return () => window.removeEventListener('orientationchange', bump);
  }, []);

  const total = items.length;
  const activeItems = items.filter((a) => ['PENDING', 'ASSIGNED', 'IN_PROGRESS'].includes(a.status));
  const active = activeItems.length;
  const completed = items.filter((a) => a.status === 'COMPLETED').length;
  const totalUsd = activeItems.reduce((s, a) => s + priceOf(a), 0);

  return (
    <div className="min-h-screen overflow-x-clip bg-brand-50">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-5 lg:px-8">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-brand-gradient p-5 text-white shadow-glow sm:p-8">
          <Snowflake className="absolute -right-4 -top-4 text-white/15" size={130} />
          <div className="relative min-w-0">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-100">Área de clientes</span>
            <h1 className="mt-1.5 font-display text-xl font-bold break-words sm:text-2xl">Hola, {user.firstName} {user.lastName}</h1>
            <p className="mt-1.5 max-w-md text-sm text-brand-50/90">Sigue el estado de tus solicitudes y agenda nuevos servicios a domicilio.</p>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-brand-50/90">
              <span className="min-w-0 break-all"><span className="text-brand-200">Correo:</span> {user.email}</span>
              {user.phone && <span><span className="text-brand-200">WhatsApp:</span> {user.phone}</span>}
            </div>
            <Button to="/solicitud" variant="dark" className="mt-5"><Plus size={18} /> Solicitar servicio</Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid gap-3 sm:grid-cols-3 sm:gap-5">
          <StatCard value={total} label="Total solicitados" accent="bg-brand-500" />
          <StatCard value={active} label="Servicios activos" accent="bg-amber-500" />
          <StatCard value={completed} label="Completados" accent="bg-emerald-500" />
        </div>

        {/* Total a pagar */}
        {totalUsd > 0 && (
          <div className="mt-6 flex flex-col gap-4 rounded-3xl bg-brand-950 p-4 text-white sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="min-w-0">
              <div className="text-xs font-bold uppercase tracking-wider text-brand-300">Total a pagar · servicios activos</div>
              <div className="mt-1 font-display text-3xl font-extrabold">{money(totalUsd)}</div>
              <div className="mt-0.5 text-xs text-brand-200/80">Ref. {formatUsd(totalUsd)} · monto en Bs sujeto a la tasa BCV del día</div>
            </div>
            <Link to="/proforma" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-brand-700 shadow transition hover:bg-brand-50 active:bg-brand-50 touch-manipulation">
              <FileText size={18} /> Descargar proforma
            </Link>
          </div>
        )}

        {/* Historial */}
        <div className="mt-8 rounded-3xl bg-white p-4 ring-1 ring-slate-100 shadow-sm sm:p-8">
          <h2 className="font-display text-lg font-bold text-ink-900">Historial de solicitudes</h2>

          {loading ? (
            <div className="grid place-items-center py-16 text-brand-400">
              <Loader2 className="animate-spin" size={32} />
            </div>
          ) : items.length === 0 ? (
            <div className="grid place-items-center py-14 text-center">
              <Snowflake className="text-brand-200" size={48} />
              <p className="mt-4 font-semibold text-ink-700">Aún no tienes solicitudes</p>
              <p className="mt-1 text-sm text-ink-500">Agenda tu primera visita técnica y aparecerá aquí.</p>
              <Button to="/solicitud" className="mt-5">Agendar mi primer servicio</Button>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {items.map((a) => {
                const eq = a.equipment?.[0];
                const st = STATUS[a.status] || STATUS.PENDING;
                const coords = hasCoords(a);
                const mapOpen = openMapId === a.id;
                return (
                  <div
                    key={a.id}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-100 p-4 transition hover:border-brand-200 hover:bg-brand-50/40"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="border-l-2 border-brand-300 pl-3 min-w-0">
                        <div className="font-semibold text-ink-900">{eq ? `${eq.brand} · ${eq.model}` : a.brand || 'Servicio'}</div>
                        <div className="text-xs text-ink-500">{fmtDate(a.scheduledAt)} · {fmtTime(a.scheduledAt)} · Ref #{a.id.substring(0, 8).toUpperCase()}</div>
                        {a.technician && (
                          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-semibold text-brand-700">Técnico: {a.technician.firstName} {a.technician.lastName}</span>
                            {a.technician.phone && (
                              <a href={`https://wa.me/${a.technician.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-600 transition hover:bg-emerald-100 active:bg-emerald-100 touch-manipulation">
                                <MessageCircle size={12} /> {a.technician.phone}
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:gap-1.5">
                        <div className="text-right">
                          <div className="font-display text-base font-bold text-ink-900">{money(priceOf(a))}</div>
                          <div className="text-[11px] text-ink-400">Ref. {formatUsd(priceOf(a))}</div>
                        </div>
                        <span className={`inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap ${st.cls}`}>
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: st.dot }} /> {st.label}
                        </span>
                      </div>
                    </div>

                    {/* Mini-mapa opcional (solo si hay coordenadas) */}
                    {coords && (
                      <div className="w-full min-w-0 space-y-2 border-t border-slate-50 pt-3">
                        <button
                          type="button"
                          onClick={() => setOpenMapId((id) => (id === a.id ? null : a.id))}
                          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-50 px-4 py-2.5 text-sm font-bold text-brand-700 ring-1 ring-brand-100 transition hover:bg-brand-100 active:bg-brand-100 touch-manipulation cursor-pointer sm:w-auto sm:justify-start"
                        >
                          <MapPin size={16} />
                          {mapOpen ? 'Ocultar ubicación' : 'Ver ubicación del servicio'}
                          {mapOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        {mapOpen && (
                          <div className="w-full min-w-0 overflow-hidden">
                            <LocationView
                              key={`cli-map-${a.id}-${mapTick}`}
                              latitude={a.latitude}
                              longitude={a.longitude}
                              address={a.address || undefined}
                              height="180px"
                              showNavigationButton={false}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-6 rounded-2xl bg-white p-4 text-sm text-ink-600 ring-1 ring-slate-100 sm:p-5">
          <span className="font-semibold text-ink-900">¿Necesitas ayuda?</span> Escríbenos por{' '}
          <a href="https://wa.me/584120000000" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-1 font-semibold text-emerald-600 hover:text-emerald-700 active:text-emerald-700 touch-manipulation"><MessageCircle size={14} /> WhatsApp</a>.
        </div>
      </div>
    </div>
  );
}
