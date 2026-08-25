import { useEffect, useRef, useState } from 'react';
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Megaphone, Smile } from 'lucide-react';
import { api } from '../../lib/api';

const TICKER_EMOJIS = ['🔥', '❄️', '⭐', '💰', '🎉', '✅', '⚡', '🛠️', '📣', '💪', '🏷️', '🎊', '👏', '❤️', '🌡️', '📞'];

export default function TickerSection() {
  const [messages, setMessages] = useState([]);
  const [newText, setNewText] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteItem, setDeleteItem] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const emojiRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    api.getTickerAll().then((data) => setMessages(Array.isArray(data) ? data : [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!showEmoji) return;
    function close(e) { if (emojiRef.current && !emojiRef.current.contains(e.target)) setShowEmoji(false); }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [showEmoji]);

  async function addMessage() {
    const text = newText.trim();
    if (!text) return;
    try {
      const created = await api.createTicker(text);
      setMessages((prev) => [...prev, created]);
      setNewText('');
    } catch { /* ignore */ }
  }

  async function toggleActive(msg) {
    try {
      await api.updateTicker(msg.id, { isActive: !msg.isActive });
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, isActive: !m.isActive } : m)));
    } catch { /* ignore */ }
  }

  async function saveEdit(msg) {
    const text = msg._editText?.trim();
    if (!text) return;
    try {
      await api.updateTicker(msg.id, { text });
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, text, _editing: false } : m)));
    } catch { /* ignore */ }
  }

  async function confirmDelete() {
    if (!deleteItem) return;
    try {
      await api.deleteTicker(deleteItem.id);
      setMessages((prev) => prev.filter((m) => m.id !== deleteItem.id));
      setDeleteItem(null);
    } catch { /* ignore */ }
  }

  async function move(id, direction) {
    const list = [...messages];
    const idx = list.findIndex((m) => m.id === id);
    if (idx < 0) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= list.length) return;
    [list[idx], list[newIdx]] = [list[newIdx], list[idx]];
    const updated = list.map((item, i) => ({ ...item, sortOrder: i + 1 }));
    setMessages(updated);
    try {
      await Promise.all([
        api.updateTicker(updated[idx].id, { sortOrder: updated[idx].sortOrder }),
        api.updateTicker(updated[newIdx].id, { sortOrder: updated[newIdx].sortOrder }),
      ]);
    } catch { /* revert silencioso */ }
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-100 text-brand-600">
          <Megaphone size={20} />
        </div>
        <div>
          <h3 className="font-display font-bold text-ink-900">Ticker promocional</h3>
          <p className="text-xs text-ink-500">Mensajes que se desplazan en la franja de la landing</p>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        <div className="relative flex flex-1 items-center">
          <input ref={inputRef} value={newText} onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addMessage()}
            placeholder="Ej: Promo del mes 🔥 20% de descuento"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 pr-10 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
          <button type="button" onClick={() => setShowEmoji((v) => !v)}
            className="absolute right-2 grid h-8 w-8 place-items-center rounded-lg text-ink-400 hover:bg-slate-100 hover:text-ink-600 touch-manipulation" title="Emojis">
            <Smile size={18} />
          </button>
          {showEmoji && (
            <div ref={emojiRef} className="absolute right-0 top-full z-50 mt-1 w-72 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-400">Emojis para tu promo</p>
              <div className="flex flex-wrap gap-1">
                {TICKER_EMOJIS.map((e) => (
                  <button key={e} type="button" onClick={() => { setNewText((t) => t + e); setShowEmoji(false); inputRef.current?.focus(); }}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-xl transition hover:bg-slate-100 hover:scale-110">{e}</button>
                ))}
              </div>
            </div>
          )}
        </div>
        <button type="button" onClick={addMessage} disabled={!newText.trim()}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-40 touch-manipulation">
          <Plus size={16} /> Agregar
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-ink-400">Cargando...</p>
      ) : messages.length === 0 ? (
        <p className="text-sm text-ink-400">Sin mensajes. Se mostrará la franja de confianza por defecto.</p>
      ) : (
        <div className="max-h-80 space-y-2 overflow-y-auto">
          {messages.map((msg, idx) => (
            <div key={msg.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5 ring-1 ring-slate-100">
              {msg._editing ? (
                <input autoFocus value={msg._editText || ''} onChange={(e) => setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, _editText: e.target.value } : m)))}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, _editing: false } : m)));
                    if (e.key === 'Enter') saveEdit(msg);
                  }}
                  className="mr-2 flex-1 rounded-lg border-2 border-brand-300 px-2 py-1 text-sm outline-none" />
              ) : (
                <span className={`text-sm font-medium ${msg.isActive ? 'text-ink-800' : 'text-ink-400 line-through'}`}>{msg.text}</span>
              )}
              <div className="ml-3 flex shrink-0 items-center gap-1.5">
                <button type="button" onClick={() => move(msg.id, 'up')} disabled={idx === 0}
                  className="grid h-7 w-7 place-items-center rounded-lg text-ink-400 hover:bg-slate-200 hover:text-ink-600 disabled:opacity-30 touch-manipulation" title="Subir"><ChevronUp size={14} /></button>
                <button type="button" onClick={() => move(msg.id, 'down')} disabled={idx === messages.length - 1}
                  className="grid h-7 w-7 place-items-center rounded-lg text-ink-400 hover:bg-slate-200 hover:text-ink-600 disabled:opacity-30 touch-manipulation" title="Bajar"><ChevronDown size={14} /></button>
                {msg._editing ? (
                  <button type="button" onClick={() => saveEdit(msg)} className="rounded-full bg-brand-100 px-2 py-1 text-xs font-bold text-brand-700">Guardar</button>
                ) : (
                  <button type="button" onClick={() => setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, _editing: true, _editText: m.text } : m)))}
                    className="grid h-7 w-7 place-items-center rounded-lg text-ink-400 hover:bg-slate-200 hover:text-ink-600 touch-manipulation" title="Editar"><Pencil size={13} /></button>
                )}
                <button type="button" onClick={() => setDeleteItem(msg)}
                  className="grid h-7 w-7 place-items-center rounded-lg text-ink-400 hover:bg-rose-100 hover:text-rose-600 touch-manipulation" title="Eliminar"><Trash2 size={13} /></button>
                <button type="button" onClick={() => toggleActive(msg)}
                  className={`rounded-full px-2 py-1 text-xs font-bold ${msg.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-ink-500'}`}>
                  {msg.isActive ? 'Activo' : 'Inactivo'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteItem && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-ink-900/50 p-4" onClick={() => setDeleteItem(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl bg-white p-4 text-center shadow-xl sm:p-6">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-rose-100 text-rose-600">
              <Trash2 size={26} />
            </div>
            <h3 className="mt-4 font-display text-lg font-bold text-ink-900">Eliminar mensaje</h3>
            <p className="mt-2 text-sm text-ink-500">
              Vas a eliminar: <strong className="text-ink-900">&quot;{deleteItem.text.length > 60 ? `${deleteItem.text.slice(0, 60)}...` : deleteItem.text}&quot;</strong>
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <button type="button" onClick={confirmDelete}
                className="min-h-11 rounded-full bg-rose-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-700 touch-manipulation">
                Sí, eliminar
              </button>
              <button type="button" onClick={() => setDeleteItem(null)}
                className="min-h-11 rounded-full bg-slate-100 px-4 py-2.5 text-sm font-bold text-ink-700 transition hover:bg-slate-200 touch-manipulation">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
