import { useEffect, useState } from 'react';
import { Zap, Wrench, ShieldCheck, MapPin } from 'lucide-react';
import { api } from '../lib/api';

const TRUST_ITEMS = [
  { icon: Zap, label: 'Respuesta el mismo día' },
  { icon: Wrench, label: 'Técnicos certificados' },
  { icon: ShieldCheck, label: 'Garantía incluida' },
  { icon: MapPin, label: 'San Juan de los Morros' },
];

export default function TickerBar() {
  const [messages, setMessages] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.getTicker()
      .then((data) => {
        setMessages(Array.isArray(data) ? data : []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  if (!loaded) return null;

  if (messages.length === 0) {
    return (
      <section className="bg-slate-100 py-4 dark:bg-slate-800">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-5 gap-y-2 px-5 text-center text-sm font-medium text-ink-700 lg:px-8">
          {TRUST_ITEMS.map((item, i) => (
            <span key={item.label} className="inline-flex items-center gap-1.5">
              {i > 0 && <span className="select-none text-ink-400" aria-hidden>·</span>}
              <item.icon size={15} className="text-brand-600" />
              {item.label}
            </span>
          ))}
        </div>
      </section>
    );
  }

  const segment = messages.map((m) => m.text).join('     ·     ') + '     ·     ';
  const repeats = Math.max(2, Math.ceil(200 / segment.length));
  const copy = segment.repeat(repeats);

  return (
    <section className="overflow-hidden bg-brand-600 py-2.5 dark:bg-brand-700">
      <div className="ticker-inner whitespace-nowrap text-sm font-semibold text-white">
        <span className="shrink-0">{copy}</span>
        <span className="shrink-0">{copy}</span>
      </div>
    </section>
  );
}
