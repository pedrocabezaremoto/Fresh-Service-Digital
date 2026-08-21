import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Zap, Wrench, ShieldCheck, MapPin } from 'lucide-react';
import Button from '../components/Button';
import Price from '../components/Price';
import { imgObjectClass } from '../lib/images';
import { useSiteImages } from '../context/SiteImagesContext';
import { api } from '../lib/api';

const SERVICE_CARDS = [
  {
    key: 'ventana',
    title: 'Aires de Ventana',
    types: ['VENTANA'],
    fallbackUsd: 25,
    desc: 'Reparación, mantenimiento e instalación de unidades de ventana.',
    imgKey: 'maintenance',
  },
  {
    key: 'split',
    title: 'Aires Split',
    types: ['SPLIT'],
    fallbackUsd: 35,
    desc: 'Servicio integral para mini y maxi split: interior y exterior.',
    imgKey: 'install',
  },
  {
    key: 'toneladas',
    title: 'Aires por Toneladas',
    types: ['TONELADA_1', 'TONELADA_2', 'TONELADA_3'],
    fallbackUsd: 50,
    desc: 'Equipos de 3 a 5 toneladas para locales y comercios.',
    imgKey: 'repair',
    hidePrice: true,
  },
];

const TRUST_ITEMS = [
  { icon: Zap, label: 'Respuesta el mismo día' },
  { icon: Wrench, label: 'Técnicos certificados' },
  { icon: ShieldCheck, label: 'Garantía incluida' },
  { icon: MapPin, label: 'San Juan de los Morros' },
];

function minPriceForTypes(services, types, fallback) {
  const prices = services
    .filter((s) => types.includes(s.equipmentType) && Number.isFinite(Number(s.priceUsd)))
    .map((s) => Number(s.priceUsd));
  return prices.length ? Math.min(...prices) : fallback;
}

export default function Home() {
  const { images } = useSiteImages();
  const [apiServices, setApiServices] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api.getServices()
      .then((list) => {
        if (cancelled) return;
        setApiServices(Array.isArray(list) && list.length ? list : null);
      })
      .catch(() => { if (!cancelled) setApiServices(null); });
    return () => { cancelled = true; };
  }, []);

  const cards = useMemo(() => {
    const list = apiServices || [];
    return SERVICE_CARDS.map((card) => ({
      ...card,
      img: images[card.imgKey],
      priceFrom: minPriceForTypes(list, card.types, card.fallbackUsd),
    }));
  }, [apiServices, images]);

  return (
    <div className="overflow-hidden">
      {/* ===== HERO ===== */}
      <section className="relative flex min-h-[calc(100vh-4rem)] items-center bg-gradient-to-br from-brand-950 via-brand-900 to-brand-950">
        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-10 px-5 py-10 lg:grid-cols-2 lg:gap-12 lg:px-8 lg:py-12">
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-100 ring-1 ring-white/15">
              San Juan de los Morros
            </span>
            <h1 className="mt-5 font-display text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-5xl">
              El servicio que<br />
              <span className="font-extrabold text-gradient text-shimmer">tu hogar merece.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-sm font-normal leading-snug tracking-wide text-brand-100/80 sm:text-base lg:mx-0">
              Reparación, mantenimiento e instalación de aires acondicionados a domicilio.
            </p>
            <div className="mt-8 flex justify-center lg:justify-start">
              <Button to="/solicitud" size="lg" variant="bright">
                Solicitar servicio <ArrowRight size={18} />
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="group relative overflow-hidden rounded-[2rem] ring-1 ring-white/15 shadow-glow-lg transition duration-300 ease-out hover:-translate-y-2 hover:shadow-glow-lg hover:ring-frost-300/40 will-change-transform">
              <img
                src={images.heroTech}
                alt="Técnico de refrigeración trabajando"
                className="h-[320px] w-full object-cover transition duration-500 ease-out group-hover:scale-[1.04] sm:h-[420px] lg:h-[min(480px,calc(100vh-14rem))]"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-950/60 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* ===== SERVICIOS ===== */}
      <section className="bg-white py-14 lg:py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <h2 className="text-center font-display text-3xl font-extrabold text-ink-900 sm:text-4xl">
            Nuestros Servicios
          </h2>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {cards.map((s) => (
              <div
                key={s.key}
                className="group overflow-hidden rounded-3xl bg-white ring-1 ring-slate-100 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-glow"
              >
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={s.img}
                    alt={s.title}
                    loading="lazy"
                    className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${imgObjectClass(s.img)}`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-950/70 via-brand-950/10 to-transparent" />
                  <h3 className="absolute bottom-3 left-4 font-display text-xl font-bold text-white">{s.title}</h3>
                </div>
                <div className="p-5">
                  <p className="truncate text-sm text-ink-500">{s.desc}</p>
                  <div className={`mt-4 flex items-end gap-3 border-t border-slate-100 pt-4 ${s.hidePrice ? 'justify-end' : 'justify-between'}`}>
                    {!s.hidePrice && (
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">Desde</div>
                        <Price usd={s.priceFrom} />
                      </div>
                    )}
                    <Button to="/solicitud" size="sm">
                      Solicitar <ArrowRight size={15} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CONFIANZA ===== */}
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
    </div>
  );
}
