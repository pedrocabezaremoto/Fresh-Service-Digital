import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Snowflake, CheckCircle2 } from 'lucide-react';
import { IMG } from '../lib/images';

export default function AuthShell({ title, subtitle, children, perks }) {
  const navigate = useNavigate();

  const handleBack = (e) => {
    e.preventDefault();
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-brand-950 p-10 text-white lg:flex xl:p-14">
        <img src={IMG.comfort} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-950/90 via-brand-900/80 to-brand-800/70" />
        <div className="absolute -right-20 top-10 h-80 w-80 rounded-full bg-brand-500/20 blur-3xl" />

        <Link to="/" className="relative flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-gradient-bright shadow-glow sheen">
            <Snowflake size={22} />
          </div>
          <span className="font-display text-lg font-extrabold">Fresh Service</span>
        </Link>

        <div className="relative max-w-md">
          <h2 className="font-display text-3xl font-extrabold leading-tight xl:text-4xl">
            Tu clima ideal, <span className="text-gradient">a un clic.</span>
          </h2>
          <p className="mt-4 text-brand-100/80">
            Gestiona tus solicitudes de servicio, sigue el estado de tus
            reparaciones y agenda nuevas visitas técnicas.
          </p>
          <ul className="mt-8 space-y-3">
            {(perks || ['Solicita servicios en minutos', 'Seguimiento en tiempo real', 'Historial de tus servicios']).map((p) => (
              <li key={p} className="flex items-center gap-3 text-sm text-brand-50/90">
                <CheckCircle2 size={18} className="text-frost-300" /> {p}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative text-xs text-brand-200/70">San Juan de los Morros, Venezuela</div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center bg-brand-50 px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Link to="/" onClick={handleBack} className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 transition hover:text-brand-600 lg:hidden">
            <ArrowLeft size={16} /> Volver
          </Link>
          <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-100 sm:p-9">
            <h1 className="font-display text-2xl font-extrabold text-ink-900">{title}</h1>
            {subtitle && <p className="mt-1.5 text-sm text-ink-500">{subtitle}</p>}
            <div className="mt-6">{children}</div>
          </div>
          <Link to="/" onClick={handleBack} className="mt-6 hidden items-center justify-center gap-1.5 text-sm font-semibold text-ink-500 transition hover:text-brand-600 lg:flex">
            <ArrowLeft size={16} /> Volver
          </Link>
        </div>
      </div>
    </div>
  );
}

/* Campo de formulario reutilizable */
export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink-700">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  'w-full rounded-xl border-2 border-brand-100 bg-white px-4 py-2.5 text-[0.95rem] text-ink-900 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-200/40 placeholder:text-ink-500/50';
