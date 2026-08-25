# ACTUALIZAR: Docker Compose + Dockerfiles + seed para uso offline/portable

## PROBLEMA
Los archivos Docker del proyecto se crearon en julio 2026 para la v1.0 (defensa universitaria). Desde entonces se agregaron: chatbot Copito (DeepSeek + Telegram), chat en vivo (Socket.IO), carrusel dinámico, ticker promocional, tipos de equipo con imágenes, mapas Leaflet, PWA, y 22 migraciones Prisma. El `seed-data.sql` tiene datos de julio y le faltan 10+ tablas nuevas.

## OBJETIVO
1. Los 3 archivos Docker (`docker-compose.yml`, `backend/Dockerfile`, `frontend-react/Dockerfile`) quedan actualizados para levantar el proyecto completo offline
2. El `docker/seed-data.sql` se regenera con TODOS los datos actuales de la DB de producción
3. Se puede hacer `docker compose up --build` en cualquier máquina con Docker y tener el proyecto funcionando igual que en producción (excepto correos y Telegram que son opcionales)

---

## CAMBIO 1 — Regenerar seed-data.sql desde la DB de producción

Ejecutar en el VPS:
```bash
pg_dump -U freshservice -d freshservice \
  --no-owner --no-privileges --no-comments \
  --clean --if-exists \
  > /root/Fresh-Service-Digital/docker/seed-data.sql
```

Esto incluye TODAS las tablas actuales: users, appointments, equipments, services, service_category_options, equipment_type_options, site_images, carousel_images, ticker_messages, chat_conversations, chat_messages, chat_leads, chat_settings, settings, _prisma_migrations.

**Importante:** revisar que el archivo NO contenga credenciales de producción sensibles (las passwords de usuarios están hasheadas con bcrypt, eso está bien). Si hay tokens o API keys en alguna tabla (como chat_settings), reemplazarlos con valores demo.

---

## CAMBIO 2 — backend/Dockerfile

### Archivo: `backend/Dockerfile`

Reemplazar el contenido completo por:

```dockerfile
# ---- build ----
FROM node:22-slim AS build
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@11.5.2 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm exec prisma generate
RUN pnpm run build

# ---- run ----
FROM node:22-slim AS run
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./

# Crear directorios de uploads (vacíos, se llenan desde el panel admin)
RUN mkdir -p uploads/site-images uploads/equipment-types uploads/carousel uploads/chat-images

EXPOSE 4000
CMD ./node_modules/.bin/prisma migrate deploy && node dist/main
```

**Cambios vs el anterior:**
- Se crean los 4 directorios de uploads que `main.ts` espera
- El CMD sigue con `migrate deploy` (aplica migraciones pendientes sobre el dump)

---

## CAMBIO 3 — frontend-react/Dockerfile

### Archivo: `frontend-react/Dockerfile`

Reemplazar el contenido completo por:

```dockerfile
# ---- build ----
FROM node:22-slim AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.5.2 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

# ---- run ----
FROM node:22-slim AS run
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4100
COPY --from=build /app/dist ./dist
COPY --from=build /app/serve.mjs ./serve.mjs
COPY --from=build /app/public/manifest.json ./dist/manifest.json
COPY --from=build /app/public/sw.js ./dist/sw.js
EXPOSE 4100
CMD ["node", "serve.mjs"]
```

**Cambios vs el anterior:**
- Se copian `manifest.json` y `sw.js` al dist para que la PWA funcione (Vite no los copia automáticamente si no están referenciados)
- Verificar si Vite ya los copia a `dist/` durante el build. Si sí, quitar las 2 líneas de COPY extra

---

## CAMBIO 4 — docker-compose.yml

### Archivo: `docker-compose.yml` (raíz del proyecto)

Reemplazar el contenido completo por:

```yaml
services:
  db:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: freshservice
      POSTGRES_PASSWORD: freshservice
      POSTGRES_DB: freshservice
    volumes:
      - ./docker/seed-data.sql:/docker-entrypoint-initdb.d/seed-data.sql:ro
      - fresh_db:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U freshservice"]
      interval: 5s
      timeout: 5s
      retries: 10

  backend:
    build: ./backend
    environment:
      DATABASE_URL: "postgresql://freshservice:freshservice@db:5432/freshservice?schema=public"
      JWT_SECRET: "clave-demo-local-fresh-service"
      JWT_EXPIRES: "7d"
      PORT: "4000"
      PUBLIC_API_URL: "http://localhost:4000"
      FRONTEND_URL: "http://localhost:8080"
      # Chatbot Copito — modo demo (sin API key real, el chat IA no responde pero el resto funciona)
      # Para habilitar Copito: poner tu API key de DeepSeek aquí
      CHATBOT_LLM_BASE_URL: "https://api.deepseek.com"
      CHATBOT_LLM_API_KEY: ""
      CHATBOT_LLM_MODEL: "deepseek-v4-flash"
      CHATBOT_MONTHLY_BUDGET_USD: "5"
      CHATBOT_MAX_MESSAGES_PER_CONVERSATION: "10"
      CHATBOT_RATE_LIMIT_DAILY: "60"
      # Telegram — vacío = sin notificaciones (no rompe nada)
      CHATBOT_TELEGRAM_BOT_TOKEN: ""
      CHATBOT_TELEGRAM_CHAT_ID: ""
      # SMTP — vacío = correos se simulan en consola (offline OK)
      # SMTP_HOST: "smtp.resend.com"
      # SMTP_PORT: "465"
      # SMTP_SECURE: "true"
      # SMTP_USER: "resend"
      # SMTP_PASS: ""
      # SMTP_FROM: "Fresh Service Digital <noreply@localhost>"
    ports:
      - "4000:4000"
    volumes:
      - backend_uploads:/app/uploads
    depends_on:
      db:
        condition: service_healthy

  frontend:
    build: ./frontend-react
    environment:
      PORT: "4100"
    ports:
      - "8080:4100"
    depends_on:
      - backend

volumes:
  fresh_db:
  backend_uploads:
```

**Cambios vs el anterior:**
- Variables de entorno del chatbot Copito (vacías = modo demo, no rompe)
- Variables de Telegram (vacías = sin notificaciones)
- Variables SMTP comentadas (offline = consola)
- Volumen `backend_uploads` persistente para fotos subidas desde el panel
- Sin credenciales reales

---

## CAMBIO 5 — Verificar que el frontend apunte al backend correcto en Docker

### Archivo: `frontend-react/src/lib/api.js`

Buscar donde se define `API_BASE` o la URL base del backend. Verificar que funcione con Docker:

En Docker, el frontend se sirve en `localhost:8080` y el backend en `localhost:4000`. El navegador del usuario hace las peticiones desde su máquina, así que `API_BASE` debe apuntar a `http://localhost:4000` cuando no hay variable de entorno de producción.

**Verificar** que la lógica actual ya maneja esto. Normalmente es algo como:
```javascript
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
```

Si está hardcodeado a `https://api.pedroservicios.xyz`, hay que cambiarlo para que use una variable de entorno con fallback a localhost. **Revisar** antes de cambiar — puede que ya funcione.

---

## CAMBIO 6 — Actualizar README de Docker (si existe)

Si hay un archivo `docker/README.md` o instrucciones Docker en algún README, actualizar con:

```markdown
## Levantar con Docker (offline / portable)

### Requisitos
- Docker Desktop o Docker Engine + Docker Compose

### Primera vez (con internet)
docker compose up --build

### Siguientes veces (offline)
docker compose up

### Acceder
- **Sitio web:** http://localhost:8080
- **API:** http://localhost:4000
- **Login admin:** admin@freshservice.com / Admin1234
- **Login técnico:** carlos.tecnico@freshservice.com / Tecnico1234

### Notas
- El chatbot Copito necesita API key de DeepSeek para responder (sin key, el chat no responde pero no rompe nada)
- Los correos se simulan en consola (ver logs del backend: `docker compose logs backend`)
- Las fotos subidas desde el panel admin se guardan en el volumen `backend_uploads`
- Para resetear la DB: `docker compose down -v` y volver a `up --build`
```

---

## Build y verificación

```bash
# Regenerar seed
pg_dump -U freshservice -d freshservice --no-owner --no-privileges --no-comments --clean --if-exists > docker/seed-data.sql

# Probar (requiere internet la primera vez para descargar imágenes)
docker compose down -v
docker compose up --build

# Verificar
# 1. http://localhost:8080 — landing con carrusel, cards dinámicas, ticker
# 2. Login admin → Panel Taller → todas las vistas funcionan
# 3. Catálogo → acordeones con fotos por tipo
# 4. Chat Copito → se abre (si no hay API key, no responde pero no crashea)
```

## NO TOCAR
- `deploy.sh` (es para el VPS, no para Docker)
- `webhook.mjs` (no se usa en Docker)
- Backend `.env` del VPS (gitignored)
- Las fotos en `backend/uploads/` del VPS
- Código fuente de ningún componente (esto es solo infraestructura Docker)
