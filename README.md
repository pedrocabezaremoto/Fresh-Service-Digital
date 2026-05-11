# ❄ Fresh Service Digital

> Plataforma web de servicios de refrigeración a domicilio — Fase 1: Prototipo UI

**Deploy en producción:** [pedrocabezaremoto.github.io/Fresh-Service-Digital/index.html](https://pedrocabezaremoto.github.io/Fresh-Service-Digital/index.html)  
**Zona de operación:** San Juan de los Morros, estado Guárico, Venezuela

---

## Descripción

**Fresh Service Digital** es una plataforma orientada a ofrecer servicios técnicos de refrigeración y climatización a domicilio. Esta primera iteración es un **prototipo UI completo** desarrollado en HTML5 y CSS puro, sin dependencias de frameworks ni librerías externas.

El sistema cubre el flujo completo del usuario: captación vía Landing Page → exploración de servicios → autenticación → solicitud formal → visualización en panel administrativo.

---

## Vistas del Prototipo

| Archivo | Vista | Descripción |
|---|---|---|
| `index.html` | Landing Page | Carrusel hero + secciones de features y CTA |
| `catalogo.html` | Catálogo de Servicios | Aires de Ventana, Split y Toneladas |
| `login.html` | Inicio de Sesión | Formulario con validación visual |
| `recuperar.html` | Recuperar Contraseña | Flujo de recuperación por correo |
| `registro.html` | Crear Cuenta | Registro de usuario nuevo |
| `solicitud.html` | Solicitar Servicio | Formulario con campos venezolanos (V/E, +58) |
| `dashboard.html` | Panel Administrador | Tabla de solicitudes con datos hardcoded |

---

## Stack Tecnológico

- **HTML5** puro — sin frameworks
- **CSS Vanilla** — sistema de diseño propio con variables CSS
- **JavaScript mínimo** — solo para interactividad de UI (menú hamburguesa)
- **Google Fonts** — Exo 2 (display) + Nunito (body)
- **GitHub Pages** — deploy estático

> ⚠️ Esta fase **no incluye** backend, base de datos, React, Vite ni TypeScript. Todo eso es Fase 2.

---

## Identidad Visual

Paleta basada en refrigeración y congelamiento:

| Token | Color | Uso |
|---|---|---|
| `--white` | `#FFFFFF` | Fondos principales |
| `--ice-50` / `--ice-100` | `#F0F9FF` / `#E0F2FE` | Fondos secundarios |
| `--blue-600` | `#0284C7` | Primario / CTAs |
| `--blue-800` / `--blue-950` | `#075985` / `#082F49` | Footer / fondos oscuros |
| `--text-900` | `#0C1A26` | Texto principal |

Tipografía: **Exo 2** (headings) + **Nunito** (body)

---

## Ejecutar Localmente

No requiere servidor. Abre directamente en cualquier navegador:

```bash
# Opción 1: doble clic en index.html
# Opción 2: servidor local con Python
python3 -m http.server 8080
# Luego abrir: http://localhost:8080
```

---

## Navegación entre Vistas

Todas las vistas están interconectadas mediante `<a href="">` tradicional:

```
index.html → catalogo.html → login.html → registro.html → solicitud.html
                                         ↓
                                    dashboard.html (admin)
```

---

## Estado del Proyecto

- [x] Fase 1 — Prototipo UI completo (HTML5 + CSS puro)
- [ ] Fase 2 — Backend + Supabase + autenticación real
- [ ] Fase 3 — Módulo de Neveras y Refrigeradores
- [ ] Fase 4 — Integración de mapas para geolocalización

---

## Autor

Desarrollado como plataforma piloto para taller de refrigeración en San Juan de los Morros.  
© 2025 Fresh Service Digital · Todos los derechos reservados.
