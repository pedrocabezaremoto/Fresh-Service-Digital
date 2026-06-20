# 📜 Historial de Cambios — Fresh Service Digital

> Registro cronológico de todo lo que se ha construido, modificado y corregido en el proyecto.

---

## 🏗️ Fase 0 — Construcción Inicial (Sesión anterior)

**Contexto:** El proyecto fue construido desde cero en una sesión previa de desarrollo.

### Lo que se construyó:
- **`index.html`** — Landing Page completa con:
  - Navbar responsivo con menú hamburguesa
  - Hero Carousel de 3 slides con animación CSS pura (15s, 3 slides: Reparación, Mantenimiento, Repuestos)
  - Trust Strip con 5 indicadores de confianza
  - Sección Features (3 tarjetas)
  - Sección Services Preview (2 tarjetas grandes: Aires AC y Neveras)
  - CTA Banner
  - Footer completo con 4 columnas

- **`catalogo.html`** — Catálogo de Servicios con:
  - Page Hero con breadcrumb
  - Filter Tabs (Aires AC / Neveras - Próximamente)
  - Grids de tarjetas de servicio por tipo:
    - Tipo 1: Aires de Ventana (2 tarjetas: Reparación + Mantenimiento)
    - Tipo 2: Aires Split (2 tarjetas: Reparación + Mantenimiento)
    - Tipo 3: Aires por Toneladas (3 tarjetas: 1T, 2T, 3T)
  - CTA al fondo

- **`login.html`** — Módulo de inicio de sesión
- **`recuperar.html`** — Vista de recuperación de contraseña
- **`registro.html`** — Formulario de registro de usuario
- **`solicitud.html`** — Formulario de solicitud de servicio a domicilio con:
  - Selector V/E para cédula venezolana
  - Campo WhatsApp con prefijo fijo `+58`
  - Área de texto para dirección
- **`dashboard.html`** — Panel administrativo con datos hardcoded simulados
- **`styles.css`** — Sistema de diseño global completo con:
  - Paleta de colores: Blanco puro + Azules hielo/glaciar
  - Tipografía: Exo 2 (display) + Nunito (body) via Google Fonts
  - Variables CSS (tokens de diseño)
  - Componentes: botones, tarjetas, formularios, badges, etc.
  - Sistema responsivo

### Deploy inicial:
- Repositorio: `github.com/pedrocabezaremoto/Fresh-Service-Digital`
- Plataforma: GitHub Pages
- URL: `https://pedrocabezaremoto.github.io/Fresh-Service-Digital/index.html`
- Commit: `b7573bc` — "Firt deploy"

---

## 📋 Fase 1 — Documentación del Proyecto

**Fecha:** 2026-05-11

### Archivos creados (sin modificar código):
1. **`README.md`** — Documentación pública del proyecto para GitHub
2. **`AGENTS.md`** — Briefing técnico para agentes de IA con reglas estrictas
3. **`History/historial.md`** — Este archivo
4. **`Progresos/progreso.md`** — Estado actual y bugs pendientes

---

## 🐛 Fase 2 — Correcciones de Bugs Responsivos

**Fecha:** 2026-05-11

### Bug #1 — slide-tag rompía en dos líneas en móvil ✅
- **Archivo:** `index.html`
- **Fix:** `white-space: nowrap` en `.slide-tag`
- **Commit:** `63a7a20`

### Bug #2 — Tarjetas del catálogo en 2 columnas en móvil ✅
- **Archivo:** `catalogo.html`
- **Fix:** Clase `.services-grid-2` con media query propio `@media (max-width: 640px)`
- **Commit:** `d9459c1`

### Bug #3 — Overflow horizontal del carousel en móvil ✅
- **Archivo:** `styles.css`
- **Fix:** `overflow-x: hidden` en elemento `html`
- **Commit:** `0bfe479`

### Bug #4 — Navbar no visible en móvil ⚠️ PERSISTE
- **Archivo:** `styles.css`
- **Intentos realizados:**
  1. `background: var(--white)` + `backdrop-filter: none` en media query 768px → no funcionó
  2. Cambio de `overflow-x: hidden` a `overflow-x: clip` en `html` → no funcionó
  3. `background: var(--white)` sólido en navbar global → no funcionó
  4. Cambio a `position: fixed` + `padding-top: var(--nav-height)` en body → **PENDIENTE DE VERIFICAR EN PRODUCCIÓN**
- **Commits:** `fc0b003`, commits posteriores
- **Estado actual:** ❌ Problema CRÍTICO no resuelto. El navbar sigue siendo invisible en Android real.

### Bug #5 — Hero demasiado alto en móvil ✅
- **Archivo:** `index.html`
- **Fix:** `height: 70vh`, `min-height: 420px`, `max-height: 600px` en media query `≤600px`
- **Commit:** incluido en fix del navbar

---

## 🎨 Fase 3 — Mejoras de Diseño (ui-ux-pro-max skill)

**Fecha:** 2026-05-11

### Cambios aplicados a `styles.css`:
- **Fuente body:** Cambiada de `Nunito` a `Inter` (recomendación skill: Trust & Authority)
- **Background body:** `#F0F9FF` → `#F8FAFC` (más neutro y profesional)
- **Shadows:** Cambiadas de `rgba(2,132,199)` cyan-tinted a `rgba(15,23,42)` neutral
- **`-webkit-font-smoothing: antialiased`** agregado
- **`prefers-reduced-motion`** media query agregado (accesibilidad WCAG)
- **Btn cursor:** `cursor: pointer` agregado
- **`min-height: 100dvh`** para evitar el gap de la barra del navegador iOS

### Cambios a `index.html`:
- Todos los `backdrop-filter: blur()` removidos de `.slide-tag`, `.service-card-tag`, `.coming-soon-badge`
- **Razón:** `backdrop-filter` causa repaint de GPU constante en Android Chrome → flickering

### Cambios a páginas de auth (`login.html`, `registro.html`, `recuperar.html`) y `dashboard.html`:
- `padding-top: 0` agregado al body inline para anular el padding global del navbar fixed

---

## 🔴 Bugs Críticos Activos (2026-05-11)

### Bug Crítico #1 — Navbar invisible en Android

| Detalle | Estado |
|---|---|
| Problema | Navbar no se ve en móvil Android real |
| Observado en | Chrome Android (dispositivo físico), DevTools simulación 390px |
| Solución | Se aplicó `visibility: hidden;` al contenedor `.nav-links` móvil cuando está cerrado para evitar que su fondo blanco sólido se superponga sobre el navbar. Se activa a `visible` al abrir el menú. |
| Estado | ✅ Solucionado |

### Bug Crítico #2 — Flickering / Parpadeo de texto y logo

| Detalle | Estado |
|---|---|
| Problema | Letras del hero y logo parpadean constantemente, cambios de color erráticos |
| Observado en | Desktop Chrome + DevTools móvil + Android real |
| Causa probable | `@keyframes flake-spin` sobre `.brand-icon` en combinación con el carousel CSS animation. Ambas animaciones corren simultáneamente causando layer conflicts en el compositor de GPU |
| Causa probable 2 | La extensión Dark Reader (`data-darkreader-mode="dynamic"`) reescribe estilos dinámicamente, interfiriendo con las animaciones CSS |
| Fixes intentados | Remoción de `backdrop-filter` de todos los archivos |
| Estado | ❌ CRÍTICO — No resuelto. Requiere análisis y fix en próxima sesión |

---

## 🔀 Fase 4 — Merge de Backend (María) + Fixes visuales

**Fecha:** 2026-06-20

### Commits de María integrados (6 commits):
- `39e2c2b0` — [FIX] CSS: corregir responsividad de menú en móvil y tablet
- `84149a1f` — [ADD] Backend NestJS + Prisma (modelos DB)
- `cee1f079` — chore: .gitignore para node_modules y build outputs
- `cdf2f7fc` — Merge PR #1 (database)
- `71d0a62f` — [ADD] Backend: Login + Agenda de citas para clientes
- `a55be36a` — Merge PR #2 (login)

### Cambios estructurales de María:
- **Carpeta `views/`** creada — todos los HTML (excepto index) movidos allí
- **Carpeta `backend/`** — NestJS + Prisma con endpoints de autenticación y citas
- **`views/cliente-dashboard.html`** — nueva vista de panel del cliente
- **`views/solicitud.html`** — conectado a `localhost:3000/appointments` con verificación de sesión
- **`views/login.html`** — conectado a backend para auth real
- **Tema oscuro** aplicado a varias vistas (backgrounds oscuros)

### Fixes aplicados por Pepito (2026-06-20):

| Fix | Archivo | Cambio |
|-----|---------|--------|
| Logo gira demasiado rápido | `styles.css` | `flake-spin` de 10s → 30s |
| Logo gira rápido en login | `views/login.html` | `flake-spin` de 10s → 30s |
| Decoración slide rápida | `index.html` | `flake-spin` de 20s → 40s |
| Navbar invisible Android | `styles.css` | `will-change: transform` + `translateZ(0)` en `.navbar` |
| Flickering carousel | `index.html` | `will-change: transform` + `translateZ(0)` en `.carousel-track` y `.slide-decor` |
| Brand-icon stacking | `styles.css` | `isolation: isolate` + `translateZ(0)` en `.brand-icon` |
| Overflow horizontal | `styles.css` | `overflow-x: clip` en `html` |
| Alert bloquea solicitud | `views/solicitud.html` | Modo demo: si no hay sesión, crea usuario demo local |

### Problemas detectados del código de María:
1. Backend en `localhost:3000` — no funciona en GitHub Pages (deploy estático)
2. Alert "Debes iniciar sesión" impedía ver solicitud.html sin backend
3. Tema oscuro inconsistente entre vistas (login/solicitud oscuro, catálogo claro)

---

## 📊 Estado de Commits en GitHub

| Commit | Descripción | Estado |
|--------|-------------|--------|
| `b7573bc` | Firt deploy (deploy inicial) | ✅ |
| `63a7a20` | Fix slide-tag + archivos AGENTS/README | ✅ |
| `d9459c1` | Fix grid catálogo mobile | ✅ |
| `0bfe479` | Fix overflow-x html | ✅ |
| `fc0b003` | Fix navbar + hero height móvil | ✅ |
| `39e2c2b0` | María: CSS navbar responsivo | ✅ |
| `84149a1f` | María: Backend NestJS + Prisma | ✅ |
| `cee1f079` | María: .gitignore node_modules | ✅ |
| `71d0a62f` | María: Backend login + appointments | ✅ |
| `a55be36a` | María: Merge PR #2 | ✅ |
| pendiente | Pepito: fixes visuales 2026-06-20 | ⏳ Push pendiente |
