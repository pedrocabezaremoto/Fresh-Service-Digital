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
