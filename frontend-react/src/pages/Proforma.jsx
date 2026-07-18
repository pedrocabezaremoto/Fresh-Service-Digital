import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useRate } from '../context/RateContext';
import { priceUsd } from '../lib/prices';
import { formatBs, formatUsd } from '../lib/money';
import { fmtDate } from '../lib/status';

const ACTIVE = ['PENDING', 'ASSIGNED', 'IN_PROGRESS'];

export default function Proforma() {
  const { user } = useAuth();
  const { rate, date } = useRate();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getClientAppointments(user.id);
        setItems(data.filter((a) => ACTIVE.includes(a.status)));
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user.id]);

  const priceOf = (a) => a.priceUsd ?? priceUsd(a.equipment?.[0]?.brand, a.equipment?.[0]?.model);
  const totalUsd = items.reduce((s, a) => s + priceOf(a), 0);
  const bs = (usd) => formatBs(usd, rate) || formatUsd(usd);
  const proformaNo = `FSD-${String(user.id).slice(0, 6).toUpperCase()}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
  const today = new Date().toLocaleDateString('es-VE');

  return (
    <div className="min-h-screen bg-slate-100 py-8 print:bg-white print:py-0">
      {/* Barra de acciones (no se imprime) */}
      <div className="mx-auto mb-4 flex max-w-3xl items-center justify-between px-4 print:hidden">
        <button onClick={() => navigate('/panel')} className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-600 transition hover:text-brand-600">
          <ArrowLeft size={16} /> Volver al panel
        </button>
        <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-full bg-brand-gradient px-5 py-2.5 text-sm font-bold text-white shadow-glow transition hover:brightness-105">
          <Printer size={16} /> Imprimir / Guardar PDF
        </button>
      </div>

      {/* Documento */}
      <div className="mx-auto max-w-3xl bg-white p-8 shadow ring-1 ring-slate-200 print:shadow-none print:ring-0 sm:p-12">
        <div className="flex items-start justify-between border-b border-slate-200 pb-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Fresh Service" className="h-12 w-12 rounded-lg" />
            <div>
              <div className="font-display text-xl font-extrabold text-ink-900">Fresh Service</div>
              <div className="text-xs text-ink-500">Refrigeración a domicilio · San Juan de los Morros</div>
            </div>
          </div>
          <div className="text-right text-xs text-ink-500">
            <div className="font-display text-sm font-extrabold text-brand-600">PROFORMA</div>
            <div className="mt-1">Nº {proformaNo}</div>
            <div>Fecha: {today}</div>
          </div>
        </div>

        <div className="mt-6 text-sm">
          <div className="text-xs font-bold uppercase tracking-wide text-ink-400">Cliente</div>
          <div className="mt-1 font-semibold text-ink-900">{user.firstName} {user.lastName}</div>
          <div className="text-ink-500">{user.email}</div>
        </div>

        {loading ? (
          <div className="grid place-items-center py-16 text-brand-400"><Loader2 className="animate-spin" size={30} /></div>
        ) : items.length === 0 ? (
          <div className="py-14 text-center text-ink-500">No tienes servicios pendientes de pago.</div>
        ) : (
          <>
            <table className="mt-6 w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-ink-400">
                  <th className="py-2">Servicio</th>
                  <th className="py-2">Fecha</th>
                  <th className="py-2 text-right">Precio</th>
                </tr>
              </thead>
              <tbody>
                {items.map((a) => {
                  const eq = a.equipment?.[0];
                  const usd = priceOf(a);
                  return (
                    <tr key={a.id} className="border-b border-slate-100">
                      <td className="py-3">
                        <div className="font-medium text-ink-900">{eq ? `${eq.brand} · ${eq.model}` : 'Servicio'}</div>
                        <div className="text-xs text-ink-400">Ref #{a.id.substring(0, 8).toUpperCase()}</div>
                      </td>
                      <td className="py-3 text-ink-600">{fmtDate(a.scheduledAt)}</td>
                      <td className="py-3 text-right">
                        <div className="font-semibold text-ink-900">{bs(usd)}</div>
                        <div className="text-xs text-ink-400">Ref. {formatUsd(usd)}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="mt-6 flex justify-end">
              <div className="w-full max-w-xs">
                <div className="flex items-start justify-between border-t-2 border-ink-900 pt-3">
                  <span className="font-display font-bold text-ink-900">TOTAL A PAGAR</span>
                  <div className="text-right">
                    <div className="font-display text-xl font-extrabold text-ink-900">{bs(totalUsd)}</div>
                    <div className="text-xs text-ink-500">Ref. {formatUsd(totalUsd)}</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="mt-8 space-y-1 rounded-xl bg-slate-50 p-4 text-xs text-ink-500 print:bg-slate-50">
          <p>• Monto en Bs calculado a la tasa oficial del BCV{date ? ` (${date})` : ''}{rate ? `: Bs ${rate.toLocaleString('es-VE')} por USD` : ''}. Sujeto a la tasa del día de pago.</p>
          <p>• Proforma válida por 7 días. Documento informativo, no constituye factura fiscal.</p>
          <p>• Contacto: WhatsApp +58 412-000 0000 · San Juan de los Morros, Guárico, Venezuela.</p>
        </div>
      </div>
    </div>
  );
}
