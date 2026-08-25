import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import Button from '../components/Button';
import HeroCarousel from '../components/HeroCarousel';
import TickerBar from '../components/TickerBar';
import Price from '../components/Price';
import { imgObjectClass } from '../lib/images';
import { useSiteImages } from '../context/SiteImagesContext';
import { api, API_BASE } from '../lib/api';

export default function Home() {
  const { images } = useSiteImages();
  const [cards, setCards] = useState([]);

  useEffect(() => {
    let cancelled = false;
    api.getEquipmentTypes()
      .then((types) => {
        if (cancelled) return;
        const validTypes = Array.isArray(types) ? types : [];
        const result = validTypes
          .filter((t) => t.serviceCount > 0)
          .map((t) => ({
            key: t.slug,
            title: t.label,
            desc: t.description || '',
            priceFrom: t.minPriceUsd,
            hidePrice: t.minPriceUsd == null,
            img: t.imageUrl ? `${API_BASE}${t.imageUrl}` : images.maintenance,
          }));
        setCards(result);
      })
      .catch(() => { if (!cancelled) setCards([]); });
    return () => { cancelled = true; };
  }, [images]);

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
            <HeroCarousel />
          </div>
        </div>
      </section>

      {/* ===== SERVICIOS ===== */}
      <section className="bg-white py-14 lg:py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <h2 className="text-center font-display text-3xl font-extrabold text-ink-900 sm:text-4xl">
            Nuestros Servicios
          </h2>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* ===== TICKER / CONFIANZA ===== */}
      <TickerBar />
    </div>
  );
}
