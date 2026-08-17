import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Loader2, RotateCcw, Upload } from 'lucide-react';
import { api } from '../../lib/api';
import { IMG, SITE_IMAGE_SLOTS } from '../../lib/images';
import { useSiteImages } from '../../context/SiteImagesContext';

const ACCEPT = 'image/jpeg,image/png,image/webp';
const MAX_BYTES = 2 * 1024 * 1024;

function formatBytes(n) {
  if (!n && n !== 0) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function SlotCard({ def, custom, onUploaded, onRestored }) {
  const inputRef = useRef(null);
  const [pending, setPending] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const currentSrc = preview || custom?.url || IMG[def.defaultKey];
  const dims = custom?.width && custom?.height ? `${custom.width}×${custom.height} px` : null;

  function pickFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    setMsg('');
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
    if (preview) URL.revokeObjectURL(preview);
    setPending(file);
    setPreview(URL.createObjectURL(file));
  }

  async function upload() {
    if (!pending) return;
    setUploading(true);
    setErr('');
    setMsg('');
    try {
      await api.uploadSiteImage(def.slot, pending);
      if (preview) URL.revokeObjectURL(preview);
      setPending(null);
      setPreview(null);
      setMsg('Imagen actualizada');
      await onUploaded();
    } catch (e) {
      setErr(e.message || 'No se pudo subir la imagen');
    } finally {
      setUploading(false);
    }
  }

  async function restore() {
    setRestoring(true);
    setErr('');
    setMsg('');
    try {
      await api.deleteSiteImage(def.slot);
      if (preview) URL.revokeObjectURL(preview);
      setPending(null);
      setPreview(null);
      setMsg('Se restauró la imagen original');
      await onRestored();
    } catch (e) {
      setErr(e.message || 'No se pudo restaurar');
    } finally {
      setRestoring(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm">
      <div className="relative h-44 bg-slate-100">
        <img src={currentSrc} alt={def.label} className="h-full w-full object-cover" />
        {pending && (
          <span className="absolute left-3 top-3 rounded-full bg-amber-500 px-2.5 py-0.5 text-[11px] font-bold text-white">Vista previa</span>
        )}
        {custom && !pending && (
          <span className="absolute left-3 top-3 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[11px] font-bold text-white">Personalizada</span>
        )}
      </div>
      <div className="p-4">
        <div className="font-display font-bold text-ink-900">{def.label}</div>
        <p className="mt-0.5 text-xs text-ink-500">Medida recomendada: {def.hint}</p>
        <p className="mt-1 text-xs text-ink-400">
          {pending
            ? `${pending.name} · ${formatBytes(pending.size)}`
            : custom
              ? `${dims || 'Dimensiones N/D'} · ${formatBytes(custom.sizeBytes)}`
              : 'Imagen por defecto del sitio'}
        </p>
        {msg && <div className="mt-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">{msg}</div>}
        {err && <div className="mt-2 rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 ring-1 ring-rose-100">{err}</div>}
        <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={pickFile} />
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => inputRef.current?.click()}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-50 px-3 text-sm font-bold text-brand-700 ring-1 ring-brand-100 transition hover:bg-brand-100 active:bg-brand-100 touch-manipulation">
            <ImagePlus size={15} /> Cambiar imagen
          </button>
          {pending && (
            <button type="button" onClick={upload} disabled={uploading}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-gradient px-3 text-sm font-bold text-white shadow-glow transition hover:brightness-105 active:brightness-95 disabled:opacity-50 touch-manipulation">
              {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
              {uploading ? 'Subiendo…' : 'Subir'}
            </button>
          )}
          {custom && !pending && (
            <button type="button" onClick={restore} disabled={restoring}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-3 text-sm font-bold text-ink-700 transition hover:bg-slate-200 active:bg-slate-200 disabled:opacity-50 touch-manipulation">
              {restoring ? <Loader2 size={15} className="animate-spin" /> : <RotateCcw size={15} />}
              Restaurar original
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SiteImagesSection() {
  const { customs, reload } = useSiteImages();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-extrabold text-ink-900">Imágenes del sitio web</h2>
        <p className="text-sm text-ink-500">Estas imágenes aparecen en la página principal y el catálogo</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {SITE_IMAGE_SLOTS.map((def) => (
          <SlotCard
            key={def.slot}
            def={def}
            custom={customs[def.slot] || null}
            onUploaded={reload}
            onRestored={reload}
          />
        ))}
      </div>
    </div>
  );
}
