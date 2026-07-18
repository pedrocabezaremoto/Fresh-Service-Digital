# Guía: Precios en USD mostrados en Bolívares con la tasa oficial del BCV (API)

Implementación real y reutilizable. **Modelo de anclaje:** los precios se guardan en
**USD** (estable) y se muestran en **Bs** calculados al vuelo con la tasa oficial del
BCV. Cuando la tasa cambia, los Bs se recalculan solos **sin reeditar nada**.

---

## 🏦 La API que se usa: DolarAPI Venezuela

**No es conexión directa al BCV** (el BCV no tiene API pública oficial). DolarAPI es un
servicio gratuito que ya publica la tasa oficial del BCV.

| | |
|---|---|
| **Servicio** | DolarAPI Venezuela |
| **Endpoint (oficial/BCV)** | `https://ve.dolarapi.com/v1/dolares/oficial` |
| **Web / docs** | https://ve.dolarapi.com |
| **Costo** | Gratis, sin API key, sin registro |

Respuesta de ejemplo:
```json
{
  "fuente": "oficial",
  "nombre": "Oficial",
  "compra": null,
  "venta": null,
  "promedio": 732.4787,
  "fechaActualizacion": "2026-07-17T08:00:00.000Z"
}
```
El campo usado es **`promedio`** (la tasa oficial BCV).

> Otros endpoints del mismo servicio: `/v1/dolares/paralelo`, `/v1/dolares` (todos).
> Alternativa: **PyDolarVenezuela** (`https://pydolarve.org`) si quieres otra fuente.

---

## 🧠 Concepto clave

Guardas el precio en **USD** y **calculas los Bs al vuelo** con la tasa del día. Así,
cuando la tasa sube, **NO reeditas ninguna propiedad** — los Bs se recalculan solos.

```
Precio guardado: $48 USD  →  se muestra: Bs 34.792  (48 × 724.8)
```

---

## ⚙️ PASO A PASO — Backend (Node + Express)

### 1. Herramientas
- `fetch` → **nativo en Node 18+** (no instalas nada).
- `pg` → para guardar la tasa en PostgreSQL (cache que sobrevive reinicios).

### 2. Tabla para cachear la tasa
```sql
CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 3. Lógica (traer + cachear + refrescar cada 6h)
```js
const BCV_API_URL = 'https://ve.dolarapi.com/v1/dolares/oficial';
const RATE_REFRESH_MS = 6 * 60 * 60 * 1000; // 6 horas

const rateCache = { rate: null, date: null, source: 'BCV' };

async function refreshRate() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // timeout 10s
  try {
    const res = await fetch(BCV_API_URL, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const value = Number(data.promedio ?? data.venta); // la tasa
    if (!value || value <= 0) throw new Error('Tasa inválida');
    rateCache.rate = value;
    rateCache.date = String(data.fechaActualizacion).slice(0, 10);
    await saveRateToDB();               // persiste en settings
    console.log(`💱 Tasa actualizada: ${value}`);
  } catch (err) {
    // SI FALLA LA API, se queda con la última tasa conocida. NO rompe la web.
    console.error('No se pudo actualizar:', err.message);
  } finally {
    clearTimeout(timeout);
  }
}

// Al arrancar: carga la última de la BD, refresca, y repite cada 6h
loadRateFromDB().then(() => {
  refreshRate();
  setInterval(refreshRate, RATE_REFRESH_MS);
});
```

**3 detalles importantes:**
1. **Tolerancia a fallos:** si la API se cae, usa la última tasa guardada → la web nunca se rompe.
2. **Timeout con `AbortController`:** si la API tarda >10s, corta y sigue.
3. **Persistencia:** se guarda en la BD, así al reiniciar el servidor ya tiene una tasa (no espera a la API).

### 4. Funciones de apoyo (cargar/guardar en BD)
```js
async function loadRateFromDB() {
  const result = await pool.query(
    `SELECT value, updated_at FROM settings WHERE key = 'bcv_rate'`
  );
  if (result.rows.length > 0 && result.rows[0].value) {
    const parsed = JSON.parse(result.rows[0].value);
    rateCache.rate = parsed.rate ?? null;
    rateCache.date = parsed.date ?? null;
  }
}

async function saveRateToDB() {
  const payload = JSON.stringify({
    rate: rateCache.rate, date: rateCache.date, source: rateCache.source
  });
  await pool.query(
    `INSERT INTO settings (key, value, updated_at) VALUES ('bcv_rate', $1, NOW())
     ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
    [payload]
  );
}
```

### 5. Endpoint que consume el frontend
```js
app.get('/api/rate', (_req, res) => res.json(rateCache));
```

---

## ⚛️ PASO A PASO — Frontend (React)

### 1. Un Context que carga la tasa UNA vez (`hooks/useRate.jsx`)
```jsx
import { useState, useEffect, createContext, useContext } from 'react';

const RateContext = createContext(null);

export function RateProvider({ children }) {
  const [rate, setRate] = useState(null);
  useEffect(() => {
    fetch('/api/rate').then(r => r.json()).then(d => setRate(d.rate));
  }, []);
  return <RateContext.Provider value={{ rate }}>{children}</RateContext.Provider>;
}
export const useRate = () => useContext(RateContext);
```
Envuelves tu app: `<RateProvider><App /></RateProvider>`

### 2. Helper de formato (`utils/money.js`)
```js
export function formatUsd(usd) {
  const n = Number(usd || 0);
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export function formatBs(usd, rate) {
  if (!rate) return null;
  return 'Bs ' + (usd * rate).toLocaleString('es-VE', { maximumFractionDigits: 2 });
}
```

### 3. Componente reutilizable (`components/Price.jsx`)
```jsx
import { useRate } from '../hooks/useRate';
import { formatBs, formatUsd } from '../utils/money';

export default function Price({ usd }) {
  const { rate } = useRate();
  const bs = formatBs(usd, rate);
  return (
    <div className="price-box">
      {bs ? (
        <>
          <span className="price-bs">{bs}</span>
          <span className="price-usd-ref">Ref. {formatUsd(usd)}</span>
        </>
      ) : (
        <span className="price-bs">{formatUsd(usd)}</span>
      )}
    </div>
  );
}
```
Uso en cualquier lado: `<Price usd={propiedad.price} />` → muestra **Bs grande + Ref. USD chico**.

---

## 📋 Resumen

| Paso | Qué haces |
|---|---|
| 1 | Consumes `https://ve.dolarapi.com/v1/dolares/oficial` con `fetch` (gratis, sin key) |
| 2 | Guardas los precios en **USD** en tu BD |
| 3 | Backend refresca la tasa cada 6h con `setInterval` + la cachea en tabla `settings` |
| 4 | Expones un endpoint `/api/rate` |
| 5 | Frontend la lee 1 vez con un Context y calcula Bs con `usd × rate` |

**Herramientas totales:** `fetch` (nativo Node 18+), `pg` (opcional, para cachear),
React Context. **Cero librerías de pago, cero API keys.**

---

## Extras opcionales
- **Refresco manual:** endpoint admin `POST /api/admin/rate/refresh` que llama a `refreshRate()`.
- **Variable de entorno** para cambiar la fuente sin tocar código:
  `const BCV_API_URL = process.env.BCV_API_URL || 'https://ve.dolarapi.com/v1/dolares/oficial';`
- **Mostrar fecha de la tasa** en el UI (campo `date` del cache) para transparencia.
