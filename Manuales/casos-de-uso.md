# Casos de uso — Fresh Service Digital

> **Versión 2.0** · Agosto 2026
>
> Documento funcional de los flujos reales del sistema. Pensado para QA, defensa y onboarding.
>
> - **Sitio:** https://fresh.pedroservicios.xyz
> - **API:** https://api.pedroservicios.xyz
> - **Stack:** React 19 + Vite 6 + Tailwind v4 / NestJS 10 + Prisma 6 + PostgreSQL
> - **Roles:** Cliente (`CLIENT`), Administrador / Taller (`ADMIN`), Técnico (`TECHNICIAN`)
> - **Chatbot:** Copito (DeepSeek, tool calling)
> - **Chat en vivo:** Socket.IO namespace `/live-chat`

---

## 1. ¿Qué es el sistema?

Fresh Service Digital es una plataforma web de **gestión de servicios de refrigeración a domicilio** en San Juan de los Morros (Guárico, Venezuela). El cliente pide una cita en línea, el taller asigna un técnico y los precios se anclan al dólar con equivalente en bolívares a la **tasa oficial BCV**.

Fuera de horario (o mientras el operador no toma el chat), **Copito** atiende al visitante, consulta el catálogo y captura leads. El taller puede tomar el control en vivo, enviar fotos, pausar o bloquear conversaciones y agendar citas desde el widget.

---

## 2. Actores

| Actor | Rol técnico | Qué hace |
|---|---|---|
| **Cliente** | `CLIENT` | Se registra, verifica correo, pide citas, ve su panel, chatea con Copito. |
| **Administrador (Taller)** | `ADMIN` | Gestiona solicitudes, técnicos, servicios, precios, contenido del sitio y chat en vivo. |
| **Técnico** | `TECHNICIAN` | Ve solo los trabajos que el taller le asignó, ubica al cliente y marca inicio/cierre. |
| **Copito (IA)** | Sistema + LLM | Atiende el widget, responde sobre catálogo/precios y guarda leads. |
| **Sistema** | Backend / PWA | Envía correos, calcula Bs con tasa BCV, notifica a Telegram y cachea la interfaz. |

**Estados de una cita:** `PENDING` → `ASSIGNED` → `IN_PROGRESS` → `COMPLETED` (también existe `CANCELLED`).

---

## 3. Tabla resumen

| ID | Nombre | Actor principal |
|---|---|---|
| CU-01 | Registro de cliente | Cliente |
| CU-02 | Verificación de cuenta por correo | Cliente / Sistema |
| CU-03 | Login (email o username) | Cliente, Admin, Técnico |
| CU-04 | Recuperar contraseña | Cliente / Sistema |
| CU-05 | Logout | Cliente, Admin, Técnico |
| CU-06 | Cliente solicita servicio | Cliente |
| CU-07 | Admin ve listado de solicitudes | Administrador |
| CU-08 | Admin asigna técnico | Administrador |
| CU-09 | Técnico ve sus trabajos | Técnico |
| CU-10 | Técnico inicia servicio | Técnico |
| CU-11 | Técnico completa servicio | Técnico |
| CU-12 | Cliente ve estado de sus citas | Cliente |
| CU-13 | Admin agenda cita rápida desde el chat | Administrador |
| CU-14 | Cliente chatea con Copito | Cliente / Copito |
| CU-15 | Operador toma control del chat | Administrador |
| CU-16 | Operador envía imagen al cliente | Administrador |
| CU-17 | Cliente envía imagen al operador | Cliente |
| CU-18 | Operador pausa / bloquea / desbloquea | Administrador |
| CU-19 | Operador envía formulario de cita | Administrador / Cliente |
| CU-20 | Operador archiva / restaura / elimina chat | Administrador |
| CU-21 | Admin gestiona servicios | Administrador |
| CU-22 | Admin gestiona categorías y tipos de equipo | Administrador |
| CU-23 | Admin gestiona técnicos | Administrador |
| CU-24 | Admin gestiona clientes | Administrador |
| CU-25 | Admin sube imágenes del sitio y por tipo de equipo | Administrador |
| CU-26 | Admin gestiona carrusel de la landing | Administrador |
| CU-27 | Admin gestiona ticker promocional | Administrador |
| CU-28 | Admin ve dashboard (KPIs, gráficos, mapa) | Administrador |
| CU-29 | Admin ve ingresos por período | Administrador |
| CU-30 | Sistema envía correo al asignar técnico | Sistema |
| CU-31 | Copito notifica lead nuevo a Telegram | Copito / Sistema |
| CU-32 | Campanita de leads no leídos | Administrador |
| CU-33 | Cliente instala la app (PWA) | Cliente |
| CU-34 | Service worker cachea la interfaz | Sistema |

---

## 4. Módulo Autenticación

### CU-01 · Registro de cliente

**Descripción:** Un visitante crea una cuenta de cliente para poder solicitar servicios.

**Actor:** Cliente.

**Precondiciones:**
- El visitante abre https://fresh.pedroservicios.xyz y no tiene cuenta (o no está logueado).
- El correo que usará no está registrado.

**Flujo principal:**
1. Entra a **Solicitar servicio** o a **Iniciar sesión → Regístrate gratis** (`/registro`).
2. Completa: nombre, apellido, correo, WhatsApp (código de país, por defecto `+58`) y contraseña (mínimo 6 caracteres, con indicador de fortaleza).
3. Confirma la contraseña y pulsa **Crear mi cuenta**.
4. El frontend llama `POST /users/register`.
5. El backend hashea la contraseña (bcrypt), crea el usuario con rol `CLIENT` y `isVerified = false`, y genera un token de activación.
6. El sistema envía el correo de activación (ver CU-02).
7. La pantalla muestra “¡Casi listo!” e indica revisar bandeja y spam.

**Flujo alternativo:**
- Contraseñas distintas o menores a 6 caracteres: error en el formulario, no se llama a la API.
- Correo ya registrado: `409` “El correo electrónico ya se encuentra registrado”.
- Si SMTP no está configurado (modo desarrollo/offline), la cuenta se activa sola y no se exige el enlace.
- La **cédula** no se pide en el registro: se captura después, en la solicitud (CU-06), y queda guardada en la cuenta.

**Postcondiciones:** Existe un usuario `CLIENT` no verificado. No puede iniciar sesión hasta activar el correo (salvo modo offline).

---

### CU-02 · Verificación de cuenta por correo

**Descripción:** El cliente activa su cuenta abriendo el enlace mágico enviado al correo.

**Actor:** Cliente y Sistema.

**Precondiciones:** El usuario se registró (CU-01) y existe un `verificationCode` válido.

**Flujo principal:**
1. El cliente abre el correo *Activa tu cuenta*.
2. Pulsa el enlace `GET /users/verify-link?token=...` (API pública).
3. El backend marca `isVerified = true` y borra el token.
4. Redirige a `/login?verified=true`.
5. El login muestra confirmación de cuenta activada.

**Flujo alternativo:**
- Token inválido o ya usado: redirige a `/login?error=...` con mensaje de error.
- El cliente no encuentra el correo: debe revisar spam; no hay reenvío automático en esta versión.

**Postcondiciones:** La cuenta queda verificada. Ya puede iniciar sesión (CU-03).

---

### CU-03 · Login (por email o username)

**Descripción:** Un usuario autenticado entra al panel que le corresponde según su rol.

**Actor:** Cliente, Administrador o Técnico.

**Precondiciones:** La cuenta existe, está verificada y activa.

**Flujo principal:**
1. Abre `/login` e ingresa **identificador** (correo o username) + contraseña.
2. El frontend llama `POST /users/login` con `{ identifier, password }`.
3. Si el identificador contiene `@`, se busca por email (sin distinguir mayúsculas). Si no, se busca por `username`.
4. El backend valida bcrypt, verificación y `isActive`.
5. Devuelve JWT + datos del usuario (sin contraseña).
6. El frontend guarda `fsd_token` y `fsd_user` en `localStorage`.
7. Redirección por rol: Admin → `/admin`, Técnico → `/tecnico`, Cliente → `/panel` (o a la ruta original, p. ej. `/solicitud`).

**Flujo alternativo:**
- Credenciales incorrectas: “Credenciales inválidas” (no revela si falló el usuario o la clave).
- Cuenta no verificada: “Debes verificar tu correo electrónico antes de iniciar sesión”.
- Cuenta desactivada: “Esta cuenta está desactivada. Contacta al taller.”
- El **username** está pensado para Admin/Técnico (el admin de producción usa `admin`). El cliente entra normalmente con correo.

**Postcondiciones:** Sesión iniciada. Las rutas protegidas (`/panel`, `/solicitud`, `/admin`, `/tecnico`) quedan accesibles según el rol.

---

### CU-04 · Recuperar contraseña

**Descripción:** El usuario pide un enlace de restablecimiento y define una clave nueva.

**Actor:** Cliente (también sirve para Admin/Técnico si conocen el correo) y Sistema.

**Precondiciones:** El usuario recuerda el correo de la cuenta.

**Flujo principal:**
1. En el login pulsa **¿Olvidaste tu contraseña?** (`/recuperar`).
2. Escribe el correo y envía. `POST /users/forgot-password`.
3. Si el correo existe, el sistema genera un token de **1 hora** y envía el enlace `/restablecer?token=...`.
4. El usuario abre el enlace, escribe la nueva contraseña y confirma. `POST /users/reset-password`.
5. El backend hashea la nueva clave, limpia el token y marca `isVerified = true` (el correo quedó demostrado).
6. Vuelve al login e ingresa con la clave nueva.

**Flujo alternativo:**
- Correo no registrado: la API responde **igual** (“Si el correo está registrado…”) para no filtrar cuentas.
- Token inválido o vencido: error “El enlace es inválido o ya expiró. Solicita uno nuevo.”

**Postcondiciones:** La contraseña anterior deja de servir. El usuario puede iniciar sesión.

---

### CU-05 · Logout

**Descripción:** El usuario cierra su sesión en el navegador.

**Actor:** Cliente, Administrador o Técnico.

**Precondiciones:** Hay una sesión activa (`fsd_token` / `fsd_user` en `localStorage`).

**Flujo principal:**
1. Pulsa **Cerrar sesión** en el navbar o en el sidebar del panel.
2. El frontend elimina `fsd_token` y `fsd_user` y limpia el estado de `AuthContext`.
3. Redirige a `/` o `/login` según la pantalla.

**Flujo alternativo:**
- Token vencido o `401/403` en una llamada protegida: el panel del técnico/admin fuerza logout y manda a `/login`.
- El JWT no se invalida en servidor (stateless): quien copie el token podría usarlo hasta que expire. El cierre es local.

**Postcondiciones:** El usuario ya no está autenticado en ese navegador. Las rutas protegidas redirigen a login/registro.

---

## 5. Módulo Solicitudes / Citas

### CU-06 · Cliente solicita servicio

**Descripción:** El cliente autenticado crea una cita eligiendo equipo, servicio, horario y (opcional) ubicación.

**Actor:** Cliente.

**Precondiciones:**
- Sesión de cliente verificada.
- Existen servicios activos en el catálogo (`GET /services`) y tipos de equipo activos.

**Flujo principal:**
1. Entra a `/solicitud`. Si no está logueado, `ProtectedRoute` lo manda a `/registro` y luego regresa.
2. Nombre, teléfono y cédula se precargan desde la cuenta (o desde `localStorage` si ya los usó).
3. Elige **tipo de equipo** (lista dinámica: Nevera, Ventana, Split, Toneladas, etc.) y **servicio** (mantenimiento, reparación, instalación…).
4. Completa dirección, fecha y horario: **Mañana (8:30–12:00)** o **Tarde (12:00–18:00)**. No hay franja Noche.
5. Opcional: marca el domicilio en el mapa (pin arrastrable). Si envía coordenadas, van latitud y longitud juntas.
6. Describe la falla o el trabajo.
7. Envía. `POST /appointments` con JWT.
8. El backend crea la cita en `PENDING`, congela `priceUsd` desde el catálogo (no confía en el precio del front) y guarda el `Equipment` asociado.
9. Si hay cédula, se actualiza en el `User`. Si hay mapa, se guardan `latitude`, `longitude` y `address`.
10. La pantalla muestra un número de **referencia** (primeros 8 caracteres del id).

**Flujo alternativo:**
- API de servicios caída: el formulario usa fallback local (`prices.js`) para no romperse.
- Servicio inactivo o id inexistente: `400`.
- Coordenada incompleta (solo lat o solo lng): `400` “Si envía coordenadas, debe incluir latitud y longitud”.
- El precio estimado **no se enfatiza** en el formulario actual; el valor queda guardado en USD para proforma e ingresos.

**Postcondiciones:** Existe una cita `PENDING` visible para el taller (CU-07) y para el cliente en `/panel` (CU-12).

---

### CU-07 · Admin ve listado de solicitudes con filtros

**Descripción:** El taller revisa todas las citas y las filtra por cliente, servicio, fecha y estado.

**Actor:** Administrador.

**Precondiciones:** Sesión `ADMIN`. Hay al menos una cita (o la tabla vacía).

**Flujo principal:**
1. Entra a `/admin` → vista **Solicitudes**.
2. El frontend carga `GET /appointments` (todas las citas, con cliente, técnico, equipo y servicio).
3. Encima de la tabla usa filtros: **Cliente**, **Servicio**, **Fecha**, **Estado**.
4. Puede llegar desde el dashboard (CU-28) con un filtro de estado ya puesto (Pendientes / En proceso).
5. Cada fila muestra cliente, servicio (`tipo · nombre`), fecha/hora, estado, técnico y acciones.

**Flujo alternativo:**
- Sin resultados para el filtro: tabla vacía, los filtros se pueden limpiar.
- `401/403`: se cierra sesión.

**Postcondiciones:** El admin tiene la lista filtrada en pantalla. No se modifica ninguna cita.

---

### CU-08 · Admin asigna técnico a solicitud

**Descripción:** El taller asigna un técnico activo; el sistema sugiere uno por especialidad.

**Actor:** Administrador.

**Precondiciones:**
- Cita en `PENDING` (u otra sin técnico).
- Hay técnicos activos (`GET /users/technicians`).

**Flujo principal:**
1. En Solicitudes, abre el selector de técnico de la fila.
2. El sistema **sugiere** un técnico activo cuya `specialty` coincida con el tipo de equipo/servicio.
3. El admin elige (puede ignorar la sugerencia) y confirma.
4. `PATCH /appointments/:id/assign` con `{ technicianId }`.
5. Si la cita estaba `PENDING`, pasa a `ASSIGNED`.
6. Se dispara el correo al cliente (CU-30), sin bloquear la asignación si el SMTP falla.
7. La fila se actualiza: nombre del técnico y estado *Asignada*.

**Flujo alternativo:**
- Técnico inexistente o que no es `TECHNICIAN`: `400`.
- Técnico inactivo: `400` “No se puede asignar un técnico inactivo”.
- Se puede desasignar enviando `technicianId = null` (el estado no retrocede solo).
- El técnico **no se auto-asigna**: el endpoint de assign es solo ADMIN.

**Postcondiciones:** La cita queda `ASSIGNED` con `technicianId`. El técnico la ve en `/tecnico` (CU-09). El cliente recibe correo si hay SMTP.

---

### CU-09 · Técnico ve sus trabajos asignados

**Descripción:** El técnico abre su panel y ve solo las citas que el taller le asignó, con datos del cliente y mapa.

**Actor:** Técnico.

**Precondiciones:** Sesión `TECHNICIAN`. El taller ya le asignó al menos un trabajo (o la lista está vacía).

**Flujo principal:**
1. Inicia sesión y cae en `/tecnico`.
2. `GET /appointments` filtrado en backend: solo `technicianId = él`. **Nunca** ve `PENDING` libres.
3. Pestañas: **Por realizar** (`ASSIGNED`), **En ejecución** (`IN_PROGRESS`), **Finalizados** (`COMPLETED`) + buscador.
4. Cada tarjeta muestra: cliente, cédula, teléfono, WhatsApp, dirección, detalle de la falla, servicio, fecha/hora.
5. Si hay coordenadas, puede abrir el **mapa** del domicilio (Leaflet).
6. Botón WhatsApp abre `wa.me/<teléfono>`.

**Flujo alternativo:**
- Sin asignaciones: KPIs en cero y lista vacía.
- Dirección solo textual (sin pin): el mapa no se ofrece; se muestra la dirección o “—”.

**Postcondiciones:** El técnico tiene contexto para ir al domicilio. No cambia estados hasta CU-10 / CU-11.

---

### CU-10 · Técnico inicia servicio

**Descripción:** El técnico marca que ya está trabajando la cita (`EN_PROGRESO` / `IN_PROGRESS`).

**Actor:** Técnico (también puede hacerlo el Admin desde Solicitudes).

**Precondiciones:** La cita está `ASSIGNED` y pertenece al técnico logueado.

**Flujo principal:**
1. En la pestaña **Por realizar**, pulsa **Iniciar servicio**.
2. `PATCH /appointments/:id/status` con `{ status: "IN_PROGRESS" }`.
3. El backend verifica que `technicianId` sea el del JWT.
4. La tarjeta pasa a **En ejecución**.

**Flujo alternativo:**
- El técnico intenta operar una cita ajena: `403` “Esta solicitud no está asignada a ti”.
- El admin puede cambiar el estado desde el panel del taller.

**Postcondiciones:** Estado `IN_PROGRESS`. El cliente lo ve en `/panel`. El KPI “En proceso” del dashboard sube.

---

### CU-11 · Técnico completa servicio

**Descripción:** El técnico cierra el trabajo; la cita entra a ingresos.

**Actor:** Técnico (o Admin).

**Precondiciones:** La cita está `IN_PROGRESS` (o el taller la cierra desde otro estado) y pertenece al técnico.

**Flujo principal:**
1. Pulsa **Marcar terminado**.
2. `PATCH /appointments/:id/complete` (o `status = COMPLETED`).
3. Prisma actualiza `status` y `updatedAt` (esta fecha es la que usa Ingresos).
4. La tarjeta pasa a **Finalizados**.

**Flujo alternativo:**
- Cita de otro técnico: `403`.
- Si se completa sin `priceUsd`, Ingresos puede mostrar 0 o el fallback histórico de `prices.ts`.

**Postcondiciones:** Estado `COMPLETED`. El monto en USD se suma a Ingresos del período (CU-29). El cliente lo ve como *Completada*.

---

### CU-12 · Cliente ve estado de sus citas

**Descripción:** El cliente consulta en su panel el historial, el técnico asignado y la proforma.

**Actor:** Cliente.

**Precondiciones:** Sesión de cliente. Tiene al menos una cita (o ve el vacío).

**Flujo principal:**
1. Entra a `/panel` (navbar **Mi Panel**).
2. `GET /appointments/client/:clientId`.
3. Ve KPIs: total, activas, completadas y total a pagar (USD × tasa BCV).
4. Cada tarjeta muestra estado (Pendiente / Asignada / En proceso / Completada / Cancelada), precio, fecha y, si hay técnico, nombre + WhatsApp.
5. Puede expandir el mapa si marcó ubicación.
6. Puede abrir `/proforma` (documento imprimible / PDF del navegador).

**Flujo alternativo:**
- Sin citas: empty state + botón para solicitar.
- Tasa BCV caída: se muestra el USD (o la última tasa cacheada).

**Postcondiciones:** El cliente conoce el estado actual. No modifica la cita desde este panel.

---

### CU-13 · Admin agenda cita rápida desde el chat en vivo

**Descripción:** El operador crea una cita para el visitante del chat, sin que el cliente use `/solicitud`.

**Actor:** Administrador.

**Precondiciones:**
- Sesión `ADMIN` en **Chat en vivo**.
- Hay una conversación abierta (con o sin handoff).

**Flujo principal:**
1. En el menú **⋮ Más** pulsa **Agendar cita**.
2. Completa: nombre, teléfono, correo opcional, servicio (dropdown `Instalación — Split ($70)`), fecha, hora y notas.
3. `POST /appointments/quick` (JWT + ADMIN).
4. El backend normaliza el teléfono (`0412-1234567` → `+584121234567`), busca cliente por teléfono o email, o crea un **guest** `chat-xxxxx@guest.local` (password placeholder, no puede loguearse).
5. Si el guest ya existía y ahora hay email real, se actualiza el correo.
6. Crea cita `PENDING` + `Equipment` y congela `priceUsd` si hay `serviceId`.
7. Emite un `operatorMessage` al widget con servicio, fecha, hora y precio. El cliente lo ve aunque no haya *take over*.

**Flujo alternativo:**
- Usuario no ADMIN: `403`.
- Email del guest ya tomado: se deja el `@guest.local` y se sigue con la cita.
- El operador puede, en vez de agendar él, **enviar el formulario** al widget (CU-19).

**Postcondiciones:** La cita aparece en Solicitudes. El cliente guest no tiene login hasta que se registre con un correo real.

---

## 6. Módulo Chat

### CU-14 · Cliente chatea con Copito

**Descripción:** El visitante habla con la IA; si da nombre + WhatsApp + servicio, se guarda un lead.

**Actor:** Cliente (o visitante anónimo) y Copito.

**Precondiciones:** El widget flotante está visible (esquina inferior derecha, `PublicLayout`). El chat no está bloqueado.

**Flujo principal:**
1. Abre Copito. Se crea/recupera un `sessionId` en el navegador.
2. Escribe un mensaje. `POST /chat` responde por **SSE** (tokens en streaming).
3. Copito consulta el catálogo (tool calling: servicios activos, precios, tipos de equipo).
4. Primero pregunta **qué servicio** necesita; después nombre y WhatsApp.
5. Cuando tiene nombre + (teléfono o email) + tipo de servicio, llama `guardar_contacto`.
6. Se crea un `ChatLead` (`readAt = null`) y se notifica Telegram (CU-31) + campanita (CU-32).

**Flujo alternativo:**
- Conversación pausada: no responde la IA.
- Conversación bloqueada: “Esta conversación ha sido bloqueada.”
- Nombre inválido / placeholder (“prueba”, “cliente”): Copito insiste en un nombre real.
- Un operador ya tomó el control (CU-15): el badge pasa a **EN VIVO** y Copito deja de responder.

**Postcondiciones:** Queda historial de mensajes. Si hubo lead, el taller lo ve.

---

### CU-15 · Operador toma control del chat (handoff IA → humano)

**Descripción:** El admin interrumpe a Copito y habla en tiempo real con el visitante.

**Actor:** Administrador.

**Precondiciones:** Hay una conversación activa. El admin está en `/admin` → Chat en vivo.

**Flujo principal:**
1. Selecciona la conversación de la lista (avatar, preview, Hoy/Ayer, no leídos).
2. Pulsa **Tomar control**. Socket `takeOver`.
3. El gateway marca la conversación como controlada por humano.
4. El widget del cliente muestra badge **EN VIVO**. Copito deja de generar respuestas.
5. El operador escribe; evento `operatorMessage`. El cliente responde por el mismo socket.
6. Hay indicador de **escribiendo…** bidireccional (`typing` / `stopTyping`).
7. Puede **liberar** el chat (`release`) para devolverlo a Copito.

**Flujo alternativo:**
- La conversación está bloqueada: no se puede chatear.
- El widget del cliente está cerrado: el socket de Copito no está conectado; el cliente debe abrir el chat para ver los mensajes en vivo.

**Postcondiciones:** El hilo queda en modo humano hasta `release`, cierre o bloqueo.

---

### CU-16 · Operador envía imagen al cliente

**Descripción:** El taller adjunta una foto (catálogo, referencia, instrucción) en el chat.

**Actor:** Administrador.

**Precondiciones:** Conversación seleccionada. Archivo JPG/PNG/WebP ≤ 2 MB.

**Flujo principal:**
1. En el compositor, adjunta una imagen.
2. `POST /chat/operator-upload-image` (JWT + ADMIN, multer 2 MB).
3. El backend guarda en `uploads/chat-images/` y persiste el mensaje con URL.
4. El widget muestra la imagen en una burbuja del operador.

**Flujo alternativo:**
- Formato o peso inválido: error, no se envía.
- Sin take over: el mensaje de imagen igual puede llegar si el socket está abierto (mismo criterio que el aviso de cita).

**Postcondiciones:** El cliente ve la foto en el hilo. El archivo queda en disco hasta que se elimine la conversación (CU-20).

---

### CU-17 · Cliente envía imagen al operador (foto del equipo dañado)

**Descripción:** El visitante sube una foto del equipo para que el taller diagnostique.

**Actor:** Cliente / visitante.

**Precondiciones:** Chat abierto. Imagen ≤ 5 MB (el front comprime a JPEG ≤ 900 KB cuando puede).

**Flujo principal:**
1. En el widget, adjunta la foto (cámara o galería; soporta JPEG, PNG, WebP, HEIC de Samsung).
2. El front intenta comprimir en Canvas. `POST /chat/upload-image` con `sessionId`.
3. El backend normaliza con Sharp (JPEG 80 / 1200 px). Si Sharp rechaza HEIC Samsung, usa `heic-convert`.
4. El mensaje aparece en el hilo del admin y en el widget.

**Flujo alternativo:**
- Archivo > 5 MB o formato no soportado: error en el widget.
- Chat bloqueado/pausado: el upload se rechaza.

**Postcondiciones:** El operador ve la foto del equipo. Queda guardada en `uploads/chat-images/`.

---

### CU-18 · Operador pausa / bloquea / desbloquea conversación

**Descripción:** El taller modera el hilo: pausa a Copito, bloquea al visitante o lo rehabilita.

**Actor:** Administrador.

**Precondiciones:** Conversación seleccionada. Sesión ADMIN.

**Flujo principal:**
1. **Pausar** (`pauseConversation`): Copito deja de responder; el hilo no se cierra. Se puede **reanudar** (`resumeConversation`).
2. **Bloquear** (`blockConversation`): `blocked = true`, `status = closed`. El visitante recibe aviso de bloqueo y no puede escribir ni subir fotos.
3. **Desbloquear** (`unblockConversation`): `blocked = false`, `status = active`. El chat vuelve a operar.

**Flujo alternativo:**
- Pausar un chat ya bloqueado no cambia el bloqueo.
- Liberar (`release`) no desbloquea: son acciones distintas.

**Postcondiciones:** Flags `paused` / `blocked` persistidos. La lista de chats muestra el estado (borde/color).

---

### CU-19 · Operador envía formulario de cita al cliente

**Descripción:** El taller manda un formulario inline; el visitante lo llena en el widget y se crea la cita.

**Actor:** Administrador y Cliente.

**Precondiciones:** Widget abierto (el socket de Copito solo conecta con el chat abierto). Conversación activa.

**Flujo principal:**
1. En **⋮ Más**, pulsa **Enviar formulario** (se deshabilita 5 s para evitar spam).
2. Socket `sendAppointmentForm` + mensaje explicativo del operador.
3. En el widget aparece el form: nombre*, WhatsApp*, correo, dirección, servicio, descripción.
4. El cliente envía. Socket `submitAppointmentForm`.
5. El backend reutiliza `createQuickFromChat` (CU-13). Fecha por defecto: **mañana**. `address` queda en la cita.
6. El cliente ve confirmación persistida. Los operadores reciben un mensaje de sistema 📅.

**Flujo alternativo:**
- Widget cerrado: el form no llega hasta que el cliente abra Copito.
- Validación incompleta (sin nombre o WhatsApp): el widget no envía.
- El operador puede agendar él mismo (CU-13) si el cliente no llena el form.

**Postcondiciones:** Cita `PENDING` en Solicitudes. Confirmación visible en el hilo.

---

### CU-20 · Operador archiva / restaura / elimina conversación

**Descripción:** El taller limpia la bandeja sin perder (o sí, si elimina) el historial.

**Actor:** Administrador.

**Precondiciones:** Conversación existente. Sesión ADMIN.

**Flujo principal:**
1. **Archivar:** `PATCH /chat/:id/archive` → `archived = true`. Sale de la bandeja activa.
2. Ver archivados: `GET /chat/archived`.
3. **Restaurar:** `PATCH /chat/:id/unarchive` → vuelve a la lista activa.
4. **Eliminar:** `DELETE /chat/:id` (modal de confirmación). Borra mensajes y hace `unlink` de las fotos en `uploads/chat-images/`.

**Flujo alternativo:**
- Eliminar es irreversible. Archivar no borra mensajes.
- Un chat archivado no aparece en la bandeja principal ni en búsquedas activas.

**Postcondiciones:** La bandeja refleja el nuevo estado. Si se eliminó, no hay rastro en DB ni archivos de esa conversación.

---

## 7. Módulo Administración

### CU-21 · Admin gestiona servicios (CRUD)

**Descripción:** El taller crea, edita, activa/desactiva o elimina ítems del catálogo con precio en USD.

**Actor:** Administrador.

**Precondiciones:** Sesión ADMIN. Existen categorías y tipos de equipo (o se crean en CU-22).

**Flujo principal:**
1. Vista **Servicios**. `GET /services/all`.
2. **Crear:** nombre, categoría, tipo de equipo, precio USD, descripción. `POST /services`.
3. **Editar:** `PATCH /services/:id`.
4. **Activar/desactivar:** el servicio inactivo no sale en Home, Catálogo, Solicitud ni Copito (`GET /services` solo activos).
5. **Eliminar:** modal de confirmación. `DELETE /services/:id`.

**Flujo alternativo:**
- Validación de precio/nombre: el backend rechaza el DTO.
- Si hay citas históricas ligadas, el servicio puede seguir referenciado; el admin suele desactivar en vez de borrar.

**Postcondiciones:** El catálogo público y Copito leen la lista actualizada. Home/Catálogo recalculan `minPriceUsd` y `serviceCount` por tipo.

---

### CU-22 · Admin gestiona categorías y tipos de equipo

**Descripción:** El catálogo no está hardcodeado: el taller mantiene opciones dinámicas y su orden.

**Actor:** Administrador.

**Precondiciones:** Sesión ADMIN.

**Flujo principal:**
1. En Servicios abre **Categorías** o **Tipos de equipo**.
2. **Crear:** label + slug (se normaliza a `MAYUSCULAS_CON_GUION`). Tipo de equipo admite **descripción** (texto de Home/Catálogo).
3. **Editar** inline (lápiz). Enter guarda, Escape cancela.
4. **Activar/desactivar:** las inactivas no salen en `GET /services/categories` ni `GET /services/equipment-types` (públicos).
5. **Reordenar:** flechas arriba/abajo actualizan `sortOrder` (PATCH de los dos ítems).
6. **Eliminar:** modal. El backend rechaza si hay servicios asignados.

**Flujo alternativo:**
- “Esta categoría tiene servicios asignados. Elimínalos primero.” (igual para tipo de equipo).
- Un tipo sin servicios activos no aparece en Home/Catálogo aunque esté activo (p. ej. Aire 5 Toneladas oculto por `serviceCount = 0`).

**Postcondiciones:** Solicitud, Catálogo, Home y Copito usan labels/slugs de la API. Las fotos del tipo se gestionan en CU-25.

---

### CU-23 · Admin gestiona técnicos

**Descripción:** Alta, edición, activación y baja de trabajadores del taller.

**Actor:** Administrador.

**Precondiciones:** Sesión ADMIN.

**Flujo principal:**
1. Vista **Técnicos**. `GET /users/technicians`.
2. **Crear:** nombre, apellido, correo, teléfono, username opcional, especialidad, contraseña. `POST /users/create-technician`.
3. El técnico nace **verificado y activo** (sin magic link).
4. **Editar:** `PATCH /users/:id` (datos, specialty, username, clave).
5. **Desactivar:** `isActive = false`. No se puede asignar a citas nuevas (CU-08). No puede loguearse.
6. **Eliminar:** `DELETE /users/:id`. Las citas que tenía quedan sin técnico.

**Flujo alternativo:**
- Correo o username duplicado: `409`.
- Username con formato inválido: `400`.
- Técnico inactivo sigue visible en el listado (para historial) pero deshabilitado en el selector de asignación.

**Postcondiciones:** El técnico puede entrar a `/tecnico` si está activo. La sugerencia por especialidad usa el campo `specialty`.

---

### CU-24 · Admin gestiona clientes

**Descripción:** El taller edita o elimina cuentas de clientes del directorio.

**Actor:** Administrador.

**Precondiciones:** Sesión ADMIN. `GET /users` (solo `CLIENT`).

**Flujo principal:**
1. Vista **Clientes**, con buscador/filtro.
2. **Editar:** nombre, apellido, correo, teléfono. `PATCH /users/:id`.
3. **Eliminar:** confirmación. `DELETE /users/:id` borra el usuario y, en cascada, sus citas.

**Flujo alternativo:**
- Correo ya usado por otra cuenta: `409`.
- Eliminar es destructivo: se pierden solicitudes e historial de ese cliente.
- Los guests de chat (`@guest.local`) aparecen como clientes si se les creó cita.

**Postcondiciones:** El directorio queda actualizado. El cliente eliminado no puede loguearse.

---

### CU-25 · Admin sube imágenes del sitio y fotos por tipo de equipo

**Descripción:** El taller cambia Hero y Técnico, y asigna una foto a cada tipo de equipo del catálogo.

**Actor:** Administrador.

**Precondiciones:** Sesión ADMIN. Archivo JPG/PNG/WebP ≤ 2 MB.

**Flujo principal:**
1. **Imágenes del sitio** (Configuración): slots **Hero principal** y **Técnico**. Sube o restaura el default. `POST` de site-images.
2. Home y demás vistas leen `GET /site-images` (con cache `fsd_site_images` para evitar flash).
3. **Fotos por tipo:** en Servicios → Tipos de equipo, miniatura + cámara + quitar.
4. `POST /services/equipment-types/:id/image` guarda en `uploads/equipment-types/` y setea `imageFilename`.
5. `GET /services/equipment-types` incluye `imageUrl`. Home y Catálogo la usan; si no hay foto, fallback `img-window-ac.png`.
6. Quitar foto: `DELETE .../image` (borra archivo y deja `imageFilename` null).

**Flujo alternativo:**
- Formato no soportado o > 2 MB: error en el modal.
- Al eliminar un tipo de equipo se borra también su archivo de imagen.
- Los slots viejos `service_ventana/split/toneladas` ya no se editan aquí: pasaron a tipos dinámicos.

**Postcondiciones:** Landing y Catálogo muestran las fotos nuevas sin redeploy.

---

### CU-26 · Admin gestiona carrusel de la landing

**Descripción:** El taller sube, activa/desactiva o elimina slides del hero.

**Actor:** Administrador.

**Precondiciones:** Sesión ADMIN.

**Flujo principal:**
1. Configuración → **Carrusel**.
2. Sube imagen. Queda como slide (activo o no).
3. Toggle activo: solo los activos rotan en `HeroCarousel`.
4. Eliminar quita el archivo y el registro.

**Flujo alternativo:**
- Si no hay slides activos, el hero usa la imagen del slot Hero (CU-25).
- Formato/peso inválido: mismo criterio de uploads del sitio.

**Postcondiciones:** La home refleja el carrusel actual en la siguiente carga.

---

### CU-27 · Admin gestiona ticker promocional

**Descripción:** Franja azul con mensajes que se desplazan sobre la home (ofertas, horarios, avisos).

**Actor:** Administrador.

**Precondiciones:** Sesión ADMIN.

**Flujo principal:**
1. Configuración → **Ticker**. CRUD `/ticker`.
2. Crear / editar texto, **reordenar**, activar/desactivar, eliminar.
3. `GET /ticker` público devuelve solo activos.
4. Home: `TickerBar` (marquee) si hay mensajes; si no, la franja de confianza por defecto.

**Flujo alternativo:**
- Todos inactivos = se oculta el marquee.
- Texto vacío no se guarda.

**Postcondiciones:** El ticker público coincide con los mensajes activos y su orden.

---

### CU-28 · Admin ve dashboard con KPIs, gráficos y mapa

**Descripción:** Vista de control del taller: volumen, estados, marcas y mapa de servicios.

**Actor:** Administrador.

**Precondiciones:** Sesión ADMIN. Citas cargadas.

**Flujo principal:**
1. `/admin` abre en **Dashboard**.
2. KPIs: solicitudes, pendientes, en proceso, clientes. Son **clickeables** y navegan a Solicitudes con filtro (CU-07).
3. Gráficos (sin librería externa): dona por estado, barras por mes, marcas más atendidas, sparklines. Respetan `prefers-reduced-motion`.
4. Mapa de citas con coordenadas (Leaflet).
5. Exportar listado general a CSV si el admin lo pide desde esa vista.

**Flujo alternativo:**
- Sin coordenadas: el mapa no pinta esos puntos.
- Sin citas: KPIs en cero, gráficos vacíos.

**Postcondiciones:** El admin tiene una foto del negocio. No se mutan datos al solo consultar.

---

### CU-29 · Admin ve ingresos por período

**Descripción:** Suma de citas `COMPLETED` en USD/Bs, con filtros de calendario y exportación CSV.

**Actor:** Administrador.

**Precondiciones:** Sesión ADMIN. Hay servicios completados (o la vista vacía).

**Flujo principal:**
1. Vista **Ingresos**.
2. Filtra por **hoy / semana / mes / año**. El almanaque en hoy/semana/mes abre un date picker de **un día exacto** (fecha local, no UTC).
3. El período usa `updatedAt` (momento en que se marcó COMPLETED), no `scheduledAt`.
4. Tabla: cliente, servicio (`tipo · nombre`), fecha de cierre, monto.
5. Totales en USD y Bs (tasa BCV cacheada).
6. **Exportar CSV** con las filas filtradas.

**Flujo alternativo:**
- Sin completadas en el período: total 0.
- Cita sin `priceUsd`: se intenta el fallback histórico.

**Postcondiciones:** El reporte en pantalla/CSV coincide con las citas cerradas del recorte temporal.

---

## 8. Módulo Notificaciones

### CU-30 · Sistema envía correo al asignar técnico

**Descripción:** Al asignar (CU-08), el cliente recibe un correo con técnico, WhatsApp y precio en Bs.

**Actor:** Sistema (tras acción del Admin).

**Precondiciones:** Asignación exitosa. El cliente tiene email. SMTP/Resend configurado (`noreply@pedroservicios.xyz`).

**Flujo principal:**
1. `assignTechnician` termina bien.
2. El backend toma tasa BCV cacheada y calcula `Bs = priceUsd × rate`.
3. `MailService.sendServiceAssignedEmail` con: nombre del cliente, servicio, referencia (8 chars), USD, Bs, nombre y teléfono del técnico, link a `/panel`.
4. El cliente abre el correo y puede escribirle al técnico por WhatsApp.

**Flujo alternativo:**
- Falla SMTP: se registra un warning y **la asignación no se revierte**.
- Sin tasa BCV: el correo puede ir solo con USD.
- Cliente guest sin email real: no se envía.

**Postcondiciones:** El cliente queda notificado. La cita sigue `ASSIGNED`.

---

### CU-31 · Copito notifica lead nuevo a Telegram

**Descripción:** Cada lead capturado se manda al bot `@copito_fresh_bot` para que el taller escriba por WhatsApp.

**Actor:** Copito / Sistema.

**Precondiciones:** Tool `guardar_contacto` exitoso. `CHATBOT_TELEGRAM_BOT_TOKEN` y `CHAT_ID` en `.env`.

**Flujo principal:**
1. Se persiste el `ChatLead`.
2. `ChatTelegramService.notifyNewLead` arma un mensaje HTML: nombre, teléfono, email, servicio, resumen, id.
3. Incluye botón inline **Responder por WhatsApp** (`wa.me/...`).
4. `sendMessage` a Telegram (timeout 8 s).

**Flujo alternativo:**
- Token/chatId vacíos: no se envía (el lead igual queda en DB y campanita).
- Telegram caído: log de error, no se reintenta en caliente.

**Postcondiciones:** El taller ve el aviso en Telegram. El lead sigue `readAt = null` hasta CU-32.

---

### CU-32 · Campanita de leads no leídos

**Descripción:** El header del panel admin muestra leads nuevos y permite marcarlos leídos.

**Actor:** Administrador.

**Precondiciones:** Sesión ADMIN. El dashboard tiene su propio socket (funciona aunque no esté en Chat en vivo).

**Flujo principal:**
1. Al cargar: `GET /chat/leads/unread` (hasta 20, `readAt = null`).
2. Copito crea un lead → gateway `notifyNewLead` / `newLead`. La campanita incrementa (dedup por id).
3. El admin abre la campanita, ve nombre / servicio / teléfono.
4. Al hacer clic: `PATCH /chat/leads/:id/read` y el ítem sale de no leídos.
5. Evento `CustomEvent` interno para refrescar el badge.

**Flujo alternativo:**
- Leads viejos con `readAt` null aparecen como no leídos hasta que se clickean.
- Sin leads: campanita en cero.

**Postcondiciones:** `readAt` queda seteado. El badge baja.

---

## 9. Módulo PWA

### CU-33 · Cliente instala la app desde Chrome/Safari

**Descripción:** El visitante instala Fresh Service como app (standalone, sin barra del navegador).

**Actor:** Cliente.

**Precondiciones:**
- Entra por **Chrome (Android)** o **Safari (iOS)** directo a https://fresh.pedroservicios.xyz.
- Existen `manifest.json` e iconos `icon-192.png` / `icon-512.png`.
- `display: standalone`, `theme_color: #0284c7`.

**Flujo principal (Android / Chrome):**
1. Abre el sitio en Chrome.
2. Menú **⋮ → Instalar aplicación** (o el banner nativo).
3. Confirma. Queda el icono en la pantalla de inicio.
4. Al abrirla, corre a pantalla completa (sin URL bar).

**Flujo principal (iPhone / Safari):**
1. Abre el sitio en Safari (no el WebView de WhatsApp).
2. **Compartir → Agregar a pantalla de inicio**.
3. Confirma el nombre “Fresh Service”.

**Flujo alternativo:**
- Si abre el link **desde WhatsApp**, iOS/Android usan un navegador embebido que **no instala PWA**. Hay que copiar el URL y pegarlo en Chrome/Safari.
- Desktop Chrome también puede instalar (icono en el escritorio / apps).

**Postcondiciones:** El cliente tiene un acceso tipo app. El `start_url` es `/`.

---

### CU-34 · Service worker cachea la interfaz (offline parcial)

**Descripción:** El SW `fsd-v1` precachea la cáscara de la app y sirve estáticos rápido; la API no se cachea.

**Actor:** Sistema (navegador del cliente).

**Precondiciones:** El navegador soporta Service Workers. `main.jsx` registró `/sw.js`. HTTPS (o localhost).

**Flujo principal:**
1. En `install`, precachea `/`, manifest, icon-192/512 y `copito-avatar.png`.
2. En `activate`, borra caches viejos y toma los clientes (`clients.claim`).
3. **HTML:** network-first; si no hay red, sirve cache o `/`.
4. **JS / CSS / imágenes estáticas:** cache-first, y rellena cache si la red responde.
5. Recargas siguientes pintan más rápido.

**Flujo alternativo:**
- No se cachean: `/api`, `/ticker`, `/services`, `/carousel`, `/site-images`, `/rate`, `/chat`, `/socket.io`, `/appointments`, `/users`, `/uploads`, `/auth`.
- Sin red: la interfaz puede abrir (cáscara), pero login, citas, chat y catálogo vivo fallan.
- Al publicar un bundle nuevo, el HTML fresco trae el JS nuevo (network-first). El usuario puede necesitar un refresh para soltar el SW viejo.

**Postcondiciones:** Experiencia más rápida en 4G/Wi-Fi flojo. Offline **parcial**, no una app de datos locales.

---

## 10. Flujo extremo a extremo (visión conjunta)

```
Visitante                Copito / Chat              Taller (Admin)              Técnico
   │ abre el sitio
   │ instala PWA (opcional)
   │ chatea ─────────────► responde + captura lead
   │                       Telegram + campanita ───► ve lead
   │ registra + verifica
   │ login
   │ solicita servicio ────────────────────────────► PENDING
   │   (o llena form del chat / admin agenda quick)
   │                                               asigna técnico ──► ASSIGNED
   │ ◄──── correo (técnico + Bs) ─────────────────┘                   ve tarjeta + mapa
   │ ve estado en /panel                                              inicia ──► IN_PROGRESS
   │                                                                  termina ─► COMPLETED
   │                                               Ingresos += USD ◄─────────────┘
```

---

## 11. Reglas transversales (para no repetirlas en cada CU)

| Tema | Regla |
|---|---|
| **Auth** | JWT en `Authorization`. Guards por rol. Frontend: `ProtectedRoute`. |
| **Precios** | Se guardan en USD. Bs = USD × tasa BCV (DolarAPI, cache 6 h en `Setting`). |
| **Horario de atención** | 8:30–18:00. Franjas de solicitud: Mañana / Tarde. |
| **Mapas** | Leaflet. Coordenadas opcionales; si hay una, deben ir las dos. |
| **Uploads** | Sitio/tipos/carrusel: 2 MB JPG/PNG/WebP. Chat cliente: 5 MB (se comprime). Chat operador: 2 MB. |
| **Invitados de chat** | Email `@guest.local`, sin login. Se vinculan por teléfono. |
| **Especialidad** | Sugerencia de técnico por `User.specialty`, no por apellido. |
| **Ingresos** | Solo `COMPLETED`, fecha = `updatedAt`. |

---

*Fin del documento de casos de uso. 34 casos cubiertos (CU-01 a CU-34).*
