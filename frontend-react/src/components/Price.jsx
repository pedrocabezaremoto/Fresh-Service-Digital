import { useRate } from '../context/RateContext';
import { formatBs, formatUsd } from '../lib/money';

/**
 * Muestra un precio guardado en USD: Bs grande (a tasa BCV) + Ref. USD chico.
 * Si aún no cargó la tasa, muestra solo el USD como fallback.
 * Props: usd (number), size ('sm' | 'md' | 'lg'), align ('left' | 'right')
 */
export default function Price({ usd, size = 'md', align = 'left' }) {
  const { rate } = useRate();
  const bs = formatBs(usd, rate);
  const bsCls = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-sm' : 'text-lg';
  return (
    <div className={align === 'right' ? 'text-right' : ''}>
      {bs ? (
        <>
          <div className={`font-display ${bsCls} font-extrabold leading-none text-ink-900`}>{bs}</div>
          <div className="mt-0.5 text-xs font-medium text-ink-500">Ref. {formatUsd(usd)}</div>
        </>
      ) : (
        <div className={`font-display ${bsCls} font-extrabold leading-none text-ink-900`}>{formatUsd(usd)}</div>
      )}
    </div>
  );
}
