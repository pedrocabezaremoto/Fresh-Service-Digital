import { useEffect, useState } from 'react';
import { Loader2, Snowflake, Plus, MessageCircle } from 'lucide-react';
import Button from '../components/Button';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { STATUS, fmtDate, fmtTime } from '../lib/status';

function StatCard({ value, label, accent }) {
  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-100 shadow-sm">
      <div className={`h-1 w-10 rounded-full ${accent}`} />
      <div className="mt-3 font-display text-3xl font-extrabold text-ink-900">{value}</div>
      <div className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</div>
    </div>
  );
}

export default function ClienteDashboard() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const total = items.length;
  const active = items.filter((a) => ['PENDING', 'ASSIGNED', 'IN_PROGRESS'].includes(a.status)).length;
  const completed = items.filter((a) => a.status === 'COMPLETED').length;

  return (
    <div className="min-h-screen bg-brand-50">
      <div className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-brand-gradient p-8 text-white shadow-glow sm:p-10">
          <Snowflake className="absolute -right-4 -top-4 text-white/15" size={130} />
          <div className="relative">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-100">Área de clientes</span>
            <h1 className="mt-1 font-display text-3xl font-extrabold sm:text-4xl">¡Hola, {user.firstName}!</h1>
            <p className="mt-2 max-w-md text-brand-50/90">Aquí puedes seguir el estado de tus solicitudes y agendar nuevos servicios a domicilio.</p>
            <Button to="/solicitud" variant="dark" className="mt-5"><Plus size={18} /> Solicitar servicio</Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          <StatCard value={total} label="Total solicitados" accent="bg-brand-500" />
          <StatCard value={active} label="Servicios activos" accent="bg-amber-500" />
          <StatCard value={completed} label="Completados" accent="bg-emerald-500" />
        </div>

        {/* Historial */}
        <div className="mt-8 rounded-3xl bg-white p-6 ring-1 ring-slate-100 shadow-sm sm:p-8">
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
                return (
                  <div key={a.id} className="flex flex-col gap-3 rounded-2xl border border-slate-100 p-4 transition hover:border-brand-200 hover:bg-brand-50/40 sm:flex-row sm:items-center sm:justify-between">
                    <div className="border-l-2 border-brand-300 pl-3">
                      <div className="font-semibold text-ink-900">{eq ? `${eq.brand} · ${eq.model}` : a.brand || 'Servicio'}</div>
                      <div className="text-xs text-ink-500">{fmtDate(a.scheduledAt)} · {fmtTime(a.scheduledAt)} · Ref #{a.id.substring(0, 8).toUpperCase()}</div>
                      {a.technician && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-semibold text-brand-700">Técnico: {a.technician.firstName} {a.technician.lastName}</span>
                          {a.technician.phone && (
                            <a href={`https://wa.me/${a.technician.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-600 transition hover:bg-emerald-100">
                              <MessageCircle size={12} /> {a.technician.phone}
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                    <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${st.cls}`}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: st.dot }} /> {st.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-6 rounded-2xl bg-white p-5 text-sm text-ink-600 ring-1 ring-slate-100">
          <span className="font-semibold text-ink-900">¿Necesitas ayuda?</span> Escríbenos por{' '}
          <a href="https://wa.me/584120000000" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-emerald-600"><MessageCircle size={14} /> WhatsApp</a>.
        </div>
      </div>
    </div>
  );
}
