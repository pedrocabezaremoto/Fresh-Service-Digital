# AGENTS.md — Guía para Agentes de IA

> Contexto técnico estricto para cualquier agente (Claude, Copilot, Cursor, etc.) que trabaje sobre este repositorio.

---

## 🧠 ¿Qué es este proyecto?

**Fresh Service Digital** — Plataforma de servicios de refrigeración a domicilio.  
**Zona piloto:** San Juan de los Morros, Venezuela.

> [!IMPORTANT]
> **ACTUALIZADO 2026-06-24 — Fase 2 (producción real).** Las reglas de "solo HTML/CSS, prohibido React/Vite/Tailwind" de abajo eran de la **Fase 1 (mockup)** y **ya NO aplican**. El proyecto migró:
> - **Frontend nuevo:** React 19 + Vite 6 + Tailwind v4 en `frontend-react/` → EN VIVO en **https://fresh.pedroservicios.xyz**. Es el frontend oficial. El HTML/CSS viejo (`index.html`, `views/`) queda como referencia histórica.
> - **Backend:** NestJS + Prisma + PostgreSQL con JWT/bcrypt → **https://api.pedroservicios.xyz** (pm2 `fresh-service`, puerto 4000).
> - **Deploy:** VPS Contabo, Traefik (configs en `/etc/easypanel/traefik/config/`), pm2, ufw para abrir puertos a Docker. NO correr nginx (ocupa el puerto 80 de Traefik).
> - Stack y comandos: ver `History/historial.md` (Fase 8) y la memoria del proyecto.

**Fase histórica:** 1 (Prototipo visual estático en HTML/CSS — superada).

> [!WARNING]
> **2026-07-26 — Migración npm → pnpm EN CURSO (seguridad supply-chain).**
> El gestor de paquetes del proyecto pasa de **npm a pnpm** (npm tuvo un incidente de paquetes
> comprometidos; pnpm bloquea los scripts `postinstall` por defecto).
> - **Guía obligatoria:** ver **`Cambio-pnpm.md`** en la raíz. Cualquier agente que instale o
>   construya el proyecto debe usar **`pnpm`**, NO `npm`/`npx`.
> - Comandos: `pnpm install --frozen-lockfile`, `pnpm run build`, `pnpm exec prisma ...`.
> - **No** volver a generar `package-lock.json`. El lockfile válido es `pnpm-lock.yaml`.
> - La ejecución de esta migración la hace un LLM externo; Claude es el revisor.

---

## 🚫 REGLAS ESTRICTAS — Lee esto primero

> [!IMPORTANT]
> **Nota sobre la Arquitectura:** El uso de React, frameworks y herramientas avanzadas está planificado para una **fase posterior** del proyecto. En este momento, se trabaja **estrictamente en HTML5 y CSS puro** con el único objetivo de presentar un bosquejo (mockup) visual y funcional rápido a los clientes.

### Lo que NO debes hacer en esta fase:

1. **NO introducir frameworks.** Este proyecto es HTML5 + CSS puro deliberadamente. Prohibido sugerir o agregar React, Vue, Vite, TypeScript, Tailwind o cualquier bundler.
2. **NO conectar a Supabase ni ningún backend.** Toda la data es hardcoded. Eso es intencional para la Fase 1.
3. **NO cambiar la paleta de colores.** La paleta azul hielo fue diseñada específicamente. Los tokens CSS en `styles.css` son la fuente de verdad. No los "modernices" con temas oscuros genéricos.
4. **NO romper la navegación HTML.** La navegación entre vistas usa `<a href="">` tradicional. No convertir a SPA ni routing dinámico.
5. **NO agregar dependencias externas** (npm, CDN de componentes, etc.) sin aprobación explícita del autor.
6. **NO tocar `styles.css` de forma destructiva.** Es el sistema de diseño global compartido. Cambios aquí afectan todas las vistas.

---

## ✅ Qué SÍ puedes hacer

- Corregir bugs de HTML/CSS puntuales
- Mejorar accesibilidad (aria-labels, roles semánticos)
- Agregar mejoras de UX en formularios (validación visual JS mínimo)
- Optimizar el CSS sin romper los tokens existentes
- Documentar

---

## 📂 Estructura del Proyecto

```
Fresh-Service-Digital/
├── index.html        # Landing Page — Hero carrusel, features, CTA
├── styles.css        # Sistema de diseño global — NO modificar sin análisis
└── views/            # Vistas/Páginas secundarias de la plataforma
    ├── catalogo.html     # Catálogo de Servicios AC (Ventana, Split, Toneladas)
    ├── login.html        # Inicio de sesión
    ├── recuperar.html    # Recuperación de contraseña
    ├── registro.html     # Registro de usuario nuevo
    ├── solicitud.html    # Formulario de solicitud a domicilio
    └── dashboard.html    # Panel admin (datos hardcoded simulados)
```

---

## 🎨 Sistema de Diseño

### Tokens principales (en `styles.css`)

```css
--white:        #FFFFFF;       /* Fondos */
--ice-50:       #F0F9FF;       /* Fondo global */
--ice-100:      #E0F2FE;       /* Fondos secundarios */
--ice-200:      #BAE6FD;       /* Bordes */
--blue-400:     #38BDF8;       /* Acentos claros */
--blue-600:     #0284C7;       /* Color primario / CTAs */
--blue-800:     #075985;       /* Textos oscuros / encabezados */
--blue-950:     #082F49;       /* Footer */
--text-900:     #0C1A26;       /* Texto principal */
--text-500:     #4A7A9B;       /* Texto secundario */
```

### Tipografía

- **Display:** `Exo 2` — Headings, brand, títulos de sección
- **Body:** `Nunito` — Párrafos, labels, botones

### Cargada desde Google Fonts en `styles.css` línea 7.

---

## 🔗 Mapa de Navegación

```
index.html (Landing)
  ├── → views/catalogo.html     (Servicios)
  ├── → views/login.html        (Autenticación)
  │       └── → views/registro.html   (Registro)
  │       └── → views/recuperar.html  (Recuperar clave)
  ├── → views/solicitud.html    (Solicitar Servicio — requiere cuenta)
  └── → views/dashboard.html    (Admin — acceso desde footer)
```

---

## 🇻🇪 Contexto Local (Venezuela)

- **Cédula:** Formato selector `V` / `E` + número. No cambiar este patrón.
- **Teléfono:** Prefijo fijo `+58` + operadora (412, 414, 424, 416, 426). Campo WhatsApp.
- **Dirección:** Campo de texto libre (integración de mapas es Fase futura).
- **Idioma:** Español venezolano en toda la UI. No traducir al español neutro ni al inglés.

---

## 📍 Estado de Fases

| Fase | Estado | Descripción |
|---|---|---|
| **Fase 1** | ✅ Completa | Prototipo UI — HTML5 + CSS puro |
| **Fase 2** | 🔜 Pendiente | Backend real + Supabase + Auth |
| **Fase 3** | 🔜 Pendiente | Módulo Neveras y Refrigeradores |
| **Fase 4** | 🔜 Pendiente | Geolocalización / mapas |

---

## ⚙️ Deploy

- **Plataforma:** GitHub Pages (deploy estático)
- **URL:** `https://pedrocabezaremoto.github.io/Fresh-Service-Digital/index.html`
- **Rama:** `main` (directamente, sin build step)
- No hay proceso de build. Los archivos HTML/CSS se sirven tal cual.

---

## 🤝 Filosofía de esta Fase

> "Primero el bosquejo visual funcional. La lógica viene en Fase 2."

El objetivo de esta fase es demostrar el flujo completo del usuario de forma visual y navegable, sin preocupación por persistencia de datos ni autenticación real. Cualquier agente debe respetar esta filosofía y **no over-engineerear** la solución.
