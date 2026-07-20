# 🧭 Guía de Casos de Uso y Arquitectura — Fresh Service Digital

> **Versión 1.0** · Última actualización: 2026-07-20

Documento técnico-funcional para entender **cómo funciona** la plataforma: actores,
casos de uso, flujos y arquitectura. Pensado para un programador que se integra al
proyecto y para explicar el sistema en la defensa.

---

## 1. ¿Qué es?

Plataforma web para **solicitar y gestionar servicios de refrigeración a domicilio**
(aires acondicionados) en San Juan de los Morros, Venezuela. Digitaliza el flujo:
el cliente pide en línea → el taller asigna un técnico → se cobra con precios anclados
al dólar (tasa BCV).

---

## 2. Actores

| Actor | Descripción |
|---|---|
| **Cliente** (`CLIENT`) | Solicita servicios, ve su estado, descarga proformas. |
| **Técnico** (`TECHNICIAN`) | Especialista con panel propio (`/tecnico`): ve trabajos, cédula/dirección/detalle del cliente, cambia estados y puede auto-asignarse. Demo: Juan/Carlos/Jorge. |
| **Administrador / Taller** (`ADMIN`) | Gestiona solicitudes, técnicos, ingresos y clientes. |

---

## 3. Arquitectura (visión general)

```
Navegador  ──HTTPS──►  fresh.pedroservicios.xyz   (Frontend: React 19 + Vite + Tailwind)
                              │  (fetch)
                              ▼
                       api.pedroservicios.xyz      (Backend: NestJS + Prisma)
                              │
                              ▼
                        PostgreSQL  +  DolarAPI (tasa BCV)  +  SMTP Gmail (correos)
```

- **VPS** (Contabo, siempre encendido) con **Traefik** (proxy + HTTPS Let's Encrypt),
  **pm2** (procesos), y **webhook de GitHub** que despliega solo en cada push a `main`.
- Auth con **JWT** (login) + **bcrypt** (contraseñas). Rutas protegidas por rol (guards).

### Stack
- **Frontend:** React 19, Vite 6, Tailwind v4, react-router-dom. Carpeta `frontend-react/`.
- **Backend:** NestJS 10, Prisma 6, PostgreSQL. Carpeta `backend/`.
- **Correos:** Nodemailer + Gmail (contraseña de aplicación).
- **Precios:** tasa oficial del BCV vía DolarAPI (`ve.dolarapi.com/v1/dolares/oficial`).

---

## 4. Modelo de datos (Prisma, resumido)

- **User**: `id, email, password (bcrypt), firstName, lastName, phone, cedula, role,
  isVerified, verificationCode, resetToken/resetTokenExpiry`.
- **Appointment** (solicitud): `id, clientId, technicianId, status, scheduledAt,
  priceUsd, notes`. Estados: `PENDING, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED`.
- **Equipment** (equipo de la cita): `brand, model, btuCapacity, failureDescription`.
- **Setting**: cache clave/valor (guarda la tasa BCV).

---

## 5. Casos de uso principales

### CU-01 · Registro y verificación de cuenta (Cliente)
1. Cliente se registra (`POST /users/register`).
2. El sistema crea el usuario **no verificado** y envía un correo con enlace mágico.
3. Cliente abre el enlace (`GET /users/verify-link?token=...`) → cuenta verificada → redirige al login.
- **Regla:** sin verificar no puede iniciar sesión.

### CU-02 · Inicio de sesión
1. `POST /users/login` con correo + contraseña.
2. Devuelve **JWT** + datos del usuario. El frontend guarda el token y redirige por rol
   (cliente → `/panel`, técnico → `/tecnico`, admin → `/admin`).

### CU-03 · Recuperar contraseña
1. `POST /users/forgot-password` con el correo → genera token (1h) y envía correo.
2. Cliente abre `/restablecer?token=...` y crea nueva clave (`POST /users/reset-password`).
- **Seguridad:** el sistema responde igual exista o no el correo; token con expiración.

### CU-04 · Solicitar un servicio (Cliente)
1. Cliente autenticado abre `/solicitud` (datos precargados desde su cuenta).
2. Elige equipo + servicio → ve **precio estimado** (USD→Bs a tasa BCV).
3. Envía (`POST /appointments`): se crea la cita (estado `PENDING`) + equipo, se
   **congela el precio** (`priceUsd`) y se guarda la **cédula** en su cuenta.
- Si un usuario **no** logueado pulsa "Solicitar" → lo lleva a **Registro** y luego
  regresa a la solicitud.

### CU-05 · Asignar técnico (Admin)
1. En Solicitudes, el admin elige un técnico (el sistema **sugiere** por tipo de aire).
2. `PATCH /appointments/:id/assign` → estado pasa a `ASSIGNED`.
3. Se envía **correo al cliente** con el técnico, WhatsApp y el total (proforma).

### CU-06 · Seguimiento y proforma (Cliente)
1. En `/panel`, el cliente ve estado, precio por servicio y **total a pagar**.
2. Descarga **proforma** en `/proforma` (documento imprimible / PDF del navegador).

### CU-07 · Control de ingresos (Admin)
1. En Ingresos, suma el `priceUsd` de las citas **COMPLETED** por período (día/semana/mes/año).
2. Exporta reportes en **CSV**.

### CU-08 · Gestión de clientes (Admin)
1. Directorio con filtros. Editar (`PATCH /users/:id`) o eliminar (`DELETE /users/:id`)
   usuarios (solo ADMIN). Eliminar borra en cascada sus solicitudes.

### CU-09 · Panel del técnico (gestión de trabajos en campo)
1. El técnico inicia sesión y es redirigido a **`/tecnico`** (rol `TECHNICIAN`).
2. El backend lista citas con `GET /appointments` filtradas: las **asignadas a él** o las
   **PENDING sin técnico** (puede “tomar” un trabajo). En `include.client.select` se
   expone también **`cedula`**.
3. Cada tarjeta del panel muestra, además de nombre/correo/teléfono/estado/servicio:
   - **Cédula** → `client.cedula` (si es null → `—`)
   - **Dirección** → extraída de `notes` con regex `Direcci[oó]n:\s*(.+)` (si no hay → `—`)
   - **Detalle** → `equipment[0].failureDescription` (si no hay → `—`)
4. Acciones disponibles en la tarjeta:
   - **Tomar servicio** → `PATCH /appointments/:id/assign` (auto-asignación al técnico logueado)
   - **Iniciar servicio** → `PATCH /appointments/:id/status` → `IN_PROGRESS`
   - **Marcar terminado** → status → `COMPLETED`
   - **WhatsApp** → abre `wa.me/<teléfono del cliente>`
5. Pestañas: Por realizar / En ejecución / Finalizados + buscador por cliente o equipo.
- **UI:** el sidebar usa el **logo oficial** (`/logo.png`), igual que el sitio público y el panel taller.

---

## 6. Endpoints principales (API)

| Método | Ruta | Acceso | Qué hace |
|---|---|---|---|
| POST | `/users/register` | público | Registrar cliente |
| GET | `/users/verify-link?token=` | público | Verificar correo |
| POST | `/users/login` | público | Iniciar sesión (JWT) |
| POST | `/users/forgot-password` | público | Pedir reseteo |
| POST | `/users/reset-password` | público | Nueva contraseña |
| GET | `/users` | ADMIN | Listar clientes |
| GET | `/users/technicians` | ADMIN | Listar técnicos |
| PATCH | `/users/:id` | ADMIN | Editar usuario |
| DELETE | `/users/:id` | ADMIN | Eliminar usuario |
| POST | `/appointments` | auth | Crear solicitud |
| GET | `/appointments` | ADMIN, TECHNICIAN | Listar citas (técnico: solo las suyas + PENDING libres); incluye `client.cedula` |
| GET | `/appointments/client/:id` | auth | Solicitudes de un cliente |
| PATCH | `/appointments/:id/status` | ADMIN, TECHNICIAN | Cambiar estado |
| PATCH | `/appointments/:id/assign` | ADMIN, TECHNICIAN | Asignar técnico (técnico se auto-asigna) |
| GET | `/rate` | público | Tasa BCV actual |

---

## 7. Modelo de precios (anclaje al dólar)

- Los precios se guardan en **USD** (`lib/prices.js` en front, `common/prices.ts` en back).
- La **tasa BCV** se trae de DolarAPI, se cachea en `Setting`, se refresca cada 6h y es
  **tolerante a fallos** (usa la última si la API cae).
- El frontend calcula **Bs = USD × tasa** al vuelo. Si la tasa cambia, los Bs se recalculan solos.

---

## 8. Despliegue (DevOps)

- **`deploy.sh`** en la raíz: `git pull → migraciones → build front/back → restart pm2 →
  health check → respaldo al repo espejo`.
- **Webhook de GitHub** (`webhook.mjs`) dispara `deploy.sh` en cada push a `main`
  (verifica firma HMAC). URL: `https://api.pedroservicios.xyz/deploy-hook`.
- **Repo de respaldo** (espejo) que se actualiza tras cada deploy.
- Secretos (DB, SMTP, JWT) en `backend/.env` (no versionado).

---

## 9. Diagrama de flujo (cliente → taller → técnico)

```
Cliente                         Taller (Admin)              Técnico (/tecnico)
  │ registra + verifica
  │ inicia sesión
  │ solicita servicio ─────────► queda PENDING
  │                              asigna técnico ──► ASSIGNED ──► ve tarjeta con:
  │ ◄──── correo (proforma) ───┘                               cédula, dirección,
  │ ve técnico + WhatsApp                                       detalle del problema
  │                              (o el técnico “toma” el servicio)
  │                                                    inicia ──► IN_PROGRESS
  │                                                    termina ─► COMPLETED
  │                              ingreso en "Ingresos" ◄─────────┘
  │ descarga proforma
```

---

## 10. Correr offline con Docker (demostración local)

Para presentar el proyecto **sin depender del servidor ni de internet**, todo el stack se
empaqueta con Docker (Postgres + backend + frontend).

- **`docker-compose.yml`** (raíz): 3 servicios. Postgres carga el respaldo
  **`docker/seed-data.sql`** (esquema + datos reales) en su primer arranque.
- **`README-DOCKER.md`**: cómo levantarlo. Regla: `docker compose up --build` **una vez con
  internet** (construye/cachea) y luego `docker compose up` **offline**. Abre `http://localhost:8080`.
- **`docs/crear-docker.md`**: guía detallada de cómo se dockerizó (por si hay que rehacerlo).
- **Detalle técnico:** el backend expone el puerto **4000** y el frontend detecta `localhost`
  para llamarlo (`api.js`). El CORS del backend está abierto (`app.enableCors()`), por eso el
  frontend en `localhost:8080` habla con el backend en `localhost:4000` sin bloqueo.
- **Offline:** los correos se simulan en consola (sin SMTP) y la tasa BCV usa la última cacheada.

---

## 11. Estado y roadmap

- **Versión 1.0** (defensa): completa y funcional. Incluye modo claro/oscuro, filtros
  inteligentes en todas las tablas del taller, gestión de usuarios, control de ingresos y
  **panel del técnico** con cédula, dirección y detalle del servicio en cada tarjeta.
- **v1.1:** deliverability con dominio propio (SPF/DKIM/DMARC), chat cliente↔taller en
  tiempo real, ubicación con Google Maps, más mejoras de la sección Ingresos.
