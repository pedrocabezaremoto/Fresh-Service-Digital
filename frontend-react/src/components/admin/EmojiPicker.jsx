import { useEffect, useRef } from 'react';

const EMOJI_GROUPS = [
  {
    label: 'Comunes',
    emojis: ['👍', '👋', '😊', '😂', '🙂', '😉', '🤝', '👏', '🙏'],
  },
  {
    label: 'Servicio',
    emojis: ['🔧', '❄️', '🌡️', '⚡', '✅', '❌', '⏰', '📋', '💰'],
  },
  {
    label: 'Expresiones',
    emojis: ['❤️', '🔥', '⭐', '💪', '👀', '📸', '📞', '💬', '🎉'],
  },
];

export default function EmojiPicker({ onSelect, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    function handleEsc(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute bottom-full left-0 mb-2 w-64 rounded-xl border border-brand-600 bg-brand-800 p-3 shadow-2xl z-50"
    >
      {EMOJI_GROUPS.map(group => (
        <div key={group.label} className="mb-2 last:mb-0">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-brand-400">
            {group.label}
          </p>
          <div className="flex flex-wrap gap-1">
            {group.emojis.map(emoji => (
              <button
                key={emoji}
                onClick={() => { onSelect(emoji); onClose(); }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-lg transition hover:bg-brand-700 hover:scale-110"
                type="button"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
