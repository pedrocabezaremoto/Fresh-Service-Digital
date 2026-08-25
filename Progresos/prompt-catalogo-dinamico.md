# FIX: Catálogo y Home dinámicos — títulos desde el panel admin

## PROBLEMA
Los títulos "Aires de Ventana", "Aires Split", "Aires por Toneladas" están **hardcodeados** en `Home.jsx` y `Catalogo.jsx`. Pedro no puede cambiarlos desde el panel admin. Si mañana quiere agregar "Neveras", tiene que tocar código.

La tabla `equipment_type_options` ya existe con CRUD desde el admin (Panel → Servicios → Tipos de equipo), pero Home y Catálogo NO la usan — tienen arrays `SECTION_DEFS` y `SERVICE_CARDS` escritos a mano.

## OBJETIVO
1. Home.jsx y Catalogo.jsx deben leer los tipos de equipo desde la API (`GET /services/equipment-types`)
2. Los títulos, subtítulos y el conteo de servicios se generan automáticamente
3. Si Pedro agrega un tipo de equipo nuevo ("Neveras") y le crea servicios, aparece automáticamente en Home y Catálogo
4. Si desactiva un tipo de equipo, desaparece de Home y Catálogo

---

## CAMBIO 1 — Agregar campo `description` a EquipmentTypeOption (backend)

### Archivo: `backend/prisma/schema.prisma`

Buscar:
```prisma
model EquipmentTypeOption {
  id        String   @id @default(uuid())
  slug      String   @unique
  label     String
  sortOrder Int      @default(0)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())

  @@map("equipment_type_options")
}
```

Reemplazar por:
```prisma
model EquipmentTypeOption {
  id          String   @id @default(uuid())
  slug        String   @unique
  label       String
  description String?
  sortOrder   Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())

  @@map("equipment_type_options")
}
```

### Migración:
```bash
cd backend && pnpm prisma migrate dev --name add_description_to_equipment_type
```

### Actualizar datos existentes con SQL (ejecutar después de la migración):
```sql
UPDATE equipment_type_options SET description = 'Unidades de ventana de todas las marcas' WHERE slug = 'VENTANA';
UPDATE equipment_type_options SET description = 'Sistemas mini y maxi split, interior y exterior' WHERE slug = 'SPLIT';
UPDATE equipment_type_options SET description = 'Equipos de 3 a 5 toneladas para comercios y locales' WHERE slug LIKE 'TONELADA%' AND description IS NULL;
```

**Nota:** si hay múltiples slugs de toneladas (TONELADA_1, TONELADA_2, TONELADA_3), solo actualizar los que tengan `description` NULL.

---

## CAMBIO 2 — Endpoint devuelve `description` + conteo de servicios

### Archivo: `backend/src/services/services.controller.ts`

Buscar el endpoint `GET /services/equipment-types` (línea ~95):
```typescript
  @Get('equipment-types')
  async getEquipmentTypes() {
    return this.prisma.equipmentTypeOption.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }
```

Reemplazar por:
```typescript
  @Get('equipment-types')
  async getEquipmentTypes() {
    const types = await this.prisma.equipmentTypeOption.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    const services = await this.prisma.service.findMany({
      where: { isActive: true },
      select: { equipmentType: true, priceUsd: true },
    });
    return types.map((t) => {
      const matching = services.filter((s) => s.equipmentType === t.slug);
      const prices = matching
        .map((s) => Number(s.priceUsd))
        .filter((p) => Number.isFinite(p) && p > 0);
      return {
        ...t,
        serviceCount: matching.length,
        minPriceUsd: prices.length ? Math.min(...prices) : null,
      };
    });
  }
```

Esto agrega `serviceCount` y `minPriceUsd` a cada tipo de equipo. Así el frontend no tiene que calcularlo.

---

## CAMBIO 3 — Admin: campo descripción al editar tipo de equipo

### Archivo: `frontend-react/src/pages/AdminDashboard.jsx`

En la sección donde se editan los tipos de equipo (modal de edición de EquipmentTypeOption), agregar un campo `<input>` o `<textarea>` para `description`. Buscar donde está el input de edición del `label` del tipo de equipo y agregar debajo:

```jsx
<input
  placeholder="Descripción (ej: Unidades de ventana de todas las marcas)"
  value={editItem.description || ''}
  onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
/>
```

Asegurarse de que el `PATCH` al API envíe `description` junto con `label`.

También al crear un tipo de equipo nuevo, agregar el campo `description` en el formulario de creación.

---

## CAMBIO 4 — Home.jsx: cards dinámicas desde el API

### Archivo: `frontend-react/src/pages/Home.jsx`

**Eliminar** el array `SERVICE_CARDS` (líneas 11-37) y la función `minPriceForTypes` (líneas 39-44).

**Reemplazar** el useEffect y useMemo actuales con esto:

```jsx
export default function Home() {
  const { images } = useSiteImages();
  const [cards, setCards] = useState([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.getEquipmentTypes(), api.getServices()])
      .then(([types, services]) => {
        if (cancelled) return;
        const validTypes = Array.isArray(types) ? types : [];
        const validServices = Array.isArray(services) ? services : [];
        const result = validTypes
          .filter((t) => t.serviceCount > 0)
          .map((t) => {
            const imgMap = { maintenance: images.maintenance, install: images.install, repair: images.repair };
            const imgKeys = Object.keys(imgMap);
            const idx = validTypes.indexOf(t) % imgKeys.length;
            return {
              key: t.slug,
              title: t.label,
              desc: t.description || '',
              priceFrom: t.minPriceUsd,
              hidePrice: t.minPriceUsd === null,
              img: imgMap[imgKeys[idx]] || images.maintenance,
            };
          });
        setCards(result);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [images]);

  // ... rest of the component stays the same
```

El `cards.map(...)` en el JSX sigue igual — ya usa `s.title`, `s.desc`, `s.priceFrom`, `s.hidePrice`, `s.img`.

**Fallback:** si la API falla, `cards` queda vacío y la sección no muestra nada (mejor que mostrar datos hardcodeados desactualizados). Si Pedro prefiere un fallback, puede dejarse el array `SERVICE_CARDS` y usarlo solo cuando `cards.length === 0`.

---

## CAMBIO 5 — Catalogo.jsx: secciones dinámicas desde el API

### Archivo: `frontend-react/src/pages/Catalogo.jsx`

**Eliminar** el array `SECTION_DEFS` (líneas 21-46).

**Modificar** el componente para cargar los tipos de equipo del API:

Dentro del componente, agregar un state y useEffect:

```jsx
const [eqTypes, setEqTypes] = useState([]);

useEffect(() => {
  api.getEquipmentTypes()
    .then((data) => setEqTypes(Array.isArray(data) ? data : []))
    .catch(() => setEqTypes([]));
}, []);
```

Donde antes se usaba `SECTION_DEFS`, ahora usar `eqTypes` mapeado. Buscar donde se itera sobre las secciones (probablemente un `.map` sobre `SECTION_DEFS` o sobre un array derivado) y reemplazar la fuente:

```jsx
const sections = eqTypes
  .filter((t) => t.serviceCount > 0)
  .map((t, idx) => {
    const imgKeys = ['maintenance', 'install', 'repair'];
    return {
      key: t.slug,
      title: t.label,
      subtitle: t.description || '',
      types: [t.slug],
      imgKey: imgKeys[idx % imgKeys.length],
      mode: t.minPriceUsd === null ? 'tonnage' : 'list',
      serviceCount: t.serviceCount,
    };
  });
```

En el JSX, donde mostraba el badge "5 SERVICIOS" hardcodeado o calculado, ahora usar `section.serviceCount`:

```jsx
<span className="...badge classes...">{section.serviceCount} SERVICIOS</span>
```

El filtrado de servicios por `types` ya funciona — `source.filter((s) => def.types.includes(s.equipmentType))`. Al poner `types: [t.slug]`, cada sección filtra por su slug.

---

## Build y deploy

```bash
cd backend && pnpm prisma migrate deploy && pnpm run build && pm2 restart fresh-service
cd ../frontend-react && pnpm build && pm2 restart fresh-frontend
```

Backend Y frontend se reconstruyen (se tocaron ambos).

---

## Verificación

1. **Panel admin → Servicios → Tipos de equipo:** cada tipo de equipo ahora tiene campo "Descripción" editable.
2. **Cambiar título:** editar "Aires de Ventana" a "Neveras" → guardar → recargar Home y Catálogo → debe decir "Neveras".
3. **Conteo automático:** si "Neveras" tiene 3 servicios, el badge dice "3 SERVICIOS". Si tiene 10, dice "10 SERVICIOS".
4. **Agregar tipo nuevo:** crear tipo "Lavadoras" desde el panel → agregarle al menos 1 servicio → aparece automáticamente en Home y Catálogo.
5. **Desactivar tipo:** desactivar "Aires por Toneladas" → desaparece de Home y Catálogo.
6. **Precio mínimo:** se muestra el precio más bajo de los servicios de ese tipo. Si no hay precio (null), no muestra precio (como Toneladas hoy).

## NO TOCAR
- Solicitud.jsx (ya carga servicios dinámicamente)
- Backend endpoints existentes de servicios (CRUD servicios, categorías)
- Chat / Copito / Socket.IO
- Carrusel, Ticker, Footer
- La tabla `services` y sus datos existentes
