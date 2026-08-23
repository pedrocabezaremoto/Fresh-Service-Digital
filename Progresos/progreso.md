# 📍 Estado Actual del Proyecto — Fresh Service Digital

> Este documento describe en qué etapa se encuentra el proyecto HOY y cuáles son los problemas pendientes de resolver.

**Última actualización:** 2026-08-23 (tarde — Sharp, desbloquear, emojis, lista visual)  
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

---

## 🌙 2026-07-18 (noche, 2ª tanda) — Técnicos + mejoras chicas del taller

**Hecho (todo EN VIVO):**
| Cambio | Detalle |
|---|---|
| **3 técnicos asignables** | Juan (Ventana +58 412-111 2233), Carlos (Split +58 414-222 3344), Jorge (Toneladas +58 424-333 4455). Sembrados con `backend/prisma/seed-technicians.js` (upsert idempotente, NO borra datos). |
| **Técnico en panel del cliente** | `findByClient` ahora incluye `technician`; el cliente ve "Técnico: <nombre>" + botón WhatsApp al número del técnico cuando ya está asignado. |
| **Orden por columna (taller)** | Cliente, Fecha y Estado son ordenables (clic en el encabezado, flecha ▲▼). |
| **Sugerir técnico automático** | En cada solicitud sin asignar aparece "Sugerido: <nombre>" según el tipo de aire (ventana/split/toneladas, detectado del equipo/notas); clic asigna directo. |
| **OG tags** | index.html con Open Graph + Twitter (título/descr/imagen `icon-512.png`) → vista previa al compartir el link por WhatsApp. |
| Técnico en reporte Excel | Ya salía (columna Técnico en el CSV). |

**Notas técnicas:**
- Técnicos: rol TECHNICIAN, clave demo `Tecnico1234`, especialidad codificada en el apellido ("— Aires de Ventana", etc.). Si se quiere un campo `specialty` propio → requiere migración (futuro).
- Re-sembrar técnicos si hiciera falta: `cd backend && node prisma/seed-technicians.js`.

**PENDIENTE MAÑANA (sin tocar hoy):**
- [ ] Precios anclados al dólar (BCV) como InmoYa — falta endpoint BCV + valores exactos de Pedro.
- [ ] (Opcional) campo `specialty` real en técnicos + asignación automática al crear la solicitud.
- [ ] (Opcional) reporte en `.xlsx`/XML nativo (hoy es CSV que abre en Excel).
- [ ] Alimentar `History/historial.md` con esta 2ª tanda (Fase 11) — Pedro pidió dejarlo para mañana.

---

## 💱 2026-07-19 — Precios BCV + Proforma + Respaldo (COMPLETO)

**Estado:** flujo de precios/proforma EN VIVO. Todo desplegado por webhook.

| Cambio | Estado |
|---|---|
| Tasa BCV (DolarAPI) cacheada en DB, refresh 6h, endpoint `/rate` | ✅ |
| Precios en USD → Bs en Catálogo, Home y Solicitud | ✅ |
| Precio congelado (`priceUsd`) en cada solicitud | ✅ |
| Panel cliente: precio por servicio + Total a pagar | ✅ |
| Proforma imprimible `/proforma` (PDF por navegador) | ✅ |
| Correo al asignar técnico (simula en consola sin SMTP) | ✅ (código listo) |
| Repo de respaldo (espejo) + push automático en cada deploy | ✅ |

**Fuente única de precios:** `frontend-react/src/lib/prices.js` (y espejo `backend/src/common/prices.ts`).
Cambiar un precio = editar ahí y push.

### PENDIENTES
- [ ] **Configurar SMTP** en `backend/.env` para que el correo salga de verdad (hoy se simula en consola).
- [ ] Confirmar/ajustar precios con Pedro.
- [ ] Activar **branch protection** en GitHub (que María no pueda empujar directo a main).
- [ ] (Opcional) Mostrar precio también en el panel del técnico / recordatorio de pago.

---

## 🚀 2026-07-19 (tarde) — Correo REAL + Control de Servicios Realizados (cierre v1.0)

**Hecho:**
| Cambio | Estado |
|---|---|
| **SMTP activo** (Gmail `freshservicedigital2026@gmail.com` + contraseña de app) | ✅ correos REALES |
| Correo de prueba enviado a `pedrocabezasocial@gmail.com` (Luis, cuenta de la defensa) | ✅ recibido |
| **Control de Servicios Realizados** (panel taller, vista "Ingresos") | ✅ |
| Ganancias por período: Hoy / Semana / Mes / Año (servicios COMPLETADOS) | ✅ |
| Descarga de reporte CSV por período (diario/semanal/mensual/anual) | ✅ |
| Tabla de servicios completados con monto Bs + USD | ✅ |

- **Ingresos = suma de `priceUsd` de citas COMPLETED**, fechadas por `scheduledAt`. Solo frontend (usa `appts` ya cargados).
- Config SMTP vive en `backend/.env` (gitignored, solo en el VPS). Si falta correo real, revisar esas vars.

### ✅ VERSIÓN 1.0 — cerrada para la defensa (lunes 8:00 AM)

## 🔮 ROADMAP v1.1 (apuntado, NO en 1.0)
1. **Chat en tiempo real cliente↔taller** — se habilita al registrarse y cuando el taller aprueba al usuario (para dudas/comunicación).
2. **Gestión de usuarios** (panel taller) — editar/eliminar usuarios: nombre, correo, clave, rol, etc.
3. **Ubicación con Google Maps** — el cliente marca su ubicación real en el mapa desde su panel; ayuda al técnico a llegar y a la empresa a ubicar el servicio. Dejar enganchado en backend + frontend.

---

## 🧩 2026-07-19 (noche) — UX solicitud + gestión usuarios + cédula en cuenta

| Cambio | Estado |
|---|---|
| "Solicitar" sin cuenta → Registro (no Login) + vuelve a la solicitud | ✅ |
| Correos con logo real + texto plano (anti-spam) | ✅ |
| SMTP real activo (Gmail app password) | ✅ |
| Panel Taller/Clientes: Editar + Eliminar usuarios | ✅ |
| Saludo del panel más elegante + datos del cliente | ✅ |
| Cédula guardada en la cuenta + precarga en Solicitud | ✅ |
| Backfill de cédula para clientes viejos | ✅ |

**Nota:** para que a un cliente existente le precargue la cédula, debe **volver a iniciar sesión** una vez (el login ahora trae la cédula) o hacer una solicitud (se guarda con `patchUser`).

### Pendiente / v1.1
- [ ] Spam definitivo: dominio propio (SPF/DKIM/DMARC).
- [ ] Chat cliente↔taller en tiempo real.
- [ ] Google Maps para ubicación del cliente.
- [ ] (Opcional) pedir cédula en el registro para tenerla desde el día 1.

---

## 🔐 2026-07-19 (madrugada) — Reset real + filtros + docs (v1.0 lista para defensa)

| Cambio | Estado |
|---|---|
| Reset de contraseña real por correo (/recuperar, /restablecer) | ✅ |
| Filtros inteligentes en Solicitudes y Clientes (4 columnas c/u) | ✅ |
| Modal profesional al eliminar usuario | ✅ |
| Estética panel: logo sidebar, "Ver sitio web", barras 3D, KPIs glass | ✅ |
| Login: "¿Olvidaste tu contraseña?" + botón "Volver" | ✅ |
| Carpeta `docs/`: MANUAL-USUARIO.md + GUIA-CASOS-DE-USO.md | ✅ |

### ✅ VERSIÓN 1.0 — funcional y lista para la defensa del lunes

## 📌 PARA MAÑANA (mejoras)
- [ ] Mejorar la **sección Ingresos** del panel taller (más detalle/visual, quizá PDF, rangos de fecha).
- [ ] **Detalles tontos de frontend** (pulir estilos sueltos que Pedro indique).
- [ ] (v1.1) dominio propio anti-spam, chat cliente↔taller, Google Maps.

---

## 🐳 2026-07-19 — Ingresos pulido + tema + Docker offline (plan B defensa)

| Cambio | Estado |
|---|---|
| Ingresos: calendarios filtran + filtros en encabezado (incl. Monto) | ✅ |
| Botón tema claro/oscuro en panel taller | ✅ |
| Guía `docs/crear-docker.md` + dump `docker/seed-data.sql` | ✅ |
| Archivos Docker (Dockerfiles, compose, README) — probados y supervisados | ✅ |
| README docker corregido (build 1 vez con internet, luego offline sin --build) | ✅ |

### Plan B defensa (laptop)
- HOY con internet: `git pull` → `docker compose up --build` (construye y cachea).
- En la defensa (offline): `docker compose up` (sin `--build`).
- Login admin: `admin@freshservice.com` / `Admin1234`.

### Nota
- La DB tiene 7 clientes / 10 solicitudes porque Pedro **limpió clientes a propósito** (intencional).

### Pendiente (mañana / v1.1)
- [ ] Más detalles de la sección Ingresos y detalles sueltos de frontend.
- [ ] v1.1: dominio anti-spam, chat cliente↔taller, Google Maps.

---

## 🧑‍🔧 2026-07-20 — Panel del Técnico completo (listo para la defensa)

| Cambio | Estado |
|---|---|
| Panel técnico muestra cédula, dirección y detalle del servicio del cliente | ✅ |
| Fix credenciales demo del login (carlos.tecnico@freshservice.com / Tecnico1234) | ✅ |
| Foto del Aire Split reencuadrada + mejoras de estilos | ✅ |

### Logins para la defensa
- **Admin/Taller:** `admin@freshservice.com` / `Admin1234`
- **Técnico (con trabajos):** `carlos.tecnico@freshservice.com` / `Tecnico1234`
- **Cliente:** su correo / `Demo1234` (ej. `pedrocabezasocial@gmail.com`)

### Flujo completo demostrable
Cliente pide servicio → Taller asigna técnico (llega correo al cliente) → **el técnico ve al
cliente con nombre, cédula, dirección, WhatsApp y el detalle** para atenderlo → marca completado
→ cuenta en Ingresos.

### Pendiente (después de la defensa)
- [ ] Más mejoras al panel del técnico y a Ingresos.
- [ ] v1.1: dominio anti-spam, chat cliente↔taller, Google Maps.

---

## 🏆 2026-07-20 — DEFENSA EXITOSA (Versión 1.0 entregada)

**La defensa fue un ÉXITO TOTAL.** ✅

- **VPS/producción:** funcionó perfecto con internet (sitio + API + DB + correos + tasa BCV).
- **Docker offline (laptop):** también se levantó al 100% como respaldo. Preparado en ambos entornos.
- Todos los módulos funcionaron en vivo: cliente, taller (admin) y técnico.

### Versión 1.0 — CERRADA y DEFENDIDA con éxito.

## 📌 Roadmap v1.1 (cuando se retome)
- [ ] Dominio propio para correos (SPF/DKIM/DMARC) → sin spam.
- [ ] Chat en tiempo real cliente ↔ taller.
- [ ] Ubicación del cliente con Google Maps.
- [ ] Más mejoras de la sección Ingresos y detalles de frontend.

🎉 ¡Gran trabajo, Pedro!

---

## 🔒 2026-07-26/27 — Migración npm → pnpm (seguridad supply-chain) — ✅ COMPLETADA

**Motivo:** npm sufrió un incidente de paquetes hackeados. Se migró todo el proyecto a **pnpm**
(bloquea scripts `postinstall` por defecto = la puerta de entrada de esos ataques).

**Estado: EN PRODUCCIÓN y verificado en vivo** (`fresh.pedroservicios.xyz` 200, `api…/rate` 200).
Guía completa reutilizable en **`Cambio-pnpm.md`** (raíz).

### Cómo se hizo (modelo ejecutor + revisor)
- LLMs externos ejecutaron por fases (Kimi K2.5 fases 1-2, Grok 4.5 fase 3 + fix); **Claude revisó
  cada fase EN el VPS con los comandos reales y controló todo el git** (commits/push al repo de
  respaldo entre fases). Los ejecutores NO tocaron git.

### Resultado por fase
| Fase | Qué | Estado |
|---|---|---|
| 1 | Backend a pnpm (borrado `package-lock.json`, `pnpm-lock.yaml` limpio) | ✅ |
| 2 | Frontend a pnpm (esbuild aprobado a compilar) | ✅ |
| 3 | Pipeline: `deploy.sh` + ambos `Dockerfile` + docs, npm→pnpm | ✅ |
| 4 | Build Docker + verificación aislada + deploy a producción | ✅ |
| Extra | Fix del health check de `deploy.sh` (reintento; ya no da falso OK) | ✅ |

### Claves técnicas aprendidas
- **pnpm 11.5.2 exige el mapa `allowBuilds` con booleanos**; `onlyBuiltDependencies` solo NO basta
  (aborta con `ERR_PNPM_IGNORED_BUILDS`). Backend: Prisma `true`, `@nestjs/core` `false`. Frontend:
  `esbuild: true`.
- **Intactos** (no usan el gestor): `pm2` (corre `node` directo), `webhook.mjs`, `serve.mjs`,
  `schema.prisma`, migraciones.
- Validar builds SIEMPRE con los comandos reales (`pnpm install --frozen-lockfile` + `pnpm run
  build`), nunca con `nest build`/`vite build` directo.
- Commit final en producción: `202d9ba6` (main = origin = backup).

### Pendiente opcional
- [ ] Borrar el branch `migracion-pnpm` (ya mergeado a main).
- [ ] Endurecimiento extra opcional de `Cambio-pnpm.md` §11 (`minimumReleaseAge`).

---

## 📍 2026-08-14 — Ubicación por cita (backend) + docs reales

| Cambio | Estado |
|---|---|
| `README.md` y `AGENTS.md` reescritos al stack real (React/Nest/pnpm/v1.0) | ✅ |
| Campos `latitude`/`longitude`/`address` opcionales en `Appointment` | ✅ |
| Migración `20260814155902_add_location_to_appointment` | ✅ aplicada en DB VPS |
| DTO create + `UpdateAppointmentDto` + `PATCH /appointments/:id` | ✅ |
| Validación cruzada lat/lng + rangos (400 si incompleto/fuera de rango) | ✅ verificado |
| Frontend (mapa / solicitud) | ⏳ siguiente paso |

**Nota:** `prisma migrate dev` falló por falta de permiso de shadow DB; se generó SQL con `migrate diff`, se aplicó y se marcó con `migrate resolve`. Misma migración queda lista para `deploy.sh` / `migrate deploy` tras el push.

---

## Integración Leaflet.js — Mapas de ubicación
Fecha inicio: 2026-08-14

### Fase 0 — Cimientos DB + Backend ✅
- Migración Prisma: campos `latitude` (Float?), `longitude` (Float?), `address` (String?) agregados a Appointment
- Migración: `20260814155902_add_location_to_appointment`
- DTOs actualizados: CreateAppointmentDto + UpdateAppointmentDto aceptan los 3 campos opcionales
- Validación cruzada en service: lat sin lng (o viceversa) = error 400, rangos validados
- Backward compatible: citas existentes sin coordenadas siguen funcionando
- Estado: COMPLETADO

### Fase 1 — Componentes de mapa (frontend) ✅
- Paquetes: leaflet 1.9.4, react-leaflet 5.0.0, @types/leaflet 1.9.22 (pnpm)
- fixLeafletIcons.js: fix de íconos para Vite (mergeOptions con imports directos)
- LocationPicker.jsx: mapa interactivo, pin draggable, geolocation, Nominatim reverse geocoding, input dirección editable. Props: onLocationChange, initialPosition, height
- LocationView.jsx: mapa solo lectura, popup con dirección, botón "Cómo llegar" (Google Maps), fallback "Ubicación no registrada". Props: latitude, longitude, address, height, showNavigationButton
- CSS Leaflet importado en main.jsx
- Componentes NO integrados en páginas todavía
- Estado: COMPLETADO

### Fase 1.3-1.8 — Integrar mapa en Solicitud del cliente ✅
- Archivo modificado: Solicitud.jsx
- LocationPicker integrado en sección 4 del formulario ("¿Dónde necesitas el servicio?")
- Ubicación opcional: ignora primer emit del picker, solo marca tras interacción real
- Indicador verde "Ubicación marcada" con coordenadas
- Envío condicional de latitude/longitude/address en el payload
- Backward compatible: formulario funciona sin ubicación como antes
- Estado: COMPLETADO

### Fase 2 — Mapa en Panel del Técnico ✅
- Archivo modificado: TecnicoDashboard.jsx
- LocationView integrado en cada tarjeta de trabajo con coordenadas
- Acordeón "Ver ubicación" en pestañas Por realizar y Finalizados (mapa 200px)
- Mapa visible directo en pestaña "En ejecución" (250px, CTA "Cómo llegar" prominente)
- Dirección con ícono MapPin en las tarjetas que tienen address
- Responsive mobile: botones min-h-11, touch-manipulation, full-width
- Render condicional del mapa (evita tiles grises al abrir acordeón)
- Tarjetas sin coordenadas: sin cambios, layout idéntico al anterior
- Estado: COMPLETADO

### Fase 3 — Mapa en Panel del Taller (Admin) ✅
- Componente nuevo: ServiceMap.jsx (mapa multi-marker, diferente a LocationView)
- Markers L.divIcon con color por estado: PENDING naranja, ASSIGNED azul, IN_PROGRESS violeta, COMPLETED verde, CANCELLED rojo
- Popup por marker: cliente, equipo, estado (badge), técnico, dirección
- Integrado en AdminDashboard.jsx entre gráficos y ranking de marcas, ancho completo
- Filtro por estado desde KPIs del dashboard (toggle on/off) + chip "Quitar filtro"
- Leyenda horizontal con los 5 estados y colores
- Fallback: "Ninguna solicitud tiene ubicación registrada" / "No hay solicitudes en este filtro"
- CSS override en index.css para divIcon sin caja blanca
- Nota: KPIs Pendientes/En proceso ahora filtran el mapa en vez de navegar a Solicitudes
- Estado: COMPLETADO

### Fase 4 — Pulido y extras
- Estado: PENDIENTE

---

## Pendientes post-integración Leaflet — detectados 2026-08-15

### BUG CRÍTICO — Asignación automática al técnico ✅ RESUELTO 2026-08-15
- Causa: backend devolvía PENDING sin technicianId a técnicos + panel tenía "Tomar servicio"
- Fix: técnico solo ve citas con technicianId = él, solo ADMIN puede asignar (403 si técnico intenta)
- Estado: RESUELTO

### Responsive mobile (Android) — pulido pendiente ✅ COMPLETADO 2026-08-15
- Spacing: px-5 → px-4 sm:px-5 lg:px-8 en todos los paneles
- Cards: p-5/p-6/p-8 → p-4 sm:p-5|p-6|p-8, gaps reducidos en mobile
- Botones: min-h-11 (44px), touch-manipulation, active: equivalentes al hover
- KPIs admin: hint "Filtrar mapa" siempre visible (no solo hover)
- Logout mobile: agregado en admin y técnico (antes inaccesible, sidebar hidden <lg)
- Verificado en viewport 360px y 412px, cero overflow horizontal
- Estado: COMPLETADO — pendiente pruebas UAT en dispositivos reales

### Panel del Taller — mejoras estructurales pendientes → PARCIALMENTE COMPLETADO
- ✅ CRUD técnicos completo (crear/editar/borrar/activar/desactivar)
- ✅ Campo specialty real en modelo User (reemplaza hack en lastName)
- ✅ Campo isActive para desactivar sin borrar
- ✅ Vista "Equipo Técnico" como 5ª vista en AdminDashboard
- ⬚ Más funcionalidades pendientes para convertirlo en "centro de control total"

### Mapas — testing pendiente
- Google Maps redirige correctamente con dirección ✅
- Falta testing más profundo: múltiples direcciones, precisión del pin, Nominatim en zonas rurales de Guárico
- Probar con citas reales (no solo demo)

### Prioridad de trabajo (próximas sesiones)
1. ~~**BUG asignación automática**~~ — ✅ resuelto
2. ~~**Responsive mobile**~~ — ✅ completado (pendiente UAT en Android real)
3. ~~**CRUD técnicos**~~ — ✅ completado
4. ~~**Botones rotos**~~ — ✅ restaurados post-mapas
5. **Pruebas UAT** — celulares Android reales (360–412px y dispositivos físicos)
6. **Testing mapas** — pruebas profundas (Nominatim rural, pin, citas reales)
7. **Panel taller** — más funcionalidades hacia "centro de control total"

---

## CRUD Técnicos + Responsive Android — 2026-08-15

### Backend — modelo User actualizado
- Migración: `20260815152000_add_specialty_to_user`
- Campos nuevos: `specialty String?`, `isActive Boolean @default(true)`
- Endpoint: `POST /users/create-technician` (solo ADMIN, crea con role TECHNICIAN, isVerified: true)
- Login bloquea técnicos con isActive: false ("Esta cuenta está desactivada")
- Asignación: solo permite asignar técnicos activos (isActive: true)
- Migración de datos: Carlos y otros técnicos limpiados (hack lastName → campo specialty)

### Frontend — vista Equipo Técnico en AdminDashboard
- 5ª vista: Dashboard / Solicitudes / Ingresos / Clientes / **Técnicos**
- Navegación: item UserCog + badge conteo + select mobile
- Tabla desktop: Nombre, Email, Teléfono, Especialidad (badge color), Estado (activo/inactivo), Servicios, Acciones
- Tarjetas mobile: nombre, badges, datos, botones táctiles
- Modal crear: Nombre, Apellido, Email, Teléfono, Contraseña, Especialidad (select). Éxito: banner verde 4s
- Modal editar: mismos campos, contraseña vacía = no cambia. PATCH /users/:id
- Eliminar: modal confirmación, advertencia si tiene citas activas. DELETE /users/:id (citas quedan sin técnico por onDelete: SetNull)
- Toggle activo/inactivo: PATCH inline, badge cambia al instante
- Sugerencia de técnico en Solicitudes: ahora usa campo specialty (no parsea lastName), solo técnicos activos

### Responsive Android — pulido general
- 4 paneles revisados: ClienteDashboard, TecnicoDashboard, AdminDashboard, Solicitud
- Spacing mobile: padding lateral px-4, cards p-4, gaps gap-3
- Botones: min-h-11 (44px), touch-manipulation, active: equivalentes
- KPIs: hint siempre visible, no solo hover
- Logout mobile: botón en topbar <lg (admin + técnico)
- Button.jsx: defaults táctiles globales
- AdminDashboard: mapa 280px en <640px, header flex-col
- Verificado viewport 360px y 412px: cero overflow
- Botones restaurados post-mapas: KPIs, Ver solicitudes, iniciar servicio

### Estado del proyecto
- Leaflet.js: INTEGRADO (4 paneles, 3 componentes de mapa)
- CRUD Técnicos: COMPLETO
- Responsive Android: COMPLETADO (pendiente UAT dispositivos reales)
- Bug asignación: RESUELTO
- Pendiente: pruebas UAT en celulares Android reales + testing profundo de mapas

---

## Cierre del día — 2026-08-15

### Completado hoy
- ✅ Bug asignación automática resuelto (técnico ya no ve PENDING ajenos)
- ✅ Responsive Android: spacing, botones táctiles 44px, active:, logout mobile, KPIs hint visible
- ✅ CRUD Técnicos completo: vista "Equipo Técnico" en panel admin, crear/editar/borrar/activar/desactivar
- ✅ Campo specialty y isActive en modelo User (migración aplicada)
- ✅ Endpoint POST /users/create-technician (solo ADMIN)
- ✅ Login bloquea técnicos inactivos
- ✅ Sugerencia de técnico por specialty (ya no parsea lastName)
- ✅ Fix deploy: backend rebuild + pm2 restart (endpoint 404 → 401)
- ✅ Frontend rebuild + pm2 restart (vista Técnicos visible en producción)
- ✅ Prueba UAT: creación de técnico Teofilo Carbona desde el modal — funcional

### Bug encontrado y resuelto en UAT
- "Cannot POST /users/create-technician" → causa: pm2 servía dist/ viejo (22h sin rebuild). Fix: pnpm build + pm2 restart backend y frontend.

### Pendiente para próxima sesión — Gestión de Servicios (CRUD)

**RESUELTO 2026-08-17** — ver sección "CRUD Servicios + catálogo en DB".

### Backlog actualizado (próximas sesiones)
1. **Testing profundo mapas** — múltiples direcciones, zonas rurales, dispositivos reales
2. **Panel taller** — seguir creciendo hacia centro de control total
3. **Mejoras UX** — lo que salga de pruebas UAT
4. **Chat realtime** cliente ↔ taller (roadmap v1.1)
5. **SPF/DKIM/DMARC** — mejorar deliverability de correos

---

## CRUD Servicios + catálogo en DB — 2026-08-17

### Backend
- Modelo Prisma `Service` + enums `ServiceCategory` y `EquipmentType`
- `Appointment.serviceId` opcional (citas viejas siguen con `priceUsd` guardado)
- Migración `20260817183900_add_service_table` con INSERT de 25 servicios (precios de prices.js)
- Endpoints: GET /services (público), GET /services/all + POST/PATCH/DELETE (ADMIN)
- Unique `name` + `equipmentType`. DELETE 409 si tiene citas asociadas
- Crear cita: si viene `serviceId`, el precio lo pone el backend

### Frontend
- 6ª vista admin "Servicios" (Settings, entre Ingresos y Clientes): tabla + tarjetas, filtros, CRUD, precios USD/Bs
- Solicitud.jsx: selects desde GET /services; envía `serviceId`; fallback a prices.js si la API falla
- Catalogo.jsx: lee servicios activos, agrupa por equipo, precios con tasa BCV
- prices.js / prices.ts NO se borraron (fallback histórico)

### Deploy
- `prisma migrate deploy` + `pnpm run build` backend/frontend + `pm2 restart fresh-service fresh-frontend`
- Verificado: GET /services = 25; GET /services/all = 401 sin token; bundle `index-fh-VD5pZ.js` en prod

### No se tocó
- TecnicoDashboard.jsx
- Componentes de mapas
- Citas existentes (backward compatible)

---

## Imágenes del sitio desde el panel admin — 2026-08-17

### Backend
- Modelo `SiteImage` (slot único, filename, mime, width/height, sizeBytes)
- Migración `20260817192000_add_site_image_table`
- GET `/site-images` público · POST/DELETE `/site-images/:slot` ADMIN
- Upload: JPG/PNG/WebP, máx 2MB, magic bytes, `{slot}-{timestamp}.{ext}`
- Estáticos: `backend/uploads/` → `/uploads/` (carpeta en `.gitignore`)

### Frontend
- 7ª vista admin **Configuración** (Settings2, después de Técnicos)
- Grid de 5 slots: preview, medidas, cambiar, subir (tras preview local), restaurar
- `SiteImagesProvider` + `images.js` merge custom/default
- Home.jsx y Catalogo.jsx consumen el provider. PNGs de `public/` no se borraron

### Deploy
- migrate + build + pm2 OK
- GET /site-images = `[]` · POST/DELETE sin token = 401
- Landing 200; `img-tech-ac.png` / window / split / tonnage = 200
- Bundle `index-h1Ts_Mvr.js`

---

## Login por username (ADMIN / TECHNICIAN) — 2026-08-17

- `User.username` String? @unique. Migración `20260817195000_add_username_to_user`. Admin: `admin`.
- Login: `{ identifier, password }` — si tiene `@` busca email; si no, username. Campo `email` sigue funcionando.
- 401 genérico: "Credenciales inválidas"
- Crear/editar técnico: username opcional, regex `^[a-z0-9._]{4,30}$`
- Login.jsx + columna Usuario en Equipo Técnico
- Tests OK: email, `admin`, compat `email`, técnico `uat.user`
- Clientes siguen entrando solo con email

---

## Gráficas premium del dashboard admin — 2026-08-17

- Sin librerías de charts. SVG inline + CSS/Tailwind. Extraído a `DashboardVisuals.jsx`.
- KPIs: counter `requestAnimationFrame` + easeOutQuad, 800ms
- Sparklines Catmull-Rom en Solicitudes (totales/mes) y Clientes (`createdAt`/mes). Pendientes y En proceso: no (estado actual)
- Donut: `strokeDasharray` 1s ease-out; hover/tap expande segmento + tooltip con %; leyenda resaltada
- Barras: cascada 500ms / delay 100ms; tooltip mes+año+cantidad; gradiente vidrio; hover brightness
- Fade 200ms entre vistas (`admin-view-fade`)
- `prefers-reduced-motion`: counters al valor final, resto sin animación
- Bundle `index-DkCCVbjB.js`. `pm2 restart fresh-frontend`

---

## Git — 2026-08-17

- `b74153d8` — Leaflet + técnicos + servicios + responsive
- `56e247d3` — fotos + login username + gráficas premium
- Push a origin + backup

---

## Recap de sesión 2026-08-17 (cierre)

Cerrado en el día: CRUD Servicios, fotos de landing, login por username, gráficas premium del dashboard. Todo en prod.

**Backlog (próximas sesiones)**
1. Testing profundo mapas — múltiples direcciones, zonas rurales, dispositivos reales
2. Panel taller — seguir creciendo hacia centro de control total
3. Mejoras UX — lo que salga de pruebas UAT
4. Chat realtime cliente ↔ taller (roadmap v1.1)
5. SPF/DKIM/DMARC — deliverability de correos

---

## 🔧 2026-08-20/21 — Rediseño minimalista + Resend + catálogo acordeón

### Correo profesional (Resend)
| Cambio | Estado |
|---|---|
| SMTP migrado de Gmail a **Resend** (`smtp.resend.com`) | ✅ |
| FROM: `noreply@pedroservicios.xyz` (dominio propio, no Gmail) | ✅ |
| SPF (`send.pedroservicios.xyz`) | ✅ propagado |
| DKIM (`resend._domainkey`) | ✅ propagado |
| DMARC (`_dmarc`, p=none, reportes a Gmail) | ✅ propagado |
| API Key Resend en `backend/.env` (gitignored) | ✅ |
| pm2 restart fresh-service | ✅ |
| Prueba: 1 correo a inbox ✅, 1 a spam ⚠️ (reputación nueva) | parcial |

**Nota:** los correos ya no salen desde `freshservicedigital2026@gmail.com` sino desde `noreply@pedroservicios.xyz`. La reputación del dominio mejora con el tiempo. DNS administrado en **Dynadot** (dyna-ns.net).

### Home minimalista (Home.jsx)
| Cambio | Estado |
|---|---|
| Eliminada sección "¿Por qué Fresh Service?" (4 bloques + foto + badge 8 años) | ✅ |
| Eliminada sección "Tu servicio en 4 pasos" | ✅ |
| Eliminada sección "Clientes felices" (testimonios) | ✅ |
| Eliminado CTA final "¿Tu aire no enfría como antes?" | ✅ |
| Eliminadas stats "+500 / 8 años / 4.9★" | ✅ |
| Hero: copy nuevo "Aire fresco a tu puerta." + "Reparamos, instalamos y mantenemos. Sin complicaciones." | ✅ |
| Hero: chip cambiado a "SAN JUAN DE LOS MORROS" (sin ícono) | ✅ |
| Hero: quitados blobs de escarcha/frost (blur-3xl), fondo gradiente limpio | ✅ |
| Hero: quitado botón "Ver servicios", solo queda "Solicitar servicio →" | ✅ |
| 3 cards de servicio (Ventana/Split/Toneladas) con precio DESDE y CTA | ✅ |
| Card Toneladas: sin precio (cotización personalizada), texto "3 a 5 toneladas" | ✅ |
| Franja de confianza: 1 línea con 4 ítems (Respuesta / Técnicos / Garantía / Ubicación) | ✅ |

### Catálogo con acordeón (Catalogo.jsx)
| Cambio | Estado |
|---|---|
| 25 tarjetas → 3 secciones acordeón (Ventana / Split / Toneladas) | ✅ |
| Solo 1 sección abierta a la vez, cerradas por defecto | ✅ |
| Header de sección: 1 foto, nombre, subtítulo, badge servicios, precio mínimo, chevron | ✅ |
| Ventana/Split: tabla (Servicio / Descripción / Precio / Solicitar) | ✅ |
| Toneladas: tabla sin precios, botón "Solicitar", nota de cotización personalizada | ✅ |
| Etiquetas toneladas: 3 TON / 4 TON / 5 TON (no 1/2/3) | ✅ |
| Hero/banner oscuro del catálogo → breadcrumb simple | ✅ |
| Texto duplicado eliminado (título ≠ descripción) | ✅ |
| Imágenes repetidas eliminadas (1 foto por sección, no por tarjeta) | ✅ |
| CTA final: "¿Encontraste el servicio que necesitas?" + botón Solicitar | ✅ |

### Componente Price.jsx
- Nuevo size="sm" para celdas compactas de tabla

### Deploy
- Frontend reconstruido y desplegado múltiples veces durante la sesión
- Último bundle: `index-tvdpzh9e.js`
- `pm2 restart fresh-frontend` después de cada build

### Backlog (próximas sesiones)
1. **Imágenes IA para landing** — 7 prompts entregados (DALL-E/Midjourney), falta generar y subir
2. **Carrusel de imágenes** — hero/landing con fotos IA, lazy loading, WebP
3. **Chat realtime** cliente ↔ taller — concepto "Escarchín" (bot fuera de horario + operador en horario), memoria persistente en DB, Socket.IO
4. **Panel taller** — seguir creciendo hacia centro de control total
5. **Testing profundo mapas** — múltiples direcciones, zonas rurales
6. **Git push** — respaldar cambios de esta sesión a origin + backup
7. **Mejorar deliverability email** — reputación Resend se construye con el tiempo

---

## 🎨 2026-08-21 — Rediseño minimalista + Resend + registro + tipografía

### Correo profesional (Resend SMTP)
| Cambio | Estado |
|---|---|
| SMTP migrado de Gmail (`freshservicedigital2026@gmail.com`) a **Resend** (`smtp.resend.com`) | ✅ |
| FROM: `noreply@pedroservicios.xyz` (dominio propio) | ✅ |
| SPF + DKIM + DMARC configurados en DNS Dynadot | ✅ propagados |
| API Key Resend en `backend/.env` (gitignored) | ✅ |
| Prueba: 1 correo inbox ✅, 1 spam ⚠️ (reputación nueva, mejora con el tiempo) | parcial |

### Home minimalista (Home.jsx)
| Cambio | Estado |
|---|---|
| Secciones eliminadas: "¿Por qué Fresh Service?" + "4 pasos" + testimonios + CTA final + stats | ✅ |
| Eslogan: "El servicio que tu hogar merece." con gradient + shimmer sutil 4.5s | ✅ |
| Subtítulo: "Reparación, mantenimiento e instalación de aires acondicionados a domicilio." | ✅ |
| Tipografía: Plus Jakarta Sans (Google Fonts), tracking-tight, contraste bold/extrabold | ✅ |
| Chip: "SAN JUAN DE LOS MORROS" (sin ícono copo de nieve) | ✅ |
| Decoración frost/escarcha eliminada, fondo gradiente limpio | ✅ |
| Botón único "Solicitar servicio →" (quitado "Ver servicios") | ✅ |
| Card Toneladas: sin precio, texto "3 a 5 toneladas" | ✅ |
| Franja confianza: 1 línea con 4 ítems | ✅ |
| Mobile: texto y botón centrados | ✅ |

### Catálogo con acordeón (Catalogo.jsx)
| Cambio | Estado |
|---|---|
| 25 tarjetas → 3 acordeones (Ventana / Split / Toneladas) | ✅ |
| Solo 1 abierto a la vez, cerrados por defecto | ✅ |
| Header: 1 foto, nombre, subtítulo, badge servicios, precio mínimo, chevron | ✅ |
| Ventana/Split: tabla Servicio / Descripción / Precio / Solicitar | ✅ |
| Toneladas: etiquetas 3T/4T/5T, precios OCULTOS, nota cotización personalizada | ✅ |
| Hero/banner oscuro → breadcrumb simple | ✅ |
| Imágenes repetidas eliminadas (1 por sección) | ✅ |

### Registro mejorado (Registro.jsx)
| Cambio | Estado |
|---|---|
| Placeholders: Pedro/Cabeza → Juan/Pérez | ✅ |
| WhatsApp: +58 fijo → dropdown 11 países (default +58 Venezuela) | ✅ |
| Submit usa `form.countryCode` dinámico | ✅ |

### Cache de imágenes (SiteImagesContext.jsx)
| Cambio | Estado |
|---|---|
| Cache en localStorage (`fsd_site_images`) para evitar flash default→custom | ✅ |
| Fallback: cache → API → defaults | ✅ |

### Otros
- Price.jsx: nuevo `size="sm"` para celdas compactas
- Plus Jakarta Sans cargada desde Google Fonts en index.html
- Shimmer CSS en index.css con `prefers-reduced-motion` respetado

### Git
- `d962bedc` — rediseño minimalista + catálogo acordeón + Resend + registro + tipografía
- Push a origin + backup ✅

### Backlog (próximas sesiones)
1. **Imágenes IA** — prompts listos, falta generar (DALL-E/Midjourney) y subir desde panel admin
2. **Carrusel hero** — fotos IA rotando con lazy load
3. **Chat realtime + Escarchín** — bot fuera de horario + operador en horario, Socket.IO, tabla Message
4. **Panel taller** — seguir creciendo
5. **Testing mobile** — verificar todos los cambios en celular real
6. **Deliverability email** — reputación Resend mejora con volumen

---

## ❄️ 2026-08-21 — Chatbot Copito (IA) + Mascota + Hardening

### Chatbot "Copito" — DeepSeek API integrado
| Cambio | Estado |
|---|---|
| Módulo `chat/` en backend NestJS (ChatModule, ChatService, LlmService, ChatTelegramService) | ✅ |
| DeepSeek v4-flash con streaming SSE (tokens en tiempo real al frontend) | ✅ |
| Tool calling: `guardar_contacto` (crea lead + notifica Telegram) | ✅ |
| Tool calling: `consultar_servicios` (precios reales desde DB Service) | ✅ |
| Telegram Bot @copito_fresh_bot (token + chat_id configurados) | ✅ |
| Notificaciones Telegram con botón "Responder por WhatsApp" | ✅ |
| Circuit breaker (3 fallos = 5min cooldown) | ✅ |
| Presupuesto mensual $5 USD (tracked en ChatConversation.estimatedCostUsd) | ✅ |
| Rate limiting: 10 msgs/conversación, 60 msgs/día por IP | ✅ |
| Frontend: widget Copito.jsx con SSE, session management, teaser, reset | ✅ |
| System prompt: español venezolano, solo refrigeración, captura de leads | ✅ |
| Modelos Prisma: ChatConversation, ChatMessage, ChatLead | ✅ |
| Endpoint GET /chat/status + POST /chat (SSE stream) | ✅ |

### Mascota Copito — avatar PNG
| Cambio | Estado |
|---|---|
| Avatar generado en Google Flow (copo de nieve kawaii, gorro, llave, botas) | ✅ |
| Convertido de JPEG a PNG con transparencia real (Pillow flood-fill) | ✅ |
| Widget FAB: PNG reemplaza SVG dibujado a mano | ✅ |
| Header del chat: avatar Copito PNG | ✅ |
| Logo del sitio: Copito reemplaza logo anterior en navbar y footer | ✅ |
| Logo: chip `rounded-xl bg-white/10 p-0.5`, tamaños sm=10 md=12 lg=14 | ✅ |
| CSS parpadeo de ojos (copito-eye) eliminado (ya no hay SVG) | ✅ |

### Hardening — validación + anti-trolls
| Cambio | Estado |
|---|---|
| Filtro de groserías en `guardar_contacto` (~35 palabras ES/EN) | ✅ |
| Validación teléfono venezolano (+58/04XX, códigos 412/414/416/424/426) | ✅ |
| Normalización automática a formato +58 | ✅ |
| Lead basura "Culo" borrado de la DB | ✅ |
| Markdown rendering en mensajes del asistente (negrita, cursiva, saltos) | ✅ |
| System prompt anti-trolls: humor en 1ª, firme en 2ª, corta en 3ª | ✅ |
| Proceso de servicio explicado en 3 pasos al cliente | ✅ |
| Opción "dejar mensaje sin registrarse" para clientes que no dan datos | ✅ |

### Archivos creados/modificados
- `backend/src/chat/` — módulo completo (5 archivos)
- `backend/prisma/schema.prisma` — modelos ChatConversation, ChatMessage, ChatLead
- `frontend-react/src/components/Copito.jsx` — widget completo
- `frontend-react/src/components/PublicLayout.jsx` — integración Copito
- `frontend-react/src/components/Logo.jsx` — avatar Copito como logo
- `frontend-react/src/index.css` — eliminado CSS copito-eye
- `frontend-react/public/copito-avatar.png` — avatar PNG con transparencia

### Prompts entregados al LLM (en `Progresos/`)
- `prompt-copito.md` — integración completa del chatbot (7 partes)
- `prompt-fix-validacion-avatar.md` — fix groserías + teléfono + avatar PNG
- `prompt-logo-copito-markdown.md` — logo Copito + markdown en chat
- `prompt-logo-fino-systemprompt.md` — ajuste fino logo + system prompt anti-trolls
- `prompt-widget-posicion.md` — subir widget en mobile (pendiente de aplicar)

### Pendiente inmediato
- [ ] Widget: subir posición en mobile (`bottom-10` en vez de `bottom-6`)
- [ ] Foto de perfil Telegram para @copito_fresh_bot (via BotFather /setuserpic)
- [ ] Pruebas de estrés del chatbot (lista entregada a Pedro)
- [ ] Git push de todos los cambios Copito

### Cerrado en esta sesión (por Pedro)
- ✅ Foto de perfil Telegram @copito_fresh_bot subida via BotFather
- ✅ Imágenes IA para la landing generadas y subidas
- ✅ Pruebas de estrés en curso (Pedro las hace durante el día)
- ✅ Widget reposicionado en mobile (bottom-10)

---

## Sesión 2026-08-22 — Fix logo Copito (halo gris) + favicons

### Problema diagnosticado

El logo de Copito en el navbar se veia con un fondo gris/oscuro horrible, tanto en desktop como en Android. Pedro lleva 2+ horas con este problema.

**Causa raiz (encontrada tras 6+ iteraciones CSS fallidas):**
La imagen `copito-avatar.png` tenia **265,608 pixeles semi-transparentes** (47% del total). Esto venia de la conversion JPEG→PNG con `rembg`: el modelo de IA deja anti-aliasing (pixeles con alpha entre 1 y 254). Sobre fondo blanco se ven bien, pero sobre el navbar oscuro esos pixeles se renderizan como gris — creando un halo visible alrededor del personaje.

**NO era un problema de CSS.** Se probaron 6+ combinaciones (bg-white, rounded-full, transparent, shadow, etc.) sin resultado porque el problema estaba en la imagen misma.

### Solucion aplicada

1. **Threshold duro de alpha:** Script Python con NumPy — todo pixel con alpha < 128 → transparente (0), alpha >= 128 → opaco (255). Resultado: 0 pixeles semi-transparentes, bordes limpios.
2. **Logo.jsx:** Eliminado `bg-white rounded-full p-0.5 shadow-sm`. Copito flota directo sin contenedor circular. Agregado `drop-shadow` sutil para resaltar en cualquier fondo.
3. **Favicons regenerados:** Todos los archivos favicon (ico, png 16/32/48, apple-touch-icon, icon-512) regenerados desde la imagen limpia. Eliminado `favicon.svg` viejo.
4. **Build + deploy:** `pnpm build && pm2 restart fresh-frontend` ejecutado.

### Archivos modificados
- `frontend-react/public/copito-avatar.png` — imagen limpia, 0 semi-transparentes
- `frontend-react/public/favicon.ico` — Copito multi-size (16/32/48)
- `frontend-react/public/favicon-16.png`, `favicon-32.png`, `favicon-48.png`, `favicon.png`
- `frontend-react/public/apple-touch-icon.png`, `icon-512.png`
- `frontend-react/public/favicon.svg` — ELIMINADO (logo viejo)
- `frontend-react/src/components/Logo.jsx` — sin fondo circular, con drop-shadow

### Leccion aprendida
Cuando una imagen PNG tiene pixeles semi-transparentes de un modelo de IA (rembg/u2net), SIEMPRE aplicar threshold de alpha antes de usar sobre fondos oscuros. No perder tiempo con CSS.

### Cambios adicionales (misma sesión)

**Admin panel — Copito integrado:**
- Sidebar: cambiado /logo.png por /copito-avatar.png sin caja blanca
- Botón "Ver sitio web": icono Globe reemplazado por mini Copito 20×20px
- Import Globe eliminado de lucide-react

**Widget chatbot — animación float:**
- Nuevo keyframe widgetFloat en index.css: sube 10px, ciclo 3s ease-in-out infinite
- Clase animate-widget-float en div wrapper del FAB button
- Se detiene cuando el chat está abierto
- Respeta prefers-reduced-motion

**Carrusel hero — implementación inicial:**
- Componente HeroCarousel.jsx creado con 8 fotos en public/carrusel/
- Reemplaza imagen única del hero en Home.jsx
- Fade suave 700ms, auto-avance cada 5s, dots indicadores
- PENDIENTE: convertir a dinámico con gestión desde panel admin (prompt entregado)

**Archivos modificados:**
- frontend-react/src/pages/AdminDashboard.jsx — sidebar Copito + botón Ver sitio web
- frontend-react/src/components/Copito.jsx — wrapper animate-widget-float
- frontend-react/src/index.css — keyframe widgetFloat + reduced-motion
- frontend-react/src/components/HeroCarousel.jsx — NUEVO componente carrusel
- frontend-react/src/pages/Home.jsx — import HeroCarousel, reemplaza imagen hero

### Carrusel dinámico (completado)

- Tabla `carousel_images` en DB (migración 20260822190000_add_carousel_images)
- 8 fotos sembradas en `backend/uploads/carousel/`
- API: GET /carousel (público), GET /carousel/all, POST, PATCH toggle, DELETE (admin)
- Módulo NestJS: `backend/src/carousel/` (controller, service, module)
- Admin panel: sección "Carrusel de la página principal" en Configuración con Activar/Desactivar y Eliminar
- HeroCarousel.jsx ahora consulta la API, no tiene fotos hardcodeadas
- Si solo hay 1 imagen activa, no muestra dots ni auto-avance
- Si la API falla, usa la foto hero por defecto como fallback

### Archivos nuevos/modificados (carrusel dinámico)
- `backend/prisma/schema.prisma` — modelo CarouselImage
- `backend/prisma/migrations/20260822190000_add_carousel_images/` — migración
- `backend/src/carousel/` — carousel.module.ts, carousel.controller.ts, carousel.service.ts
- `backend/src/app.module.ts` — importa CarouselModule
- `backend/uploads/carousel/` — 8 fotos copiadas desde public/carrusel/
- `frontend-react/src/components/admin/CarouselSection.jsx` — NUEVO, gestión admin
- `frontend-react/src/components/HeroCarousel.jsx` — ahora dinámico via API
- `frontend-react/src/pages/AdminDashboard.jsx` — integra CarouselSection en configuración

### Pendiente
- [x] Fase 2 — Chat Copito en vivo (operador): Socket.IO, vista Chat admin, handoff IA→humano ✅ 2026-08-22
- [ ] Anti-abuso avanzado del chatbot
- [ ] Deliverability email Resend

### Sesión 2026-08-22 (tarde) — Chat en vivo operador

- Namespace Socket.IO `/live-chat` (`ChatGateway`). Operador JWT admin; cliente `sessionId`.
- Prisma: `operatorActive`, `operatorName`, `status`, `unreadByAdmin` (migración `20260822200000_add_live_chat_fields`).
- Si `operatorActive`, POST `/chat` guarda el mensaje y no llama al LLM.
- Admin: menú "Chat en vivo" + `AdminChatView` (tomar control / devolver a Copito).
- Widget: badge EN VIVO + mensajes del operador. Socket.IO público en `api.pedroservicios.xyz/socket.io/` (200).
- JWT login ahora incluye `firstName` (tokens viejos muestran "Operador" hasta re-login).

### Sesión 2026-08-22 (noche) — Imágenes + bloquear/pausar

- Cliente y operador pueden enviar JPG/PNG (1 MB / 2 MB). Máx. 5 fotos por conversación.
- Uploads en `backend/uploads/chat-images/` (gitignored). Endpoints `POST /chat/upload-image` y `POST /chat/operator-upload-image`.
- Operador: Pausar / Reanudar / Bloquear. El widget muestra el aviso y desactiva el input.
- Prisma: `paused`, `blocked`, `imageCount`, `type`, `imageUrl` (migración `20260822213000_add_image_and_moderation`).
- Bundle frontend `index-Bckd59qt.js`. En prod.

### Sesión 2026-08-23 — Samsung 5 MB + archivar/eliminar

- Upload cliente: límite **5 MB** (controller + service). Si Canvas falla, se sube el original.
- Prisma `archived` (migración `20260823010000_add_archived_field`).
- Admin Chat: tabs Activas / Archivadas, Archivar, Restaurar, Eliminar (doble confirmación).
- Bundle `index-Dgq7xq-T.js`. En prod.

### Sesión 2026-08-23 (nocturna) — Imágenes en chat + moderación + modales

**Envío de imágenes bidireccional:**
- Cliente puede enviar fotos desde el widget (botón cámara/galería)
- Operador puede enviar fotos desde el panel admin (botón 📷)
- Compresión automática con Canvas (1024px max, JPEG 0.7)
- Backend: `POST /chat/upload-image` (cliente) y `POST /chat/operator-upload-image` (operador, JWT)
- Archivos en `backend/uploads/chat-images/`
- Migración Prisma: `type` + `imageUrl` en ChatMessage, `imageCount` en ChatConversation
- Límite: 5 imágenes por conversación (cliente), 5MB max por archivo

**Moderación de clientes:**
- Botón **Pausar** (amarillo): desactiva el input del cliente, muestra aviso
- Botón **Reanudar** (azul): restaura la conversación
- Botón **Bloquear** (rojo): cierra la conversación, redirige a WhatsApp
- Eventos Socket.IO: `pauseConversation`, `resumeConversation`, `blockConversation`
- Badges visuales PAUSADA / BLOQUEADA en la lista de conversaciones

**Gestión de conversaciones:**
- Tabs **Activas / Archivadas** en el panel
- Botón **Archivar**: mueve a archivadas sin borrar
- Botón **Restaurar**: devuelve a activas
- Botón **Eliminar**: borra permanentemente (mensajes + conversación) con doble confirmación
- Migración Prisma: `paused`, `blocked`, `archived` en ChatConversation

**Modales profesionales:**
- Componente `ConfirmModal.jsx` reemplaza todos los `confirm()` nativos
- Fondo oscuro con blur, iconos de advertencia, colores por acción
- Se cierra con Escape o click fuera

**Markdown en respuestas IA:**
- `renderMarkdown()` convierte `**texto**` a negrita y `*texto*` a cursiva
- Los precios ya no muestran asteriscos visibles

**Compatibilidad Samsung Galaxy:**
- Backend acepta cualquier `image/*` (no solo JPG/PNG)
- `compressImage` con try/catch y fallback al archivo original
- Frontend sin validación de formato (el Canvas convierte a JPEG)

**Fix Samsung Galaxy (2026-08-23 tarde):** RESUELTO ✅
- Backend convierte todo upload de chat a JPEG 80 / max 1200px (`toJpegBuffer`).
- `sharp` 0.35.3 para WebP/PNG/JPEG/HEIC simple. Fallback `heic-convert` 2.1.0: Sharp trae libvips 8.18.3 y rechaza HEIC Samsung (`ipma box > 16 items`).
- Import CJS `require('sharp')` — el `import` del prompt compilaba a `.default` undefined.
- 2 HEIC Samsung ya en disco convertidos in-place (ahora JPEG real).
- Frontend / gateway / migraciones sin tocar. `pm2 restart fresh-service`. En prod.

**Emoji picker + limpieza (2026-08-23 tarde):** ✅
- Operador: botón 😊 + popover (Comunes / Servicio / Expresiones). Inserta en `draft`.
- `deleteConversation` borra archivos de `uploads/chat-images/` antes de borrar la BD.
- Bundle `index-Ds3sXay7.js`. En prod (backend + frontend).

**Desbloquear conversación (2026-08-23 tarde):** ✅
- Gateway `unblockConversation` + widget escucha `unblocked`.
- Admin: botón 🔓 Desbloquear (modal verde). ConfirmModal ya tenía `green`.
- Bundle `index-0wvei023.js`. En prod.

**Lista chats visual (2026-08-23 tarde):** ✅
- Avatar de color por `sessionId`, borde izquierdo por estado, grupos Hoy/Ayer, zebra + hover.
- Bundle `index-D2l_W1qi.js`. En prod. Solo lista izquierda.

**Commits pendientes:** todos los cambios de esta sesión están en producción pero sin commit formal

### Sesión 2026-08-23 (tarde) — Fix Samsung + moderación completa + UI profesional

**Fix Samsung Galaxy (Sharp backend):**
- Instalado `sharp 0.35.3` + `heic-convert 2.1.0` en el backend
- Método `toJpegBuffer()` convierte CUALQUIER formato (HEIC, WebP, AVIF, TIFF, etc.) a JPEG 1200x1200 calidad 80
- Pipeline: Sharp primero → si falla → heic-convert → si ambos fallan → archivo original
- Backend acepta cualquier `image/*` (no solo JPG/PNG)
- Frontend sin validación de formato (Canvas convierte, backend acepta todo)
- Probado con Samsung Galaxy, POCO X3 Pro, iPhone 11/12/15 — todos funcionan

**Desbloquear conversaciones:**
- Nuevo evento `unblockConversation` en el gateway
- Botón verde "🔓 Desbloquear" con modal de confirmación reemplaza el badge estático
- Widget del cliente reactiva el input al desbloquear

**Emoji picker del operador:**
- Componente `EmojiPicker.jsx` con 27 emojis en 3 categorías (Comunes, Servicio, Expresiones)
- Botón 😊 al lado del input del operador
- Se cierra con Escape o click fuera

**Limpieza de imágenes al eliminar:**
- `deleteConversation` ahora borra los archivos JPG del disco además de la BD
- Usa `unlinkSync` + `existsSync` con try/catch para no bloquear el delete

**Fix restaurar conversaciones:**
- `handleUnarchive` ahora agrega la conversación de vuelta a la lista de activas (antes se perdía)

**Mejoras visuales lista de conversaciones:**
- Avatar con color único por sessionId (10 colores, letra inicial)
- Borde izquierdo por estado: verde=EN VIVO, amarillo=pausada, rojo=bloqueada
- Separadores por fecha: "Hoy", "Ayer", "22 ago."
- Zebra suave: filas alternas con tono diferente
- Funciona en modo claro y oscuro

**Archivos modificados/creados:**
- `backend/src/chat/chat.service.ts` — toJpegBuffer, limpieza imágenes, sharp+heic-convert
- `backend/src/chat/chat.gateway.ts` — evento unblockConversation
- `frontend-react/src/components/admin/AdminChatView.jsx` — avatars, zebra, fecha, desbloquear, fix restaurar
- `frontend-react/src/components/admin/EmojiPicker.jsx` — nuevo componente
- `backend/package.json` — sharp, heic-convert

### Backlog actualizado
1. **Carrusel** — drag-and-drop para reordenar en admin (futuro)
2. **Panel taller** — seguir creciendo
3. **Deliverability email** — reputación Resend mejora con volumen
4. **Anti-abuso avanzado** — seguir entrenando vulnerabilidades del chatbot
5. **Paginación** — cuando haya 10,000+ mensajes agregar paginación en el chat
