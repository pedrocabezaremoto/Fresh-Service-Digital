# 📍 Estado Actual del Proyecto — Fresh Service Digital

> Este documento describe en qué etapa se encuentra el proyecto HOY y cuáles son los problemas pendientes de resolver.

**Última actualización:** 2026-06-23  
**Fase del proyecto:** Fase 2 — Backend + Base de datos CONECTADOS y funcionando (local en VPS)  
**Deploy activo (frontend):** [pedrocabezaremoto.github.io/Fresh-Service-Digital](https://pedrocabezaremoto.github.io/Fresh-Service-Digital/index.html)

---

## 🚀 NOVEDAD 2026-06-23 — Backend + DB en vivo + Dashboard del Taller

| Logro | Estado |
|---|---|
| PostgreSQL real en el VPS (DB `freshservice`) | ✅ |
| Backend NestJS corriendo con **pm2** en puerto **4000** | ✅ vivo |
| Dependencias con **pnpm** (no npm, por seguridad) | ✅ |
| Migraciones Prisma aplicadas (users/appointments/equipments) | ✅ |
| Flujo E2E (registro→verify→login→cita) probado contra DB real | ✅ |
| Endpoint `GET /users` (lista clientes con # citas) | ✅ nuevo |
| Endpoint `PATCH /appointments/:id/status` (cambiar estado) | ✅ nuevo |
| Datos demo reales: 11 clientes, 26 citas | ✅ |
| Dashboard taller: KPIs + gráficos canvas + clientes + gestión citas | ✅ |

**Cómo levantar el backend:** está en pm2 (`pm2 restart fresh-service`). Config en `backend/.env`.
**Re-sembrar demo:** `node prisma/seed.js` dentro de `backend/`.

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

### Fix #1: Navbar Android (composite layer) — RESUELTO ✅
- Agregado `will-change: transform; transform: translateZ(0); -webkit-transform: translateZ(0)` al `.navbar`
- **Verificado en Android real:** Navbar visible y funcional

### Fix #2: Flickering/Parpadeo — CERRADO ✅
- **Causa confirmada:** Dark Reader (extensión del navegador) interfiere con animaciones CSS
- **En Android:** No hay flickering (confirmado con screenshots)
- **En Desktop con Dark Reader:** Persiste pero es culpa de la extensión
- **Solución final:** Animación del logo eliminada completamente. Decoraciones de fondo a 60s (imperceptibles)
- **Decisión:** No se persigue más. Es problema de la extensión, no del código

### Fix #3: solicitud.html alert — RESUELTO ✅
- Modo demo activado: si no hay sesión en localStorage, usa usuario demo sin redirigir

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

## 🔴 Bugs / pendientes

1. ~~Navbar Android~~ — ✅ RESUELTO
2. ~~Flickering en desktop~~ — ✅ CERRADO (es Dark Reader, no el código)
3. ~~Backend no desplegado localmente~~ — ✅ corre en pm2 (`fresh-service`, puerto 4000) contra DB real
4. **Backend sin subdominio público** — el dashboard en GitHub Pages todavía no puede llamar al backend en vivo. Falta exponer `api.pedroservicios.xyz` con HTTPS (Fase C). Mientras tanto funciona en local.
5. **Frontend apunta a `localhost:3000` en otras vistas** — `login.html` y `solicitud.html` aún usan `localhost:3000`; hay que pasarlas al mismo esquema de `API_BASE` (4000 local / subdominio prod) que ya tiene `dashboard.html`.
6. **Inconsistencia de tema** — login/solicitud tienen fondo oscuro, index/catálogo fondo claro
7. **Seguridad backend (heredado de María):** sin JWT, passwords SHA-256 (debería bcrypt), sin guards de auth. Pendiente para endurecer antes de producción real.

---

## 📋 Roadmap inmediato

| Prioridad | Tarea | Estado |
|---|---|---|
| 1 | Decisión backend: continuar NestJS de María | ✅ DECIDIDO (NestJS + Postgres en VPS) |
| 2 | Conectar backend + DB real | ✅ Hecho (pm2, puerto 4000) |
| 3 | Dashboard del taller (clientes, citas, gráficos) | ✅ Hecho |
| 4 | Fase C: exponer backend en `api.pedroservicios.xyz` (HTTPS) | ✅ Hecho (Traefik + ufw + Let's Encrypt) |
| 5 | **`git push` del dashboard.html para que GitHub Pages use la versión nueva** | 🔜 Lo hace Pedro |
| 6 | Migrar `login.html` y `solicitud.html` al esquema `API_BASE` | 🔜 |
| 7 | Endurecer seguridad (JWT, bcrypt, guards) | 🔜 |

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
