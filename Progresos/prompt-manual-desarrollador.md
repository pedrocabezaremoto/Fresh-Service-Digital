# PROMPT: Manual del Desarrollador — Fresh Service Digital

## INSTRUCCION
Genera un manual técnico para desarrolladores de Fresh Service Digital. El archivo de salida debe ser `/root/Fresh-Service-Digital/Manuales/manual-desarrollador.md`. Escríbelo en español técnico. Debe servir para que un desarrollador nuevo entienda el proyecto completo en 30 minutos.

## CONTEXTO
- **Proyecto:** Fresh Service Digital — plataforma de gestión de servicios de refrigeración a domicilio
- **Producción:** https://fresh.pedroservicios.xyz (frontend :4100) / https://api.pedroservicios.xyz (backend :4000)
- **VPS:** Ubuntu Linux, gestionado con pm2 + Traefik (HTTPS/Let's Encrypt)
- **Gestor de paquetes:** pnpm (NO npm, migrado por seguridad supply-chain)
- **Deploy:** automático por webhook (push a main → build → restart)

## ESTRUCTURA DEL PROYECTO

```
Fresh-Service-Digital/
├── backend/                    ← API REST + WebSocket
│   ├── src/
│   │   ├── main.ts             ← Entry point (NestJS, puerto 4000, CORS)
│   │   ├── app.module.ts       ← Módulo raíz (importa todos los módulos)
│   │   ├── prisma/             ← PrismaService (conexión a PostgreSQL)
│   │   ├── auth/               ← JWT guard, roles guard, decorators
│   │   ├── users/              ← CRUD usuarios + login + registro + técnicos
│   │   ├── appointments/       ← CRUD citas + asignación + estados
│   │   ├── services/           ← CRUD servicios + categorías + tipos equipo
│   │   ├── chat/               ← Copito IA (DeepSeek) + chat en vivo (Socket.IO)
│   │   │   ├── chat.controller.ts    ← POST /chat (SSE stream), uploads
│   │   │   ├── chat.gateway.ts       ← Socket.IO namespace /live-chat
│   │   │   ├── chat.service.ts       ← Lógica de mensajes, leads, moderación
│   │   │   ├── llm.service.ts        ← DeepSeek API + tool calling
│   │   │   └── chat-telegram.service.ts ← Notificaciones @copito_fresh_bot
│   │   ├── mail/               ← Resend SMTP (noreply@pedroservicios.xyz)
│   │   ├── rate/               ← Tasa BCV (DolarAPI, cache 6h en DB)
│   │   ├── carousel/           ← CRUD imágenes del carrusel hero
│   │   ├── ticker/             ← CRUD ticker promocional
│   │   ├── site-images/        ← Upload/gestión de fotos del sitio (Hero + Técnico)
│   │   └── common/prices.ts    ← Precios base en USD (fallback histórico)
│   ├── prisma/
│   │   ├── schema.prisma       ← 14 modelos (User, Appointment, Service, Chat*, etc.)
│   │   ├── migrations/         ← Migraciones acumuladas
│   │   ├── seed.js             ← Seed principal (admin + clientes demo)
│   │   └── seed-technicians.js ← Seed técnicos (upsert idempotente)
│   ├── uploads/                ← Archivos subidos (gitignored)
│   │   ├── site-images/        ← Fotos del sitio (Hero + Técnico)
│   │   ├── equipment-types/    ← Fotos por tipo de equipo (dinámico)
│   │   ├── carousel/           ← Fotos del carrusel
│   │   └── chat-images/        ← Fotos del chat
│   └── .env                    ← Variables de entorno (gitignored)
│
├── frontend-react/             ← SPA React
│   ├── index.html              ← Entry HTML (manifest, OG tags, fonts)
│   ├── vite.config.js          ← Vite 6 + React + Tailwind v4
│   ├── serve.mjs               ← Servidor estático producción (SPA fallback)
│   ├── public/
│   │   ├── manifest.json       ← PWA manifest
│   │   ├── sw.js               ← Service Worker (cache fsd-v1)
│   │   ├── copito-avatar.png   ← Mascota Copito
│   │   ├── icon-192.png        ← PWA icon
│   │   ├── icon-512.png        ← PWA icon
│   │   └── *.png               ← Fotos estáticas (aires, favicon, etc.)
│   └── src/
│       ├── main.jsx            ← Entry React (providers, SW registration)
│       ├── App.jsx             ← Router (react-router-dom v7)
│       ├── index.css           ← Design system (Tailwind v4, temas, animaciones)
│       ├── pages/
│       │   ├── Home.jsx            ← Landing (hero, cards, ticker)
│       │   ├── Catalogo.jsx        ← Catálogo acordeón (3 categorías)
│       │   ├── Solicitud.jsx       ← Formulario de solicitud + mapa
│       │   ├── Login.jsx           ← Login (email o username)
│       │   ├── Registro.jsx        ← Registro cliente
│       │   ├── Recuperar.jsx       ← Recuperar contraseña
│       │   ├── Restablecer.jsx     ← Restablecer contraseña (con token)
│       │   ├── Proforma.jsx        ← Proforma imprimible
│       │   ├── ClienteDashboard.jsx   ← Panel del cliente
│       │   ├── TecnicoDashboard.jsx   ← Panel del técnico
│       │   └── AdminDashboard.jsx     ← Panel admin (9 vistas: Dashboard, Solicitudes, Ingresos, Clientes, Técnicos, Servicios, Imágenes, Chat en vivo, Leads)
│       ├── components/
│       │   ├── Navbar.jsx, Footer.jsx, Logo.jsx, Button.jsx
│       │   ├── Copito.jsx          ← Widget chatbot completo
│       │   ├── TickerBar.jsx       ← Ticker marquee / franja de confianza
│       │   ├── HeroCarousel.jsx    ← Carrusel dinámico del hero
│       │   ├── Price.jsx           ← Precio USD + Bs con tasa BCV
│       │   ├── PublicLayout.jsx    ← Layout público (navbar + footer + Copito)
│       │   ├── ProtectedRoute.jsx  ← Guard de rutas autenticadas
│       │   ├── AuthShell.jsx       ← Layout de auth (login/registro)
│       │   ├── admin/              ← Componentes del panel admin
│       │   │   ├── AdminChatView.jsx    ← Chat en vivo completo
│       │   │   ├── DashboardVisuals.jsx ← Gráficos SVG (donut, barras, sparklines)
│       │   │   ├── CarouselSection.jsx  ← CRUD carrusel
│       │   │   ├── SiteImagesSection.jsx← CRUD imágenes del sitio (Hero + Técnico)
│       │   │   ├── TickerSection.jsx    ← CRUD ticker
│       │   │   ├── ConfirmModal.jsx     ← Modal de confirmación reutilizable
│       │   │   ├── EmojiPicker.jsx      ← Emojis para el chat
│       │   │   └── QuickReplies.jsx     ← Respuestas rápidas del operador
│       │   └── maps/               ← Componentes Leaflet.js
│       │       ├── LocationPicker.jsx   ← Mapa interactivo (solicitud)
│       │       ├── LocationView.jsx     ← Mapa solo lectura (técnico)
│       │       ├── ServiceMap.jsx       ← Mapa multi-marker (admin)
│       │       └── fixLeafletIcons.js   ← Fix iconos Vite
│       ├── context/
│       │   ├── AuthContext.jsx     ← JWT + user state
│       │   ├── ThemeContext.jsx    ← Tema claro/oscuro
│       │   ├── RateContext.jsx     ← Tasa BCV del día
│       │   └── SiteImagesContext.jsx ← Imágenes del sitio (cache localStorage)
│       └── lib/
│           ├── api.js              ← Todas las llamadas al backend
│           ├── prices.js           ← Precios base USD (fallback)
│           ├── services.js         ← Fallback equipos/servicios
│           ├── images.js           ← Rutas de imágenes por defecto
│           ├── money.js            ← Formateo Bs/USD
│           └── status.js           ← Labels/colores de estados
│
├── Progresos/                  ← Prompts y progreso del proyecto
├── Manuales/                   ← Documentación (este manual va aquí)
├── deploy.sh                   ← Script de deploy (pnpm install + build + restart)
├── webhook.mjs                 ← Webhook GitHub (deploy automático en push)
└── docker/                     ← Docker Compose para demo offline
```

## SECCIONES QUE DEBE TENER

### 1. Requisitos y setup local
- Node.js 22+, pnpm 11+, PostgreSQL 15+
- Clonar repo, `pnpm install` en backend/ y frontend-react/
- Copiar `.env.example` a `.env` y llenar variables
- Variables de entorno del backend: DATABASE_URL, JWT_SECRET, SMTP_HOST/USER/PASS (Resend), DEEPSEEK_API_KEY, TELEGRAM_BOT_TOKEN/CHAT_ID
- `pnpm prisma migrate deploy` + `node prisma/seed.js`
- `pnpm run start:dev` (backend) + `pnpm run dev` (frontend)

### 2. Arquitectura general
- Diagrama de flujo: Cliente → React SPA → API NestJS → PostgreSQL
- WebSocket: Socket.IO namespace `/live-chat` para chat en tiempo real
- SSE: POST `/chat` devuelve stream de tokens para Copito
- Autenticación: JWT (Bearer token en header Authorization)
- Roles: CLIENT, ADMIN, TECHNICIAN (guards en backend)
- Precios: base en USD, convertidos a Bs con tasa BCV (endpoint `/rate`)
- Correo: Resend SMTP, from `noreply@pedroservicios.xyz`

### 3. Base de datos (Prisma)
- Listar los 14 modelos con sus campos principales y relaciones
- Cómo crear una migración: `pnpm prisma migrate dev --name descripcion`
- REGLA: NUNCA cambiar schema.prisma sin migración (rompe deploy automático)

### 4. Backend — módulos y endpoints
- Tabla con TODOS los endpoints: método, ruta, auth requerida, descripción
- Agrupar por módulo: auth, users, appointments, services, chat, rate, carousel, ticker, site-images
- Explicar el flujo del chat: mensaje → si operatorActive → guardar y emitir socket → si no → LLM stream SSE
- Explicar tool calling de Copito: `guardar_contacto` (crea lead, notifica Telegram), `consultar_servicios` (lee DB)

### 5. Frontend — páginas y componentes
- Tabla de rutas (path → componente → auth requerida → rol)
- Explicar los 4 contextos (Auth, Theme, Rate, SiteImages)
- Explicar `api.js` (función `request` centralizada, token automático)
- Cómo agregar una nueva página: crear en pages/, agregar ruta en App.jsx, link en Navbar

### 6. Deploy y operación
- Deploy automático: push a main → webhook → `deploy.sh` → build backend + frontend → pm2 restart
- Deploy manual: `cd /root/Fresh-Service-Digital && ./deploy.sh`
- Procesos pm2: fresh-service (backend :4000), fresh-frontend (:4100), fresh-webhook (:4200)
- Logs: `pm2 logs fresh-service`, `pm2 logs fresh-frontend`
- Re-sembrar datos demo: `cd backend && node prisma/seed.js`
- Traefik maneja HTTPS (Let's Encrypt). NO usar nginx en puertos 80/443.

### 7. Cómo agregar funcionalidades
- Nuevo módulo backend: crear carpeta en src/, controller + service + module, importar en app.module.ts
- Nuevo modelo DB: editar schema.prisma, `pnpm prisma migrate dev --name nombre`, agregar endpoints
- Nueva vista admin: agregar sección en AdminDashboard.jsx (seguir patrón de las 9 vistas existentes)
- Nuevo endpoint en frontend: agregar método en `api.js`

### 8. Credenciales de desarrollo
- Las credenciales demo están en `backend/prisma/seed.js` (admin, técnicos, clientes)
- Las variables de entorno sensibles (JWT_SECRET, DEEPSEEK_API_KEY, SMTP, Telegram) están en `backend/.env` (gitignored)
- Correo de salida: noreply@pedroservicios.xyz (configurado en .env)

### 9. Problemas conocidos y soluciones
- `Cannot POST /endpoint` → el backend no se rebuild: `cd backend && pnpm run build && pm2 restart fresh-service`
- Fotos se ven con halo gris → la imagen PNG tiene píxeles semi-transparentes, aplicar threshold de alpha
- `prefers-reduced-motion` desactiva ticker en Windows → el CSS ya oculta la copia duplicada
- Iconos PWA viejos → limpiar datos del sitio en Chrome, no solo cache
- HEIC de Samsung no se sube → backend convierte con Sharp/heic-convert

## FORMATO
- Markdown con headers ##, tablas para endpoints y rutas, bloques de código para comandos
- Tono técnico pero directo
- Largo: 10-15 páginas aprox
- NO incluir código fuente completo, solo rutas y descripciones
