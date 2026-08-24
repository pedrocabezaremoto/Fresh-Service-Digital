import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
  LayoutDashboard, ClipboardList, Users, LogOut, RefreshCw,
  ClipboardCheck, Clock3, Wrench, Loader2, Search, MessageCircle, CheckCircle2,
  Download, Sparkles, UserCog, Power, PowerOff,
  TrendingUp, Calendar, Pencil, Trash2, X, Sun, Moon, Settings, Settings2,
  ChevronLeft, ChevronRight, Bell,
} from 'lucide-react';
import { API_BASE, api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useRate } from '../context/RateContext';
import { priceUsd } from '../lib/prices';
import { formatBs, formatUsd } from '../lib/money';
import { STATUS, fmtDate, fmtTime } from '../lib/status';
import ServiceMap from '../components/maps/ServiceMap';
import SiteImagesSection from '../components/admin/SiteImagesSection';
import CarouselSection from '../components/admin/CarouselSection';
import AdminChatView from '../components/admin/AdminChatView';
import { Donut, KPI, MonthBars } from '../components/admin/DashboardVisuals';
import Price from '../components/Price';
import {
  CATEGORY_LABELS, CATEGORY_STYLE, EQUIPMENT_LABELS, EQUIPMENT_STYLE,
  SERVICE_CATEGORIES, EQUIPMENT_TYPES,
} from '../lib/services';

const MES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const SPECIALTIES = [
  'Aires de Ventana',
  'Aires Split',
  'Aires de 1 Tonelada',
  'Aires de 2 Toneladas',
  'Aires de 3 Toneladas',
  'General',
];

const SPECIALTY_STYLE = {
  'Aires de Ventana': 'bg-amber-100 text-amber-700 ring-amber-200',
  'Aires Split': 'bg-sky-100 text-sky-700 ring-sky-200',
  'Aires de 1 Tonelada': 'bg-violet-100 text-violet-700 ring-violet-200',
  'Aires de 2 Toneladas': 'bg-indigo-100 text-indigo-700 ring-indigo-200',
  'Aires de 3 Toneladas': 'bg-fuchsia-100 text-fuchsia-700 ring-fuchsia-200',
  General: 'bg-slate-100 text-slate-700 ring-slate-200',
};

const USERNAME_RE = /^[a-z0-9._]{4,30}$/;

const emptyTechForm = () => ({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  specialty: 'General',
  username: '',
});

const emptySvcForm = () => ({
  name: '',
  category: 'REPARACION',
  equipmentType: 'VENTANA',
  priceUsd: '',
  description: '',
  isActive: true,
});

/* Filtro compacto para meter DENTRO del encabezado de la tabla (fila de filtros) */
function ColFilter({ id, value, onChange, options, align }) {
  return (
    <div className={`flex items-center gap-1.5 rounded-lg bg-white px-2 py-1.5 ring-1 ring-slate-200 transition focus-within:ring-brand-400 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
      <Search size={12} className="shrink-0 text-ink-400" />
      <input list={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder="Filtrar…"
        className={`w-full min-w-0 bg-transparent text-xs font-normal normal-case tracking-normal text-ink-800 outline-none ${align === 'right' ? 'text-right' : ''}`} />
      {value && <button type="button" onClick={() => onChange('')} className="grid h-11 w-11 shrink-0 place-items-center text-ink-400 hover:text-ink-700 active:text-ink-700 touch-manipulation"><X size={12} /></button>}
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
        {value && <button type="button" onClick={() => onChange('')} className="grid h-11 w-11 shrink-0 place-items-center text-ink-400 hover:text-ink-700 active:text-ink-700 touch-manipulation"><X size={14} /></button>}
        <datalist id={id}>{options.map((o) => <option key={o} value={o} />)}</datalist>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, logout, token } = useAuth();
  const { rate } = useRate();
  const { toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const [view, setView] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('sidebar-collapsed') === 'true'; } catch { return false; }
  });

  function toggleSidebar() {
    setCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem('sidebar-collapsed', String(next)); } catch { /* ignore */ }
      return next;
    });
  }
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
  const [createTech, setCreateTech] = useState(null); // form nuevo técnico (null = cerrado)
  const [editTech, setEditTech] = useState(null);
  const [deleteTech, setDeleteTech] = useState(null);
  const [savingTech, setSavingTech] = useState(false);
  const [techMsg, setTechMsg] = useState('');
  const [techFlash, setTechFlash] = useState('');
  const [services, setServices] = useState([]);
  const [svcCategory, setSvcCategory] = useState('');
  const [svcEquipment, setSvcEquipment] = useState('');
  const [createSvc, setCreateSvc] = useState(null);
  const [editSvc, setEditSvc] = useState(null);
  const [deleteSvc, setDeleteSvc] = useState(null);
  const [savingSvc, setSavingSvc] = useState(false);
  const [svcMsg, setSvcMsg] = useState('');
  const [svcFlash, setSvcFlash] = useState('');
  const [deleteSvcError, setDeleteSvcError] = useState('');
  // Filtro del mapa de servicios (null = todos). Solo afecta el Dashboard.
  const [mapFilter, setMapFilter] = useState(null);
  // Altura del mapa: 280px en móvil (<640px), 400px en desktop
  const [mapHeight, setMapHeight] = useState(
    typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches
      ? '280px'
      : '400px',
  );
  const [unreadLeads, setUnreadLeads] = useState([]);
  const [showLeads, setShowLeads] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [a, c, t] = await Promise.all([
        api.getAllAppointments(),
        api.getClients(),
        api.getTechnicians(),
      ]);
      setAppts(a);
      setClients(c);
      setTechs(t || []);
      try {
        const s = await api.getAllServices();
        setServices(s || []);
      } catch {
        setServices([]);
      }
    } catch (err) {
      if (err.status === 401 || err.status === 403) { logout(); navigate('/login'); }
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  useEffect(() => {
    async function loadLeads() {
      try {
        const leads = await api.getUnreadLeads();
        setUnreadLeads(Array.isArray(leads) ? leads : []);
      } catch { setUnreadLeads([]); }
    }
    loadLeads();

    function pushLead(lead) {
      if (!lead?.id) return;
      setUnreadLeads(prev => prev.some(l => l.id === lead.id) ? prev : [lead, ...prev]);
    }
    function handleNewLead(e) {
      pushLead(e.detail);
    }
    window.addEventListener('copito-new-lead', handleNewLead);

    let socket;
    if (token) {
      socket = io(`${API_BASE}/live-chat`, {
        auth: { token },
        transports: ['websocket', 'polling'],
      });
      socket.on('newLead', pushLead);
    }

    return () => {
      window.removeEventListener('copito-new-lead', handleNewLead);
      socket?.disconnect();
    };
  }, [token]);

  async function markLeadRead(leadId) {
    try {
      await api.markLeadRead(leadId);
      setUnreadLeads(prev => prev.filter(l => l.id !== leadId));
    } catch { /* ignore */ }
  }

  useEffect(() => {
    if (!techFlash) return undefined;
    const timer = setTimeout(() => setTechFlash(''), 4000);
    return () => clearTimeout(timer);
  }, [techFlash]);

  useEffect(() => {
    if (!svcFlash) return undefined;
    const timer = setTimeout(() => setSvcFlash(''), 4000);
    return () => clearTimeout(timer);
  }, [svcFlash]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const apply = () => setMapHeight(mq.matches ? '280px' : '400px');
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

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
    const now = new Date(), keys = [], labels = [], years = [], monthIdx = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      keys.push(`${d.getFullYear()}-${d.getMonth()}`);
      labels.push(MES[d.getMonth()]);
      years.push(d.getFullYear());
      monthIdx.push(d.getMonth());
    }
    const counts = keys.map(() => 0);
    appts.forEach((a) => { const d = new Date(a.createdAt); const k = `${d.getFullYear()}-${d.getMonth()}`; const i = keys.indexOf(k); if (i >= 0) counts[i]++; });
    const max = Math.max(...counts, 1);
    return labels.map((l, i) => ({ l, v: counts[i], pct: (counts[i] / max) * 100, year: years[i], month: monthIdx[i] }));
  }, [appts]);

  const clientMonths = useMemo(() => {
    const now = new Date(), keys = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      keys.push(`${d.getFullYear()}-${d.getMonth()}`);
    }
    const counts = keys.map(() => 0);
    clients.forEach((c) => {
      if (!c.createdAt) return;
      const d = new Date(c.createdAt);
      const k = `${d.getFullYear()}-${d.getMonth()}`;
      const i = keys.indexOf(k);
      if (i >= 0) counts[i]++;
    });
    return counts;
  }, [clients]);

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
      else alert(err.message || 'No se pudo asignar el técnico');
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

  // Sugerir técnico activo según specialty (ya no se parsea lastName)
  function suggestTech(a) {
    const active = techs.filter((t) => t.isActive !== false);
    const eq = a.equipment?.[0];
    const text = `${eq?.brand || ''} ${eq?.model || ''} ${eq?.failureDescription || ''} ${a.notes || ''}`.toLowerCase();
    const spec = (t) => (t.specialty || '').toLowerCase();
    const by = (...keys) => active.find((t) => keys.some((k) => spec(t).includes(k)));
    if (text.includes('ventana')) return by('ventana') || null;
    if (text.includes('split')) return by('split') || null;
    if (text.includes('tonelada')) {
      if (text.includes('3')) return by('3 tonelada') || by('general') || null;
      if (text.includes('2')) return by('2 tonelada') || by('general') || null;
      if (text.includes('1')) return by('1 tonelada') || by('general') || null;
      return by('tonelada', 'general') || null;
    }
    return null;
  }

  // Ir a la lista de solicitudes con un filtro de estado puesto (desde las tarjetas del dashboard)
  function goToSolicitudes(filter) {
    limpiarFiltros();
    if (filter === 'PENDING') setFEstado('Pendiente');
    else if (filter === 'PROGRESS') setFEstado('proceso');
    setView('solicitudes');
  }

  /** Toggle filtro del mapa: mismo KPI otra vez → quita filtro (todos). */
  function toggleMapFilter(status) {
    if (status === null) {
      setMapFilter(null);
      return;
    }
    setMapFilter((prev) => (prev === status ? null : status));
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

  function openCreateTech() {
    setTechMsg('');
    setCreateTech(emptyTechForm());
  }
  function openEditTech(t) {
    setTechMsg('');
    setEditTech({
      id: t.id,
      firstName: t.firstName,
      lastName: t.lastName,
      email: t.email,
      phone: t.phone || '',
      password: '',
      specialty: t.specialty || 'General',
      username: t.username || '',
    });
  }
  async function saveNewTech(e) {
    e.preventDefault();
    if (!createTech.firstName.trim() || !createTech.email.trim() || !createTech.password) {
      setTechMsg('Nombre, correo y contraseña son obligatorios');
      return;
    }
    const uname = createTech.username.trim().toLowerCase();
    if (uname && !USERNAME_RE.test(uname)) {
      setTechMsg('El usuario solo puede tener letras minúsculas, números, puntos y guiones bajos (4 a 30 caracteres)');
      return;
    }
    setSavingTech(true);
    setTechMsg('');
    try {
      const payload = { ...createTech };
      if (uname) payload.username = uname;
      else delete payload.username;
      await api.createTechnician(payload);
      setCreateTech(null);
      setTechFlash('Técnico creado correctamente');
      await load();
    } catch (err) {
      setTechMsg(err.message || 'No se pudo crear el técnico');
    } finally {
      setSavingTech(false);
    }
  }
  async function saveEditTech(e) {
    e.preventDefault();
    setSavingTech(true);
    setTechMsg('');
    try {
      const { id, password, username, ...rest } = editTech;
      const payload = { ...rest };
      if (password) payload.password = password;
      const uname = (username || '').trim().toLowerCase();
      if (uname && !USERNAME_RE.test(uname)) {
        setTechMsg('El usuario solo puede tener letras minúsculas, números, puntos y guiones bajos (4 a 30 caracteres)');
        setSavingTech(false);
        return;
      }
      payload.username = uname;
      const updated = await api.updateUser(id, payload);
      setTechs((prev) => prev.map((t) => (t.id === id ? { ...t, ...updated } : t)));
      setEditTech(null);
      setTechFlash('Técnico actualizado');
    } catch (err) {
      setTechMsg(err.message || 'No se pudo guardar');
    } finally {
      setSavingTech(false);
    }
  }
  async function confirmDeleteTech() {
    if (!deleteTech) return;
    setDeleting(true);
    try {
      await api.deleteUser(deleteTech.id);
      setTechs((prev) => prev.filter((x) => x.id !== deleteTech.id));
      setAppts((prev) => prev.map((a) => (
        a.technicianId === deleteTech.id
          ? { ...a, technicianId: null, technician: null }
          : a
      )));
      setDeleteTech(null);
      setTechFlash('Técnico eliminado');
    } catch (err) {
      alert(err.message || 'No se pudo eliminar');
    } finally {
      setDeleting(false);
    }
  }
  async function toggleTechActive(t) {
    try {
      const updated = await api.updateUser(t.id, { isActive: !t.isActive });
      setTechs((prev) => prev.map((x) => (x.id === t.id ? { ...x, ...updated } : x)));
    } catch (err) {
      if (err.status === 401 || err.status === 403) { logout(); navigate('/login'); }
      else alert(err.message || 'No se pudo cambiar el estado');
    }
  }
  function techJobCount(t) {
    return t._count?.assignedServices ?? appts.filter((a) => a.technicianId === t.id).length;
  }
  function techActiveJobs(t) {
    return appts.filter((a) => a.technicianId === t.id && (a.status === 'ASSIGNED' || a.status === 'IN_PROGRESS')).length;
  }

  function svcApptCount(s) {
    return s._count?.appointments ?? appts.filter((a) => a.serviceId === s.id).length;
  }
  const activeSvcCount = services.filter((s) => s.isActive !== false).length;
  const filteredServices = services.filter((s) => (
    (!svcCategory || s.category === svcCategory) &&
    (!svcEquipment || s.equipmentType === svcEquipment)
  ));

  function openCreateSvc() {
    setSvcMsg('');
    setCreateSvc(emptySvcForm());
  }
  function openEditSvc(s) {
    setSvcMsg('');
    setEditSvc({
      id: s.id,
      name: s.name,
      category: s.category,
      equipmentType: s.equipmentType,
      priceUsd: String(s.priceUsd),
      description: s.description || '',
      isActive: s.isActive !== false,
    });
  }
  function validateSvcForm(form) {
    if (!form.name.trim()) return 'El nombre es obligatorio';
    if (!form.category) return 'La categoría es obligatoria';
    if (!form.equipmentType) return 'El tipo de equipo es obligatorio';
    const price = Number(form.priceUsd);
    if (!Number.isFinite(price) || price <= 0) return 'El precio debe ser mayor a 0';
    return '';
  }
  async function saveNewSvc(e) {
    e.preventDefault();
    const err = validateSvcForm(createSvc);
    if (err) { setSvcMsg(err); return; }
    setSavingSvc(true);
    setSvcMsg('');
    try {
      await api.createService({
        name: createSvc.name.trim(),
        category: createSvc.category,
        equipmentType: createSvc.equipmentType,
        priceUsd: Number(createSvc.priceUsd),
        description: createSvc.description.trim() || undefined,
      });
      setCreateSvc(null);
      setSvcFlash('Servicio creado correctamente');
      await load();
    } catch (err) {
      setSvcMsg(err.message || 'No se pudo crear el servicio');
    } finally {
      setSavingSvc(false);
    }
  }
  async function saveEditSvc(e) {
    e.preventDefault();
    const err = validateSvcForm(editSvc);
    if (err) { setSvcMsg(err); return; }
    setSavingSvc(true);
    setSvcMsg('');
    try {
      const updated = await api.updateService(editSvc.id, {
        name: editSvc.name.trim(),
        category: editSvc.category,
        equipmentType: editSvc.equipmentType,
        priceUsd: Number(editSvc.priceUsd),
        description: editSvc.description.trim() || null,
        isActive: editSvc.isActive,
      });
      setServices((prev) => prev.map((s) => (s.id === editSvc.id ? { ...s, ...updated } : s)));
      setEditSvc(null);
      setSvcFlash('Servicio actualizado');
    } catch (err) {
      setSvcMsg(err.message || 'No se pudo guardar');
    } finally {
      setSavingSvc(false);
    }
  }
  async function confirmDeleteSvc() {
    if (!deleteSvc) return;
    setDeleting(true);
    setDeleteSvcError('');
    try {
      await api.deleteService(deleteSvc.id);
      setServices((prev) => prev.filter((x) => x.id !== deleteSvc.id));
      setDeleteSvc(null);
      setSvcFlash('Servicio eliminado');
    } catch (err) {
      if (err.status === 409) {
        setDeleteSvcError(err.message || 'Este servicio tiene citas asociadas. Desactívalo en lugar de borrarlo.');
      } else {
        setDeleteSvcError(err.message || 'No se pudo eliminar');
      }
    } finally {
      setDeleting(false);
    }
  }
  async function deactivateFromDelete() {
    if (!deleteSvc) return;
    setDeleting(true);
    try {
      const updated = await api.updateService(deleteSvc.id, { isActive: false });
      setServices((prev) => prev.map((s) => (s.id === deleteSvc.id ? { ...s, ...updated } : s)));
      setDeleteSvc(null);
      setDeleteSvcError('');
      setSvcFlash('Servicio desactivado');
    } catch (err) {
      setDeleteSvcError(err.message || 'No se pudo desactivar');
    } finally {
      setDeleting(false);
    }
  }
  async function toggleSvcActive(s) {
    try {
      const updated = await api.updateService(s.id, { isActive: !s.isActive });
      setServices((prev) => prev.map((x) => (x.id === s.id ? { ...x, ...updated } : x)));
    } catch (err) {
      if (err.status === 401 || err.status === 403) { logout(); navigate('/login'); }
      else alert(err.message || 'No se pudo cambiar el estado');
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
    { id: 'chat', label: 'Chat en vivo', icon: MessageCircle },
    { id: 'ingresos', label: 'Ingresos', icon: TrendingUp },
    { id: 'servicios', label: 'Servicios', icon: Settings, badge: services.length },
    { id: 'clientes', label: 'Clientes', icon: Users, badge: stats.clients },
    { id: 'tecnicos', label: 'Técnicos', icon: UserCog, badge: techs.length },
    { id: 'configuracion', label: 'Configuración', icon: Settings2 },
  ];

  return (
    <div className="flex min-h-screen overflow-x-clip bg-slate-50">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 hidden flex-col bg-brand-950 transition-all duration-300 ease-in-out lg:flex ${collapsed ? 'w-[72px]' : 'w-64'}`}>
        <div className={`flex border-b border-white/10 px-4 py-5 ${collapsed ? 'flex-col items-center gap-2' : 'items-center'}`}>
          <span className="grid h-10 w-10 shrink-0 place-items-center">
            <img src="/copito-avatar.png" alt="Copito" className="h-full w-full object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]" />
          </span>
          {!collapsed && (
            <div className="ml-2.5 min-w-0">
              <div className="font-display text-sm font-extrabold text-white leading-none">Fresh Service</div>
              <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-400">Panel Taller</div>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-brand-300 transition hover:bg-white/10 hover:text-white ${collapsed ? '' : 'ml-auto'}`}
            title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
            type="button"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
        <nav className={`flex-1 space-y-1 overflow-visible ${collapsed ? 'p-2' : 'p-4'}`}>
          {nav.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => setView(n.id)}
              title={collapsed ? n.label : undefined}
              className={`group relative flex min-h-11 w-full items-center rounded-xl transition touch-manipulation ${
                collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-4 py-2.5'
              } ${
                view === n.id
                  ? 'bg-white/10 text-white ring-1 ring-white/10'
                  : 'text-brand-100/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <n.icon size={18} className="shrink-0" />
              {!collapsed && <span className="text-sm font-semibold">{n.label}</span>}
              {!collapsed && n.badge > 0 && (
                <span className="ml-auto rounded-full bg-brand-500 px-2 py-0.5 text-xs font-bold text-white">{n.badge}</span>
              )}
              {collapsed && n.badge > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">{n.badge}</span>
              )}
              {collapsed && (
                <span className="pointer-events-none absolute left-full z-50 ml-3 hidden whitespace-nowrap rounded-lg bg-brand-800 px-3 py-1.5 text-xs font-semibold text-white shadow-lg group-hover:block">
                  {n.label}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className={`space-y-2 border-t border-white/10 ${collapsed ? 'p-2' : 'p-4'}`}>
          <Link
            to="/"
            target="_blank"
            className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-brand-gradient text-sm font-bold text-white shadow-glow transition hover:shadow-glow-lg hover:brightness-105 sheen touch-manipulation ${collapsed ? 'px-2 py-2.5' : 'px-4 py-2.5'}`}
            title={collapsed ? 'Ver sitio web' : undefined}
          >
            <img src="/copito-avatar.png" alt="" className="h-5 w-5 shrink-0 object-contain" />
            {!collapsed && 'Ver sitio web'}
          </Link>
          <button
            type="button"
            onClick={() => { logout(); navigate('/'); }}
            className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-rose-500/25 text-sm font-bold text-rose-100 ring-1 ring-rose-400/30 transition hover:bg-rose-500/40 cursor-pointer touch-manipulation ${collapsed ? 'px-2 py-2.5' : 'px-4 py-2.5'}`}
            title={collapsed ? 'Cerrar sesión' : undefined}
          >
            <LogOut size={17} className="shrink-0" />
            {!collapsed && 'Cerrar sesión'}
          </button>
          {!collapsed && (
            <div className="flex items-center gap-2.5 pt-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-gradient font-bold text-white">{user.firstName[0]}</div>
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-white">{user.firstName} {user.lastName}</div>
                <div className="text-xs text-brand-400">Taller · S.J. de los Morros</div>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="flex justify-center pt-3" title={`${user.firstName} ${user.lastName}`}>
              <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-gradient font-bold text-white">{user.firstName[0]}</div>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className={`flex-1 transition-all duration-300 ease-in-out ${collapsed ? 'lg:ml-[72px]' : 'lg:ml-64'}`}>
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex min-h-16 flex-col gap-2 border-b border-slate-200 bg-white/90 px-4 py-2 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-5 lg:px-8">
          <div className="min-w-0">
            <div className="truncate font-display font-bold text-ink-900">
              {view === 'dashboard' ? 'Panel de Control' : view === 'solicitudes' ? 'Gestión de Solicitudes' : view === 'chat' ? 'Chat en Vivo — Copito' : view === 'ingresos' ? 'Control de Servicios Realizados' : view === 'servicios' ? 'Catálogo de Servicios' : view === 'tecnicos' ? 'Equipo Técnico' : view === 'configuracion' ? 'Configuración del sitio' : 'Clientes del Taller'}
            </div>
            <div className="hidden text-xs text-ink-500 sm:block">Fresh Service Digital · Taller de Refrigeración</div>
          </div>
          <div className="flex shrink-0 items-center justify-end gap-2">
            {/* Mobile nav — alternativa a los KPIs para ir a Solicitudes / Ingresos / Clientes */}
            <select value={view} onChange={(e) => setView(e.target.value)} className="min-h-11 min-w-0 flex-1 rounded-full border border-slate-200 px-3 py-1.5 text-sm touch-manipulation sm:flex-none lg:hidden">
              <option value="dashboard">Dashboard</option><option value="solicitudes">Solicitudes</option><option value="chat">Chat en vivo</option><option value="ingresos">Ingresos</option><option value="servicios">Servicios</option><option value="clientes">Clientes</option><option value="tecnicos">Técnicos</option><option value="configuracion">Configuración</option>
            </select>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLeads(v => !v)}
                className="relative grid h-11 w-11 place-items-center rounded-full text-ink-600 ring-1 ring-slate-200 transition hover:bg-slate-100 active:bg-slate-100 touch-manipulation"
                title="Leads de Copito"
              >
                <Bell size={17} />
                {unreadLeads.length > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unreadLeads.length}
                  </span>
                )}
              </button>
              {showLeads && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowLeads(false)} />
                  <div className="absolute right-0 top-full mt-2 z-50 w-80 max-h-96 overflow-y-auto rounded-xl bg-white shadow-xl ring-1 ring-slate-200">
                    <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3">
                      <span className="text-sm font-bold text-ink-900">Leads de Copito</span>
                      {unreadLeads.length > 0 && (
                        <span className="text-xs text-ink-500">{unreadLeads.length} sin leer</span>
                      )}
                    </div>
                    {unreadLeads.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-ink-400">No hay leads nuevos</div>
                    ) : (
                      unreadLeads.map(lead => (
                        <button
                          key={lead.id}
                          onClick={() => { markLeadRead(lead.id); }}
                          className="flex w-full flex-col gap-1 border-b border-slate-50 px-4 py-3 text-left transition hover:bg-brand-50"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-ink-900">{lead.name}</span>
                            <span className="text-[10px] text-ink-400">
                              {(() => {
                                const mins = Math.round((Date.now() - new Date(lead.createdAt).getTime()) / 60000);
                                if (mins < 1) return 'ahora';
                                if (mins < 60) return `hace ${mins} min`;
                                const hrs = Math.round(mins / 60);
                                if (hrs < 24) return `hace ${hrs}h`;
                                return `hace ${Math.round(hrs / 24)}d`;
                              })()}
                            </span>
                          </div>
                          {lead.phone && (
                            <span className="text-xs text-emerald-600">{lead.phone}</span>
                          )}
                          {lead.serviceInterest && (
                            <span className="text-xs text-brand-600">{lead.serviceInterest}</span>
                          )}
                          {lead.message && (
                            <span className="text-xs text-ink-500 line-clamp-2">{lead.message}</span>
                          )}
                          <span className="text-[10px] text-ink-400">Click para marcar como leido</span>
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
            <button type="button" onClick={toggleTheme} title="Cambiar tema" className="grid h-11 w-11 place-items-center rounded-full text-ink-600 ring-1 ring-slate-200 transition hover:bg-slate-100 active:bg-slate-100 touch-manipulation">
              {isDark ? <Sun size={17} className="text-amber-500" /> : <Moon size={17} className="text-brand-700" />}
            </button>
            <button type="button" onClick={load} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-50 px-3 py-2 text-sm font-bold text-brand-700 ring-1 ring-brand-100 transition hover:bg-brand-100 active:bg-brand-100 cursor-pointer touch-manipulation sm:px-4">
              <RefreshCw size={15} /> <span className="hidden sm:inline">Actualizar</span>
            </button>
            <button type="button" onClick={() => { logout(); navigate('/'); }} title="Cerrar sesión" className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-rose-600 ring-1 ring-rose-100 transition hover:bg-rose-100 active:bg-rose-100 cursor-pointer touch-manipulation lg:hidden">
              <LogOut size={17} />
            </button>
          </div>
        </header>

        <div className="overflow-x-clip p-4 sm:p-5 lg:p-8">
          {loading ? (
            <div className="grid place-items-center py-32 text-brand-400"><Loader2 className="animate-spin" size={36} /></div>
          ) : (
          <div key={view} className="admin-view-fade">
          {view === 'dashboard' ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-display text-2xl font-extrabold text-ink-900">Resumen del Taller</h2>
                  <p className="text-sm text-ink-500">Estadísticas en vivo desde la base de datos</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => goToSolicitudes()}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-sm font-bold text-brand-700 ring-1 ring-brand-100 transition hover:bg-brand-100 active:bg-brand-100 cursor-pointer touch-manipulation">
                    <ClipboardList size={15} /> Ver solicitudes
                  </button>
                  <button type="button" onClick={exportReport} disabled={!appts.length}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 ring-1 ring-emerald-200 transition hover:bg-emerald-100 active:bg-emerald-100 disabled:opacity-50 touch-manipulation">
                    <Download size={15} /> Exportar Excel
                  </button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
                <KPI
                  icon={ClipboardCheck}
                  value={stats.total}
                  label="Solicitudes registradas"
                  color="bg-brand-100 text-brand-600"
                  accent="#0ea5e9"
                  sparkline={months.map((m) => m.v)}
                  active={mapFilter === null}
                  hint={mapFilter === null ? 'Mostrando todos' : 'Ver todos en el mapa'}
                  onClick={() => toggleMapFilter(null)}
                />
                <KPI
                  icon={Clock3}
                  value={stats.pending}
                  label="Pendientes de atender"
                  color="bg-amber-100 text-amber-600"
                  accent="#f59e0b"
                  active={mapFilter === 'PENDING'}
                  onClick={() => toggleMapFilter('PENDING')}
                />
                <KPI
                  icon={Wrench}
                  value={stats.progress}
                  label="En proceso"
                  color="bg-violet-100 text-violet-600"
                  accent="#8b5cf6"
                  active={mapFilter === 'IN_PROGRESS'}
                  onClick={() => toggleMapFilter('IN_PROGRESS')}
                />
                <KPI
                  icon={Users}
                  value={stats.clients}
                  label="Clientes registrados"
                  color="bg-emerald-100 text-emerald-600"
                  accent="#10b981"
                  sparkline={clientMonths}
                  hint="Ir a clientes"
                  onClick={() => setView('clientes')}
                />
              </div>
              <div className="grid gap-3 lg:grid-cols-2 sm:gap-6">
                <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100 shadow-sm sm:p-6">
                  <h3 className="font-display font-bold text-ink-900">Citas por estado</h3>
                  <p className="mb-5 text-xs text-ink-500">Distribución del flujo de trabajo</p>
                  <Donut data={donut} total={stats.total} />
                </div>
                <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100 shadow-sm sm:p-6">
                  <h3 className="font-display font-bold text-ink-900">Citas por mes</h3>
                  <p className="mb-6 text-xs text-ink-500">Solicitudes recibidas (últimos 6 meses)</p>
                  <MonthBars months={months} />
                </div>
              </div>

              {/* Mapa de servicios (full width) */}
              <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100 shadow-sm sm:p-6">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="font-display font-bold text-ink-900">Mapa de servicios</h3>
                    <p className="text-xs text-ink-500">Ubicación de las solicitudes registradas</p>
                  </div>
                  {mapFilter && (
                    <button
                      type="button"
                      onClick={() => setMapFilter(null)}
                      className="inline-flex min-h-11 w-fit shrink-0 items-center self-start rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-ink-600 transition hover:bg-slate-200 active:bg-slate-200 touch-manipulation sm:self-auto"
                    >
                      Quitar filtro · {STATUS[mapFilter]?.label || mapFilter}
                    </button>
                  )}
                </div>
                <div className="w-full min-w-0 overflow-hidden">
                  <ServiceMap
                    appointments={appts}
                    filterStatus={mapFilter}
                    height={mapHeight}
                  />
                </div>
              </div>

              <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100 shadow-sm sm:p-6">
                  <h3 className="font-display font-bold text-ink-900">Marcas de equipos más atendidas</h3>
                  <p className="mb-5 text-xs text-ink-500">Ranking de marcas en servicio</p>
                  <div className="space-y-3">
                    {brands.map((b) => (
                      <div key={b.brand} className="flex min-w-0 items-center gap-3">
                        <div className="w-20 shrink-0 truncate text-right text-sm font-semibold text-ink-700 sm:w-24">{b.brand}</div>
                        <div className="h-5 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${b.pct}%` }} />
                        </div>
                        <div className="w-6 text-sm font-bold text-ink-900">{b.v}</div>
                      </div>
                    ))}
                  </div>
              </div>
            </div>
          ) : view === 'solicitudes' ? (
            <div className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm">
              <div className="border-b border-slate-100 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-display font-bold text-ink-900">Solicitudes en vivo</h3>
                    <p className="text-xs text-ink-500">{sortedAppts.length} de {appts.length} solicitudes</p>
                  </div>
                  {hayFiltros && (
                    <button type="button" onClick={limpiarFiltros} className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-ink-600 transition hover:bg-slate-200 active:bg-slate-200 touch-manipulation">
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
                                <option key={t.id} value={t.id} disabled={t.isActive === false && a.technicianId !== t.id}>
                                  {t.firstName} {t.lastName}{t.specialty ? ` · ${t.specialty}` : ''}{t.isActive === false ? ' (Inactivo)' : ''}
                                </option>
                              ))}
                            </select>
                            {!a.technicianId && (() => {
                              const sug = suggestTech(a);
                              return sug ? (
                                <button type="button" onClick={() => handleAssign(a.id, sug.id)}
                                  title={`Asignar a ${sug.firstName} ${sug.lastName}`}
                                  className="mt-1 inline-flex min-h-11 items-center gap-1 text-[11px] font-semibold text-brand-600 transition hover:text-brand-700 active:text-brand-700 touch-manipulation">
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
                            {wa && <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className="grid h-11 w-11 place-items-center rounded-lg bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100 active:bg-emerald-100 touch-manipulation dark:bg-emerald-950/20 dark:text-emerald-400 dark:hover:bg-emerald-950/40 dark:active:bg-emerald-950/40 dark:ring-1 dark:ring-emerald-500/20"><MessageCircle size={16} /></a>}
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
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
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
                      className={`group relative min-h-11 overflow-hidden rounded-2xl p-4 text-left shadow-sm transition touch-manipulation sm:p-5 ${active ? 'shadow-glow ring-2 ring-brand-500' : 'ring-1 ring-white/60 hover:-translate-y-0.5 hover:shadow-glow-lg active:ring-brand-200'}`}>
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
                          className="mt-3 inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200 transition hover:bg-emerald-100 active:bg-emerald-100 touch-manipulation">
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
                <div className="border-b border-slate-100 p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-display font-bold text-ink-900">Servicios completados</h3>
                      <p className="text-xs text-ink-500">{completedFiltered.length} de {completedAppts.length}{ingPeriodo ? ' · período seleccionado' : ''}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {hayFiltrosI && (
                        <button type="button" onClick={limpiarFiltrosI} className="inline-flex min-h-11 items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-ink-600 transition hover:bg-slate-200 active:bg-slate-200 touch-manipulation"><X size={13} /> Limpiar</button>
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
          ) : view === 'servicios' ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-display text-2xl font-extrabold text-ink-900">Catálogo de Servicios</h2>
                  <p className="text-sm text-ink-500">{activeSvcCount} servicio{activeSvcCount === 1 ? '' : 's'} activo{activeSvcCount === 1 ? '' : 's'}</p>
                </div>
                <button type="button" onClick={openCreateSvc}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-gradient px-5 py-2 text-sm font-bold text-white shadow-glow transition hover:brightness-105 active:brightness-95 sheen touch-manipulation">
                  <Settings size={16} /> Nuevo servicio
                </button>
              </div>
              {svcFlash && (
                <div className="rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 ring-1 ring-emerald-100">{svcFlash}</div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="flex flex-wrap gap-1.5">
                  <button type="button" onClick={() => setSvcCategory('')}
                    className={`min-h-11 rounded-full px-3 py-1.5 text-xs font-bold transition touch-manipulation ${!svcCategory ? 'bg-brand-600 text-white' : 'bg-white text-ink-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}>
                    Todas
                  </button>
                  {SERVICE_CATEGORIES.map((c) => (
                    <button key={c} type="button" onClick={() => setSvcCategory(c)}
                      className={`min-h-11 rounded-full px-3 py-1.5 text-xs font-bold transition touch-manipulation ${svcCategory === c ? 'bg-brand-600 text-white' : 'bg-white text-ink-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}>
                      {CATEGORY_LABELS[c]}
                    </button>
                  ))}
                </div>
                <select value={svcEquipment} onChange={(e) => setSvcEquipment(e.target.value)}
                  className="min-h-11 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-ink-700 touch-manipulation">
                  <option value="">Todos los equipos</option>
                  {EQUIPMENT_TYPES.map((t) => <option key={t} value={t}>{EQUIPMENT_LABELS[t]}</option>)}
                </select>
              </div>

              {filteredServices.length === 0 ? (
                <div className="rounded-2xl bg-white p-10 text-center ring-1 ring-slate-100 shadow-sm">
                  <p className="text-sm text-ink-500">No hay servicios con esos filtros. Crea uno con «Nuevo servicio».</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 lg:hidden">
                    {filteredServices.map((s) => (
                      <div key={s.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-ink-900">{s.name}</div>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${CATEGORY_STYLE[s.category] || CATEGORY_STYLE.OTRO}`}>
                                {CATEGORY_LABELS[s.category] || s.category}
                              </span>
                              <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${EQUIPMENT_STYLE[s.equipmentType] || EQUIPMENT_STYLE.GENERAL}`}>
                                {EQUIPMENT_LABELS[s.equipmentType] || s.equipmentType}
                              </span>
                              <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${s.isActive !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                                {s.isActive !== false ? 'Activo' : 'Inactivo'}
                              </span>
                            </div>
                            <div className="mt-3">
                              <Price usd={s.priceUsd} />
                            </div>
                            <div className="mt-1 text-xs text-ink-400">{svcApptCount(s)} cita{svcApptCount(s) === 1 ? '' : 's'}</div>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button type="button" onClick={() => openEditSvc(s)} className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-50 px-3 text-sm font-bold text-brand-700 ring-1 ring-brand-100 transition hover:bg-brand-100 active:bg-brand-100 touch-manipulation">
                            <Pencil size={14} /> Editar
                          </button>
                          <button type="button" onClick={() => toggleSvcActive(s)} className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-3 text-sm font-bold text-ink-700 transition hover:bg-slate-200 active:bg-slate-200 touch-manipulation">
                            {s.isActive !== false ? <PowerOff size={14} /> : <Power size={14} />}
                            {s.isActive !== false ? 'Desactivar' : 'Activar'}
                          </button>
                          <button type="button" onClick={() => { setDeleteSvcError(''); setDeleteSvc(s); }} className="grid h-11 w-11 place-items-center rounded-xl bg-rose-50 text-rose-600 transition hover:bg-rose-100 active:bg-rose-100 touch-manipulation">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="hidden overflow-x-auto rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm lg:block">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-ink-500">
                        <tr>
                          <th className="px-5 py-3">Nombre</th>
                          <th className="px-3 py-3">Categoría</th>
                          <th className="px-3 py-3">Equipo</th>
                          <th className="px-3 py-3">Precio USD</th>
                          <th className="px-3 py-3">Precio Bs</th>
                          <th className="px-3 py-3">Estado</th>
                          <th className="px-3 py-3">Citas</th>
                          <th className="px-5 py-3 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredServices.map((s) => (
                          <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                            <td className="px-5 py-3 font-semibold text-ink-900">{s.name}</td>
                            <td className="px-3 py-3">
                              <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${CATEGORY_STYLE[s.category] || CATEGORY_STYLE.OTRO}`}>
                                {CATEGORY_LABELS[s.category] || s.category}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${EQUIPMENT_STYLE[s.equipmentType] || EQUIPMENT_STYLE.GENERAL}`}>
                                {EQUIPMENT_LABELS[s.equipmentType] || s.equipmentType}
                              </span>
                            </td>
                            <td className="px-3 py-3 font-semibold text-ink-900">{formatUsd(s.priceUsd)}</td>
                            <td className="px-3 py-3 text-ink-700">{formatBs(s.priceUsd, rate) || '—'}</td>
                            <td className="px-3 py-3">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${s.isActive !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                                {s.isActive !== false ? 'Activo' : 'Inactivo'}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-700 ring-1 ring-brand-100">{svcApptCount(s)}</span>
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex items-center justify-end gap-1.5">
                                <button type="button" onClick={() => openEditSvc(s)} title="Editar"
                                  className="grid h-11 w-11 place-items-center rounded-lg bg-brand-50 text-brand-600 transition hover:bg-brand-100 active:bg-brand-100 touch-manipulation"><Pencil size={15} /></button>
                                <button type="button" onClick={() => toggleSvcActive(s)} title={s.isActive !== false ? 'Desactivar' : 'Activar'}
                                  className={`grid h-11 w-11 place-items-center rounded-lg transition touch-manipulation ${s.isActive !== false ? 'bg-slate-100 text-ink-600 hover:bg-slate-200 active:bg-slate-200' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 active:bg-emerald-100'}`}>
                                  {s.isActive !== false ? <PowerOff size={15} /> : <Power size={15} />}
                                </button>
                                <button type="button" onClick={() => { setDeleteSvcError(''); setDeleteSvc(s); }} title="Eliminar"
                                  className="grid h-11 w-11 place-items-center rounded-lg bg-rose-50 text-rose-600 transition hover:bg-rose-100 active:bg-rose-100 touch-manipulation"><Trash2 size={15} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          ) : view === 'tecnicos' ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-display text-2xl font-extrabold text-ink-900">Equipo Técnico</h2>
                  <p className="text-sm text-ink-500">{techs.length} técnico{techs.length === 1 ? '' : 's'} registrado{techs.length === 1 ? '' : 's'}</p>
                </div>
                <button type="button" onClick={openCreateTech}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-gradient px-5 py-2 text-sm font-bold text-white shadow-glow transition hover:brightness-105 active:brightness-95 sheen touch-manipulation">
                  <UserCog size={16} /> Nuevo técnico
                </button>
              </div>
              {techFlash && (
                <div className="rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 ring-1 ring-emerald-100">{techFlash}</div>
              )}

              {techs.length === 0 ? (
                <div className="rounded-2xl bg-white p-10 text-center ring-1 ring-slate-100 shadow-sm">
                  <p className="text-sm text-ink-500">Aún no hay técnicos. Crea el primero con «Nuevo técnico».</p>
                </div>
              ) : (
                <>
                  {/* Mobile: tarjetas */}
                  <div className="space-y-3 lg:hidden">
                    {techs.map((t) => (
                      <div key={t.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-ink-900">{t.firstName} {t.lastName}</div>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${SPECIALTY_STYLE[t.specialty] || SPECIALTY_STYLE.General}`}>
                                {t.specialty || 'Sin especialidad'}
                              </span>
                              <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${t.isActive !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                                {t.isActive !== false ? 'Activo' : 'Inactivo'}
                              </span>
                            </div>
                            <div className="mt-2 break-words text-xs text-ink-500">{t.email}</div>
                            {t.username && <div className="text-xs font-semibold text-ink-600">@{t.username}</div>}
                            {t.phone && <div className="text-xs text-ink-500">{t.phone}</div>}
                            <div className="mt-1 text-xs text-ink-400">{techJobCount(t)} servicio{techJobCount(t) === 1 ? '' : 's'}</div>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button type="button" onClick={() => openEditTech(t)} className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-50 px-3 text-sm font-bold text-brand-700 ring-1 ring-brand-100 transition hover:bg-brand-100 active:bg-brand-100 touch-manipulation">
                            <Pencil size={14} /> Editar
                          </button>
                          <button type="button" onClick={() => toggleTechActive(t)} className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-3 text-sm font-bold text-ink-700 transition hover:bg-slate-200 active:bg-slate-200 touch-manipulation">
                            {t.isActive !== false ? <PowerOff size={14} /> : <Power size={14} />}
                            {t.isActive !== false ? 'Desactivar' : 'Activar'}
                          </button>
                          <button type="button" onClick={() => setDeleteTech(t)} className="grid h-11 w-11 place-items-center rounded-xl bg-rose-50 text-rose-600 transition hover:bg-rose-100 active:bg-rose-100 touch-manipulation">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop: tabla */}
                  <div className="hidden overflow-x-auto rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm lg:block">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-ink-500">
                        <tr>
                          <th className="px-5 py-3">Nombre completo</th>
                          <th className="px-3 py-3">Email</th>
                          <th className="px-3 py-3">Usuario</th>
                          <th className="px-3 py-3">Teléfono</th>
                          <th className="px-3 py-3">Especialidad</th>
                          <th className="px-3 py-3">Estado</th>
                          <th className="px-3 py-3">Servicios</th>
                          <th className="px-5 py-3 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {techs.map((t) => (
                          <tr key={t.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-sky-500 to-brand-500 text-xs font-bold text-white">
                                  {(t.firstName[0] + (t.lastName?.[0] || '')).toUpperCase()}
                                </div>
                                <span className="font-semibold text-ink-900">{t.firstName} {t.lastName}</span>
                              </div>
                            </td>
                            <td className="px-3 py-3 text-ink-700">{t.email}</td>
                            <td className="px-3 py-3 font-medium text-ink-700">{t.username ? `@${t.username}` : '—'}</td>
                            <td className="px-3 py-3 text-ink-700">{t.phone || 'N/A'}</td>
                            <td className="px-3 py-3">
                              <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${SPECIALTY_STYLE[t.specialty] || SPECIALTY_STYLE.General}`}>
                                {t.specialty || 'Sin especialidad'}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${t.isActive !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                                {t.isActive !== false ? 'Activo' : 'Inactivo'}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-700 ring-1 ring-brand-100">{techJobCount(t)}</span>
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex items-center justify-end gap-1.5">
                                <button type="button" onClick={() => openEditTech(t)} title="Editar"
                                  className="grid h-11 w-11 place-items-center rounded-lg bg-brand-50 text-brand-600 transition hover:bg-brand-100 active:bg-brand-100 touch-manipulation"><Pencil size={15} /></button>
                                <button type="button" onClick={() => toggleTechActive(t)} title={t.isActive !== false ? 'Desactivar' : 'Activar'}
                                  className={`grid h-11 w-11 place-items-center rounded-lg transition touch-manipulation ${t.isActive !== false ? 'bg-slate-100 text-ink-600 hover:bg-slate-200 active:bg-slate-200' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 active:bg-emerald-100'}`}>
                                  {t.isActive !== false ? <PowerOff size={15} /> : <Power size={15} />}
                                </button>
                                <button type="button" onClick={() => setDeleteTech(t)} title="Eliminar"
                                  className="grid h-11 w-11 place-items-center rounded-lg bg-rose-50 text-rose-600 transition hover:bg-rose-100 active:bg-rose-100 touch-manipulation"><Trash2 size={15} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          ) : view === 'chat' ? (
            <AdminChatView />
          ) : view === 'configuracion' ? (
            <>
              <SiteImagesSection />
              <div className="mt-10">
                <CarouselSection />
              </div>
            </>
          ) : (
            <div className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm">
              <div className="border-b border-slate-100 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-display font-bold text-ink-900">Directorio de clientes</h3>
                    <p className="text-xs text-ink-500">{filteredClients.length} clientes registrados</p>
                  </div>
                  {hayFiltrosC && (
                    <button type="button" onClick={limpiarFiltrosC} className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-ink-600 transition hover:bg-slate-200 active:bg-slate-200 touch-manipulation">
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
                            {wa ? <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-1.5 font-medium text-brand-700 hover:text-brand-800 active:text-brand-800 touch-manipulation">{c.phone} <MessageCircle size={13} /></a> : 'N/A'}
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
                              <button type="button" onClick={() => openEdit(c)} title="Editar"
                                className="grid h-11 w-11 place-items-center rounded-lg bg-brand-50 text-brand-600 transition hover:bg-brand-100 active:bg-brand-100 touch-manipulation"><Pencil size={15} /></button>
                              <button type="button" onClick={() => setDeleteTarget(c)} title="Eliminar"
                                className="grid h-11 w-11 place-items-center rounded-lg bg-rose-50 text-rose-600 transition hover:bg-rose-100 active:bg-rose-100 touch-manipulation"><Trash2 size={15} /></button>
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
          )}
        </div>
      </div>

      {/* Modal de edición de usuario */}
      {editUser && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink-900/50 p-4" onClick={() => setEditUser(null)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={saveUser}
            className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-ink-900">Editar usuario</h3>
              <button type="button" onClick={() => setEditUser(null)} className="grid h-11 w-11 place-items-center rounded-lg text-ink-500 hover:bg-slate-100 active:bg-slate-100 touch-manipulation"><X size={18} /></button>
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
              <button type="button" onClick={() => setEditUser(null)} className="min-h-11 rounded-full px-4 py-2 text-sm font-semibold text-ink-600 hover:bg-slate-100 active:bg-slate-100 touch-manipulation">Cancelar</button>
              <button type="submit" disabled={savingUser} className="min-h-11 rounded-full bg-brand-gradient px-5 py-2 text-sm font-bold text-white shadow-glow transition hover:brightness-105 active:brightness-95 disabled:opacity-50 touch-manipulation">{savingUser ? 'Guardando…' : 'Guardar cambios'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink-900/50 p-4" onClick={() => !deleting && setDeleteTarget(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl bg-white p-4 text-center shadow-xl sm:p-6">
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
              <button type="button" onClick={() => setDeleteTarget(null)} disabled={deleting} className="flex-1 min-h-11 rounded-full bg-slate-100 px-4 py-2.5 text-sm font-bold text-ink-700 transition hover:bg-slate-200 active:bg-slate-200 disabled:opacity-50 touch-manipulation">Cancelar</button>
              <button type="button" onClick={confirmDelete} disabled={deleting} className="flex-1 min-h-11 rounded-full bg-rose-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-700 active:bg-rose-800 disabled:opacity-50 touch-manipulation">{deleting ? 'Eliminando…' : 'Sí, eliminar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal nuevo técnico */}
      {createTech && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink-900/50 p-4" onClick={() => !savingTech && setCreateTech(null)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={saveNewTech}
            className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-ink-900">Nuevo técnico</h3>
              <button type="button" onClick={() => setCreateTech(null)} className="grid h-11 w-11 place-items-center rounded-lg text-ink-500 hover:bg-slate-100 active:bg-slate-100 touch-manipulation"><X size={18} /></button>
            </div>
            {techMsg && <div className="mt-3 rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700 ring-1 ring-rose-100">{techMsg}</div>}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="block"><span className="mb-1 block text-xs font-bold uppercase text-ink-500">Nombre</span>
                <input required value={createTech.firstName} onChange={(e) => setCreateTech({ ...createTech, firstName: e.target.value })} className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400" /></label>
              <label className="block"><span className="mb-1 block text-xs font-bold uppercase text-ink-500">Apellido</span>
                <input required value={createTech.lastName} onChange={(e) => setCreateTech({ ...createTech, lastName: e.target.value })} className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400" /></label>
            </div>
            <label className="mt-3 block"><span className="mb-1 block text-xs font-bold uppercase text-ink-500">Correo</span>
              <input required type="email" value={createTech.email} onChange={(e) => setCreateTech({ ...createTech, email: e.target.value })} className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400" /></label>
            <label className="mt-3 block"><span className="mb-1 block text-xs font-bold uppercase text-ink-500">Nombre de usuario <span className="font-normal normal-case text-ink-400">(opcional)</span></span>
              <input value={createTech.username} onChange={(e) => setCreateTech({ ...createTech, username: e.target.value })} placeholder="ejemplo: carlos.split" className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400" />
              <span className="mt-1 block text-[11px] text-ink-400">Solo letras minúsculas, números, puntos y guiones bajos (mín. 4 caracteres)</span></label>
            <label className="mt-3 block"><span className="mb-1 block text-xs font-bold uppercase text-ink-500">Teléfono</span>
              <input value={createTech.phone} onChange={(e) => setCreateTech({ ...createTech, phone: e.target.value })} placeholder="+58 412-0000000" className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400" /></label>
            <label className="mt-3 block"><span className="mb-1 block text-xs font-bold uppercase text-ink-500">Contraseña</span>
              <input required type="text" minLength={6} value={createTech.password} onChange={(e) => setCreateTech({ ...createTech, password: e.target.value })} className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400" /></label>
            <label className="mt-3 block"><span className="mb-1 block text-xs font-bold uppercase text-ink-500">Especialidad</span>
              <select value={createTech.specialty} onChange={(e) => setCreateTech({ ...createTech, specialty: e.target.value })} className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400">
                {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select></label>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setCreateTech(null)} className="min-h-11 rounded-full px-4 py-2 text-sm font-semibold text-ink-600 hover:bg-slate-100 active:bg-slate-100 touch-manipulation">Cancelar</button>
              <button type="submit" disabled={savingTech} className="min-h-11 rounded-full bg-brand-gradient px-5 py-2 text-sm font-bold text-white shadow-glow transition hover:brightness-105 active:brightness-95 disabled:opacity-50 touch-manipulation">{savingTech ? 'Creando…' : 'Crear técnico'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal editar técnico */}
      {editTech && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink-900/50 p-4" onClick={() => !savingTech && setEditTech(null)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={saveEditTech}
            className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-ink-900">Editar técnico</h3>
              <button type="button" onClick={() => setEditTech(null)} className="grid h-11 w-11 place-items-center rounded-lg text-ink-500 hover:bg-slate-100 active:bg-slate-100 touch-manipulation"><X size={18} /></button>
            </div>
            {techMsg && <div className="mt-3 rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700 ring-1 ring-rose-100">{techMsg}</div>}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="block"><span className="mb-1 block text-xs font-bold uppercase text-ink-500">Nombre</span>
                <input required value={editTech.firstName} onChange={(e) => setEditTech({ ...editTech, firstName: e.target.value })} className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400" /></label>
              <label className="block"><span className="mb-1 block text-xs font-bold uppercase text-ink-500">Apellido</span>
                <input required value={editTech.lastName} onChange={(e) => setEditTech({ ...editTech, lastName: e.target.value })} className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400" /></label>
            </div>
            <label className="mt-3 block"><span className="mb-1 block text-xs font-bold uppercase text-ink-500">Correo</span>
              <input required type="email" value={editTech.email} onChange={(e) => setEditTech({ ...editTech, email: e.target.value })} className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400" /></label>
            <label className="mt-3 block"><span className="mb-1 block text-xs font-bold uppercase text-ink-500">Nombre de usuario</span>
              <input value={editTech.username} onChange={(e) => setEditTech({ ...editTech, username: e.target.value })} placeholder="ejemplo: carlos.split" className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400" />
              <span className="mt-1 block text-[11px] text-ink-400">Vacío para quitarlo. Solo minúsculas, números, puntos y _ (4–30)</span></label>
            <label className="mt-3 block"><span className="mb-1 block text-xs font-bold uppercase text-ink-500">Teléfono</span>
              <input value={editTech.phone} onChange={(e) => setEditTech({ ...editTech, phone: e.target.value })} placeholder="+58 412-0000000" className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400" /></label>
            <label className="mt-3 block"><span className="mb-1 block text-xs font-bold uppercase text-ink-500">Especialidad</span>
              <select value={editTech.specialty} onChange={(e) => setEditTech({ ...editTech, specialty: e.target.value })} className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400">
                {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select></label>
            <label className="mt-3 block"><span className="mb-1 block text-xs font-bold uppercase text-ink-500">Nueva contraseña <span className="font-normal normal-case text-ink-400">(opcional)</span></span>
              <input type="text" value={editTech.password} onChange={(e) => setEditTech({ ...editTech, password: e.target.value })} placeholder="Dejar vacío para no cambiarla" className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400" /></label>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setEditTech(null)} className="min-h-11 rounded-full px-4 py-2 text-sm font-semibold text-ink-600 hover:bg-slate-100 active:bg-slate-100 touch-manipulation">Cancelar</button>
              <button type="submit" disabled={savingTech} className="min-h-11 rounded-full bg-brand-gradient px-5 py-2 text-sm font-bold text-white shadow-glow transition hover:brightness-105 active:brightness-95 disabled:opacity-50 touch-manipulation">{savingTech ? 'Guardando…' : 'Guardar cambios'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal eliminar técnico */}
      {deleteTech && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink-900/50 p-4" onClick={() => !deleting && setDeleteTech(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl bg-white p-4 text-center shadow-xl sm:p-6">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-rose-100 text-rose-600">
              <Trash2 size={26} />
            </div>
            <h3 className="mt-4 font-display text-lg font-bold text-ink-900">¿Eliminar este técnico?</h3>
            <p className="mt-2 text-sm text-ink-500">
              Vas a eliminar a <strong className="text-ink-900">{deleteTech.firstName} {deleteTech.lastName}</strong> ({deleteTech.email}).
              {techActiveJobs(deleteTech) > 0 && (
                <> Este técnico tiene <strong className="text-rose-600">{techActiveJobs(deleteTech)} servicio{techActiveJobs(deleteTech) === 1 ? '' : 's'} activo{techActiveJobs(deleteTech) === 1 ? '' : 's'}</strong>. ¿Seguro que deseas eliminarlo?</>
              )}
              {' '}Las citas asignadas quedarán sin técnico. Esta acción no se puede deshacer.
            </p>
            <div className="mt-6 flex gap-2">
              <button type="button" onClick={() => setDeleteTech(null)} disabled={deleting} className="flex-1 min-h-11 rounded-full bg-slate-100 px-4 py-2.5 text-sm font-bold text-ink-700 transition hover:bg-slate-200 active:bg-slate-200 disabled:opacity-50 touch-manipulation">Cancelar</button>
              <button type="button" onClick={confirmDeleteTech} disabled={deleting} className="flex-1 min-h-11 rounded-full bg-rose-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-700 active:bg-rose-800 disabled:opacity-50 touch-manipulation">{deleting ? 'Eliminando…' : 'Sí, eliminar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal nuevo servicio */}
      {createSvc && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink-900/50 p-4" onClick={() => !savingSvc && setCreateSvc(null)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={saveNewSvc}
            className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-ink-900">Nuevo servicio</h3>
              <button type="button" onClick={() => setCreateSvc(null)} className="grid h-11 w-11 place-items-center rounded-lg text-ink-500 hover:bg-slate-100 active:bg-slate-100 touch-manipulation"><X size={18} /></button>
            </div>
            {svcMsg && <div className="mt-3 rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700 ring-1 ring-rose-100">{svcMsg}</div>}
            <label className="mt-4 block"><span className="mb-1 block text-xs font-bold uppercase text-ink-500">Nombre</span>
              <input required value={createSvc.name} onChange={(e) => setCreateSvc({ ...createSvc, name: e.target.value })} className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400" placeholder="Ej: Cambio de capacitor" /></label>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="block"><span className="mb-1 block text-xs font-bold uppercase text-ink-500">Categoría</span>
                <select required value={createSvc.category} onChange={(e) => setCreateSvc({ ...createSvc, category: e.target.value })} className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400">
                  {SERVICE_CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                </select></label>
              <label className="block"><span className="mb-1 block text-xs font-bold uppercase text-ink-500">Tipo de equipo</span>
                <select required value={createSvc.equipmentType} onChange={(e) => setCreateSvc({ ...createSvc, equipmentType: e.target.value })} className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400">
                  {EQUIPMENT_TYPES.map((t) => <option key={t} value={t}>{EQUIPMENT_LABELS[t]}</option>)}
                </select></label>
            </div>
            <label className="mt-3 block"><span className="mb-1 block text-xs font-bold uppercase text-ink-500">Precio USD</span>
              <input required type="number" min="0.01" step="0.01" value={createSvc.priceUsd} onChange={(e) => setCreateSvc({ ...createSvc, priceUsd: e.target.value })} className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400" placeholder="40" /></label>
            <label className="mt-3 block"><span className="mb-1 block text-xs font-bold uppercase text-ink-500">Descripción <span className="font-normal normal-case text-ink-400">(opcional)</span></span>
              <textarea value={createSvc.description} onChange={(e) => setCreateSvc({ ...createSvc, description: e.target.value })} rows={3} className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400" placeholder="Detalle breve del servicio…" /></label>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setCreateSvc(null)} className="min-h-11 rounded-full px-4 py-2 text-sm font-semibold text-ink-600 hover:bg-slate-100 active:bg-slate-100 touch-manipulation">Cancelar</button>
              <button type="submit" disabled={savingSvc} className="min-h-11 rounded-full bg-brand-gradient px-5 py-2 text-sm font-bold text-white shadow-glow transition hover:brightness-105 active:brightness-95 disabled:opacity-50 touch-manipulation">{savingSvc ? 'Creando…' : 'Crear servicio'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal editar servicio */}
      {editSvc && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink-900/50 p-4" onClick={() => !savingSvc && setEditSvc(null)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={saveEditSvc}
            className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-ink-900">Editar servicio</h3>
              <button type="button" onClick={() => setEditSvc(null)} className="grid h-11 w-11 place-items-center rounded-lg text-ink-500 hover:bg-slate-100 active:bg-slate-100 touch-manipulation"><X size={18} /></button>
            </div>
            {svcMsg && <div className="mt-3 rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700 ring-1 ring-rose-100">{svcMsg}</div>}
            <label className="mt-4 block"><span className="mb-1 block text-xs font-bold uppercase text-ink-500">Nombre</span>
              <input required value={editSvc.name} onChange={(e) => setEditSvc({ ...editSvc, name: e.target.value })} className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400" /></label>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="block"><span className="mb-1 block text-xs font-bold uppercase text-ink-500">Categoría</span>
                <select required value={editSvc.category} onChange={(e) => setEditSvc({ ...editSvc, category: e.target.value })} className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400">
                  {SERVICE_CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                </select></label>
              <label className="block"><span className="mb-1 block text-xs font-bold uppercase text-ink-500">Tipo de equipo</span>
                <select required value={editSvc.equipmentType} onChange={(e) => setEditSvc({ ...editSvc, equipmentType: e.target.value })} className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400">
                  {EQUIPMENT_TYPES.map((t) => <option key={t} value={t}>{EQUIPMENT_LABELS[t]}</option>)}
                </select></label>
            </div>
            <label className="mt-3 block"><span className="mb-1 block text-xs font-bold uppercase text-ink-500">Precio USD</span>
              <input required type="number" min="0.01" step="0.01" value={editSvc.priceUsd} onChange={(e) => setEditSvc({ ...editSvc, priceUsd: e.target.value })} className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400" /></label>
            <label className="mt-3 block"><span className="mb-1 block text-xs font-bold uppercase text-ink-500">Descripción <span className="font-normal normal-case text-ink-400">(opcional)</span></span>
              <textarea value={editSvc.description} onChange={(e) => setEditSvc({ ...editSvc, description: e.target.value })} rows={3} className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400" /></label>
            <label className="mt-4 flex min-h-11 cursor-pointer items-center justify-between rounded-xl bg-slate-50 px-4 py-2 ring-1 ring-slate-200">
              <span className="text-sm font-semibold text-ink-700">{editSvc.isActive ? 'Servicio activo' : 'Servicio inactivo'}</span>
              <input type="checkbox" checked={editSvc.isActive} onChange={(e) => setEditSvc({ ...editSvc, isActive: e.target.checked })} className="h-5 w-5 accent-brand-600" />
            </label>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setEditSvc(null)} className="min-h-11 rounded-full px-4 py-2 text-sm font-semibold text-ink-600 hover:bg-slate-100 active:bg-slate-100 touch-manipulation">Cancelar</button>
              <button type="submit" disabled={savingSvc} className="min-h-11 rounded-full bg-brand-gradient px-5 py-2 text-sm font-bold text-white shadow-glow transition hover:brightness-105 active:brightness-95 disabled:opacity-50 touch-manipulation">{savingSvc ? 'Guardando…' : 'Guardar cambios'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal eliminar servicio */}
      {deleteSvc && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink-900/50 p-4" onClick={() => !deleting && setDeleteSvc(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl bg-white p-4 text-center shadow-xl sm:p-6">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-rose-100 text-rose-600">
              <Trash2 size={26} />
            </div>
            <h3 className="mt-4 font-display text-lg font-bold text-ink-900">¿Eliminar este servicio?</h3>
            <p className="mt-2 text-sm text-ink-500">
              Vas a eliminar <strong className="text-ink-900">{deleteSvc.name}</strong> ({EQUIPMENT_LABELS[deleteSvc.equipmentType] || deleteSvc.equipmentType}).
              {svcApptCount(deleteSvc) > 0 && (
                <> Tiene <strong className="text-rose-600">{svcApptCount(deleteSvc)} cita{svcApptCount(deleteSvc) === 1 ? '' : 's'}</strong> asociada{svcApptCount(deleteSvc) === 1 ? '' : 's'}. Si el servidor lo rechaza, desactívalo en lugar de borrarlo.</>
              )}
              {' '}Esta acción no se puede deshacer.
            </p>
            {deleteSvcError && (
              <div className="mt-3 rounded-xl bg-amber-50 px-4 py-2.5 text-left text-sm font-medium text-amber-800 ring-1 ring-amber-100">
                {deleteSvcError}
              </div>
            )}
            <div className="mt-6 flex flex-col gap-2">
              {deleteSvcError ? (
                <button type="button" onClick={deactivateFromDelete} disabled={deleting} className="min-h-11 rounded-full bg-amber-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-amber-600 active:bg-amber-700 disabled:opacity-50 touch-manipulation">
                  {deleting ? 'Desactivando…' : 'Desactivar en su lugar'}
                </button>
              ) : (
                <button type="button" onClick={confirmDeleteSvc} disabled={deleting} className="min-h-11 rounded-full bg-rose-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-700 active:bg-rose-800 disabled:opacity-50 touch-manipulation">
                  {deleting ? 'Eliminando…' : 'Sí, eliminar'}
                </button>
              )}
              <button type="button" onClick={() => { setDeleteSvc(null); setDeleteSvcError(''); }} disabled={deleting} className="min-h-11 rounded-full bg-slate-100 px-4 py-2.5 text-sm font-bold text-ink-700 transition hover:bg-slate-200 active:bg-slate-200 disabled:opacity-50 touch-manipulation">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
