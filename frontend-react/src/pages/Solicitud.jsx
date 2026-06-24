import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, MapPin, Clock, Zap, MessageCircle, Snowflake } from 'lucide-react';
import Button from '../components/Button';
import { Field, inputClass } from '../components/AuthShell';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const equipos = [
  { v: 'Aire de Ventana', btu: 12000 },
  { v: 'Aire Split', btu: 18000 },
  { v: 'Aire 1 Tonelada', btu: 12000 },
  { v: 'Aire 2 Toneladas', btu: 24000 },
  { v: 'Aire 3 Toneladas', btu: 36000 },
];
const servicios = ['Reparación', 'Mantenimiento Preventivo', 'Instalación', 'Recarga de Gas', 'Diagnóstico'];
const horarios = [
  { v: 'manana', t: 'Mañana (8:00 AM – 12:00 PM)', h: '09:00:00' },
  { v: 'tarde', t: 'Tarde (12:00 PM – 5:00 PM)', h: '14:00:00' },
  { v: 'noche', t: 'Noche (5:00 PM – 7:00 PM)', h: '18:00:00' },
];

export default function Solicitud() {
  const { user } = useAuth();
  const [f, setF] = useState({
    cedTipo: 'V', cedNum: '', phonePrefix: '412', phoneNum: '', direccion: '',
    equipo: 'Aire de Ventana', servicio: 'Reparación', descripcion: '', fecha: '', horario: 'manana',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [ref, setRef] = useState(null);

  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!f.fecha) return setError('Selecciona una fecha para la visita');
    setLoading(true);
    try {
      const h = horarios.find((x) => x.v === f.horario)?.h || '10:00:00';
      const eq = equipos.find((x) => x.v === f.equipo);
      const payload = {
        clientId: user.id,
        scheduledAt: `${f.fecha}T${h}.000Z`,
        brand: f.equipo,
        model: f.servicio,
        btuCapacity: eq?.btu || null,
        failureDescription: f.descripcion || 'Sin descripción adicional',
        notes: `Cédula: ${f.cedTipo}-${f.cedNum}\nWhatsApp: +58 ${f.phonePrefix}-${f.phoneNum}\nDirección: ${f.direccion}\nHorario: ${f.horario}`,
      };
      const data = await api.createAppointment(payload);
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
      <div className="bg-brand-50">
        <div className="mx-auto max-w-2xl px-5 py-20 text-center">
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
          <div className="mt-8 flex justify-center gap-3">
            <Button to="/panel" variant="primary">Ver mis solicitudes</Button>
            <Button to="/" variant="outline">Volver al inicio</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <section className="relative overflow-hidden bg-brand-950 py-14 text-white">
        <Snowflake className="absolute right-6 top-6 text-white/10" size={130} />
        <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
          <div className="text-sm text-brand-200"><Link to="/" className="hover:text-white">Inicio</Link> / Solicitar servicio</div>
          <h1 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">Solicitar Servicio a Domicilio</h1>
          <p className="mt-2 max-w-lg text-brand-100/80">Completa el formulario y coordinamos tu visita técnica.</p>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 lg:grid-cols-[1fr_340px] lg:px-8">
        <form onSubmit={handleSubmit} className="rounded-3xl bg-white p-7 ring-1 ring-slate-100 shadow-sm sm:p-9">
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
              <div className="flex">
                <select value={f.cedTipo} onChange={set('cedTipo')} className="rounded-l-xl border-2 border-r-0 border-brand-100 bg-brand-50 px-3 text-sm font-bold text-brand-700 outline-none">
                  <option>V</option><option>E</option>
                </select>
                <input value={f.cedNum} onChange={set('cedNum')} required className={inputClass + ' rounded-l-none'} placeholder="12345678" />
              </div>
            </Field>
          </div>

          <h2 className="mb-5 mt-8 flex items-center gap-2 border-b border-slate-100 pb-3 font-display text-lg font-bold text-ink-900">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-gradient text-xs font-bold text-white">2</span>
            Contacto y ubicación
          </h2>
          <div className="space-y-4">
            <Field label="Número de WhatsApp">
              <div className="flex">
                <span className="grid place-items-center rounded-l-xl border-2 border-r-0 border-brand-100 bg-brand-50 px-3 text-sm font-bold text-brand-700">+58</span>
                <select value={f.phonePrefix} onChange={set('phonePrefix')} className="border-2 border-x-0 border-brand-100 bg-white px-2 text-sm font-semibold outline-none">
                  {['412', '414', '424', '416', '426'].map((p) => <option key={p}>{p}</option>)}
                </select>
                <input value={f.phoneNum} onChange={set('phoneNum')} required maxLength={7} className={inputClass + ' rounded-l-none'} placeholder="1234567" />
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
              <select value={f.equipo} onChange={set('equipo')} className={inputClass}>
                {equipos.map((e) => <option key={e.v}>{e.v}</option>)}
              </select>
            </Field>
            <Field label="Tipo de servicio">
              <select value={f.servicio} onChange={set('servicio')} className={inputClass}>
                {servicios.map((s) => <option key={s}>{s}</option>)}
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

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6">
            <p className="max-w-xs text-xs text-ink-500">Tu información es privada y solo se usa para coordinar tu servicio.</p>
            <Button type="submit" size="lg" disabled={loading}>{loading ? 'Enviando…' : 'Enviar solicitud →'}</Button>
          </div>
        </form>

        {/* Sidebar info */}
        <aside className="space-y-5">
          <div className="rounded-3xl bg-white p-6 ring-1 ring-slate-100 shadow-sm">
            <h3 className="mb-4 font-display font-bold text-ink-900">Información de contacto</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex gap-3"><MapPin size={18} className="mt-0.5 text-brand-500" /><span className="text-ink-700"><strong className="block text-ink-900">Área de servicio</strong>San Juan de los Morros y alrededores</span></li>
              <li className="flex gap-3"><Clock size={18} className="mt-0.5 text-brand-500" /><span className="text-ink-700"><strong className="block text-ink-900">Horario</strong>Lun a Sáb · 8:00 AM – 7:00 PM</span></li>
              <li className="flex gap-3"><Zap size={18} className="mt-0.5 text-brand-500" /><span className="text-ink-700"><strong className="block text-ink-900">Respuesta</strong>Máximo 2 horas hábiles</span></li>
            </ul>
          </div>
          <div className="rounded-3xl bg-brand-gradient p-6 text-white shadow-glow">
            <h3 className="font-display font-bold">¿Prefieres escribirnos?</h3>
            <p className="mt-1.5 text-sm text-brand-50/90">Si tienes una emergencia, contáctanos directo por WhatsApp.</p>
            <a href="https://wa.me/584120000000" target="_blank" rel="noreferrer" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white py-2.5 font-bold text-brand-700 transition hover:bg-brand-50">
              <MessageCircle size={18} /> Abrir WhatsApp
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
