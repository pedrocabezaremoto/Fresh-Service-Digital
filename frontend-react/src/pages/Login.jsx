import { useState } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import AuthShell, { Field, inputClass } from '../components/AuthShell';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;
  const [searchParams] = useSearchParams();
  const verified = searchParams.get('verified') === 'true';
  const urlError = searchParams.get('error');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      if (user.role === 'ADMIN') {
        navigate('/admin');
      } else if (user.role === 'TECHNICIAN') {
        navigate('/tecnico');
      } else {
        navigate(from || '/panel'); // vuelve a donde quería ir (ej. /solicitud)
      }
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Bienvenido de vuelta"
      subtitle={
        <>
          ¿No tienes cuenta?{' '}
          <Link to="/registro" state={{ from }} className="font-semibold text-brand-600 hover:underline">
            Regístrate gratis
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {from === '/solicitud' && (
          <div className="flex items-start gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700 ring-1 ring-brand-100">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-brand-600" />
            <span>Inicia sesión para continuar con tu solicitud de servicio.</span>
          </div>
        )}
        {verified && (
          <div className="flex items-start gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:ring-emerald-500/20">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>¡Cuenta activada con éxito! Ya puedes iniciar sesión.</span>
          </div>
        )}

        {urlError && (
          <div className="flex items-start gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 ring-1 ring-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:ring-rose-500/20">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{urlError}</span>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 ring-1 ring-rose-100">
            <AlertCircle size={18} className="mt-0.5 shrink-0" /> {error}
          </div>
        )}

        <Field label="Correo electrónico">
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="tucorreo@ejemplo.com" className={inputClass}
          />
        </Field>

        <Field label="Contraseña">
          <div className="relative">
            <input
              type={show ? 'text' : 'password'} required value={password}
              onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
              className={inputClass + ' pr-12'}
            />
            <button type="button" onClick={() => setShow((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-brand-600">
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </Field>

        <div className="text-right">
          <a href="https://wa.me/584120000000?text=Hola,%20olvid%C3%A9%20mi%20contrase%C3%B1a%20de%20Fresh%20Service%20Digital" target="_blank" rel="noreferrer" className="text-xs font-semibold text-brand-600 hover:underline">
            ¿Olvidaste tu contraseña?
          </a>
        </div>

        <Button type="submit" variant="primary" className="w-full" disabled={loading}>
          {loading ? 'Ingresando…' : <>Ingresar a mi cuenta <ArrowRight size={18} /></>}
        </Button>
      </form>

      <p className="mt-5 text-center text-xs text-ink-500">
        Demos: <span className="font-semibold text-ink-700">admin@freshservice.com</span> (Admin1234) · <span className="font-semibold text-ink-700">tecnico@freshservice.com</span> (Demo1234)
      </p>
    </AuthShell>
  );
}
