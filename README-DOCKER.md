# Fresh Service Digital — Docker (offline local)

Levanta **db + backend + frontend** con los datos del respaldo, para correr el proyecto
en tu laptop **sin depender del VPS**. Ideal como plan B para la presentación.

---

## ⚠️ IMPORTANTÍSIMO — hazlo ANTES (con internet)

**Construir la imagen la primera vez SÍ necesita internet** (descarga las imágenes base de
Docker y los paquetes con pnpm). Por eso:

1. **Hoy / antes de la defensa, CON internet**, construye todo una vez:
   ```bash
   docker compose up --build
   ```
   Espera a que los 3 servicios estén arriba y comprueba `http://localhost:8080`.
   Luego apágalo con `Ctrl+C` (o `docker compose down`).

2. **En la defensa, SIN internet**, levántalo **sin `--build`** (usa lo ya construido):
   ```bash
   docker compose up
   ```

> Regla simple: **`--build` = una sola vez con internet.** Después siempre `docker compose up` (sin `--build`).

---

## Levantar (día de la defensa, offline)

```bash
docker compose up
```

Abre en el navegador: **http://localhost:8080**  ·  API: http://localhost:4000

> El backend puede tardar ~10 s en arrancar la primera vez (intenta consultar la tasa BCV
> y, sin internet, espera el timeout y sigue con la tasa cacheada). Es normal.

## Apagar

```bash
docker compose down
```

Para borrar también los datos de Postgres y recargar el respaldo en el próximo arranque:

```bash
docker compose down -v
```

## Credenciales demo

- **Admin (Taller):** `admin@freshservice.com` / `Admin1234`
- **Clientes:** su correo / `Demo1234`

## Qué NO funciona offline (esperado, no son errores)

- **Envío real de correos** (sin SMTP se simulan en la consola del contenedor `backend`).
- **Actualizar la tasa BCV** (sin internet usa la última tasa guardada en el respaldo).

Todo lo demás —login, solicitudes, panel del taller, ingresos, proforma, filtros— funciona.
