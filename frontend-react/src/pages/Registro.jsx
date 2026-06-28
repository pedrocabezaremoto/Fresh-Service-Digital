import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, MailCheck, ArrowRight, ExternalLink } from 'lucide-react';
import AuthShell, { Field, inputClass } from '../components/AuthShell';
import Button from '../components/Button';
import { api } from '../lib/api';

function strength(pw) {
  let s = 0;
  if (pw.length >= 6) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
const stMap = [
  { w: '0%', c: 'bg-slate-200', t: '', tc: 'text-ink-500' },
  { w: '25%', c: 'bg-rose-400', t: 'Muy débil', tc: 'text-rose-600' },
  { w: '50%', c: 'bg-amber-400', t: 'Débil', tc: 'text-amber-600' },
  { w: '75%', c: 'bg-brand-400', t: 'Aceptable', tc: 'text-brand-600' },
  { w: '100%', c: 'bg-emerald-500', t: 'Segura', tc: 'text-emerald-600' },
];

export default function Registro() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', confirm: '' });
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null); // { activationUrl }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const st = stMap[form.password ? strength(form.password) : 0];

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres');
    if (form.password !== form.confirm) return setError('Las contraseñas no coinciden');
    setLoading(true);
    try {
      const phone = `+58${form.phone.replace(/\D/g, '')}`;
      const data = await api.register({
        email: form.email.trim(), password: form.password,
        firstName: form.firstName.trim(), lastName: form.lastName.trim(), phone,
      });
      setDone({ activationUrl: data.activationUrl });
    } catch (err) {
      setError(err.message || 'No se pudo crear la cuenta');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <AuthShell title="¡Casi listo!" subtitle="Verifica tu cuenta para empezar">
        <div className="text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
            <MailCheck size={32} />
          </div>
          <p className="mt-5 text-sm leading-relaxed text-ink-500">
            Enviamos un enlace de activación a tu correo electrónico. Por favor, revisa tu bandeja de entrada (y la carpeta de spam si es necesario) y haz clic en el enlace para activar tu cuenta.
          </p>
          <Link to="/login" className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-brand-gradient px-6 py-3 font-semibold text-white shadow-glow transition hover:shadow-glow-lg">
            Ir al inicio de sesión
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Crea tu cuenta"
      subtitle={<>¿Ya tienes una? <Link to="/login" className="font-semibold text-brand-600 hover:underline">Inicia sesión</Link></>}
      perks={['Agenda servicios sin llamadas', 'Sigue el estado de tus reparaciones', 'Tu historial siempre a mano']}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 ring-1 ring-rose-100">
            <AlertCircle size={18} className="mt-0.5 shrink-0" /> {error}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nombre"><input required value={form.firstName} onChange={set('firstName')} className={inputClass} placeholder="Pedro" /></Field>
          <Field label="Apellido"><input required value={form.lastName} onChange={set('lastName')} className={inputClass} placeholder="Cabeza" /></Field>
        </div>
        <Field label="Correo electrónico">
          <input type="email" required value={form.email} onChange={set('email')} className={inputClass} placeholder="tucorreo@ejemplo.com" />
        </Field>
        <Field label="WhatsApp">
          <div className="flex">
            <span className="grid place-items-center rounded-l-xl border-2 border-r-0 border-brand-100 bg-brand-50 px-3 text-sm font-bold text-brand-700">+58</span>
            <input required value={form.phone} onChange={set('phone')} maxLength={10} className={inputClass + ' rounded-l-none'} placeholder="4120000000" />
          </div>
        </Field>
        <Field label="Contraseña">
          <div className="relative">
            <input type={show ? 'text' : 'password'} required value={form.password} onChange={set('password')} className={inputClass + ' pr-12'} placeholder="Mínimo 6 caracteres" />
            <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-brand-600">
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {form.password && (
            <div className="mt-2">
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div className={`h-full rounded-full transition-all ${st.c}`} style={{ width: st.w }} />
              </div>
              <span className={`mt-1 block text-xs font-semibold ${st.tc}`}>{st.t}</span>
            </div>
          )}
        </Field>
        <Field label="Confirmar contraseña">
          <input type={show ? 'text' : 'password'} required value={form.confirm} onChange={set('confirm')} className={inputClass} placeholder="Repite tu contraseña" />
        </Field>
        <Button type="submit" variant="primary" className="w-full" disabled={loading}>
          {loading ? 'Creando cuenta…' : <>Crear mi cuenta <ArrowRight size={18} /></>}
        </Button>
      </form>
    </AuthShell>
  );
}
