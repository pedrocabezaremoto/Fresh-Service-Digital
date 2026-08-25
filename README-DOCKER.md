# Fresh Service Digital — Docker (offline / portable)

Levanta **db + backend + frontend** con el respaldo actual (`docker/seed-data.sql`)
para correr el proyecto en cualquier máquina con Docker, sin depender del VPS.

## Levantar con Docker (offline / portable)

### Requisitos
- Docker Desktop o Docker Engine + Docker Compose

### Primera vez (con internet)
```bash
docker compose up --build
```

Construir la imagen la primera vez **sí necesita internet** (imágenes base + pnpm).
Espera a que los 3 servicios estén arriba y comprueba `http://localhost:8080`.

### Siguientes veces (offline)
```bash
docker compose up
```

> Regla: `--build` = una sola vez con internet. Después siempre `docker compose up`.

### Acceder
- **Sitio web:** http://localhost:8080
- **API:** http://localhost:4000
- **Login admin:** admin@freshservice.com / Admin1234
- **Login técnico:** carlos.tecnico@freshservice.com / Tecnico1234
- **Login cliente:** su correo / Demo1234

### Notas
- El chatbot Copito necesita API key de DeepSeek para responder (sin key, el chat no responde pero no rompe nada)
- Los correos se simulan en consola (ver logs del backend: `docker compose logs backend`)
- Las fotos subidas desde el panel admin se guardan en el volumen `backend_uploads`
- Sin internet, la tasa BCV usa la última cacheada del respaldo (el backend puede tardar ~10 s en el timeout; es normal)
- Para resetear la DB: `docker compose down -v` y volver a `up --build`

### Apagar

```bash
docker compose down
```

> **No levantar este compose en el VPS de producción:** el backend de Docker publica el puerto **4000**, el mismo que usa pm2 (`fresh-service`).
