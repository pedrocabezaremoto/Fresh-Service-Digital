import { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';

const MES_FULL = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function easeOutQuad(t) {
  return t * (2 - t);
}

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => (
    typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ));
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduced(mq.matches);
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);
  return reduced;
}

export function useCountUp(target, duration = 800) {
  const reduced = usePrefersReducedMotion();
  const [n, setN] = useState(reduced ? target : 0);

  useEffect(() => {
    const goal = Number(target) || 0;
    if (reduced) {
      setN(goal);
      return undefined;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      setN(Math.round(goal * easeOutQuad(t)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, reduced]);

  return n;
}

function smoothPath(pts) {
  if (!pts.length) return '';
  if (pts.length === 1) return `M ${pts[0][0]} ${pts[0][1]}`;
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i === 0 ? i : i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${p2[0]} ${p2[1]}`;
  }
  return d;
}

export function Sparkline({ values = [], color = '#0ea5e9' }) {
  const w = 80;
  const h = 24;
  const nums = values.length ? values : [0];
  const max = Math.max(...nums, 1);
  const pts = nums.map((v, i) => {
    const x = nums.length === 1 ? w / 2 : (i / (nums.length - 1)) * (w - 4) + 2;
    const y = h - 3 - (v / max) * (h - 6);
    return [x, y];
  });
  const d = smoothPath(pts);

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="mt-2 block" aria-hidden>
      <path d={d} fill="none" stroke={color} strokeOpacity="0.35" strokeWidth="4" strokeLinecap="round" />
      <path d={d} fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function KPI({ icon: Icon, value, label, color, accent, onClick, active, hint, sparkline }) {
  const shown = useCountUp(value, 800);
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      style={{ background: `linear-gradient(135deg, ${accent}22, #ffffff 62%)` }}
      className={`group relative w-full min-h-11 overflow-hidden rounded-2xl p-4 text-left shadow-sm backdrop-blur transition duration-300 sm:p-5 touch-manipulation ${
        onClick ? 'cursor-pointer hover:-translate-y-1 hover:shadow-glow-lg active:scale-[0.99] active:shadow-glow' : ''
      } ${
        active
          ? 'ring-2 ring-brand-500 shadow-glow'
          : 'ring-1 ring-white/60 hover:ring-brand-200 active:ring-brand-200'
      }`}
    >
      <div className="absolute inset-x-0 top-0 h-1" style={{ background: accent }} />
      <Icon size={104} className="pointer-events-none absolute -bottom-5 -right-4 opacity-[0.08] transition duration-300 group-hover:scale-110 group-hover:opacity-[0.12]" style={{ color: accent }} />
      <div className="relative">
        <div className={`grid h-11 w-11 place-items-center rounded-xl ${color} shadow-sm ring-1 ring-white/40`}><Icon size={21} /></div>
        <div className="mt-4 font-display text-3xl font-extrabold tabular-nums text-ink-900">{shown}</div>
        {sparkline && <Sparkline values={sparkline} color={accent} />}
        <div className="text-sm font-medium text-ink-500">{label}</div>
        {onClick && (
          <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-brand-600">
            {hint || (active ? 'Filtro activo' : 'Filtrar mapa')} <ArrowRight size={12} />
          </span>
        )}
      </div>
    </Tag>
  );
}

export function Donut({ data, total }) {
  const R = 70;
  const C = 2 * Math.PI * R;
  const reduced = usePrefersReducedMotion();
  const shown = useCountUp(total, 800);
  const [ready, setReady] = useState(reduced);
  const [hover, setHover] = useState(null);
  const wrapRef = useRef(null);
  const safeTotal = total || 1;

  useEffect(() => {
    if (reduced) {
      setReady(true);
      return undefined;
    }
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)));
    return () => cancelAnimationFrame(id);
  }, [data, total, reduced]);

  useEffect(() => {
    if (hover == null) return undefined;
    const close = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setHover(null);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [hover]);

  let offset = 0;
  const active = data.find((d) => d.key === hover);
  const pct = active && total ? Math.round((active.value / total) * 100) : 0;

  return (
    <div ref={wrapRef} className="flex flex-wrap items-center gap-4 sm:gap-8">
      <div className="relative">
        <svg viewBox="0 0 180 180" className="h-44 w-44 -rotate-90">
          <circle cx="90" cy="90" r={R} fill="none" stroke="#eef2f6" strokeWidth="22" />
          {data.map((d) => {
            if (d.value === 0) return null;
            const len = (d.value / safeTotal) * C;
            const thisOffset = offset;
            offset += len;
            const on = hover === d.key;
            return (
              <circle
                key={d.key}
                cx="90"
                cy="90"
                r={R}
                fill="none"
                stroke={d.color}
                strokeWidth={on ? 26 : 22}
                strokeDasharray={ready ? `${len} ${C - len}` : `0 ${C}`}
                strokeDashoffset={-thisOffset}
                className="admin-donut-seg cursor-pointer"
                style={{ transition: reduced ? 'none' : 'stroke-dasharray 1s ease-out, stroke-width 180ms ease-out' }}
                onPointerEnter={(e) => { if (e.pointerType === 'mouse') setHover(d.key); }}
                onPointerLeave={(e) => { if (e.pointerType === 'mouse') setHover(null); }}
                onPointerUp={(e) => {
                  if (e.pointerType === 'mouse') return;
                  e.stopPropagation();
                  setHover((prev) => (prev === d.key ? null : d.key));
                }}
              />
            );
          })}
          <text x="90" y="86" transform="rotate(90 90 90)" textAnchor="middle" className="fill-ink-900 font-display text-2xl font-extrabold">{shown}</text>
          <text x="90" y="104" transform="rotate(90 90 90)" textAnchor="middle" className="fill-ink-500 text-[10px]">citas</text>
        </svg>
        {active && (
          <div className="pointer-events-none absolute left-1/2 top-2 z-20 -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink-900 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-lg">
            {active.label}: {active.value} ({pct}%)
          </div>
        )}
      </div>
      <div className="space-y-2">
        {data.map((d) => (
          <div
            key={d.key}
            className={`flex items-center gap-2 rounded-lg px-2 py-1 text-sm transition ${
              hover === d.key ? 'bg-slate-100 font-bold text-ink-900' : 'font-medium text-ink-700'
            }`}
            onPointerEnter={(e) => { if (e.pointerType === 'mouse') setHover(d.key); }}
            onPointerLeave={(e) => { if (e.pointerType === 'mouse') setHover(null); }}
            onPointerUp={(e) => {
              if (e.pointerType === 'mouse') return;
              setHover((prev) => (prev === d.key ? null : d.key));
            }}
          >
            <span className="h-3 w-3 rounded" style={{ background: d.color }} /> {d.label} ({d.value})
          </div>
        ))}
      </div>
    </div>
  );
}

export function MonthBars({ months }) {
  const reduced = usePrefersReducedMotion();
  const [grown, setGrown] = useState(reduced);
  const [tip, setTip] = useState(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (reduced) {
      setGrown(true);
      return undefined;
    }
    setGrown(false);
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setGrown(true)));
    return () => cancelAnimationFrame(id);
  }, [months, reduced]);

  useEffect(() => {
    if (tip == null) return undefined;
    const close = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setTip(null);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [tip]);

  return (
    <div ref={wrapRef} className="flex h-44 items-end justify-between gap-3">
      {months.map((m, i) => {
        const open = tip === i;
        const h = grown ? `${Math.max(m.pct, 3)}%` : '0%';
        return (
          <div
            key={`${m.year}-${m.l}`}
            className="group relative flex flex-1 flex-col items-center gap-2"
            onPointerEnter={(e) => { if (e.pointerType === 'mouse') setTip(i); }}
            onPointerLeave={(e) => { if (e.pointerType === 'mouse') setTip(null); }}
            onPointerUp={(e) => {
              if (e.pointerType === 'mouse') return;
              e.stopPropagation();
              setTip((prev) => (prev === i ? null : i));
            }}
          >
            <div className="h-4 text-xs font-bold text-brand-700 opacity-70 transition group-hover:opacity-100">{m.v || ''}</div>
            <div className="relative flex w-full items-end" style={{ height: '120px' }}>
              {open && (
                <div className="absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink-900 px-2.5 py-1.5 text-[11px] text-white shadow-lg">
                  <div className="font-semibold">{MES_FULL[m.month] || m.l} {m.year}</div>
                  <div className="text-white/80">{m.v} solicitud{m.v === 1 ? '' : 'es'}</div>
                </div>
              )}
              <div
                className={`admin-bar-grow relative w-full overflow-hidden rounded-t-lg ring-1 ring-inset ring-white/25 ${
                  open
                    ? 'shadow-[inset_0_2px_6px_rgba(255,255,255,0.55),0_10px_22px_-4px_rgba(2,132,199,0.65)] brightness-110 saturate-125'
                    : 'shadow-[inset_0_2px_4px_rgba(255,255,255,0.45),0_6px_14px_-3px_rgba(2,132,199,0.5)] group-hover:brightness-110 group-hover:saturate-125 group-hover:shadow-[inset_0_2px_6px_rgba(255,255,255,0.55),0_10px_20px_-4px_rgba(2,132,199,0.6)]'
                }`}
                style={{
                  height: h,
                  background: 'linear-gradient(180deg, #7dd3fc 0%, #0ea5e9 55%, #0284c7 100%)',
                  transition: reduced ? 'none' : `height 500ms ease-out ${i * 100}ms, filter 180ms ease, box-shadow 180ms ease`,
                }}
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 rounded-t-lg bg-gradient-to-b from-white/55 to-transparent" />
              </div>
            </div>
            <div className={`text-xs transition ${open ? 'font-bold text-brand-700' : 'font-medium text-ink-500 group-hover:font-bold group-hover:text-brand-700'}`}>{m.l}</div>
          </div>
        );
      })}
    </div>
  );
}
