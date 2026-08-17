import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, MapPin, Clock, Zap, MessageCircle, Snowflake } from 'lucide-react';
import Button from '../components/Button';
import Price from '../components/Price';
import { Field, inputClass } from '../components/AuthShell';
import LocationPicker from '../components/maps/LocationPicker';
import { api } from '../lib/api';
import { priceUsd } from '../lib/prices';
import { useAuth } from '../context/AuthContext';
import {
  EQUIPMENT_BTU, EQUIPMENT_LABELS, FALLBACK_EQUIPOS, FALLBACK_SERVICIOS,
} from '../lib/services';
const horarios = [
  { v: 'manana', t: 'Mañana (8:00 AM – 12:00 PM)', h: '09:00:00' },
  { v: 'tarde', t: 'Tarde (12:00 PM – 5:00 PM)', h: '14:00:00' },
  { v: 'noche', t: 'Noche (5:00 PM – 7:00 PM)', h: '18:00:00' },
];

const PREFIJOS = ['412', '414', '424', '416', '426'];

export default function Solicitud() {
  const { user, patchUser } = useAuth();
  // Precargar teléfono y cédula desde la CUENTA (o desde la última solicitud como respaldo)
  const digits = (user?.phone || '').replace(/\D/g, '').replace(/^58/, '');
  const hasPrefix = PREFIJOS.includes(digits.slice(0, 3));
  const cedRaw = user?.cedula || localStorage.getItem('fsd_cedula') || '';
  const cedM = cedRaw.match(/^\s*([VE])\s*-?\s*(\d+)/i);
  const [f, setF] = useState({
    cedTipo: cedM ? cedM[1].toUpperCase() : 'V',
    cedNum: cedM ? cedM[2] : '',
    phonePrefix: hasPrefix ? digits.slice(0, 3) : '412',
    phoneNum: hasPrefix ? digits.slice(3) : '',
    direccion: localStorage.getItem('fsd_direccion') || '',
    equipo: 'Aire de Ventana', servicio: 'Reparación', serviceId: '', descripcion: '', fecha: '', horario: 'manana',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [ref, setRef] = useState(null);
  const [apiServices, setApiServices] = useState(null);
  // Ubicación del mapa (opcional). El primer onLocationChange es el default del picker al montar → no confirma.
  const [location, setLocation] = useState(null);
  const [locationMarked, setLocationMarked] = useState(false);
  const locationInitRef = useRef(true);

  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  useEffect(() => {
    let cancelled = false;
    api.getServices()
      .then((list) => {
        if (cancelled || !Array.isArray(list) || !list.length) return;
        setApiServices(list);
        const first = list[0];
        setF((s) => ({
          ...s,
          equipo: first.equipmentType,
          servicio: first.name,
          serviceId: first.id,
        }));
      })
      .catch(() => { /* fallback a prices.js — no romper el formulario */ });
    return () => { cancelled = true; };
  }, []);

  const useApi = Array.isArray(apiServices) && apiServices.length > 0;
  const equipoOptions = useMemo(() => {
    if (!useApi) return FALLBACK_EQUIPOS.map((e) => ({ value: e.v, label: e.v }));
    const seen = new Set();
    return apiServices.reduce((acc, s) => {
      if (seen.has(s.equipmentType)) return acc;
      seen.add(s.equipmentType);
      acc.push({ value: s.equipmentType, label: EQUIPMENT_LABELS[s.equipmentType] || s.equipmentType });
      return acc;
    }, []);
  }, [useApi, apiServices]);

  const servicioOptions = useMemo(() => {
    if (!useApi) return FALLBACK_SERVICIOS.map((name) => ({ value: name, label: name, id: '', priceUsd: priceUsd(f.equipo, name) }));
    return apiServices
      .filter((s) => s.equipmentType === f.equipo)
      .map((s) => ({ value: s.id, label: s.name, id: s.id, priceUsd: s.priceUsd, name: s.name }));
  }, [useApi, apiServices, f.equipo]);

  const selectedService = useMemo(() => {
    if (useApi) {
      return apiServices.find((s) => s.id === f.serviceId)
        || apiServices.find((s) => s.equipmentType === f.equipo && s.name === f.servicio)
        || null;
    }
    return null;
  }, [useApi, apiServices, f.serviceId, f.equipo, f.servicio]);

  const displayPrice = selectedService?.priceUsd ?? priceUsd(
    EQUIPMENT_LABELS[f.equipo] || f.equipo,
    f.servicio,
  );
  const displayEquipo = EQUIPMENT_LABELS[f.equipo] || f.equipo;
  const displayServicio = selectedService?.name || f.servicio;

  function handleEquipoChange(e) {
    const next = e.target.value;
    if (useApi) {
      const first = apiServices.find((s) => s.equipmentType === next);
      setF((s) => ({
        ...s,
        equipo: next,
        servicio: first?.name || '',
        serviceId: first?.id || '',
      }));
      return;
    }
    setF((s) => ({ ...s, equipo: next }));
  }

  function handleServicioChange(e) {
    const next = e.target.value;
    if (useApi) {
      const svc = apiServices.find((s) => s.id === next);
      setF((s) => ({ ...s, serviceId: next, servicio: svc?.name || s.servicio }));
      return;
    }
    setF((s) => ({ ...s, servicio: next }));
  }

  function handleLocationChange(data) {
    setLocation(data);
    if (locationInitRef.current) {
      locationInitRef.current = false;
      return;
    }
    // Drag, GPS o edición manual de la dirección del picker → ubicación intencional
    setLocationMarked(true);
    if (data?.address) {
      setF((s) => (s.direccion?.trim() ? s : { ...s, direccion: data.address }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!f.fecha) return setError('Selecciona una fecha para la visita');
    setLoading(true);
    try {
      const h = horarios.find((x) => x.v === f.horario)?.h || '10:00:00';
      const brand = displayEquipo;
      const model = displayServicio;
      const payload = {
        clientId: user.id,
        scheduledAt: `${f.fecha}T${h}.000Z`,
        brand,
        model,
        btuCapacity: EQUIPMENT_BTU[f.equipo] || null,
        priceUsd: displayPrice,
        cedula: `${f.cedTipo}-${f.cedNum}`,
        failureDescription: f.descripcion || 'Sin descripción adicional',
        notes: `Cédula: ${f.cedTipo}-${f.cedNum}\nWhatsApp: +58 ${f.phonePrefix}-${f.phoneNum}\nDirección: ${f.direccion}\nHorario: ${f.horario}`,
      };
      if (selectedService?.id) payload.serviceId = selectedService.id;
      // Solo enviar coords si el usuario interactuó con el mapa (opcional)
      if (
        locationMarked &&
        location?.latitude != null &&
        location?.longitude != null
      ) {
        payload.latitude = location.latitude;
        payload.longitude = location.longitude;
        payload.address = location.address || f.direccion || undefined;
      }
      const data = await api.createAppointment(payload);
      // Recordar datos para la próxima solicitud (cuenta + respaldo local)
      const ced = `${f.cedTipo}-${f.cedNum}`;
      patchUser({ cedula: ced }); // queda guardada en la cuenta (backend) y en memoria
      localStorage.setItem('fsd_cedula', ced);
      localStorage.setItem('fsd_direccion', f.direccion);
      setRef(data.id.substring(0, 8).toUpperCase());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message || 'No se pudo enviar la solicitud');
    } finally {
      setLoading(false);
    }
  }

  if (ref) {
    return (
      <div className="overflow-x-clip bg-brand-50">
        <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-5">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-emerald-500 text-white shadow-lg">
            <CheckCircle2 size={42} />
          </div>
          <h1 className="mt-6 font-display text-3xl font-extrabold text-ink-900">¡Solicitud recibida!</h1>
          <p className="mt-3 text-ink-500">
            Tu solicitud fue enviada con éxito. Un técnico te contactará por WhatsApp
            en un plazo máximo de 2 horas hábiles.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-bold text-brand-700 ring-1 ring-brand-100">
            Referencia: #FSD-{ref}
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button to="/panel" variant="primary">Ver mis solicitudes</Button>
            <Button to="/" variant="outline">Volver al inicio</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-clip bg-white">
      <section className="relative overflow-hidden bg-brand-950 py-14 text-white">
        <Snowflake className="absolute right-6 top-6 text-white/10" size={130} />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-5 lg:px-8">
          <div className="text-sm text-brand-200"><Link to="/" className="hover:text-white">Inicio</Link> / Solicitar servicio</div>
          <h1 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">Solicitar Servicio a Domicilio</h1>
          <p className="mt-2 max-w-lg text-brand-100/80">Completa el formulario y coordinamos tu visita técnica.</p>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-14 sm:px-5 lg:grid-cols-[1fr_340px] lg:gap-8 lg:px-8">
        <form onSubmit={handleSubmit} className="min-w-0 rounded-3xl bg-white p-4 ring-1 ring-slate-100 shadow-sm sm:p-9">
          {error && (
            <div className="mb-5 flex items-start gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 ring-1 ring-rose-100">
              <AlertCircle size={18} className="mt-0.5 shrink-0" /> {error}
            </div>
          )}

          <h2 className="mb-5 flex items-center gap-2 border-b border-slate-100 pb-3 font-display text-lg font-bold text-ink-900">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-gradient text-xs font-bold text-white">1</span>
            Datos personales
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre completo">
              <input className={inputClass} value={`${user?.firstName || ''} ${user?.lastName || ''}`.trim()} disabled />
            </Field>
            <Field label="Cédula de identidad">
              <div className="flex min-w-0">
                <select value={f.cedTipo} onChange={set('cedTipo')} className="shrink-0 rounded-l-xl border-2 border-r-0 border-brand-100 bg-brand-50 px-3 text-sm font-bold text-brand-700 outline-none">
                  <option>V</option><option>E</option>
                </select>
                <input value={f.cedNum} onChange={set('cedNum')} required className={inputClass + ' min-w-0 rounded-l-none'} placeholder="12345678" />
              </div>
            </Field>
          </div>

          <h2 className="mb-5 mt-8 flex items-center gap-2 border-b border-slate-100 pb-3 font-display text-lg font-bold text-ink-900">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-gradient text-xs font-bold text-white">2</span>
            Contacto y ubicación
          </h2>
          <div className="space-y-4">
            <Field label="Número de WhatsApp">
              <div className="flex min-w-0">
                <span className="grid shrink-0 place-items-center rounded-l-xl border-2 border-r-0 border-brand-100 bg-brand-50 px-3 text-sm font-bold text-brand-700">+58</span>
                <select value={f.phonePrefix} onChange={set('phonePrefix')} className="shrink-0 border-2 border-x-0 border-brand-100 bg-white px-2 text-sm font-semibold outline-none">
                  {['412', '414', '424', '416', '426'].map((p) => <option key={p}>{p}</option>)}
                </select>
                <input value={f.phoneNum} onChange={set('phoneNum')} required maxLength={7} className={inputClass + ' min-w-0 rounded-l-none'} placeholder="1234567" />
              </div>
            </Field>
            <Field label="Dirección / ubicación del servicio">
              <textarea value={f.direccion} onChange={set('direccion')} required rows={3} className={inputClass} placeholder="Sector, calle, casa/edificio, referencia…" />
            </Field>
          </div>

          <h2 className="mb-5 mt-8 flex items-center gap-2 border-b border-slate-100 pb-3 font-display text-lg font-bold text-ink-900">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-gradient text-xs font-bold text-white">3</span>
            Detalles del servicio
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tipo de equipo">
              <select value={f.equipo} onChange={handleEquipoChange} className={inputClass}>
                {equipoOptions.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </Field>
            <Field label="Tipo de servicio">
              <select value={useApi ? f.serviceId : f.servicio} onChange={handleServicioChange} className={inputClass}>
                {servicioOptions.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Descripción del problema (opcional)">
                <textarea value={f.descripcion} onChange={set('descripcion')} rows={3} className={inputClass} placeholder="Cuéntanos qué le pasa a tu equipo…" />
              </Field>
            </div>
            <Field label="Fecha preferida">
              <input type="date" value={f.fecha} onChange={set('fecha')} required className={inputClass} />
            </Field>
            <Field label="Horario preferido">
              <select value={f.horario} onChange={set('horario')} className={inputClass}>
                {horarios.map((h) => <option key={h.v} value={h.v}>{h.t}</option>)}
              </select>
            </Field>
          </div>

          <h2 className="mb-2 mt-8 flex items-center gap-2 border-b border-slate-100 pb-3 font-display text-lg font-bold text-ink-900">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-gradient text-xs font-bold text-white">4</span>
            ¿Dónde necesitas el servicio?
          </h2>
          <p className="mb-4 text-sm text-ink-500">
            Arrastra el pin o usa tu ubicación actual. <span className="font-medium text-ink-600">Opcional</span> — puedes enviar la solicitud solo con la dirección de texto.
          </p>
          <div className="rounded-2xl bg-slate-50/80 p-3 ring-1 ring-slate-100 max-sm:mx-0 sm:p-5 [&_button]:min-h-11 [&_button]:touch-manipulation [&_button]:active:brightness-95 [&_input]:min-w-0 [&_input]:max-w-full">
            <div className="w-full min-w-0 overflow-hidden">
              <LocationPicker onLocationChange={handleLocationChange} height="300px" />
            </div>
            {locationMarked ? (
              <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-emerald-600">
                <CheckCircle2 size={16} className="shrink-0" />
                Ubicación marcada
                {location?.latitude != null && (
                  <span className="min-w-0 break-all font-normal text-ink-500">
                    ({Number(location.latitude).toFixed(5)}, {Number(location.longitude).toFixed(5)})
                  </span>
                )}
              </p>
            ) : (
              <p className="mt-3 text-xs text-ink-500">
                Mueve el pin o pulsa «Usar mi ubicación» para guardar el punto en el mapa.
              </p>
            )}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6">
            <p className="max-w-xs text-xs text-ink-500">Tu información es privada y solo se usa para coordinar tu servicio.</p>
            <Button type="submit" size="lg" disabled={loading} className="w-full sm:w-auto">{loading ? 'Enviando…' : 'Enviar solicitud →'}</Button>
          </div>
        </form>

        {/* Sidebar info */}
        <aside className="space-y-5">
          <div className="rounded-3xl border-2 border-brand-200 bg-brand-50/60 p-4 shadow-sm sm:p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-600">Precio estimado del servicio</h3>
            <div className="mt-2">
              <Price usd={displayPrice} size="lg" />
            </div>
            <p className="mt-3 text-xs text-ink-500">{displayEquipo} · {displayServicio}. Monto en Bs sujeto a la tasa oficial del BCV del día de pago.</p>
          </div>
          <div className="rounded-3xl bg-white p-4 ring-1 ring-slate-100 shadow-sm sm:p-6">
            <h3 className="mb-4 font-display font-bold text-ink-900">Información de contacto</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex gap-3"><MapPin size={18} className="mt-0.5 text-brand-500" /><span className="text-ink-700"><strong className="block text-ink-900">Área de servicio</strong>San Juan de los Morros y alrededores</span></li>
              <li className="flex gap-3"><Clock size={18} className="mt-0.5 text-brand-500" /><span className="text-ink-700"><strong className="block text-ink-900">Horario</strong>Lun a Sáb · 8:00 AM – 7:00 PM</span></li>
              <li className="flex gap-3"><Zap size={18} className="mt-0.5 text-brand-500" /><span className="text-ink-700"><strong className="block text-ink-900">Respuesta</strong>Máximo 2 horas hábiles</span></li>
            </ul>
          </div>
          <div className="rounded-3xl bg-brand-gradient p-4 text-white shadow-glow sm:p-6">
            <h3 className="font-display font-bold">¿Prefieres escribirnos?</h3>
            <p className="mt-1.5 text-sm text-brand-50/90">Si tienes una emergencia, contáctanos directo por WhatsApp.</p>
            <a href="https://wa.me/584120000000" target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-white py-2.5 font-bold text-brand-700 transition hover:bg-brand-50 active:bg-brand-50 touch-manipulation">
              <MessageCircle size={18} /> Abrir WhatsApp
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
