# AGENTS.md — Guía para Agentes de IA

> Contexto técnico estricto para cualquier agente que trabaje sobre este repositorio.

---

## ¿Qué es este proyecto?

**Fresh Service Digital** — Plataforma de servicios de refrigeración/AC a domicilio.  
**Zona:** San Juan de los Morros, Venezuela.  
**Estado:** **Versión 1.0 en producción** (defensa exitosa 2026-07-20). Roadmap abierto: v1.1.

| Entorno | URL |
|---|---|
| Frontend | https://fresh.pedroservicios.xyz |
| API | https://api.pedroservicios.xyz |
| Repo | monorepo `frontend-react/` + `backend/` |

---

## Stack actual (OBLIGATORIO)

- **Frontend oficial:** React 19 + Vite 6 + Tailwind v4 + react-router 7 en `frontend-react/`
- **Backend:** NestJS 10 + Prisma 6 + PostgreSQL + JWT + bcrypt + nodemailer en `backend/`
- **Paquetes:** **pnpm** únicamente (`pnpm install --frozen-lockfile`, `pnpm run build`, `pnpm exec prisma …`). Ver `Cambio-pnpm.md`. **Prohibido npm/npx** y regenerar `package-lock.json`.
- **Procesos (pm2):** `fresh-frontend` (:4100), `fresh-service` (:4000), `fresh-webhook` (:4200)
- **Proxy:** Traefik (configs en `/etc/easypanel/traefik/config/`). **No** arrancar nginx (ocupa 80/443).
- **Deploy:** push a `main` → webhook HMAC → `./deploy.sh` (build antes de reiniciar; `prisma migrate deploy`).

El HTML/CSS en la raíz y `views/` es **legacy**. No es el producto. No “arreglar” el mockup antiguo como si fuera el sitio vivo.

---

## Reglas estrictas

1. **Usar pnpm**, no npm.
2. **No cambiar el schema Prisma sin migración** en `backend/prisma/migrations/`. Si tocas `schema.prisma`, corre `pnpm exec prisma migrate dev --name descripcion` y sube la carpeta de migración.
3. **No romper** auth JWT, roles (`CLIENT` / `TECHNICIAN` / `ADMIN`), ni el flujo de citas.
4. **No tocar secretos** (`backend/.env`, `/root/.fresh-webhook-secret`) ni subirlos a git.
5. **Precios:** fuente única `frontend-react/src/lib/prices.js` y espejo `backend/src/common/prices.ts`. Cambiar ambos si ajustas tarifas.
6. **Paleta / marca:** identidad “frost” (azul hielo). No imponer temas purple/dark genéricos en el sitio público sin pedirlo.
7. **Contexto Venezuela:** cédula V/E, WhatsApp `+58`, precios USD→Bs vía tasa BCV (`GET /rate`), UI en español.
8. **Frontend y backend son independientes en deploys de feature:** si el prompt dice “no tocar frontend”, no lo toques.
9. **Puertos a Docker:** abrir siempre con `ufw`, no iptables suelto.
10. **Commits:** solo si el humano lo pide. Deploy automático ocurre al pushear `main`.

---

## Estructura

```
Fresh-Service-Digital/
├── frontend-react/          # SPA oficial
│   ├── src/pages/           # Home, Catalogo, Solicitud, paneles, auth…
│   ├── src/lib/api.js       # API_BASE + clientes HTTP
│   ├── src/lib/prices.js    # precios USD
│   └── serve.mjs            # static SPA en prod (:4100)
├── backend/
│   ├── prisma/schema.prisma
│   ├── prisma/migrations/
│   └── src/
│       ├── users/           # auth, CRUD usuarios (admin)
│       ├── appointments/    # citas + equipos
│       ├── rate/            # tasa BCV
│       ├── mail/            # SMTP
│       └── auth/            # JWT + Roles guards
├── deploy.sh / webhook.mjs
├── docker-compose.yml
├── docs/
├── Progresos/progreso.md    # estado HOY
└── History/historial.md     # historial por fases
```

---

## Modelo de datos (resumen)

- **User** — roles, cédula, verificación, reset token
- **Appointment** — estado, técnico, `priceUsd` congelado, notas; ubicación por cita (`latitude` / `longitude` / `address`) cuando exista
- **Equipment** — marca/modelo/BTU/falla ligados a la cita
- **Setting** — cache key/value (tasa BCV)

Un cliente puede tener **varias direcciones** → la ubicación geográfica va en **Appointment**, no en User.

---

## API (núcleo)

| Área | Endpoints clave |
|---|---|
| Auth | `POST /users/register`, `login`, `forgot-password`, `reset-password`, `GET /users/verify-link` |
| Users (ADMIN) | `GET /users`, `GET /users/technicians`, `PATCH/DELETE /users/:id` |
| Citas | `POST/GET /appointments`, `GET /appointments/client/:id`, `PATCH …/status|complete|assign` |
| Tasa | `GET /rate` (público) |

Guards: JWT Bearer; rutas admin/técnico con `@Roles`.

---

## Flujo de negocio

Cliente solicita servicio → `PENDING` + `priceUsd` → taller asigna técnico (`ASSIGNED` + correo) → técnico atiende → `COMPLETED` → suma en Ingresos del panel taller.

---

## Credenciales demo

| Rol | Usuario | Clave |
|---|---|---|
| Admin | `admin@freshservice.com` | `Admin1234` |
| Técnico | `carlos.tecnico@freshservice.com` | `Tecnico1234` |
| Cliente | su email | `Demo1234` |

---

## Fases

| Fase | Estado |
|---|---|
| 1 — Prototipo HTML/CSS | ✅ Superada (legacy) |
| 2 — Backend + React + producción | ✅ v1.0 defendida |
| v1.1 — Maps, chat, mail dominio, UX | 🔜 En curso |

---

## Qué consultar antes de cambiar código

1. `Progresos/progreso.md` — pendientes reales  
2. `History/historial.md` — decisiones ya tomadas  
3. Este `AGENTS.md` — reglas  
4. `Cambio-pnpm.md` — si instalas o buildeas  

Documentación pública del repo: `README.md` (debe reflejar este stack; no el mockup HTML).
