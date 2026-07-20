# 📘 Manual de Usuario — Fresh Service Digital

Plataforma web para solicitar y gestionar servicios de refrigeración a domicilio en
San Juan de los Morros, Venezuela.

> **Versión 1.0** · Última actualización: 2026-07-19

- **Sitio (clientes):** https://fresh.pedroservicios.xyz
- **API (backend):** https://api.pedroservicios.xyz

Hay **tres tipos de usuario**: **Cliente**, **Técnico** y **Administrador (Taller)**.

> 💡 **Modo claro / oscuro:** en la barra superior hay un botón (🌙 / ☀️) para cambiar
> el tema en todo el sitio y en el panel del taller.

---

## 🔑 Cuentas de demostración

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador (Taller) | `admin@freshservice.com` | `Admin1234` |
| Técnico | `tecnico@freshservice.com` | `Demo1234` |
| Cliente (ejemplo) | su correo registrado | `Demo1234` |

---

## 👤 Parte 1 — Cliente

### 1.1 Crear una cuenta
1. En la página principal, pulsa **"Solicitar servicio"** o **"Iniciar sesión → Regístrate gratis"**.
2. Completa: nombre, apellido, correo, WhatsApp y contraseña.
3. Pulsa **Crear mi cuenta**.

### 1.2 Verificar el correo (obligatorio)
1. Revisa tu bandeja de entrada (y **spam**): llega el correo *"Activa tu cuenta"*.
2. Pulsa **"Activar mi cuenta ahora"** → tu cuenta queda verificada.
3. Ya puedes iniciar sesión.

> Sin verificar el correo, el sistema no te deja entrar (seguridad real).

### 1.3 Iniciar sesión
- Entra con tu correo y contraseña en **Iniciar sesión**.

### 1.3.1 Recuperar contraseña (si la olvidaste)
1. En el login, pulsa **"¿Olvidaste tu contraseña?"**.
2. Escribe tu correo y pulsa **Enviar enlace**.
3. Te llega un correo con un enlace (revisa **spam**). El enlace **vence en 1 hora**.
4. Ábrelo → escribe tu **nueva contraseña** → **Cambiar contraseña**.
5. Vuelves al login y entras con la nueva clave.

### 1.4 Solicitar un servicio
1. Pulsa **"Solicitar servicio"**.
2. Tus datos (nombre, teléfono, cédula) vienen **precargados** desde tu cuenta.
3. Elige el **tipo de equipo** (Ventana, Split, Toneladas) y el **tipo de servicio**
   (Reparación, Mantenimiento, Instalación, Recarga de Gas, Diagnóstico).
4. Verás el **precio estimado** (en Bs a la tasa oficial del BCV del día + referencia en USD).
5. Indica fecha, horario y dirección → **Enviar solicitud**.
6. Recibes un número de **referencia**.

### 1.5 Tu panel de cliente
- Verás tus datos, el **total a pagar** de los servicios activos y el historial.
- Cada solicitud muestra su **precio**, **estado** y, si ya fue asignada, el **técnico** con su WhatsApp.
- Puedes **Descargar la proforma** (PDF con el desglose y el total).
- Cuando el taller te asigna un técnico, **te llega un correo** con el detalle y el total.

---

## 🔧 Parte 2 — Administrador (Panel del Taller)

Ingresa con la cuenta de administrador. Menú lateral: **Dashboard, Solicitudes, Ingresos, Clientes**.

### 2.1 Dashboard
- Tarjetas con **estadísticas en vivo** (solicitudes, pendientes, en proceso, clientes).
  Son **clickeables** y llevan a la lista filtrada.
- Gráficos reales: **Citas por estado** (dona), **Citas por mes**, **Marcas más atendidas**.
- Botón **Exportar Excel** (reporte de todas las solicitudes en CSV).

### 2.2 Gestión de Solicitudes
- Lista de todas las solicitudes en vivo.
- **Filtros inteligentes** por columna (Cliente, Servicio, Fecha, Estado): escribe o elige del desplegable.
- **Asignar técnico:** en la columna Técnico eliges uno; el sistema **sugiere** el especialista
  según el tipo de aire. Al asignar, el estado pasa a *Asignada* y **le llega el correo al cliente**.
- **Cambiar estado** de cada solicitud (Pendiente → Asignada → En proceso → Completada / Cancelada).
- Botón de **WhatsApp** por fila para contactar al cliente.

### 2.3 Ingresos (Control de Servicios Realizados)
- Ganancias de servicios **completados** por período: Hoy, Semana, Mes, Año.
- Las **tarjetas de período son clickeables**: al pulsar una, la tabla de abajo se **filtra**
  por ese período (púlsala de nuevo para quitar el filtro).
- Cada período tiene su botón **CSV** para descargar el reporte.
- La tabla de servicios completados tiene **filtros por columna** (Fecha, Cliente, Servicio,
  Técnico, Monto) y el **total** se recalcula según lo filtrado.

### 2.4 Clientes
- Directorio de clientes con **filtros inteligentes** (Cliente, Correo, Teléfono, Registrado).
- **Editar** un usuario (nombre, correo, teléfono, rol, contraseña) con el ícono de lápiz.
- **Eliminar** un usuario con el ícono de basura (aparece un modal de confirmación).

---

## 🧑‍🔧 Parte 3 — Técnicos

- Técnicos ficticios de demo: **Juan** (Aires de Ventana), **Carlos** (Split), **Jorge** (Toneladas).
- Cuando el taller les asigna un servicio, el cliente ve su **nombre y WhatsApp** en el panel.

---

## 💵 Precios (referencia)

Los precios se guardan en **USD** y se muestran en **Bs** a la tasa oficial del BCV del día
(se actualiza sola). Servicio de mantenimiento base: Ventana $25 · Split $35 · 1 Tonelada $50.
Reparación e instalación cuestan más. El total exacto aparece siempre en la web y en la proforma.

---

## ❓ Preguntas frecuentes

- **No me llega el correo:** revisa la carpeta de **Spam** y marca *"No es spam"*.
- **No puedo iniciar sesión:** confirma que verificaste tu correo (revisa spam).
- **Olvidé mi contraseña:** usa **"¿Olvidaste tu contraseña?"** en el login.
- **El precio en Bs cambió:** es normal — se calcula a la tasa oficial del BCV del día.

---

## 🖥️ Correr la plataforma sin internet (demostración local)

El proyecto se puede levantar **100% local con Docker** (sin depender del servidor). Útil para
demostrarlo aunque falle el internet. Instrucciones: ver **`README-DOCKER.md`** en la raíz.
Resumen: construir una vez con internet (`docker compose up --build`) y luego correr offline
(`docker compose up`), abriendo `http://localhost:8080`.
