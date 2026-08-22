import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Loader2, Power, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';

const ACCEPT = 'image/jpeg,image/png,image/webp';
const MAX_BYTES = 2 * 1024 * 1024;

function formatBytes(n) {
  if (!n && n !== 0) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function CarouselCard({ img, onChanged }) {
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');

  async function toggle() {
    setBusy('toggle');
    setErr('');
    try {
      await api.toggleCarouselImage(img.id);
      await onChanged();
    } catch (e) {
      setErr(e.message || 'No se pudo cambiar el estado');
    } finally {
      setBusy('');
    }
  }

  async function remove() {
    if (!window.confirm(`¿Eliminar ${img.filename}? Esta acción no se puede deshacer.`)) return;
    setBusy('delete');
    setErr('');
    try {
      await api.deleteCarouselImage(img.id);
      await onChanged();
    } catch (e) {
      setErr(e.message || 'No se pudo eliminar');
    } finally {
      setBusy('');
    }
  }

  const dims = img.width && img.height ? `${img.width}×${img.height} px` : null;

  return (
    <div className={`overflow-hidden rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm ${img.active ? '' : 'opacity-60'}`}>
      <div className="relative h-44 bg-slate-100">
        <img src={img.url} alt={img.alt || img.filename} className="h-full w-full object-cover" />
        {!img.active && (
          <span className="absolute left-3 top-3 rounded-full bg-slate-700 px-2.5 py-0.5 text-[11px] font-bold text-white">Inactiva</span>
        )}
      </div>
      <div className="p-4">
        <div className="truncate font-display font-bold text-ink-900">{img.filename}</div>
        <p className="mt-1 text-xs text-ink-400">
          {dims || 'Dimensiones N/D'} · {formatBytes(img.sizeBytes)}
        </p>
        {err && <div className="mt-2 rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 ring-1 ring-rose-100">{err}</div>}
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={toggle} disabled={!!busy}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-50 px-3 text-sm font-bold text-brand-700 ring-1 ring-brand-100 transition hover:bg-brand-100 disabled:opacity-50 touch-manipulation">
            {busy === 'toggle' ? <Loader2 size={15} className="animate-spin" /> : <Power size={15} />}
            {img.active ? 'Desactivar' : 'Activar'}
          </button>
          <button type="button" onClick={remove} disabled={!!busy}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-rose-50 px-3 text-sm font-bold text-rose-700 ring-1 ring-rose-100 transition hover:bg-rose-100 disabled:opacity-50 touch-manipulation">
            {busy === 'delete' ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CarouselSection() {
  const inputRef = useRef(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');

  async function reload() {
    const list = await api.getCarouselAll();
    setItems(Array.isArray(list) ? list : []);
  }

  useEffect(() => {
    let cancelled = false;
    api.getCarouselAll()
      .then((list) => { if (!cancelled) setItems(Array.isArray(list) ? list : []); })
      .catch((e) => { if (!cancelled) setErr(e.message || 'No se pudo cargar el carrusel'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  async function onPick(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    setErr('');
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErr('Formato no soportado. Usa JPG, PNG o WebP.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setErr('La imagen no puede superar 2 MB');
      return;
    }
    setUploading(true);
    try {
      await api.uploadCarouselImage(file);
      await reload();
    } catch (ex) {
      setErr(ex.message || 'No se pudo subir la imagen');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-extrabold text-ink-900">Carrusel de la página principal</h2>
          <p className="text-sm text-ink-500">Estas imágenes rotan en el hero de la landing. Activa o desactiva cada una.</p>
        </div>
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
          className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-brand-gradient px-4 text-sm font-bold text-white shadow-glow transition hover:brightness-105 disabled:opacity-50 touch-manipulation">
          {uploading ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={15} />}
          {uploading ? 'Subiendo…' : 'Agregar imagen'}
        </button>
        <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={onPick} />
      </div>
      {err && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 ring-1 ring-rose-100">{err}</div>}
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-ink-500"><Loader2 size={16} className="animate-spin" /> Cargando…</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((img) => (
            <CarouselCard key={img.id} img={img} onChanged={reload} />
          ))}
        </div>
      )}
    </div>
  );
}
