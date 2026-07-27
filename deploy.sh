#!/usr/bin/env bash
#
# deploy.sh — Despliegue seguro de Fresh Service Digital en el VPS
# Flujo: git pull -> migraciones DB -> build frontend -> build backend -> restart pm2
#
# Filosofía de seguridad:
#   - Se construye TODO antes de reiniciar. Si un build falla, el sitio viejo
#     sigue en vivo y NO se reinicia nada roto.
#   - Detecta si alguien cambió el schema.prisma SIN crear migración (avisa fuerte).
#   - Si cualquier paso crítico falla, aborta y explica qué pasó.
#
# Uso:  ./deploy.sh
#
set -uo pipefail

# ---------- Configuración ----------
REPO_DIR="/root/Fresh-Service-Digital"
FRONT_DIR="$REPO_DIR/frontend-react"
BACK_DIR="$REPO_DIR/backend"
FRONT_PM2="fresh-frontend"
BACK_PM2="fresh-service"
BACK_PORT=4000
FRONT_PORT=4100
BRANCH="main"

# ---------- Colores / helpers ----------
RED=$'\e[31m'; GRN=$'\e[32m'; YLW=$'\e[33m'; BLU=$'\e[34m'; BLD=$'\e[1m'; RST=$'\e[0m'
step()  { echo -e "\n${BLU}${BLD}==> $*${RST}"; }
ok()    { echo -e "${GRN}✔ $*${RST}"; }
warn()  { echo -e "${YLW}⚠ $*${RST}"; }
die()   { echo -e "\n${RED}${BLD}✖ ERROR: $*${RST}"; echo -e "${RED}Deploy ABORTADO. El sitio en vivo NO fue tocado (o sigue con la versión anterior).${RST}"; exit 1; }

cd "$REPO_DIR" || die "No existe $REPO_DIR"

echo -e "${BLD}=== Deploy Fresh Service Digital — $(date '+%Y-%m-%d %H:%M:%S') ===${RST}"

# ---------- 1. Git pull ----------
step "1/6  Trayendo cambios de GitHub (git pull origin $BRANCH)"
BEFORE=$(git rev-parse HEAD)
git fetch origin "$BRANCH" 2>&1 || die "git fetch falló (¿problema de red o SSH?)"
git pull origin "$BRANCH" 2>&1 || die "git pull falló (¿cambios locales sin commitear? corre 'git status')"
AFTER=$(git rev-parse HEAD)
if [ "$BEFORE" = "$AFTER" ]; then
  ok "Ya estaba al día — no hay commits nuevos. (Igual reconstruyo por si acaso.)"
else
  ok "Actualizado: $BEFORE -> $AFTER"
  echo -e "${BLU}Commits nuevos:${RST}"
  git log --oneline "$BEFORE..$AFTER"
fi

# ---------- 2. Migraciones de base de datos ----------
step "2/6  Aplicando migraciones de base de datos (backend)"
cd "$BACK_DIR" || die "No existe $BACK_DIR"
pnpm install --frozen-lockfile 2>&1 | tail -2 || die "pnpm install (backend) falló"

# Aplica migraciones ya commiteadas
pnpm exec prisma migrate deploy 2>&1 | tail -8 || die "prisma migrate deploy falló — revisa la migración"

# DETECTOR DE TRAMPA: ¿alguien cambió el schema.prisma pero falta la migración?
# (justo el error que cometió María: cambió el schema sin crear migración)
STATUS=$(pnpm exec prisma migrate status 2>&1 || true)
if echo "$STATUS" | grep -qiE "have not yet been applied|following migration|not yet been applied"; then
  warn "Hay migraciones sin aplicar. Intentando de nuevo con migrate deploy..."
  pnpm exec prisma migrate deploy 2>&1 | tail -6 || die "No se pudieron aplicar migraciones pendientes."
fi
if echo "$STATUS" | grep -qiE "drift|not in sync|schema is not in sync|prisma migrate dev"; then
  warn "OJO: el schema.prisma podría estar cambiado SIN migración."
  warn "Esto rompe funciones nuevas. Pídele a quien lo cambió que corra 'pnpm exec prisma migrate dev --name loquesea' y suba prisma/migrations/."
  warn "Verifica manualmente:  cd backend && pnpm exec prisma migrate status"
else
  ok "Migraciones en sincronía con la base de datos."
fi

pnpm exec prisma generate 2>&1 | tail -2 || die "prisma generate falló"
ok "Base de datos y cliente Prisma listos."

# ---------- 3. Build frontend ----------
step "3/6  Construyendo frontend (React + Vite)"
cd "$FRONT_DIR" || die "No existe $FRONT_DIR"
pnpm install --frozen-lockfile 2>&1 | tail -2 || die "pnpm install (frontend) falló"
pnpm run build 2>&1 | tail -8 || die "Build del FRONTEND falló — no se reinició nada, el sitio viejo sigue en vivo."
ok "Frontend construido."

# ---------- 4. Build backend ----------
step "4/6  Construyendo backend (NestJS)"
cd "$BACK_DIR" || die "No existe $BACK_DIR"
pnpm run build 2>&1 | tail -8 || die "Build del BACKEND falló — no se reinició nada, la API vieja sigue en vivo."
ok "Backend construido."

# ---------- 5. Restart pm2 ----------
step "5/6  Reiniciando servicios (pm2)"
pm2 restart "$BACK_PM2"  --update-env 2>&1 | tail -2 || die "No se pudo reiniciar $BACK_PM2"
pm2 restart "$FRONT_PM2" --update-env 2>&1 | tail -2 || die "No se pudo reiniciar $FRONT_PM2"
pm2 save 2>&1 | tail -1 || warn "pm2 save falló (no crítico)"
ok "Servicios reiniciados."

# ---------- 6. Health check ----------
step "6/6  Verificando que todo responde"
# espera hasta ~30s a que el servicio responda (vivo = 2xx/3xx/4xx)
wait_http() {
  local url="$1" code=""
  for i in $(seq 1 15); do
    code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 "$url" 2>/dev/null)
    case "$code" in
      2*|3*|4*) echo "$code"; return 0 ;;   # vivo
      *)        sleep 2 ;;                    # 000/""/5xx: sigue esperando
    esac
  done
  echo "${code:-000}"; return 1
}
FAIL=0
if BC=$(wait_http "http://localhost:$BACK_PORT"); then
  ok "Backend  (:$BACK_PORT)  -> $BC  OK"
else
  echo -e "${RED}Backend  (:$BACK_PORT)  -> $BC  CAÍDO${RST}"
  FAIL=1
fi
if FC=$(wait_http "http://localhost:$FRONT_PORT"); then
  ok "Frontend (:$FRONT_PORT) -> $FC  OK"
else
  echo -e "${RED}Frontend (:$FRONT_PORT) -> $FC  CAÍDO${RST}"
  FAIL=1
fi

if [ "$FAIL" -ne 0 ]; then
  echo -e "\n${RED}${BLD}Algún servicio no responde. Revisa los logs:${RST}"
  echo -e "  pm2 logs $BACK_PM2 --lines 30"
  echo -e "  pm2 logs $FRONT_PM2 --lines 30"
  exit 1
fi

# ---------- 7. Espejo al repo de respaldo (no crítico) ----------
if git remote | grep -qx backup; then
  step "Respaldando al repo espejo (backup)"
  if git push backup "$BRANCH" 2>&1 | tail -2; then
    ok "Respaldo actualizado en el repo backup."
  else
    warn "No se pudo actualizar el repo de respaldo (no crítico)."
  fi
fi

echo -e "\n${GRN}${BLD}✅ DEPLOY COMPLETO.${RST}"
echo -e "${GRN}Míralo en: https://fresh.pedroservicios.xyz  (recarga con Ctrl+Shift+R)${RST}"
