import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, MailCheck, ArrowRight } from 'lucide-react';
import AuthShell, { Field, inputClass } from '../components/AuthShell';
import Button from '../components/Button';
import { api } from '../lib/api';

export default function Recuperar() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.forgotPassword(email.trim());
      setDone(true);
    } catch (err) {
      setError(err.message || 'No se pudo procesar la solicitud');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <AuthShell title="Revisa tu correo" subtitle="Te enviamos las instrucciones">
        <div className="text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
            <MailCheck size={32} />
          </div>
          <p className="mt-5 text-sm leading-relaxed text-ink-500">
            Si <strong className="text-ink-900">{email}</strong> está registrado, te enviamos un enlace para
            restablecer tu contraseña. Revisa tu bandeja de entrada (y la carpeta de spam). El enlace vence en 1 hora.
          </p>
          <Link to="/login" className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-brand-gradient px-6 py-3 font-semibold text-white shadow-glow transition hover:shadow-glow-lg">
            Volver a iniciar sesión
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Recuperar contraseña"
      subtitle={<>¿La recordaste? <Link to="/login" className="font-semibold text-brand-600 hover:underline">Inicia sesión</Link></>}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-ink-500">Escribe tu correo y te enviaremos un enlace para crear una nueva contraseña.</p>
        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 ring-1 ring-rose-100">
            <AlertCircle size={18} className="mt-0.5 shrink-0" /> {error}
          </div>
        )}
        <Field label="Correo electrónico">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tucorreo@ejemplo.com" className={inputClass} />
        </Field>
        <Button type="submit" variant="primary" className="w-full" disabled={loading}>
          {loading ? 'Enviando…' : <>Enviar enlace <ArrowRight size={18} /></>}
        </Button>
      </form>
    </AuthShell>
  );
}
