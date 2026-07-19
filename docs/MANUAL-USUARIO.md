# 📘 Manual de Usuario — Fresh Service Digital

Plataforma web para solicitar y gestionar servicios de refrigeración a domicilio en
San Juan de los Morros, Venezuela.

- **Sitio (clientes):** https://fresh.pedroservicios.xyz
- **API (backend):** https://api.pedroservicios.xyz

Hay **tres tipos de usuario**: **Cliente**, **Técnico** y **Administrador (Taller)**.

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
- ¿Olvidaste la contraseña? → **"¿Olvidaste tu contraseña?"** → escribe tu correo →
  te llega un enlace (vence en 1 hora) → creas una nueva.

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
- Cada período se puede **descargar en CSV**.
- Tabla con todos los servicios completados y su monto.

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
