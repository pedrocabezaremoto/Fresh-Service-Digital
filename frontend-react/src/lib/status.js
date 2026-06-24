export const STATUS = {
  PENDING: { label: 'Pendiente', cls: 'bg-amber-100 text-amber-700', dot: '#f59e0b' },
  ASSIGNED: { label: 'Asignada', cls: 'bg-blue-100 text-blue-700', dot: '#3b82f6' },
  IN_PROGRESS: { label: 'En proceso', cls: 'bg-violet-100 text-violet-700', dot: '#8b5cf6' },
  COMPLETED: { label: 'Completada', cls: 'bg-emerald-100 text-emerald-700', dot: '#10b981' },
  CANCELLED: { label: 'Cancelada', cls: 'bg-rose-100 text-rose-700', dot: '#ef4444' },
};

export function fmtDate(d) {
  return new Date(d).toLocaleDateString('es-VE');
}
export function fmtTime(d) {
  return new Date(d).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
}
