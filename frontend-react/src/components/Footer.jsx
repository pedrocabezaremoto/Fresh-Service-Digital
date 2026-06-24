import { Link } from 'react-router-dom';
import { Snowflake, MapPin, Phone, Clock, MessageCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-brand-950 text-brand-200">
      <div className="mx-auto max-w-7xl px-5 pb-10 pt-16 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient-bright text-white shadow-glow">
                <Snowflake size={20} />
              </div>
              <span className="font-display text-lg font-extrabold text-white">
                Fresh Service
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-brand-300">
              Servicio técnico de refrigeración y climatización a domicilio.
              Rapidez, calidad y garantía en cada visita.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-brand-400">
              Servicios
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/catalogo" className="text-brand-300 transition hover:text-white">Aires de Ventana</Link></li>
              <li><Link to="/catalogo" className="text-brand-300 transition hover:text-white">Aires Split</Link></li>
              <li><Link to="/catalogo" className="text-brand-300 transition hover:text-white">Aires por Toneladas</Link></li>
              <li><span className="text-brand-300/60">Neveras (próximamente)</span></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-brand-400">
              Cuenta
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/login" className="text-brand-300 transition hover:text-white">Iniciar sesión</Link></li>
              <li><Link to="/registro" className="text-brand-300 transition hover:text-white">Crear cuenta</Link></li>
              <li><Link to="/solicitud" className="text-brand-300 transition hover:text-white">Solicitar servicio</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-brand-400">
              Contacto
            </h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2.5 text-brand-300"><MapPin size={16} className="text-brand-400" /> San Juan de los Morros, Guárico</li>
              <li className="flex items-center gap-2.5 text-brand-300"><Clock size={16} className="text-brand-400" /> Lun a Sáb · 8:00 AM – 7:00 PM</li>
              <li className="flex items-center gap-2.5 text-brand-300"><Phone size={16} className="text-brand-400" /> +58 412-000 0000</li>
              <li><a href="https://wa.me/584120000000" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1.5 font-semibold text-emerald-300 ring-1 ring-emerald-500/30 transition hover:bg-emerald-500/25"><MessageCircle size={15} /> WhatsApp</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-center text-xs text-brand-300/70">
          © {new Date().getFullYear()} Fresh Service Digital · San Juan de los Morros, Venezuela
        </div>
      </div>
    </footer>
  );
}
