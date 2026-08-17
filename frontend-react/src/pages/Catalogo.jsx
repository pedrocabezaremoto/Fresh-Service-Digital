import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wind, ThermometerSnowflake, Wrench, CheckCircle2, Snowflake, ArrowRight, Loader2 } from 'lucide-react';
import Button from '../components/Button';
import Price from '../components/Price';
import { imgObjectClass } from '../lib/images';
import { useSiteImages } from '../context/SiteImagesContext';
import { api } from '../lib/api';
import { CATEGORY_LABELS, EQUIPMENT_LABELS } from '../lib/services';

function equipmentMeta(images) {
  return {
    VENTANA: { tag: 'Tipo 1', title: 'Aires de Ventana', icon: Wind, img: images.maintenance },
    SPLIT: { tag: 'Tipo 2', title: 'Aires Split', icon: ThermometerSnowflake, img: images.install },
    TONELADA_1: { tag: 'Tipo 3', title: 'Aire 1 Tonelada', icon: Wrench, img: images.repair },
    TONELADA_2: { tag: 'Tipo 4', title: 'Aire 2 Toneladas', icon: Wrench, img: images.repair },
    TONELADA_3: { tag: 'Tipo 5', title: 'Aire 3 Toneladas', icon: Wrench, img: images.repair },
    GENERAL: { tag: 'General', title: 'Servicios generales', icon: Wrench, img: images.repair },
  };
}

function fallbackGroups(images) {
  return [
  {
    tag: 'Tipo 1', title: 'Aires de Ventana', icon: Wind, img: images.maintenance,
    cards: [
      { name: 'Reparación', sub: 'Diagnóstico + Reparación', price: 40, points: ['Diagnóstico completo', 'Revisión eléctrica y mecánica', 'Prueba de funcionamiento', 'Informe técnico'] },
      { name: 'Mantenimiento', sub: 'Limpieza + Revisión', price: 25, points: ['Lavado de filtros y tinas', 'Limpieza de serpentines', 'Revisión del compresor', 'Recarga de gas (si aplica)'] },
    ],
  },
  {
    tag: 'Tipo 2', title: 'Aires Split', icon: ThermometerSnowflake, img: images.install,
    cards: [
      { name: 'Reparación', sub: 'Mini + Maxi Split', price: 55, points: ['Diagnóstico interior y exterior', 'Revisión de plaquetas', 'Verificación de tuberías', 'Recarga y verificación de gas'] },
      { name: 'Mantenimiento', sub: 'Preventivo + Correctivo', price: 35, points: ['Desmontaje y lavado a presión', 'Limpieza de drenaje', 'Revisión del condensador', 'Control de temperatura'] },
    ],
  },
  {
    tag: 'Tipo 3', title: 'Aires por Toneladas', icon: Wrench, img: images.repair,
    cards: [
      { name: '1 Tonelada', sub: 'Hasta 30 m²', price: 50, points: ['Cuartos y oficinas pequeñas', 'Recarga R-22 / R-410A', 'Instalación de soportes', 'Mantenimiento preventivo'] },
      { name: '2 Toneladas', sub: 'Hasta 55 m²', price: 75, popular: true, points: ['Salas y oficinas medianas', 'Revisión completa del sistema', 'Recarga y hermeticidad', 'Limpieza profunda'] },
      { name: '3 Toneladas', sub: 'Hasta 80 m²', price: 100, points: ['Locales y espacios abiertos', 'Revisión trifásica', 'Línea dedicada', 'Diagnóstico de compresor'] },
    ],
  },
];
}

function CatalogCard({ name, sub, price, points, popular, img, title }) {
  return (
    <div className={`group relative flex flex-col overflow-hidden rounded-3xl bg-white ring-1 transition hover:-translate-y-1 hover:shadow-glow ${popular ? 'ring-2 ring-brand-400 shadow-glow' : 'ring-slate-100 shadow-sm'}`}>
      <div className="relative h-40 overflow-hidden">
        <img src={img} alt={title} loading="lazy" className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${imgObjectClass(img)}`} />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-950/60 via-brand-950/10 to-transparent" />
        {popular && (
          <div className="absolute right-3 top-3 rounded-full bg-brand-gradient px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-glow">★ Más solicitado</div>
        )}
        <h3 className="absolute bottom-3 left-4 font-display text-lg font-bold text-white drop-shadow">{name}</h3>
      </div>
      <div className="flex flex-1 flex-col p-6">
        {sub && <p className="text-sm font-semibold text-brand-600">{sub}</p>}
        {points?.length > 0 && (
          <ul className="mt-5 flex-1 space-y-2.5">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-2 text-sm text-ink-700">
                <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-brand-500" /> {p}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
          <Price usd={price} />
          <Button to="/solicitud" size="sm">Solicitar</Button>
        </div>
      </div>
    </div>
  );
}

export default function Catalogo() {
  const { images } = useSiteImages();
  const [apiServices, setApiServices] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.getServices()
      .then((list) => {
        if (cancelled) return;
        setApiServices(Array.isArray(list) && list.length ? list : null);
      })
      .catch(() => { if (!cancelled) setApiServices(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const apiGroups = useMemo(() => {
    if (!apiServices) return null;
    const order = ['VENTANA', 'SPLIT', 'TONELADA_1', 'TONELADA_2', 'TONELADA_3', 'GENERAL'];
    const byEq = {};
    apiServices.forEach((s) => {
      (byEq[s.equipmentType] ||= []).push(s);
    });
    return order
      .filter((eq) => byEq[eq]?.length)
      .map((eq, i) => {
        const meta = equipmentMeta(images)[eq] || { tag: `Tipo ${i + 1}`, title: EQUIPMENT_LABELS[eq] || eq, icon: Wrench, img: images.repair };
        return {
          key: eq,
          ...meta,
          cards: byEq[eq].map((s) => ({
            name: s.name,
            sub: s.description || CATEGORY_LABELS[s.category] || '',
            price: s.priceUsd,
            points: s.description ? [s.description] : [],
          })),
        };
      });
  }, [apiServices, images]);

  const groups = apiGroups || fallbackGroups(images);

  return (
    <div className="bg-white">
      <section className="relative overflow-hidden bg-brand-950 py-16 text-white">
        <div className="absolute -right-20 -top-10 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" />
        <Snowflake className="absolute right-6 top-6 text-white/10" size={140} />
        <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
          <div className="text-sm text-brand-200">
            <Link to="/" className="hover:text-white">Inicio</Link> / Catálogo
          </div>
          <h1 className="mt-3 font-display text-4xl font-extrabold sm:text-5xl">Catálogo de Servicios</h1>
          <p className="mt-3 max-w-xl text-brand-100/80">
            Soluciones profesionales de climatización a domicilio. Cobertura en San
            Juan de los Morros y alrededores · Todas las marcas.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-20 px-5 py-20 lg:px-8">
        {loading && !apiGroups ? (
          <div className="grid place-items-center py-16 text-brand-400"><Loader2 className="animate-spin" size={36} /></div>
        ) : groups.map((g) => (
          <section key={g.key || g.title}>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="inline-block rounded-full bg-brand-50 px-3 py-0.5 text-xs font-bold uppercase tracking-wide text-brand-600 ring-1 ring-brand-100">{g.tag}</span>
                <h2 className="mt-1 font-display text-2xl font-extrabold text-ink-900">{g.title}</h2>
              </div>
            </div>

            <div className={`mt-8 grid gap-6 ${g.cards.length >= 3 ? 'lg:grid-cols-3' : 'md:grid-cols-2'}`}>
              {g.cards.map((c) => (
                <CatalogCard key={c.name} {...c} img={g.img} title={g.title} />
              ))}
            </div>
          </section>
        ))}

        <section className="overflow-hidden rounded-3xl bg-brand-50 ring-1 ring-brand-100">
          <div className="grid items-center gap-6 md:grid-cols-2">
            <div className="p-8 lg:p-12">
              <span className="inline-block rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-600 ring-1 ring-brand-100">Próximamente · Fase 2</span>
              <h2 className="mt-4 font-display text-2xl font-extrabold text-ink-900">Neveras & Refrigeradores</h2>
              <p className="mt-3 text-ink-500">Servicio técnico especializado para neveras domésticas y comerciales. Estamos preparando este módulo para ti.</p>
            </div>
            <img src={images.appliance} alt="Electrodomésticos" className="h-full max-h-72 w-full object-cover" />
          </div>
        </section>

        <div className="rounded-3xl bg-brand-gradient px-8 py-12 text-center text-white shadow-glow-lg">
          <h2 className="font-display text-2xl font-extrabold sm:text-3xl">¿Encontraste el servicio que necesitas?</h2>
          <p className="mt-3 text-brand-50/90">Agéndalo en minutos y recibe a un técnico certificado en tu domicilio.</p>
          <div className="mt-6 flex justify-center">
            <Button to="/solicitud" size="lg" variant="dark">Solicitar servicio <ArrowRight size={18} /></Button>
          </div>
        </div>
      </div>
    </div>
  );
}
