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

---

## 🔐 Fase 7 — Endurecimiento de Seguridad (JWT + bcrypt + Guards) y registro.html

**Fecha:** 2026-06-24

### Backend
- **bcrypt** (`bcryptjs`) reemplaza el hash SHA-256 en `users.service.ts` (hash + compare async).
- **JWT** (`@nestjs/jwt`): `login` emite `accessToken` con payload `{sub, email, role}`. Módulo JWT global en `app.module.ts`. `dotenv` cargado en `main.ts` para leer `JWT_SECRET`/`JWT_EXPIRES`/`PUBLIC_API_URL` del `.env`.
- **Guards** nuevos en `src/auth/`: `JwtAuthGuard` (valida Bearer token), `RolesGuard` + decorador `@Roles()`.
  - `GET /users`, `GET /appointments`, `PATCH /:id/status`, `PATCH /:id/complete` → **solo ADMIN**.
  - `POST /appointments`, `GET /appointments/client/:id` → requieren estar autenticado.
  - `register`, `login`, `verify-link` → públicos.
- `register` ahora devuelve `activationUrl` (con `PUBLIC_API_URL`) mientras no haya servicio de correo real.
- `seed.js`: bcrypt, limpia datos previos, crea usuario **ADMIN** (`admin@freshservice.com` / `Admin1234`).
- Verificado por HTTPS: sin token → 401, admin → 200, cliente a ruta admin → 403, registro→activación→login → OK.

### Frontend
- `login.html`: guarda `accessToken`; redirige según rol (ADMIN → dashboard, cliente → cliente-dashboard).
- `dashboard.html`: portero de admin (sin token/rol → login), manda `Authorization` en todas las peticiones, botón **Cerrar sesión**, maneja 401/403.
- `solicitud.html` y `cliente-dashboard.html`: mandan el token; manejan sesión expirada.
- `registro.html`: usa `API_BASE`; muestra botón "Activar mi cuenta ahora" con el `activationUrl` (demo sin correo).

### Credenciales demo
| Rol | Usuario | Clave |
|-----|---------|-------|
| Admin (taller) | `admin@freshservice.com` | `Admin1234` |
| Clientes | su email (ej. `maria.rodriguez@gmail.com`) | `Demo1234` |

> Pendiente real: servicio de correo (para no devolver `activationUrl` en la respuesta), refresh tokens, y rate-limiting.

---

## ⚛️ Fase 8 — Migración del Frontend a React + Vite + Tailwind

**Fecha:** 2026-06-24

Pedro pidió migrar porque el frontend HTML/CSS se veía "de juguete". Decisión: React + Vite + Tailwind (mismo stack que InmoYa) + fotos de stock. **Backend NestJS sin cambios.**

- **Nuevo:** carpeta `frontend-react/` — React 19, Vite 6, Tailwind v4 (`@tailwindcss/vite`), lucide-react, react-router-dom 7.
- **Diseño:** identidad "frost" (azul cian con glow + glass), fuente Sora + Inter, fotos reales de Unsplash (verificadas viéndolas) en `src/lib/images.js`.
- **Páginas:** Home (hero con foto, servicios, por qué, pasos, testimonios, CTA), Catálogo, Login, Registro (con activación), Solicitud (protegida), Panel Cliente, Panel Admin (sidebar, KPIs, donut SVG, barras, tabla con gestión de estado, clientes).
- **Auth:** `AuthContext` + JWT en `fsd_token`/`fsd_user`, rutas protegidas por rol. API en `src/lib/api.js` (auto local 4000 / prod `api.pedroservicios.xyz`).
- **Deploy:** `serve.mjs` (servidor estático SPA sin deps) bajo pm2 `fresh-frontend` puerto 4100; Traefik `fresh-frontend.yaml` → `https://fresh.pedroservicios.xyz`; ufw abre 4100.
- **EN VIVO:** https://fresh.pedroservicios.xyz · Commit `53d5b210`.

### ⚠️ Incidente de producción (resuelto el mismo día)
Durante el despliegue, un reschedule del Docker Swarm dejó **Traefik en 0/1**: no podía arrancar porque un **nginx del sistema (default, systemd) ocupaba el puerto 80**. Eso tumbó api e inmoya.
- **Fix Traefik:** `systemctl stop nginx && systemctl disable nginx` → Traefik recuperó el 80 (1/1).
- **Fix InmoYa:** sus reglas de firewall del puerto 3001 eran `iptables` directas (no ufw) y se perdieron al recargar ufw; se re-agregaron con `ufw allow ... port 3001`.
- **Lección:** abrir puertos a Docker SIEMPRE con ufw (persistente); nginx no debe correr (Traefik es el proxy de 80/443).

---

## 🤖 Fase 9 — Automatización de Deploy (webhook GitHub + script) y fix de migración

**Fecha:** 2026-07-17 (noche) / 2026-07-18

**Contexto:** María (colaboradora, `mariab1709`) trabajó desde su máquina local y empujó cambios a `main` los días 26–27 jun (modo oscuro, verificación por correo, elección de citas para técnicos). El sitio en vivo **no reflejaba** esos cambios porque nadie había reconstruido/redeployado en el VPS: el `dist/` del frontend era del 24-jun y el backend corría código viejo.

### 🐛 Bug encontrado y corregido — migración faltante
- María cambió `backend/prisma/schema.prisma` (agregó `technicianId` + relación `technician` en `Appointment`, índice y FK a `users` con `onDelete: SetNull`) **sin generar la migración**.
- La tabla real `appointments` en la DB del VPS **no tenía** la columna `technicianId` → reiniciar el backend así habría roto la función de citas de técnicos.
- **Fix:** se generó la migración con `prisma migrate diff` (schema viejo vs nuevo) y se creó `backend/prisma/migrations/20260717233942_add_technician_to_appointment/` (cambio aditivo, sin pérdida de datos). Aplicada con `prisma migrate deploy`. Verificado: `GET /appointments` → 401 (protegido, no 500).
- **Regla nueva para el equipo:** al tocar la base de datos, correr `npx prisma migrate dev --name descripcion` y subir la carpeta `prisma/migrations/`. Nunca cambiar el schema sin migración.

### 🚀 `deploy.sh` — despliegue seguro de un comando
Script en la raíz del repo. Flujo: **git pull → migraciones → build frontend → build backend → restart pm2 → health check**.
- **Seguridad:** construye TODO antes de reiniciar; si un build falla, aborta y el sitio viejo sigue en vivo (nunca deja producción caída a medias).
- Detector de migraciones pendientes / desincronización de schema (avisa si alguien cambió el schema sin migración).
- Health check a `:4000` (backend) y `:4100` (frontend); marca CAÍDO si responde 000/5xx.
- Uso manual: `cd /root/Fresh-Service-Digital && ./deploy.sh`.

### 🔔 Webhook de GitHub — deploy automático en cada push a main
- **`webhook.mjs`** (Node, sin dependencias) bajo pm2 `fresh-webhook`, puerto **4200**.
  - Verifica firma **HMAC-SHA256** (`X-Hub-Signature-256`) contra el secreto en `/root/.fresh-webhook-secret` (chmod 600, fuera del repo).
  - Solo despliega en `refs/heads/main`; responde 202 rápido y corre `deploy.sh` en background con lock anti-solape. Log en `deploy-webhook.log` (gitignored).
- **Traefik:** `/etc/easypanel/traefik/config/fresh-webhook.yaml` → router `Host(api.pedroservicios.xyz) && PathPrefix(/deploy-hook)` prioridad **100** (gana sobre el backend) → `172.18.0.1:4200`. HTTPS con el cert letsencrypt existente de `api.`.
- **ufw:** abierto 4200 desde `172.16.0.0/12` y `10.0.0.0/8` (igual que 4000/4100).
- **URL del webhook:** `https://api.pedroservicios.xyz/deploy-hook`.
- **Configurado en GitHub** (repo Settings → Webhooks): content-type `application/json`, evento `push`, SSL on. Ping inicial ✅ verde.

### ✅ Prueba end-to-end
- Tests locales del webhook: firma inválida → 401, ping → pong, push a rama ≠ main → ignorado. ✔
- Push de prueba (commit vacío) a `main` → webhook disparó `deploy.sh` solo → **✅ Deploy COMPLETO (exit 0)**, frontend 200 / backend 404 OK.

### Commits
- `5277ba77` — migración `technicianId` + `deploy.sh`.
- `6f800d81` — `webhook.mjs` + `.gitignore`.
- `71da1033` — commit vacío de prueba del webhook.

### ⚠️ Nota / pendiente — npm vs pnpm
`deploy.sh` usa `npm install`/`npm run build`. El proyecto históricamente usaba **pnpm** en el backend ("por seguridad", Fase 2). Ya hay mezcla (María subió `backend/package-lock.json` de npm). Funciona, pero conviene decidir un solo gestor y unificar lockfiles para evitar drift.

### Flujo final (ya operativo)
```
push a main → GitHub avisa al webhook → verifica firma → deploy.sh
   → git pull → migraciones → build front/back → restart pm2 → health check
   → cambios en vivo en https://fresh.pedroservicios.xyz
```

---

## 🎨 Fase 10 — Branding real + limpieza de UI (logo, favicon, fotos, panel cliente)

**Fecha:** 2026-07-18

Sesión de mejoras visuales sobre el frontend React (todo desplegado en vivo vía webhook automático).

### Hero (Home)
- Quitados los badges flotantes "+1.200 servicios" y "4.9/5 satisfacción" de la foto del técnico.
- Foto del hero con efecto **hover-lift** (sube + zoom suave + glow), igual que las tarjetas del catálogo.
- Barra de stats ajustada a valores creíbles: **+500 servicios · 8 años · 4.9★** (se quitó "< 2h respuesta"); grid a 3 columnas.

### Logo de marca (copo de hielo + llave/engranaje)
- Pedro generó el logo con un LLM y lo subió por SCP (`logo-original.jpeg`, 1376×768).
- Procesado en el VPS con **rembg + u2net** (`/root/venv`): fondo quitado, recortado al contenido, cuadrado, optimizado a 256px (91KB → `public/logo.png`).
- Componente `Logo.jsx` reescrito: usa la imagen en un **chip blanco fijo** (`bg-[#ffffff]`) para verse bien en navbar claro Y oscuro (en dark mode el navbar es azul oscuro, un logo transparente mostraría medio disco blanco feo).
- Prop `effect`: **hover** (default, navbar) / **float** lento (footer, bob ~3.4s con `@keyframes logoFloat`, respeta `prefers-reduced-motion`).
- Logo aplicado en: **navbar** (hover), **footer** (float, reemplaza ícono viejo), **login/AuthShell** (panel izquierdo oscuro, `<Logo light>`).
- Masters guardados en `brand/` (jpeg original + png full). Solo `logo.png` se sirve.

### Favicon
- Generado desde el logo: `favicon.ico` (16/32/48), `favicon-16/32/48.png`, `apple-touch-icon.png` (180, fondo blanco), `icon-192/512.png` (PWA). `index.html` actualizado (reemplaza el `favicon.svg` genérico que no existía bien).

### Sección de servicios — fotos reales, sin iconos genéricos
- **Home "Nuestros servicios":** quitados los iconos genéricos (badges blancos con símbolo) sobre las fotos.
- **Catálogo:** quitados los cuadros de icono genéricos de los encabezados de grupo; cada tarjeta (Reparación/Mantenimiento/Toneladas) ahora lleva la **foto de su tipo** como banner superior (reusa `img-window/split/tonnage-ac.png`) con hover-zoom y el nombre sobre la foto.
- Solo hay 4 fotos reales (ventana, split, toneladas, técnico); pendiente opcional: fotos de acción distintas por tarjeta (reparando vs lavando) → requieren generar 2-3 imágenes nuevas.

### Panel del cliente (ClienteDashboard) — limpieza
- Quitado el emoji de mano 👋 del saludo "¡Hola, {nombre}!".
- Quitados los **iconos genéricos**: stat cards rediseñadas (número + label + acento de color, sin ícono); item del historial sin ícono (acento de borde izquierdo). Se conservó el ícono real de WhatsApp y los watermarks sutiles de copo.

### Commits de la fase
`2557cdcd` (hero/stats), `f7c7e4a1` (logo navbar), `b6e9f59e` (logo footer + efectos), `83cdb26d` (favicon + fotos servicios), + commit de limpieza panel cliente/login.

---

## 🗺️ ROADMAP — Cambios GRANDES pendientes (para 2026-07-19)

> Anotado a pedido de Pedro (fin de jornada 2026-07-18). Son los cambios grandes a atacar mañana.

### A) Panel del Taller (Admin) — Dashboard
1. **Stat cards → botones funcionales:** cada tarjeta del "Resumen del Taller" (Solicitudes registradas, Pendientes de atender, En proceso, Clientes registrados) debe ser **clickeable** y redirigir a la vista/filtro que corresponde (p.ej. "Pendientes" → Solicitudes filtradas por Pendiente).
2. **Gráfico de pastel real:** el donut "Citas por estado" debe reflejar **estadísticas reales** de la DB (no mock).
3. **Reporte exportable:** poder **descargar reporte real en formato XLS/XML** (Pedro dijo "XLM" → confirmar si Excel `.xlsx` o XML).

### B) Panel del Taller — Gestión de Solicitudes
1. **Filtros por columna:** cliente, servicio, fecha, técnico, estado (ordenar/filtrar cada uno).
2. **Botón real de WhatsApp** por fila: que abra `wa.me/<numero>` con el **número registrado** del cliente.
3. **Técnicos ficticios (3):** columna Técnico trabaja con:
   - **Juan** — especialista en aires de **ventana**
   - **Carlos** — especialista en **split**
   - **Jorge** — especialista en aires por **toneladas**
   - Al asignar un técnico, debe reflejarse en el **panel del cliente** con **nombre + número de WhatsApp ficticio** del técnico (sensación real).

### C) Precios anclados al dólar (BCV) — como InmoYa
- InmoYa (`/root/Proptech-InmoYa`) ya usa una **API del Banco Central de Venezuela**: precios en Bolívares anclados al dólar, se **actualizan solos a la tasa oficial** cada día (el VPS nunca se apaga). Referencia visual: `inmoya.pedroservicios.xyz/propiedad/46` muestra "Bs 34.792,74 · Ref. $48".
- Aplicar el **mismo mecanismo** a Fresh Service: los precios de los servicios se guardan en **USD** y se muestran en Bs a la tasa BCV del día (y también en la solicitud/tarjeta).
- **Precios base (mantenimiento)** que dio Pedro: **ventana $25 · split $35 · tonelada $50**.
- Para los demás servicios usar precios **con lógica** (una **reparación** vale más que un **mantenimiento**, etc.), coherentes por tipo.
- **Pendiente de Pedro:** dar los ejemplos/valores exactos por servicio (y confirmar el endpoint BCV que usa InmoYa para reutilizarlo).

---

## 🛠️ Fase 11 — Panel del Taller: técnicos, orden, sugerencias + mejoras

**Fecha:** 2026-07-18

### Técnicos asignables (end-to-end)
- 3 técnicos sembrados idempotentes (`backend/prisma/seed-technicians.js`, upsert por email, no borra datos):
  **Juan** — Aires de Ventana (+58 412-111 2233), **Carlos** — Aires Split (+58 414-222 3344),
  **Jorge** — Aires por Toneladas (+58 424-333 4455). Rol TECHNICIAN, clave demo `Tecnico1234`.
- `findByClient` ahora incluye `technician` (nombre + phone) → el **panel del cliente** muestra
  "Técnico: <nombre>" + botón WhatsApp al número del técnico cuando la cita está asignada.
- Re-sembrar: `cd backend && node prisma/seed-technicians.js`.

### Dashboard del Taller
- **KPIs clickeables:** las tarjetas del Panel de Control llevan a Solicitudes con el filtro puesto
  (Pendientes→PENDING, En proceso→ASSIGNED+IN_PROGRESS, Clientes→vista clientes).
- **Exportar Excel:** botón que descarga CSV (abre en Excel) con todas las solicitudes.
- Donut "Citas por estado" confirmado como **real** (se calcula de la DB en vivo).

### Gestión de Solicitudes
- **Orden por columna:** Cliente, Fecha, Estado (clic en encabezado, ▲▼).
- **Sugerencia de técnico automática:** "Sugerido: <nombre>" según el tipo de aire (ventana/split/toneladas),
  clic asigna directo.
- (WhatsApp por fila al cliente ya existía.)

### Marketing / SEO
- **OG tags** en index.html (Open Graph + Twitter) → vista previa con logo al compartir el link por WhatsApp.

### Commits
`b517f909` (técnicos), `863eba6f` (KPIs+export), `f04d9bf4` (orden+sugerencia+OG).

---

## 💱 Fase 12 — Precios anclados al dólar (BCV) + Proforma + Correo

**Fecha:** 2026-07-18 / 2026-07-19

Modelo de anclaje (igual que InmoYa, ver `info-api-BCV.md` en la raíz): los precios se guardan en **USD**
y se muestran en **Bs** a la tasa oficial del día. Si la tasa cambia, los Bs se recalculan solos.

### Backend
- **Tasa BCV:** `RateService` consume DolarAPI (`https://ve.dolarapi.com/v1/dolares/oficial`, gratis, sin key),
  refresca cada 6h, **tolerante a fallos** (usa la última tasa si la API cae, timeout 10s), cachea en tabla
  `settings`. Endpoint público `GET /rate`. Modelo Prisma `Setting` + migración `add_settings`.
- **Precio congelado:** campo `priceUsd` en `Appointment` (migración `add_price_to_appointment`); se guarda
  al crear la solicitud. Tabla de precios espejo en `src/common/prices.ts` (para citas viejas sin precio).
- **Correo al asignar técnico:** `MailService.sendServiceAssignedEmail` (HTML estilo frost) disparado
  fire-and-forget en `assignTechnician` (no bloquea ni rompe la asignación). **Simula en consola si no hay SMTP.**

### Frontend
- `RateProvider` (carga la tasa 1 vez) + `lib/money.js` + componente `<Price usd>` (Bs grande + Ref. USD).
- **Catálogo:** 7 servicios con precio. **Home:** "Desde $X" por tipo. **Solicitud:** precio estimado en vivo
  que se congela al enviar (`lib/prices.js` = fuente única).
- **Panel del cliente:** precio por servicio + tarjeta "Total a pagar · servicios activos".
- **Proforma** (`/proforma`, ruta protegida sin navbar): documento imprimible con logo, Nº, cliente,
  desglose, TOTAL en Bs + USD, nota de validez (7 días) y tasa BCV, WhatsApp; botón "Imprimir / Guardar PDF"
  (print-to-PDF del navegador, sin librerías).

### Tabla de precios (USD)
| Equipo | Mant. | Reparación | Diagnóstico | Recarga gas | Instalación |
|---|---|---|---|---|---|
| Ventana | 25 | 40 | 15 | 30 | 45 |
| Split | 35 | 55 | 20 | 40 | 70 |
| 1 Tonelada | 50 | 75 | 30 | 55 | 90 |
| 2 Toneladas | 75 | 110 | 40 | 80 | 130 |
| 3 Toneladas | 100 | 150 | 55 | 105 | 170 |

### Infra
- **Repo de respaldo (espejo):** `git@github.com:pedrocabezaremoto/Fresh-Service-Digital-respaldo.git`
  como remote `backup`. `deploy.sh` hace push automático al backup tras cada deploy exitoso.

### Commits
`cdde35f5` (tasa BCV + precios en catálogo/home), `276bf907` (priceUsd + proforma + correo).

### Pendientes
- **SMTP sin configurar** → el correo se simula en consola. Falta poner `SMTP_HOST/PORT/USER/PASS/FROM` en `backend/.env`.
- Precios confirmables por Pedro (ajustables en `lib/prices.js` + `common/prices.ts`).

---

## 🧩 Fase 13 — UX de solicitud, gestión de usuarios y datos de cuenta

**Fecha:** 2026-07-19

### Flujo de "Solicitar" (UX)
- Usuario NO logueado que pulsa "Solicitar" → va a **/registro** (antes /login), con mensaje "necesitas una cuenta".
- Login y Registro preservan el destino (`from`); tras autenticar, el cliente **vuelve directo a /solicitud**.
- `ProtectedRoute` acepta prop `redirectTo`.

### Correos
- Verificación y asignación ahora usan el **logo real** (img) en vez del emoji ❄️.
- Se agregó **versión de texto plano** a ambos correos → mejora deliverability (menos spam).
- Nota spam: la causa es la reputación de la cuenta Gmail nueva. Workaround demo: "No es spam" + agregar a contactos. Definitivo (v1.1): dominio propio con SPF/DKIM/DMARC.
- **SMTP activo:** Gmail `freshservicedigital2026@gmail.com` (contraseña de app) en `backend/.env` (no versionado). Correos reales funcionando.

### Gestión de usuarios (panel Taller → Clientes)
- Botones **Editar** (modal: nombre, apellido, correo, teléfono, rol, contraseña opcional) y **Eliminar** (con confirmación; borra en cascada las solicitudes).
- Backend: `PATCH /users/:id` y `DELETE /users/:id` (solo ADMIN). DTO `UpdateUserDto`. Métodos `updateUser`/`deleteUser` (manejan P2002 correo duplicado y P2025 no encontrado).
- API front: `updateUser`, `deleteUser`.

### Datos del cliente en la cuenta
- **Panel del cliente:** saludo compacto + muestra Correo y WhatsApp.
- **Cédula en la cuenta:** nuevo campo `User.cedula` (migración `add_cedula_to_user`). El login lo devuelve.
  - Al crear una solicitud se **guarda la cédula en la cuenta** (para precargarla la próxima vez).
  - **Solicitud precarga** teléfono (desde la cuenta) y cédula (desde la cuenta; respaldo en localStorage). Dirección se recuerda en localStorage.
  - `AuthContext.patchUser()` refresca el usuario en memoria tras guardar la cédula.
  - **Backfill:** se extrajo la cédula de las notas de solicitudes viejas para clientes existentes.

### Datos borrados (a pedido de Pedro)
- Eliminados usuarios de prueba `pedrocabezaremoto@gmail.com`, `asesorpedrocabeza7254@gmail.com` (y Pedro borró `pedroventas86@gmail.com` con el botón nuevo) para liberar esos correos.

### Commits
`42c6cb98` (UX Solicitar→Registro), `4b0449e5` (logo correos + texto plano + datos panel), `b42b516f` (gestión usuarios + solicitud precargada + hero), + commit de cédula en cuenta.

---

## 🔐 Fase 14 — Reset de contraseña real, filtros y documentación

**Fecha:** 2026-07-19

### Reset de contraseña por correo (flujo real)
- Backend: campos `resetToken`/`resetTokenExpiry` (migración `add_reset_token`).
  Endpoints públicos `POST /users/forgot-password` (token 1h + correo) y
  `POST /users/reset-password` (valida token no expirado, cambia clave bcrypt, invalida token).
  No revela si el correo existe (seguridad). Correo de reseteo con logo + texto plano.
- Frontend: páginas `/recuperar` (pedir enlace) y `/restablecer?token=` (nueva clave).
  El login enlaza a `/recuperar` (ya no WhatsApp).

### Panel Taller — filtros y modal
- **Solicitudes:** 4 filtros inteligentes uniformes (Cliente, Servicio, Fecha, Estado)
  con búsqueda + datalist; se quitaron los sort-arrows; botón "Limpiar filtros".
- **Clientes:** mismos 4 filtros (Cliente, Correo, Teléfono, Registrado).
- **Modal profesional de eliminación** (reemplaza el `window.confirm`).

### Panel Taller — estética
- Sidebar con **logo real** (chip blanco); botón **"Ver sitio web"** definido.
- **Barras "Citas por mes"** con gradiente 3D + hover (lift + brillo).
- **Tarjetas KPI** con tinte de color + marca de agua translúcida (efecto vidrio, menos blanco).

### Otros
- Login: botón **"Volver al inicio"** con estilo; enlace **"¿Olvidaste tu contraseña?"**.

### Documentación (nueva carpeta `docs/`)
- `docs/MANUAL-USUARIO.md` — manual paso a paso (cliente, taller, técnicos, FAQ).
- `docs/GUIA-CASOS-DE-USO.md` — arquitectura, actores, casos de uso, endpoints, flujos (para programadores y la defensa).

### Commits
`cb591a62` (estética panel), `8d072d67` (filtros solicitudes + login), `edc59f76` (reset real + filtros/modal clientes).

---

## 🐳 Fase 15 — Ingresos pulido, tema oscuro y paquete Docker offline

**Fecha:** 2026-07-19

### Panel Taller — Ingresos y tema
- **Ingresos:** las tarjetas de período (Hoy/Semana/Mes/Año) son **clickeables** y filtran la
  tabla de servicios completados; el botón CSV descarga aparte.
- **Filtros integrados en el encabezado** de la tabla de completados (Fecha, Cliente, Servicio,
  Técnico y **Monto**), una sola fila por columna (se quitó la doble fila fea).
- **Botón de tema claro/oscuro** en la barra superior del panel del taller.

### Paquete Docker offline (plan B para la defensa)
- **Motivo:** poder correr todo el proyecto en la laptop **sin internet/VPS** si falla la conexión.
- **Guía para IA:** `docs/crear-docker.md` — paso a paso ultra-detallado para que otro LLM
  dockerice el stack (contexto, arquitectura, Dockerfiles de referencia, compose, pruebas).
- **Respaldo de datos:** `docker/seed-data.sql` (dump de la DB en vivo: 11 usuarios, 7 clientes,
  10 solicitudes, 6 completadas — coincide exacto con producción).
- **Ejecutado por un LLM secundario y SUPERVISADO** por el principal. Archivos creados:
  `backend/Dockerfile`, `frontend-react/Dockerfile`, `.dockerignore` (x2), `docker-compose.yml`,
  `README-DOCKER.md`. Probado end-to-end (3 servicios arriba, `/rate` OK, login admin con datos).
- **Correcciones de la supervisión:** (1) se restauró `info-api-BCV.md` que el LLM había borrado;
  (2) se corrigió el README: **`--build` requiere internet** → construir una vez con internet y
  en la defensa correr `docker compose up` **sin** `--build` (offline).
- **CORS abierto** (`app.enableCors()`) → el frontend Docker (localhost:8080) habla con el
  backend (localhost:4000) sin bloqueo.

### Nota de datos
- Pedro **limpió clientes** de la DB a propósito (por eso hay 7 clientes / 10 solicitudes; no es pérdida).

### Commits
`012f1cb1` (ingresos+tema), `9388ac53` (filtros encabezado + guía docker + dump),
`7c6366bd` (archivos docker), `186026c6` (README docker --build online).

---

## 🧑‍🔧 Fase 16 — Panel del Técnico completo (datos del cliente para la visita)

**Fecha:** 2026-07-20

- El panel del técnico (`/tecnico`, `TecnicoDashboard.jsx`) ya existía (ve sus trabajos
  asignados por pestañas: Por realizar / En ejecución / Finalizados). **Mejora:** ahora cada
  tarjeta muestra los datos que el técnico necesita para ir a atender: **cédula, dirección**
  (extraída de las notas) y el **detalle/falla descrita** por el cliente, además de nombre,
  correo y WhatsApp, el equipo (marca/modelo/BTU) y el estado.
- Backend: `findAll` incluye `cedula` en el `select` del cliente.
- **Hecho por un LLM secundario con prompt detallado y SUPERVISADO** (solo 2 archivos tocados,
  builds OK, sin romper la lógica existente de estados/filtros).
- **Fix de credenciales demo:** el login mostraba `tecnico@freshservice.com` que no existe en
  la DB actual. Corregido a **`carlos.tecnico@freshservice.com` / `Tecnico1234`** (5 trabajos
  asignados). Otros técnicos: juan./jorge.tecnico@freshservice.com (misma clave).

### Commits
`72e53585` (foto split + estilos), `602c34ec` (fix hint login), `8c51bd83` (panel técnico).
