# 📍 Estado Actual del Proyecto — Fresh Service Digital

> Este documento describe en qué etapa se encuentra el proyecto HOY y cuáles son los problemas pendientes de resolver.

**Última actualización:** 2026-06-20  
**Fase del proyecto:** Fase 1 UI + Backend parcial (María)  
**Deploy activo:** [pedrocabezaremoto.github.io/Fresh-Service-Digital](https://pedrocabezaremoto.github.io/Fresh-Service-Digital/index.html)

---

## ✅ Lo que YA está resuelto y funcionando

| Problema | Solución aplicada | Verificado |
|---|---|---|
| Slide-tag rompía en 2 líneas en móvil | `white-space: nowrap` en `.slide-tag` | ✅ |
| Tarjetas del catálogo aplastadas en 2 columnas | Clase `.services-grid-2` con media query | ✅ |
| Carousel mostraba 2 slides simultáneamente | `overflow-x: clip` en `html` | ✅ |
| Hero demasiado alto en móvil | `height: 70vh` media query ≤600px | ✅ |
| Navbar fondo transparente (backdrop-filter) | `background: var(--white)` sólido | ✅ Desktop |
| Fuente body mejorada | Nunito → Inter (más profesional) | ✅ |
| Shadows más elegantes | Neutral rgba(15,23,42) vs cyan-tinted | ✅ |
| Accesibilidad prefers-reduced-motion | Media query agregado | ✅ |
| Bug CSS registro.html `position: absolute inset: 0` | Agregado `;` faltante | ✅ |
| Función `updateSubtype()` no definida en solicitud | Definida en script | ✅ (versión original) |
| Logo giraba demasiado rápido (10s) | Cambiado a 30s (sutil) | ✅ 2026-06-20 |
| Alert "Debes iniciar sesión" bloqueaba solicitud.html | Modo demo sin sesión obligatoria | ✅ 2026-06-20 |
| Flickering por animaciones sin GPU isolation | `will-change: transform` + `translateZ(0)` | ⏳ Pendiente verificar |
| Navbar invisible en Android | `translateZ(0)` composite layer + isolation | ⏳ Pendiente verificar |

---

## 🟡 PENDIENTE DE VERIFICACIÓN — Fixes aplicados 2026-06-20

### Fix #1: Navbar Android (composite layer)
- Agregado `will-change: transform; transform: translateZ(0); -webkit-transform: translateZ(0)` al `.navbar`
- Esto fuerza al navegador a crear una capa GPU dedicada para el navbar
- **Estado:** Pendiente confirmar en dispositivo Android real

### Fix #2: Flickering/Parpadeo
- **Causa confirmada:** Dark Reader (extensión) + animaciones simultáneas sin aislamiento GPU
- **Solución aplicada:**
  - `will-change: transform` + `translateZ(0)` en `.carousel-track` y `.slide-decor`
  - `isolation: isolate` en `.brand-icon`
  - Velocidad de logo reducida: 10s → 30s (giro imperceptible)
  - Decoraciones slide: 20s → 40s
- **Diagnóstico:** Si flickering persiste CON Dark Reader pero desaparece SIN Dark Reader → no es bug del código

### Fix #3: solicitud.html alert
- María agregó verificación de `localStorage.getItem('user')` que redirige a login
- El backend (`localhost:3000`) no está en producción → siempre fallaba
- **Solución:** Modo demo — si no hay sesión, crea usuario demo local sin redirigir
- Cuando el backend esté en producción, se reactiva la verificación real

---

## 📂 Estructura Actual del Proyecto (post-merge María)

```
Fresh-Service-Digital/
├── index.html              ← Landing (carousel, features, CTA)
├── styles.css              ← Design system global
├── views/
│   ├── catalogo.html       ← Catálogo servicios AC
│   ├── login.html          ← Login (conectado a backend)
│   ├── registro.html       ← Registro usuario
│   ├── recuperar.html      ← Recuperar contraseña
│   ├── solicitud.html      ← Formulario solicitud (con auth check)
│   ├── dashboard.html      ← Panel admin
│   └── cliente-dashboard.html ← Panel cliente (nuevo, María)
├── backend/                ← NestJS + Prisma (María)
├── README.md
├── AGENTS.md
├── History/
│   └── historial.md
└── Progresos/
    └── progreso.md         ← este archivo
```

---

## 🔴 Bugs conocidos pendientes

1. **Navbar Android** — fix aplicado, pendiente verificar en device real
2. **Flickering en desktop** — verificar con Dark Reader desactivado
3. **Backend no desplegado** — `localhost:3000` no funciona en GitHub Pages

---

## 📋 Roadmap inmediato (deadline: Lunes 8 AM)

| Prioridad | Tarea | Estado |
|---|---|---|
| 1 | Verificar fixes visuales en Android | ⏳ |
| 2 | Responsividad completa (375px-414px) | 🔜 |
| 3 | Polish (favicon, meta tags, datos contacto) | 🔜 |
| 4 | Backend Supabase (o evaluar NestJS de María) | 🔜 |

---

## 🛑 Reglas para el Agente

1. **NO usar React, Vue, Tailwind, Vite, TypeScript** en el frontend
2. **NO cambiar la paleta de colores**
3. **NO romper la navegación**
4. **PRIORIDAD:** Responsividad móvil perfecta para el lunes
5. **Backend:** Evaluar si usar NestJS de María o Supabase

---

## 📞 Contexto del Negocio

- **Servicio:** Refrigeración y climatización a domicilio
- **Ubicación:** San Juan de los Morros, estado Guárico, Venezuela
- **Propósito actual:** Mostrar prototipo visual funcional a clientes potenciales
- **Deadline:** Lunes 2026-06-22, 8:00 AM
