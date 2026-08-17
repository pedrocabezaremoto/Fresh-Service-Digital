# ❄ Fresh Service Digital

> Plataforma web de servicios de refrigeración y climatización a domicilio — **Versión 1.0** (defendida 2026-07-20)

**Producción:** [https://fresh.pedroservicios.xyz](https://fresh.pedroservicios.xyz)  
**API:** [https://api.pedroservicios.xyz](https://api.pedroservicios.xyz)  
**Zona:** San Juan de los Morros, estado Guárico, Venezuela

---

## Descripción

Fresh Service Digital conecta clientes, taller (admin) y técnicos para solicitar, asignar y completar servicios de aires acondicionados a domicilio. Incluye precios en USD convertidos a Bs (tasa BCV), proforma imprimible, correos reales y paneles por rol.

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + Vite 6 + Tailwind v4 (`frontend-react/`) |
| Backend | NestJS 10 + Prisma 6 + JWT/bcrypt (`backend/`) |
| Base de datos | PostgreSQL |
| Paquetes | **pnpm** (no npm) |
| Proceso | pm2 (`fresh-frontend` :4100, `fresh-service` :4000, `fresh-webhook` :4200) |
| Proxy | Traefik + Let's Encrypt |
| Deploy | push a `main` → webhook HMAC → `./deploy.sh` |

El HTML/CSS legacy (`index.html`, `views/`) es solo referencia histórica. El producto oficial es `frontend-react/`.

---

## Estructura

```
Fresh-Service-Digital/
├── frontend-react/     # SPA React (sitio oficial)
├── backend/            # API NestJS + Prisma
├── docker/             # seed SQL offline
├── docs/               # manual, casos de uso, guía Docker
├── deploy.sh           # deploy seguro (build antes de reiniciar)
├── webhook.mjs         # deploy automático desde GitHub
├── docker-compose.yml  # plan B offline (db + api + front)
├── Progresos/          # estado actual
└── History/            # historial de fases
```

---

## Roles y rutas

| Rol | Panel | Credencial demo |
|---|---|---|
| ADMIN (taller) | `/admin` | `admin@freshservice.com` / `Admin1234` |
| TECHNICIAN | `/tecnico` | `carlos.tecnico@freshservice.com` / `Tecnico1234` |
| CLIENT | `/panel` | su email / `Demo1234` |

---

## Desarrollo local

```bash
# Backend
cd backend && pnpm install --frozen-lockfile
pnpm exec prisma migrate deploy
pnpm run start:prod   # o start:dev

# Frontend
cd frontend-react && pnpm install --frozen-lockfile
pnpm run dev
```

**Docker offline** (tras un build previo con internet): ver `README-DOCKER.md`.

```bash
docker compose up
# Front http://localhost:8080 · API http://localhost:4000
```

---

## Deploy

```bash
# Automático: git push a main
# Manual:
./deploy.sh
```

Regla de DB: al cambiar `schema.prisma`, generar migración con `pnpm exec prisma migrate dev --name ...` y subir `prisma/migrations/`. Nunca cambiar el schema sin migración.

---

## Documentación

- `Progresos/progreso.md` — estado actual y pendientes
- `History/historial.md` — historial técnico por fases
- `docs/MANUAL-USUARIO.md` — uso del sistema
- `docs/GUIA-CASOS-DE-USO.md` — arquitectura y endpoints
- `AGENTS.md` — reglas para agentes de IA
- `Cambio-pnpm.md` — guía pnpm / supply-chain

---

## Roadmap v1.1 (abierto)

- Deliverability con dominio propio (SPF/DKIM/DMARC)
- Chat en tiempo real cliente ↔ taller
- Ubicación del cliente con Google Maps (ubicación por cita)
- Mejoras de Ingresos / UX

---

## Autor

Plataforma piloto para taller de refrigeración en San Juan de los Morros.  
© 2026 Fresh Service Digital
