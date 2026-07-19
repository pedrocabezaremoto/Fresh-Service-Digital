import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardList, Users, LogOut, Globe, RefreshCw,
  ClipboardCheck, Clock3, Wrench, Loader2, Search, MessageCircle, CheckCircle2,
  ArrowRight, Download, Sparkles,
  TrendingUp, Calendar, Pencil, Trash2, X, Sun, Moon,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useRate } from '../context/RateContext';
import { priceUsd } from '../lib/prices';
import { formatBs, formatUsd } from '../lib/money';
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

function KPI({ icon: Icon, value, label, color, accent, onClick }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      style={{ background: `linear-gradient(135deg, ${accent}22, #ffffff 62%)` }}
      className={`group relative w-full overflow-hidden rounded-2xl p-5 text-left shadow-sm ring-1 ring-white/60 backdrop-blur transition duration-300 ${onClick ? 'cursor-pointer hover:-translate-y-1 hover:shadow-glow-lg hover:ring-brand-200' : ''}`}
    >
      <div className="absolute inset-x-0 top-0 h-1" style={{ background: accent }} />
      {/* marca de agua translúcida */}
      <Icon size={104} className="pointer-events-none absolute -bottom-5 -right-4 opacity-[0.08] transition duration-300 group-hover:scale-110 group-hover:opacity-[0.12]" style={{ color: accent }} />
      <div className="relative">
        <div className={`grid h-11 w-11 place-items-center rounded-xl ${color} shadow-sm ring-1 ring-white/40`}><Icon size={21} /></div>
        <div className="mt-4 font-display text-3xl font-extrabold text-ink-900">{value}</div>
        <div className="text-sm font-medium text-ink-500">{label}</div>
        {onClick && (
          <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-brand-600 opacity-0 transition group-hover:opacity-100">
            Ver <ArrowRight size={12} />
          </span>
        )}
      </div>
    </Tag>
  );
}

/* Filtro compacto para meter DENTRO del encabezado de la tabla (fila de filtros) */
function ColFilter({ id, value, onChange, options, align }) {
  return (
    <div className={`flex items-center gap-1.5 rounded-lg bg-white px-2 py-1.5 ring-1 ring-slate-200 transition focus-within:ring-brand-400 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
      <Search size={12} className="shrink-0 text-ink-400" />
      <input list={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder="Filtrar…"
        className={`w-full min-w-0 bg-transparent text-xs font-normal normal-case tracking-normal text-ink-800 outline-none ${align === 'right' ? 'text-right' : ''}`} />
      {value && <button type="button" onClick={() => onChange('')} className="shrink-0 text-ink-400 hover:text-ink-700"><X size={12} /></button>}
      <datalist id={id}>{options.map((o) => <option key={o} value={o} />)}</datalist>
    </div>
  );
}

/* Filtro inteligente por columna: escribir (búsqueda) + elegir del desplegable (datalist) */
function FilterInput({ label, value, onChange, options, placeholder }) {
  const id = `flt-${label}`;
  return (
    <div>
      <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-ink-400">{label}</span>
      <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200 transition focus-within:bg-white focus-within:ring-brand-400">
        <Search size={14} className="shrink-0 text-ink-400" />
        <input list={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-transparent text-sm outline-none" />
        {value && <button type="button" onClick={() => onChange('')} className="shrink-0 text-ink-400 hover:text-ink-700"><X size={14} /></button>}
        <datalist id={id}>{options.map((o) => <option key={o} value={o} />)}</datalist>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const { rate } = useRate();
  const { toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const [view, setView] = useState('dashboard');
  const [appts, setAppts] = useState([]);
  const [clients, setClients] = useState([]);
  const [techs, setTechs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');            // filtro Cliente
  const [fServicio, setFServicio] = useState(''); // filtro Servicio
  const [fFecha, setFFecha] = useState('');       // filtro Fecha
  const [fEstado, setFEstado] = useState('');     // filtro Estado
  // Filtros de Clientes
  const [fcNombre, setFcNombre] = useState('');
  const [fcCorreo, setFcCorreo] = useState('');
  const [fcTel, setFcTel] = useState('');
  const [fcReg, setFcReg] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null); // cliente a eliminar (modal)
  const [deleting, setDeleting] = useState(false);
  // Ingresos: período activo (día/semana/mes/año o null=todos) + filtros de columna
  const [ingPeriodo, setIngPeriodo] = useState(null);
  const [fiFecha, setFiFecha] = useState('');
  const [fiCliente, setFiCliente] = useState('');
  const [fiServicio, setFiServicio] = useState('');
  const [fiTecnico, setFiTecnico] = useState('');
  const [fiMonto, setFiMonto] = useState('');
  const [editUser, setEditUser] = useState(null); // cliente en edición (null = cerrado)
  const [savingUser, setSavingUser] = useState(false);
  const [userMsg, setUserMsg] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [a, c, t] = await Promise.all([
        api.getAllAppointments(),
        api.getClients(),
        api.getTechnicians()
      ]);
      setAppts(a);
      setClients(c);
      setTechs(t || []);
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

  async function handleAssign(id, technicianId) {
    try {
      const updated = await api.assignTechnician(id, technicianId);
      setAppts((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                technicianId,
                technician: techs.find((t) => t.id === technicianId) || null,
                status: updated.status,
              }
            : a
        )
      );
    } catch (err) {
      if (err.status === 401 || err.status === 403) { logout(); navigate('/login'); }
    }
  }

  // Texto "servicio" y "estado" de una cita (para filtrar)
  const servTxt = (a) => { const e = a.equipment?.[0]; return e ? `${e.brand} · ${e.model}` : (a.notes || ''); };
  const estadoTxt = (a) => STATUS[a.status]?.label || a.status;

  const filteredAppts = appts.filter((a) => {
    const cli = `${a.client.firstName} ${a.client.lastName} ${a.client.email}`.toLowerCase();
    return (
      (!q || cli.includes(q.toLowerCase())) &&
      (!fServicio || servTxt(a).toLowerCase().includes(fServicio.toLowerCase())) &&
      (!fFecha || fmtDate(a.scheduledAt).toLowerCase().includes(fFecha.toLowerCase())) &&
      (!fEstado || estadoTxt(a).toLowerCase().includes(fEstado.toLowerCase()))
    );
  });
  // Orden por defecto: más reciente primero
  const sortedAppts = [...filteredAppts].sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt));

  // Opciones para los desplegables (datalist) de cada filtro
  const uniq = (arr) => [...new Set(arr.filter(Boolean))];
  const optClientes = uniq(appts.map((a) => `${a.client.firstName} ${a.client.lastName}`));
  const optServicios = uniq(appts.map(servTxt));
  const optFechas = uniq(appts.map((a) => fmtDate(a.scheduledAt)));
  const optEstados = uniq(appts.map(estadoTxt));
  const hayFiltros = q || fServicio || fFecha || fEstado;
  const limpiarFiltros = () => { setQ(''); setFServicio(''); setFFecha(''); setFEstado(''); };

  // Sugerir técnico según el tipo de aire (ventana/split/toneladas)
  function suggestTech(a) {
    const eq = a.equipment?.[0];
    const text = `${eq?.brand || ''} ${eq?.model || ''} ${a.notes || ''}`.toLowerCase();
    const key = text.includes('ventana') ? 'ventana'
      : text.includes('split') ? 'split'
      : (text.includes('tonelada') || text.includes('toneladas')) ? 'tonelada'
      : null;
    if (!key) return null;
    return techs.find((t) => `${t.firstName} ${t.lastName}`.toLowerCase().includes(key)) || null;
  }

  // Ir a la lista de solicitudes con un filtro de estado puesto (desde las tarjetas del dashboard)
  function goToSolicitudes(filter) {
    limpiarFiltros();
    if (filter === 'PENDING') setFEstado('Pendiente');
    else if (filter === 'PROGRESS') setFEstado('proceso');
    setView('solicitudes');
  }

  // Exportar reporte real de solicitudes (CSV, abre en Excel)
  function exportReport() {
    if (!appts.length) return;
    const cols = ['Referencia', 'Cliente', 'Email', 'Teléfono', 'Servicio', 'Fecha', 'Hora', 'Técnico', 'Estado'];
    const rows = appts.map((a) => {
      const eq = a.equipment?.[0];
      return [
        a.id.substring(0, 8).toUpperCase(),
        `${a.client.firstName} ${a.client.lastName}`,
        a.client.email,
        a.client.phone || '',
        eq ? `${eq.brand} ${eq.model}` : (a.notes || ''),
        fmtDate(a.scheduledAt),
        fmtTime(a.scheduledAt),
        a.technician ? `${a.technician.firstName} ${a.technician.lastName}` : 'Sin asignar',
        STATUS[a.status]?.label || a.status,
      ];
    });
    const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [cols, ...rows].map((r) => r.map(esc).join(',')).join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte-solicitudes-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
  const filteredClients = clients.filter((c) => {
    const nombre = `${c.firstName} ${c.lastName}`.toLowerCase();
    return (
      (!fcNombre || nombre.includes(fcNombre.toLowerCase())) &&
      (!fcCorreo || (c.email || '').toLowerCase().includes(fcCorreo.toLowerCase())) &&
      (!fcTel || (c.phone || '').toLowerCase().includes(fcTel.toLowerCase())) &&
      (!fcReg || fmtDate(c.createdAt).toLowerCase().includes(fcReg.toLowerCase()))
    );
  });
  const optCNombre = uniq(clients.map((c) => `${c.firstName} ${c.lastName}`));
  const optCCorreo = uniq(clients.map((c) => c.email));
  const optCTel = uniq(clients.map((c) => c.phone));
  const optCReg = uniq(clients.map((c) => fmtDate(c.createdAt)));
  const hayFiltrosC = fcNombre || fcCorreo || fcTel || fcReg;
  const limpiarFiltrosC = () => { setFcNombre(''); setFcCorreo(''); setFcTel(''); setFcReg(''); };

  // ---- Gestión de usuarios (editar / eliminar) ----
  function openEdit(c) {
    setUserMsg('');
    setEditUser({ id: c.id, firstName: c.firstName, lastName: c.lastName, email: c.email, phone: c.phone || '', role: c.role, password: '' });
  }
  async function saveUser(e) {
    e.preventDefault();
    setSavingUser(true);
    setUserMsg('');
    try {
      const { id, password, ...rest } = editUser;
      const payload = { ...rest };
      if (password) payload.password = password;
      const updated = await api.updateUser(id, payload);
      setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
      setEditUser(null);
    } catch (err) {
      setUserMsg(err.message || 'No se pudo guardar');
    } finally {
      setSavingUser(false);
    }
  }
  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteUser(deleteTarget.id);
      setClients((prev) => prev.filter((x) => x.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      alert(err.message || 'No se pudo eliminar');
    } finally {
      setDeleting(false);
    }
  }

  // ---- Ingresos: servicios COMPLETADOS (ganancias reales) ----
  const priceOf = (a) => a.priceUsd ?? priceUsd(a.equipment?.[0]?.brand, a.equipment?.[0]?.model);
  const techName = (a) => {
    const t = a.technician || techs.find((x) => x.id === a.technicianId);
    return t ? `${t.firstName} ${t.lastName}` : 'Sin asignar';
  };
  const inPeriod = (d, period) => {
    const dt = new Date(d), now = new Date();
    if (period === 'day') return dt.toDateString() === now.toDateString();
    if (period === 'week') {
      const start = new Date(now); start.setDate(now.getDate() - now.getDay()); start.setHours(0, 0, 0, 0);
      return dt >= start;
    }
    if (period === 'month') return dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth();
    if (period === 'year') return dt.getFullYear() === now.getFullYear();
    return true;
  };
  const completedAppts = appts.filter((a) => a.status === 'COMPLETED');
  const earnings = (period) =>
    completedAppts.filter((a) => inPeriod(a.scheduledAt, period)).reduce((s, a) => s + priceOf(a), 0);
  const money = (usd) => formatBs(usd, rate) || formatUsd(usd);

  // Tabla de servicios completados: filtrada por período (calendario) + filtros de columna
  const completedFiltered = completedAppts.filter((a) => {
    if (ingPeriodo && !inPeriod(a.scheduledAt, ingPeriodo)) return false;
    const cli = `${a.client.firstName} ${a.client.lastName} ${a.client.email}`.toLowerCase();
    return (
      (!fiFecha || fmtDate(a.scheduledAt).toLowerCase().includes(fiFecha.toLowerCase())) &&
      (!fiCliente || cli.includes(fiCliente.toLowerCase())) &&
      (!fiServicio || servTxt(a).toLowerCase().includes(fiServicio.toLowerCase())) &&
      (!fiTecnico || techName(a).toLowerCase().includes(fiTecnico.toLowerCase())) &&
      (!fiMonto || formatUsd(priceOf(a)).toLowerCase().includes(fiMonto.toLowerCase()) || money(priceOf(a)).toLowerCase().includes(fiMonto.toLowerCase()))
    );
  });
  const optIFecha = uniq(completedAppts.map((a) => fmtDate(a.scheduledAt)));
  const optICliente = uniq(completedAppts.map((a) => `${a.client.firstName} ${a.client.lastName}`));
  const optIServicio = uniq(completedAppts.map(servTxt));
  const optITecnico = uniq(completedAppts.map(techName));
  const optIMonto = uniq(completedAppts.map((a) => formatUsd(priceOf(a))));
  const hayFiltrosI = fiFecha || fiCliente || fiServicio || fiTecnico || fiMonto || ingPeriodo;
  const limpiarFiltrosI = () => { setFiFecha(''); setFiCliente(''); setFiServicio(''); setFiTecnico(''); setFiMonto(''); setIngPeriodo(null); };

  function exportEarnings(period) {
    const label = { day: 'diario', week: 'semanal', month: 'mensual', year: 'anual' }[period];
    const list = completedAppts.filter((a) => inPeriod(a.scheduledAt, period));
    const cols = ['Fecha', 'Cliente', 'Servicio', 'Técnico', 'Precio USD', 'Precio Bs'];
    const rows = list.map((a) => {
      const eq = a.equipment?.[0];
      const usd = priceOf(a);
      return [fmtDate(a.scheduledAt), `${a.client.firstName} ${a.client.lastName}`,
        eq ? `${eq.brand} ${eq.model}` : '', techName(a), usd, rate ? (usd * rate).toFixed(2) : ''];
    });
    const totalUsd = rows.reduce((s, r) => s + r[4], 0);
    const totalRow = ['TOTAL', '', '', '', totalUsd, rate ? (totalUsd * rate).toFixed(2) : ''];
    const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [cols, ...rows, [], totalRow].map((r) => r.map(esc).join(',')).join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ingresos-${label}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const nav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'solicitudes', label: 'Solicitudes', icon: ClipboardList, badge: stats.pending },
    { id: 'ingresos', label: 'Ingresos', icon: TrendingUp },
    { id: 'clientes', label: 'Clientes', icon: Users, badge: stats.clients },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-brand-950 lg:flex">
        <div className="flex items-center gap-2.5 border-b border-white/10 px-6 py-5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white p-1 shadow-sm"><img src="/logo.png" alt="Fresh Service" className="h-full w-full object-contain" /></span>
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
          <Link to="/" target="_blank" className="flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold text-white ring-1 ring-white/15 transition hover:bg-white/20 hover:ring-white/30"><Globe size={16} /> Ver sitio web</Link>
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
              {view === 'dashboard' ? 'Panel de Control' : view === 'solicitudes' ? 'Gestión de Solicitudes' : view === 'ingresos' ? 'Control de Servicios Realizados' : 'Clientes del Taller'}
            </div>
            <div className="text-xs text-ink-500">Fresh Service Digital · Taller de Refrigeración</div>
          </div>
          <div className="flex items-center gap-3">
            {/* Mobile nav */}
            <select value={view} onChange={(e) => setView(e.target.value)} className="rounded-full border border-slate-200 px-3 py-1.5 text-sm lg:hidden">
              <option value="dashboard">Dashboard</option><option value="solicitudes">Solicitudes</option><option value="ingresos">Ingresos</option><option value="clientes">Clientes</option>
            </select>
            <button onClick={toggleTheme} title="Cambiar tema" className="grid h-9 w-9 place-items-center rounded-full text-ink-600 ring-1 ring-slate-200 transition hover:bg-slate-100">
              {isDark ? <Sun size={17} className="text-amber-500" /> : <Moon size={17} className="text-brand-700" />}
            </button>
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
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl font-extrabold text-ink-900">Resumen del Taller</h2>
                  <p className="text-sm text-ink-500">Estadísticas en vivo desde la base de datos</p>
                </div>
                <button onClick={exportReport} disabled={!appts.length}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 ring-1 ring-emerald-200 transition hover:bg-emerald-100 disabled:opacity-50">
                  <Download size={15} /> Exportar Excel
                </button>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <KPI icon={ClipboardCheck} value={stats.total} label="Solicitudes registradas" color="bg-brand-100 text-brand-600" accent="#0ea5e9" onClick={() => goToSolicitudes('ALL')} />
                <KPI icon={Clock3} value={stats.pending} label="Pendientes de atender" color="bg-amber-100 text-amber-600" accent="#f59e0b" onClick={() => goToSolicitudes('PENDING')} />
                <KPI icon={Wrench} value={stats.progress} label="En proceso" color="bg-violet-100 text-violet-600" accent="#8b5cf6" onClick={() => goToSolicitudes('PROGRESS')} />
                <KPI icon={Users} value={stats.clients} label="Clientes registrados" color="bg-emerald-100 text-emerald-600" accent="#10b981" onClick={() => setView('clientes')} />
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
                      <div key={m.l} className="group flex flex-1 flex-col items-center gap-2">
                        <div className="text-xs font-bold text-brand-700 opacity-70 transition group-hover:opacity-100">{m.v || ''}</div>
                        <div className="flex w-full items-end" style={{ height: '120px' }}>
                          <div
                            className="w-full rounded-t-lg shadow-[inset_0_2px_4px_rgba(255,255,255,0.45),0_6px_14px_-3px_rgba(2,132,199,0.5)] ring-1 ring-inset ring-white/25 transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:brightness-110"
                            style={{
                              height: `${Math.max(m.pct, 3)}%`,
                              background: 'linear-gradient(180deg, #7dd3fc 0%, #0ea5e9 55%, #0284c7 100%)',
                            }}
                          />
                        </div>
                        <div className="text-xs font-medium text-ink-500 transition group-hover:font-bold group-hover:text-brand-700">{m.l}</div>
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
              <div className="border-b border-slate-100 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-bold text-ink-900">Solicitudes en vivo</h3>
                    <p className="text-xs text-ink-500">{sortedAppts.length} de {appts.length} solicitudes</p>
                  </div>
                  {hayFiltros && (
                    <button onClick={limpiarFiltros} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-ink-600 transition hover:bg-slate-200">
                      <X size={13} /> Limpiar filtros
                    </button>
                  )}
                </div>
                {/* Filtros inteligentes por columna (escribir o elegir del desplegable) */}
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <FilterInput label="Cliente" value={q} onChange={setQ} options={optClientes} placeholder="Nombre o correo…" />
                  <FilterInput label="Servicio" value={fServicio} onChange={setFServicio} options={optServicios} placeholder="Tipo de servicio…" />
                  <FilterInput label="Fecha" value={fFecha} onChange={setFFecha} options={optFechas} placeholder="Fecha…" />
                  <FilterInput label="Estado" value={fEstado} onChange={setFEstado} options={optEstados} placeholder="Estado…" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-ink-500">
                    <tr>
                      <th className="px-5 py-3">Cliente</th>
                      <th className="px-3 py-3">Servicio</th>
                      <th className="px-3 py-3">Fecha</th>
                      <th className="px-3 py-3">Técnico</th>
                      <th className="px-3 py-3">Estado</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAppts.map((a) => {
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
                            <select
                              value={a.technicianId || ''}
                              onChange={(e) => handleAssign(a.id, e.target.value || null)}
                              className="rounded-xl border border-slate-200 px-2 py-1 text-xs outline-none bg-slate-50 text-ink-700 font-semibold focus:ring-1 focus:ring-brand-400"
                            >
                              <option value="">Sin asignar</option>
                              {techs.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.firstName} {t.lastName}
                                </option>
                              ))}
                            </select>
                            {!a.technicianId && (() => {
                              const sug = suggestTech(a);
                              return sug ? (
                                <button onClick={() => handleAssign(a.id, sug.id)}
                                  title={`Asignar a ${sug.firstName} ${sug.lastName}`}
                                  className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-brand-600 transition hover:text-brand-700">
                                  <Sparkles size={11} /> Sugerido: {sug.firstName}
                                </button>
                              ) : null;
                            })()}
                          </td>
                          <td className="px-3 py-3">
                            <select value={a.status} onChange={(e) => changeStatus(a.id, e.target.value)}
                              className={`rounded-full px-3 py-1 text-xs font-bold outline-none ${STATUS[a.status]?.cls}`}>
                              {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                            </select>
                          </td>
                          <td className="px-5 py-3">
                            {wa && <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:hover:bg-emerald-950/40 dark:ring-1 dark:ring-emerald-500/20"><MessageCircle size={16} /></a>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : view === 'ingresos' ? (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-extrabold text-ink-900">Control de Servicios Realizados</h2>
                <p className="text-sm text-ink-500">Ingresos por servicios completados · {completedAppts.length} servicios</p>
              </div>

              {/* Tarjetas por período — CLICK filtra la tabla; el botón CSV descarga */}
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { p: 'day', label: 'Hoy', accent: '#0ea5e9', icon: Calendar },
                  { p: 'week', label: 'Esta semana', accent: '#8b5cf6', icon: Calendar },
                  { p: 'month', label: 'Este mes', accent: '#f59e0b', icon: Calendar },
                  { p: 'year', label: 'Este año', accent: '#10b981', icon: TrendingUp },
                ].map(({ p, label, accent, icon: Icon }) => {
                  const active = ingPeriodo === p;
                  return (
                    <button key={p} type="button" onClick={() => setIngPeriodo(active ? null : p)}
                      title="Filtrar la tabla por este período"
                      style={{ background: `linear-gradient(135deg, ${accent}22, #ffffff 62%)` }}
                      className={`group relative overflow-hidden rounded-2xl p-5 text-left shadow-sm transition ${active ? 'shadow-glow ring-2 ring-brand-500' : 'ring-1 ring-white/60 hover:-translate-y-0.5 hover:shadow-glow-lg'}`}>
                      <div className="absolute inset-x-0 top-0 h-1" style={{ background: accent }} />
                      <Icon size={104} className="pointer-events-none absolute -bottom-5 -right-4 opacity-[0.08]" style={{ color: accent }} />
                      <div className="relative">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wide text-ink-500">{label}</span>
                          <Icon size={16} style={{ color: accent }} />
                        </div>
                        <div className="mt-3 font-display text-2xl font-extrabold text-ink-900">{money(earnings(p))}</div>
                        <div className="text-xs text-ink-400">Ref. {formatUsd(earnings(p))}</div>
                        <span onClick={(e) => { e.stopPropagation(); exportEarnings(p); }}
                          className="mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200 transition hover:bg-emerald-100">
                          <Download size={13} /> CSV
                        </span>
                        {active && <span className="mt-2 block text-[11px] font-bold text-brand-600">● Filtrando la tabla ↓ (clic para quitar)</span>}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Tabla de servicios completados con filtros por columna */}
              <div className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm">
                <div className="border-b border-slate-100 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="font-display font-bold text-ink-900">Servicios completados</h3>
                      <p className="text-xs text-ink-500">{completedFiltered.length} de {completedAppts.length}{ingPeriodo ? ' · período seleccionado' : ''}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {hayFiltrosI && (
                        <button onClick={limpiarFiltrosI} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-ink-600 transition hover:bg-slate-200"><X size={13} /> Limpiar</button>
                      )}
                      <span className="text-xs text-ink-500">Total: <strong className="text-ink-900">{money(completedFiltered.reduce((s, a) => s + priceOf(a), 0))}</strong></span>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-ink-500">
                      <tr>
                        <th className="px-5 pt-3">Fecha</th>
                        <th className="px-3 pt-3">Cliente</th>
                        <th className="px-3 pt-3">Servicio</th>
                        <th className="px-3 pt-3">Técnico</th>
                        <th className="px-5 pt-3 text-right">Monto</th>
                      </tr>
                      <tr>
                        <th className="px-5 pb-3 pt-2 font-normal"><ColFilter id="if-fecha" value={fiFecha} onChange={setFiFecha} options={optIFecha} /></th>
                        <th className="px-3 pb-3 pt-2 font-normal"><ColFilter id="if-cli" value={fiCliente} onChange={setFiCliente} options={optICliente} /></th>
                        <th className="px-3 pb-3 pt-2 font-normal"><ColFilter id="if-serv" value={fiServicio} onChange={setFiServicio} options={optIServicio} /></th>
                        <th className="px-3 pb-3 pt-2 font-normal"><ColFilter id="if-tec" value={fiTecnico} onChange={setFiTecnico} options={optITecnico} /></th>
                        <th className="px-5 pb-3 pt-2 font-normal"><ColFilter id="if-monto" value={fiMonto} onChange={setFiMonto} options={optIMonto} align="right" /></th>
                      </tr>
                    </thead>
                    <tbody>
                      {completedFiltered.length === 0 ? (
                        <tr><td colSpan={5} className="px-5 py-10 text-center text-ink-500">No hay servicios completados con esos filtros.</td></tr>
                      ) : (
                        [...completedFiltered].sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt)).map((a) => {
                          const eq = a.equipment?.[0];
                          return (
                            <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                              <td className="px-5 py-3 text-ink-700">{fmtDate(a.scheduledAt)}</td>
                              <td className="px-3 py-3 font-medium text-ink-900">{a.client.firstName} {a.client.lastName}</td>
                              <td className="px-3 py-3 text-ink-700">{eq ? `${eq.brand} · ${eq.model}` : '—'}</td>
                              <td className="px-3 py-3 text-ink-600">{techName(a)}</td>
                              <td className="px-5 py-3 text-right"><div className="font-semibold text-ink-900">{money(priceOf(a))}</div><div className="text-[11px] text-ink-400">Ref. {formatUsd(priceOf(a))}</div></td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm">
              <div className="border-b border-slate-100 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-bold text-ink-900">Directorio de clientes</h3>
                    <p className="text-xs text-ink-500">{filteredClients.length} clientes registrados</p>
                  </div>
                  {hayFiltrosC && (
                    <button onClick={limpiarFiltrosC} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-ink-600 transition hover:bg-slate-200">
                      <X size={13} /> Limpiar filtros
                    </button>
                  )}
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <FilterInput label="Cliente" value={fcNombre} onChange={setFcNombre} options={optCNombre} placeholder="Nombre…" />
                  <FilterInput label="Correo" value={fcCorreo} onChange={setFcCorreo} options={optCCorreo} placeholder="Correo…" />
                  <FilterInput label="Teléfono" value={fcTel} onChange={setFcTel} options={optCTel} placeholder="Teléfono…" />
                  <FilterInput label="Registrado" value={fcReg} onChange={setFcReg} options={optCReg} placeholder="Fecha…" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-ink-500">
                    <tr><th className="px-5 py-3">Cliente</th><th className="px-3 py-3">Correo</th><th className="px-3 py-3">Teléfono</th><th className="px-3 py-3">Citas</th><th className="px-3 py-3">Cuenta</th><th className="px-3 py-3">Registrado</th><th className="px-5 py-3 text-right">Acciones</th></tr>
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
                          <td className="px-3 py-3 text-ink-500">{fmtDate(c.createdAt)}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-end gap-1.5">
                              <button onClick={() => openEdit(c)} title="Editar"
                                className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-600 transition hover:bg-brand-100"><Pencil size={15} /></button>
                              <button onClick={() => setDeleteTarget(c)} title="Eliminar"
                                className="grid h-8 w-8 place-items-center rounded-lg bg-rose-50 text-rose-600 transition hover:bg-rose-100"><Trash2 size={15} /></button>
                            </div>
                          </td>
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

      {/* Modal de edición de usuario */}
      {editUser && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink-900/50 p-4" onClick={() => setEditUser(null)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={saveUser}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-ink-900">Editar usuario</h3>
              <button type="button" onClick={() => setEditUser(null)} className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-slate-100"><X size={18} /></button>
            </div>
            {userMsg && <div className="mt-3 rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700 ring-1 ring-rose-100">{userMsg}</div>}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="block"><span className="mb-1 block text-xs font-bold uppercase text-ink-500">Nombre</span>
                <input required value={editUser.firstName} onChange={(e) => setEditUser({ ...editUser, firstName: e.target.value })} className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400" /></label>
              <label className="block"><span className="mb-1 block text-xs font-bold uppercase text-ink-500">Apellido</span>
                <input required value={editUser.lastName} onChange={(e) => setEditUser({ ...editUser, lastName: e.target.value })} className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400" /></label>
            </div>
            <label className="mt-3 block"><span className="mb-1 block text-xs font-bold uppercase text-ink-500">Correo</span>
              <input required type="email" value={editUser.email} onChange={(e) => setEditUser({ ...editUser, email: e.target.value })} className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400" /></label>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="block"><span className="mb-1 block text-xs font-bold uppercase text-ink-500">Teléfono</span>
                <input value={editUser.phone} onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })} placeholder="+58 412-0000000" className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400" /></label>
              <label className="block"><span className="mb-1 block text-xs font-bold uppercase text-ink-500">Rol</span>
                <select value={editUser.role} onChange={(e) => setEditUser({ ...editUser, role: e.target.value })} className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400">
                  <option value="CLIENT">Cliente</option><option value="TECHNICIAN">Técnico</option><option value="ADMIN">Admin</option>
                </select></label>
            </div>
            <label className="mt-3 block"><span className="mb-1 block text-xs font-bold uppercase text-ink-500">Nueva contraseña <span className="font-normal normal-case text-ink-400">(opcional)</span></span>
              <input type="text" value={editUser.password} onChange={(e) => setEditUser({ ...editUser, password: e.target.value })} placeholder="Dejar vacío para no cambiarla" className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400" /></label>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setEditUser(null)} className="rounded-full px-4 py-2 text-sm font-semibold text-ink-600 hover:bg-slate-100">Cancelar</button>
              <button type="submit" disabled={savingUser} className="rounded-full bg-brand-gradient px-5 py-2 text-sm font-bold text-white shadow-glow transition hover:brightness-105 disabled:opacity-50">{savingUser ? 'Guardando…' : 'Guardar cambios'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink-900/50 p-4" onClick={() => !deleting && setDeleteTarget(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-rose-100 text-rose-600">
              <Trash2 size={26} />
            </div>
            <h3 className="mt-4 font-display text-lg font-bold text-ink-900">¿Eliminar este cliente?</h3>
            <p className="mt-2 text-sm text-ink-500">
              Vas a eliminar a <strong className="text-ink-900">{deleteTarget.firstName} {deleteTarget.lastName}</strong> ({deleteTarget.email}).
              {deleteTarget._count?.appointments > 0 && <> Se borrarán también sus <strong className="text-rose-600">{deleteTarget._count.appointments} solicitud(es)</strong>.</>}
              {' '}Esta acción no se puede deshacer.
            </p>
            <div className="mt-6 flex gap-2">
              <button onClick={() => setDeleteTarget(null)} disabled={deleting} className="flex-1 rounded-full bg-slate-100 px-4 py-2.5 text-sm font-bold text-ink-700 transition hover:bg-slate-200 disabled:opacity-50">Cancelar</button>
              <button onClick={confirmDelete} disabled={deleting} className="flex-1 rounded-full bg-rose-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-700 disabled:opacity-50">{deleting ? 'Eliminando…' : 'Sí, eliminar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
