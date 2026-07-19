# Fresh Service Digital — Docker (offline local)

Levanta db + backend + frontend con los datos del respaldo, sin internet.

## Levantar

```bash
docker compose up --build
```

Abre: http://localhost:8080  
API: http://localhost:4000

## Apagar

```bash
docker compose down
```

Para borrar también los datos de Postgres y recargar el seed en el próximo arranque:

```bash
docker compose down -v
```

## Credenciales demo

- Admin: `admin@freshservice.com` / `Admin1234`
- Cliente demo: contraseña `Demo1234` (ver emails en el panel)
