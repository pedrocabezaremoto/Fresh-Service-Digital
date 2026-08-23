import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { MessageCircle, Send, UserCheck, UserX } from 'lucide-react';
import { API_BASE } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import ConfirmModal from './ConfirmModal';

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
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState('active'); // 'active' | 'archived'
  const [archivedConversations, setArchivedConversations] = useState([]);
  const [modal, setModal] = useState({ open: false, title: '', message: '', confirmText: '', confirmColor: 'blue', onConfirm: () => {} });

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
    });

    return () => socket.disconnect();
  }, [token]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    if (selected === conv.sessionId) {
      setSelected(null);
      selectedRef.current = null;
      setMessages([]);
    }
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

  const list = viewMode === 'active' ? conversations : archivedConversations;
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
            <span className={`ml-auto h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
          </h3>
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
              {viewMode === 'archived' ? 'No hay conversaciones archivadas' : 'No hay conversaciones activas'}
            </p>
          ) : (
            list.map(conv => (
              <div
                key={conv.sessionId}
                onClick={() => selectConversation(conv)}
                className={`w-full cursor-pointer border-b border-brand-50 px-4 py-3 text-left transition hover:bg-brand-50 ${
                  selected === conv.sessionId ? 'bg-brand-50 ring-1 ring-inset ring-brand-200' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-ink-900 truncate">
                    {conv.lastMessage?.content?.slice(0, 30) || 'Sin mensajes'}
                  </span>
                  {conv.unreadByAdmin > 0 && (
                    <span className="rounded-full bg-brand-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {conv.unreadByAdmin}
                    </span>
                  )}
                </div>
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
            ))
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
              <div>
                <p className="text-sm font-semibold text-ink-900">
                  Sesión: {selected.slice(0, 8)}...
                </p>
                <p className="text-xs text-ink-400">
                  {selectedConv?.operatorActive
                    ? `${selectedConv.operatorName} tiene el control`
                    : 'Copito IA respondiendo'}
                </p>
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
                  <span className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700">Bloqueado</span>
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
                  </div>
                </div>
              ))}
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
                  <input
                    type="text"
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
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
