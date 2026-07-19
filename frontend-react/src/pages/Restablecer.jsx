import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import AuthShell, { Field, inputClass } from '../components/AuthShell';
import Button from '../components/Button';
import { api } from '../lib/api';

export default function Restablecer() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres');
    if (password !== confirm) return setError('Las contraseñas no coinciden');
    setLoading(true);
    try {
      await api.resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate('/login?verified=true'), 1800);
    } catch (err) {
      setError(err.message || 'No se pudo restablecer la contraseña');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <AuthShell title="Enlace inválido" subtitle="Falta el token de restablecimiento">
        <div className="text-center text-sm text-ink-500">
          <p>Este enlace no es válido. Solicita uno nuevo desde la página de recuperación.</p>
          <Link to="/recuperar" className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-brand-gradient px-6 py-3 font-semibold text-white shadow-glow">
            Recuperar contraseña
          </Link>
        </div>
      </AuthShell>
    );
  }

  if (done) {
    return (
      <AuthShell title="¡Listo!" subtitle="Contraseña actualizada">
        <div className="text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-100 text-emerald-600">
            <CheckCircle2 size={34} />
          </div>
          <p className="mt-5 text-sm text-ink-500">Tu contraseña fue actualizada. Te llevamos al inicio de sesión…</p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Nueva contraseña" subtitle="Crea una contraseña segura para tu cuenta">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 ring-1 ring-rose-100">
            <AlertCircle size={18} className="mt-0.5 shrink-0" /> {error}
          </div>
        )}
        <Field label="Nueva contraseña">
          <div className="relative">
            <input type={show ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className={inputClass + ' pr-12'} />
            <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-brand-600">
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </Field>
        <Field label="Confirmar contraseña">
          <input type={show ? 'text' : 'password'} required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repite tu contraseña" className={inputClass} />
        </Field>
        <Button type="submit" variant="primary" className="w-full" disabled={loading}>
          {loading ? 'Guardando…' : <>Cambiar contraseña <ArrowRight size={18} /></>}
        </Button>
      </form>
    </AuthShell>
  );
}
