/* =====================================================
   FRESH SERVICE DIGITAL — Set de iconos SVG
   Estilo línea fina (stroke), heredan el color con currentColor.
   Uso en HTML:  <span data-icon="snowflake"></span>
   Se inyectan automáticamente al cargar la página.
   ===================================================== */
(function () {
  const S = (paths, extra = '') =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${paths}</svg>`;

  const ICONS = {
    // Marca / refrigeración
    snowflake: S('<line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="4.5" y1="4.5" x2="19.5" y2="19.5"/><line x1="19.5" y1="4.5" x2="4.5" y2="19.5"/><path d="M12 5l-2 2M12 5l2 2M12 19l-2-2M12 19l2-2M5 12l2-2M5 12l2 2M19 12l-2-2M19 12l-2 2"/>'),
    snow: S('<path d="M12 2v20M17 5l-5 3-5-3M7 19l5-3 5 3M2 12h20M5 7l3 5-3 5M19 7l-3 5 3 5"/>'),
    'ac-unit': S('<rect x="2" y="4" width="20" height="11" rx="2"/><path d="M6 19h.01M10 19l1 2M14 19l-1 2M18 19h.01"/><line x1="6" y1="11" x2="18" y2="11"/>'),
    wind: S('<path d="M3 8h10a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h7a3 3 0 1 1-3 3"/>'),
    wrench: S('<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.1 2.1-2.4-.6-.6-2.4 2.1-2.1z"/>'),
    fridge: S('<rect x="6" y="2" width="12" height="20" rx="2"/><line x1="6" y1="10" x2="18" y2="10"/><line x1="9" y1="5" x2="9" y2="7"/><line x1="9" y1="13" x2="9" y2="16"/>'),

    // Navegación / panel
    dashboard: S('<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>'),
    clipboard: S('<rect x="5" y="4" width="14" height="18" rx="2"/><path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="14" y2="14"/>'),
    users: S('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>'),
    chart: S('<path d="M3 3v18h18"/><rect x="7" y="11" width="3" height="6" rx="1"/><rect x="12" y="7" width="3" height="10" rx="1"/><rect x="17" y="13" width="3" height="4" rx="1"/>'),
    settings: S('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>'),

    // Acciones
    refresh: S('<path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6"/>'),
    logout: S('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>'),
    globe: S('<circle cx="12" cy="12" r="9"/><line x1="3" y1="12" x2="21" y2="12"/><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z"/>'),
    bell: S('<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>'),
    search: S('<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>'),
    check: S('<path d="M20 6L9 17l-5-5"/>'),
    'check-circle': S('<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/>'),
    clock: S('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    calendar: S('<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>'),
    mail: S('<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 6L2 7"/>'),
    'arrow-left': S('<line x1="19" y1="12" x2="5" y2="12"/><path d="M12 19l-7-7 7-7"/>'),
    'arrow-right': S('<line x1="5" y1="12" x2="19" y2="12"/><path d="M12 5l7 7-7 7"/>'),
    moon: S('<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'),
    sun: S('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
    whatsapp: S('<path d="M3 21l1.65-4.5A8 8 0 1 1 12 20a8 8 0 0 1-4-1L3 21z"/><path d="M9 9.5c0 .5.2 1 .5 1.5.5.9 1.6 2 2.5 2.5.5.3 1 .5 1.5.5.4 0 .9-.3 1-.7.1-.3 0-.6-.2-.8l-1-.6c-.2-.1-.5-.1-.6.1l-.3.4c-.6-.3-1.2-.9-1.5-1.5l.4-.3c.2-.1.2-.4.1-.6l-.6-1c-.2-.2-.5-.3-.8-.2-.4.1-.7.6-.7 1z"/>'),
    shield: S('<path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-4z"/><path d="M9 12l2 2 4-4"/>'),
    eye: S('<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>'),
    pin: S('<path d="M12 21s-7-5.2-7-11a7 7 0 0 1 14 0c0 5.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>'),
    headset: S('<path d="M4 13a8 8 0 0 1 16 0v5a2 2 0 0 1-2 2h-1a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h3M4 13v3a2 2 0 0 0 2 2h1a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1H4"/>'),
    star: S('<path d="M12 2l3 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.9 21l1.2-6.8-5-4.9 6.9-1L12 2z"/>'),
    bolt: S('<path d="M13 2L4 14h7l-2 8 9-12h-7l2-8z"/>'),
  };

  function render() {
    document.querySelectorAll('[data-icon]').forEach((el) => {
      const name = el.getAttribute('data-icon');
      if (ICONS[name] && !el.dataset.iconDone) {
        el.innerHTML = ICONS[name];
        el.dataset.iconDone = '1';
      }
    });
  }

  // Disponible para contenido dinámico (ej. tablas generadas por JS)
  window.FSIcons = { svg: (name) => ICONS[name] || '', render };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
