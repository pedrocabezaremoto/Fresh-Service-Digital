import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Wrench, ClipboardList, LogOut, Globe, RefreshCw,
  Clock, Play, CheckCircle2, Loader2, Search, MessageCircle, Snowflake,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { STATUS, fmtDate, fmtTime } from '../lib/status';

function KPI({ icon: Icon, value, label, color, accent }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white p-5 ring-1 ring-slate-100 shadow-sm transition hover:scale-[1.02] duration-200">
      <div className="absolute inset-x-0 top-0 h-1" style={{ background: accent }} />
      <div className={`grid h-11 w-11 place-items-center rounded-xl ${color}`}>
        <Icon size={21} />
      </div>
      <div className="mt-4 font-display text-3xl font-extrabold text-ink-900">{value}</div>
      <div className="text-sm font-medium text-ink-500">{label}</div>
    </div>
  );
}

export default function TecnicoDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [appts, setAppts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('todo'); // 'todo' (por realizar), 'progress' (en ejecución), 'done' (terminadas)
  const [searchQuery, setSearchQuery] = useState('');

  async function load() {
    setLoading(true);
    try {
      const data = await api.getAllAppointments();
      setAppts(data);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  const stats = useMemo(() => {
    const by = (s) => appts.filter((a) => a.status === s).length;
    return {
      pending: by('PENDING') + by('ASSIGNED'),
      progress: by('IN_PROGRESS'),
      completed: by('COMPLETED'),
    };
  }, [appts]);

  async function changeStatus(id, newStatus) {
    try {
      await api.updateStatus(id, newStatus);
      setAppts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
      );
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        logout();
        navigate('/login');
      }
    }
  }

  async function claimJob(id) {
    try {
      const updated = await api.assignTechnician(id, user.id);
      setAppts((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                technicianId: user.id,
                technician: user,
                status: updated.status,
              }
            : a
        )
      );
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        logout();
        navigate('/login');
      }
    }
  }

  const filteredAppts = useMemo(() => {
    return appts.filter((a) => {
      // Filtrar por pestaña activa
      const matchTab =
        activeTab === 'todo'
          ? ['PENDING', 'ASSIGNED'].includes(a.status)
          : activeTab === 'progress'
          ? a.status === 'IN_PROGRESS'
          : a.status === 'COMPLETED';

      // Filtrar por búsqueda (nombre del cliente o modelo de equipo)
      const fullName = `${a.client.firstName} ${a.client.lastName}`.toLowerCase();
      const eq = a.equipment?.[0];
      const eqDesc = eq ? `${eq.brand} ${eq.model}`.toLowerCase() : '';
      const matchSearch =
        fullName.includes(searchQuery.toLowerCase()) ||
        a.client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        eqDesc.includes(searchQuery.toLowerCase());

      return matchTab && matchSearch;
    });
  }, [appts, activeTab, searchQuery]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-brand-950 lg:flex">
        <div className="flex items-center gap-2.5 border-b border-white/10 px-6 py-5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient-bright text-white shadow-glow sheen">
            <Snowflake size={20} />
          </div>
          <div>
            <div className="font-display text-sm font-extrabold text-white leading-none">
              Fresh Service
            </div>
            <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-400">
              Panel Técnico
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          <button
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition bg-white/10 text-white ring-1 ring-white/10"
          >
            <ClipboardList size={18} /> Mis Trabajos
          </button>
        </nav>
        <div className="space-y-2 border-t border-white/10 p-4">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-brand-100/70 transition hover:bg-white/5 hover:text-white"
          >
            <Globe size={17} /> Ver sitio web
          </Link>
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="flex w-full items-center gap-2 rounded-xl bg-rose-500/15 px-4 py-2.5 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/25"
          >
            <LogOut size={17} /> Cerrar sesión
          </button>
          <div className="flex items-center gap-2.5 pt-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-gradient font-bold text-white">
              {user?.firstName?.[0] || 'T'}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-white">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-xs text-brand-400">Técnico Certificado</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 lg:ml-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-5 backdrop-blur lg:px-8">
          <div>
            <div className="font-display font-bold text-ink-900">
              Panel Técnico de Climatización
            </div>
            <div className="text-xs text-ink-500">
              Atención y mantenimiento de aires acondicionados a domicilio
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={load}
              className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-sm font-bold text-brand-700 ring-1 ring-brand-100 transition hover:bg-brand-100"
            >
              <RefreshCw size={15} /> <span className="hidden sm:inline">Actualizar</span>
            </button>
          </div>
        </header>

        <div className="p-5 lg:p-8">
          {loading ? (
            <div className="grid place-items-center py-32 text-brand-400">
              <Loader2 className="animate-spin" size={36} />
            </div>
          ) : (
            <div className="space-y-6">
              {/* KPIs */}
              <div className="grid gap-5 sm:grid-cols-3">
                <KPI
                  icon={Clock}
                  value={stats.pending}
                  label="Trabajos Por Realizar"
                  color="bg-amber-100 text-amber-600"
                  accent="#f59e0b"
                />
                <KPI
                  icon={Play}
                  value={stats.progress}
                  label="En Ejecución"
                  color="bg-violet-100 text-violet-600"
                  accent="#8b5cf6"
                />
                <KPI
                  icon={CheckCircle2}
                  value={stats.completed}
                  label="Completados"
                  color="bg-emerald-100 text-emerald-600"
                  accent="#10b981"
                />
              </div>

              {/* Contenedor Principal */}
              <div className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm">
                {/* Cabecera / Buscador / Tabs */}
                <div className="border-b border-slate-100 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    {/* Tabs */}
                    <div className="flex border-b border-slate-100 sm:border-0">
                      <button
                        onClick={() => setActiveTab('todo')}
                        className={`border-b-2 px-4 py-2 text-sm font-semibold transition ${
                          activeTab === 'todo'
                            ? 'border-brand-600 text-brand-600'
                            : 'border-transparent text-ink-500 hover:text-brand-600'
                        }`}
                      >
                        Por realizar ({stats.pending})
                      </button>
                      <button
                        onClick={() => setActiveTab('progress')}
                        className={`border-b-2 px-4 py-2 text-sm font-semibold transition ${
                          activeTab === 'progress'
                            ? 'border-brand-600 text-brand-600'
                            : 'border-transparent text-ink-500 hover:text-brand-600'
                        }`}
                      >
                        En ejecución ({stats.progress})
                      </button>
                      <button
                        onClick={() => setActiveTab('done')}
                        className={`border-b-2 px-4 py-2 text-sm font-semibold transition ${
                          activeTab === 'done'
                            ? 'border-brand-600 text-brand-600'
                            : 'border-transparent text-ink-500 hover:text-brand-600'
                        }`}
                      >
                        Finalizados ({stats.completed})
                      </button>
                    </div>

                    {/* Buscador */}
                    <div className="flex items-center gap-2 rounded-full bg-slate-50 px-3.5 py-2 ring-1 ring-slate-200">
                      <Search size={16} className="text-ink-500" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar cliente o equipo..."
                        className="w-full bg-transparent text-sm outline-none placeholder:text-ink-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Listado de Citas */}
                <div className="divide-y divide-slate-100 p-5">
                  {filteredAppts.length === 0 ? (
                    <div className="py-20 text-center text-ink-500">
                      <Wrench className="mx-auto text-brand-300 mb-3" size={40} />
                      <p className="font-semibold text-lg">No hay trabajos en esta sección</p>
                      <p className="text-sm mt-1">Usa el buscador o cambia de pestaña para revisar otros estados.</p>
                    </div>
                  ) : (
                    <div className="grid gap-5 md:grid-cols-2">
                      {filteredAppts.map((a) => {
                        const eq = a.equipment?.[0];
                        const wa = a.client.phone ? a.client.phone.replace(/\D/g, '') : '';
                        return (
                          <div
                            key={a.id}
                            className="flex flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:border-brand-200 transition-all duration-300"
                          >
                            {/* Header Tarjeta */}
                            <div className="flex items-start justify-between border-b border-slate-50 pb-3">
                              <div className="flex items-center gap-3">
                                <div className="grid h-10 w-10 place-items-center rounded-full bg-brand-gradient font-bold text-white text-sm">
                                  {(a.client.firstName[0] + a.client.lastName[0]).toUpperCase()}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-ink-900 leading-tight">
                                    {a.client.firstName} {a.client.lastName}
                                  </h4>
                                  <span className="text-xs text-ink-500">
                                    {a.client.email}
                                  </span>
                                </div>
                              </div>
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                  STATUS[a.status]?.cls
                                }`}
                              >
                                {STATUS[a.status]?.label}
                              </span>
                            </div>

                            {/* Detalle Servicio */}
                            <div className="mt-4 flex-1 space-y-3.5">
                              {/* Fecha/Hora */}
                              <div className="flex gap-5 text-sm text-ink-700">
                                <div>
                                  <span className="block text-xs text-ink-500 uppercase font-semibold">Fecha</span>
                                  <span className="font-semibold">{fmtDate(a.scheduledAt)}</span>
                                </div>
                                <div>
                                  <span className="block text-xs text-ink-500 uppercase font-semibold">Hora</span>
                                  <span className="font-semibold">{fmtTime(a.scheduledAt)}</span>
                                </div>
                              </div>

                              {/* Equipo */}
                              <div className="rounded-xl bg-brand-50 p-3.5 text-sm">
                                <div className="font-bold text-brand-800">
                                  {eq ? `${eq.brand} · ${eq.model}` : 'Aire acondicionado'}
                                </div>
                                {eq?.btuCapacity && (
                                  <div className="text-xs text-ink-700 mt-0.5">
                                    Capacidad: {eq.btuCapacity.toLocaleString()} BTU/h
                                  </div>
                                )}
                                <div className="mt-2 text-xs leading-relaxed text-ink-700">
                                  <span className="font-bold text-brand-900">Falla descrita:</span>{' '}
                                  {eq?.failureDescription || a.notes || 'Ninguna descrita'}
                                </div>
                              </div>
                            </div>

                            {/* Botones de acción */}
                            <div className="mt-5 flex items-center gap-3 border-t border-slate-50 pt-4">
                              {/* WhatsApp Directo */}
                              {wa && (
                                <a
                                  href={`https://wa.me/${wa}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  title="Contactar al cliente"
                                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors dark:bg-emerald-950/20 dark:text-emerald-400 dark:hover:bg-emerald-950/40 dark:ring-1 dark:ring-emerald-500/20"
                                >
                                  <MessageCircle size={20} />
                                </a>
                              )}

                              {/* Botón de Tomar Servicio */}
                              {!a.technicianId && (
                                <button
                                  onClick={() => claimJob(a.id)}
                                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-gradient py-2.5 font-bold text-white shadow-glow hover:shadow-glow-lg transition cursor-pointer"
                                >
                                  <ClipboardList size={16} /> Tomar servicio
                                </button>
                              )}

                              {/* Iniciar servicio (solo si ya está asignado al técnico actual) */}
                              {a.technicianId === user?.id && ['PENDING', 'ASSIGNED'].includes(a.status) && (
                                <button
                                  onClick={() => changeStatus(a.id, 'IN_PROGRESS')}
                                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-gradient py-2.5 font-bold text-white shadow-glow hover:shadow-glow-lg transition cursor-pointer"
                                >
                                  <Play size={16} fill="currentColor" /> Iniciar servicio
                                </button>
                              )}

                              {a.status === 'IN_PROGRESS' && (
                                <button
                                  onClick={() => changeStatus(a.id, 'COMPLETED')}
                                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 font-bold text-white hover:brightness-105 transition cursor-pointer"
                                >
                                  <CheckCircle2 size={16} /> Marcar como terminado
                                </button>
                              )}

                              {a.status === 'COMPLETED' && (
                                <div className="flex-1 text-center py-2 text-sm font-bold text-emerald-600 bg-emerald-50 rounded-xl dark:bg-emerald-950/20 dark:text-emerald-400 dark:ring-1 dark:ring-emerald-500/20">
                                  ✓ Servicio Completado
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
