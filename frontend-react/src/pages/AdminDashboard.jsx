import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardList, Users, LogOut, Globe, RefreshCw,
  ClipboardCheck, Clock3, Wrench, Loader2, Search, MessageCircle, Snowflake, CheckCircle2,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { STATUS, fmtDate, fmtTime } from '../lib/status';

const MES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

/* ---- Donut SVG ---- */
function Donut({ data, total }) {
  const R = 70, C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <div className="flex flex-wrap items-center gap-8">
      <svg viewBox="0 0 180 180" className="h-44 w-44 -rotate-90">
        <circle cx="90" cy="90" r={R} fill="none" stroke="#eef2f6" strokeWidth="22" />
        {data.map((d) => {
          if (d.value === 0) return null;
          const len = (d.value / total) * C;
          const seg = (
            <circle key={d.key} cx="90" cy="90" r={R} fill="none" stroke={d.color}
              strokeWidth="22" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset} />
          );
          offset += len;
          return seg;
        })}
        <text x="90" y="86" transform="rotate(90 90 90)" textAnchor="middle" className="fill-ink-900 font-display text-2xl font-extrabold">{total}</text>
        <text x="90" y="104" transform="rotate(90 90 90)" textAnchor="middle" className="fill-ink-500 text-[10px]">citas</text>
      </svg>
      <div className="space-y-2">
        {data.map((d) => (
          <div key={d.key} className="flex items-center gap-2 text-sm font-medium text-ink-700">
            <span className="h-3 w-3 rounded" style={{ background: d.color }} /> {d.label} ({d.value})
          </div>
        ))}
      </div>
    </div>
  );
}

function KPI({ icon: Icon, value, label, color, accent }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white p-5 ring-1 ring-slate-100 shadow-sm">
      <div className="absolute inset-x-0 top-0 h-1" style={{ background: accent }} />
      <div className={`grid h-11 w-11 place-items-center rounded-xl ${color}`}><Icon size={21} /></div>
      <div className="mt-4 font-display text-3xl font-extrabold text-ink-900">{value}</div>
      <div className="text-sm font-medium text-ink-500">{label}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState('dashboard');
  const [appts, setAppts] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [cq, setCq] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [a, c] = await Promise.all([api.getAllAppointments(), api.getClients()]);
      setAppts(a); setClients(c);
    } catch (err) {
      if (err.status === 401 || err.status === 403) { logout(); navigate('/login'); }
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const stats = useMemo(() => {
    const by = (s) => appts.filter((a) => a.status === s).length;
    return {
      total: appts.length,
      pending: by('PENDING'),
      progress: by('ASSIGNED') + by('IN_PROGRESS'),
      clients: clients.length,
    };
  }, [appts, clients]);

  const donut = useMemo(() => Object.entries(STATUS).map(([key, m]) => ({
    key, label: m.label, color: m.dot, value: appts.filter((a) => a.status === key).length,
  })), [appts]);

  const months = useMemo(() => {
    const now = new Date(), keys = [], labels = [];
    for (let i = 5; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); keys.push(`${d.getFullYear()}-${d.getMonth()}`); labels.push(MES[d.getMonth()]); }
    const counts = keys.map(() => 0);
    appts.forEach((a) => { const d = new Date(a.createdAt); const k = `${d.getFullYear()}-${d.getMonth()}`; const i = keys.indexOf(k); if (i >= 0) counts[i]++; });
    const max = Math.max(...counts, 1);
    return labels.map((l, i) => ({ l, v: counts[i], pct: (counts[i] / max) * 100 }));
  }, [appts]);

  const brands = useMemo(() => {
    const c = {};
    appts.forEach((a) => (a.equipment || []).forEach((e) => { c[e.brand] = (c[e.brand] || 0) + 1; }));
    const entries = Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const max = Math.max(...entries.map((e) => e[1]), 1);
    return entries.map(([brand, v]) => ({ brand, v, pct: (v / max) * 100 }));
  }, [appts]);

  async function changeStatus(id, status) {
    try {
      await api.updateStatus(id, status);
      setAppts((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    } catch (err) {
      if (err.status === 401 || err.status === 403) { logout(); navigate('/login'); }
    }
  }

  const filteredAppts = appts.filter((a) => {
    const name = `${a.client.firstName} ${a.client.lastName}`.toLowerCase();
    const okQ = name.includes(q.toLowerCase()) || a.client.email.toLowerCase().includes(q.toLowerCase());
    const okS = statusFilter === 'ALL' || a.status === statusFilter;
    return okQ && okS;
  });
  const filteredClients = clients.filter((c) =>
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(cq.toLowerCase()) || c.email.toLowerCase().includes(cq.toLowerCase()));

  const nav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'solicitudes', label: 'Solicitudes', icon: ClipboardList, badge: stats.pending },
    { id: 'clientes', label: 'Clientes', icon: Users, badge: stats.clients },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-brand-950 lg:flex">
        <div className="flex items-center gap-2.5 border-b border-white/10 px-6 py-5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient-bright text-white shadow-glow sheen"><Snowflake size={20} /></div>
          <div>
            <div className="font-display text-sm font-extrabold text-white leading-none">Fresh Service</div>
            <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-400">Panel Taller</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {nav.map((n) => (
            <button key={n.id} onClick={() => setView(n.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${view === n.id ? 'bg-white/10 text-white ring-1 ring-white/10' : 'text-brand-100/70 hover:bg-white/5 hover:text-white'}`}>
              <n.icon size={18} /> {n.label}
              {n.badge > 0 && <span className="ml-auto rounded-full bg-brand-500 px-2 py-0.5 text-xs font-bold text-white">{n.badge}</span>}
            </button>
          ))}
        </nav>
        <div className="space-y-2 border-t border-white/10 p-4">
          <Link to="/" className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-brand-100/70 transition hover:bg-white/5 hover:text-white"><Globe size={17} /> Ver sitio web</Link>
          <button onClick={() => { logout(); navigate('/'); }} className="flex w-full items-center gap-2 rounded-xl bg-rose-500/15 px-4 py-2.5 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/25"><LogOut size={17} /> Cerrar sesión</button>
          <div className="flex items-center gap-2.5 pt-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-gradient font-bold text-white">{user.firstName[0]}</div>
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-white">{user.firstName} {user.lastName}</div>
              <div className="text-xs text-brand-400">Taller · S.J. de los Morros</div>
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
              {view === 'dashboard' ? 'Panel de Control' : view === 'solicitudes' ? 'Gestión de Solicitudes' : 'Clientes del Taller'}
            </div>
            <div className="text-xs text-ink-500">Fresh Service Digital · Taller de Refrigeración</div>
          </div>
          <div className="flex items-center gap-3">
            {/* Mobile nav */}
            <select value={view} onChange={(e) => setView(e.target.value)} className="rounded-full border border-slate-200 px-3 py-1.5 text-sm lg:hidden">
              <option value="dashboard">Dashboard</option><option value="solicitudes">Solicitudes</option><option value="clientes">Clientes</option>
            </select>
            <button onClick={load} className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-sm font-bold text-brand-700 ring-1 ring-brand-100 transition hover:bg-brand-100">
              <RefreshCw size={15} /> <span className="hidden sm:inline">Actualizar</span>
            </button>
          </div>
        </header>

        <div className="p-5 lg:p-8">
          {loading ? (
            <div className="grid place-items-center py-32 text-brand-400"><Loader2 className="animate-spin" size={36} /></div>
          ) : view === 'dashboard' ? (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-extrabold text-ink-900">Resumen del Taller</h2>
                <p className="text-sm text-ink-500">Estadísticas en vivo desde la base de datos</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <KPI icon={ClipboardCheck} value={stats.total} label="Solicitudes registradas" color="bg-brand-100 text-brand-600" accent="#0ea5e9" />
                <KPI icon={Clock3} value={stats.pending} label="Pendientes de atender" color="bg-amber-100 text-amber-600" accent="#f59e0b" />
                <KPI icon={Wrench} value={stats.progress} label="En proceso" color="bg-violet-100 text-violet-600" accent="#8b5cf6" />
                <KPI icon={Users} value={stats.clients} label="Clientes registrados" color="bg-emerald-100 text-emerald-600" accent="#10b981" />
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-100 shadow-sm">
                  <h3 className="font-display font-bold text-ink-900">Citas por estado</h3>
                  <p className="mb-5 text-xs text-ink-500">Distribución del flujo de trabajo</p>
                  <Donut data={donut} total={stats.total || 1} />
                </div>
                <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-100 shadow-sm">
                  <h3 className="font-display font-bold text-ink-900">Citas por mes</h3>
                  <p className="mb-6 text-xs text-ink-500">Solicitudes recibidas (últimos 6 meses)</p>
                  <div className="flex h-44 items-end justify-between gap-3">
                    {months.map((m) => (
                      <div key={m.l} className="flex flex-1 flex-col items-center gap-2">
                        <div className="text-xs font-bold text-ink-700">{m.v || ''}</div>
                        <div className="flex w-full items-end" style={{ height: '120px' }}>
                          <div className="w-full rounded-t-lg bg-brand-gradient-bright transition-all" style={{ height: `${Math.max(m.pct, 3)}%` }} />
                        </div>
                        <div className="text-xs font-medium text-ink-500">{m.l}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-100 shadow-sm lg:col-span-2">
                  <h3 className="font-display font-bold text-ink-900">Marcas de equipos más atendidas</h3>
                  <p className="mb-5 text-xs text-ink-500">Ranking de marcas en servicio</p>
                  <div className="space-y-3">
                    {brands.map((b) => (
                      <div key={b.brand} className="flex items-center gap-3">
                        <div className="w-24 shrink-0 text-right text-sm font-semibold text-ink-700">{b.brand}</div>
                        <div className="h-5 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${b.pct}%` }} />
                        </div>
                        <div className="w-6 text-sm font-bold text-ink-900">{b.v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : view === 'solicitudes' ? (
            <div className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
                <div>
                  <h3 className="font-display font-bold text-ink-900">Solicitudes en vivo</h3>
                  <p className="text-xs text-ink-500">{filteredAppts.length} de {appts.length} solicitudes</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 ring-1 ring-slate-200">
                    <Search size={15} className="text-ink-500" />
                    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar cliente…" className="w-36 bg-transparent text-sm outline-none" />
                  </div>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-full bg-slate-50 px-3 py-1.5 text-sm ring-1 ring-slate-200 outline-none">
                    <option value="ALL">Todos</option>
                    {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-ink-500">
                    <tr><th className="px-5 py-3">Cliente</th><th className="px-3 py-3">Servicio</th><th className="px-3 py-3">Fecha</th><th className="px-3 py-3">Estado</th><th className="px-5 py-3"></th></tr>
                  </thead>
                  <tbody>
                    {filteredAppts.map((a) => {
                      const eq = a.equipment?.[0];
                      const wa = a.client.phone ? a.client.phone.replace(/\D/g, '') : '';
                      return (
                        <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-gradient text-xs font-bold text-white">
                                {(a.client.firstName[0] + a.client.lastName[0]).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-ink-900">{a.client.firstName} {a.client.lastName}</div>
                                <div className="text-xs text-ink-500">{a.client.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="font-medium text-ink-800">{eq ? `${eq.brand} · ${eq.model}` : '—'}</div>
                            <div className="max-w-[200px] truncate text-xs text-ink-500">{eq?.failureDescription || a.notes}</div>
                          </td>
                          <td className="px-3 py-3 text-ink-700">{fmtDate(a.scheduledAt)}<div className="text-xs text-ink-400">{fmtTime(a.scheduledAt)}</div></td>
                          <td className="px-3 py-3">
                            <select value={a.status} onChange={(e) => changeStatus(a.id, e.target.value)}
                              className={`rounded-full px-3 py-1 text-xs font-bold outline-none ${STATUS[a.status]?.cls}`}>
                              {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                            </select>
                          </td>
                          <td className="px-5 py-3">
                            {wa && <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100"><MessageCircle size={16} /></a>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
                <div>
                  <h3 className="font-display font-bold text-ink-900">Directorio de clientes</h3>
                  <p className="text-xs text-ink-500">{filteredClients.length} clientes registrados</p>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 ring-1 ring-slate-200">
                  <Search size={15} className="text-ink-500" />
                  <input value={cq} onChange={(e) => setCq(e.target.value)} placeholder="Buscar cliente…" className="w-40 bg-transparent text-sm outline-none" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-ink-500">
                    <tr><th className="px-5 py-3">Cliente</th><th className="px-3 py-3">Correo</th><th className="px-3 py-3">Teléfono</th><th className="px-3 py-3">Citas</th><th className="px-3 py-3">Cuenta</th><th className="px-5 py-3">Registrado</th></tr>
                  </thead>
                  <tbody>
                    {filteredClients.map((c) => {
                      const wa = c.phone ? c.phone.replace(/\D/g, '') : '';
                      return (
                        <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-violet-400 text-xs font-bold text-white">
                                {(c.firstName[0] + c.lastName[0]).toUpperCase()}
                              </div>
                              <span className="font-semibold text-ink-900">{c.firstName} {c.lastName}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-ink-700">{c.email}</td>
                          <td className="px-3 py-3">
                            {wa ? <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-medium text-brand-700">{c.phone} <MessageCircle size={13} /></a> : 'N/A'}
                          </td>
                          <td className="px-3 py-3"><span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-700 ring-1 ring-brand-100">{c._count?.appointments ?? 0}</span></td>
                          <td className="px-3 py-3">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${c.isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                              {c.isVerified ? <CheckCircle2 size={12} /> : null} {c.isVerified ? 'Verificado' : 'Pendiente'}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-ink-500">{fmtDate(c.createdAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
