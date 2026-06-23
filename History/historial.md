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
| Logo giraba como loco | `styles.css` | Animación `flake-spin` ELIMINADA del .brand-icon |
| Logo en auth pages | `views/login,registro,recuperar.html` | Animación ELIMINADA de brand-icons |
| Decoraciones de fondo | Todas las vistas | 20-22s → 60s (imperceptible) |
| Navbar invisible Android | `styles.css` | `will-change: transform` + `translateZ(0)` en `.navbar` |
| Flickering carousel | `index.html` | `will-change: transform` + `translateZ(0)` en `.carousel-track` |
| Overflow horizontal | `styles.css` | `overflow-x: clip` en `html` |
| Alert bloquea solicitud | `views/solicitud.html` | Modo demo sin sesión obligatoria |

### Nota sobre flickering en desktop:
- **CONFIRMADO:** El parpadeo del logo persiste SOLO en desktop con Dark Reader activo
- **EN ANDROID:** No hay flickering. Todo funciona correctamente
- **Decisión:** El problema es de la extensión Dark Reader, no del código. Se eliminó la animación del logo para evitar conflictos. No se persigue más este bug.

### Problemas detectados del código de María:
1. Backend en `localhost:3000` — no funciona en GitHub Pages (deploy estático)
2. Alert "Debes iniciar sesión" impedía ver solicitud.html sin backend
3. Tema oscuro inconsistente entre vistas (login/solicitud oscuro, catálogo/index claro)
4. No hay JWT/tokens — la sesión se guarda en localStorage sin expiración ni seguridad
5. Password hasheado con SHA-256 (inseguro para producción, debería ser bcrypt)

---

## 🔍 Análisis del Backend de María (NestJS + Prisma + PostgreSQL)

### Stack:
- **Runtime:** NestJS 10 (Node.js)
- **ORM:** Prisma 6.19
- **DB:** PostgreSQL (requiere `DATABASE_URL` en .env)
- **Validación:** class-validator + class-transformer
- **Puerto:** 3000

### Endpoints disponibles:

| Método | Ruta | Función |
|--------|------|---------|
| POST | `/users/register` | Registro (email, password, firstName, lastName, phone?) |
| POST | `/users/verify` | Verificar email con código 6 dígitos |
| POST | `/users/login` | Login (retorna datos del usuario) |
| POST | `/appointments` | Crear cita (clientId, scheduledAt, brand, model, failureDescription) |
| GET | `/appointments` | Listar todas las citas (admin) |
| GET | `/appointments/client/:clientId` | Citas de un cliente |
| PATCH | `/appointments/:id/complete` | Marcar cita como completada |

### Modelos de datos:

**User:** id, email, password(sha256), firstName, lastName, phone, role(CLIENT/TECHNICIAN/ADMIN), isVerified, verificationCode

**Appointment:** id, clientId→User, status(PENDING/ASSIGNED/IN_PROGRESS/COMPLETED/CANCELLED), scheduledAt, notes

**Equipment:** id, appointmentId→Appointment, brand, model, serialNumber, btuCapacity, failureDescription

### Evaluación honesta:

**Lo bueno:**
- Estructura NestJS limpia y modular
- Prisma bien configurado con migraciones
- Validación de DTOs con mensajes en español
- Transacciones para crear cita + equipo atómicamente
- CORS habilitado

**Lo que falta / problemas:**
1. ❌ **Sin JWT** — No hay tokens de autenticación. El frontend guarda el user en localStorage pero no hay middleware de auth en el backend
2. ❌ **SHA-256 para passwords** — Inseguro. Debería ser bcrypt con salt
3. ❌ **Sin .env** — No hay archivo de configuración (DATABASE_URL necesario)
4. ❌ **Sin deploy** — Solo funciona en localhost:3000
5. ❌ **Sin guards/middleware** — Cualquiera puede crear citas o ver todas las citas
6. ❌ **Verificación por consola** — El código de verificación se imprime en terminal (no se envía por email/SMS)
7. ❌ **Sin relación con el catálogo** — No hay tabla de servicios/precios

### Decisión pendiente para Fase 2:

| Opción | Pros | Contras |
|--------|------|---------|
| **Continuar con NestJS de María** | Ya existe código, María lo conoce | Necesita deploy propio (Railway/Render), requiere mucho trabajo de seguridad |
| **Migrar a Supabase** | Auth integrado (JWT), free tier, DB PostgreSQL, deploy incluido, Row Level Security | Hay que reescribir, María perdería su trabajo |
| **Híbrido** | Usar Supabase para auth + DB, mantener estructura de datos de María | Mejor balance, menor riesgo |

---

## 🔌 Fase 5 — Conexión Backend + Base de Datos + Dashboard del Taller

**Fecha:** 2026-06-23
**Responsable:** Pepito (agente)
**Objetivo:** Dejar el backend de María corriendo contra una base de datos PostgreSQL real en el VPS y construir el dashboard administrativo del taller (clientes, gestión de citas, gráficos).

### A) Conexión Backend + DB (Fase A) ✅

| Acción | Detalle |
|--------|---------|
| Base de datos | Creada DB `freshservice` + rol dedicado `freshservice` en el PostgreSQL del VPS (`:5432`) |
| Variables de entorno | `backend/.env` con `DATABASE_URL` y `PORT` (no se sube a Git, está en `.gitignore`) |
| Gestor de paquetes | **pnpm** (decisión de Pedro por seguridad; npm tuvo incidente de paquetes comprometidos) |
| Dependencias | `pnpm install` + Prisma generado con `node node_modules/prisma/build/index.js generate` |
| Migraciones | `prisma migrate deploy` → tablas `users`, `appointments`, `equipments` creadas |
| Puerto | **4000** (el 3000 lo usa easypanel/n8n y el 3001 lo usa InmoYa). `main.ts` ahora lee `PORT` del env |
| Proceso | Backend corriendo bajo **pm2** con nombre `fresh-service` (junto a InmoYa). Sobrevive reinicios |
| Prueba E2E | Registro → verificación → login → crear cita → listar: **todo verificado contra la DB real** ✅ |

> Nota técnica: `pm2 start` requiere correr con el sandbox deshabilitado (el sandbox mata el fork del daemon, exit 144).

### B) Endpoints nuevos del backend (Fase B) ✅

| Método | Ruta | Función |
|--------|------|---------|
| GET | `/users` | Lista todos los clientes con conteo de citas (`_count.appointments`) |
| PATCH | `/appointments/:id/status` | Cambia la cita a cualquier estado válido (con validación `IsEnum`, rechaza inválidos con 400) |

Archivos: `users.service.ts` (`findAllClients`), `users.controller.ts` (`@Get`), `appointments.service.ts` (`updateStatus`), `appointments.controller.ts` (`@Patch :id/status`), nuevo `dto/update-status.dto.ts`.

### C) Datos de demostración reales ✅

- Script `prisma/seed.js` — clientes venezolanos realistas (nombres, operadoras +58, marcas reales de AC: LG, Samsung, Carrier, Frigilux, Premium, Midea, Mabe, Daewoo, York, Whirlpool).
- Sembrados: **11 clientes**, **26 citas** repartidas en los 5 estados y entre Feb–Jun 2026 (para que estadísticas y gráficos tengan sentido).

### D) Dashboard del Taller (`views/dashboard.html`) ✅

Reescrito conservando el diseño existente (paleta hielo, sidebar, tokens). Tres vistas conmutables:
1. **Dashboard** — 4 tarjetas KPI + 3 gráficos en **canvas puro** (sin librerías): dona de citas por estado, barras de citas por mes, ranking horizontal de marcas.
2. **Solicitudes** — tabla en vivo con **gestión de estado completa** (selector por fila que llama a `PATCH /:id/status`), búsqueda y filtro, botón WhatsApp.
3. **Clientes** — directorio con conteo de citas, estado de verificación y fecha de registro.

- API auto-detecta entorno: `localhost:4000` en local, `https://api.pedroservicios.xyz` en producción.
- JS validado con `node --check` (sin errores de sintaxis).

### E) Deploy público del backend (Fase C) ✅

Backend expuesto en **`https://api.pedroservicios.xyz`** con SSL Let's Encrypt automático. Verificado: 26 citas y 11 clientes por HTTPS, CORS abierto para GitHub Pages. Método (replicado de la guía de InmoYa en `/root/proyecto-beta/progreso.md`):

1. **Traefik**: creado archivo independiente `/etc/easypanel/traefik/config/freshservice.yaml` (NO se toca `main.yaml`, que easypanel regenera). Routers http→https + `letsencrypt`, servicio apuntando a `http://172.18.0.1:4000/` (IP del puente docker para alcanzar el host, no `localhost`).
2. **Firewall (era el bug)**: ufw bloqueaba el puerto 4000 a las redes docker. Solución: `ufw allow from 172.16.0.0/12 to any port 4000 proto tcp` y `10.0.0.0/8`. Sin esto, Traefik daba timeout al backend (mientras desde el host sí respondía).
3. DNS: `pedroservicios.xyz` con wildcard `*` → VPS `109.199.117.161`, ya resolvía `api.pedroservicios.xyz`.

> **Pendiente para que se vea en vivo:** hacer `git push` del `dashboard.html` actualizado para que GitHub Pages sirva la nueva versión (que ya apunta a `api.pedroservicios.xyz`).

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
| pendiente | Pepito: fixes visuales + eliminación animación logo | ⏳ Push pendiente |

---

## 🔗 Fase 6 — Conexión de login y solicitud al backend en vivo

**Fecha:** 2026-06-23

- `views/login.html` y `views/solicitud.html` migrados del viejo `localhost:3000` al esquema `API_BASE` auto-detectable (igual que `dashboard.html`): `localhost:4000` en local, `https://api.pedroservicios.xyz` en producción.
- `solicitud.html`: agregado guard de sesión — si no hay cuenta real (modo demo), redirige a login en vez de mandar una cita con `clientId: 'demo'` que rompería contra la DB real.
- Probado en vivo por HTTPS: login de cliente sembrado (200) y creación de cita (201). Cita de prueba eliminada para dejar la demo limpia (26 citas).
- Commits: `036e0f29` (merge dashboard + dark mode de María), `1ad68808` (login + solicitud).
- **Nota:** María cambió el flujo de verificación de código de 6 dígitos a enlace mágico (token). `registro.html` queda pendiente de revisar para que case con `GET /users/verify-link?token=`.
