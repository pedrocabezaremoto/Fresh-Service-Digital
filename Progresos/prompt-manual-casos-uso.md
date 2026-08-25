# PROMPT: Casos de Uso — Fresh Service Digital

## INSTRUCCION
Genera un documento de casos de uso del sistema Fresh Service Digital. El archivo de salida debe ser `/root/Fresh-Service-Digital/Manuales/casos-de-uso.md`. Escríbelo en español técnico pero entendible. Cada caso de uso debe tener: Actor, Precondiciones, Flujo principal, Flujo alternativo, Postcondiciones.

## CONTEXTO
- **Sistema:** Fresh Service Digital — plataforma web de gestión de servicios de refrigeración a domicilio
- **URL:** https://fresh.pedroservicios.xyz / https://api.pedroservicios.xyz
- **Stack:** React 19 + Vite 6 + Tailwind v4 (frontend) / NestJS 10 + Prisma 6 + PostgreSQL (backend)
- **Roles:** Cliente, Administrador (Taller), Técnico
- **Chatbot IA:** Copito (DeepSeek v4-flash, con tool calling)
- **Chat en vivo:** Socket.IO, operador toma control del chat

## ACTORES
1. **Cliente** — persona que necesita servicio de refrigeración. Se registra, pide citas, chatea con Copito.
2. **Administrador (Taller)** — dueño del negocio. Gestiona solicitudes, técnicos, servicios, precios, chat en vivo, contenido del sitio.
3. **Técnico** — trabajador asignado a servicios. Ve sus trabajos, ubicación del cliente, marca completado.
4. **Copito (IA)** — chatbot que atiende clientes fuera de horario, captura leads, consulta catálogo.
5. **Sistema** — envía correos, calcula precios con tasa BCV, cachea recursos (PWA).

## CASOS DE USO A DOCUMENTAR

### Módulo Autenticación
- CU-01: Registro de cliente (nombre, apellido, correo, WhatsApp, cédula, contraseña)
- CU-02: Verificación de cuenta por correo (link de activación)
- CU-03: Login (por email o username)
- CU-04: Recuperar contraseña (correo con link de restablecimiento)
- CU-05: Logout

### Módulo Solicitudes / Citas
- CU-06: Cliente solicita servicio (selecciona equipo, servicio, horario, ubicación opcional en mapa)
- CU-07: Admin ve listado de solicitudes con filtros (cliente, servicio, fecha, estado)
- CU-08: Admin asigna técnico a solicitud (sugerencia automática por especialidad)
- CU-09: Técnico ve sus trabajos asignados (con ubicación, datos del cliente, detalle del servicio)
- CU-10: Técnico inicia servicio (cambia estado a EN_PROGRESO)
- CU-11: Técnico completa servicio (cambia estado a COMPLETADO, se suma a ingresos)
- CU-12: Cliente ve estado de sus citas en su panel
- CU-13: Admin agenda cita rápida desde el chat en vivo

### Módulo Chat
- CU-14: Cliente chatea con Copito (IA responde, captura lead si da nombre/WhatsApp)
- CU-15: Operador toma control del chat (handoff IA → humano)
- CU-16: Operador envía imagen al cliente
- CU-17: Cliente envía imagen al operador (foto del equipo dañado)
- CU-18: Operador pausa / bloquea / desbloquea conversación
- CU-19: Operador envía formulario de cita al cliente (el cliente llena desde el widget)
- CU-20: Operador archiva / restaura / elimina conversación

### Módulo Administración
- CU-21: Admin gestiona servicios (CRUD: crear, editar, activar/desactivar, eliminar)
- CU-22: Admin gestiona categorías y tipos de equipo (CRUD dinámico)
- CU-23: Admin gestiona técnicos (crear, editar, activar/desactivar, eliminar)
- CU-24: Admin gestiona clientes (editar, eliminar)
- CU-25: Admin sube imágenes del sitio (Hero + Técnico) y fotos por tipo de equipo (dinámico desde Servicios → Tipos de equipo)
- CU-26: Admin gestiona carrusel de la landing (subir, activar/desactivar, eliminar)
- CU-27: Admin gestiona ticker promocional (crear, editar, reordenar, activar/desactivar, eliminar)
- CU-28: Admin ve dashboard con KPIs, gráficos y mapa de servicios
- CU-29: Admin ve ingresos por período (hoy/semana/mes/año) con filtros y exportación CSV

### Módulo Notificaciones
- CU-30: Sistema envía correo al asignar técnico (con datos del técnico + precio en Bs)
- CU-31: Copito notifica lead nuevo a Telegram (@copito_fresh_bot)
- CU-32: Campanita de leads no leídos en el panel admin

### Módulo PWA
- CU-33: Cliente instala la app desde Chrome/Safari
- CU-34: Service worker cachea interfaz para carga rápida y soporte offline parcial

## FORMATO
- Markdown con headers para cada caso de uso
- Tabla resumen al inicio (ID, Nombre, Actor principal)
- Cada CU con: Descripción (1 línea), Actor, Precondiciones, Flujo principal (pasos numerados), Flujo alternativo, Postcondiciones
- Largo: 8-12 páginas aprox
