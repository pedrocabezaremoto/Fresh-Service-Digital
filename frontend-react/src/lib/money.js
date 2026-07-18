// Formato de precios: se guardan en USD y se muestran en Bs a la tasa BCV.

export function formatUsd(usd) {
  const n = Number(usd || 0);
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export function formatBs(usd, rate) {
  if (!rate) return null;
  return 'Bs ' + (usd * rate).toLocaleString('es-VE', { maximumFractionDigits: 2 });
}
