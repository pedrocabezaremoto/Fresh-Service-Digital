# 🧭 Guía de Casos de Uso y Arquitectura — Fresh Service Digital

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
| **Técnico** (`TECHNICIAN`) | Especialista asignado a una solicitud (Juan/Carlos/Jorge). |
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
| GET | `/appointments` | ADMIN | Todas las solicitudes |
| GET | `/appointments/client/:id` | auth | Solicitudes de un cliente |
| PATCH | `/appointments/:id/status` | ADMIN | Cambiar estado |
| PATCH | `/appointments/:id/assign` | ADMIN | Asignar técnico |
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

## 9. Diagrama de flujo (cliente → taller)

```
Cliente                         Sistema/Taller
  │ registra + verifica correo
  │ inicia sesión
  │ solicita servicio ─────────► queda PENDING en el panel del taller
  │                              admin asigna técnico ──► ASSIGNED
  │ ◄──── correo con proforma ───┘
  │ ve estado + total, descarga proforma
  │                              taller marca COMPLETED
  │                              ingreso cuenta en "Ingresos"
```

---

## 10. Estado y roadmap

- **Versión 1.0** (defensa): completa y funcional.
- **v1.1:** deliverability con dominio propio (SPF/DKIM/DMARC), chat cliente↔taller en
  tiempo real, ubicación con Google Maps, mejoras de la sección Ingresos.
