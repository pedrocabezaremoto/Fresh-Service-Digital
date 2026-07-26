# Fresh Service Digital — Material de estudio FRONTEND (Defensa)

> Archivo listo para copiar/pegar. Contiene: conceptos para defender + código fuente completo del frontend React.
> Ruta del proyecto: `frontend-react/`
> URL producción: https://fresh.pedroservicios.xyz
> API: https://api.pedroservicios.xyz

---

## 1. ¿Qué es el frontend?

SPA (Single Page Application) de **servicios de refrigeración a domicilio** para San Juan de los Morros.
Stack: **React 19 + Vite 6 + Tailwind CSS v4 + React Router 7 + Lucide icons**.

Flujo del usuario:
1. Landing (`/`) → Catálogo (`/catalogo`)
2. Registro/Login → Solicitud de servicio (`/solicitud`)
3. Panel cliente (`/panel`) → Proforma (`/proforma`)
4. Roles: CLIENT → `/panel` | TECHNICIAN → `/tecnico` | ADMIN → `/admin`

---

## 2. Stack y por qué (preguntas típicas de defensa)

| Tecnología | Para qué |
|---|---|
| React 19 | UI por componentes, estado, hooks |
| Vite 6 | Bundler rápido, HMR, build de producción |
| Tailwind v4 | Utilidades CSS + tokens de marca en `@theme` |
| React Router 7 | Rutas SPA, layouts, rutas protegidas |
| Lucide React | Iconos SVG |
| Context API | Auth, tema (dark/light), tasa BCV |
| Fetch nativo | Llamadas HTTP al backend NestJS (sin Axios) |
| localStorage | Persistir JWT (`fsd_token`) y usuario (`fsd_user`) |

**¿Por qué no Next.js?** Proyecto SPA puro desplegado estático detrás de Traefik; Vite basta.
**¿Por qué Context y no Redux?** Estado global pequeño (user, theme, rate). Context es suficiente.

---

## 3. Estructura de carpetas

```
frontend-react/
├── index.html              # Shell HTML + meta OG + fuentes
├── package.json
├── vite.config.js          # puerto 5174, plugins React + Tailwind
├── public/                 # logo, favicons, imágenes AC
└── src/
    ├── main.jsx            # Bootstrap: Router + Providers
    ├── App.jsx             # Definición de rutas
    ├── index.css           # Design system Tailwind v4
    ├── context/
    │   ├── AuthContext.jsx     # login/logout/roles JWT
    │   ├── ThemeContext.jsx    # dark/light mode
    │   └── RateContext.jsx     # tasa BCV USD→Bs
    ├── lib/
    │   ├── api.js              # cliente HTTP centralizado
    │   ├── prices.js           # tabla precios USD
    │   ├── money.js            # formatUsd / formatBs
    │   ├── status.js           # estados de cita + labels
    │   └── images.js           # rutas de imágenes
    ├── components/
    │   ├── Navbar, Footer, Logo, Button, Price
    │   ├── AuthShell, PublicLayout, ProtectedRoute
    └── pages/
        ├── Home, Catalogo, Solicitud
        ├── Login, Registro, Recuperar, Restablecer
        ├── ClienteDashboard, Proforma
        ├── AdminDashboard, TecnicoDashboard
```

---

## 4. Arquitectura (diagrama mental)

```
main.jsx
  └── BrowserRouter
        └── ThemeProvider
              └── AuthProvider
                    └── RateProvider
                          └── App (Routes)
                                ├── /login, /registro, /recuperar, /restablecer  (AuthShell)
                                ├── /admin      (ProtectedRoute requireAdmin)
                                ├── /tecnico    (ProtectedRoute requireTechnician)
                                ├── /proforma   (ProtectedRoute)
                                └── PublicLayout (Navbar + Outlet + Footer)
                                      ├── /
                                      ├── /catalogo
                                      ├── /solicitud  (ProtectedRoute → registro)
                                      └── /panel      (ProtectedRoute)
```

---

## 5. Conceptos clave para la defensa (memorizar)

### 5.1 Autenticación
- Login llama `POST /users/login` → recibe `accessToken` + `user`.
- Token en `localStorage` como `fsd_token`.
- Cada request autenticada manda `Authorization: Bearer <token>`.
- Roles: `ADMIN`, `TECHNICIAN`, `CLIENT` (o sin role especial = cliente).
- `ProtectedRoute` espera `ready`, valida sesión y rol, redirige si falla.

### 5.2 Precios y BCV
- Precios se **guardan en USD** (`prices.js` / backend).
- `RateContext` pide `GET /rate` al montar la app.
- Componente `<Price usd={n} />` muestra **Bs grande + Ref. USD**.
- Si falla la tasa → fallback solo USD.

### 5.3 Solicitud de servicio
- Formulario venezolano: cédula V/E, WhatsApp +58 + prefijos 412/414/424/416/426.
- `priceUsd(equipo, servicio)` calcula el monto.
- `POST /appointments` con JWT.
- Genera referencia `#FSD-XXXXXXXX`.

### 5.4 Paneles por rol
- **Cliente:** historial, stats, total a pagar, proforma imprimible.
- **Técnico:** reclamar trabajos (`assignTechnician`), cambiar estado (IN_PROGRESS → COMPLETED).
- **Admin:** KPIs, donut, filtros, asignar técnico, CRUD clientes, ingresos, export CSV.

### 5.5 Estados de una cita (`lib/status.js`)
`PENDING` → `ASSIGNED` → `IN_PROGRESS` → `COMPLETED` (o `CANCELLED`).

### 5.6 Detección de entorno API
```js
localhost / 127.0.0.1 → http://localhost:4000
producción            → https://api.pedroservicios.xyz
```

### 5.7 Design system
- Fuentes: **Sora** (display) + **Inter** (body).
- Paleta frost/hielo: `brand-600 #0284C7`, `brand-950 #082F49`.
- Utilidades propias: `.bg-brand-gradient`, `.text-gradient`, `.shadow-glow`, `.sheen`.
- Dark mode: clase `.dark-mode` en `<html>` vía ThemeContext.

---

## 6. Rutas (mapa completo)

| Ruta | Página | Auth | Rol |
|---|---|---|---|
| `/` | Home | No | — |
| `/catalogo` | Catálogo | No | — |
| `/login` | Login | No | — |
| `/registro` | Registro | No | — |
| `/recuperar` | Forgot password | No | — |
| `/restablecer?token=` | Reset password | No | — |
| `/solicitud` | Formulario cita | Sí | Cualquiera (redirige a registro) |
| `/panel` | Dashboard cliente | Sí | Cliente |
| `/proforma` | Proforma PDF/print | Sí | Cliente |
| `/tecnico` | Panel técnico | Sí | TECHNICIAN |
| `/admin` | Panel taller | Sí | ADMIN |
| `*` | Redirect a `/` | — | — |

---

## 7. Endpoints que consume el frontend (`lib/api.js`)

| Método | Path | Uso |
|---|---|---|
| POST | `/users/register` | Registro |
| POST | `/users/login` | Login |
| POST | `/users/forgot-password` | Recuperar |
| POST | `/users/reset-password` | Restablecer |
| GET | `/users` | Lista clientes (admin) |
| GET | `/users/technicians` | Técnicos (admin) |
| PATCH | `/users/:id` | Editar usuario |
| DELETE | `/users/:id` | Eliminar usuario |
| POST | `/appointments` | Crear solicitud |
| GET | `/appointments` | Todas (admin/técnico) |
| GET | `/appointments/client/:id` | Del cliente |
| PATCH | `/appointments/:id/status` | Cambiar estado |
| PATCH | `/appointments/:id/assign` | Asignar técnico |
| GET | `/rate` | Tasa BCV |

---

## 8. Cómo correrlo

```bash
cd frontend-react
pnpm install
pnpm run dev      # http://localhost:5174
pnpm run build    # dist/
pnpm run preview
```

---

## 9. Respuestas cortas tipo oral

**¿Qué hace AuthContext?**
Guarda el usuario logueado, expone `login`, `logout`, `patchUser`, flags `isAdmin`/`isTechnician`, y sincroniza con localStorage.

**¿Cómo proteges rutas?**
Componente `ProtectedRoute` que lee el contexto; si no hay sesión redirige a login; si pide admin/técnico y el rol no coincide, manda a `/panel`.

**¿Dónde viven los precios?**
Tabla estática en `lib/prices.js` (USD). El backend también los recibe en `priceUsd` al crear la cita. La UI convierte a Bs con la tasa BCV.

**¿Qué es AuthShell?**
Layout split (marca + formulario) reutilizado por Login, Registro, Recuperar y Restablecer.

**¿Qué es PublicLayout?**
Navbar fija + `<Outlet />` + Footer para páginas públicas/cliente.

**¿Cómo funciona el dark mode?**
`ThemeContext` pone/quita clase `dark-mode` en `document.documentElement`. CSS en `index.css` redefine tokens.

**¿SPA o MPA?**
SPA: un solo `index.html`, React Router cambia vistas sin recargar.

---

## 10. CÓDIGO FUENTE COMPLETO (copiar/pegar)

A continuación todo el código del frontend React, archivo por archivo.


---

## ARCHIVO: `frontend-react/package.json`

```json
{
  "name": "fresh-service-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "description": "Frontend React + Vite + Tailwind para Fresh Service Digital",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "lucide-react": "^0.475.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.1.5"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.6",
    "@vitejs/plugin-react": "^4.3.4",
    "tailwindcss": "^4.0.6",
    "vite": "^6.1.0"
  }
}

```

---

## ARCHIVO: `frontend-react/vite.config.js`

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    host: true,
  },
});

```

---

## ARCHIVO: `frontend-react/index.html`

```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" href="/favicon.ico" sizes="any" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Fresh Service Digital — Servicio técnico de refrigeración y climatización a domicilio en San Juan de los Morros. Reparación, mantenimiento e instalación de aires acondicionados." />
    <!-- Open Graph (vista previa al compartir en WhatsApp/redes) -->
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Fresh Service Digital" />
    <meta property="og:title" content="Fresh Service Digital — Refrigeración a Domicilio" />
    <meta property="og:description" content="Reparación, mantenimiento e instalación de aires acondicionados a domicilio en San Juan de los Morros. Agenda en minutos, técnicos certificados y garantía." />
    <meta property="og:url" content="https://fresh.pedroservicios.xyz" />
    <meta property="og:image" content="https://fresh.pedroservicios.xyz/icon-512.png" />
    <meta property="og:locale" content="es_VE" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="Fresh Service Digital — Refrigeración a Domicilio" />
    <meta name="twitter:description" content="Aires acondicionados a domicilio. Agenda en minutos con técnicos certificados." />
    <meta name="twitter:image" content="https://fresh.pedroservicios.xyz/icon-512.png" />
    <title>Fresh Service Digital — Refrigeración a Domicilio</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>

```

---

## ARCHIVO: `frontend-react/src/main.jsx`

```javascript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { RateProvider } from './context/RateContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <RateProvider>
            <App />
          </RateProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);

```

---

## ARCHIVO: `frontend-react/src/App.jsx`

```javascript
import { Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from './components/PublicLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Catalogo from './pages/Catalogo';
import Login from './pages/Login';
import Registro from './pages/Registro';
import Recuperar from './pages/Recuperar';
import Restablecer from './pages/Restablecer';
import Solicitud from './pages/Solicitud';
import ClienteDashboard from './pages/ClienteDashboard';
import Proforma from './pages/Proforma';
import AdminDashboard from './pages/AdminDashboard';
import TecnicoDashboard from './pages/TecnicoDashboard';

export default function App() {
  return (
    <Routes>
      {/* Auth (sin layout público) */}
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/recuperar" element={<Recuperar />} />
      <Route path="/restablecer" element={<Restablecer />} />

      {/* Panel admin (pantalla completa con sidebar propio) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAdmin>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Proforma imprimible (pantalla completa, sin navbar) */}
      <Route
        path="/proforma"
        element={
          <ProtectedRoute>
            <Proforma />
          </ProtectedRoute>
        }
      />

      {/* Panel técnico (pantalla completa similar a admin) */}
      <Route
        path="/tecnico"
        element={
          <ProtectedRoute requireTechnician>
            <TecnicoDashboard />
          </ProtectedRoute>
        }
      />

      {/* Páginas con navbar + footer */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/catalogo" element={<Catalogo />} />
        <Route
          path="/solicitud"
          element={
            <ProtectedRoute redirectTo="/registro">
              <Solicitud />
            </ProtectedRoute>
          }
        />
        <Route
          path="/panel"
          element={
            <ProtectedRoute>
              <ClienteDashboard />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

```

---

## ARCHIVO: `frontend-react/src/index.css`

```css
@import "tailwindcss";

/* =====================================================
   FRESH SERVICE DIGITAL — Sistema de diseño (Tailwind v4)
   Identidad: frost / hielo premium · azul cian con brillo
   ===================================================== */
@theme {
  --font-display: "Sora", ui-sans-serif, system-ui, sans-serif;
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;

  /* Marca — escala frost (cian → azul) */
  --color-frost-50: #ecfeff;
  --color-frost-100: #cffafe;
  --color-frost-200: #a5f3fc;
  --color-frost-300: #67e8f9;
  --color-frost-400: #22d3ee;
  --color-frost-500: #06b6d4;

  --color-brand-50: #f0f9ff;
  --color-brand-100: #e0f2fe;
  --color-brand-200: #bae6fd;
  --color-brand-300: #7dd3fc;
  --color-brand-400: #38bdf8;
  --color-brand-500: #0ea5e9;
  --color-brand-600: #0284c7;
  --color-brand-700: #0369a1;
  --color-brand-800: #075985;
  --color-brand-900: #0c4a6e;
  --color-brand-950: #082f49;

  --color-ink-900: #0b1a26;
  --color-ink-700: #1e3a4f;
  --color-ink-500: #4a7a9b;

  --shadow-glow: 0 8px 30px -4px rgba(14, 165, 233, 0.45);
  --shadow-glow-lg: 0 0 0 1px rgba(56, 189, 248, 0.3),
    0 16px 50px -8px rgba(14, 165, 233, 0.55);

  --radius-xl2: 1.5rem;
}

@layer base {
  html {
    scroll-behavior: smooth;
  }
  body {
    @apply bg-white text-ink-900 antialiased;
    font-family: var(--font-sans);
  }
  h1, h2, h3, h4 {
    font-family: var(--font-display);
    letter-spacing: -0.02em;
  }
  ::selection {
    background: var(--color-brand-400);
    color: #fff;
  }
}

@layer utilities {
  /* Texto con degradado de marca */
  .text-gradient {
    background: linear-gradient(120deg, #0ea5e9, #22d3ee 60%, #67e8f9);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  /* Fondo degradado de marca */
  .bg-brand-gradient {
    background-image: linear-gradient(135deg, #0284c7 0%, #0ea5e9 45%, #38bdf8 100%);
  }
  .bg-brand-gradient-bright {
    background-image: linear-gradient(135deg, #0ea5e9 0%, #38bdf8 55%, #22d3ee 100%);
  }
  /* Vidrio esmerilado */
  .glass {
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(16px) saturate(160%);
    -webkit-backdrop-filter: blur(16px) saturate(160%);
    border: 1px solid rgba(255, 255, 255, 0.6);
  }
  .glass-dark {
    background: rgba(8, 47, 73, 0.55);
    backdrop-filter: blur(16px) saturate(160%);
    -webkit-backdrop-filter: blur(16px) saturate(160%);
    border: 1px solid rgba(56, 189, 248, 0.22);
  }
  /* Brillo */
  .shadow-glow {
    box-shadow: var(--shadow-glow);
  }
  .shadow-glow-lg {
    box-shadow: var(--shadow-glow-lg);
  }
  /* Sheen sutil para botones/cuadros */
  .sheen {
    position: relative;
    overflow: hidden;
  }
  .sheen::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0) 55%);
    pointer-events: none;
  }
  .animate-float {
    animation: float 6s ease-in-out infinite;
  }
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-12px); }
  }
  /* Float suave para el logo (footer) */
  .animate-logo-float {
    animation: logoFloat 3.4s ease-in-out infinite;
    will-change: transform;
  }
  @keyframes logoFloat {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
  }
}

/* Respeta a quien prefiere menos movimiento */
@media (prefers-reduced-motion: reduce) {
  .animate-logo-float { animation: none; }
}

/* =====================================================
   SOPORTE PARA MODO OSCURO (DARK MODE)
   ===================================================== */

/* Registro de variante clase de dark mode para Tailwind v4 */
@variant dark (&:where(.dark-mode, .dark-mode *));

.dark-mode {
  /* Sobrescribir solo variables de texto y contenedores semánticos */
  --color-brand-50: #082f49;       /* Fondo global de la página */
  
  --color-ink-900: #f8fafc;        /* Texto principal claro */
  --color-ink-700: #cbd5e1;        /* Texto secundario */
  --color-ink-500: #94a3b8;        /* Texto secundario atenuado */
  
  --color-slate-100: #075985;      /* Bordes divisores en layouts */
  --color-slate-50: #0b1a26;       /* Fondos alternativos */
}

/* Evitar colisión de text-white: no sobrescribimos --color-white globalmente, 
   sino que cambiamos el fondo de los elementos .bg-white en modo oscuro */
.dark-mode .bg-white {
  background-color: #0b1a26 !important;
}

.dark-mode .bg-white\/90 {
  background-color: rgba(11, 26, 38, 0.9) !important;
}

/* Cambiar los fondos de marca semánticos en modo oscuro */
.dark-mode .bg-brand-50 {
  background-color: #082f49 !important;
}

.dark-mode .bg-brand-100 {
  background-color: #0c4a6e !important;
}

.dark-mode .border-brand-100,
.dark-mode .ring-brand-100 {
  border-color: #075985 !important;
  --tw-ring-color: #075985 !important;
}

/* Corregir texto del Logo en el navbar oscuro */
.dark-mode .text-brand-950 {
  color: var(--color-ink-900) !important;
}

/* Ajustes finos de UI en modo oscuro para campos de entrada */
.dark-mode input, 
.dark-mode select, 
.dark-mode textarea {
  background-color: #0c4a6e !important;
  border-color: #075985 !important;
  color: var(--color-ink-900) !important;
}

.dark-mode input::placeholder, 
.dark-mode select::placeholder, 
.dark-mode textarea::placeholder {
  color: rgba(248, 250, 252, 0.4) !important;
}

/* Ajustar los bordes de cabecera y footer */
.dark-mode header, 
.dark-mode footer {
  border-color: #075985 !important;
}

/* Ajustar el fondo de las tarjetas de vidrio (glass) en modo oscuro */
.dark-mode .glass {
  background: rgba(8, 47, 73, 0.55) !important;
  border-color: rgba(56, 189, 248, 0.22) !important;
}

/* Ajustes para forzar la legibilidad de colores de texto personalizados en modo oscuro */
.dark-mode .text-ink-900 { color: #f8fafc !important; }
.dark-mode .text-ink-700 { color: #cbd5e1 !important; }
.dark-mode .text-ink-500 { color: #94a3b8 !important; }
.dark-mode .text-brand-900 { color: #bae6fd !important; }
.dark-mode .text-brand-800 { color: #38bdf8 !important; }
.dark-mode .text-brand-700 { color: #0ea5e9 !important; }

```

---

## ARCHIVO: `frontend-react/src/lib/api.js`

```javascript
/* Servicio centralizado de API — Fresh Service Digital
   Detecta entorno: local usa el puerto 4000, producción el subdominio del VPS. */
const isLocal =
  ['localhost', '127.0.0.1', ''].includes(window.location.hostname) ||
  window.location.protocol === 'file:';

export const API_BASE = isLocal
  ? 'http://localhost:4000'
  : 'https://api.pedroservicios.xyz';

function getToken() {
  return localStorage.getItem('fsd_token');
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const message =
      (data && data.message) ||
      (Array.isArray(data?.message) ? data.message.join(', ') : null) ||
      'Ocurrió un error en el servidor';
    const err = new Error(Array.isArray(message) ? message.join(', ') : message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  // Auth
  register: (payload) => request('/users/register', { method: 'POST', body: payload }),
  login: (payload) => request('/users/login', { method: 'POST', body: payload }),

  // Usuarios (admin)
  forgotPassword: (email) => request('/users/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (token, password) => request('/users/reset-password', { method: 'POST', body: { token, password } }),
  getClients: () => request('/users', { auth: true }),
  getTechnicians: () => request('/users/technicians', { auth: true }),
  updateUser: (id, data) => request(`/users/${id}`, { method: 'PATCH', body: data, auth: true }),
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE', auth: true }),

  // Citas
  createAppointment: (payload) =>
    request('/appointments', { method: 'POST', body: payload, auth: true }),
  getAllAppointments: () => request('/appointments', { auth: true }),
  getClientAppointments: (clientId) =>
    request(`/appointments/client/${clientId}`, { auth: true }),
  updateStatus: (id, status) =>
    request(`/appointments/${id}/status`, { method: 'PATCH', body: { status }, auth: true }),
  assignTechnician: (id, technicianId) =>
    request(`/appointments/${id}/assign`, { method: 'PATCH', body: { technicianId }, auth: true }),
};

```

---

## ARCHIVO: `frontend-react/src/lib/prices.js`

```javascript
// Fuente ÚNICA de precios en USD por (equipo, servicio).
// Coincide con el catálogo para los servicios compartidos y cubre los demás con lógica
// (reparación > mantenimiento, instalación la más cara, diagnóstico la más barata).

const PRICES = {
  'Aire de Ventana':  { 'Mantenimiento Preventivo': 25, 'Reparación': 40,  'Diagnóstico': 15, 'Recarga de Gas': 30,  'Instalación': 45 },
  'Aire Split':       { 'Mantenimiento Preventivo': 35, 'Reparación': 55,  'Diagnóstico': 20, 'Recarga de Gas': 40,  'Instalación': 70 },
  'Aire 1 Tonelada':  { 'Mantenimiento Preventivo': 50, 'Reparación': 75,  'Diagnóstico': 30, 'Recarga de Gas': 55,  'Instalación': 90 },
  'Aire 2 Toneladas': { 'Mantenimiento Preventivo': 75, 'Reparación': 110, 'Diagnóstico': 40, 'Recarga de Gas': 80,  'Instalación': 130 },
  'Aire 3 Toneladas': { 'Mantenimiento Preventivo': 100,'Reparación': 150, 'Diagnóstico': 55, 'Recarga de Gas': 105, 'Instalación': 170 },
};

const DEFAULT_USD = 30;

/** Precio USD para un (equipo, servicio). Si no está en la tabla, usa un default lógico. */
export function priceUsd(brand, model) {
  return PRICES[brand]?.[model] ?? DEFAULT_USD;
}

```

---

## ARCHIVO: `frontend-react/src/lib/money.js`

```javascript
// Formato de precios: se guardan en USD y se muestran en Bs a la tasa BCV.

export function formatUsd(usd) {
  const n = Number(usd || 0);
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export function formatBs(usd, rate) {
  if (!rate) return null;
  return 'Bs ' + (usd * rate).toLocaleString('es-VE', { maximumFractionDigits: 2 });
}

```

---

## ARCHIVO: `frontend-react/src/lib/status.js`

```javascript
export const STATUS = {
  PENDING: { label: 'Pendiente', cls: 'bg-amber-100 text-amber-700', dot: '#f59e0b' },
  ASSIGNED: { label: 'Asignada', cls: 'bg-blue-100 text-blue-700', dot: '#3b82f6' },
  IN_PROGRESS: { label: 'En proceso', cls: 'bg-violet-100 text-violet-700', dot: '#8b5cf6' },
  COMPLETED: { label: 'Completada', cls: 'bg-emerald-100 text-emerald-700', dot: '#10b981' },
  CANCELLED: { label: 'Cancelada', cls: 'bg-rose-100 text-rose-700', dot: '#ef4444' },
};

export function fmtDate(d) {
  return new Date(d).toLocaleDateString('es-VE');
}
export function fmtTime(d) {
  return new Date(d).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
}

```

---

## ARCHIVO: `frontend-react/src/lib/images.js`

```javascript
/* Imágenes de stock para refrigeración.
   Las imágenes de servicios AC están en public/ (generadas localmente).
   Las demás usan Unsplash con IDs verificados. */
const U = (id, w = 1000) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const IMG = {
  technician: '/img-tech-ac.png', // técnico haciendo mantenimiento a un split
  repair: '/img-tonnage-ac.png', // Aires por Toneladas (condensadores industriales)
  maintenance: '/img-window-ac.png', // Aires de Ventana (unidad de ventana)
  install: '/img-split-ac.png', // Aires Split (split mural)
  comfort: U('photo-1599696848652-f0ff23bc911f', 1200), // interior confortable
  appliance: U('photo-1565538810643-b5bdb714032a', 900), // electrodoméstico (neveras)
  heroTech: '/img-tech-ac.png',
};


```

---

## ARCHIVO: `frontend-react/src/context/AuthContext.jsx`

```javascript
import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('fsd_user');
      if (raw) setUser(JSON.parse(raw));
    } catch {
      /* noop */
    }
    setReady(true);
  }, []);

  async function login(email, password) {
    const data = await api.login({ email, password });
    if (data.accessToken) localStorage.setItem('fsd_token', data.accessToken);
    localStorage.setItem('fsd_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem('fsd_token');
    localStorage.removeItem('fsd_user');
    setUser(null);
  }

  // Actualiza campos del usuario en memoria + localStorage (ej. guardar la cédula)
  function patchUser(fields) {
    setUser((prev) => {
      const next = { ...(prev || {}), ...fields };
      localStorage.setItem('fsd_user', JSON.stringify(next));
      return next;
    });
  }

  const value = {
    user,
    ready,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    isTechnician: user?.role === 'TECHNICIAN',
    login,
    logout,
    patchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}

```

---

## ARCHIVO: `frontend-react/src/context/ThemeContext.jsx`

```javascript
import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark-mode');
    } else {
      root.classList.remove('dark-mode');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

```

---

## ARCHIVO: `frontend-react/src/context/RateContext.jsx`

```javascript
import { useState, useEffect, createContext, useContext } from 'react';
import { API_BASE } from '../lib/api';

/** Tasa oficial BCV (USD→Bs). Se carga una sola vez al abrir la app. */
const RateContext = createContext({ rate: null, date: null });

export function RateProvider({ children }) {
  const [data, setData] = useState({ rate: null, date: null });

  useEffect(() => {
    fetch(`${API_BASE}/rate`)
      .then((r) => r.json())
      .then((d) => setData({ rate: d.rate, date: d.date }))
      .catch(() => {
        /* si falla, los precios se muestran en USD (fallback en Price) */
      });
  }, []);

  return <RateContext.Provider value={data}>{children}</RateContext.Provider>;
}

export const useRate = () => useContext(RateContext);

```

---

## ARCHIVO: `frontend-react/src/components/ProtectedRoute.jsx`

```javascript
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requireAdmin = false, requireTechnician = false, redirectTo = '/login' }) {
  const { isAuthenticated, isAdmin, isTechnician, ready } = useAuth();
  const location = useLocation();

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-brand-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/panel" replace />;
  }

  if (requireTechnician && !isTechnician) {
    return <Navigate to="/panel" replace />;
  }

  return children;
}

```

---

## ARCHIVO: `frontend-react/src/components/PublicLayout.jsx`

```javascript
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

```

---

## ARCHIVO: `frontend-react/src/components/Navbar.jsx`

```javascript
import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, ArrowRight, LayoutDashboard, LogOut, Sun, Moon } from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, isAdmin, isTechnician, user, logout } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();

  const links = [
    { to: '/', label: 'Inicio', end: true },
    { to: '/catalogo', label: 'Servicios' },
    { to: '/solicitud', label: 'Solicitar' },
  ];

  const panelLink = isAdmin ? '/admin' : isTechnician ? '/tecnico' : '/panel';

  const linkClass = ({ isActive }) =>
    `text-sm font-semibold uppercase tracking-wide transition-colors ${
      isActive ? 'text-brand-600' : 'text-ink-700 hover:text-brand-600'
    }`;

  function handleLogout() {
    logout();
    navigate('/');
    setOpen(false);
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-slate-100 bg-white/90 backdrop-blur-md">
      <nav className="mx-auto flex h-full max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link to="/" aria-label="Inicio">
          <Logo />
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-8 lg:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
            className="grid h-9 w-9 place-items-center rounded-full text-ink-700 hover:bg-brand-50 transition-colors cursor-pointer"
          >
            {isDark ? <Sun size={18} className="text-amber-500" /> : <Moon size={18} className="text-brand-700" />}
          </button>
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link
                to={panelLink}
                className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-sm font-bold text-brand-700 ring-1 ring-brand-100 transition hover:bg-brand-100"
              >
                <LayoutDashboard size={16} />
                {isAdmin ? 'Panel Taller' : isTechnician ? 'Panel Técnico' : 'Mi Panel'}
              </Link>
              <button
                onClick={handleLogout}
                title="Cerrar sesión"
                className="grid h-9 w-9 place-items-center rounded-full text-ink-500 transition hover:bg-rose-50 hover:text-rose-600"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-full bg-brand-gradient px-5 py-2.5 text-sm font-bold text-white shadow-glow transition hover:shadow-glow-lg hover:brightness-105 sheen"
            >
              Iniciar sesión <ArrowRight size={16} />
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={toggleTheme}
            title={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
            className="grid h-10 w-10 place-items-center rounded-lg text-ink-700 cursor-pointer"
          >
            {isDark ? <Sun size={20} className="text-amber-500" /> : <Moon size={20} className="text-brand-700" />}
          </button>
          <button
            className="grid h-10 w-10 place-items-center rounded-lg text-ink-700"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menú"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="border-b border-slate-100 bg-white px-5 pb-6 pt-2 shadow-lg lg:hidden">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-3 text-sm font-semibold ${
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-700'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <div className="mt-3 flex flex-col gap-2">
              {isAuthenticated ? (
                <>
                  <Link
                    to={panelLink}
                    onClick={() => setOpen(false)}
                    className="rounded-full bg-brand-50 px-4 py-3 text-center text-sm font-bold text-brand-700"
                  >
                    {isAdmin ? 'Panel del Taller' : isTechnician ? 'Panel Técnico' : 'Mi Panel'}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="rounded-full bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600"
                  >
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-full bg-brand-gradient px-4 py-3 text-center text-sm font-bold text-white"
                >
                  Iniciar sesión
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

```

---

## ARCHIVO: `frontend-react/src/components/Footer.jsx`

```javascript
import { Link } from 'react-router-dom';
import { MapPin, Phone, Clock, MessageCircle } from 'lucide-react';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="bg-brand-950 text-brand-200">
      <div className="mx-auto max-w-7xl px-5 pb-10 pt-16 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Logo light size="lg" effect="float" />
            <p className="mt-4 text-sm leading-relaxed text-brand-300">
              Servicio técnico de refrigeración y climatización a domicilio.
              Rapidez, calidad y garantía en cada visita.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-brand-400">
              Servicios
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/catalogo" className="text-brand-300 transition hover:text-white">Aires de Ventana</Link></li>
              <li><Link to="/catalogo" className="text-brand-300 transition hover:text-white">Aires Split</Link></li>
              <li><Link to="/catalogo" className="text-brand-300 transition hover:text-white">Aires por Toneladas</Link></li>
              <li><span className="text-brand-300/60">Neveras (próximamente)</span></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-brand-400">
              Cuenta
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/login" className="text-brand-300 transition hover:text-white">Iniciar sesión</Link></li>
              <li><Link to="/registro" className="text-brand-300 transition hover:text-white">Crear cuenta</Link></li>
              <li><Link to="/solicitud" className="text-brand-300 transition hover:text-white">Solicitar servicio</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-brand-400">
              Contacto
            </h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2.5 text-brand-300"><MapPin size={16} className="text-brand-400" /> San Juan de los Morros, Guárico</li>
              <li className="flex items-center gap-2.5 text-brand-300"><Clock size={16} className="text-brand-400" /> Lun a Sáb · 8:00 AM – 7:00 PM</li>
              <li className="flex items-center gap-2.5 text-brand-300"><Phone size={16} className="text-brand-400" /> +58 412-000 0000</li>
              <li><a href="https://wa.me/584120000000" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1.5 font-semibold text-emerald-300 ring-1 ring-emerald-500/30 transition hover:bg-emerald-500/25"><MessageCircle size={15} /> WhatsApp</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-center text-xs text-brand-300/70">
          © {new Date().getFullYear()} Fresh Service Digital · San Juan de los Morros, Venezuela
        </div>
      </div>
    </footer>
  );
}

```

---

## ARCHIVO: `frontend-react/src/components/AuthShell.jsx`

```javascript
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { IMG } from '../lib/images';
import Logo from './Logo';

export default function AuthShell({ title, subtitle, children, perks }) {
  const navigate = useNavigate();

  const handleBack = (e) => {
    e.preventDefault();
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-brand-950 p-10 text-white lg:flex xl:p-14">
        <img src={IMG.comfort} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-950/90 via-brand-900/80 to-brand-800/70" />
        <div className="absolute -right-20 top-10 h-80 w-80 rounded-full bg-brand-500/20 blur-3xl" />

        <Link to="/" className="relative">
          <Logo light size="lg" />
        </Link>

        <div className="relative max-w-md">
          <h2 className="font-display text-3xl font-extrabold leading-tight xl:text-4xl">
            Tu clima ideal, <span className="text-gradient">a un clic.</span>
          </h2>
          <p className="mt-4 text-brand-100/80">
            Gestiona tus solicitudes de servicio, sigue el estado de tus
            reparaciones y agenda nuevas visitas técnicas.
          </p>
          <ul className="mt-8 space-y-3">
            {(perks || ['Solicita servicios en minutos', 'Seguimiento en tiempo real', 'Historial de tus servicios']).map((p) => (
              <li key={p} className="flex items-center gap-3 text-sm text-brand-50/90">
                <CheckCircle2 size={18} className="text-frost-300" /> {p}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative text-xs text-brand-200/70">San Juan de los Morros, Venezuela</div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center bg-brand-50 px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Link to="/" onClick={handleBack} className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink-600 ring-1 ring-slate-200 transition hover:bg-brand-50 hover:text-brand-700 hover:ring-brand-200 lg:hidden">
            <ArrowLeft size={16} /> Volver al inicio
          </Link>
          <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-100 sm:p-9">
            <h1 className="font-display text-2xl font-extrabold text-ink-900">{title}</h1>
            {subtitle && <p className="mt-1.5 text-sm text-ink-500">{subtitle}</p>}
            <div className="mt-6">{children}</div>
          </div>
          <Link to="/" onClick={handleBack} className="mx-auto mt-6 hidden w-fit items-center justify-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-ink-600 shadow-sm ring-1 ring-slate-200 transition hover:bg-brand-50 hover:text-brand-700 hover:ring-brand-200 lg:flex">
            <ArrowLeft size={16} /> Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

/* Campo de formulario reutilizable */
export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink-700">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  'w-full rounded-xl border-2 border-brand-100 bg-white px-4 py-2.5 text-[0.95rem] text-ink-900 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-200/40 placeholder:text-ink-500/50';

```

---

## ARCHIVO: `frontend-react/src/components/Button.jsx`

```javascript
import { Link } from 'react-router-dom';

const base =
  'inline-flex items-center justify-center gap-2 font-semibold rounded-full transition-all duration-200 whitespace-nowrap cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed';

const variants = {
  primary:
    'bg-brand-gradient text-white shadow-glow hover:shadow-glow-lg hover:-translate-y-0.5 sheen',
  bright:
    'bg-brand-gradient-bright text-white shadow-glow hover:shadow-glow-lg hover:-translate-y-0.5 sheen',
  outline:
    'border-2 border-brand-200 text-brand-700 bg-white hover:border-brand-400 hover:bg-brand-50',
  ghostWhite:
    'border border-white/40 text-white bg-white/10 backdrop-blur hover:bg-white/20',
  dark: 'bg-brand-950 text-white hover:bg-brand-900',
};

const sizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-[0.95rem]',
  lg: 'px-8 py-3.5 text-base',
};

export default function Button({
  as = 'button',
  to,
  href,
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) {
  const cls = `${base} ${variants[variant]} ${sizes[size]} ${className}`;
  if (to) {
    return (
      <Link to={to} className={cls} {...props}>
        {children}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={cls} {...props}>
        {children}
      </a>
    );
  }
  return (
    <button className={cls} {...props}>
      {children}
    </button>
  );
}

```

---

## ARCHIVO: `frontend-react/src/components/Logo.jsx`

```javascript
export default function Logo({ size = 'md', light = false, effect = 'hover' }) {
  const box = size === 'sm' ? 'h-9 w-9' : size === 'lg' ? 'h-12 w-12' : 'h-10 w-10';
  const text = size === 'lg' ? 'text-xl' : 'text-base';

  // hover: reacciona al mouse (navbar) · float: bob lento continuo (footer)
  const motion =
    effect === 'float'
      ? 'animate-logo-float'
      : 'transition duration-300 ease-out hover:-translate-y-0.5 hover:scale-[1.06] hover:shadow-md hover:ring-brand-200';

  return (
    <div className="flex items-center gap-2.5">
      {/* Chip blanco fijo para que el logo se vea bien en navbar claro y oscuro */}
      <span
        className={`${box} ${motion} grid shrink-0 place-items-center rounded-xl bg-[#ffffff] p-1 shadow-sm ring-1 ring-slate-200/80 will-change-transform`}
      >
        <img
          src="/logo.png"
          alt="Fresh Service — Refrigeración a domicilio"
          className="h-full w-full object-contain"
        />
      </span>
      <span
        className={`font-display font-extrabold ${text} tracking-tight ${
          light ? 'text-white' : 'text-brand-950'
        }`}
      >
        Fresh<span className="text-brand-500"> Service</span>
      </span>
    </div>
  );
}

```

---

## ARCHIVO: `frontend-react/src/components/Price.jsx`

```javascript
import { useRate } from '../context/RateContext';
import { formatBs, formatUsd } from '../lib/money';

/**
 * Muestra un precio guardado en USD: Bs grande (a tasa BCV) + Ref. USD chico.
 * Si aún no cargó la tasa, muestra solo el USD como fallback.
 * Props: usd (number), size ('md' | 'lg'), align ('left' | 'right')
 */
export default function Price({ usd, size = 'md', align = 'left' }) {
  const { rate } = useRate();
  const bs = formatBs(usd, rate);
  const bsCls = size === 'lg' ? 'text-2xl' : 'text-lg';
  return (
    <div className={align === 'right' ? 'text-right' : ''}>
      {bs ? (
        <>
          <div className={`font-display ${bsCls} font-extrabold leading-none text-ink-900`}>{bs}</div>
          <div className="mt-0.5 text-xs font-medium text-ink-500">Ref. {formatUsd(usd)}</div>
        </>
      ) : (
        <div className={`font-display ${bsCls} font-extrabold leading-none text-ink-900`}>{formatUsd(usd)}</div>
      )}
    </div>
  );
}

```

---

## ARCHIVO: `frontend-react/src/pages/Home.jsx`

```javascript
import { Link } from 'react-router-dom';
import {
  Snowflake, Wrench, Wind, ShieldCheck, Zap, Clock, MapPin, Star,
  ArrowRight, CheckCircle2, PhoneCall, Award, ThermometerSnowflake,
} from 'lucide-react';
import Button from '../components/Button';
import Price from '../components/Price';
import { IMG } from '../lib/images';

function Stat({ value, label }) {
  return (
    <div className="text-center">
      <div className="font-display text-3xl font-extrabold text-white sm:text-4xl">{value}</div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wider text-brand-200">{label}</div>
    </div>
  );
}

const services = [
  {
    icon: Wind, title: 'Aires de Ventana', img: IMG.maintenance, priceFrom: 25,
    desc: 'Reparación, mantenimiento e instalación de unidades de ventana de todas las marcas.',
    points: ['Diagnóstico incluido', 'Recarga de gas', 'Limpieza profunda'],
  },
  {
    icon: ThermometerSnowflake, title: 'Aires Split', img: IMG.install, priceFrom: 35,
    desc: 'Servicio integral para sistemas Split mini y maxi: unidad interna y externa.',
    points: ['Lavado a presión', 'Revisión de plaquetas', 'Recarga y hermeticidad'],
  },
  {
    icon: Wrench, title: 'Aires por Toneladas', img: IMG.repair, priceFrom: 50,
    desc: 'Equipos de 1 a 3 toneladas para locales y espacios grandes. Servicio especializado.',
    points: ['Hasta 80 m²', 'Línea trifásica', 'Diagnóstico de compresor'],
  },
];

const features = [
  { icon: Zap, title: 'Respuesta el mismo día', desc: 'Agendas tu cita en minutos por la plataforma. El técnico llega en el horario que elijas.' },
  { icon: Award, title: 'Técnicos certificados', desc: 'Equipo con formación especializada y años de experiencia en refrigeración.' },
  { icon: ShieldCheck, title: 'Servicio garantizado', desc: 'Todos los trabajos incluyen garantía. Si algo falla, regresamos sin costo.' },
  { icon: MapPin, title: 'A domicilio', desc: 'Vamos hasta tu casa o local en San Juan de los Morros y alrededores.' },
];

const steps = [
  { n: '01', title: 'Solicita en línea', desc: 'Elige el servicio y cuéntanos qué necesitas.' },
  { n: '02', title: 'Coordinamos por WhatsApp', desc: 'Confirmamos fecha y hora que te convengan.' },
  { n: '03', title: 'El técnico llega', desc: 'Puntual y con las herramientas necesarias.' },
  { n: '04', title: 'Trabajo garantizado', desc: 'Pagas al finalizar, con garantía incluida.' },
];

const testimonials = [
  { name: 'Yolanda T.', area: 'Urb. Las Mercedes', text: 'Vinieron el mismo día, repararon mi split que no enfriaba y quedó como nuevo. Excelente trato.' },
  { name: 'Carlos S.', area: 'Centro', text: 'Mantenimiento de los aires de mi local. Profesionales, puntuales y precio justo. Recomendados.' },
  { name: 'Ana M.', area: 'La Morera', text: 'Me encantó poder agendar por internet sin tantas llamadas. El técnico súper amable y rápido.' },
];

export default function Home() {
  return (
    <div className="overflow-hidden">
      {/* ===== HERO ===== */}
      <section className="relative bg-brand-950">
        <div className="absolute inset-0">
          <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl" />
          <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-frost-400/20 blur-3xl" />
        </div>
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 lg:grid-cols-2 lg:px-8 lg:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-100 ring-1 ring-white/15">
              <Snowflake size={14} /> Refrigeración a domicilio
            </span>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.1] text-white sm:text-5xl lg:text-6xl">
              Tu clima ideal,<br />
              <span className="text-gradient">sin complicaciones.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-brand-100/80">
              Reparación, mantenimiento e instalación de aires acondicionados a
              domicilio en San Juan de los Morros. Agenda en minutos, técnicos
              certificados y garantía en cada visita.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button to="/solicitud" size="lg" variant="bright">
                Solicitar servicio <ArrowRight size={18} />
              </Button>
              <Button to="/catalogo" size="lg" variant="ghostWhite">
                Ver servicios
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-brand-100/80">
              {['Técnicos certificados', 'Garantía incluida', 'Respuesta el mismo día'].map((t) => (
                <span key={t} className="inline-flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-frost-300" /> {t}
                </span>
              ))}
            </div>
          </div>

          {/* Visual */}
          <div className="relative">
            <div className="group relative overflow-hidden rounded-[2rem] ring-1 ring-white/15 shadow-glow-lg transition duration-300 ease-out hover:-translate-y-2 hover:shadow-glow-lg hover:ring-frost-300/40 will-change-transform">
              <img
                src={IMG.heroTech}
                alt="Técnico de refrigeración trabajando"
                className="h-[420px] w-full object-cover transition duration-500 ease-out group-hover:scale-[1.04] sm:h-[480px]"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-950/60 to-transparent" />
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="relative border-t border-white/10 bg-white/5">
          <div className="mx-auto grid max-w-7xl grid-cols-3 gap-6 px-5 py-8 lg:px-8">
            <Stat value="+500" label="Servicios" />
            <Stat value="8 años" label="Experiencia" />
            <Stat value="4.9★" label="Calificación" />
          </div>
        </div>
      </section>

      {/* ===== SERVICIOS ===== */}
      <section className="bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-bold uppercase tracking-widest text-brand-600">Nuestros servicios</span>
            <h2 className="mt-3 font-display text-3xl font-extrabold text-ink-900 sm:text-4xl">
              Todo lo que tu aire necesita
            </h2>
            <p className="mt-4 text-ink-500">
              Especialistas en climatización para hogares y locales. Para todas las marcas.
            </p>
          </div>

          <div className="mt-14 grid gap-7 md:grid-cols-3">
            {services.map((s) => (
              <div key={s.title} className="group overflow-hidden rounded-3xl bg-white ring-1 ring-slate-100 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-glow">
                <div className="relative h-48 overflow-hidden">
                  <img src={s.img} alt={s.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-950/70 via-brand-950/10 to-transparent" />
                  <h3 className="absolute bottom-3 left-4 font-display text-xl font-bold text-white">{s.title}</h3>
                </div>
                <div className="p-6">
                  <p className="text-sm leading-relaxed text-ink-500">{s.desc}</p>
                  <ul className="mt-4 space-y-2">
                    {s.points.map((p) => (
                      <li key={p} className="flex items-center gap-2 text-sm font-medium text-ink-700">
                        <CheckCircle2 size={16} className="text-brand-500" /> {p}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 flex items-end justify-between gap-3 border-t border-slate-100 pt-4">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">Desde</div>
                      <Price usd={s.priceFrom} />
                    </div>
                    <Link to="/catalogo" className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-600 transition hover:gap-2.5">
                      Explorar <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== POR QUÉ NOSOTROS ===== */}
      <section className="bg-brand-50 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <div className="relative">
              <img src={IMG.technician} alt="Técnico certificado" loading="lazy" className="rounded-3xl object-cover shadow-xl ring-1 ring-white" />
              <div className="absolute -bottom-6 -right-4 hidden rounded-2xl bg-brand-gradient p-5 text-white shadow-glow-lg sm:block">
                <Award size={26} />
                <div className="mt-2 font-display text-lg font-extrabold leading-none">8 años</div>
                <div className="text-xs text-brand-100">de experiencia</div>
              </div>
            </div>
            <div>
              <span className="text-sm font-bold uppercase tracking-widest text-brand-600">¿Por qué Fresh Service?</span>
              <h2 className="mt-3 font-display text-3xl font-extrabold text-ink-900 sm:text-4xl">
                Profesionales en quienes confiar
              </h2>
              <p className="mt-4 text-ink-500">
                Combinamos experiencia técnica con una plataforma digital que hace
                pedir un servicio tan fácil como enviar un mensaje.
              </p>
              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                {features.map((f) => (
                  <div key={f.title} className="flex gap-4">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-gradient text-white shadow-glow sheen">
                      <f.icon size={20} />
                    </div>
                    <div>
                      <h3 className="font-display text-base font-bold text-ink-900">{f.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-ink-500">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CÓMO FUNCIONA ===== */}
      <section className="bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-bold uppercase tracking-widest text-brand-600">Así de fácil</span>
            <h2 className="mt-3 font-display text-3xl font-extrabold text-ink-900 sm:text-4xl">
              Tu servicio en 4 pasos
            </h2>
          </div>
          <div className="mt-14 grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.n} className="relative rounded-2xl bg-brand-50/60 p-6 ring-1 ring-brand-100">
                <div className="font-display text-4xl font-extrabold text-brand-200">{s.n}</div>
                <h3 className="mt-3 font-display text-lg font-bold text-ink-900">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIOS ===== */}
      <section className="bg-brand-50 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-bold uppercase tracking-widest text-brand-600">Clientes felices</span>
            <h2 className="mt-3 font-display text-3xl font-extrabold text-ink-900 sm:text-4xl">
              Lo que dicen de nosotros
            </h2>
          </div>
          <div className="mt-14 grid gap-7 md:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-3xl bg-white p-7 ring-1 ring-slate-100 shadow-sm">
                <div className="flex gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => <Star key={i} size={18} fill="currentColor" />)}
                </div>
                <p className="mt-4 leading-relaxed text-ink-700">“{t.text}”</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-brand-gradient font-bold text-white">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-ink-900">{t.name}</div>
                    <div className="text-xs text-ink-500">{t.area}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="bg-white py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-brand-gradient px-8 py-14 text-center shadow-glow-lg sm:px-16">
            <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
            <Snowflake className="absolute right-8 top-8 text-white/15" size={120} />
            <div className="relative mx-auto max-w-2xl">
              <h2 className="font-display text-3xl font-extrabold text-white sm:text-4xl">
                ¿Tu aire no enfría como antes?
              </h2>
              <p className="mt-4 text-lg text-brand-50/90">
                Agenda hoy mismo. Un técnico te visita en menos de 2 horas hábiles.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Button to="/solicitud" size="lg" variant="dark">
                  <PhoneCall size={18} /> Solicitar ahora
                </Button>
                <Button to="/registro" size="lg" variant="ghostWhite">
                  Crear cuenta gratis
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

```

---

## ARCHIVO: `frontend-react/src/pages/Catalogo.jsx`

```javascript
import { Link } from 'react-router-dom';
import { Wind, ThermometerSnowflake, Wrench, CheckCircle2, Snowflake, ArrowRight } from 'lucide-react';
import Button from '../components/Button';
import Price from '../components/Price';
import { IMG } from '../lib/images';

const groups = [
  {
    tag: 'Tipo 1', title: 'Aires de Ventana', icon: Wind, img: IMG.maintenance,
    cards: [
      { name: 'Reparación', sub: 'Diagnóstico + Reparación', price: 40, points: ['Diagnóstico completo', 'Revisión eléctrica y mecánica', 'Prueba de funcionamiento', 'Informe técnico'] },
      { name: 'Mantenimiento', sub: 'Limpieza + Revisión', price: 25, points: ['Lavado de filtros y tinas', 'Limpieza de serpentines', 'Revisión del compresor', 'Recarga de gas (si aplica)'] },
    ],
  },
  {
    tag: 'Tipo 2', title: 'Aires Split', icon: ThermometerSnowflake, img: IMG.install,
    cards: [
      { name: 'Reparación', sub: 'Mini + Maxi Split', price: 55, points: ['Diagnóstico interior y exterior', 'Revisión de plaquetas', 'Verificación de tuberías', 'Recarga y verificación de gas'] },
      { name: 'Mantenimiento', sub: 'Preventivo + Correctivo', price: 35, points: ['Desmontaje y lavado a presión', 'Limpieza de drenaje', 'Revisión del condensador', 'Control de temperatura'] },
    ],
  },
  {
    tag: 'Tipo 3', title: 'Aires por Toneladas', icon: Wrench, img: IMG.repair,
    cards: [
      { name: '1 Tonelada', sub: 'Hasta 30 m²', price: 50, points: ['Cuartos y oficinas pequeñas', 'Recarga R-22 / R-410A', 'Instalación de soportes', 'Mantenimiento preventivo'] },
      { name: '2 Toneladas', sub: 'Hasta 55 m²', price: 75, popular: true, points: ['Salas y oficinas medianas', 'Revisión completa del sistema', 'Recarga y hermeticidad', 'Limpieza profunda'] },
      { name: '3 Toneladas', sub: 'Hasta 80 m²', price: 100, points: ['Locales y espacios abiertos', 'Revisión trifásica', 'Línea dedicada', 'Diagnóstico de compresor'] },
    ],
  },
];

export default function Catalogo() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-brand-950 py-16 text-white">
        <div className="absolute -right-20 -top-10 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" />
        <Snowflake className="absolute right-6 top-6 text-white/10" size={140} />
        <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
          <div className="text-sm text-brand-200">
            <Link to="/" className="hover:text-white">Inicio</Link> / Catálogo
          </div>
          <h1 className="mt-3 font-display text-4xl font-extrabold sm:text-5xl">Catálogo de Servicios</h1>
          <p className="mt-3 max-w-xl text-brand-100/80">
            Soluciones profesionales de climatización a domicilio. Cobertura en San
            Juan de los Morros y alrededores · Todas las marcas.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-20 px-5 py-20 lg:px-8">
        {groups.map((g) => (
          <section key={g.title}>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="inline-block rounded-full bg-brand-50 px-3 py-0.5 text-xs font-bold uppercase tracking-wide text-brand-600 ring-1 ring-brand-100">{g.tag}</span>
                <h2 className="mt-1 font-display text-2xl font-extrabold text-ink-900">{g.title}</h2>
              </div>
            </div>

            <div className={`mt-8 grid gap-6 ${g.cards.length === 3 ? 'lg:grid-cols-3' : 'md:grid-cols-2'}`}>
              {g.cards.map((c) => (
                <div key={c.name} className={`group relative flex flex-col overflow-hidden rounded-3xl bg-white ring-1 transition hover:-translate-y-1 hover:shadow-glow ${c.popular ? 'ring-2 ring-brand-400 shadow-glow' : 'ring-slate-100 shadow-sm'}`}>
                  <div className="relative h-40 overflow-hidden">
                    <img src={g.img} alt={g.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-950/60 via-brand-950/10 to-transparent" />
                    {c.popular && (
                      <div className="absolute right-3 top-3 rounded-full bg-brand-gradient px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-glow">★ Más solicitado</div>
                    )}
                    <h3 className="absolute bottom-3 left-4 font-display text-lg font-bold text-white drop-shadow">{c.name}</h3>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <p className="text-sm font-semibold text-brand-600">{c.sub}</p>
                    <ul className="mt-5 flex-1 space-y-2.5">
                      {c.points.map((p) => (
                        <li key={p} className="flex items-start gap-2 text-sm text-ink-700">
                          <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-brand-500" /> {p}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
                      <Price usd={c.price} />
                      <Button to="/solicitud" size="sm">Solicitar</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* Próximamente neveras */}
        <section className="overflow-hidden rounded-3xl bg-brand-50 ring-1 ring-brand-100">
          <div className="grid items-center gap-6 md:grid-cols-2">
            <div className="p-8 lg:p-12">
              <span className="inline-block rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-600 ring-1 ring-brand-100">Próximamente · Fase 2</span>
              <h2 className="mt-4 font-display text-2xl font-extrabold text-ink-900">Neveras & Refrigeradores</h2>
              <p className="mt-3 text-ink-500">Servicio técnico especializado para neveras domésticas y comerciales. Estamos preparando este módulo para ti.</p>
            </div>
            <img src={IMG.appliance} alt="Electrodomésticos" className="h-full max-h-72 w-full object-cover" />
          </div>
        </section>

        {/* CTA */}
        <div className="rounded-3xl bg-brand-gradient px-8 py-12 text-center text-white shadow-glow-lg">
          <h2 className="font-display text-2xl font-extrabold sm:text-3xl">¿Encontraste el servicio que necesitas?</h2>
          <p className="mt-3 text-brand-50/90">Agéndalo en minutos y recibe a un técnico certificado en tu domicilio.</p>
          <div className="mt-6 flex justify-center">
            <Button to="/solicitud" size="lg" variant="dark">Solicitar servicio <ArrowRight size={18} /></Button>
          </div>
        </div>
      </div>
    </div>
  );
}

```

---

## ARCHIVO: `frontend-react/src/pages/Login.jsx`

```javascript
import { useState } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import AuthShell, { Field, inputClass } from '../components/AuthShell';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;
  const [searchParams] = useSearchParams();
  const verified = searchParams.get('verified') === 'true';
  const urlError = searchParams.get('error');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      if (user.role === 'ADMIN') {
        navigate('/admin');
      } else if (user.role === 'TECHNICIAN') {
        navigate('/tecnico');
      } else {
        navigate(from || '/panel'); // vuelve a donde quería ir (ej. /solicitud)
      }
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Bienvenido de vuelta"
      subtitle={
        <>
          ¿No tienes cuenta?{' '}
          <Link to="/registro" state={{ from }} className="font-semibold text-brand-600 hover:underline">
            Regístrate gratis
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {from === '/solicitud' && (
          <div className="flex items-start gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700 ring-1 ring-brand-100">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-brand-600" />
            <span>Inicia sesión para continuar con tu solicitud de servicio.</span>
          </div>
        )}
        {verified && (
          <div className="flex items-start gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:ring-emerald-500/20">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>¡Cuenta activada con éxito! Ya puedes iniciar sesión.</span>
          </div>
        )}

        {urlError && (
          <div className="flex items-start gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 ring-1 ring-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:ring-rose-500/20">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{urlError}</span>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 ring-1 ring-rose-100">
            <AlertCircle size={18} className="mt-0.5 shrink-0" /> {error}
          </div>
        )}

        <Field label="Correo electrónico">
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="tucorreo@ejemplo.com" className={inputClass}
          />
        </Field>

        <Field label="Contraseña">
          <div className="relative">
            <input
              type={show ? 'text' : 'password'} required value={password}
              onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
              className={inputClass + ' pr-12'}
            />
            <button type="button" onClick={() => setShow((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-brand-600">
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </Field>

        <div className="text-right">
          <Link to="/recuperar" className="text-xs font-semibold text-brand-600 hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <Button type="submit" variant="primary" className="w-full" disabled={loading}>
          {loading ? 'Ingresando…' : <>Ingresar a mi cuenta <ArrowRight size={18} /></>}
        </Button>
      </form>

      <p className="mt-5 text-center text-xs text-ink-500">
        Demos: <span className="font-semibold text-ink-700">admin@freshservice.com</span> (Admin1234) · <span className="font-semibold text-ink-700">tecnico@freshservice.com</span> (Demo1234)
      </p>
    </AuthShell>
  );
}

```

---

## ARCHIVO: `frontend-react/src/pages/Registro.jsx`

```javascript
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, MailCheck, ArrowRight, ExternalLink, Info } from 'lucide-react';
import AuthShell, { Field, inputClass } from '../components/AuthShell';
import Button from '../components/Button';
import { api } from '../lib/api';

function strength(pw) {
  let s = 0;
  if (pw.length >= 6) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
const stMap = [
  { w: '0%', c: 'bg-slate-200', t: '', tc: 'text-ink-500' },
  { w: '25%', c: 'bg-rose-400', t: 'Muy débil', tc: 'text-rose-600' },
  { w: '50%', c: 'bg-amber-400', t: 'Débil', tc: 'text-amber-600' },
  { w: '75%', c: 'bg-brand-400', t: 'Aceptable', tc: 'text-brand-600' },
  { w: '100%', c: 'bg-emerald-500', t: 'Segura', tc: 'text-emerald-600' },
];

export default function Registro() {
  const location = useLocation();
  const from = location.state?.from;
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', confirm: '' });
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null); // { activationUrl }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const st = stMap[form.password ? strength(form.password) : 0];

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres');
    if (form.password !== form.confirm) return setError('Las contraseñas no coinciden');
    setLoading(true);
    try {
      const phone = `+58${form.phone.replace(/\D/g, '')}`;
      const data = await api.register({
        email: form.email.trim(), password: form.password,
        firstName: form.firstName.trim(), lastName: form.lastName.trim(), phone,
      });
      setDone({ activationUrl: data.activationUrl });
    } catch (err) {
      setError(err.message || 'No se pudo crear la cuenta');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <AuthShell title="¡Casi listo!" subtitle="Verifica tu cuenta para empezar">
        <div className="text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
            <MailCheck size={32} />
          </div>
          <p className="mt-5 text-sm leading-relaxed text-ink-500">
            Enviamos un enlace de activación a tu correo electrónico. Por favor, revisa tu bandeja de entrada (y la carpeta de spam si es necesario) y haz clic en el enlace para activar tu cuenta.
          </p>
          <Link to="/login" state={{ from }} className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-brand-gradient px-6 py-3 font-semibold text-white shadow-glow transition hover:shadow-glow-lg">
            Ir al inicio de sesión
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Crea tu cuenta"
      subtitle={<>¿Ya tienes una? <Link to="/login" state={{ from }} className="font-semibold text-brand-600 hover:underline">Inicia sesión</Link></>}
      perks={['Agenda servicios sin llamadas', 'Sigue el estado de tus reparaciones', 'Tu historial siempre a mano']}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {from === '/solicitud' && (
          <div className="flex items-start gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700 ring-1 ring-brand-100">
            <Info size={18} className="mt-0.5 shrink-0 text-brand-600" />
            <span>Para solicitar un servicio necesitas una cuenta. Créala aquí (es gratis) y continúas con tu solicitud.</span>
          </div>
        )}
        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 ring-1 ring-rose-100">
            <AlertCircle size={18} className="mt-0.5 shrink-0" /> {error}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nombre"><input required value={form.firstName} onChange={set('firstName')} className={inputClass} placeholder="Pedro" /></Field>
          <Field label="Apellido"><input required value={form.lastName} onChange={set('lastName')} className={inputClass} placeholder="Cabeza" /></Field>
        </div>
        <Field label="Correo electrónico">
          <input type="email" required value={form.email} onChange={set('email')} className={inputClass} placeholder="tucorreo@ejemplo.com" />
        </Field>
        <Field label="WhatsApp">
          <div className="flex">
            <span className="grid place-items-center rounded-l-xl border-2 border-r-0 border-brand-100 bg-brand-50 px-3 text-sm font-bold text-brand-700">+58</span>
            <input required value={form.phone} onChange={set('phone')} maxLength={10} className={inputClass + ' rounded-l-none'} placeholder="4120000000" />
          </div>
        </Field>
        <Field label="Contraseña">
          <div className="relative">
            <input type={show ? 'text' : 'password'} required value={form.password} onChange={set('password')} className={inputClass + ' pr-12'} placeholder="Mínimo 6 caracteres" />
            <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-brand-600">
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {form.password && (
            <div className="mt-2">
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div className={`h-full rounded-full transition-all ${st.c}`} style={{ width: st.w }} />
              </div>
              <span className={`mt-1 block text-xs font-semibold ${st.tc}`}>{st.t}</span>
            </div>
          )}
        </Field>
        <Field label="Confirmar contraseña">
          <input type={show ? 'text' : 'password'} required value={form.confirm} onChange={set('confirm')} className={inputClass} placeholder="Repite tu contraseña" />
        </Field>
        <Button type="submit" variant="primary" className="w-full" disabled={loading}>
          {loading ? 'Creando cuenta…' : <>Crear mi cuenta <ArrowRight size={18} /></>}
        </Button>
      </form>
    </AuthShell>
  );
}

```

---

## ARCHIVO: `frontend-react/src/pages/Recuperar.jsx`

```javascript
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, MailCheck, ArrowRight } from 'lucide-react';
import AuthShell, { Field, inputClass } from '../components/AuthShell';
import Button from '../components/Button';
import { api } from '../lib/api';

export default function Recuperar() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.forgotPassword(email.trim());
      setDone(true);
    } catch (err) {
      setError(err.message || 'No se pudo procesar la solicitud');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <AuthShell title="Revisa tu correo" subtitle="Te enviamos las instrucciones">
        <div className="text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
            <MailCheck size={32} />
          </div>
          <p className="mt-5 text-sm leading-relaxed text-ink-500">
            Si <strong className="text-ink-900">{email}</strong> está registrado, te enviamos un enlace para
            restablecer tu contraseña. Revisa tu bandeja de entrada (y la carpeta de spam). El enlace vence en 1 hora.
          </p>
          <Link to="/login" className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-brand-gradient px-6 py-3 font-semibold text-white shadow-glow transition hover:shadow-glow-lg">
            Volver a iniciar sesión
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Recuperar contraseña"
      subtitle={<>¿La recordaste? <Link to="/login" className="font-semibold text-brand-600 hover:underline">Inicia sesión</Link></>}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-ink-500">Escribe tu correo y te enviaremos un enlace para crear una nueva contraseña.</p>
        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 ring-1 ring-rose-100">
            <AlertCircle size={18} className="mt-0.5 shrink-0" /> {error}
          </div>
        )}
        <Field label="Correo electrónico">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tucorreo@ejemplo.com" className={inputClass} />
        </Field>
        <Button type="submit" variant="primary" className="w-full" disabled={loading}>
          {loading ? 'Enviando…' : <>Enviar enlace <ArrowRight size={18} /></>}
        </Button>
      </form>
    </AuthShell>
  );
}

```

---

## ARCHIVO: `frontend-react/src/pages/Restablecer.jsx`

```javascript
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import AuthShell, { Field, inputClass } from '../components/AuthShell';
import Button from '../components/Button';
import { api } from '../lib/api';

export default function Restablecer() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres');
    if (password !== confirm) return setError('Las contraseñas no coinciden');
    setLoading(true);
    try {
      await api.resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate('/login?verified=true'), 1800);
    } catch (err) {
      setError(err.message || 'No se pudo restablecer la contraseña');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <AuthShell title="Enlace inválido" subtitle="Falta el token de restablecimiento">
        <div className="text-center text-sm text-ink-500">
          <p>Este enlace no es válido. Solicita uno nuevo desde la página de recuperación.</p>
          <Link to="/recuperar" className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-brand-gradient px-6 py-3 font-semibold text-white shadow-glow">
            Recuperar contraseña
          </Link>
        </div>
      </AuthShell>
    );
  }

  if (done) {
    return (
      <AuthShell title="¡Listo!" subtitle="Contraseña actualizada">
        <div className="text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-100 text-emerald-600">
            <CheckCircle2 size={34} />
          </div>
          <p className="mt-5 text-sm text-ink-500">Tu contraseña fue actualizada. Te llevamos al inicio de sesión…</p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Nueva contraseña" subtitle="Crea una contraseña segura para tu cuenta">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 ring-1 ring-rose-100">
            <AlertCircle size={18} className="mt-0.5 shrink-0" /> {error}
          </div>
        )}
        <Field label="Nueva contraseña">
          <div className="relative">
            <input type={show ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className={inputClass + ' pr-12'} />
            <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-brand-600">
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </Field>
        <Field label="Confirmar contraseña">
          <input type={show ? 'text' : 'password'} required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repite tu contraseña" className={inputClass} />
        </Field>
        <Button type="submit" variant="primary" className="w-full" disabled={loading}>
          {loading ? 'Guardando…' : <>Cambiar contraseña <ArrowRight size={18} /></>}
        </Button>
      </form>
    </AuthShell>
  );
}

```

---

## ARCHIVO: `frontend-react/src/pages/Solicitud.jsx`

```javascript
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, MapPin, Clock, Zap, MessageCircle, Snowflake } from 'lucide-react';
import Button from '../components/Button';
import Price from '../components/Price';
import { Field, inputClass } from '../components/AuthShell';
import { api } from '../lib/api';
import { priceUsd } from '../lib/prices';
import { useAuth } from '../context/AuthContext';

const equipos = [
  { v: 'Aire de Ventana', btu: 12000 },
  { v: 'Aire Split', btu: 18000 },
  { v: 'Aire 1 Tonelada', btu: 12000 },
  { v: 'Aire 2 Toneladas', btu: 24000 },
  { v: 'Aire 3 Toneladas', btu: 36000 },
];
const servicios = ['Reparación', 'Mantenimiento Preventivo', 'Instalación', 'Recarga de Gas', 'Diagnóstico'];
const horarios = [
  { v: 'manana', t: 'Mañana (8:00 AM – 12:00 PM)', h: '09:00:00' },
  { v: 'tarde', t: 'Tarde (12:00 PM – 5:00 PM)', h: '14:00:00' },
  { v: 'noche', t: 'Noche (5:00 PM – 7:00 PM)', h: '18:00:00' },
];

const PREFIJOS = ['412', '414', '424', '416', '426'];

export default function Solicitud() {
  const { user, patchUser } = useAuth();
  // Precargar teléfono y cédula desde la CUENTA (o desde la última solicitud como respaldo)
  const digits = (user?.phone || '').replace(/\D/g, '').replace(/^58/, '');
  const hasPrefix = PREFIJOS.includes(digits.slice(0, 3));
  const cedRaw = user?.cedula || localStorage.getItem('fsd_cedula') || '';
  const cedM = cedRaw.match(/^\s*([VE])\s*-?\s*(\d+)/i);
  const [f, setF] = useState({
    cedTipo: cedM ? cedM[1].toUpperCase() : 'V',
    cedNum: cedM ? cedM[2] : '',
    phonePrefix: hasPrefix ? digits.slice(0, 3) : '412',
    phoneNum: hasPrefix ? digits.slice(3) : '',
    direccion: localStorage.getItem('fsd_direccion') || '',
    equipo: 'Aire de Ventana', servicio: 'Reparación', descripcion: '', fecha: '', horario: 'manana',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [ref, setRef] = useState(null);

  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!f.fecha) return setError('Selecciona una fecha para la visita');
    setLoading(true);
    try {
      const h = horarios.find((x) => x.v === f.horario)?.h || '10:00:00';
      const eq = equipos.find((x) => x.v === f.equipo);
      const payload = {
        clientId: user.id,
        scheduledAt: `${f.fecha}T${h}.000Z`,
        brand: f.equipo,
        model: f.servicio,
        btuCapacity: eq?.btu || null,
        priceUsd: priceUsd(f.equipo, f.servicio),
        cedula: `${f.cedTipo}-${f.cedNum}`,
        failureDescription: f.descripcion || 'Sin descripción adicional',
        notes: `Cédula: ${f.cedTipo}-${f.cedNum}\nWhatsApp: +58 ${f.phonePrefix}-${f.phoneNum}\nDirección: ${f.direccion}\nHorario: ${f.horario}`,
      };
      const data = await api.createAppointment(payload);
      // Recordar datos para la próxima solicitud (cuenta + respaldo local)
      const ced = `${f.cedTipo}-${f.cedNum}`;
      patchUser({ cedula: ced }); // queda guardada en la cuenta (backend) y en memoria
      localStorage.setItem('fsd_cedula', ced);
      localStorage.setItem('fsd_direccion', f.direccion);
      setRef(data.id.substring(0, 8).toUpperCase());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message || 'No se pudo enviar la solicitud');
    } finally {
      setLoading(false);
    }
  }

  if (ref) {
    return (
      <div className="bg-brand-50">
        <div className="mx-auto max-w-2xl px-5 py-20 text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-emerald-500 text-white shadow-lg">
            <CheckCircle2 size={42} />
          </div>
          <h1 className="mt-6 font-display text-3xl font-extrabold text-ink-900">¡Solicitud recibida!</h1>
          <p className="mt-3 text-ink-500">
            Tu solicitud fue enviada con éxito. Un técnico te contactará por WhatsApp
            en un plazo máximo de 2 horas hábiles.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-bold text-brand-700 ring-1 ring-brand-100">
            Referencia: #FSD-{ref}
          </div>
          <div className="mt-8 flex justify-center gap-3">
            <Button to="/panel" variant="primary">Ver mis solicitudes</Button>
            <Button to="/" variant="outline">Volver al inicio</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <section className="relative overflow-hidden bg-brand-950 py-14 text-white">
        <Snowflake className="absolute right-6 top-6 text-white/10" size={130} />
        <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
          <div className="text-sm text-brand-200"><Link to="/" className="hover:text-white">Inicio</Link> / Solicitar servicio</div>
          <h1 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">Solicitar Servicio a Domicilio</h1>
          <p className="mt-2 max-w-lg text-brand-100/80">Completa el formulario y coordinamos tu visita técnica.</p>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 lg:grid-cols-[1fr_340px] lg:px-8">
        <form onSubmit={handleSubmit} className="rounded-3xl bg-white p-7 ring-1 ring-slate-100 shadow-sm sm:p-9">
          {error && (
            <div className="mb-5 flex items-start gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 ring-1 ring-rose-100">
              <AlertCircle size={18} className="mt-0.5 shrink-0" /> {error}
            </div>
          )}

          <h2 className="mb-5 flex items-center gap-2 border-b border-slate-100 pb-3 font-display text-lg font-bold text-ink-900">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-gradient text-xs font-bold text-white">1</span>
            Datos personales
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre completo">
              <input className={inputClass} value={`${user?.firstName || ''} ${user?.lastName || ''}`.trim()} disabled />
            </Field>
            <Field label="Cédula de identidad">
              <div className="flex">
                <select value={f.cedTipo} onChange={set('cedTipo')} className="rounded-l-xl border-2 border-r-0 border-brand-100 bg-brand-50 px-3 text-sm font-bold text-brand-700 outline-none">
                  <option>V</option><option>E</option>
                </select>
                <input value={f.cedNum} onChange={set('cedNum')} required className={inputClass + ' rounded-l-none'} placeholder="12345678" />
              </div>
            </Field>
          </div>

          <h2 className="mb-5 mt-8 flex items-center gap-2 border-b border-slate-100 pb-3 font-display text-lg font-bold text-ink-900">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-gradient text-xs font-bold text-white">2</span>
            Contacto y ubicación
          </h2>
          <div className="space-y-4">
            <Field label="Número de WhatsApp">
              <div className="flex">
                <span className="grid place-items-center rounded-l-xl border-2 border-r-0 border-brand-100 bg-brand-50 px-3 text-sm font-bold text-brand-700">+58</span>
                <select value={f.phonePrefix} onChange={set('phonePrefix')} className="border-2 border-x-0 border-brand-100 bg-white px-2 text-sm font-semibold outline-none">
                  {['412', '414', '424', '416', '426'].map((p) => <option key={p}>{p}</option>)}
                </select>
                <input value={f.phoneNum} onChange={set('phoneNum')} required maxLength={7} className={inputClass + ' rounded-l-none'} placeholder="1234567" />
              </div>
            </Field>
            <Field label="Dirección / ubicación del servicio">
              <textarea value={f.direccion} onChange={set('direccion')} required rows={3} className={inputClass} placeholder="Sector, calle, casa/edificio, referencia…" />
            </Field>
          </div>

          <h2 className="mb-5 mt-8 flex items-center gap-2 border-b border-slate-100 pb-3 font-display text-lg font-bold text-ink-900">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-gradient text-xs font-bold text-white">3</span>
            Detalles del servicio
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tipo de equipo">
              <select value={f.equipo} onChange={set('equipo')} className={inputClass}>
                {equipos.map((e) => <option key={e.v}>{e.v}</option>)}
              </select>
            </Field>
            <Field label="Tipo de servicio">
              <select value={f.servicio} onChange={set('servicio')} className={inputClass}>
                {servicios.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Descripción del problema (opcional)">
                <textarea value={f.descripcion} onChange={set('descripcion')} rows={3} className={inputClass} placeholder="Cuéntanos qué le pasa a tu equipo…" />
              </Field>
            </div>
            <Field label="Fecha preferida">
              <input type="date" value={f.fecha} onChange={set('fecha')} required className={inputClass} />
            </Field>
            <Field label="Horario preferido">
              <select value={f.horario} onChange={set('horario')} className={inputClass}>
                {horarios.map((h) => <option key={h.v} value={h.v}>{h.t}</option>)}
              </select>
            </Field>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6">
            <p className="max-w-xs text-xs text-ink-500">Tu información es privada y solo se usa para coordinar tu servicio.</p>
            <Button type="submit" size="lg" disabled={loading}>{loading ? 'Enviando…' : 'Enviar solicitud →'}</Button>
          </div>
        </form>

        {/* Sidebar info */}
        <aside className="space-y-5">
          <div className="rounded-3xl border-2 border-brand-200 bg-brand-50/60 p-6 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-600">Precio estimado del servicio</h3>
            <div className="mt-2">
              <Price usd={priceUsd(f.equipo, f.servicio)} size="lg" />
            </div>
            <p className="mt-3 text-xs text-ink-500">{f.equipo} · {f.servicio}. Monto en Bs sujeto a la tasa oficial del BCV del día de pago.</p>
          </div>
          <div className="rounded-3xl bg-white p-6 ring-1 ring-slate-100 shadow-sm">
            <h3 className="mb-4 font-display font-bold text-ink-900">Información de contacto</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex gap-3"><MapPin size={18} className="mt-0.5 text-brand-500" /><span className="text-ink-700"><strong className="block text-ink-900">Área de servicio</strong>San Juan de los Morros y alrededores</span></li>
              <li className="flex gap-3"><Clock size={18} className="mt-0.5 text-brand-500" /><span className="text-ink-700"><strong className="block text-ink-900">Horario</strong>Lun a Sáb · 8:00 AM – 7:00 PM</span></li>
              <li className="flex gap-3"><Zap size={18} className="mt-0.5 text-brand-500" /><span className="text-ink-700"><strong className="block text-ink-900">Respuesta</strong>Máximo 2 horas hábiles</span></li>
            </ul>
          </div>
          <div className="rounded-3xl bg-brand-gradient p-6 text-white shadow-glow">
            <h3 className="font-display font-bold">¿Prefieres escribirnos?</h3>
            <p className="mt-1.5 text-sm text-brand-50/90">Si tienes una emergencia, contáctanos directo por WhatsApp.</p>
            <a href="https://wa.me/584120000000" target="_blank" rel="noreferrer" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white py-2.5 font-bold text-brand-700 transition hover:bg-brand-50">
              <MessageCircle size={18} /> Abrir WhatsApp
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}

```

---

## ARCHIVO: `frontend-react/src/pages/ClienteDashboard.jsx`

```javascript
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Snowflake, Plus, MessageCircle, FileText } from 'lucide-react';
import Button from '../components/Button';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useRate } from '../context/RateContext';
import { priceUsd } from '../lib/prices';
import { formatBs, formatUsd } from '../lib/money';
import { STATUS, fmtDate, fmtTime } from '../lib/status';

function StatCard({ value, label, accent }) {
  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-100 shadow-sm">
      <div className={`h-1 w-10 rounded-full ${accent}`} />
      <div className="mt-3 font-display text-3xl font-extrabold text-ink-900">{value}</div>
      <div className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</div>
    </div>
  );
}

export default function ClienteDashboard() {
  const { user } = useAuth();
  const { rate } = useRate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const priceOf = (a) => a.priceUsd ?? priceUsd(a.equipment?.[0]?.brand, a.equipment?.[0]?.model);
  const money = (usd) => formatBs(usd, rate) || formatUsd(usd);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getClientAppointments(user.id);
        setItems(data);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user.id]);

  const total = items.length;
  const activeItems = items.filter((a) => ['PENDING', 'ASSIGNED', 'IN_PROGRESS'].includes(a.status));
  const active = activeItems.length;
  const completed = items.filter((a) => a.status === 'COMPLETED').length;
  const totalUsd = activeItems.reduce((s, a) => s + priceOf(a), 0);

  return (
    <div className="min-h-screen bg-brand-50">
      <div className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-brand-gradient p-8 text-white shadow-glow sm:p-10">
          <Snowflake className="absolute -right-4 -top-4 text-white/15" size={130} />
          <div className="relative">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-100">Área de clientes</span>
            <h1 className="mt-1.5 font-display text-xl font-bold sm:text-2xl">Hola, {user.firstName} {user.lastName}</h1>
            <p className="mt-1.5 max-w-md text-sm text-brand-50/90">Sigue el estado de tus solicitudes y agenda nuevos servicios a domicilio.</p>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-brand-50/90">
              <span><span className="text-brand-200">Correo:</span> {user.email}</span>
              {user.phone && <span><span className="text-brand-200">WhatsApp:</span> {user.phone}</span>}
            </div>
            <Button to="/solicitud" variant="dark" className="mt-5"><Plus size={18} /> Solicitar servicio</Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          <StatCard value={total} label="Total solicitados" accent="bg-brand-500" />
          <StatCard value={active} label="Servicios activos" accent="bg-amber-500" />
          <StatCard value={completed} label="Completados" accent="bg-emerald-500" />
        </div>

        {/* Total a pagar */}
        {totalUsd > 0 && (
          <div className="mt-6 flex flex-col gap-4 rounded-3xl bg-brand-950 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-brand-300">Total a pagar · servicios activos</div>
              <div className="mt-1 font-display text-3xl font-extrabold">{money(totalUsd)}</div>
              <div className="mt-0.5 text-xs text-brand-200/80">Ref. {formatUsd(totalUsd)} · monto en Bs sujeto a la tasa BCV del día</div>
            </div>
            <Link to="/proforma" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-brand-700 shadow transition hover:bg-brand-50">
              <FileText size={18} /> Descargar proforma
            </Link>
          </div>
        )}

        {/* Historial */}
        <div className="mt-8 rounded-3xl bg-white p-6 ring-1 ring-slate-100 shadow-sm sm:p-8">
          <h2 className="font-display text-lg font-bold text-ink-900">Historial de solicitudes</h2>

          {loading ? (
            <div className="grid place-items-center py-16 text-brand-400">
              <Loader2 className="animate-spin" size={32} />
            </div>
          ) : items.length === 0 ? (
            <div className="grid place-items-center py-14 text-center">
              <Snowflake className="text-brand-200" size={48} />
              <p className="mt-4 font-semibold text-ink-700">Aún no tienes solicitudes</p>
              <p className="mt-1 text-sm text-ink-500">Agenda tu primera visita técnica y aparecerá aquí.</p>
              <Button to="/solicitud" className="mt-5">Agendar mi primer servicio</Button>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {items.map((a) => {
                const eq = a.equipment?.[0];
                const st = STATUS[a.status] || STATUS.PENDING;
                return (
                  <div key={a.id} className="flex flex-col gap-3 rounded-2xl border border-slate-100 p-4 transition hover:border-brand-200 hover:bg-brand-50/40 sm:flex-row sm:items-center sm:justify-between">
                    <div className="border-l-2 border-brand-300 pl-3">
                      <div className="font-semibold text-ink-900">{eq ? `${eq.brand} · ${eq.model}` : a.brand || 'Servicio'}</div>
                      <div className="text-xs text-ink-500">{fmtDate(a.scheduledAt)} · {fmtTime(a.scheduledAt)} · Ref #{a.id.substring(0, 8).toUpperCase()}</div>
                      {a.technician && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-semibold text-brand-700">Técnico: {a.technician.firstName} {a.technician.lastName}</span>
                          {a.technician.phone && (
                            <a href={`https://wa.me/${a.technician.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-600 transition hover:bg-emerald-100">
                              <MessageCircle size={12} /> {a.technician.phone}
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:gap-1.5">
                      <div className="text-right">
                        <div className="font-display text-base font-bold text-ink-900">{money(priceOf(a))}</div>
                        <div className="text-[11px] text-ink-400">Ref. {formatUsd(priceOf(a))}</div>
                      </div>
                      <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${st.cls}`}>
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: st.dot }} /> {st.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-6 rounded-2xl bg-white p-5 text-sm text-ink-600 ring-1 ring-slate-100">
          <span className="font-semibold text-ink-900">¿Necesitas ayuda?</span> Escríbenos por{' '}
          <a href="https://wa.me/584120000000" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-emerald-600"><MessageCircle size={14} /> WhatsApp</a>.
        </div>
      </div>
    </div>
  );
}

```

---

## ARCHIVO: `frontend-react/src/pages/Proforma.jsx`

```javascript
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useRate } from '../context/RateContext';
import { priceUsd } from '../lib/prices';
import { formatBs, formatUsd } from '../lib/money';
import { fmtDate } from '../lib/status';

const ACTIVE = ['PENDING', 'ASSIGNED', 'IN_PROGRESS'];

export default function Proforma() {
  const { user } = useAuth();
  const { rate, date } = useRate();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getClientAppointments(user.id);
        setItems(data.filter((a) => ACTIVE.includes(a.status)));
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user.id]);

  const priceOf = (a) => a.priceUsd ?? priceUsd(a.equipment?.[0]?.brand, a.equipment?.[0]?.model);
  const totalUsd = items.reduce((s, a) => s + priceOf(a), 0);
  const bs = (usd) => formatBs(usd, rate) || formatUsd(usd);
  const proformaNo = `FSD-${String(user.id).slice(0, 6).toUpperCase()}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
  const today = new Date().toLocaleDateString('es-VE');

  return (
    <div className="min-h-screen bg-slate-100 py-8 print:bg-white print:py-0">
      {/* Barra de acciones (no se imprime) */}
      <div className="mx-auto mb-4 flex max-w-3xl items-center justify-between px-4 print:hidden">
        <button onClick={() => navigate('/panel')} className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-600 transition hover:text-brand-600">
          <ArrowLeft size={16} /> Volver al panel
        </button>
        <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-full bg-brand-gradient px-5 py-2.5 text-sm font-bold text-white shadow-glow transition hover:brightness-105">
          <Printer size={16} /> Imprimir / Guardar PDF
        </button>
      </div>

      {/* Documento */}
      <div className="mx-auto max-w-3xl bg-white p-8 shadow ring-1 ring-slate-200 print:shadow-none print:ring-0 sm:p-12">
        <div className="flex items-start justify-between border-b border-slate-200 pb-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Fresh Service" className="h-12 w-12 rounded-lg" />
            <div>
              <div className="font-display text-xl font-extrabold text-ink-900">Fresh Service</div>
              <div className="text-xs text-ink-500">Refrigeración a domicilio · San Juan de los Morros</div>
            </div>
          </div>
          <div className="text-right text-xs text-ink-500">
            <div className="font-display text-sm font-extrabold text-brand-600">PROFORMA</div>
            <div className="mt-1">Nº {proformaNo}</div>
            <div>Fecha: {today}</div>
          </div>
        </div>

        <div className="mt-6 text-sm">
          <div className="text-xs font-bold uppercase tracking-wide text-ink-400">Cliente</div>
          <div className="mt-1 font-semibold text-ink-900">{user.firstName} {user.lastName}</div>
          <div className="text-ink-500">{user.email}</div>
        </div>

        {loading ? (
          <div className="grid place-items-center py-16 text-brand-400"><Loader2 className="animate-spin" size={30} /></div>
        ) : items.length === 0 ? (
          <div className="py-14 text-center text-ink-500">No tienes servicios pendientes de pago.</div>
        ) : (
          <>
            <table className="mt-6 w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-ink-400">
                  <th className="py-2">Servicio</th>
                  <th className="py-2">Fecha</th>
                  <th className="py-2 text-right">Precio</th>
                </tr>
              </thead>
              <tbody>
                {items.map((a) => {
                  const eq = a.equipment?.[0];
                  const usd = priceOf(a);
                  return (
                    <tr key={a.id} className="border-b border-slate-100">
                      <td className="py-3">
                        <div className="font-medium text-ink-900">{eq ? `${eq.brand} · ${eq.model}` : 'Servicio'}</div>
                        <div className="text-xs text-ink-400">Ref #{a.id.substring(0, 8).toUpperCase()}</div>
                      </td>
                      <td className="py-3 text-ink-600">{fmtDate(a.scheduledAt)}</td>
                      <td className="py-3 text-right">
                        <div className="font-semibold text-ink-900">{bs(usd)}</div>
                        <div className="text-xs text-ink-400">Ref. {formatUsd(usd)}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="mt-6 flex justify-end">
              <div className="w-full max-w-xs">
                <div className="flex items-start justify-between border-t-2 border-ink-900 pt-3">
                  <span className="font-display font-bold text-ink-900">TOTAL A PAGAR</span>
                  <div className="text-right">
                    <div className="font-display text-xl font-extrabold text-ink-900">{bs(totalUsd)}</div>
                    <div className="text-xs text-ink-500">Ref. {formatUsd(totalUsd)}</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="mt-8 space-y-1 rounded-xl bg-slate-50 p-4 text-xs text-ink-500 print:bg-slate-50">
          <p>• Monto en Bs calculado a la tasa oficial del BCV{date ? ` (${date})` : ''}{rate ? `: Bs ${rate.toLocaleString('es-VE')} por USD` : ''}. Sujeto a la tasa del día de pago.</p>
          <p>• Proforma válida por 7 días. Documento informativo, no constituye factura fiscal.</p>
          <p>• Contacto: WhatsApp +58 412-000 0000 · San Juan de los Morros, Guárico, Venezuela.</p>
        </div>
      </div>
    </div>
  );
}

```

---

## ARCHIVO: `frontend-react/src/pages/TecnicoDashboard.jsx`

```javascript
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Wrench, ClipboardList, LogOut, Globe, RefreshCw,
  Clock, Play, CheckCircle2, Loader2, Search, MessageCircle, Snowflake,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { STATUS, fmtDate, fmtTime } from '../lib/status';

function KPI({ icon: Icon, value, label, color, accent }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white p-5 ring-1 ring-slate-100 shadow-sm transition hover:scale-[1.02] duration-200">
      <div className="absolute inset-x-0 top-0 h-1" style={{ background: accent }} />
      <div className={`grid h-11 w-11 place-items-center rounded-xl ${color}`}>
        <Icon size={21} />
      </div>
      <div className="mt-4 font-display text-3xl font-extrabold text-ink-900">{value}</div>
      <div className="text-sm font-medium text-ink-500">{label}</div>
    </div>
  );
}

export default function TecnicoDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [appts, setAppts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('todo'); // 'todo' (por realizar), 'progress' (en ejecución), 'done' (terminadas)
  const [searchQuery, setSearchQuery] = useState('');

  async function load() {
    setLoading(true);
    try {
      const data = await api.getAllAppointments();
      setAppts(data);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  const stats = useMemo(() => {
    const by = (s) => appts.filter((a) => a.status === s).length;
    return {
      pending: by('PENDING') + by('ASSIGNED'),
      progress: by('IN_PROGRESS'),
      completed: by('COMPLETED'),
    };
  }, [appts]);

  async function changeStatus(id, newStatus) {
    try {
      await api.updateStatus(id, newStatus);
      setAppts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
      );
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        logout();
        navigate('/login');
      }
    }
  }

  async function claimJob(id) {
    try {
      const updated = await api.assignTechnician(id, user.id);
      setAppts((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                technicianId: user.id,
                technician: user,
                status: updated.status,
              }
            : a
        )
      );
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        logout();
        navigate('/login');
      }
    }
  }

  const filteredAppts = useMemo(() => {
    return appts.filter((a) => {
      // Filtrar por pestaña activa
      const matchTab =
        activeTab === 'todo'
          ? ['PENDING', 'ASSIGNED'].includes(a.status)
          : activeTab === 'progress'
          ? a.status === 'IN_PROGRESS'
          : a.status === 'COMPLETED';

      // Filtrar por búsqueda (nombre del cliente o modelo de equipo)
      const fullName = `${a.client.firstName} ${a.client.lastName}`.toLowerCase();
      const eq = a.equipment?.[0];
      const eqDesc = eq ? `${eq.brand} ${eq.model}`.toLowerCase() : '';
      const matchSearch =
        fullName.includes(searchQuery.toLowerCase()) ||
        a.client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        eqDesc.includes(searchQuery.toLowerCase());

      return matchTab && matchSearch;
    });
  }, [appts, activeTab, searchQuery]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-brand-950 lg:flex">
        <div className="flex items-center gap-2.5 border-b border-white/10 px-6 py-5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient-bright text-white shadow-glow sheen">
            <Snowflake size={20} />
          </div>
          <div>
            <div className="font-display text-sm font-extrabold text-white leading-none">
              Fresh Service
            </div>
            <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-400">
              Panel Técnico
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          <button
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition bg-white/10 text-white ring-1 ring-white/10"
          >
            <ClipboardList size={18} /> Mis Trabajos
          </button>
        </nav>
        <div className="space-y-2 border-t border-white/10 p-4">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-brand-100/70 transition hover:bg-white/5 hover:text-white"
          >
            <Globe size={17} /> Ver sitio web
          </Link>
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="flex w-full items-center gap-2 rounded-xl bg-rose-500/15 px-4 py-2.5 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/25"
          >
            <LogOut size={17} /> Cerrar sesión
          </button>
          <div className="flex items-center gap-2.5 pt-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-gradient font-bold text-white">
              {user?.firstName?.[0] || 'T'}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-white">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-xs text-brand-400">Técnico Certificado</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 lg:ml-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-5 backdrop-blur lg:px-8">
          <div>
            <div className="font-display font-bold text-ink-900">
              Panel Técnico de Climatización
            </div>
            <div className="text-xs text-ink-500">
              Atención y mantenimiento de aires acondicionados a domicilio
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={load}
              className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-sm font-bold text-brand-700 ring-1 ring-brand-100 transition hover:bg-brand-100"
            >
              <RefreshCw size={15} /> <span className="hidden sm:inline">Actualizar</span>
            </button>
          </div>
        </header>

        <div className="p-5 lg:p-8">
          {loading ? (
            <div className="grid place-items-center py-32 text-brand-400">
              <Loader2 className="animate-spin" size={36} />
            </div>
          ) : (
            <div className="space-y-6">
              {/* KPIs */}
              <div className="grid gap-5 sm:grid-cols-3">
                <KPI
                  icon={Clock}
                  value={stats.pending}
                  label="Trabajos Por Realizar"
                  color="bg-amber-100 text-amber-600"
                  accent="#f59e0b"
                />
                <KPI
                  icon={Play}
                  value={stats.progress}
                  label="En Ejecución"
                  color="bg-violet-100 text-violet-600"
                  accent="#8b5cf6"
                />
                <KPI
                  icon={CheckCircle2}
                  value={stats.completed}
                  label="Completados"
                  color="bg-emerald-100 text-emerald-600"
                  accent="#10b981"
                />
              </div>

              {/* Contenedor Principal */}
              <div className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm">
                {/* Cabecera / Buscador / Tabs */}
                <div className="border-b border-slate-100 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    {/* Tabs */}
                    <div className="flex border-b border-slate-100 sm:border-0">
                      <button
                        onClick={() => setActiveTab('todo')}
                        className={`border-b-2 px-4 py-2 text-sm font-semibold transition ${
                          activeTab === 'todo'
                            ? 'border-brand-600 text-brand-600'
                            : 'border-transparent text-ink-500 hover:text-brand-600'
                        }`}
                      >
                        Por realizar ({stats.pending})
                      </button>
                      <button
                        onClick={() => setActiveTab('progress')}
                        className={`border-b-2 px-4 py-2 text-sm font-semibold transition ${
                          activeTab === 'progress'
                            ? 'border-brand-600 text-brand-600'
                            : 'border-transparent text-ink-500 hover:text-brand-600'
                        }`}
                      >
                        En ejecución ({stats.progress})
                      </button>
                      <button
                        onClick={() => setActiveTab('done')}
                        className={`border-b-2 px-4 py-2 text-sm font-semibold transition ${
                          activeTab === 'done'
                            ? 'border-brand-600 text-brand-600'
                            : 'border-transparent text-ink-500 hover:text-brand-600'
                        }`}
                      >
                        Finalizados ({stats.completed})
                      </button>
                    </div>

                    {/* Buscador */}
                    <div className="flex items-center gap-2 rounded-full bg-slate-50 px-3.5 py-2 ring-1 ring-slate-200">
                      <Search size={16} className="text-ink-500" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar cliente o equipo..."
                        className="w-full bg-transparent text-sm outline-none placeholder:text-ink-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Listado de Citas */}
                <div className="divide-y divide-slate-100 p-5">
                  {filteredAppts.length === 0 ? (
                    <div className="py-20 text-center text-ink-500">
                      <Wrench className="mx-auto text-brand-300 mb-3" size={40} />
                      <p className="font-semibold text-lg">No hay trabajos en esta sección</p>
                      <p className="text-sm mt-1">Usa el buscador o cambia de pestaña para revisar otros estados.</p>
                    </div>
                  ) : (
                    <div className="grid gap-5 md:grid-cols-2">
                      {filteredAppts.map((a) => {
                        const eq = a.equipment?.[0];
                        const wa = a.client.phone ? a.client.phone.replace(/\D/g, '') : '';
                        return (
                          <div
                            key={a.id}
                            className="flex flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:border-brand-200 transition-all duration-300"
                          >
                            {/* Header Tarjeta */}
                            <div className="flex items-start justify-between border-b border-slate-50 pb-3">
                              <div className="flex items-center gap-3">
                                <div className="grid h-10 w-10 place-items-center rounded-full bg-brand-gradient font-bold text-white text-sm">
                                  {(a.client.firstName[0] + a.client.lastName[0]).toUpperCase()}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-ink-900 leading-tight">
                                    {a.client.firstName} {a.client.lastName}
                                  </h4>
                                  <span className="text-xs text-ink-500">
                                    {a.client.email}
                                  </span>
                                </div>
                              </div>
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                  STATUS[a.status]?.cls
                                }`}
                              >
                                {STATUS[a.status]?.label}
                              </span>
                            </div>

                            {/* Detalle Servicio */}
                            <div className="mt-4 flex-1 space-y-3.5">
                              {/* Fecha/Hora */}
                              <div className="flex gap-5 text-sm text-ink-700">
                                <div>
                                  <span className="block text-xs text-ink-500 uppercase font-semibold">Fecha</span>
                                  <span className="font-semibold">{fmtDate(a.scheduledAt)}</span>
                                </div>
                                <div>
                                  <span className="block text-xs text-ink-500 uppercase font-semibold">Hora</span>
                                  <span className="font-semibold">{fmtTime(a.scheduledAt)}</span>
                                </div>
                              </div>

                              {/* Equipo */}
                              <div className="rounded-xl bg-brand-50 p-3.5 text-sm">
                                <div className="font-bold text-brand-800">
                                  {eq ? `${eq.brand} · ${eq.model}` : 'Aire acondicionado'}
                                </div>
                                {eq?.btuCapacity && (
                                  <div className="text-xs text-ink-700 mt-0.5">
                                    Capacidad: {eq.btuCapacity.toLocaleString()} BTU/h
                                  </div>
                                )}
                                <div className="mt-2 text-xs leading-relaxed text-ink-700">
                                  <span className="font-bold text-brand-900">Falla descrita:</span>{' '}
                                  {eq?.failureDescription || a.notes || 'Ninguna descrita'}
                                </div>
                              </div>
                            </div>

                            {/* Botones de acción */}
                            <div className="mt-5 flex items-center gap-3 border-t border-slate-50 pt-4">
                              {/* WhatsApp Directo */}
                              {wa && (
                                <a
                                  href={`https://wa.me/${wa}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  title="Contactar al cliente"
                                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors dark:bg-emerald-950/20 dark:text-emerald-400 dark:hover:bg-emerald-950/40 dark:ring-1 dark:ring-emerald-500/20"
                                >
                                  <MessageCircle size={20} />
                                </a>
                              )}

                              {/* Botón de Tomar Servicio */}
                              {!a.technicianId && (
                                <button
                                  onClick={() => claimJob(a.id)}
                                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-gradient py-2.5 font-bold text-white shadow-glow hover:shadow-glow-lg transition cursor-pointer"
                                >
                                  <ClipboardList size={16} /> Tomar servicio
                                </button>
                              )}

                              {/* Iniciar servicio (solo si ya está asignado al técnico actual) */}
                              {a.technicianId === user?.id && ['PENDING', 'ASSIGNED'].includes(a.status) && (
                                <button
                                  onClick={() => changeStatus(a.id, 'IN_PROGRESS')}
                                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-gradient py-2.5 font-bold text-white shadow-glow hover:shadow-glow-lg transition cursor-pointer"
                                >
                                  <Play size={16} fill="currentColor" /> Iniciar servicio
                                </button>
                              )}

                              {a.status === 'IN_PROGRESS' && (
                                <button
                                  onClick={() => changeStatus(a.id, 'COMPLETED')}
                                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 font-bold text-white hover:brightness-105 transition cursor-pointer"
                                >
                                  <CheckCircle2 size={16} /> Marcar como terminado
                                </button>
                              )}

                              {a.status === 'COMPLETED' && (
                                <div className="flex-1 text-center py-2 text-sm font-bold text-emerald-600 bg-emerald-50 rounded-xl dark:bg-emerald-950/20 dark:text-emerald-400 dark:ring-1 dark:ring-emerald-500/20">
                                  ✓ Servicio Completado
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

```

---

## ARCHIVO: `frontend-react/src/pages/AdminDashboard.jsx`

```javascript
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardList, Users, LogOut, Globe, RefreshCw,
  ClipboardCheck, Clock3, Wrench, Loader2, Search, MessageCircle, CheckCircle2,
  ArrowRight, Download, Sparkles,
  TrendingUp, Calendar, Pencil, Trash2, X, Sun, Moon,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useRate } from '../context/RateContext';
import { priceUsd } from '../lib/prices';
import { formatBs, formatUsd } from '../lib/money';
import { STATUS, fmtDate, fmtTime } from '../lib/status';

const MES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

/* ---- Donut SVG ---- */
function Donut({ data, total }) {
  const R = 70, C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <div className="flex flex-wrap items-center gap-8">
      <svg viewBox="0 0 180 180" className="h-44 w-44 -rotate-90">
        <circle cx="90" cy="90" r={R} fill="none" stroke="#eef2f6" strokeWidth="22" />
        {data.map((d) => {
          if (d.value === 0) return null;
          const len = (d.value / total) * C;
          const seg = (
            <circle key={d.key} cx="90" cy="90" r={R} fill="none" stroke={d.color}
              strokeWidth="22" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset} />
          );
          offset += len;
          return seg;
        })}
        <text x="90" y="86" transform="rotate(90 90 90)" textAnchor="middle" className="fill-ink-900 font-display text-2xl font-extrabold">{total}</text>
        <text x="90" y="104" transform="rotate(90 90 90)" textAnchor="middle" className="fill-ink-500 text-[10px]">citas</text>
      </svg>
      <div className="space-y-2">
        {data.map((d) => (
          <div key={d.key} className="flex items-center gap-2 text-sm font-medium text-ink-700">
            <span className="h-3 w-3 rounded" style={{ background: d.color }} /> {d.label} ({d.value})
          </div>
        ))}
      </div>
    </div>
  );
}

function KPI({ icon: Icon, value, label, color, accent, onClick }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      style={{ background: `linear-gradient(135deg, ${accent}22, #ffffff 62%)` }}
      className={`group relative w-full overflow-hidden rounded-2xl p-5 text-left shadow-sm ring-1 ring-white/60 backdrop-blur transition duration-300 ${onClick ? 'cursor-pointer hover:-translate-y-1 hover:shadow-glow-lg hover:ring-brand-200' : ''}`}
    >
      <div className="absolute inset-x-0 top-0 h-1" style={{ background: accent }} />
      {/* marca de agua translúcida */}
      <Icon size={104} className="pointer-events-none absolute -bottom-5 -right-4 opacity-[0.08] transition duration-300 group-hover:scale-110 group-hover:opacity-[0.12]" style={{ color: accent }} />
      <div className="relative">
        <div className={`grid h-11 w-11 place-items-center rounded-xl ${color} shadow-sm ring-1 ring-white/40`}><Icon size={21} /></div>
        <div className="mt-4 font-display text-3xl font-extrabold text-ink-900">{value}</div>
        <div className="text-sm font-medium text-ink-500">{label}</div>
        {onClick && (
          <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-brand-600 opacity-0 transition group-hover:opacity-100">
            Ver <ArrowRight size={12} />
          </span>
        )}
      </div>
    </Tag>
  );
}

/* Filtro compacto para meter DENTRO del encabezado de la tabla (fila de filtros) */
function ColFilter({ id, value, onChange, options, align }) {
  return (
    <div className={`flex items-center gap-1.5 rounded-lg bg-white px-2 py-1.5 ring-1 ring-slate-200 transition focus-within:ring-brand-400 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
      <Search size={12} className="shrink-0 text-ink-400" />
      <input list={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder="Filtrar…"
        className={`w-full min-w-0 bg-transparent text-xs font-normal normal-case tracking-normal text-ink-800 outline-none ${align === 'right' ? 'text-right' : ''}`} />
      {value && <button type="button" onClick={() => onChange('')} className="shrink-0 text-ink-400 hover:text-ink-700"><X size={12} /></button>}
      <datalist id={id}>{options.map((o) => <option key={o} value={o} />)}</datalist>
    </div>
  );
}

/* Filtro inteligente por columna: escribir (búsqueda) + elegir del desplegable (datalist) */
function FilterInput({ label, value, onChange, options, placeholder }) {
  const id = `flt-${label}`;
  return (
    <div>
      <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-ink-400">{label}</span>
      <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200 transition focus-within:bg-white focus-within:ring-brand-400">
        <Search size={14} className="shrink-0 text-ink-400" />
        <input list={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-transparent text-sm outline-none" />
        {value && <button type="button" onClick={() => onChange('')} className="shrink-0 text-ink-400 hover:text-ink-700"><X size={14} /></button>}
        <datalist id={id}>{options.map((o) => <option key={o} value={o} />)}</datalist>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const { rate } = useRate();
  const { toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const [view, setView] = useState('dashboard');
  const [appts, setAppts] = useState([]);
  const [clients, setClients] = useState([]);
  const [techs, setTechs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');            // filtro Cliente
  const [fServicio, setFServicio] = useState(''); // filtro Servicio
  const [fFecha, setFFecha] = useState('');       // filtro Fecha
  const [fEstado, setFEstado] = useState('');     // filtro Estado
  // Filtros de Clientes
  const [fcNombre, setFcNombre] = useState('');
  const [fcCorreo, setFcCorreo] = useState('');
  const [fcTel, setFcTel] = useState('');
  const [fcReg, setFcReg] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null); // cliente a eliminar (modal)
  const [deleting, setDeleting] = useState(false);
  // Ingresos: período activo (día/semana/mes/año o null=todos) + filtros de columna
  const [ingPeriodo, setIngPeriodo] = useState(null);
  const [fiFecha, setFiFecha] = useState('');
  const [fiCliente, setFiCliente] = useState('');
  const [fiServicio, setFiServicio] = useState('');
  const [fiTecnico, setFiTecnico] = useState('');
  const [fiMonto, setFiMonto] = useState('');
  const [editUser, setEditUser] = useState(null); // cliente en edición (null = cerrado)
  const [savingUser, setSavingUser] = useState(false);
  const [userMsg, setUserMsg] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [a, c, t] = await Promise.all([
        api.getAllAppointments(),
        api.getClients(),
        api.getTechnicians()
      ]);
      setAppts(a);
      setClients(c);
      setTechs(t || []);
    } catch (err) {
      if (err.status === 401 || err.status === 403) { logout(); navigate('/login'); }
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const stats = useMemo(() => {
    const by = (s) => appts.filter((a) => a.status === s).length;
    return {
      total: appts.length,
      pending: by('PENDING'),
      progress: by('ASSIGNED') + by('IN_PROGRESS'),
      clients: clients.length,
    };
  }, [appts, clients]);

  const donut = useMemo(() => Object.entries(STATUS).map(([key, m]) => ({
    key, label: m.label, color: m.dot, value: appts.filter((a) => a.status === key).length,
  })), [appts]);

  const months = useMemo(() => {
    const now = new Date(), keys = [], labels = [];
    for (let i = 5; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); keys.push(`${d.getFullYear()}-${d.getMonth()}`); labels.push(MES[d.getMonth()]); }
    const counts = keys.map(() => 0);
    appts.forEach((a) => { const d = new Date(a.createdAt); const k = `${d.getFullYear()}-${d.getMonth()}`; const i = keys.indexOf(k); if (i >= 0) counts[i]++; });
    const max = Math.max(...counts, 1);
    return labels.map((l, i) => ({ l, v: counts[i], pct: (counts[i] / max) * 100 }));
  }, [appts]);

  const brands = useMemo(() => {
    const c = {};
    appts.forEach((a) => (a.equipment || []).forEach((e) => { c[e.brand] = (c[e.brand] || 0) + 1; }));
    const entries = Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const max = Math.max(...entries.map((e) => e[1]), 1);
    return entries.map(([brand, v]) => ({ brand, v, pct: (v / max) * 100 }));
  }, [appts]);

  async function changeStatus(id, status) {
    try {
      await api.updateStatus(id, status);
      setAppts((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    } catch (err) {
      if (err.status === 401 || err.status === 403) { logout(); navigate('/login'); }
    }
  }

  async function handleAssign(id, technicianId) {
    try {
      const updated = await api.assignTechnician(id, technicianId);
      setAppts((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                technicianId,
                technician: techs.find((t) => t.id === technicianId) || null,
                status: updated.status,
              }
            : a
        )
      );
    } catch (err) {
      if (err.status === 401 || err.status === 403) { logout(); navigate('/login'); }
    }
  }

  // Texto "servicio" y "estado" de una cita (para filtrar)
  const servTxt = (a) => { const e = a.equipment?.[0]; return e ? `${e.brand} · ${e.model}` : (a.notes || ''); };
  const estadoTxt = (a) => STATUS[a.status]?.label || a.status;

  const filteredAppts = appts.filter((a) => {
    const cli = `${a.client.firstName} ${a.client.lastName} ${a.client.email}`.toLowerCase();
    return (
      (!q || cli.includes(q.toLowerCase())) &&
      (!fServicio || servTxt(a).toLowerCase().includes(fServicio.toLowerCase())) &&
      (!fFecha || fmtDate(a.scheduledAt).toLowerCase().includes(fFecha.toLowerCase())) &&
      (!fEstado || estadoTxt(a).toLowerCase().includes(fEstado.toLowerCase()))
    );
  });
  // Orden por defecto: más reciente primero
  const sortedAppts = [...filteredAppts].sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt));

  // Opciones para los desplegables (datalist) de cada filtro
  const uniq = (arr) => [...new Set(arr.filter(Boolean))];
  const optClientes = uniq(appts.map((a) => `${a.client.firstName} ${a.client.lastName}`));
  const optServicios = uniq(appts.map(servTxt));
  const optFechas = uniq(appts.map((a) => fmtDate(a.scheduledAt)));
  const optEstados = uniq(appts.map(estadoTxt));
  const hayFiltros = q || fServicio || fFecha || fEstado;
  const limpiarFiltros = () => { setQ(''); setFServicio(''); setFFecha(''); setFEstado(''); };

  // Sugerir técnico según el tipo de aire (ventana/split/toneladas)
  function suggestTech(a) {
    const eq = a.equipment?.[0];
    const text = `${eq?.brand || ''} ${eq?.model || ''} ${a.notes || ''}`.toLowerCase();
    const key = text.includes('ventana') ? 'ventana'
      : text.includes('split') ? 'split'
      : (text.includes('tonelada') || text.includes('toneladas')) ? 'tonelada'
      : null;
    if (!key) return null;
    return techs.find((t) => `${t.firstName} ${t.lastName}`.toLowerCase().includes(key)) || null;
  }

  // Ir a la lista de solicitudes con un filtro de estado puesto (desde las tarjetas del dashboard)
  function goToSolicitudes(filter) {
    limpiarFiltros();
    if (filter === 'PENDING') setFEstado('Pendiente');
    else if (filter === 'PROGRESS') setFEstado('proceso');
    setView('solicitudes');
  }

  // Exportar reporte real de solicitudes (CSV, abre en Excel)
  function exportReport() {
    if (!appts.length) return;
    const cols = ['Referencia', 'Cliente', 'Email', 'Teléfono', 'Servicio', 'Fecha', 'Hora', 'Técnico', 'Estado'];
    const rows = appts.map((a) => {
      const eq = a.equipment?.[0];
      return [
        a.id.substring(0, 8).toUpperCase(),
        `${a.client.firstName} ${a.client.lastName}`,
        a.client.email,
        a.client.phone || '',
        eq ? `${eq.brand} ${eq.model}` : (a.notes || ''),
        fmtDate(a.scheduledAt),
        fmtTime(a.scheduledAt),
        a.technician ? `${a.technician.firstName} ${a.technician.lastName}` : 'Sin asignar',
        STATUS[a.status]?.label || a.status,
      ];
    });
    const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [cols, ...rows].map((r) => r.map(esc).join(',')).join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte-solicitudes-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
  const filteredClients = clients.filter((c) => {
    const nombre = `${c.firstName} ${c.lastName}`.toLowerCase();
    return (
      (!fcNombre || nombre.includes(fcNombre.toLowerCase())) &&
      (!fcCorreo || (c.email || '').toLowerCase().includes(fcCorreo.toLowerCase())) &&
      (!fcTel || (c.phone || '').toLowerCase().includes(fcTel.toLowerCase())) &&
      (!fcReg || fmtDate(c.createdAt).toLowerCase().includes(fcReg.toLowerCase()))
    );
  });
  const optCNombre = uniq(clients.map((c) => `${c.firstName} ${c.lastName}`));
  const optCCorreo = uniq(clients.map((c) => c.email));
  const optCTel = uniq(clients.map((c) => c.phone));
  const optCReg = uniq(clients.map((c) => fmtDate(c.createdAt)));
  const hayFiltrosC = fcNombre || fcCorreo || fcTel || fcReg;
  const limpiarFiltrosC = () => { setFcNombre(''); setFcCorreo(''); setFcTel(''); setFcReg(''); };

  // ---- Gestión de usuarios (editar / eliminar) ----
  function openEdit(c) {
    setUserMsg('');
    setEditUser({ id: c.id, firstName: c.firstName, lastName: c.lastName, email: c.email, phone: c.phone || '', role: c.role, password: '' });
  }
  async function saveUser(e) {
    e.preventDefault();
    setSavingUser(true);
    setUserMsg('');
    try {
      const { id, password, ...rest } = editUser;
      const payload = { ...rest };
      if (password) payload.password = password;
      const updated = await api.updateUser(id, payload);
      setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
      setEditUser(null);
    } catch (err) {
      setUserMsg(err.message || 'No se pudo guardar');
    } finally {
      setSavingUser(false);
    }
  }
  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteUser(deleteTarget.id);
      setClients((prev) => prev.filter((x) => x.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      alert(err.message || 'No se pudo eliminar');
    } finally {
      setDeleting(false);
    }
  }

  // ---- Ingresos: servicios COMPLETADOS (ganancias reales) ----
  const priceOf = (a) => a.priceUsd ?? priceUsd(a.equipment?.[0]?.brand, a.equipment?.[0]?.model);
  const techName = (a) => {
    const t = a.technician || techs.find((x) => x.id === a.technicianId);
    return t ? `${t.firstName} ${t.lastName}` : 'Sin asignar';
  };
  const inPeriod = (d, period) => {
    const dt = new Date(d), now = new Date();
    if (period === 'day') return dt.toDateString() === now.toDateString();
    if (period === 'week') {
      const start = new Date(now); start.setDate(now.getDate() - now.getDay()); start.setHours(0, 0, 0, 0);
      return dt >= start;
    }
    if (period === 'month') return dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth();
    if (period === 'year') return dt.getFullYear() === now.getFullYear();
    return true;
  };
  const completedAppts = appts.filter((a) => a.status === 'COMPLETED');
  const earnings = (period) =>
    completedAppts.filter((a) => inPeriod(a.scheduledAt, period)).reduce((s, a) => s + priceOf(a), 0);
  const money = (usd) => formatBs(usd, rate) || formatUsd(usd);

  // Tabla de servicios completados: filtrada por período (calendario) + filtros de columna
  const completedFiltered = completedAppts.filter((a) => {
    if (ingPeriodo && !inPeriod(a.scheduledAt, ingPeriodo)) return false;
    const cli = `${a.client.firstName} ${a.client.lastName} ${a.client.email}`.toLowerCase();
    return (
      (!fiFecha || fmtDate(a.scheduledAt).toLowerCase().includes(fiFecha.toLowerCase())) &&
      (!fiCliente || cli.includes(fiCliente.toLowerCase())) &&
      (!fiServicio || servTxt(a).toLowerCase().includes(fiServicio.toLowerCase())) &&
      (!fiTecnico || techName(a).toLowerCase().includes(fiTecnico.toLowerCase())) &&
      (!fiMonto || formatUsd(priceOf(a)).toLowerCase().includes(fiMonto.toLowerCase()) || money(priceOf(a)).toLowerCase().includes(fiMonto.toLowerCase()))
    );
  });
  const optIFecha = uniq(completedAppts.map((a) => fmtDate(a.scheduledAt)));
  const optICliente = uniq(completedAppts.map((a) => `${a.client.firstName} ${a.client.lastName}`));
  const optIServicio = uniq(completedAppts.map(servTxt));
  const optITecnico = uniq(completedAppts.map(techName));
  const optIMonto = uniq(completedAppts.map((a) => formatUsd(priceOf(a))));
  const hayFiltrosI = fiFecha || fiCliente || fiServicio || fiTecnico || fiMonto || ingPeriodo;
  const limpiarFiltrosI = () => { setFiFecha(''); setFiCliente(''); setFiServicio(''); setFiTecnico(''); setFiMonto(''); setIngPeriodo(null); };

  function exportEarnings(period) {
    const label = { day: 'diario', week: 'semanal', month: 'mensual', year: 'anual' }[period];
    const list = completedAppts.filter((a) => inPeriod(a.scheduledAt, period));
    const cols = ['Fecha', 'Cliente', 'Servicio', 'Técnico', 'Precio USD', 'Precio Bs'];
    const rows = list.map((a) => {
      const eq = a.equipment?.[0];
      const usd = priceOf(a);
      return [fmtDate(a.scheduledAt), `${a.client.firstName} ${a.client.lastName}`,
        eq ? `${eq.brand} ${eq.model}` : '', techName(a), usd, rate ? (usd * rate).toFixed(2) : ''];
    });
    const totalUsd = rows.reduce((s, r) => s + r[4], 0);
    const totalRow = ['TOTAL', '', '', '', totalUsd, rate ? (totalUsd * rate).toFixed(2) : ''];
    const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [cols, ...rows, [], totalRow].map((r) => r.map(esc).join(',')).join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ingresos-${label}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const nav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'solicitudes', label: 'Solicitudes', icon: ClipboardList, badge: stats.pending },
    { id: 'ingresos', label: 'Ingresos', icon: TrendingUp },
    { id: 'clientes', label: 'Clientes', icon: Users, badge: stats.clients },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-brand-950 lg:flex">
        <div className="flex items-center gap-2.5 border-b border-white/10 px-6 py-5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white p-1 shadow-sm"><img src="/logo.png" alt="Fresh Service" className="h-full w-full object-contain" /></span>
          <div>
            <div className="font-display text-sm font-extrabold text-white leading-none">Fresh Service</div>
            <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-400">Panel Taller</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {nav.map((n) => (
            <button key={n.id} onClick={() => setView(n.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${view === n.id ? 'bg-white/10 text-white ring-1 ring-white/10' : 'text-brand-100/70 hover:bg-white/5 hover:text-white'}`}>
              <n.icon size={18} /> {n.label}
              {n.badge > 0 && <span className="ml-auto rounded-full bg-brand-500 px-2 py-0.5 text-xs font-bold text-white">{n.badge}</span>}
            </button>
          ))}
        </nav>
        <div className="space-y-2 border-t border-white/10 p-4">
          <Link to="/" target="_blank" className="flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold text-white ring-1 ring-white/15 transition hover:bg-white/20 hover:ring-white/30"><Globe size={16} /> Ver sitio web</Link>
          <button onClick={() => { logout(); navigate('/'); }} className="flex w-full items-center gap-2 rounded-xl bg-rose-500/15 px-4 py-2.5 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/25"><LogOut size={17} /> Cerrar sesión</button>
          <div className="flex items-center gap-2.5 pt-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-gradient font-bold text-white">{user.firstName[0]}</div>
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-white">{user.firstName} {user.lastName}</div>
              <div className="text-xs text-brand-400">Taller · S.J. de los Morros</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 lg:ml-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-5 backdrop-blur lg:px-8">
          <div>
            <div className="font-display font-bold text-ink-900">
              {view === 'dashboard' ? 'Panel de Control' : view === 'solicitudes' ? 'Gestión de Solicitudes' : view === 'ingresos' ? 'Control de Servicios Realizados' : 'Clientes del Taller'}
            </div>
            <div className="text-xs text-ink-500">Fresh Service Digital · Taller de Refrigeración</div>
          </div>
          <div className="flex items-center gap-3">
            {/* Mobile nav */}
            <select value={view} onChange={(e) => setView(e.target.value)} className="rounded-full border border-slate-200 px-3 py-1.5 text-sm lg:hidden">
              <option value="dashboard">Dashboard</option><option value="solicitudes">Solicitudes</option><option value="ingresos">Ingresos</option><option value="clientes">Clientes</option>
            </select>
            <button onClick={toggleTheme} title="Cambiar tema" className="grid h-9 w-9 place-items-center rounded-full text-ink-600 ring-1 ring-slate-200 transition hover:bg-slate-100">
              {isDark ? <Sun size={17} className="text-amber-500" /> : <Moon size={17} className="text-brand-700" />}
            </button>
            <button onClick={load} className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-sm font-bold text-brand-700 ring-1 ring-brand-100 transition hover:bg-brand-100">
              <RefreshCw size={15} /> <span className="hidden sm:inline">Actualizar</span>
            </button>
          </div>
        </header>

        <div className="p-5 lg:p-8">
          {loading ? (
            <div className="grid place-items-center py-32 text-brand-400"><Loader2 className="animate-spin" size={36} /></div>
          ) : view === 'dashboard' ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl font-extrabold text-ink-900">Resumen del Taller</h2>
                  <p className="text-sm text-ink-500">Estadísticas en vivo desde la base de datos</p>
                </div>
                <button onClick={exportReport} disabled={!appts.length}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 ring-1 ring-emerald-200 transition hover:bg-emerald-100 disabled:opacity-50">
                  <Download size={15} /> Exportar Excel
                </button>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <KPI icon={ClipboardCheck} value={stats.total} label="Solicitudes registradas" color="bg-brand-100 text-brand-600" accent="#0ea5e9" onClick={() => goToSolicitudes('ALL')} />
                <KPI icon={Clock3} value={stats.pending} label="Pendientes de atender" color="bg-amber-100 text-amber-600" accent="#f59e0b" onClick={() => goToSolicitudes('PENDING')} />
                <KPI icon={Wrench} value={stats.progress} label="En proceso" color="bg-violet-100 text-violet-600" accent="#8b5cf6" onClick={() => goToSolicitudes('PROGRESS')} />
                <KPI icon={Users} value={stats.clients} label="Clientes registrados" color="bg-emerald-100 text-emerald-600" accent="#10b981" onClick={() => setView('clientes')} />
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-100 shadow-sm">
                  <h3 className="font-display font-bold text-ink-900">Citas por estado</h3>
                  <p className="mb-5 text-xs text-ink-500">Distribución del flujo de trabajo</p>
                  <Donut data={donut} total={stats.total || 1} />
                </div>
                <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-100 shadow-sm">
                  <h3 className="font-display font-bold text-ink-900">Citas por mes</h3>
                  <p className="mb-6 text-xs text-ink-500">Solicitudes recibidas (últimos 6 meses)</p>
                  <div className="flex h-44 items-end justify-between gap-3">
                    {months.map((m) => (
                      <div key={m.l} className="group flex flex-1 flex-col items-center gap-2">
                        <div className="text-xs font-bold text-brand-700 opacity-70 transition group-hover:opacity-100">{m.v || ''}</div>
                        <div className="flex w-full items-end" style={{ height: '120px' }}>
                          <div
                            className="w-full rounded-t-lg shadow-[inset_0_2px_4px_rgba(255,255,255,0.45),0_6px_14px_-3px_rgba(2,132,199,0.5)] ring-1 ring-inset ring-white/25 transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:brightness-110"
                            style={{
                              height: `${Math.max(m.pct, 3)}%`,
                              background: 'linear-gradient(180deg, #7dd3fc 0%, #0ea5e9 55%, #0284c7 100%)',
                            }}
                          />
                        </div>
                        <div className="text-xs font-medium text-ink-500 transition group-hover:font-bold group-hover:text-brand-700">{m.l}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-100 shadow-sm lg:col-span-2">
                  <h3 className="font-display font-bold text-ink-900">Marcas de equipos más atendidas</h3>
                  <p className="mb-5 text-xs text-ink-500">Ranking de marcas en servicio</p>
                  <div className="space-y-3">
                    {brands.map((b) => (
                      <div key={b.brand} className="flex items-center gap-3">
                        <div className="w-24 shrink-0 text-right text-sm font-semibold text-ink-700">{b.brand}</div>
                        <div className="h-5 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${b.pct}%` }} />
                        </div>
                        <div className="w-6 text-sm font-bold text-ink-900">{b.v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : view === 'solicitudes' ? (
            <div className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm">
              <div className="border-b border-slate-100 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-bold text-ink-900">Solicitudes en vivo</h3>
                    <p className="text-xs text-ink-500">{sortedAppts.length} de {appts.length} solicitudes</p>
                  </div>
                  {hayFiltros && (
                    <button onClick={limpiarFiltros} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-ink-600 transition hover:bg-slate-200">
                      <X size={13} /> Limpiar filtros
                    </button>
                  )}
                </div>
                {/* Filtros inteligentes por columna (escribir o elegir del desplegable) */}
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <FilterInput label="Cliente" value={q} onChange={setQ} options={optClientes} placeholder="Nombre o correo…" />
                  <FilterInput label="Servicio" value={fServicio} onChange={setFServicio} options={optServicios} placeholder="Tipo de servicio…" />
                  <FilterInput label="Fecha" value={fFecha} onChange={setFFecha} options={optFechas} placeholder="Fecha…" />
                  <FilterInput label="Estado" value={fEstado} onChange={setFEstado} options={optEstados} placeholder="Estado…" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-ink-500">
                    <tr>
                      <th className="px-5 py-3">Cliente</th>
                      <th className="px-3 py-3">Servicio</th>
                      <th className="px-3 py-3">Fecha</th>
                      <th className="px-3 py-3">Técnico</th>
                      <th className="px-3 py-3">Estado</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAppts.map((a) => {
                       const eq = a.equipment?.[0];
                       const wa = a.client.phone ? a.client.phone.replace(/\D/g, '') : '';
                       return (
                        <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-gradient text-xs font-bold text-white">
                                {(a.client.firstName[0] + a.client.lastName[0]).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-ink-900">{a.client.firstName} {a.client.lastName}</div>
                                <div className="text-xs text-ink-500">{a.client.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="font-medium text-ink-800">{eq ? `${eq.brand} · ${eq.model}` : '—'}</div>
                            <div className="max-w-[200px] truncate text-xs text-ink-500">{eq?.failureDescription || a.notes}</div>
                          </td>
                          <td className="px-3 py-3 text-ink-700">{fmtDate(a.scheduledAt)}<div className="text-xs text-ink-400">{fmtTime(a.scheduledAt)}</div></td>
                          <td className="px-3 py-3">
                            <select
                              value={a.technicianId || ''}
                              onChange={(e) => handleAssign(a.id, e.target.value || null)}
                              className="rounded-xl border border-slate-200 px-2 py-1 text-xs outline-none bg-slate-50 text-ink-700 font-semibold focus:ring-1 focus:ring-brand-400"
                            >
                              <option value="">Sin asignar</option>
                              {techs.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.firstName} {t.lastName}
                                </option>
                              ))}
                            </select>
                            {!a.technicianId && (() => {
                              const sug = suggestTech(a);
                              return sug ? (
                                <button onClick={() => handleAssign(a.id, sug.id)}
                                  title={`Asignar a ${sug.firstName} ${sug.lastName}`}
                                  className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-brand-600 transition hover:text-brand-700">
                                  <Sparkles size={11} /> Sugerido: {sug.firstName}
                                </button>
                              ) : null;
                            })()}
                          </td>
                          <td className="px-3 py-3">
                            <select value={a.status} onChange={(e) => changeStatus(a.id, e.target.value)}
                              className={`rounded-full px-3 py-1 text-xs font-bold outline-none ${STATUS[a.status]?.cls}`}>
                              {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                            </select>
                          </td>
                          <td className="px-5 py-3">
                            {wa && <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:hover:bg-emerald-950/40 dark:ring-1 dark:ring-emerald-500/20"><MessageCircle size={16} /></a>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : view === 'ingresos' ? (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-extrabold text-ink-900">Control de Servicios Realizados</h2>
                <p className="text-sm text-ink-500">Ingresos por servicios completados · {completedAppts.length} servicios</p>
              </div>

              {/* Tarjetas por período — CLICK filtra la tabla; el botón CSV descarga */}
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { p: 'day', label: 'Hoy', accent: '#0ea5e9', icon: Calendar },
                  { p: 'week', label: 'Esta semana', accent: '#8b5cf6', icon: Calendar },
                  { p: 'month', label: 'Este mes', accent: '#f59e0b', icon: Calendar },
                  { p: 'year', label: 'Este año', accent: '#10b981', icon: TrendingUp },
                ].map(({ p, label, accent, icon: Icon }) => {
                  const active = ingPeriodo === p;
                  return (
                    <button key={p} type="button" onClick={() => setIngPeriodo(active ? null : p)}
                      title="Filtrar la tabla por este período"
                      style={{ background: `linear-gradient(135deg, ${accent}22, #ffffff 62%)` }}
                      className={`group relative overflow-hidden rounded-2xl p-5 text-left shadow-sm transition ${active ? 'shadow-glow ring-2 ring-brand-500' : 'ring-1 ring-white/60 hover:-translate-y-0.5 hover:shadow-glow-lg'}`}>
                      <div className="absolute inset-x-0 top-0 h-1" style={{ background: accent }} />
                      <Icon size={104} className="pointer-events-none absolute -bottom-5 -right-4 opacity-[0.08]" style={{ color: accent }} />
                      <div className="relative">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wide text-ink-500">{label}</span>
                          <Icon size={16} style={{ color: accent }} />
                        </div>
                        <div className="mt-3 font-display text-2xl font-extrabold text-ink-900">{money(earnings(p))}</div>
                        <div className="text-xs text-ink-400">Ref. {formatUsd(earnings(p))}</div>
                        <span onClick={(e) => { e.stopPropagation(); exportEarnings(p); }}
                          className="mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200 transition hover:bg-emerald-100">
                          <Download size={13} /> CSV
                        </span>
                        {active && <span className="mt-2 block text-[11px] font-bold text-brand-600">● Filtrando la tabla ↓ (clic para quitar)</span>}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Tabla de servicios completados con filtros por columna */}
              <div className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm">
                <div className="border-b border-slate-100 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="font-display font-bold text-ink-900">Servicios completados</h3>
                      <p className="text-xs text-ink-500">{completedFiltered.length} de {completedAppts.length}{ingPeriodo ? ' · período seleccionado' : ''}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {hayFiltrosI && (
                        <button onClick={limpiarFiltrosI} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-ink-600 transition hover:bg-slate-200"><X size={13} /> Limpiar</button>
                      )}
                      <span className="text-xs text-ink-500">Total: <strong className="text-ink-900">{money(completedFiltered.reduce((s, a) => s + priceOf(a), 0))}</strong></span>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-ink-500">
                      <tr>
                        <th className="px-5 pt-3">Fecha</th>
                        <th className="px-3 pt-3">Cliente</th>
                        <th className="px-3 pt-3">Servicio</th>
                        <th className="px-3 pt-3">Técnico</th>
                        <th className="px-5 pt-3 text-right">Monto</th>
                      </tr>
                      <tr>
                        <th className="px-5 pb-3 pt-2 font-normal"><ColFilter id="if-fecha" value={fiFecha} onChange={setFiFecha} options={optIFecha} /></th>
                        <th className="px-3 pb-3 pt-2 font-normal"><ColFilter id="if-cli" value={fiCliente} onChange={setFiCliente} options={optICliente} /></th>
                        <th className="px-3 pb-3 pt-2 font-normal"><ColFilter id="if-serv" value={fiServicio} onChange={setFiServicio} options={optIServicio} /></th>
                        <th className="px-3 pb-3 pt-2 font-normal"><ColFilter id="if-tec" value={fiTecnico} onChange={setFiTecnico} options={optITecnico} /></th>
                        <th className="px-5 pb-3 pt-2 font-normal"><ColFilter id="if-monto" value={fiMonto} onChange={setFiMonto} options={optIMonto} align="right" /></th>
                      </tr>
                    </thead>
                    <tbody>
                      {completedFiltered.length === 0 ? (
                        <tr><td colSpan={5} className="px-5 py-10 text-center text-ink-500">No hay servicios completados con esos filtros.</td></tr>
                      ) : (
                        [...completedFiltered].sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt)).map((a) => {
                          const eq = a.equipment?.[0];
                          return (
                            <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                              <td className="px-5 py-3 text-ink-700">{fmtDate(a.scheduledAt)}</td>
                              <td className="px-3 py-3 font-medium text-ink-900">{a.client.firstName} {a.client.lastName}</td>
                              <td className="px-3 py-3 text-ink-700">{eq ? `${eq.brand} · ${eq.model}` : '—'}</td>
                              <td className="px-3 py-3 text-ink-600">{techName(a)}</td>
                              <td className="px-5 py-3 text-right"><div className="font-semibold text-ink-900">{money(priceOf(a))}</div><div className="text-[11px] text-ink-400">Ref. {formatUsd(priceOf(a))}</div></td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm">
              <div className="border-b border-slate-100 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-bold text-ink-900">Directorio de clientes</h3>
                    <p className="text-xs text-ink-500">{filteredClients.length} clientes registrados</p>
                  </div>
                  {hayFiltrosC && (
                    <button onClick={limpiarFiltrosC} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-ink-600 transition hover:bg-slate-200">
                      <X size={13} /> Limpiar filtros
                    </button>
                  )}
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <FilterInput label="Cliente" value={fcNombre} onChange={setFcNombre} options={optCNombre} placeholder="Nombre…" />
                  <FilterInput label="Correo" value={fcCorreo} onChange={setFcCorreo} options={optCCorreo} placeholder="Correo…" />
                  <FilterInput label="Teléfono" value={fcTel} onChange={setFcTel} options={optCTel} placeholder="Teléfono…" />
                  <FilterInput label="Registrado" value={fcReg} onChange={setFcReg} options={optCReg} placeholder="Fecha…" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-ink-500">
                    <tr><th className="px-5 py-3">Cliente</th><th className="px-3 py-3">Correo</th><th className="px-3 py-3">Teléfono</th><th className="px-3 py-3">Citas</th><th className="px-3 py-3">Cuenta</th><th className="px-3 py-3">Registrado</th><th className="px-5 py-3 text-right">Acciones</th></tr>
                  </thead>
                  <tbody>
                    {filteredClients.map((c) => {
                      const wa = c.phone ? c.phone.replace(/\D/g, '') : '';
                      return (
                        <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-violet-400 text-xs font-bold text-white">
                                {(c.firstName[0] + c.lastName[0]).toUpperCase()}
                              </div>
                              <span className="font-semibold text-ink-900">{c.firstName} {c.lastName}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-ink-700">{c.email}</td>
                          <td className="px-3 py-3">
                            {wa ? <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-medium text-brand-700">{c.phone} <MessageCircle size={13} /></a> : 'N/A'}
                          </td>
                          <td className="px-3 py-3"><span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-700 ring-1 ring-brand-100">{c._count?.appointments ?? 0}</span></td>
                          <td className="px-3 py-3">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${c.isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                              {c.isVerified ? <CheckCircle2 size={12} /> : null} {c.isVerified ? 'Verificado' : 'Pendiente'}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-ink-500">{fmtDate(c.createdAt)}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-end gap-1.5">
                              <button onClick={() => openEdit(c)} title="Editar"
                                className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-600 transition hover:bg-brand-100"><Pencil size={15} /></button>
                              <button onClick={() => setDeleteTarget(c)} title="Eliminar"
                                className="grid h-8 w-8 place-items-center rounded-lg bg-rose-50 text-rose-600 transition hover:bg-rose-100"><Trash2 size={15} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de edición de usuario */}
      {editUser && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink-900/50 p-4" onClick={() => setEditUser(null)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={saveUser}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-ink-900">Editar usuario</h3>
              <button type="button" onClick={() => setEditUser(null)} className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-slate-100"><X size={18} /></button>
            </div>
            {userMsg && <div className="mt-3 rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700 ring-1 ring-rose-100">{userMsg}</div>}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="block"><span className="mb-1 block text-xs font-bold uppercase text-ink-500">Nombre</span>
                <input required value={editUser.firstName} onChange={(e) => setEditUser({ ...editUser, firstName: e.target.value })} className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400" /></label>
              <label className="block"><span className="mb-1 block text-xs font-bold uppercase text-ink-500">Apellido</span>
                <input required value={editUser.lastName} onChange={(e) => setEditUser({ ...editUser, lastName: e.target.value })} className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400" /></label>
            </div>
            <label className="mt-3 block"><span className="mb-1 block text-xs font-bold uppercase text-ink-500">Correo</span>
              <input required type="email" value={editUser.email} onChange={(e) => setEditUser({ ...editUser, email: e.target.value })} className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400" /></label>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="block"><span className="mb-1 block text-xs font-bold uppercase text-ink-500">Teléfono</span>
                <input value={editUser.phone} onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })} placeholder="+58 412-0000000" className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400" /></label>
              <label className="block"><span className="mb-1 block text-xs font-bold uppercase text-ink-500">Rol</span>
                <select value={editUser.role} onChange={(e) => setEditUser({ ...editUser, role: e.target.value })} className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400">
                  <option value="CLIENT">Cliente</option><option value="TECHNICIAN">Técnico</option><option value="ADMIN">Admin</option>
                </select></label>
            </div>
            <label className="mt-3 block"><span className="mb-1 block text-xs font-bold uppercase text-ink-500">Nueva contraseña <span className="font-normal normal-case text-ink-400">(opcional)</span></span>
              <input type="text" value={editUser.password} onChange={(e) => setEditUser({ ...editUser, password: e.target.value })} placeholder="Dejar vacío para no cambiarla" className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400" /></label>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setEditUser(null)} className="rounded-full px-4 py-2 text-sm font-semibold text-ink-600 hover:bg-slate-100">Cancelar</button>
              <button type="submit" disabled={savingUser} className="rounded-full bg-brand-gradient px-5 py-2 text-sm font-bold text-white shadow-glow transition hover:brightness-105 disabled:opacity-50">{savingUser ? 'Guardando…' : 'Guardar cambios'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink-900/50 p-4" onClick={() => !deleting && setDeleteTarget(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-rose-100 text-rose-600">
              <Trash2 size={26} />
            </div>
            <h3 className="mt-4 font-display text-lg font-bold text-ink-900">¿Eliminar este cliente?</h3>
            <p className="mt-2 text-sm text-ink-500">
              Vas a eliminar a <strong className="text-ink-900">{deleteTarget.firstName} {deleteTarget.lastName}</strong> ({deleteTarget.email}).
              {deleteTarget._count?.appointments > 0 && <> Se borrarán también sus <strong className="text-rose-600">{deleteTarget._count.appointments} solicitud(es)</strong>.</>}
              {' '}Esta acción no se puede deshacer.
            </p>
            <div className="mt-6 flex gap-2">
              <button onClick={() => setDeleteTarget(null)} disabled={deleting} className="flex-1 rounded-full bg-slate-100 px-4 py-2.5 text-sm font-bold text-ink-700 transition hover:bg-slate-200 disabled:opacity-50">Cancelar</button>
              <button onClick={confirmDelete} disabled={deleting} className="flex-1 rounded-full bg-rose-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-700 disabled:opacity-50">{deleting ? 'Eliminando…' : 'Sí, eliminar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

```
