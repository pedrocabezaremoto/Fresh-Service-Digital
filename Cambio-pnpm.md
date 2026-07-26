# 🔒 Migración npm → pnpm — Guía paso a paso para el LLM ejecutor

> **Autor de esta guía:** Claude (rol = **REVISOR**, NO ejecutor).
> **Ejecutor:** otro LLM externo. Este documento es tu orden de trabajo.
> **Fecha:** 2026-07-26
> **Motivo:** seguridad de cadena de suministro. npm sufrió un incidente de compromiso
> (paquetes hackeados). Se migra a **pnpm** porque **bloquea por defecto los scripts
> `postinstall`/`preinstall`** (que es justo por donde entran los ataques de supply-chain),
> usa store con verificación de integridad, y evita dependencias fantasma.

---

## 👥 REPARTO DE TRABAJO (leer primero)

- **Tú (LLM ejecutor):** editas **solo archivos/código** en el VPS (`/root/Fresh-Service-Digital`)
  y corres los comandos de build/verificación. **NO usas git EN ABSOLUTO** — nada de `branch`,
  `commit`, `push`, `checkout`, `merge`, `stash`. Cero.
- **El revisor (Claude):** revisa cada fase y es **el único que toca git**. Él commitea y hace
  `push` al repo de respaldo `Fresh-Service-Digital-respaldo`. Producción (`origin` + webhook)
  queda intacta hasta el final.
- Por eso, en este documento, **ignora todos los pasos de git**: son responsabilidad del revisor.
  Tú solo dejas los archivos correctos en disco y reportas.

## 🚨 REGLAS DE ORO (leer ANTES de tocar nada)

1. **NO uses git.** Ni branch, ni commit, ni push, ni checkout. Solo editas archivos en el disco
   del VPS. El versionado y los push al repo de respaldo los hace el revisor.
2. **Pausar el webhook** antes de empezar: `pm2 stop fresh-webhook`. El revisor lo reactiva al final.
3. **NO tocar la base de datos.** Esta migración es solo de gestor de paquetes. No hay cambios
   de `schema.prisma` ni migraciones Prisma nuevas.
4. **NO tocar `pm2`, `webhook.mjs`, `serve.mjs`.** pm2 arranca los procesos con `node` directo,
   no con npm. Son inmunes al cambio de gestor.
5. **NO cambiar versiones de dependencias.** Mismo `package.json` (rangos con `^` intactos).
   Solo se suma la línea `packageManager`, se cambian los lockfiles, `deploy.sh` y los Dockerfiles.
6. **Mantener el whitelist de builds MÍNIMO.** Es el corazón de la seguridad de pnpm: solo se
   aprueban scripts de build de paquetes de confianza (Prisma, esbuild). Todo lo demás se **ignora
   explícitamente** (ver §3.3), nunca se aprueba a ciegas.
7. **Verificar CADA build con los comandos REALES** (`pnpm install --frozen-lockfile` +
   `pnpm run build`), NO con el binario directo (`nest build`/`vite build`). Ver §8.

**Herramientas ya presentes en el VPS (no instalar de nuevo):**
- Node `v22.23.0`, pnpm `11.5.2` (en `/root/.local/share/pnpm/bin/pnpm`).

---

## 🧩 MODO DE EJECUCIÓN: POR FASES (con revisión entre cada una)

Esta migración se hace en **4 fases**. **Al terminar CADA fase, DETENTE, reporta y espera
revisión** antes de empezar la siguiente. No corras dos fases seguidas.

| Fase | Alcance (lo que hace el ejecutor) | Secciones |
|---|---|---|
| **1** | Pausar webhook + migrar **backend** + verificar con comandos reales | §2 y §3 |
| **2** | Migrar **frontend** + verificar | §4 |
| **3** | Reescribir **`deploy.sh` + Dockerfiles + docs** | §5, §6, §7 |
| **4** | **Verificación Docker end-to-end** (el deploy a producción lo hace el revisor) | §8 |

Al cerrar cada fase, reporta: comandos corridos, salida relevante, y las casillas del checklist
que apliquen a esa fase. **Sin git.** Si algo falla, PARA y avisa; no sigas a la fase siguiente.
El revisor commitea y hace push al repo de respaldo entre fases.

---

## 1. Estado actual (mapa del terreno)

- **Dos subproyectos independientes** (NO hay workspace raíz, NO hay `package.json` en la raíz):
  - `backend/` → NestJS 10 + Prisma 6 + Postgres. Build: `nest build` → `dist/main.js`. Run: `node dist/main`.
  - `frontend-react/` → React 19 + Vite 6 + Tailwind 4. Build: `vite build` → `dist/`. Run: `node serve.mjs`.
- **Lockfiles mezclados** (hay que limpiar):
  - `backend/package-lock.json` (npm, actual) + `backend/pnpm-lock.yaml` (viejo, obsoleto).
  - `frontend-react/package-lock.json` (npm, actual) + `frontend-react/pnpm-lock.yaml` (viejo, obsoleto).
- **`pnpm-workspace.yaml`** en cada sub con texto placeholder inválido (`set this to true or false`).
- **Dónde se usa el gestor de paquetes (lo único a reescribir):**
  1. `deploy.sh` — `npm install` (×2), `npm run build` (×2), `npx prisma ...` (×varios). **Ruta de producción.**
  2. `backend/Dockerfile` — `npm ci`, `npx prisma generate`, `npm run build`. **Plan B offline (defensa).**
  3. `frontend-react/Dockerfile` — `npm ci`, `npm run build`.
- **Intocables** (no usan el gestor): `webhook.mjs`, `serve.mjs`, todos los `pm2` (interpretan con `node`).

---

## 2. Red de seguridad (hacer esto PRIMERO)

> **Recordatorio:** tú NO usas git. El branch, el commit y el push los maneja el revisor. Tú solo
> pausas el webhook y respaldas los lockfiles a un archivo aparte.

```bash
cd /root/Fresh-Service-Digital

# 2.1 Pausar el deploy automático (imprescindible)
pm2 stop fresh-webhook

# 2.2 Respaldar los lockfiles npm por si hay que volver atrás
cp backend/package-lock.json /root/backup-backend-package-lock.json
cp frontend-react/package-lock.json /root/backup-frontend-package-lock.json
```

---

## 3. Backend — migración a pnpm

```bash
cd /root/Fresh-Service-Digital/backend

# 3.1 Borrar AMBOS lockfiles viejos (el npm actual y el pnpm obsoleto).
#     Regeneramos un pnpm-lock.yaml limpio desde package.json → resolución fresca,
#     sin arrastrar el lock npm potencialmente contaminado.
rm -f package-lock.json pnpm-lock.yaml

# 3.2 Borrar node_modules viejo (estaba resuelto por npm)
rm -rf node_modules
```

**3.3 Arreglar `backend/pnpm-workspace.yaml`.** Reemplazar **TODO** su contenido por exactamente
esto. Esta es la configuración **verificada y estable en pnpm 11.5.2** (borrar cualquier placeholder
`set this to true or false`):

```yaml
# APROBADOS a compilar: Prisma necesita build (compila su engine).
onlyBuiltDependencies:
  - '@prisma/client'
  - '@prisma/engines'
  - prisma
# IGNORADO: @nestjs/core solo imprime un mensaje de donación en postinstall (seguro ignorarlo).
ignoredBuiltDependencies:
  - '@nestjs/core'
# OBLIGATORIO en pnpm 11.5.2: el mapa de aprobación con BOOLEANOS explícitos (true/false).
# Sin este mapa, `pnpm install --frozen-lockfile` ABORTA con [ERR_PNPM_IGNORED_BUILDS] — ni
# siquiera respeta onlyBuiltDependencies por sí solo. NUNCA dejes valores tipo "set this to...".
allowBuilds:
  '@prisma/client': true
  '@prisma/engines': true
  prisma: true
  '@nestjs/core': false
```

> ⚠️ **CRÍTICO — comprobado empíricamente en este VPS:**
> - En pnpm 11.5.2, `onlyBuiltDependencies` por sí solo NO basta: hay que poner el mapa `allowBuilds`
>   con booleanos (Prisma `true`, @nestjs/core `false`). Si el archivo tiene `allowBuilds` con el
>   placeholder `set this to true or false`, pnpm falla — reemplaza esos por `true`/`false`.
> - Valida SIEMPRE con los comandos REALES de producción, NO con `./node_modules/.bin/nest build`
>   (ese salta el chequeo de pnpm y da un falso "OK"). Ambos deben salir **exit 0**:
> ```bash
> pnpm install --frozen-lockfile     # debe salir exit 0, sin ERR_PNPM_IGNORED_BUILDS
> pnpm run build                     # debe compilar limpio
> ```
> - Si `pnpm install --frozen-lockfile` reporta `[ERR_PNPM_IGNORED_BUILDS] ... <paquete>`, agrega ese
>   `<paquete>` al mapa `allowBuilds` con `true` (si de verdad necesita compilar) o `false` (si es
>   seguro ignorarlo). `nest build` incremental puede NO actualizar la fecha de `dist/` si el código
>   no cambió: eso es normal, no significa que no compiló.

**3.4 Añadir el pin de gestor a `backend/package.json`.** Agregar esta línea de nivel superior
(junto a `"name"`, `"version"`, etc.):

```json
"packageManager": "pnpm@11.5.2"
```

**3.5 Instalar y construir:**

```bash
# Instala (incluye devDependencies: se necesitan @nestjs/cli y prisma para el build)
pnpm install

# Si pnpm avisa que hay scripts de build ignorados, confirma que sean SOLO Prisma:
pnpm approve-builds        # elige @prisma/client, @prisma/engines, prisma — NADA más

# Generar cliente Prisma y compilar
pnpm exec prisma generate
pnpm run build             # debe producir dist/main.js
```

**3.6 Comprobación rápida del backend:**

```bash
ls dist/main.js            # debe existir
# Arranque en seco (Ctrl+C tras ver que levanta y conecta a la DB):
node dist/main
```

---

## 4. Frontend — migración a pnpm

```bash
cd /root/Fresh-Service-Digital/frontend-react

rm -f package-lock.json pnpm-lock.yaml
rm -rf node_modules
```

**4.1 Arreglar `frontend-react/pnpm-workspace.yaml`.** Reemplazar **TODO** su contenido por
(borrar cualquier bloque `allowBuilds:` con placeholders):

```yaml
# esbuild (usado por Vite) necesita compilar su binario nativo. Único build aprobado aquí.
onlyBuiltDependencies:
  - esbuild
```

> ⚠️ Igual que en el backend: valida con `pnpm install --frozen-lockfile` (exit 0) y `pnpm run build`.
> Si `pnpm install --frozen-lockfile` da `[ERR_PNPM_IGNORED_BUILDS] ... <paquete>`, agrega ese
> `<paquete>` a un bloque `ignoredBuiltDependencies:` (mismo formato que el backend) y reintenta.

**4.2 Añadir a `frontend-react/package.json`** (nivel superior):

```json
"packageManager": "pnpm@11.5.2"
```

**4.3 Instalar y construir:**

```bash
pnpm install
pnpm approve-builds        # confirmar SOLO esbuild
pnpm run build             # debe producir dist/ con index.html + assets
```

**4.4 Comprobación:**

```bash
ls dist/index.html         # debe existir
PORT=4100 node serve.mjs   # abre http://localhost:4100, Ctrl+C al confirmar
```

---

## 5. `deploy.sh` — reescribir los comandos del gestor

Editar `deploy.sh` y cambiar **solo** estas invocaciones (respetar el resto del script tal cual):

| Paso (aprox.) | ANTES (npm) | DESPUÉS (pnpm) |
|---|---|---|
| 2 (backend install) | `npm install --no-audit --no-fund` | `pnpm install --frozen-lockfile` |
| 2 (migraciones) | `npx prisma migrate deploy` | `pnpm exec prisma migrate deploy` |
| 2 (status detector) | `npx prisma migrate status` | `pnpm exec prisma migrate status` |
| 2 (generate) | `npx prisma generate` | `pnpm exec prisma generate` |
| 3 (frontend install) | `npm install --no-audit --no-fund` | `pnpm install --frozen-lockfile` |
| 3 (frontend build) | `npm run build` | `pnpm run build` |
| 4 (backend build) | `npm run build` | `pnpm run build` |

**Notas importantes:**
- `--frozen-lockfile` exige que el `pnpm-lock.yaml` esté **commiteado y en sync** con `package.json`.
  Es lo correcto para producción (build reproducible, no re-resuelve). Como acabas de generar el
  lock en §3/§4 y lo vas a commitear, encajará. Si `deploy.sh` fallara con "lockfile out of sync",
  corre `pnpm install` (sin frozen) en ese sub, recommitea el lock, y reintenta.
- **NO** existen equivalentes de `--no-audit --no-fund` en pnpm; simplemente se omiten.
- El resto de `deploy.sh` (git pull, detector de drift Prisma, restart pm2, health checks, repo
  espejo) **no se toca**. `pm2 restart` sigue igual: reinicia procesos `node`, ajeno al gestor.

---

## 6. Dockerfiles — reescribir (plan B offline de la defensa)

### 6.1 `backend/Dockerfile`

Reemplazar el **build stage** por:

```dockerfile
# ---- build ----
FROM node:22-slim AS build
WORKDIR /app
# openssl es requerido por Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@11.5.2 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm exec prisma generate
RUN pnpm run build
```

En el **run stage**, cambiar dos cosas:
- `COPY --from=build /app/package*.json ./`  →  `COPY --from=build /app/package.json ./`
- El `CMD` de `npx prisma migrate deploy` a usar el binario local (así el run stage NO necesita pnpm):

```dockerfile
CMD ./node_modules/.bin/prisma migrate deploy; node dist/main
```

Mantener igual: `COPY --from=build /app/node_modules ./node_modules`, `COPY --from=build /app/dist ./dist`,
`COPY --from=build /app/prisma ./prisma`, `EXPOSE 4000`.

### 6.2 `frontend-react/Dockerfile`

Reemplazar el **build stage** por:

```dockerfile
# ---- build ----
FROM node:22-slim AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.5.2 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build
```

El **run stage** del frontend **NO cambia** (solo copia `dist/` + `serve.mjs` y corre `node serve.mjs`,
sin `node_modules`).

### 6.3 ⚠️ Gotcha de Docker con pnpm (solo backend)

pnpm usa un `node_modules` con symlinks a un store. El backend copia `node_modules` entre stages
(`COPY --from=build`). Normalmente funciona porque los symlinks internos de `.pnpm/` son relativos.
**Si al correr el contenedor del backend sale `Cannot find module ...`**, aplica el fallback: crear
`backend/.npmrc` con una sola línea y reconstruir:

```
node-linker=hoisted
```

Eso hace que `node_modules` quede plano (estilo npm), 100% seguro de copiar entre stages. La defensa
de seguridad (bloqueo de `postinstall`) **se mantiene** con `hoisted`. Úsalo solo si hace falta.

---

## 7. Documentación — actualizar referencias npm → pnpm

Actualizar los comandos `npm`/`npx` por sus equivalentes pnpm en:
- `README-DOCKER.md`
- `docs/crear-docker.md`
- `docs/ESTUDIO-FRONTEND-DEFENSA.md` (si menciona comandos de build)

> **NO** toques `AGENTS.md`, `Progresos/progreso.md` ni `History/historial.md`: esos los mantiene
> el **revisor** (Claude). En `AGENTS.md` y `progreso.md` ya quedó anotada esta migración.

Equivalencias rápidas:

| npm | pnpm |
|---|---|
| `npm install` | `pnpm install` |
| `npm ci` | `pnpm install --frozen-lockfile` |
| `npm run <script>` | `pnpm run <script>` (o `pnpm <script>`) |
| `npx <bin>` | `pnpm exec <bin>` (local) — **evita `pnpm dlx`** salvo que quieras descargar remoto |
| `npm run build` | `pnpm run build` |

---

## 8. ✅ Verificación OBLIGATORIA (antes de entregar para revisión)

Marca cada casilla. Si alguna falla, **NO reportes la fase como lista**; arréglalo primero.
El revisor no commiteará nada que no pase estas casillas.

- [ ] `backend/`: existe solo `pnpm-lock.yaml` (NO `package-lock.json`).
- [ ] `frontend-react/`: existe solo `pnpm-lock.yaml` (NO `package-lock.json`).
- [ ] `pnpm-workspace.yaml` de ambos = contenido limpio (sin `set this to true or false`).
- [ ] `cd backend && pnpm install --frozen-lockfile` → OK sin errores.
- [ ] `cd backend && pnpm run build` → `dist/main.js` presente.
- [ ] `cd backend && node dist/main` → levanta y conecta a la DB (probar login admin si es posible).
- [ ] `cd frontend-react && pnpm install --frozen-lockfile` → OK.
- [ ] `cd frontend-react && pnpm run build` → `dist/index.html` presente.
- [ ] `PORT=4100 node frontend-react/serve.mjs` → sirve la web local.
- [ ] `grep -rnE '\b(npm|npx)\b' deploy.sh backend/Dockerfile frontend-react/Dockerfile` → **0 resultados**.
- [ ] **Docker (plan B):** `docker compose up --build` → los 3 servicios (db/backend/frontend)
      arrancan; `http://localhost:8080` carga y el login admin funciona. Luego `docker compose down`.
- [ ] `pnpm audit` en ambos subproyectos (revisar que no aparezcan vulnerabilidades críticas nuevas).

---

## 9. Puesta en producción — ⚠️ SOLO EL REVISOR (el ejecutor NO hace nada de esto)

> Esta sección NO la ejecuta el LLM. Es la referencia del **revisor** (Claude), que controla git y
> el deploy. El ejecutor termina en §8 (verificación) y entrega; aquí ya no participa.

Durante las fases, el revisor commitea y empuja al **repo de respaldo** (no a `origin`, para no
disparar el deploy de producción):

```bash
cd /root/Fresh-Service-Digital
git add -A
git commit -m "chore(pnpm): fase N — <descripcion>"
git push backup HEAD          # 'backup' = git@github.com:pedrocabezaremoto/Fresh-Service-Digital-respaldo.git
```

Solo al final, con TODO verificado (incluido Docker §8), el revisor pasa a producción:

```bash
# Deploy real a mano con la nueva deploy.sh (si falla, el sitio viejo sigue vivo: deploy.sh aborta seguro)
./deploy.sh                   # debe terminar en "✅ DEPLOY COMPLETO"
# Recién entonces: reactivar webhook y subir a origin (dispara el deploy automático, ya validado)
pm2 start fresh-webhook && pm2 save
git push origin main
# Verificar en vivo (Ctrl+Shift+R): https://fresh.pedroservicios.xyz  y  https://api.pedroservicios.xyz
```

---

## 10. Rollback (si algo se rompe)

```bash
cd /root/Fresh-Service-Digital
# Volver al commit sano anotado en §2.1:
git checkout main
git reset --hard <HASH_ANOTADO_EN_2.1>

# Restaurar dependencias con npm (los locks npm respaldados):
cd backend && rm -rf node_modules pnpm-lock.yaml && cp /root/backup-backend-package-lock.json package-lock.json && npm ci
cd ../frontend-react && rm -rf node_modules pnpm-lock.yaml && cp /root/backup-frontend-package-lock.json package-lock.json && npm ci

# Redesplegar el estado bueno y reactivar webhook
cd /root/Fresh-Service-Digital && ./deploy.sh
pm2 start fresh-webhook && pm2 save
```

---

## 11. 🛡️ Seguridad extra (opcional, muy recomendado dado el motivo de esta migración)

Añadir a **cada** `pnpm-workspace.yaml` (backend y frontend) para no instalar paquetes recién
publicados (ventana típica de los ataques de supply-chain — se detectan en horas):

```yaml
# No instalar versiones publicadas hace menos de 1440 minutos (24 h). Defensa anti-typosquat/hijack.
minimumReleaseAge: 1440
```

- Correr `pnpm audit` periódicamente.
- Mantener `onlyBuiltDependencies` lo más corto posible (ya está: Prisma y esbuild).
- **No** usar `dangerouslyAllowAllBuilds` ni `pnpm install --unsafe-perm`. Jamás.

---

## 12. Qué revisará el revisor (Claude) cuando avises que terminaste

1. Que NO queden `package-lock.json` en ningún lado y sí `pnpm-lock.yaml` limpios.
2. Que `pnpm-workspace.yaml` tengan whitelist mínimo y sin placeholders.
3. Que `deploy.sh` y ambos `Dockerfile` no tengan ni un `npm`/`npx` suelto.
4. Que `pm2`, `webhook.mjs`, `serve.mjs`, `schema.prisma` y las migraciones **no** hayan cambiado.
5. Que el `git diff` sea coherente (solo gestor/lockfiles/build), sin cambios de dependencias ni de lógica.
6. Que el sitio en vivo (frontend + API) responda y el login admin funcione.

**Avísame cuando termines y te reviso todo esto punto por punto.**
