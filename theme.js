// theme.js - Script global para el manejo del Modo Oscuro
document.addEventListener('DOMContentLoaded', () => {
  const toggles = document.querySelectorAll('.theme-toggle');

  // Función para actualizar los iconos de los botones (SVG si icons.js está cargado)
  const updateToggleIcons = (isDark) => {
    const icon = window.FSIcons
      ? window.FSIcons.svg(isDark ? 'sun' : 'moon')
      : (isDark ? '☀️' : '🌙');
    toggles.forEach(btn => {
      btn.innerHTML = icon;
    });
  };

  // Determinar el estado inicial leyendo la clase en <html>
  const isDark = document.documentElement.classList.contains('dark-mode');
  updateToggleIcons(isDark);

  // Vincular eventos de clic
  toggles.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const currentlyDark = document.documentElement.classList.toggle('dark-mode');
      localStorage.setItem('theme', currentlyDark ? 'dark' : 'light');
      updateToggleIcons(currentlyDark);
    });
  });
});
