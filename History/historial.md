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

## 📋 Fase 1 — Documentación del Proyecto (Sesión actual)

**Fecha:** 2026-05-11

### Archivos creados (sin modificar código):
1. **`README.md`** — Documentación pública del proyecto para GitHub:
   - Descripción general del sistema
   - Tabla de vistas y archivos
   - Stack tecnológico
   - Paleta de colores con tokens
   - Instrucciones para ejecutar localmente
   - Mapa de navegación entre vistas
   - Estado de fases (Roadmap)

2. **`AGENTS.md`** — Briefing técnico para agentes de IA:
   - Reglas estrictas de lo que NO se debe modificar
   - Nota sobre la arquitectura: HTML5 puro es intencional para Fase 1 (prototipo para clientes)
   - Estructura del proyecto documentada
   - Tokens del sistema de diseño
   - Mapa de navegación
   - Contexto local venezolano (V/E, +58, idioma español venezolano)
   - Estado de fases

---

## 🐛 Fase 2 — Correcciones de Bugs Responsivos (Sesión actual)

**Fecha:** 2026-05-11  
**Commits realizados:**

### Bug #1 — slide-tag rompía en dos líneas en móvil
- **Archivo:** `index.html`
- **Causa:** Faltaba `white-space: nowrap` en `.slide-tag`
- **Fix:** Se agregó `white-space: nowrap;` en el bloque CSS de `.slide-tag` (línea ~75)
- **Commit:** incluido en `63a7a20`

### Bug #2 — Tarjetas del catálogo en 2 columnas en móvil (texto cortado)
- **Archivo:** `catalogo.html`
- **Causa:** Los divs de la grilla de Aires de Ventana y Aires Split tenían `style="grid-template-columns: repeat(2,1fr)"` como atributo inline, lo que ignoraba cualquier media query
- **Fix:** 
  1. Se creó la clase CSS `.services-grid-2` con su propio `@media (max-width: 640px)` que la colapsa a 1 columna
  2. Se reemplazaron los dos divs con inline style por `<div class="services-grid-2">`
- **Commit:** `d9459c1` — "fix: grid responsive catalogo mobile + slide-tag nowrap"

### Bug #3 — Overflow horizontal del carousel en móvil (slides dobles visibles)
- **Archivo:** `styles.css`
- **Causa:** El carousel-track de 300% de ancho creaba overflow horizontal a nivel de página en algunos navegadores móviles. El `body` tenía `overflow-x: hidden` pero el `html` no.
- **Fix:** Se agregó `overflow-x: hidden` al elemento `html`
- **Commit:** `0bfe479` — "fix: overflow-x hidden en html para carousel mobile"

### Bug #4 — Navbar no visible en móvil (problema activo)
- **Archivo:** `styles.css`
- **Causa:** El `backdrop-filter: blur(14px)` no renderiza correctamente en todos los navegadores móviles, haciendo el fondo del navbar efectivamente transparente. Solo el ícono (que tiene su propio fondo azul) era visible.
- **Fix aplicado:** Se agregó `background: var(--white)` y `backdrop-filter: none` al navbar dentro del media query de 768px
- **Commit:** `fc0b003` — "fix: navbar fondo solido en movil" + commit "fix: hero height ajustado para movil"
- **Estado:** ⚠️ El problema PERSISTE según el usuario. Requiere investigación adicional.

### Bug #5 — Hero demasiado alto en móvil
- **Archivo:** `index.html`
- **Causa:** `height: calc(100vh - var(--nav-height))` en móvil incluye la barra del navegador en `100vh`
- **Fix:** Se agregó media query para `max-width: 600px` que limita el hero a `70vh`, `min-height: 420px`, `max-height: 600px`
- **Commit:** incluido en commit del navbar fix

---

## 🔧 Estado de Commits en GitHub

| Commit | Descripción | Estado |
|--------|-------------|--------|
| `b7573bc` | Firt deploy (deploy inicial) | ✅ |
| `63a7a20` | Fix slide-tag + archivos AGENTS/README | ✅ |
| `d9459c1` | Fix grid catálogo mobile | ✅ |
| `0bfe479` | Fix overflow-x html | ✅ |
| `fc0b003` | Fix navbar + hero height móvil | ✅ |

---

## ⚠️ Problema Activo No Resuelto

**El navbar en dispositivos móviles sigue viéndose mal.** Ver `/Progresos/progreso.md` para detalle completo del problema activo y estrategias de solución.
