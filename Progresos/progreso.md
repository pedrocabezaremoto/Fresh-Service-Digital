# 📍 Estado Actual del Proyecto — Fresh Service Digital

> Este documento describe en qué etapa se encuentra el proyecto HOY y cuáles son los problemas pendientes de resolver.

**Última actualización:** 2026-05-11  
**Fase del proyecto:** Fase 3 — Corrección de bugs críticos de navbar y flickering  
**Deploy activo:** [pedrocabezaremoto.github.io/Fresh-Service-Digital](https://pedrocabezaremoto.github.io/Fresh-Service-Digital/index.html)

---

## ✅ Lo que YA está resuelto y funcionando

| Problema | Solución aplicada | Verificado |
|---|---|---|
| Slide-tag rompía en 2 líneas en móvil | `white-space: nowrap` en `.slide-tag` | ✅ |
| Tarjetas del catálogo aplastadas en 2 columnas | Clase `.services-grid-2` con media query | ✅ |
| Carousel mostraba 2 slides simultáneamente | `overflow-x: hidden` → `clip` en `html` | ✅ |
| Hero demasiado alto en móvil | `height: 70vh` media query ≤600px | ✅ |
| Navbar fondo transparente (backdrop-filter) | `background: var(--white)` sólido | ✅ Desktop |
| Fuente body mejorada | Nunito → Inter (más profesional) | ✅ |
| Shadows más elegantes | Neutral rgba(15,23,42) vs cyan-tinted | ✅ |
| Accesibilidad prefers-reduced-motion | Media query agregado | ✅ |
| Navbar invisible/cortado en móvil | Añadido `visibility: hidden/visible` para evitar superposición | ✅ |

---

## ✅ BUG CRÍTICO #1 — Navbar invisible en Android / Móvil (SOLUCIONADO)

### Causa del error
En pantallas móviles y tabletas (`max-width: 768px`), el menú desplegable `.nav-links` tiene un fondo blanco sólido y se oculta desplazándose hacia arriba usando `transform: translateY(-110%);`. 
Sin embargo, dado que `.nav-links` es un elemento hijo de `.navbar` y se encuentra después del logo y el botón hamburguesa en el orden del DOM, su contenedor seguía renderizándose y superponiéndose sobre el resto de los elementos del navbar. Esto causaba que:
1. Tapara el texto del logo y el botón de menú hamburguesa (haciéndolos invisibles).
2. Cortara el icono de copo de nieve `.brand-icon` por la mitad.

### Solución aplicada
1. **Ocultamiento por visibilidad:** Se añadió `visibility: hidden;` a `.nav-links` por defecto en su estado móvil cerrado para evitar que se renderice sobre el navbar.
2. **Activación al abrir:** Se configuró `visibility: visible;` en `.nav-links.open` para que se muestre cuando el usuario pulsa el menú hamburguesa.
3. **Transición suave:** Se añadió `visibility 0.35s` a la directiva de transición en `.nav-links` para mantener la animación fluida y sin saltos visuales.

Esto restaura por completo la visibilidad del navbar (fondo blanco sólido, marca del sitio y menú hamburguesa en su posición original) en todos los dispositivos móviles y tabletas.

---

## 🔴 BUG CRÍTICO #2 — Flickering / Parpadeo de letras y logo

### Comportamiento observado
- Las letras del hero (títulos del carousel) parpadean constantemente
- El logo "Fresh Service Digital" en el navbar parpadea
- Hay cambios erráticos de color y peso tipográfico
- Se observa tanto en desktop como en móvil
- Se ve en el screenshot del device real y en DevTools

### Causa probable más alta

**Causa A — Conflicto de animaciones CSS simultáneas:**
El proyecto tiene TRES animaciones corriendo al mismo tiempo en la misma página:
1. `@keyframes carousel-auto` — el carousel se mueve cada 5s
2. `@keyframes flake-spin` — el `.brand-icon` rota continuamente (10s)
3. `@keyframes dot-active-1/2/3` — los dots del carousel animados (15s)

Cuando múltiples animaciones CSS corren sobre elementos en el mismo stacking context, algunos navegadores hacen repaint de toda la capa, causando flickering visible.

**Causa B — Dark Reader extension:**
Los screenshots muestran `data-darkreader-mode="dynamic"`. Dark Reader inyecta un script que reescribe los colores CSS dinámicamente en tiempo real. Esto interfiere con las animaciones CSS y puede causar flickering porque Dark Reader actualiza los valores de color mientras el browser intenta animar.

**Nota importante:** Si el flickering desaparece al desactivar Dark Reader, la causa es la extensión y NO el código. En ese caso, el sitio es correcto para usuarios sin esa extensión.

### Fixes intentados
- Remoción de `backdrop-filter: blur()` de todos los archivos → No resolvió el flickering

### Próximos pasos para diagnosticar
1. **Verificar con Dark Reader desactivado** — Si el flickering desaparece, la causa es la extensión
2. Si persiste sin Dark Reader → agregar `will-change: transform` a `.brand-icon` y `.carousel-track`
3. Si persiste → reducir animaciones: eliminar la rotación del `.brand-icon` (es decorativa)
4. Si persiste → simplificar el carousel a CSS transition manual en vez de `@keyframes`

---

## 📁 Estado Actual de Archivos

```
Fresh-Service-Digital/
├── index.html        ← backdrop-filter REMOVIDO, hero height fix aplicado
├── catalogo.html     ← grid responsive fix aplicado
├── dashboard.html    ← padding-top: 0 override aplicado
├── login.html        ← padding-top: 0 override aplicado
├── recuperar.html    ← padding-top: 0 override aplicado
├── registro.html     ← backdrop-filter REMOVIDO, padding-top: 0 aplicado
├── solicitud.html    ← sin cambios recientes
├── styles.css        ← MÚLTIPLES CAMBIOS:
│                        - Inter font (era Nunito)
│                        - position: fixed en navbar
│                        - padding-top en body
│                        - overflow-x: clip en html
│                        - shadows neutrales
│                        - prefers-reduced-motion
├── README.md
├── AGENTS.md
├── History/
│   └── historial.md  ← actualizado
└── Progresos/
    └── progreso.md   ← este archivo
```

---

## 🛑 Reglas Importantes para el Agente que Continúe

1. **NO usar React, Vue, Tailwind, Vite, TypeScript** — Esta es Fase 1, HTML5 + CSS puro
2. **NO conectar a Supabase ni backend** — Data hardcoded intencional
3. **NO cambiar la paleta de colores** — Tokens en `styles.css` son la fuente de verdad
4. **NO romper la navegación** — Solo `<a href="">` tradicional
5. **PRIORIDAD MÁXIMA:** Resolver Bug #1 (navbar) y Bug #2 (flickering) antes de cualquier otra cosa
6. **DIAGNÓSTICO PRIMERO:** Antes de hacer fixes, pedir al usuario que pruebe con Dark Reader desactivado
7. **Verificar siempre** en dispositivo Android real antes de reportar como resuelto

---

## 📞 Contexto del Negocio

- **Servicio:** Refrigeración y climatización a domicilio
- **Ubicación:** San Juan de los Morros, estado Guárico, Venezuela
- **Propósito actual:** Mostrar prototipo visual funcional a clientes potenciales
- **Fase 2 (futura):** React + Supabase + autenticación real + mapas
