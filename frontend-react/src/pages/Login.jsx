import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import AuthShell, { Field, inputClass } from '../components/AuthShell';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
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
      navigate(user.role === 'ADMIN' ? '/admin' : '/panel');
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
          <Link to="/registro" className="font-semibold text-brand-600 hover:underline">
            Regístrate gratis
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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

        <Button type="submit" variant="primary" className="w-full" disabled={loading}>
          {loading ? 'Ingresando…' : <>Ingresar a mi cuenta <ArrowRight size={18} /></>}
        </Button>
      </form>

      <p className="mt-5 text-center text-xs text-ink-500">
        Demo admin: <span className="font-semibold text-ink-700">admin@freshservice.com</span> / Admin1234
      </p>
    </AuthShell>
  );
}
