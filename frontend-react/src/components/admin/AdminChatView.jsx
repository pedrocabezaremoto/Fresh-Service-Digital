import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { MessageCircle, Send, UserCheck, UserX, Volume2, VolumeX, Search, X, Zap } from 'lucide-react';
import { API_BASE } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import ConfirmModal from './ConfirmModal';
import EmojiPicker from './EmojiPicker';
import QuickReplies from './QuickReplies';

function avatarColor(sessionId) {
  let hash = 0;
  for (let i = 0; i < sessionId.length; i++) {
    hash = sessionId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
    'bg-yellow-500', 'bg-red-500', 'bg-indigo-500', 'bg-teal-500',
    'bg-orange-500', 'bg-cyan-500',
  ];
  return colors[Math.abs(hash) % colors.length];
}

function avatarInitial(conv) {
  const firstMsg = conv.lastMessage?.content || conv.sessionId;
  const letter = firstMsg.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/g, '')[0] || '#';
  return letter.toUpperCase();
}

function formatDateGroup(dateStr) {
  if (!dateStr) return 'Sin fecha';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Hoy';
  if (date.toDateString() === yesterday.toDateString()) return 'Ayer';

  return date.toLocaleDateString('es-VE', { day: 'numeric', month: 'short' });
}

export default function AdminChatView() {
  const { token } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null); // sessionId
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const selectedRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [viewMode, setViewMode] = useState('active'); // 'active' | 'archived'
  const [archivedConversations, setArchivedConversations] = useState([]);
  const [modal, setModal] = useState({ open: false, title: '', message: '', confirmText: '', confirmColor: 'blue', onConfirm: () => {} });
  const [searchTerm, setSearchTerm] = useState('');
  const [clientTyping, setClientTyping] = useState(null); // sessionId del cliente que escribe
  const clientTypingTimeoutRef = useRef(null);
  const lastOperatorTypingRef = useRef(0);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try { return localStorage.getItem('chat-sound') !== 'false'; } catch { return true; }
  });
  const soundRef = useRef(null);
  const soundEnabledRef = useRef(soundEnabled);

  // Connect to Socket.IO
  useEffect(() => {
    if (!token) return;
    const socket = io(`${API_BASE}/live-chat`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('conversations', (convs) => {
      setConversations(convs);
    });

    socket.on('conversationUpdated', (update) => {
      setConversations(prev =>
        prev.map(c =>
          c.sessionId === update.sessionId
            ? { ...c, ...update }
            : c
        )
      );
    });

    socket.on('message', (msg) => {
      // Update conversation list (last message preview)
      setConversations(prev =>
        prev.map(c =>
          c.sessionId === msg.sessionId
            ? { ...c, lastMessage: msg, unreadByAdmin: msg.role === 'user' ? (c.unreadByAdmin || 0) + 1 : c.unreadByAdmin }
            : c
        )
      );

      if (msg.sessionId && msg.sessionId === selectedRef.current) {
        setMessages(prev => [...prev, { ...msg, sessionId: msg.sessionId }]);
      }

      if (msg.role === 'user' && soundEnabledRef.current) {
        playNotificationSound();
      }
    });

    socket.on('typing', (data) => {
      if (data.from === 'client' && data.sessionId) {
        setClientTyping(data.sessionId);
        clearTimeout(clientTypingTimeoutRef.current);
        clientTypingTimeoutRef.current = setTimeout(() => setClientTyping(null), 3000);
      }
    });

    socket.on('stopTyping', (data) => {
      if (data.from === 'client' && data.sessionId) {
        setClientTyping(prev => prev === data.sessionId ? null : prev);
      }
    });

    return () => socket.disconnect();
  }, [token]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, clientTyping]);

  useEffect(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      soundRef.current = new AudioCtx();
    } catch { /* ignore */ }
    return () => {
      try { soundRef.current?.close(); } catch { /* ignore */ }
    };
  }, []);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  function playNotificationSound() {
    try {
      const ctx = soundRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);
    } catch { /* ignore */ }
  }

  function toggleSound() {
    try { soundRef.current?.resume?.(); } catch { /* ignore */ }
    setSoundEnabled(prev => {
      const next = !prev;
      try { localStorage.setItem('chat-sound', String(next)); } catch { /* ignore */ }
      return next;
    });
  }

  // Load conversation messages when selected
  const selectConversation = async (conv) => {
    setSelected(conv.sessionId);
    selectedRef.current = conv.sessionId;
    try {
      const res = await fetch(`${API_BASE}/chat/conversations/${conv.id}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const msgs = await res.json();
        setMessages(msgs.filter(m => m.role !== 'tool').map(m => ({ ...m, sessionId: conv.sessionId })));
      }
    } catch { /* ignore */ }

    // Mark as read
    setConversations(prev =>
      prev.map(c => c.sessionId === conv.sessionId ? { ...c, unreadByAdmin: 0 } : c)
    );
  };

  // Take over
  const takeOver = () => {
    if (!selected || !socketRef.current) return;
    socketRef.current.emit('takeOver', { sessionId: selected });
  };

  // Release
  const release = () => {
    if (!selected || !socketRef.current) return;
    socketRef.current.emit('release', { sessionId: selected });
  };

  // Send message
  const sendMessage = () => {
    if (!selected || !draft.trim() || !socketRef.current) return;
    socketRef.current.emit('stopTyping', { sessionId: selected });
    setSending(true);
    socketRef.current.emit('operatorMessage', {
      sessionId: selected,
      message: draft.trim(),
    });
    setDraft('');
    setSending(false);
  };

  async function handleOperatorImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen no puede superar 2 MB.');
      return;
    }

    const conv = conversations.find(c => c.sessionId === selected)
      || archivedConversations.find(c => c.sessionId === selected);
    if (!conv) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversationId', conv.id);

    try {
      const res = await fetch(`${API_BASE}/chat/operator-upload-image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.error) alert(data.error);
    } catch {
      alert('Error al subir la imagen.');
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function loadArchived() {
    try {
      const res = await fetch(`${API_BASE}/chat/archived`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setArchivedConversations(Array.isArray(data) ? data : []);
    } catch {
      console.error('Error cargando archivadas');
    }
  }

  function openModal({ title, message, confirmText, confirmColor, onConfirm }) {
    setModal({ open: true, title, message, confirmText, confirmColor, onConfirm });
  }
  function closeModal() {
    setModal(prev => ({ ...prev, open: false }));
  }

  async function handleArchive(conv) {
    openModal({
      title: 'Archivar conversación',
      message: 'Esta conversación se moverá a la sección de archivadas. Podrás restaurarla en cualquier momento.',
      confirmText: 'Archivar',
      confirmColor: 'yellow',
      onConfirm: async () => {
        closeModal();
        await fetch(`${API_BASE}/chat/${conv.id}/archive`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
        });
        setConversations(prev => prev.filter(c => c.id !== conv.id));
        if (selected === conv.sessionId) {
          setSelected(null);
          selectedRef.current = null;
          setMessages([]);
        }
      },
    });
  }

  async function handleUnarchive(conv) {
    await fetch(`${API_BASE}/chat/${conv.id}/unarchive`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    setArchivedConversations(prev => prev.filter(c => c.id !== conv.id));
    setConversations(prev => [...prev, { ...conv, archived: false }]);
  }

  async function handleDelete(conv) {
    openModal({
      title: 'Eliminar conversación',
      message: 'Se borrarán permanentemente TODOS los mensajes e imágenes de esta conversación. Esta acción NO se puede deshacer.',
      confirmText: 'Eliminar permanentemente',
      confirmColor: 'red',
      onConfirm: async () => {
        closeModal();
        await fetch(`${API_BASE}/chat/${conv.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        setConversations(prev => prev.filter(c => c.id !== conv.id));
        setArchivedConversations(prev => prev.filter(c => c.id !== conv.id));
        if (selected === conv.sessionId) {
          setSelected(null);
          selectedRef.current = null;
          setMessages([]);
        }
      },
    });
  }

  const rawList = viewMode === 'active' ? conversations : archivedConversations;
  const list = searchTerm.trim()
    ? rawList.filter(conv => {
        const term = searchTerm.toLowerCase();
        const content = (conv.lastMessage?.content || '').toLowerCase();
        const session = conv.sessionId.toLowerCase();
        return content.includes(term) || session.includes(term);
      })
    : rawList;
  const selectedConv = conversations.find(c => c.sessionId === selected)
    || archivedConversations.find(c => c.sessionId === selected);

  return (
    <div className="flex h-[calc(100vh-10rem)] rounded-2xl border border-brand-200 bg-white shadow-sm overflow-hidden">
      {/* Sidebar - Conversations list */}
      <div className="w-80 shrink-0 border-r border-brand-100 flex flex-col">
        <div className="border-b border-brand-100 px-4 py-3">
          <h3 className="font-semibold text-ink-900 flex items-center gap-2">
            <MessageCircle size={18} />
            Conversaciones
            <button
              type="button"
              onClick={toggleSound}
              className={`ml-auto rounded-lg p-1.5 transition ${
                soundEnabled
                  ? 'text-brand-500 hover:bg-brand-50'
                  : 'text-ink-300 hover:bg-gray-100'
              }`}
              title={soundEnabled ? 'Silenciar notificaciones' : 'Activar notificaciones'}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <span className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
          </h3>
        </div>
        {/* Buscador */}
        <div className="border-b border-brand-100 px-3 py-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar conversación..."
              className="w-full rounded-lg border border-brand-200 bg-brand-50 py-1.5 pl-9 pr-8 text-xs outline-none transition placeholder:text-ink-300 focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-ink-300 transition hover:bg-brand-200 hover:text-ink-600"
                title="Limpiar búsqueda"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 border-b border-brand-100 px-4 py-2">
          <button
            onClick={() => setViewMode('active')}
            className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
              viewMode === 'active'
                ? 'bg-brand-500 text-white'
                : 'text-ink-400 hover:text-ink-900'
            }`}
          >
            Activas
          </button>
          <button
            onClick={() => { setViewMode('archived'); loadArchived(); }}
            className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
              viewMode === 'archived'
                ? 'bg-brand-500 text-white'
                : 'text-ink-400 hover:text-ink-900'
            }`}
          >
            Archivadas
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {list.length === 0 ? (
            <p className="p-4 text-sm text-ink-400">
              {searchTerm.trim()
                ? `No se encontraron resultados para "${searchTerm}"`
                : viewMode === 'archived'
                  ? 'No hay conversaciones archivadas'
                  : 'No hay conversaciones activas'}
            </p>
          ) : (
            list.map((conv, i) => {
              const currentGroup = formatDateGroup(conv.lastMessageAt || conv.startedAt);
              const prevGroup = i > 0 ? formatDateGroup(list[i - 1].lastMessageAt || list[i - 1].startedAt) : null;
              const showSeparator = currentGroup !== prevGroup;
              const statusBorder = conv.blocked
                ? 'border-l-red-500'
                : conv.paused
                  ? 'border-l-yellow-500'
                  : conv.operatorActive
                    ? 'border-l-green-500'
                    : 'border-l-brand-500';
              const isSelected = selected === conv.sessionId;
              const hasUnread = (conv.unreadByAdmin || 0) > 0;

              return (
                <div key={conv.id || conv.sessionId}>
                  {showSeparator && (
                    <div className="sticky top-0 z-10 border-b border-brand-100 bg-slate-50/95 px-4 py-1.5 backdrop-blur-sm dark:border-brand-700 dark:bg-brand-900/90">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400 dark:text-brand-400">
                        {currentGroup}
                      </span>
                    </div>
                  )}
                  <div
                    onClick={() => selectConversation(conv)}
                    className={`w-full cursor-pointer border-b border-b-brand-50 border-l-[3px] px-4 py-3 text-left transition hover:bg-brand-100 dark:hover:bg-brand-700/50 ${statusBorder} ${
                      isSelected
                        ? 'bg-brand-50 ring-1 ring-inset ring-brand-200 dark:bg-brand-800/60'
                        : hasUnread
                          ? 'bg-blue-50/60 dark:bg-blue-900/20'
                          : i % 2 === 0
                            ? ''
                            : 'bg-gray-50 dark:bg-brand-800/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${avatarColor(conv.sessionId)}`}>
                        {avatarInitial(conv)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm truncate ${hasUnread ? 'font-bold text-ink-950' : 'font-semibold text-ink-900'}`}>
                            {conv.lastMessage?.content?.slice(0, 22) || 'Sin mensajes'}
                          </span>
                          {conv.unreadByAdmin > 0 && (
                            <span className="rounded-full bg-brand-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                              {conv.unreadByAdmin}
                            </span>
                          )}
                        </div>
                        {conv.lastMessage && (
                          <p className={`mt-0.5 truncate text-xs ${hasUnread ? 'font-semibold text-ink-600' : 'text-ink-400'}`}>
                            {conv.lastMessage.type === 'image'
                              ? '📷 Foto enviada'
                              : conv.lastMessage.role === 'operator'
                                ? `Tú: ${conv.lastMessage.content?.slice(0, 38) || ''}`
                                : conv.lastMessage.role === 'assistant'
                                  ? `Copito: ${conv.lastMessage.content?.slice(0, 35) || ''}`
                                  : conv.lastMessage.content?.slice(0, 42) || ''}
                          </p>
                        )}
                        <div className="mt-1 flex items-center gap-2 text-xs text-ink-400">
                          <span>{conv.messageCount} msgs</span>
                          {conv.operatorActive && (
                            <span className="rounded bg-green-100 px-1 py-0.5 text-[10px] font-bold text-green-700">EN VIVO</span>
                          )}
                          {conv.paused && (
                            <span className="rounded bg-yellow-100 px-1 py-0.5 text-[10px] font-bold text-yellow-700">PAUSADA</span>
                          )}
                          {conv.blocked && (
                            <span className="rounded bg-red-100 px-1 py-0.5 text-[10px] font-bold text-red-700">BLOQUEADA</span>
                          )}
                          <span className="ml-auto">
                            {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                        {viewMode === 'active' ? (
                          <div className="flex gap-1 mt-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleArchive(conv); }}
                              className="rounded px-1.5 py-0.5 text-[10px] text-ink-400 hover:bg-amber-50 hover:text-amber-700 transition"
                              title="Archivar"
                            >
                              📦 Archivar
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(conv); }}
                              className="rounded px-1.5 py-0.5 text-[10px] text-ink-400 hover:bg-red-50 hover:text-red-600 transition"
                              title="Eliminar permanentemente"
                            >
                              🗑️ Eliminar
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-1 mt-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleUnarchive(conv); }}
                              className="rounded px-1.5 py-0.5 text-[10px] text-ink-400 hover:bg-blue-50 hover:text-blue-700 transition"
                              title="Desarchivar"
                            >
                              📂 Restaurar
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(conv); }}
                              className="rounded px-1.5 py-0.5 text-[10px] text-ink-400 hover:bg-red-50 hover:text-red-600 transition"
                              title="Eliminar permanentemente"
                            >
                              🗑️ Eliminar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex flex-1 flex-col">
        {!selected ? (
          <div className="flex flex-1 items-center justify-center text-ink-300">
            <div className="text-center">
              <MessageCircle size={48} className="mx-auto mb-3 opacity-30" />
              <p>Selecciona una conversación</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header with controls */}
            <div className="flex items-center justify-between border-b border-brand-100 px-4 py-3">
              <div className="min-w-0 flex-1 mr-3">
                <div className="flex items-center gap-2">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${avatarColor(selected)}`}>
                    {selectedConv ? avatarInitial(selectedConv) : '#'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink-900 truncate">
                      {messages[0]?.content?.slice(0, 35) || selectedConv?.lastMessage?.content?.slice(0, 35) || 'Conversación'}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-ink-400">
                      <span>{selectedConv?.messageCount || messages.length} msgs</span>
                      <span>·</span>
                      <span>
                        {selectedConv?.startedAt
                          ? new Date(selectedConv.startedAt).toLocaleString('es-VE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                          : ''}
                      </span>
                      <span>·</span>
                      {selectedConv?.operatorActive ? (
                        <span className="flex items-center gap-1 font-semibold text-green-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                          {selectedConv.operatorName} en control
                        </span>
                      ) : (
                        <span className="text-brand-400">Copito IA respondiendo</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                {!selectedConv?.operatorActive ? (
                  <button onClick={takeOver}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-700 transition">
                    <UserCheck size={14} /> Tomar control
                  </button>
                ) : (
                  <button onClick={release}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-600 transition">
                    <UserX size={14} /> Devolver a Copito
                  </button>
                )}
                {selectedConv && !selectedConv.blocked && (
                  <>
                    {!selectedConv.paused ? (
                      <button onClick={() => socketRef.current?.emit('pauseConversation', { sessionId: selected })}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-yellow-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-yellow-600 transition"
                        title="Pausar conversación">
                        ⏸ Pausar
                      </button>
                    ) : (
                      <button onClick={() => socketRef.current?.emit('resumeConversation', { sessionId: selected })}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-600 transition"
                        title="Reanudar conversación">
                        ▶ Reanudar
                      </button>
                    )}
                    <button onClick={() => openModal({
                      title: 'Bloquear cliente',
                      message: 'El cliente no podrá enviar más mensajes. Se le mostrará un aviso para contactar por WhatsApp.',
                      confirmText: 'Bloquear',
                      confirmColor: 'red',
                      onConfirm: () => {
                        closeModal();
                        socketRef.current?.emit('blockConversation', { sessionId: selected });
                      },
                    })}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 transition"
                      title="Bloquear cliente">
                      🚫 Bloquear
                    </button>
                  </>
                )}
                {selectedConv?.blocked && (
                  <button
                    onClick={() => openModal({
                      title: 'Desbloquear cliente',
                      message: 'El cliente podrá volver a enviar mensajes en esta conversación.',
                      confirmText: 'Desbloquear',
                      confirmColor: 'green',
                      onConfirm: () => {
                        closeModal();
                        socketRef.current?.emit('unblockConversation', { sessionId: selected });
                      },
                    })}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-700 transition"
                    title="Desbloquear cliente"
                  >
                    🔓 Desbloquear
                  </button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <div key={msg.id || i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-brand-600 text-white'
                      : msg.role === 'operator'
                        ? 'bg-green-100 text-green-900 ring-1 ring-green-200'
                        : 'bg-brand-50 text-ink-900'
                  }`}>
                    {msg.role === 'operator' && (
                      <span className="mb-1 block text-[10px] font-bold text-green-600">{msg.operatorName || 'Operador'}</span>
                    )}
                    {msg.role === 'assistant' && (
                      <span className="mb-1 block text-[10px] font-bold text-brand-400">Copito IA</span>
                    )}
                    {msg.type === 'image' && msg.imageUrl ? (
                      <img
                        src={msg.imageUrl}
                        alt="Imagen"
                        className="max-w-[250px] max-h-[250px] rounded-lg object-cover cursor-pointer"
                        onClick={() => window.open(msg.imageUrl, '_blank')}
                        loading="lazy"
                      />
                    ) : (
                      msg.content
                    )}
                    <div className={`mt-1 text-right text-[10px] ${
                      msg.role === 'user'
                        ? 'text-white/60'
                        : msg.role === 'operator'
                          ? 'text-green-500/70'
                          : 'text-ink-300'
                    }`}>
                      {msg.createdAt
                        ? new Date(msg.createdAt).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
                        : ''}
                    </div>
                  </div>
                </div>
              ))}
              {clientTyping === selected && (
                <div className="flex justify-end">
                  <div className="rounded-2xl bg-brand-100 px-4 py-2 text-sm text-ink-400 italic">
                    <span className="inline-flex gap-1">
                      <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                      <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                      <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                    </span>
                    {' '}escribiendo...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input (only when operator has control) */}
            {selectedConv?.operatorActive ? (
              <div className="border-t border-brand-100 p-3">
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    className="hidden"
                    onChange={handleOperatorImage}
                  />
                  <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                    className="rounded-xl bg-brand-100 px-3 py-2.5 text-brand-600 transition hover:bg-brand-200 disabled:opacity-30"
                    title="Enviar imagen">
                    {uploading ? '...' : '📷'}
                  </button>
                  <div className="relative">
                    <button
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={() => setShowEmoji(!showEmoji)}
                      className="rounded-xl px-3 py-2.5 text-lg transition hover:bg-brand-100"
                      type="button"
                      title="Emojis"
                    >
                      😊
                    </button>
                    {showEmoji && (
                      <EmojiPicker
                        onSelect={(emoji) => {
                          setDraft(prev => prev + emoji);
                          inputRef.current?.focus();
                        }}
                        onClose={() => setShowEmoji(false)}
                      />
                    )}
                  </div>
                  <div className="relative">
                    <button
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={() => setShowQuickReplies(!showQuickReplies)}
                      className="rounded-xl px-3 py-2.5 text-brand-500 transition hover:bg-brand-100"
                      type="button"
                      title="Respuestas rápidas"
                    >
                      <Zap size={18} />
                    </button>
                    {showQuickReplies && (
                      <QuickReplies
                        onSelect={(text) => {
                          setDraft(prev => prev + text);
                          inputRef.current?.focus();
                        }}
                        onClose={() => setShowQuickReplies(false)}
                      />
                    )}
                  </div>
                  <input
                    ref={inputRef}
                    type="text"
                    value={draft}
                    onChange={e => {
                      setDraft(e.target.value);
                      const now = Date.now();
                      if (now - lastOperatorTypingRef.current > 2000 && socketRef.current && selected) {
                        socketRef.current.emit('typing', { sessionId: selected });
                        lastOperatorTypingRef.current = now;
                      }
                    }}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 rounded-xl border border-brand-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-400"
                  />
                  <button onClick={sendMessage} disabled={!draft.trim() || sending}
                    className="rounded-xl bg-brand-600 px-4 py-2.5 text-white transition hover:bg-brand-700 disabled:opacity-30">
                    <Send size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-t border-brand-100 p-3 text-center text-xs text-ink-400">
                Copito IA está respondiendo. Presiona "Tomar control" para chatear tú.
              </div>
            )}
          </>
        )}
      </div>
      <ConfirmModal
        open={modal.open}
        title={modal.title}
        message={modal.message}
        confirmText={modal.confirmText}
        confirmColor={modal.confirmColor}
        onConfirm={modal.onConfirm}
        onCancel={closeModal}
      />
    </div>
  );
}
