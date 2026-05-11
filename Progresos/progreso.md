# 📍 Estado Actual del Proyecto — Fresh Service Digital

> Este documento describe en qué etapa se encuentra el proyecto HOY y cuáles son los problemas pendientes de resolver.

**Última actualización:** 2026-05-11  
**Fase del proyecto:** Fase 1 — Prototipo UI (HTML5 + CSS Puro)  
**Deploy activo:** [pedrocabezaremoto.github.io/Fresh-Service-Digital](https://pedrocabezaremoto.github.io/Fresh-Service-Digital/index.html)

---

## ✅ Lo que YA está resuelto

| Problema | Solución aplicada |
|---|---|
| Slide-tag rompía en 2 líneas en móvil | `white-space: nowrap` en `.slide-tag` |
| Tarjetas del catálogo aplastadas en 2 columnas | Nueva clase `.services-grid-2` con media query propio |
| Carousel mostraba 2 slides simultáneamente | `overflow-x: hidden` en elemento `html` |
| Hero demasiado alto en móvil | `height: 70vh` en media query `≤600px` |
| Documentación del proyecto | Creados `README.md` y `AGENTS.md` en raíz |

---

## 🔴 PROBLEMA ACTIVO — Navbar invisible en dispositivos móviles

### ¿Qué ve el usuario?

**En escritorio (correcto ✅):**
- Navbar completamente visible: ícono ❄ girando + texto "Fresh Service Digital" + enlaces de navegación (INICIO, SERVICIOS, MI CUENTA) + botón CTA "SOLICITAR SERVICIO ›"

**En móvil (incorrecto ❌):**
- Navbar casi invisible: Solo se distingue un pequeño ícono azul (el `.brand-icon`)
- El texto del brand, los demás elementos y el botón hamburguesa no se ven o son apenas perceptibles
- La diferencia visual entre desktop y móvil es enorme

### Evidencia visual
- Screenshot móvil: DevTools iPhone 12 Pro simulation (390px) → navbar aparece como una línea delgada oscura con un pequeño icono azul
- Screenshot desktop: Browser normal → navbar completamente visible y bien definida

### Hipótesis del problema (investigar en este orden)

**Hipótesis 1 — backdrop-filter (MÁS PROBABLE)**
El navbar usa `backdrop-filter: blur(14px)` y `background: rgba(255,255,255,0.88)`. En móvil, algunos navegadores (Chrome Android, Safari iOS) no renderizan correctamente el `backdrop-filter`, haciendo el fondo transparente. Al ser transparente, el navbar (blanco sobre azul del hero) se vuelve casi invisible.
- Fix intentado: Se agregó `background: var(--white); backdrop-filter: none` para mobile `≤768px`
- Estado: ⚠️ Aún persiste

**Hipótesis 2 — overflow-x: hidden rompiendo position: sticky**
Se agregó `overflow-x: hidden` al elemento `html` para corregir el carousel. Existe un bug conocido en navegadores donde `overflow` en un ancestro rompe `position: sticky`. Si el sticky del navbar se rompe, puede que no se posicione correctamente.
- Pendiente verificar: Probar removiendo `overflow-x: hidden` del `html` y usar otra estrategia para el carousel

**Hipótesis 3 — Dark Reader extension interfiriendo**
El DevTools screenshot muestra que la extensión Dark Reader está activa (`data-darkreader-mode="dynamic"`). Dark Reader convierte colores, y puede hacer el fondo blanco del navbar oscuro. Si el text del navbar también es oscuro → texto sobre fondo oscuro = invisible.
- Esta hipótesis solo aplica en el navegador con Dark Reader activo
- El deploy en producción puede verse diferente

**Hipótesis 4 — z-index o superposición con el hero**
El hero carousel podría estar superponiéndose sobre el navbar en móvil. El `.hero` section viene inmediatamente después del navbar. Si hay algún problema de stacking context, el carousel podría tapar el navbar.

---

## 🧪 Estrategias de Fix Pendientes de Probar

### Estrategia A — Remover overflow-x del html y usar contención directa en el carousel
```css
/* En index.html, dentro del <style> del hero */
.hero {
  overflow: clip;  /* 'clip' es más agresivo que 'hidden' y no crea stacking context */
}
```
Y en `styles.css`, revertir:
```css
html { scroll-behavior: smooth; font-size: 16px; /* QUITAR overflow-x: hidden */ }
```

### Estrategia B — Hacer el navbar completamente sólido y sin dependencia de backdrop-filter
```css
/* En styles.css, reemplazar el navbar background */
.navbar {
  background: var(--white);  /* Sólido, sin rgba */
  /* Quitar backdrop-filter completamente */
}
```

### Estrategia C — Probar con position: fixed en lugar de sticky para el navbar
```css
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
}
body {
  padding-top: var(--nav-height); /* Compensar el espacio */
}
```

### Estrategia D — Verificar en dispositivo real sin Dark Reader
Antes de seguir modificando código, verificar si el problema existe en un dispositivo real (iPhone/Android físico) abriendo el link directo sin extensiones del navegador.

---

## 📁 Estructura Actual del Proyecto

```
Fresh-Service-Digital/
├── index.html        ← Landing Page (TIENE fixes de carousel y hero)
├── catalogo.html     ← Catálogo (TIENE fix de grid responsivo)
├── dashboard.html    ← Panel Admin (sin cambios)
├── login.html        ← Login (sin cambios)
├── recuperar.html    ← Recuperar clave (sin cambios)
├── registro.html     ← Registro (sin cambios)
├── solicitud.html    ← Solicitud servicio (sin cambios)
├── styles.css        ← MODIFICADO: overflow-x html + navbar mobile fix
├── README.md         ← Documentación pública (NUEVO)
├── AGENTS.md         ← Briefing para agentes IA (NUEVO)
├── History/
│   └── historial.md  ← Historial completo de cambios (NUEVO)
└── Progresos/
    └── progreso.md   ← Este archivo (NUEVO)
```

---

## 🛑 Reglas Importantes para el Agente que Continúe

1. **NO usar React, Vue, Tailwind, Vite, TypeScript** — Esta es Fase 1, solo HTML5 + CSS puro
2. **NO conectar a Supabase ni backend** — Toda la data es hardcoded
3. **NO cambiar la paleta de colores** — Azul hielo definida en `styles.css` con variables CSS
4. **NO romper la navegación entre archivos** — Solo `<a href="">` tradicional
5. **El problema del navbar PERSISTE** — El agente debe resolverlo antes de hacer cualquier otra cosa
6. **Verificar siempre en móvil real o DevTools** antes de hacer push

---

## 📞 Contexto del Negocio

- **Servicio:** Refrigeración y climatización a domicilio
- **Ubicación:** San Juan de los Morros, estado Guárico, Venezuela
- **Propósito actual del prototipo:** Mostrar el bosquejo visual funcional a clientes potenciales
- **Fase 2 (futura):** Integrar React + Supabase + autenticación real + mapas
