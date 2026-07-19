# 🐳 Tarea para un LLM: Dockerizar Fresh Service Digital (correr 100% offline)

> **Este documento es una tarea para un asistente de IA (LLM).** Léelo completo y ejecuta
> el paso a paso. Al final hay un checklist de entregables. Sé metódico y verifica cada paso.

---

## 1. La situación y el problema (contexto real)

- **Fresh Service Digital** es una plataforma web de **servicios de refrigeración a domicilio**
  (aires acondicionados) en San Juan de los Morros, Venezuela.
- Hoy el proyecto **corre en un VPS** (servidor en la nube) y se accede por internet en
  `https://fresh.pedroservicios.xyz`. El dueño edita el código desde su laptop por SSH.
- **El problema:** mañana el dueño presenta el proyecto (defensa/examen) desde su **laptop
  (Ubuntu LTS 26, con Docker instalado)**. Si **falla el internet**, pierde el acceso al VPS
  y no puede mostrar nada.
- **La solución (tu tarea):** empaquetar TODO el proyecto en **Docker** para que corra
  **100% local y offline** en la laptop con un solo comando (`docker compose up`), usando
  **los mismos datos** que hay en producción (ya se te entregó un respaldo).

## 2. ¿De qué se trata el proyecto? (para que entiendas qué dockerizas)

Arquitectura de 3 piezas:

```
Navegador ─► Frontend (React 19 + Vite + Tailwind, carpeta frontend-react/)
                 │ llama por HTTP a
                 ▼
            Backend (NestJS + Prisma, carpeta backend/)  ── puerto 4000
                 │
                 ▼
            PostgreSQL (base de datos)
```

- **Frontend** (`frontend-react/`): app React construida con Vite. Se sirve estática con un
  pequeño servidor Node ya incluido: `frontend-react/serve.mjs` (sirve la carpeta `dist/` en el
  puerto de la variable `PORT`, por defecto 4100).
- **Backend** (`backend/`): API NestJS. Usa Prisma para PostgreSQL. Arranca con `node dist/main`
  tras `npm run build`. Lee configuración de variables de entorno (ver `backend/.env`).
- **Base de datos**: PostgreSQL. **Ya tienes un respaldo completo** en
  **`docker/seed-data.sql`** (esquema + datos reales: clientes, solicitudes, técnicos,
  ingresos, tasa BCV cacheada). Debes cargarlo en el contenedor de Postgres al iniciar.

> Más contexto funcional: lee `docs/GUIA-CASOS-DE-USO.md` y `docs/MANUAL-USUARIO.md`.

### Cómo el frontend encuentra al backend (MUY IMPORTANTE)
En `frontend-react/src/lib/api.js` la URL del backend se decide así:
- Si el navegador está en `localhost`/`127.0.0.1` → usa **`http://localhost:4000`**.
- Si no → usa `https://api.pedroservicios.xyz`.

**Conclusión:** para que la versión Docker funcione, el usuario debe abrir el frontend en
`http://localhost:<puerto>` y el **backend debe quedar expuesto en el puerto 4000 del host**.
Así el navegador (en la laptop) llama a `localhost:4000` y llega al contenedor del backend.

## 3. Objetivo concreto

Crear los archivos Docker para levantar **db + backend + frontend** con `docker compose up`,
que funcione **sin internet**, con los datos del respaldo, accesible en `http://localhost:8080`.

## 4. Prerrequisitos (ya cumplidos en la laptop)
- Docker + Docker Compose instalados (Ubuntu). Verifica: `docker --version` y `docker compose version`.
- El repositorio clonado, incluyendo el archivo **`docker/seed-data.sql`**.

## 5. Archivos que debes CREAR

1. `backend/Dockerfile`
2. `backend/.dockerignore`
3. `frontend-react/Dockerfile`
4. `frontend-react/.dockerignore`
5. `docker-compose.yml` (en la raíz del proyecto)

> El respaldo `docker/seed-data.sql` **ya existe**, no lo generes.

---

## 6. PASO A PASO DETALLADO

### Paso 1 — `backend/Dockerfile`
Multi-stage: compila con Node 22 y ejecuta. Genera el cliente Prisma antes de compilar.
Contenido de referencia:

```dockerfile
# ---- build ----
FROM node:22-slim AS build
WORKDIR /app
# openssl es requerido por Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# ---- run ----
FROM node:22-slim AS run
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package*.json ./
EXPOSE 4000
# migrate deploy es no-op porque el dump ya trae el esquema; sirve de seguro
CMD npx prisma migrate deploy; node dist/main
```

### Paso 2 — `backend/.dockerignore`
```
node_modules
dist
.env
```

### Paso 3 — `frontend-react/Dockerfile`
Compila con Vite y sirve `dist/` con el `serve.mjs` que ya existe.

```dockerfile
# ---- build ----
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- run ----
FROM node:22-slim AS run
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4100
COPY --from=build /app/dist ./dist
COPY --from=build /app/serve.mjs ./serve.mjs
EXPOSE 4100
CMD ["node", "serve.mjs"]
```

> Nota: `serve.mjs` sirve la carpeta `dist/` y hace fallback a `index.html` (SPA). No necesita dependencias.

### Paso 4 — `frontend-react/.dockerignore`
```
node_modules
dist
```

### Paso 5 — `docker-compose.yml` (en la RAÍZ)
Tres servicios. Postgres carga el respaldo automáticamente en el primer arranque
(cualquier `.sql` dentro de `/docker-entrypoint-initdb.d/` se ejecuta al crear la BD vacía).

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
      # SIN variables SMTP → los correos se simulan en consola (offline OK)
      # BCV_API_URL no se define → sin internet usa la tasa cacheada del respaldo
    ports:
      - "4000:4000"
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
```

### Paso 6 — Levantar
Desde la raíz del proyecto:
```bash
docker compose up --build
```
Espera a que los 3 servicios estén arriba. Luego abre en el navegador:
**http://localhost:8080**

### Paso 7 — Verificar (pruebas)
1. La página carga en `http://localhost:8080`.
2. **Backend vivo:** `curl http://localhost:4000/rate` → devuelve un JSON con la tasa (la cacheada).
3. **Login admin:** `admin@freshservice.com` / `Admin1234` → entra al Panel del Taller y se ven
   clientes, solicitudes e ingresos (con datos reales del respaldo).
4. **Login cliente de demo** (ej. el que aparezca en el panel) / `Demo1234`.
5. Navegar catálogo, ver precios en Bs (a la tasa cacheada).

---

## 7. Comportamiento OFFLINE (esperado, NO son errores)
- **Correos:** sin variables SMTP, el backend **simula** los correos en la consola (log). No se
  envían de verdad, pero el flujo (registro/verificación/asignación) no se rompe.
- **Tasa BCV:** sin internet, la API del BCV no responde; el backend **usa la última tasa
  guardada** (viene en el respaldo, tabla `settings`). Los precios en Bs se calculan igual.
- **Verificación de correo en registro:** como no hay correo real, para demostrar cuentas nuevas
  conviene usar las cuentas ya existentes del respaldo (ya verificadas).

## 8. Errores comunes y cómo evitarlos
- **Prisma / openssl:** si el backend falla con error de Prisma, es por `openssl` faltante en la
  imagen. El Dockerfile ya lo instala (`apt-get install openssl`). No lo quites.
- **El frontend no encuentra el backend:** confirma que el backend está publicado en el puerto
  **4000 del host** y que abres el frontend en **localhost** (no una IP). La detección de `api.js`
  depende de eso.
- **El respaldo no se cargó:** el `.sql` solo se ejecuta cuando el **volumen de datos está vacío**
  (primer arranque). Si ya arrancaste antes, borra el volumen: `docker compose down -v` y vuelve
  a `docker compose up --build`.
- **Versión de Postgres:** el respaldo se generó con un `pg_dump` reciente; usa `postgres:17-alpine`
  (como en el compose) para evitar incompatibilidades. Si aún falla la carga, prueba `postgres:18-alpine`.
- **Puertos ocupados:** si 8080/4000/5432 están en uso, cámbialos en `docker-compose.yml`
  (pero mantén el backend en `4000:4000` por la razón del Paso "Cómo el frontend encuentra al backend").

## 9. Checklist de entregables
- [ ] `backend/Dockerfile` creado y compila.
- [ ] `frontend-react/Dockerfile` creado y compila.
- [ ] `docker-compose.yml` en la raíz con los 3 servicios.
- [ ] `.dockerignore` en backend y frontend.
- [ ] `docker compose up --build` levanta los 3 servicios sin errores.
- [ ] `http://localhost:8080` carga la página.
- [ ] `curl http://localhost:4000/rate` responde JSON.
- [ ] Login admin funciona y muestra los datos del respaldo.
- [ ] Documentaste en un `README-DOCKER.md` los 2 comandos para levantar/apagar
      (`docker compose up --build` / `docker compose down`).

## 10. Notas para el revisor humano
Cuando termines, avisa. El LLM principal (supervisor) revisará:
- Que los Dockerfiles no incluyan secretos reales.
- Que el frontend efectivamente hable con `localhost:4000`.
- Que el respaldo cargue y el login funcione.
- Sugerirá mejoras (optimización de imágenes, healthchecks, etc.).
