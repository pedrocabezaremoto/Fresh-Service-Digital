import { MapPin, Phone, Clock, MessageCircle } from 'lucide-react';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="bg-brand-950 text-brand-200">
      <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <div className="flex flex-col items-center gap-8 md:flex-row md:items-start md:justify-between">
          <div className="text-center md:text-left">
            <Logo light size="lg" effect="float" />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-brand-300">
              Refrigeración y climatización a domicilio.
            </p>
          </div>

          <ul className="flex flex-col gap-3 text-sm">
            <li className="flex items-center gap-2.5 text-brand-300">
              <MapPin size={16} className="shrink-0 text-brand-400" />
              San Juan de los Morros, Guárico
            </li>
            <li className="flex items-center gap-2.5 text-brand-300">
              <Clock size={16} className="shrink-0 text-brand-400" />
              Lun a Sáb · 8:30 AM – 6:00 PM
            </li>
            <li className="flex items-center gap-2.5 text-brand-300">
              <Phone size={16} className="shrink-0 text-brand-400" />
              +58 412-000 0000
            </li>
            <li>
              <a href="https://wa.me/584120000000" target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1.5 font-semibold text-emerald-300 ring-1 ring-emerald-500/30 transition hover:bg-emerald-500/25">
                <MessageCircle size={15} /> WhatsApp
              </a>
            </li>
          </ul>
        </div>

        <div className="mt-8 border-t border-white/10 pt-5 text-center text-xs text-brand-300/70">
          &copy; {new Date().getFullYear()} Fresh Service Digital &middot; San Juan de los Morros, Venezuela
        </div>
      </div>
    </footer>
  );
}
