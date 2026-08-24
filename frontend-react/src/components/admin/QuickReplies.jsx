import { useEffect, useRef, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

const DEFAULT_REPLIES = [
  {
    group: 'Saludo',
    items: [
      'Buenos días, ¿en qué puedo ayudarle?',
      'Buenas tardes, con gusto le atiendo.',
      'Un momento por favor, estoy revisando su caso.',
    ],
  },
  {
    group: 'Diagnóstico',
    items: [
      'Ya revisé su equipo, le paso el diagnóstico.',
      '¿Podría enviarme una foto del equipo para revisarlo?',
      '¿Qué marca y modelo es su aire acondicionado?',
      '¿Hace cuánto tiempo presenta la falla?',
    ],
  },
  {
    group: 'Presupuesto',
    items: [
      'El presupuesto por el servicio es de $',
      'El servicio incluye mano de obra y materiales.',
      'El tiempo estimado de reparación es de ',
      'Le envío el presupuesto detallado por WhatsApp.',
    ],
  },
  {
    group: 'Cierre',
    items: [
      'Gracias por comunicarse con nosotros. ¡Que tenga buen día!',
      'Quedamos atentos a cualquier otra consulta.',
      'Su cita quedó registrada. Le confirmaremos por WhatsApp.',
    ],
  },
];

function loadCustomReplies() {
  try {
    const saved = localStorage.getItem('quick-replies-custom');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveCustomReplies(replies) {
  try {
    localStorage.setItem('quick-replies-custom', JSON.stringify(replies));
  } catch {}
}

export default function QuickReplies({ onSelect, onClose }) {
  const ref = useRef(null);
  const addInputRef = useRef(null);
  const [customReplies, setCustomReplies] = useState(loadCustomReplies);
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState('');

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    function handleKey(e) {
      if (e.key === 'Escape') {
        if (adding) {
          setAdding(false);
          setNewText('');
        } else {
          onClose();
        }
      }
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose, adding]);

  useEffect(() => {
    if (adding) addInputRef.current?.focus();
  }, [adding]);

  function addReply() {
    const text = newText.trim();
    if (!text) return;
    const updated = [...customReplies, text];
    setCustomReplies(updated);
    saveCustomReplies(updated);
    setNewText('');
    setAdding(false);
  }

  function removeReply(index) {
    const updated = customReplies.filter((_, i) => i !== index);
    setCustomReplies(updated);
    saveCustomReplies(updated);
  }

  return (
    <div
      ref={ref}
      className="absolute bottom-full left-0 mb-2 w-80 max-h-80 overflow-y-auto rounded-xl border border-brand-200 bg-white shadow-xl z-50"
    >
      {/* Seccion: Mis respuestas */}
      <div>
        <div className="sticky top-0 z-10 flex items-center justify-between bg-green-50 px-3 py-1.5 border-b border-green-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-green-600">
            Mis respuestas
          </span>
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="rounded-md p-0.5 text-green-500 transition hover:bg-green-100 hover:text-green-700"
            title="Agregar respuesta"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Input para agregar nueva */}
        {adding && (
          <div className="flex gap-1 border-b border-brand-100 px-2 py-2">
            <input
              ref={addInputRef}
              type="text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); addReply(); }
              }}
              placeholder="Escribe tu respuesta..."
              className="flex-1 rounded-lg border border-brand-200 px-2 py-1.5 text-xs outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400"
              maxLength={200}
            />
            <button
              type="button"
              onClick={addReply}
              disabled={!newText.trim()}
              className="rounded-lg bg-green-500 px-2.5 py-1.5 text-xs font-bold text-white transition hover:bg-green-600 disabled:opacity-30"
            >
              +
            </button>
          </div>
        )}

        {customReplies.length === 0 && !adding ? (
          <p className="px-3 py-2 text-[11px] text-ink-300 italic">
            Pulsa + para agregar tus respuestas
          </p>
        ) : (
          customReplies.map((text, i) => (
            <div
              key={`custom-${i}`}
              className="group flex items-center border-b border-brand-50 last:border-0"
            >
              <button
                type="button"
                onClick={() => { onSelect(text); onClose(); }}
                className="flex-1 px-3 py-2 text-left text-xs text-ink-700 transition hover:bg-green-50"
              >
                {text}
              </button>
              <button
                type="button"
                onClick={() => removeReply(i)}
                className="mr-2 rounded p-1 text-ink-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                title="Eliminar"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Seccion: Sugeridas (las predefinidas) */}
      {DEFAULT_REPLIES.map((group) => (
        <div key={group.group}>
          <div className="sticky top-0 bg-brand-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-400 border-b border-brand-100">
            {group.group}
          </div>
          {group.items.map((text) => (
            <button
              key={text}
              type="button"
              onClick={() => { onSelect(text); onClose(); }}
              className="block w-full px-3 py-2 text-left text-xs text-ink-700 transition hover:bg-brand-50 border-b border-brand-50 last:border-0"
            >
              {text}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
