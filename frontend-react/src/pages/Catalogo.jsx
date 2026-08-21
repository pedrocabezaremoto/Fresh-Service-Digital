import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Loader2 } from 'lucide-react';
import Button from '../components/Button';
import Price from '../components/Price';
import { imgObjectClass } from '../lib/images';
import { useSiteImages } from '../context/SiteImagesContext';
import { api } from '../lib/api';
import { CATEGORY_LABELS } from '../lib/services';

const CATEGORY_ORDER = ['MANTENIMIENTO', 'REPARACION', 'INSTALACION', 'RECARGA', 'DIAGNOSTICO', 'OTRO'];

const SECTION_DEFS = [
  {
    key: 'ventana',
    title: 'Aires de Ventana',
    subtitle: 'Unidades de ventana de todas las marcas',
    types: ['VENTANA'],
    imgKey: 'maintenance',
    mode: 'list',
  },
  {
    key: 'split',
    title: 'Aires Split',
    subtitle: 'Sistemas mini y maxi split, interior y exterior',
    types: ['SPLIT'],
    imgKey: 'install',
    mode: 'list',
  },
  {
    key: 'toneladas',
    title: 'Aires por Toneladas',
    subtitle: 'Equipos de 3 a 5 toneladas para comercios y locales. Cotización personalizada.',
    types: ['TONELADA_1', 'TONELADA_2', 'TONELADA_3'],
    imgKey: 'repair',
    mode: 'tonnage',
  },
];

const FALLBACK_DESC = {
  MANTENIMIENTO: 'Limpieza de filtros, tinas y serpentines',
  REPARACION: 'Diagnóstico y corrección de fallas',
  INSTALACION: 'Montaje, vacío y puesta en marcha',
  RECARGA: 'Recarga R-22 / R-410A y prueba de fugas',
  DIAGNOSTICO: 'Revisión técnica con informe',
};

const FALLBACK_PRICES = {
  VENTANA: { MANTENIMIENTO: 25, REPARACION: 40, DIAGNOSTICO: 15, RECARGA: 30, INSTALACION: 45 },
  SPLIT: { MANTENIMIENTO: 35, REPARACION: 55, DIAGNOSTICO: 20, RECARGA: 40, INSTALACION: 70 },
  TONELADA_1: { MANTENIMIENTO: 50, REPARACION: 75, DIAGNOSTICO: 30, RECARGA: 55, INSTALACION: 90 },
  TONELADA_2: { MANTENIMIENTO: 75, REPARACION: 110, DIAGNOSTICO: 40, RECARGA: 80, INSTALACION: 130 },
  TONELADA_3: { MANTENIMIENTO: 100, REPARACION: 150, DIAGNOSTICO: 55, RECARGA: 105, INSTALACION: 170 },
};

function normalizeCategory(category) {
  if (category === 'RECARGA_GAS') return 'RECARGA';
  return category;
}

function categoryLabel(category) {
  const key = normalizeCategory(category);
  return CATEGORY_LABELS[key] || category || 'Servicio';
}

/** Descripción útil: no repetir el nombre; máximo 60 caracteres. */
function usefulDesc(name, description, category) {
  const d = (description || '').trim();
  if (!d) return '';
  const candidates = [name, categoryLabel(category), CATEGORY_LABELS[normalizeCategory(category)]]
    .filter(Boolean)
    .map((s) => s.trim().toLowerCase());
  if (candidates.includes(d.toLowerCase())) return '';
  if (d.length > 60) return `${d.slice(0, 59)}…`;
  return d;
}

function fallbackServices() {
  const list = [];
  Object.entries(FALLBACK_PRICES).forEach(([equipmentType, byCat]) => {
    Object.entries(byCat).forEach(([category, priceUsd]) => {
      list.push({
        id: `${equipmentType}-${category}`,
        name: categoryLabel(category),
        category,
        equipmentType,
        priceUsd,
        description: FALLBACK_DESC[category] || '',
        isActive: true,
      });
    });
  });
  return list;
}

function minUsd(services) {
  const prices = services.map((s) => Number(s.priceUsd)).filter(Number.isFinite);
  return prices.length ? Math.min(...prices) : null;
}

function AccordionPanel({ open, children }) {
  return (
    <div
      className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
        open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
      }`}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

function ListTable({ rows }) {
  return (
    <>
      <div className="divide-y divide-slate-100 md:hidden">
        {rows.map((row) => (
          <div key={row.id} className="flex flex-col gap-2 px-4 py-4 transition-colors hover:bg-brand-50">
            <div className="font-display font-bold text-ink-900">{row.label}</div>
            {row.desc ? <p className="text-sm text-ink-500">{row.desc}</p> : null}
            <div className="flex items-center justify-between gap-3">
              <Price usd={row.price} size="sm" />
              <Button to="/solicitud" size="sm">Solicitar</Button>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wide text-ink-500">
              <th className="px-5 py-3">Servicio</th>
              <th className="px-5 py-3">Descripción</th>
              <th className="px-5 py-3">Precio</th>
              <th className="px-5 py-3"><span className="sr-only">Acción</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-50 last:border-0 transition-colors hover:bg-brand-50">
                <td className="px-5 py-4 font-display font-bold text-ink-900">{row.label}</td>
                <td className="px-5 py-4 text-sm text-ink-500">{row.desc || '—'}</td>
                <td className="px-5 py-4"><Price usd={row.price} size="sm" /></td>
                <td className="px-5 py-4 text-right">
                  <Button to="/solicitud" size="sm">Solicitar</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function TonnageTable({ groups }) {
  const quoteNote =
    'Los precios para equipos comerciales se cotizan según capacidad y condiciones del local. Regístrate o contáctanos para una cotización personalizada.';

  return (
    <>
      <div className="divide-y divide-slate-100 md:hidden">
        {groups.map((g) => (
          <div key={g.category} className="flex items-start justify-between gap-3 px-4 py-4 transition-colors hover:bg-brand-50">
            <div className="min-w-0">
              <div className="font-display font-bold text-ink-900">{g.label}</div>
              {g.desc ? <p className="mt-1 text-sm text-ink-500">{g.desc}</p> : null}
            </div>
            <Button to="/solicitud" size="sm">Solicitar</Button>
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 text-xs font-bold uppercase tracking-wide text-ink-500">
              <th className="px-5 py-3">Servicio</th>
              <th className="px-5 py-3"><span className="sr-only">Acción</span></th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <tr key={g.category} className="border-b border-slate-50 last:border-0 transition-colors hover:bg-brand-50">
                <td className="px-5 py-4">
                  <div className="font-display font-bold text-ink-900">{g.label}</div>
                  {g.desc ? <div className="mt-0.5 text-xs text-ink-500">{g.desc}</div> : null}
                </td>
                <td className="px-5 py-4 text-right">
                  <Button to="/solicitud" size="sm">Solicitar</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="px-5 py-4 text-xs leading-relaxed text-ink-500">{quoteNote}</p>
    </>
  );
}

export default function Catalogo() {
  const { images } = useSiteImages();
  const [apiServices, setApiServices] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openKey, setOpenKey] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api.getServices()
      .then((list) => {
        if (cancelled) return;
        const active = Array.isArray(list) ? list.filter((s) => s.isActive === true) : [];
        setApiServices(active.length ? active : null);
      })
      .catch(() => { if (!cancelled) setApiServices(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const sections = useMemo(() => {
    const source = apiServices || fallbackServices();
    return SECTION_DEFS.map((def) => {
      const items = source.filter((s) => def.types.includes(s.equipmentType) && s.isActive !== false);
      if (def.mode === 'tonnage') {
        const byCat = {};
        items.forEach((s) => {
          const cat = normalizeCategory(s.category);
          if (!byCat[cat]) {
            byCat[cat] = {
              category: cat,
              label: categoryLabel(cat),
              desc: usefulDesc(s.name, s.description, cat),
            };
          }
          if (!byCat[cat].desc) byCat[cat].desc = usefulDesc(s.name, s.description, cat);
        });
        const groups = CATEGORY_ORDER.filter((c) => byCat[c]).map((c) => byCat[c]);
        return {
          ...def,
          img: images[def.imgKey],
          count: groups.length,
          minPrice: null,
          groups,
        };
      }

      const orderIndex = (s) => {
        const i = CATEGORY_ORDER.indexOf(normalizeCategory(s.category));
        return i === -1 ? 99 : i;
      };
      const rows = [...items]
        .sort((a, b) => orderIndex(a) - orderIndex(b) || String(a.name).localeCompare(String(b.name)))
        .map((s) => ({
          id: s.id || `${s.equipmentType}-${s.category}-${s.name}`,
          label: categoryLabel(s.category) || s.name,
          desc: usefulDesc(s.name, s.description, s.category),
          price: Number(s.priceUsd),
        }));
      return {
        ...def,
        img: images[def.imgKey],
        count: rows.length,
        minPrice: minUsd(items),
        rows,
      };
    }).filter((s) => (s.rows?.length || s.groups?.length));
  }, [apiServices, images]);

  function toggle(key) {
    setOpenKey((prev) => (prev === key ? null : key));
  }

  return (
    <div className="bg-white">
      <section className="border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
          <nav className="text-sm text-ink-500">
            <Link to="/" className="hover:text-brand-600">Inicio</Link>
            <span className="mx-1.5">/</span>
            <span className="text-ink-700">Servicios</span>
          </nav>
          <h1 className="mt-3 font-display text-3xl font-extrabold text-ink-900 sm:text-4xl">
            Catálogo de Servicios
          </h1>
          <p className="mt-2 text-ink-500">Cobertura en San Juan de los Morros</p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        {loading && !apiServices ? (
          <div className="grid place-items-center py-16 text-brand-400">
            <Loader2 className="animate-spin" size={36} />
          </div>
        ) : (
          <div className="space-y-4">
            {sections.map((s) => {
              const open = openKey === s.key;
              return (
                <section
                  key={s.key}
                  className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm"
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => toggle(s.key)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggle(s.key);
                      }
                    }}
                    aria-expanded={open}
                    className="flex w-full cursor-pointer items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-brand-50 sm:gap-5 sm:px-5"
                  >
                    <img
                      src={s.img}
                      alt={s.title}
                      className={`h-16 w-16 shrink-0 rounded-xl object-cover ring-1 ring-slate-100 sm:h-20 sm:w-20 ${imgObjectClass(s.img)}`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-display text-lg font-extrabold text-ink-900 sm:text-xl">{s.title}</h2>
                        <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-brand-700 ring-1 ring-brand-100">
                          {s.count} {s.count === 1 ? 'servicio' : 'servicios'}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-ink-500">{s.subtitle}</p>
                      {s.mode !== 'tonnage' && s.minPrice != null && (
                        <div className="mt-2 flex items-baseline gap-1.5">
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">Desde</span>
                          <Price usd={s.minPrice} size="sm" />
                        </div>
                      )}
                    </div>
                    <ChevronDown
                      size={22}
                      className={`shrink-0 text-brand-600 transition-transform duration-300 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}
                    />
                  </div>

                  <AccordionPanel open={open}>
                    <div className="border-t border-slate-100">
                      {s.mode === 'tonnage' ? <TonnageTable groups={s.groups} /> : <ListTable rows={s.rows} />}
                    </div>
                  </AccordionPanel>
                </section>
              );
            })}
          </div>
        )}

        <div className="mt-10 rounded-2xl bg-brand-50 px-6 py-8 text-center ring-1 ring-brand-100">
          <p className="font-display text-lg font-bold text-ink-900">¿Encontraste el servicio que necesitas?</p>
          <p className="mt-1 text-sm text-ink-500">Agéndalo en minutos. Un técnico certificado va a tu domicilio.</p>
          <div className="mt-5 flex justify-center">
            <Button to="/solicitud" size="md">Solicitar servicio</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
