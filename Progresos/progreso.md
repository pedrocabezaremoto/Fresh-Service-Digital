# 📍 Estado Actual del Proyecto — Fresh Service Digital

> Este documento describe en qué etapa se encuentra el proyecto HOY y cuáles son los problemas pendientes de resolver.

**Última actualización:** 2026-06-23  
**Fase del proyecto:** Fase 2 — Backend + Base de datos CONECTADOS y funcionando (local en VPS)  
**Deploy activo (frontend):** [pedrocabezaremoto.github.io/Fresh-Service-Digital](https://pedrocabezaremoto.github.io/Fresh-Service-Digital/index.html)

---

## 🚀 NOVEDAD 2026-06-23 — Backend + DB en vivo + Dashboard del Taller

| Logro | Estado |
|---|---|
| PostgreSQL real en el VPS (DB `freshservice`) | ✅ |
| Backend NestJS corriendo con **pm2** en puerto **4000** | ✅ vivo |
| Dependencias con **pnpm** (no npm, por seguridad) | ✅ |
| Migraciones Prisma aplicadas (users/appointments/equipments) | ✅ |
| Flujo E2E (registro→verify→login→cita) probado contra DB real | ✅ |
| Endpoint `GET /users` (lista clientes con # citas) | ✅ nuevo |
| Endpoint `PATCH /appointments/:id/status` (cambiar estado) | ✅ nuevo |
| Datos demo reales: 11 clientes, 26 citas | ✅ |
| Dashboard taller: KPIs + gráficos canvas + clientes + gestión citas | ✅ |

**Cómo levantar el backend:** está en pm2 (`pm2 restart fresh-service`). Config en `backend/.env`.
**Re-sembrar demo:** `node prisma/seed.js` dentro de `backend/`.

---

## ✅ Lo que YA está resuelto y funcionando

| Problema | Solución aplicada | Verificado |
|---|---|---|
| Slide-tag rompía en 2 líneas en móvil | `white-space: nowrap` en `.slide-tag` | ✅ |
| Tarjetas del catálogo aplastadas en 2 columnas | Clase `.services-grid-2` con media query | ✅ |
| Carousel mostraba 2 slides simultáneamente | `overflow-x: clip` en `html` | ✅ |
| Hero demasiado alto en móvil | `height: 70vh` media query ≤600px | ✅ |
| Navbar fondo transparente (backdrop-filter) | `background: var(--white)` sólido | ✅ Desktop |
| Fuente body mejorada | Nunito → Inter (más profesional) | ✅ |
| Shadows más elegantes | Neutral rgba(15,23,42) vs cyan-tinted | ✅ |
| Accesibilidad prefers-reduced-motion | Media query agregado | ✅ |
| Bug CSS registro.html `position: absolute inset: 0` | Agregado `;` faltante | ✅ |
| Función `updateSubtype()` no definida en solicitud | Definida en script | ✅ (versión original) |
| Logo giraba demasiado rápido (10s) | Cambiado a 30s (sutil) | ✅ 2026-06-20 |
| Alert "Debes iniciar sesión" bloqueaba solicitud.html | Modo demo sin sesión obligatoria | ✅ 2026-06-20 |
| Flickering por animaciones sin GPU isolation | `will-change: transform` + `translateZ(0)` | ⏳ Pendiente verificar |
| Navbar invisible en Android | `translateZ(0)` composite layer + isolation | ⏳ Pendiente verificar |

---

## 🟡 PENDIENTE DE VERIFICACIÓN — Fixes aplicados 2026-06-20

### Fix #1: Navbar Android (composite layer) — RESUELTO ✅
- Agregado `will-change: transform; transform: translateZ(0); -webkit-transform: translateZ(0)` al `.navbar`
- **Verificado en Android real:** Navbar visible y funcional

### Fix #2: Flickering/Parpadeo — CERRADO ✅
- **Causa confirmada:** Dark Reader (extensión del navegador) interfiere con animaciones CSS
- **En Android:** No hay flickering (confirmado con screenshots)
- **En Desktop con Dark Reader:** Persiste pero es culpa de la extensión
- **Solución final:** Animación del logo eliminada completamente. Decoraciones de fondo a 60s (imperceptibles)
- **Decisión:** No se persigue más. Es problema de la extensión, no del código

### Fix #3: solicitud.html alert — RESUELTO ✅
- Modo demo activado: si no hay sesión en localStorage, usa usuario demo sin redirigir

---

## 📂 Estructura Actual del Proyecto (post-merge María)

```
Fresh-Service-Digital/
├── index.html              ← Landing (carousel, features, CTA)
├── styles.css              ← Design system global
├── views/
│   ├── catalogo.html       ← Catálogo servicios AC
│   ├── login.html          ← Login (conectado a backend)
│   ├── registro.html       ← Registro usuario
│   ├── recuperar.html      ← Recuperar contraseña
│   ├── solicitud.html      ← Formulario solicitud (con auth check)
│   ├── dashboard.html      ← Panel admin
│   └── cliente-dashboard.html ← Panel cliente (nuevo, María)
├── backend/                ← NestJS + Prisma (María)
├── README.md
├── AGENTS.md
├── History/
│   └── historial.md
└── Progresos/
    └── progreso.md         ← este archivo
```

---

## 🔴 Bugs / pendientes

1. ~~Navbar Android~~ — ✅ RESUELTO
2. ~~Flickering en desktop~~ — ✅ CERRADO (es Dark Reader, no el código)
3. ~~Backend no desplegado localmente~~ — ✅ corre en pm2 (`fresh-service`, puerto 4000) contra DB real
4. **Backend sin subdominio público** — el dashboard en GitHub Pages todavía no puede llamar al backend en vivo. Falta exponer `api.pedroservicios.xyz` con HTTPS (Fase C). Mientras tanto funciona en local.
5. ~~Frontend apunta a `localhost:3000`~~ — ✅ `login.html` y `solicitud.html` ya usan `API_BASE` (4000 local / `api.pedroservicios.xyz` prod). Login y crear-cita probados en vivo. Falta `registro.html`.
6. **Inconsistencia de tema** — login/solicitud tienen fondo oscuro, index/catálogo fondo claro
7. **Seguridad backend (heredado de María):** sin JWT, passwords SHA-256 (debería bcrypt), sin guards de auth. Pendiente para endurecer antes de producción real.

---

## 📋 Roadmap inmediato

| Prioridad | Tarea | Estado |
|---|---|---|
| 1 | Decisión backend: continuar NestJS de María | ✅ DECIDIDO (NestJS + Postgres en VPS) |
| 2 | Conectar backend + DB real | ✅ Hecho (pm2, puerto 4000) |
| 3 | Dashboard del taller (clientes, citas, gráficos) | ✅ Hecho |
| 4 | Fase C: exponer backend en `api.pedroservicios.xyz` (HTTPS) | ✅ Hecho (Traefik + ufw + Let's Encrypt) |
| 5 | `git push` del dashboard.html (GitHub Pages) | ✅ Hecho (commit 036e0f29, mezclado con dark mode de María) |
| 6 | Migrar `login.html` y `solicitud.html` al esquema `API_BASE` | ✅ Hecho (commit 1ad68808); solicitud requiere sesión real |
| 7 | Endurecer seguridad (JWT, bcrypt, guards) | ✅ Hecho y verificado |
| 8 | Revisar `registro.html` (enlace mágico) | ✅ Hecho (botón de activación directa) |

### 🔐 Seguridad implementada (2026-06-24)
- **bcrypt** reemplaza SHA-256 en las contraseñas.
- **JWT**: el login devuelve `accessToken`; el frontend lo guarda y lo manda en `Authorization: Bearer`.
- **Guards (portero)**: `GET /users`, `GET /appointments` y los `PATCH` de estado son **solo ADMIN**; crear cita requiere estar logueado. Verificado: sin token → 401, cliente a ruta admin → 403.
- **Dashboard del taller** ahora exige login de admin (si no, redirige a login).
- **Credenciales demo:** Admin → `admin@freshservice.com` / `Admin1234` · Clientes → su email / `Demo1234`.
- Datos: 1 admin, 10 clientes, 22 citas (re-sembrados con bcrypt).

---

## 🛑 Reglas para el Agente

1. **NO usar React, Vue, Tailwind, Vite, TypeScript** en el frontend
2. **NO cambiar la paleta de colores**
3. **NO romper la navegación**
4. **PRIORIDAD:** Responsividad móvil perfecta para el lunes
5. **Backend:** Evaluar si usar NestJS de María o Supabase

---

## 📞 Contexto del Negocio

- **Servicio:** Refrigeración y climatización a domicilio
- **Ubicación:** San Juan de los Morros, estado Guárico, Venezuela
- **Propósito actual:** Mostrar prototipo visual funcional a clientes potenciales
- **Deadline:** Lunes 2026-06-22, 8:00 AM

---

## ⚛️ 2026-06-24 — Frontend migrado a React (EN VIVO)

- **Nuevo frontend React + Vite + Tailwind** en `frontend-react/` → **https://fresh.pedroservicios.xyz**
- Diseño premium (glow/glass, fotos reales), todas las páginas funcionando contra el backend.
- Backend NestJS intacto. El HTML viejo queda como referencia.
- **Levantar frontend:** `cd frontend-react && pnpm install && node node_modules/vite/bin/vite.js build`, luego `PORT=4100 pm2 start serve.mjs --name fresh-frontend`.
- Incidente nginx/Traefik resuelto (ver historial Fase 8).

---

## 📌 PENDIENTE PARA MAÑANA (2026-06-25)

**Frontend React nuevo (https://fresh.pedroservicios.xyz):**
- [ ] Revisar la 1ª versión del rediseño con Pedro y afinar (colores, textos, espaciados, copy).
- [ ] Reemplazar las **fotos de stock** (Unsplash) por **fotos reales del taller/trabajos** cuando Pedro las pase (`frontend-react/src/lib/images.js`).
- [ ] Decidir qué hacer con el viejo GitHub Pages: redirigir a `fresh.pedroservicios.xyz` o dejarlo como está.
- [ ] Favicon propio (ahora usa `/favicon.svg` que no existe aún) + meta/OG tags para compartir el link.

**Backend / seguridad (no urgente para demo, sí antes de producción real):**
- [ ] Servicio de **correo real** para activación (dejar de devolver `activationUrl` en la respuesta).
- [ ] Refresh tokens + expiración de sesión más fina.
- [ ] Rate-limiting en login/registro.

**Infra / operación:**
- [ ] Confirmar `pm2 startup` para que `fresh-frontend`, `fresh-service` e `inmoya` reaparezcan solos tras un reinicio del VPS.
- [ ] Recordatorio: **nginx quedó deshabilitado** (Traefik usa 80/443). Abrir puertos a Docker SIEMPRE con `ufw` (no iptables directo).

---

## 🤖 2026-07-17/18 — Deploy AUTOMÁTICO (webhook) + fix de migración

**Estado:** el sitio ya despliega solo en cada `git push` a `main`. No hay que correr nada a mano.

### Lo que se hizo hoy
| Logro | Estado |
|---|---|
| Absorber cambios de María (dark mode, verificación por correo, citas de técnicos) | ✅ en vivo |
| Migración faltante `technicianId` en `appointments` (la agregó al schema sin migrar) | ✅ creada y aplicada |
| `deploy.sh` — despliegue seguro de un comando (build antes de reiniciar) | ✅ probado |
| `webhook.mjs` (pm2 `fresh-webhook`, puerto 4200) + firma HMAC | ✅ corriendo |
| Ruta Traefik `https://api.pedroservicios.xyz/deploy-hook` | ✅ 200 OK |
| Webhook conectado en GitHub (push event) | ✅ ping verde |
| Prueba end-to-end: push → deploy automático → COMPLETO | ✅ |

### Flujo de trabajo NUEVO (para Pedro y María)
1. Hacer cambios en el código.
2. `git add . && git commit -m "..." && git push`
3. Esperar ~40 s → recargar la web con **Ctrl+Shift+R**.
4. Los cambios ya están en **https://fresh.pedroservicios.xyz**.

- Deploy manual (si hace falta): `cd /root/Fresh-Service-Digital && ./deploy.sh`
- Ver deploys en vivo: `tail -f /root/Fresh-Service-Digital/deploy-webhook.log`
- Secreto del webhook: `/root/.fresh-webhook-secret` (NO subir a git; ya está en GitHub Settings).

### ⚠️ REGLA para María (base de datos)
> Al cambiar la base de datos, correr `npx prisma migrate dev --name descripcion` y subir la carpeta `prisma/migrations/`. **Nunca** cambiar el `schema.prisma` sin migración (rompe el deploy automático).

### 📌 Pendientes que siguen abiertos
- [ ] Unificar gestor de paquetes: `deploy.sh` usa **npm**; el backend históricamente usaba **pnpm**. Hay lockfiles mezclados → elegir uno.
- [ ] `pm2 startup` para que `fresh-frontend`, `fresh-service`, `fresh-webhook` e `inmoya` reaparezcan solos tras reiniciar el VPS (ya se hizo `pm2 save`).
- [ ] Mandarle a María la regla de migraciones (arriba).
- [ ] Los pendientes de diseño/fotos/correo real de la sección anterior siguen vigentes.

---

## 🎨 2026-07-18 — Branding + limpieza UI (sesión de la tarde/noche)

**Estado:** frontend con logo real, favicon, fotos en servicios y panel de cliente limpio. Todo EN VIVO (deploy automático por webhook).

### Hecho hoy
| Cambio | Estado |
|---|---|
| Hero: quitar badges "+1.200"/"4.9★", efecto hover en foto, stats +500/8años/4.9★ | ✅ |
| Logo real (copo+llave): navbar, footer, login | ✅ |
| Logo: chip blanco (claro/oscuro), hover en navbar, float lento en footer | ✅ |
| Favicon desde el logo (ico + apple-touch + PWA) | ✅ |
| Home servicios: sin iconos genéricos | ✅ |
| Catálogo: foto del tipo en cada tarjeta, sin iconos genéricos | ✅ |
| Panel cliente: sin mano 👋, sin iconos genéricos (stat cards + historial) | ✅ |

### Cómo procesar imágenes (para el futuro)
- Quitar fondo: `/root/venv/bin/python` con **rembg** (modelo u2net en `/root/.u2net/`).
- Pedro sube archivos por **SCP** a `frontend-react/public/` (ruta con comillas por los espacios; apuntar al archivo, no a la carpeta).

### Verificado en vivo (flujo cliente↔taller)
- Cliente pide servicio → aparece en su panel como **Pendiente** y en el **Panel Taller** (Solicitudes en vivo).
- Taller asigna técnico → el estado pasa a **Asignada** en el panel del cliente. ✅ funciona.

---

## 📌 PARA MAÑANA (2026-07-19) — Cambios GRANDES

> Pedro terminó cansado; estos son los grandes. Detalle completo en `History/historial.md` (Roadmap Fase 10).

**Panel Taller — Dashboard** ✅ HECHO (2026-07-18 noche)
- [x] Stat cards clickeables → redirigen a Solicitudes con su filtro (Pendientes→PENDING, En proceso→PROGRESS, Clientes→vista clientes).
- [x] Donut "Citas por estado" — ya era real (se calcula en vivo de la DB); confirmado.
- [x] **Exportar reporte**: botón "Exportar Excel" en el dashboard → descarga CSV (abre en Excel) con todas las solicitudes. Si Pedro quiere `.xlsx` nativo, se agrega SheetJS.

**Panel Taller — Gestión de Solicitudes**
- [ ] Filtros por columna (cliente, servicio, fecha, técnico, estado).
- [ ] Botón **WhatsApp** real por fila (al número registrado del cliente).
- [ ] 3 técnicos ficticios: **Juan** (ventana), **Carlos** (split), **Jorge** (toneladas); al asignar, mostrar **nombre + WhatsApp ficticio** en el panel del cliente.

**Precios anclados al dólar (BCV) — como InmoYa**
- [ ] Reusar la **API del BCV** que usa InmoYa (`/root/Proptech-InmoYa`) para mostrar precios en Bs a tasa oficial del día (VPS siempre encendido).
- [ ] Precios base mantenimiento: **ventana $25 · split $35 · tonelada $50**; demás servicios con lógica (reparación > mantenimiento).
- [ ] **Falta que Pedro dé:** valores exactos por servicio + confirmar endpoint BCV de InmoYa.

**Pendiente opcional de hoy**
- [ ] Fotos de acción por tarjeta (reparando vs lavando) — Pedro genera 2-3 imágenes y se cambian.
