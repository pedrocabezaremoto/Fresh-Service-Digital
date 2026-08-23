import { useEffect, useRef, useState } from 'react';
import { RotateCcw, Send, X } from 'lucide-react';
import { io } from 'socket.io-client';
import { API_BASE } from '../lib/api';

const SESSION_KEY = 'copito_session';
const MESSAGES_KEY = 'copito_messages';
const TEASER_KEY = 'copito_teaser_dismissed';
const TEASER_DELAY_MS = 15000;
const MAX_MSG_LEN = 500;

function loadSession() {
  try { return sessionStorage.getItem(SESSION_KEY); } catch { return null; }
}
function saveSession(id) {
  try { sessionStorage.setItem(SESSION_KEY, id); } catch {}
}
function loadMessages() {
  try {
    const raw = sessionStorage.getItem(MESSAGES_KEY);
    return raw ? JSON.parse(raw).filter(m => m.id && m.role && typeof m.content === 'string') : [];
  } catch { return []; }
}
function saveMessages(msgs) {
  try { sessionStorage.setItem(MESSAGES_KEY, JSON.stringify(msgs)); } catch {}
}
function uid() { return crypto.randomUUID(); }

function compressImage(file, maxWidth = 1024, maxHeight = 1024, quality = 0.7) {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file);
      };

      img.onload = () => {
        URL.revokeObjectURL(url);
        try {
          let { width, height } = img;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            resolve(file);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve(file);
                return;
              }
              if (blob.size > 900 * 1024 && quality > 0.3) {
                canvas.toBlob(
                  (blob2) => resolve(blob2 || blob),
                  'image/jpeg',
                  0.4,
                );
              } else {
                resolve(blob);
              }
            },
            'image/jpeg',
            quality,
          );
        } catch {
          resolve(file);
        }
      };
      img.src = url;
    } catch {
      resolve(file);
    }
  });
}

function CopitoIcon({ size = 28 }) {
  return (
    <img
      src="/copito-avatar.png"
      alt="Copito"
      width={size}
      height={size}
      className="rounded-full object-contain"
      draggable={false}
    />
  );
}

function TypingDots() {
  return (
    <div className="flex max-w-[85%] items-center gap-1 rounded-2xl rounded-bl-sm bg-brand-50 px-3 py-2">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-400" style={{ animationDelay: '0ms' }} />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-400" style={{ animationDelay: '150ms' }} />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-400" style={{ animationDelay: '300ms' }} />
    </div>
  );
}

function renderMarkdown(text) {
  if (!text) return '';
  const escaped = String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped
    .replace(/\*\*([\s\S]+?)\*\*/g, '<strong style="font-weight:700">$1</strong>')
    .replace(/__([\s\S]+?)__/g, '<strong style="font-weight:700">$1</strong>')
    .replace(/(^|[^*])\*(?!\*)([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')
    .replace(/\n/g, '<br/>');
}

export default function Copito() {
  const [open, setOpen] = useState(false);
  const [showTeaser, setShowTeaser] = useState(false);
  const [sessionId, setSessionId] = useState(() => loadSession() || (() => { const id = uid(); saveSession(id); return id; })());
  const [messages, setMessages] = useState(loadMessages);
  const [draft, setDraft] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [chatEnabled, setChatEnabled] = useState(true);
  const [statusChecked, setStatusChecked] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [chatMode, setChatMode] = useState('ai'); // 'ai' | 'operator'
  const [operatorName, setOperatorName] = useState('');
  const [socketSessionId, setSocketSessionId] = useState(() => loadSession());
  const [imageCount, setImageCount] = useState(() => loadMessages().filter(m => m.type === 'image').length);
  const [moderationMsg, setModerationMsg] = useState('');

  const panelRef = useRef(null);
  const socketRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesRef = useRef(null);
  const textareaRef = useRef(null);
  const abortRef = useRef(null);
  const stickRef = useRef(true);

  // Check status
  useEffect(() => {
    fetch(`${API_BASE}/chat/status`).then(r => r.json())
      .then(d => { setChatEnabled(d.enabled); setStatusChecked(true); })
      .catch(() => { setChatEnabled(false); setStatusChecked(true); });
  }, []);

  // Teaser
  useEffect(() => {
    if (sessionStorage.getItem(TEASER_KEY) === '1') return;
    const t = setTimeout(() => {
      if (sessionStorage.getItem(TEASER_KEY) !== '1') setShowTeaser(true);
    }, TEASER_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  // Persist messages
  useEffect(() => { saveMessages(messages); }, [messages]);

  // Auto-scroll
  useEffect(() => {
    if (stickRef.current && messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, streaming]);

  // Focus textarea when open
  useEffect(() => {
    if (open) setTimeout(() => textareaRef.current?.focus(), 100);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) close();
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [open]);

  useEffect(() => {
    if (!open || !socketSessionId) return;

    const socket = io(`${API_BASE}/live-chat`, {
      auth: { sessionId: socketSessionId },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Copito] Socket connected, sessionId:', socketSessionId);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Copito] Socket error:', err.message);
    });

    socket.on('mode', (data) => {
      setChatMode(data.mode);
      if (data.mode === 'operator') {
        setOperatorName(data.operatorName || 'Operador');
      }
    });

    socket.on('moderation', (data) => {
      if (data.action === 'blocked' || data.action === 'paused') {
        setModerationMsg(data.message);
        setChatEnabled(false);
      } else if (data.action === 'resumed') {
        setModerationMsg('');
        setChatEnabled(true);
      }
    });

    socket.on('message', (msg) => {
      if (msg.role === 'operator') {
        setMessages(prev => {
          const updated = [...prev, {
            id: msg.id,
            role: 'assistant',
            content: msg.content,
            operatorName: msg.operatorName,
            type: msg.type || 'text',
            imageUrl: msg.imageUrl,
          }];
          saveMessages(updated);
          return updated;
        });
      }
    });

    return () => { socket.disconnect(); socketRef.current = null; };
  }, [open, socketSessionId]);

  function close() {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
    setMessages(prev => {
      const last = prev[prev.length - 1];
      if (last?.role === 'assistant' && last.content === '') return prev.slice(0, -1);
      return prev;
    });
    setOpen(false);
  }

  function resetChat() {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
    setConfirmReset(false);
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(MESSAGES_KEY);
    const newId = uid();
    saveSession(newId);
    setSessionId(newId);
    setSocketSessionId(newId);
    setMessages([]);
    setDraft('');
    setImageCount(0);
    setModerationMsg('');
    stickRef.current = true;
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (imageCount >= 5) {
      alert('Máximo 5 imágenes por conversación.');
      return;
    }

    const compressed = await compressImage(file);

    if (!compressed) {
      alert('No se pudo procesar la imagen.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('file', compressed, 'foto.jpg');
    formData.append('sessionId', sessionId);

    try {
      const res = await fetch(`${API_BASE}/chat/upload-image`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
        return;
      }
      setMessages(prev => {
        const updated = [...prev, {
          id: data.messageId,
          role: 'user',
          content: '[Imagen]',
          type: 'image',
          imageUrl: data.url,
        }];
        saveMessages(updated);
        return updated;
      });
      setImageCount(prev => prev + 1);
    } catch {
      alert('Error al subir la imagen.');
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function sendMessage() {
    const text = draft.trim();
    if (!text || streaming || !chatEnabled) return;

    const userMsg = { id: uid(), role: 'user', content: text };
    const assistantId = uid();
    const placeholder = { id: assistantId, role: 'assistant', content: '' };

    setDraft('');
    stickRef.current = true;
    setMessages(prev => [...prev, userMsg, placeholder]);
    setStreaming(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        body: JSON.stringify({ sessionId, message: text }),
        signal: controller.signal,
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const payload = trimmed.slice(5).trim();
          try {
            const event = JSON.parse(payload);
            if (event.type === 'token') {
              setMessages(prev => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last?.id === assistantId && last.role === 'assistant') {
                  next[next.length - 1] = { ...last, content: last.content + event.value };
                }
                return next;
              });
            } else if (event.type === 'error') {
              setMessages(prev => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last?.id === assistantId) {
                  next[next.length - 1] = { id: assistantId, role: 'error', content: event.message };
                }
                return next;
              });
            }
          } catch {}
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setMessages(prev => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.id === assistantId) {
            next[next.length - 1] = { id: assistantId, role: 'error', content: 'Error de conexión. Intenta de nuevo.' };
          }
          return next;
        });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        const next = last?.id === assistantId && last.role === 'assistant' && last.content === ''
          ? prev.slice(0, -1)
          : prev;
        saveMessages(next);
        return next;
      });
    }
  }

  const canSend = chatEnabled && !streaming && draft.trim().length > 0 && statusChecked;

  return (
    <div ref={panelRef} className="fixed bottom-10 right-4 sm:bottom-6 sm:right-6 z-[60] flex items-end gap-3">
      {/* Teaser */}
      {showTeaser && !open && (
        <div className="absolute bottom-full right-0 mb-3 flex max-w-[220px] items-start gap-2 rounded-xl border border-brand-200 bg-white px-3 py-2 shadow-lg animate-[fadeIn_0.2s_ease-out]">
          <p className="text-sm text-ink-700">¿Necesitas ayuda con tu aire?</p>
          <button onClick={() => { setShowTeaser(false); sessionStorage.setItem(TEASER_KEY, '1'); }}
            className="shrink-0 rounded-md p-0.5 text-ink-500 hover:text-ink-900">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Panel del chat */}
      {open && (
        <div className="fixed inset-0 z-50 flex h-dvh w-full flex-col overflow-hidden bg-white shadow-xl sm:absolute sm:inset-auto sm:bottom-full sm:right-0 sm:mb-3 sm:h-[560px] sm:max-h-[calc(100dvh-9rem)] sm:w-[380px] sm:rounded-2xl sm:border sm:border-brand-200">
          {/* Header */}
          <header className="flex shrink-0 items-center gap-3 border-b border-brand-100 bg-gradient-to-r from-brand-950 to-brand-800 px-4 py-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white/20 ring-2 ring-white/30">
              <CopitoIcon size={36} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">Copito</p>
              <p className="text-xs text-brand-200">
                {chatMode === 'operator' ? `${operatorName} — en vivo` : 'Asistente IA de Fresh Service'}
              </p>
            </div>
            {chatMode === 'operator' && (
              <span className="shrink-0 rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-bold text-white animate-pulse">EN VIVO</span>
            )}
            <div className="flex items-center gap-1">
              <button onClick={() => setConfirmReset(true)}
                className="rounded-md p-1.5 text-brand-200 hover:bg-white/10 hover:text-white">
                <RotateCcw size={16} />
              </button>
              <button onClick={close}
                className="rounded-md p-1.5 text-brand-200 hover:bg-white/10 hover:text-white">
                <X size={16} />
              </button>
            </div>
          </header>

          {/* Confirm reset overlay */}
          {confirmReset && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-brand-950/80 p-6 backdrop-blur-sm">
              <div className="w-full max-w-[280px] rounded-xl border border-brand-200 bg-white p-5 shadow-2xl">
                <p className="text-sm font-semibold text-ink-900">¿Reiniciar la conversación?</p>
                <p className="mt-2 text-sm text-ink-500">Se borrará el historial de este chat.</p>
                <div className="mt-5 flex justify-end gap-2">
                  <button onClick={() => setConfirmReset(false)}
                    className="rounded-lg border border-brand-200 px-3 py-2 text-sm text-ink-500 hover:bg-brand-50">
                    Cancelar
                  </button>
                  <button onClick={resetChat}
                    className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700">
                    Reiniciar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          <div ref={messagesRef}
            onScroll={() => {
              const el = messagesRef.current;
              if (el) stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight <= 48;
            }}
            className="flex-1 space-y-3 overflow-y-auto p-4 bg-brand-50/30">

            {/* Mensaje de bienvenida */}
            {messages.length === 0 && chatEnabled && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-white px-3 py-2 text-sm text-ink-700 shadow-sm ring-1 ring-brand-100">
                  ¡Hola! Soy Copito ❄️ ¿En qué puedo ayudarte hoy? Pregúntame sobre nuestros servicios de refrigeración y aires acondicionados.
                </div>
              </div>
            )}

            {!chatEnabled && statusChecked && (
              <div className="flex flex-col items-center gap-3 px-2 py-6 text-center">
                <p className="text-sm text-ink-500">Ahora mismo no puedo atenderte por aquí.</p>
                <a href="https://wa.me/584163766075" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">
                  Escribir por WhatsApp
                </a>
              </div>
            )}

            {chatEnabled && messages.map(msg => {
              if (msg.role === 'user') {
                return (
                  <div key={msg.id} className="flex justify-end">
                    <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-brand-600 px-3 py-2 text-sm text-white">
                      {msg.type === 'image' && msg.imageUrl ? (
                        <img
                          src={msg.imageUrl}
                          alt="Imagen enviada"
                          className="max-w-[200px] max-h-[200px] rounded-lg object-cover cursor-pointer"
                          onClick={() => window.open(msg.imageUrl, '_blank')}
                          loading="lazy"
                        />
                      ) : (
                        <span dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                      )}
                    </div>
                  </div>
                );
              }
              if (msg.role === 'error') {
                return (
                  <div key={msg.id} className="flex flex-col items-center gap-2 px-2 text-center">
                    <p className="text-xs text-ink-500">{msg.content}</p>
                    <a href="https://wa.me/584163766075" target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700">
                      Escribir por WhatsApp
                    </a>
                  </div>
                );
              }
              if (msg.content === '' && streaming) return null;
              return (
                <div key={msg.id} className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-white px-3 py-2 text-sm text-ink-700 shadow-sm ring-1 ring-brand-100 [&_strong]:font-semibold [&_em]:italic">
                    {msg.operatorName && (
                      <span className="mb-1 block text-[10px] font-semibold text-brand-500">{msg.operatorName}</span>
                    )}
                    {msg.type === 'image' && msg.imageUrl ? (
                      <img
                        src={msg.imageUrl}
                        alt="Imagen enviada"
                        className="max-w-[200px] max-h-[200px] rounded-lg object-cover cursor-pointer"
                        onClick={() => window.open(msg.imageUrl, '_blank')}
                        loading="lazy"
                      />
                    ) : (
                      <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                    )}
                  </div>
                </div>
              );
            })}

            {streaming && messages[messages.length - 1]?.role === 'assistant' && messages[messages.length - 1]?.content === '' && (
              <div className="flex justify-start"><TypingDots /></div>
            )}
          </div>

          {/* Input */}
          {moderationMsg ? (
            <div className="border-t border-brand-100 p-4 text-center">
              <p className="text-sm text-red-500 font-medium">{moderationMsg}</p>
            </div>
          ) : (
          <footer className="shrink-0 border-t border-brand-100 bg-white p-3">
            <div className="flex items-end gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg,image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={!chatEnabled || imageCount >= 5}
                className="shrink-0 rounded-lg p-2 text-brand-400 hover:bg-brand-50 hover:text-brand-600 disabled:opacity-30 transition"
                aria-label="Enviar imagen"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
              </button>
              <div className="min-w-0 flex-1">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  maxLength={MAX_MSG_LEN}
                  value={draft}
                  disabled={!chatEnabled || streaming || !statusChecked}
                  onChange={e => {
                    setDraft(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 72) + 'px';
                  }}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Escribe tu mensaje…"
                  className="max-h-[72px] min-h-[40px] w-full resize-none rounded-xl border border-brand-200 bg-brand-50/50 px-3 py-2 text-sm text-ink-900 outline-none placeholder:text-ink-500/50 focus:border-brand-400 disabled:cursor-not-allowed disabled:opacity-60"
                />
                {draft.length > 400 && (
                  <p className="mt-1 text-right text-xs text-ink-500">{draft.length}/{MAX_MSG_LEN}</p>
                )}
              </div>
              <button onClick={sendMessage} disabled={!canSend}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white transition hover:bg-brand-700 disabled:pointer-events-none disabled:opacity-60">
                <Send size={16} />
              </button>
            </div>
          </footer>
          )}
        </div>
      )}

      {/* FAB button */}
      <div className={open ? '' : 'animate-widget-float'}>
        <button
          onClick={() => {
            if (!open) { setShowTeaser(false); sessionStorage.setItem(TEASER_KEY, '1'); }
            setOpen(prev => !prev);
          }}
          className="group relative overflow-hidden rounded-full bg-gradient-to-br from-brand-600 to-brand-400 p-2 shadow-glow transition-all duration-200 hover:scale-110 hover:shadow-glow-lg"
          aria-label="Chat con Copito"
        >
          <CopitoIcon size={40} />
          <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-brand-400/30" style={{ animationDuration: '3s' }} />
        </button>
      </div>
    </div>
  );
}
