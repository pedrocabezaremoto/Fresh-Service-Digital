# Manual del Desarrollador — Fresh Service Digital

Guía técnica para entrar al proyecto, entender el flujo y no romper el deploy. Un desarrollador nuevo debería poder leer esto y levantar el entorno en ~30 minutos.

**Producción**

| Capa | URL | Puerto local / VPS |
|---|---|---|
| Frontend (SPA) | https://fresh.pedroservicios.xyz | `:4100` (`serve.mjs`) |
| API NestJS | https://api.pedroservicios.xyz | `:4000` |
| Webhook GitHub | (interno, no público) | `:4200` |

**Zona de operación:** San Juan de los Morros, Guárico, Venezuela.  
**Gestor de paquetes:** **pnpm** (no npm). Ver `Cambio-pnpm.md`.  
**Proxy:** Traefik + Let's Encrypt. No arrancar nginx en 80/443.

---

## 1. Requisitos y setup local

### Requisitos

- Node.js 22+
- pnpm 11+ (`packageManager` del repo: `pnpm@11.5.2`)
- PostgreSQL 15+
- Git

### Clonar e instalar

```bash
git clone <repo> Fresh-Service-Digital
cd Fresh-Service-Digital

cd backend && pnpm install --frozen-lockfile
cd ../frontend-react && pnpm install --frozen-lockfile
```

### Variables de entorno (backend)

No hay `.env.example` versionado. Crear `backend/.env` (gitignored) con estas claves. **No subir secretos a git.**

| Variable | Uso |
|---|---|
| `DATABASE_URL` | Conexión PostgreSQL (Prisma) |
| `PORT` | Puerto HTTP del API. En prod: `4000`. Si falta, `main.ts` usa `3001` |
| `JWT_SECRET` | Firma de tokens |
| `JWT_EXPIRES` | Expiración JWT. Default: `7d` |
| `FRONTEND_URL` | Origen del SPA (redirects de verificación / reset). Local: `http://localhost:5174` |
| `PUBLIC_API_URL` | URL pública del API (enlaces de imágenes, magic link). Prod: `https://api.pedroservicios.xyz` |
| `PUBLIC_WEB_URL` | URL pública del sitio. Prod: `https://fresh.pedroservicios.xyz` |
| `SMTP_HOST` | SMTP de salida (Resend) |
| `SMTP_PORT` | Default `587` |
| `SMTP_SECURE` | `"true"` si TLS implícito |
| `SMTP_USER` / `SMTP_PASS` | Credenciales SMTP |
| `SMTP_FROM` | Remitente. Prod: `"Fresh Service Digital" <noreply@pedroservicios.xyz>` |
| `CHATBOT_LLM_API_KEY` | API key de DeepSeek |
| `CHATBOT_LLM_BASE_URL` | Default `https://api.deepseek.com` |
| `CHATBOT_LLM_MODEL` | Default `deepseek-v4-flash` |
| `CHATBOT_TELEGRAM_BOT_TOKEN` | Bot `@copito_fresh_bot` |
| `CHATBOT_TELEGRAM_CHAT_ID` | Chat/canal de leads |
| `CHATBOT_MONTHLY_BUDGET_USD` | Tope de gasto LLM. Default `5` |
| `CHATBOT_MAX_MESSAGES_PER_CONVERSATION` | Tope de mensajes user por sesión. Default `10` |
| `CHATBOT_RATE_LIMIT_DAILY` | Tope diario por IP. Default `60` |
| `BCV_API_URL` | Tasa oficial. Default DolarAPI Venezuela |

Los valores reales viven en `backend/.env` (gitignored) y en `/root/.fresh-webhook-secret` (firma HMAC del webhook).

### Base de datos

```bash
cd backend
pnpm exec prisma migrate deploy
pnpm exec prisma generate
node prisma/seed.js
```

`seed.js` **borra todos los usuarios** y recrea admin, un técnico y 10 clientes demo con citas. No correrlo en producción si hay datos reales.

Técnicos extra (idempotente, no borra):

```bash
node prisma/seed-technicians.js
```

### Arrancar en desarrollo

```bash
# Terminal 1 — API (watch)
cd backend && pnpm run start:dev

# Terminal 2 — Vite (puerto 5174)
cd frontend-react && pnpm run dev
```

El frontend detecta `localhost` y apunta a `http://localhost:4000`. En producción usa `https://api.pedroservicios.xyz`.

Scripts útiles:

| Dónde | Comando | Qué hace |
|---|---|---|
| `backend/` | `pnpm run start:dev` | NestJS en watch |
| `backend/` | `pnpm run build` | Compila a `dist/` |
| `backend/` | `pnpm run start:prod` | `node dist/main` |
| `backend/` | `pnpm exec prisma migrate dev --name nombre` | Nueva migración |
| `frontend-react/` | `pnpm run dev` | Vite :5174 |
| `frontend-react/` | `pnpm run build` | Bundle a `dist/` |
| raíz | `./deploy.sh` | Deploy completo en el VPS |

---

## 2. Arquitectura general

```
Cliente (navegador / PWA)
        │
        ├── HTTP  →  React SPA (:4100 / Vite :5174)
        │                 │
        │                 └── fetch + JWT  →  NestJS API (:4000)
        │                                          │
        │                                          ├── Prisma → PostgreSQL
        │                                          ├── Resend SMTP (correo)
        │                                          ├── DeepSeek (Copito)
        │                                          ├── DolarAPI (tasa BCV)
        │                                          └── Telegram (leads)
        │
        ├── SSE   →  POST /chat  (tokens de Copito)
        │
        └── WS    →  Socket.IO namespace /live-chat
```

### Piezas clave

- **SPA React 19** + Vite 6 + Tailwind v4 + react-router-dom v7. El HTML/CSS de la raíz y `views/` es legacy; no es el producto.
- **API NestJS 10** monolítica. Entry: `backend/src/main.ts`. CORS abierto (`origin: true`). Uploads estáticos en `/uploads/`.
- **Autenticación:** JWT Bearer en `Authorization`. Guard `JwtAuthGuard` + `RolesGuard` + decorator `@Roles(...)`.
- **Roles:** `CLIENT`, `ADMIN`, `TECHNICIAN`.
- **Precios:** se guardan en USD (`Service.priceUsd`, `Appointment.priceUsd`). El frontend convierte a Bs con `GET /rate` (tasa BCV, cache 6 h en tabla `settings`).
- **Correo:** `backend/src/mail/mail.service.ts` (nodemailer). From: `noreply@pedroservicios.xyz`.
- **PWA:** `public/manifest.json` + `public/sw.js` (cache `fsd-v1`). Registro en `main.jsx`. HTML network-first; JS/CSS/img cache-first. No cachea API, chat, sockets ni uploads.

### Flujo de precios

1. Admin crea/edita servicios en USD (tabla `services`).
2. Home y Catálogo leen `GET /services/equipment-types` (`minPriceUsd`, `imageUrl`).
3. `RateContext` pide `GET /rate` una vez al cargar.
4. `Price.jsx` / `money.js` muestran USD + Bs.
5. `frontend-react/src/lib/prices.js` y `backend/src/common/prices.ts` son **fallback histórico**, no la fuente viva.

---

## 3. Base de datos (Prisma)

Schema: `backend/prisma/schema.prisma`.  
Cliente: `backend/src/prisma/prisma.service.ts`.  
14 modelos + 2 enums (`Role`, `AppointmentStatus`).

### Modelos

#### `User` (`users`)

Campos: `id`, `email` (único), `username` (único, opcional), `password` (bcrypt), `firstName`, `lastName`, `phone`, `cedula`, `role`, `specialty`, `isActive`, `isVerified`, `verificationCode`, `resetToken`, `resetTokenExpiry`, timestamps.

Relaciones: citas como cliente (`appointments`) y como técnico (`assignedServices`).

Login: campo `identifier` (email o username). El username es útil para ADMIN/TECH (`admin`). Clientes suelen entrar con email. El DTO aún acepta `email` por compatibilidad.

#### `Appointment` (`appointments`)

Campos: `clientId`, `technicianId`, `status` (`PENDING` | `ASSIGNED` | `IN_PROGRESS` | `COMPLETED` | `CANCELLED`), `scheduledAt`, `priceUsd` (congelado al crear), `latitude`, `longitude`, `address`, `notes`, `serviceId`.

Relaciones: `User` (cliente + técnico), `Service`, `Equipment[]`.

#### `Service` (`services`)

`name`, `category` (string/slug), `equipmentType` (string/slug), `priceUsd`, `description`, `isActive`, `sortOrder`. Único: `[name, equipmentType]`.

`category` y `equipmentType` **ya no son enums**. Son slugs de las tablas de opciones.

#### `ServiceCategoryOption` (`service_category_options`)

`slug` único, `label`, `sortOrder`, `isActive`. Ej: Mantenimiento, Reparación, Instalación.

#### `EquipmentTypeOption` (`equipment_type_options`)

`slug`, `label`, `description`, `imageFilename`, `sortOrder`, `isActive`.  
`GET` público añade `serviceCount`, `minPriceUsd`, `imageUrl`. Fotos en `uploads/equipment-types/`.

#### `Equipment` (`equipments`)

Por cita: `brand`, `model`, `serialNumber`, `btuCapacity`, `failureDescription`.

#### `SiteImage` (`site_images`)

`slot` único, `filename`, `mimeType`, dimensiones, `sizeBytes`.  
UI admin usa solo `hero` y `technician`. El backend aún acepta slots legacy (`service_ventana`, `service_split`, `service_toneladas`). Archivos en `uploads/site/`.

#### `Setting` (`settings`)

Clave/valor. Hoy: `bcv_rate` (tasa BCV + fecha).

#### `ChatConversation` (`chat_conversations`)

`sessionId` único, `ipHash`, `leadId`, `wasConverted`, `messageCount`, `estimatedCostUsd`, `lastMessageAt`.  
Chat en vivo: `operatorActive`, `operatorName`, `status` (`active`/`closed`), `unreadByAdmin`, `paused`, `blocked`, `imageCount`, `archived`.

#### `ChatMessage` (`chat_messages`)

`role`: `user` | `assistant` | `tool` | `operator`.  
`type`: `text` | `image`. `imageUrl`, tokens in/out.

#### `ChatLead` (`chat_leads`)

`name`, `phone`, `email`, `serviceInterest`, `message`, `source`, `ipHash`, `readAt`.

#### `ChatSetting` (`chat_settings`)

Clave/valor JSON (reservado para config del bot).

#### `CarouselImage` (`carousel_images`)

`filename`, `alt`, `position`, `active`, metadatos. Archivos en `uploads/carousel/`.

#### `TickerMessage` (`ticker_messages`)

`text`, `isActive`, `sortOrder`. Franja promocional del Home.

### Migraciones

```bash
cd backend
pnpm exec prisma migrate dev --name descripcion_corta
```

Eso genera `prisma/migrations/<timestamp>_descripcion_corta/` y aplica el SQL.

**Regla dura:** nunca cambiar `schema.prisma` sin crear y commitear la migración. `deploy.sh` corre `prisma migrate deploy`. Si el schema deriva sin carpeta de migración, el deploy automático no aplica el cambio y las funciones nuevas rompen en prod. El script avisa si detecta drift.

En el VPS solo se usa `migrate deploy` (aplica lo ya commiteado). `migrate dev` es para la máquina de desarrollo.

---

## 4. Backend — módulos y endpoints

Módulo raíz: `backend/src/app.module.ts`. Importa JWT global + Prisma + appointments, users, rate, services, site-images, chat, carousel, ticker.

Auth no es un módulo Nest: son guards en `backend/src/auth/` (`jwt-auth.guard.ts`, `roles.guard.ts`, `roles.decorator.ts`). Mail se usa desde Users.

Uploads servidos en `/uploads/` (`site/`, `carousel/`, `chat-images/`, `equipment-types/`).

Validación global: `ValidationPipe` con `whitelist` + `transform`.

### Auth / Users — `/users`

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/users` | JWT + ADMIN | Directorio de clientes |
| GET | `/users/technicians` | JWT + ADMIN | Listado de técnicos |
| POST | `/users/register` | Público | Registro cliente (correo de verificación) |
| POST | `/users/create-technician` | JWT + ADMIN | Alta de técnico (ya verificado, sin magic link) |
| GET | `/users/verify-link?token=` | Público | Verifica email y redirige al login |
| POST | `/users/login` | Público | Login. Body: `{ identifier, password }` (o `email`) |
| POST | `/users/forgot-password` | Público | Envía correo de reset |
| POST | `/users/reset-password` | Público | Body: `{ token, password }` |
| PATCH | `/users/:id` | JWT + ADMIN | Editar usuario |
| DELETE | `/users/:id` | JWT + ADMIN | Eliminar usuario |

### Appointments — `/appointments`

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/appointments` | JWT | Crear cita (cliente logueado) |
| POST | `/appointments/quick` | JWT + ADMIN | Cita rápida desde chat. Vincula por teléfono o crea guest `chat-xxxxx@guest.local` |
| GET | `/appointments` | JWT + ADMIN/TECH | ADMIN: todas. TECH: solo asignadas |
| GET | `/appointments/client/:clientId` | JWT | Historial de un cliente |
| PATCH | `/appointments/:id/complete` | JWT + ADMIN/TECH | Completar (técnico solo las suyas) |
| PATCH | `/appointments/:id/status` | JWT + ADMIN/TECH | Cambiar estado |
| PATCH | `/appointments/:id/assign` | JWT + ADMIN | Asignar / desasignar técnico |
| PATCH | `/appointments/:id` | JWT | Actualizar campos (ubicación, notas, etc.) |

### Services — `/services`

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/services` | Público | Servicios activos |
| GET | `/services/all` | JWT + ADMIN | Todos (incluye inactivos) |
| POST | `/services` | JWT + ADMIN | Crear servicio |
| PATCH | `/services/:id` | JWT + ADMIN | Editar |
| DELETE | `/services/:id` | JWT + ADMIN | Eliminar |
| GET | `/services/categories` | Público | Categorías activas |
| GET | `/services/categories/all` | JWT + ADMIN | Todas |
| POST | `/services/categories` | JWT + ADMIN | Crear (`slug` se normaliza a MAYÚSCULAS_CON_GUION) |
| PATCH | `/services/categories/:id` | JWT + ADMIN | Editar label / orden / activo |
| DELETE | `/services/categories/:id` | JWT + ADMIN | Falla si hay servicios usando el slug |
| GET | `/services/equipment-types` | Público | Tipos activos + `serviceCount`, `minPriceUsd`, `imageUrl` |
| GET | `/services/equipment-types/all` | JWT + ADMIN | Todos + `imageUrl` |
| POST | `/services/equipment-types` | JWT + ADMIN | Crear (acepta `description`) |
| PATCH | `/services/equipment-types/:id` | JWT + ADMIN | Editar |
| DELETE | `/services/equipment-types/:id` | JWT + ADMIN | Falla si hay servicios; borra la foto |
| POST | `/services/equipment-types/:id/image` | JWT + ADMIN | Upload JPG/PNG/WebP ≤ 2 MB |
| DELETE | `/services/equipment-types/:id/image` | JWT + ADMIN | Quitar foto |

### Rate — `/rate`

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/rate` | Público | `{ rate, date, source }`. Cache 6 h en memoria + tabla `settings` |

### Site images — `/site-images`

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/site-images` | Público | Mapa de slots → URL |
| POST | `/site-images/:slot` | JWT + ADMIN | Upload `file` (multer, ≤ 2 MB) |
| DELETE | `/site-images/:slot` | JWT + ADMIN | Restaurar fallback estático |

### Carousel — `/carousel`

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/carousel` | Público | Imágenes activas |
| GET | `/carousel/all` | JWT + ADMIN | Todas |
| POST | `/carousel` | JWT + ADMIN | Upload |
| PATCH | `/carousel/reorder` | JWT + ADMIN | Body `{ ids: string[] }` |
| PATCH | `/carousel/:id/toggle` | JWT + ADMIN | Activar / desactivar |
| DELETE | `/carousel/:id` | JWT + ADMIN | Borrar |

### Ticker — `/ticker`

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/ticker` | Público | Mensajes activos (Home) |
| GET | `/ticker/all` | JWT + ADMIN | Todos |
| POST | `/ticker` | JWT + ADMIN | Crear `{ text }` |
| PATCH | `/ticker/:id` | JWT + ADMIN | Texto / activo / orden |
| DELETE | `/ticker/:id` | JWT + ADMIN | Borrar |

### Chat — `/chat`

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/chat/status` | Público | Estado del bot (disponible / presupuesto / circuito) |
| POST | `/chat` | Público | SSE: tokens de Copito |
| POST | `/chat/upload-image` | Público | Foto del cliente ≤ 5 MB (Sharp / heic-convert → JPEG) |
| POST | `/chat/operator-upload-image` | JWT + ADMIN | Foto del operador ≤ 2 MB |
| GET | `/chat/archived` | JWT + ADMIN | Conversaciones archivadas |
| GET | `/chat/leads/unread` | JWT + ADMIN | Hasta 20 leads con `readAt` null |
| PATCH | `/chat/leads/:id/read` | JWT + ADMIN | Marcar leído |
| GET | `/chat/conversations/:id/messages` | JWT + ADMIN | Historial |
| PATCH | `/chat/:id/archive` | JWT + ADMIN | Archivar |
| PATCH | `/chat/:id/unarchive` | JWT + ADMIN | Desarchivar |
| DELETE | `/chat/:id` | JWT + ADMIN | Borrar (unlink de `chat-images/`) |

### Flujo del chat (Copito + operador)

```
Cliente envía texto
        │
        ▼
POST /chat  (SSE)
        │
        ├─ conversación blocked / paused → error SSE
        │
        ├─ operatorActive === true
        │     guardar mensaje user
        │     emitir socket a operadores
        │     NO llamar a DeepSeek
        │
        └─ operatorActive === false
              rate limit / presupuesto / circuito
              guardar mensaje
              DeepSeek stream → event `token`
              tool calling (hasta 3 rondas)
              event `done` o `error`
```

Eventos SSE: `{ type: 'token', value }`, `{ type: 'done', conversationId }`, `{ type: 'error', message }`.

### Tool calling de Copito

Definido en `chat.service.ts` (`CHAT_TOOLS`). DeepSeek las invoca; el backend las ejecuta.

**`guardar_contacto`**

- Args: `nombre`, `telefono?`, `email?`, `servicio`, `resumen`.
- Crea `ChatLead`, marca la conversación como convertida, notifica Telegram (`chat-telegram.service.ts`) y emite `newLead` a operadores.

**`consultar_servicios`**

- Args: `tipo_equipo?` (slug: `VENTANA`, `SPLIT`, `NEVERA`…).
- Lee servicios activos de la DB y devuelve nombre / tipo / precio USD. Copito no inventa tarifas.

Prompt operativo: primero preguntar el tipo de servicio, luego datos de contacto. `guardar_contacto` en cuanto haya nombre + teléfono o email + servicio.

### Socket.IO `/live-chat`

Gateway: `backend/src/chat/chat.gateway.ts`. CORS `origin: '*'`.

Handshake:

- Operador: `auth.token` (JWT ADMIN) → room `operators`.
- Cliente: `auth.sessionId` → room `session:<id>`. El widget solo conecta con el chat abierto.

| Evento (cliente → server) | Quién | Efecto |
|---|---|---|
| `takeOver` | Operador | `operatorActive=true`, modo operador |
| `release` | Operador | Devuelve el control a la IA |
| `operatorMessage` | Operador | Mensaje persistido + emit al cliente (no exige takeOver) |
| `pauseConversation` / `resumeConversation` | Operador | Pausa / reanuda IA |
| `blockConversation` / `unblockConversation` | Operador | Cierra / reabre |
| `typing` / `stopTyping` | Ambos | Indicador bidireccional |
| `sendAppointmentForm` | Operador | Widget muestra formulario inline |
| `submitAppointmentForm` | Cliente | Crea cita vía `createQuickFromChat` |

Emisiones relevantes hacia operadores: `newLead`, `conversationUpdated`, mensajes nuevos. Campanita del dashboard usa un socket propio (funciona fuera de la vista Chat).

---

## 5. Frontend — páginas y componentes

Entry: `frontend-react/src/main.jsx` (providers + registro del SW).  
Router: `frontend-react/src/App.jsx`.  
Design system: `frontend-react/src/index.css` (Tailwind v4, tema, `prefers-reduced-motion`).

### Rutas

| Path | Componente | Auth | Rol |
|---|---|---|---|
| `/` | `Home` | No | Público. Hero + cards dinámicas + ticker |
| `/catalogo` | `Catalogo` | No | Público. Acordeón por tipo de equipo |
| `/solicitud` | `Solicitud` | JWT | Cliente. Si no hay sesión → `/registro` |
| `/panel` | `ClienteDashboard` | JWT | Cliente |
| `/login` | `Login` | No | Email o username |
| `/registro` | `Registro` | No | Alta cliente |
| `/recuperar` | `Recuperar` | No | Forgot password |
| `/restablecer` | `Restablecer` | No | Reset con token |
| `/proforma` | `Proforma` | JWT | Imprimible, sin navbar |
| `/admin` | `AdminDashboard` | JWT + ADMIN | Panel taller |
| `/tecnico` | `TecnicoDashboard` | JWT + TECH | Panel técnico |
| `*` | redirect `/` | — | — |

`/admin` y `/tecnico` van a `/panel` si el rol no coincide.

### Vistas del admin (`AdminDashboard.jsx`)

Sidebar (colapsable, `localStorage` `sidebar-collapsed`):

1. Dashboard — KPIs, donut, barras, sparklines (`DashboardVisuals.jsx`, SVG propio, sin libs de charts).
2. Solicitudes — tabla + mapa + asignación.
3. Chat en vivo — `AdminChatView.jsx`.
4. Ingresos — citas `COMPLETED`, filtro por `updatedAt` + date picker.
5. Servicios — CRUD + categorías + tipos de equipo (foto, descripción, orden).
6. Clientes — directorio.
7. Técnicos — alta / especialidad / activo.
8. Imágenes del sitio — `SiteImagesSection` (Hero + Técnico) + `CarouselSection` + `TickerSection`.

Leads no es una vista: campanita en el header (`GET /chat/leads/unread` + socket `newLead`).

### Contextos (`src/context/`)

| Contexto | Qué guarda | Persistencia |
|---|---|---|
| `AuthContext` | `user`, `token`, `login` / `logout` | `localStorage` `fsd_token`, `fsd_user` |
| `ThemeContext` | claro / oscuro | `localStorage` `theme` + clase `dark-mode` |
| `RateContext` | tasa BCV del día | Memoria (un fetch al montar) |
| `SiteImagesContext` | URLs de Hero/Técnico | `localStorage` `fsd_site_images` (evita flash) |

### `api.js`

Un solo `request(path, { method, body, auth, raw })`:

- Prefijo: `API_BASE` (`localhost:4000` o `https://api.pedroservicios.xyz`).
- Si `auth: true`, manda `Authorization: Bearer` desde `fsd_token`.
- Errores: lanza `Error` con `status` y `data`.
- Uploads: `uploadFile` (FormData, campo `file`). La foto de tipo de equipo usa el campo `image`.

Para un endpoint nuevo: agregar el método en el objeto `api` y llamarlo desde la página. No hacer `fetch` suelto salvo casos ya existentes (`/rate`, SSE de Copito, sockets).

### Componentes que importan

- Layout público: `PublicLayout` (Navbar + Footer + Copito).
- Auth: `AuthShell`, `ProtectedRoute`.
- Chat: `Copito.jsx` (widget completo: SSE + socket + form de cita + compresión JPEG ≤ 900 KB en cliente).
- Mapas Leaflet: `LocationPicker`, `LocationView`, `ServiceMap`, `fixLeafletIcons.js`.
- Admin chat: `ConfirmModal`, `EmojiPicker`, `QuickReplies` (`localStorage` `quick-replies-custom`).

### Cómo agregar una página

1. Crear `frontend-react/src/pages/Nueva.jsx`.
2. Importar y declarar `<Route>` en `App.jsx`.
3. Si es pública con navbar, ponerla dentro de `PublicLayout`.
4. Si requiere login, envolver con `<ProtectedRoute>` (`requireAdmin` / `requireTechnician` si aplica).
5. Agregar el link en `Navbar.jsx` (o en el sidebar admin).

---

## 6. Deploy y operación

### Automático

```
push a main
    → GitHub webhook (HMAC-SHA256, secreto en /root/.fresh-webhook-secret)
    → fresh-webhook :4200 (webhook.mjs)
    → ./deploy.sh
         1. git pull
         2. pnpm install backend + prisma migrate deploy + generate
         3. pnpm build frontend
         4. pnpm build backend
         5. pm2 restart fresh-service + fresh-frontend
         6. health check HTTP
         7. push al remote backup (si existe)
```

Filosofía: se construye todo **antes** de reiniciar. Si un build falla, el sitio viejo sigue en vivo.

Solo se despliega `refs/heads/main`. El webhook responde 202 y corre el script en segundo plano, con lock anti-solape. Log: `deploy-webhook.log`.

### Manual

```bash
cd /root/Fresh-Service-Digital && ./deploy.sh
```

Rebuild de un solo lado (hotfix):

```bash
# API
cd /root/Fresh-Service-Digital/backend && pnpm run build && pm2 restart fresh-service

# Front
cd /root/Fresh-Service-Digital/frontend-react && pnpm run build && pm2 restart fresh-frontend
```

### Procesos pm2

| Nombre | Qué es | Puerto |
|---|---|---|
| `fresh-service` | NestJS (`dist/main`) | 4000 |
| `fresh-frontend` | `node serve.mjs` (SPA fallback a `index.html`) | 4100 |
| `fresh-webhook` | `webhook.mjs` | 4200 |

```bash
pm2 status
pm2 logs fresh-service
pm2 logs fresh-frontend
pm2 logs fresh-webhook
pm2 logs fresh-service --lines 50
```

### Datos demo

```bash
cd /root/Fresh-Service-Digital/backend
node prisma/seed.js              # DESTRUCTIVO: borra users
node prisma/seed-technicians.js  # upsert, no borra
```

### Infra

- VPS Ubuntu. Traefik termina HTTPS (Let's Encrypt) y enruta `fresh.` → :4100, `api.` → :4000.
- **No** usar nginx en 80/443.
- Docker Compose (`docker/`, `docker-compose.yml`) es plan B offline. Ver `README-DOCKER.md`.

---

## 7. Cómo agregar funcionalidades

### Nuevo módulo backend

1. Carpeta `backend/src/nombre/`.
2. `nombre.controller.ts` + `nombre.service.ts` + `nombre.module.ts`.
3. DTOs en `nombre/dto/` con `class-validator`.
4. Importar el módulo en `app.module.ts`.
5. Si hay tabla nueva, ver el siguiente apartado.
6. Exponer el método en `frontend-react/src/lib/api.js`.
7. `pnpm run build` en backend. En local, `start:dev` recarga solo. En prod, sin rebuild el proceso viejo no tiene la ruta (`Cannot POST /...`).

### Nuevo modelo / campo

1. Editar `backend/prisma/schema.prisma`.
2. `cd backend && pnpm exec prisma migrate dev --name nombre_del_cambio`.
3. Commitear `schema.prisma` **y** `prisma/migrations/<timestamp>_.../`.
4. Regenerar cliente (`prisma generate` lo hace la migración).
5. Endpoints + UI.

### Nueva vista admin

El admin no usa rutas hijas: es un `view` en estado local.

1. Agregar `{ id, label, icon }` al array de navegación (~línea 868 de `AdminDashboard.jsx`).
2. Agregar el `<option>` del `<select>` mobile.
3. Agregar el bloque `view === 'id' ? ( ... )`.
4. Seguir el patrón visual (cards blancas, `ConfirmModal`, botones táctiles `min-h-11`).

### Nuevo endpoint en el frontend

```js
// frontend-react/src/lib/api.js
getAlgo: () => request('/algo', { auth: true }),
createAlgo: (payload) => request('/algo', { method: 'POST', body: payload, auth: true }),
```

### Nueva foto de tipo de equipo

No va en Imágenes del sitio. Se sube en **Servicios → Tipos de equipo** (`POST /services/equipment-types/:id/image`). Home y Catálogo leen `imageUrl`. Fallback: `img-window-ac.png`.

---

## 8. Credenciales de desarrollo

Definidas en los seeds. Contraseñas hasheadas con bcrypt (cost 10).

### `node prisma/seed.js` (destructivo)

| Rol | Identificador | Contraseña |
|---|---|---|
| ADMIN | `admin@freshservice.com` o username `admin` | `Admin1234` |
| TECHNICIAN | `tecnico@freshservice.com` | `Demo1234` |
| CLIENT (10) | `maria.rodriguez@gmail.com`, `jose.gonzalez@hotmail.com`, … | `Demo1234` |

### `node prisma/seed-technicians.js` (upsert)

| Email | Especialidad | Contraseña |
|---|---|---|
| `juan.tecnico@freshservice.com` | Aires de Ventana | `Tecnico1234` |
| `carlos.tecnico@freshservice.com` | Aires Split | `Tecnico1234` |
| `jorge.tecnico@freshservice.com` | General | `Tecnico1234` |

En producción el admin real es el usuario sembrado o el creado a mano; no re-sembrar a ciegas.

Secretos (JWT, DeepSeek, SMTP, Telegram, webhook) solo en `backend/.env` y `/root/.fresh-webhook-secret`. Correo de salida: `noreply@pedroservicios.xyz`.

---

## 9. Problemas conocidos y soluciones

| Síntoma | Causa | Qué hacer |
|---|---|---|
| `Cannot POST /endpoint` (404) | El proceso pm2 sigue con el `dist/` viejo | `cd backend && pnpm run build && pm2 restart fresh-service` |
| Cambio de Prisma no aparece en prod | Se editó `schema.prisma` sin migración | `pnpm exec prisma migrate dev --name ...` y push de `prisma/migrations/` |
| Deploy aborta en `git pull` | Cambios locales sin commitear | `git status` en el VPS; no dejar sucio el working tree |
| Fotos con halo gris | PNG con alfa semitransparente | Aplicar threshold de alpha al exportar |
| Ticker “roto” o doble en Windows | `prefers-reduced-motion` | El CSS ya oculta la copia duplicada del marquee; no “arreglarlo” quitando el media query |
| Iconos PWA viejos | SW / chrome cachean el icono aparte | En Chrome: datos del sitio → borrar, no solo “vaciar caché” |
| HEIC de Samsung no entra | Sharp/libvips 8.18.3 rechaza HEIC (`ipma>16`) | El upload ya hace fallback a `heic-convert` y sale JPEG 80 / 1200 px |
| Chat no responde | Sin `CHATBOT_LLM_API_KEY`, presupuesto mensual, circuito o rate limit | `GET /chat/status`; revisar `.env` y logs `pm2 logs fresh-service` |
| Widget no recibe sockets | Socket de Copito solo conecta con el chat **abierto** | Abrir el widget antes de probar handoff / formulario |
| Frontend apunta al API equivocado | `api.js` usa hostname | Local = `localhost:4000`. Prod = `api.pedroservicios.xyz` |
| `npm` / `package-lock.json` | Supply-chain; el repo migró a pnpm | Usar solo `pnpm`. Ver `Cambio-pnpm.md` |
| Mapa sin pines | Leaflet + Vite rompe URLs de iconos | Importar `fixLeafletIcons.js` (ya lo hacen los mapas) |

---

## Mapa rápido de archivos

```
Fresh-Service-Digital/
├── backend/
│   ├── src/
│   │   ├── main.ts                 # NestJS, CORS, /uploads, puerto
│   │   ├── app.module.ts
│   │   ├── auth/                   # JWT + roles
│   │   ├── users/                  # login, registro, técnicos
│   │   ├── appointments/           # citas + quick-from-chat
│   │   ├── services/               # catálogo + categorías + tipos + foto
│   │   ├── chat/                   # Copito SSE + Socket.IO + Telegram
│   │   ├── mail/                   # Resend SMTP
│   │   ├── rate/                   # BCV
│   │   ├── carousel/  ticker/  site-images/
│   │   └── common/prices.ts        # fallback USD
│   ├── prisma/schema.prisma
│   ├── prisma/seed.js
│   ├── prisma/seed-technicians.js
│   └── uploads/                    # gitignored
├── frontend-react/
│   ├── src/main.jsx  App.jsx  index.css
│   ├── src/pages/
│   ├── src/components/  (admin/, maps/, Copito.jsx)
│   ├── src/context/
│   ├── src/lib/api.js
│   ├── public/manifest.json  public/sw.js
│   ├── vite.config.js              # :5174
│   └── serve.mjs                   # prod :4100
├── Manuales/                       # este manual + manual-cliente
├── Progresos/                      # prompts e historial de features
├── deploy.sh
├── webhook.mjs
└── docker/                         # demo offline
```

---

## Checklist del primer día

1. Instalar Node 22, pnpm, PostgreSQL.
2. `pnpm install --frozen-lockfile` en `backend/` y `frontend-react/`.
3. Crear `backend/.env` (pedir las claves; no copiar prod a un laptop compartido).
4. `prisma migrate deploy` + `node prisma/seed.js`.
5. `pnpm run start:dev` + `pnpm run dev`.
6. Entrar a http://localhost:5174 — login `admin` / `Admin1234`.
7. Recorrer Home, Catálogo, Solicitud, `/admin` (las 8 vistas + campanita), `/tecnico`.
8. Leer `AGENTS.md` del repo (reglas de pnpm, Prisma y secretos) antes de tocar código.

Cuando el cambio esté listo: commit en una rama o en `main` si el flujo del equipo lo permite. Un push a `main` dispara el deploy solo. No hace falta entrar al VPS salvo logs o un hotfix de rebuild.
