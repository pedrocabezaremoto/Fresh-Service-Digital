# FIX: Imagen por tipo de equipo — control total desde el panel admin

## PROBLEMA
Los tipos de equipo (Nevera, Aire de Ventana, Aire Split, Aire de Toneladas) ya son dinámicos: se crean, renombran y desactivan desde el panel admin. PERO las fotos que aparecen en Home y Catálogo están hardcodeadas — se asignan por posición (el 1ero usa la foto de "maintenance", el 2do la de "install", etc.). Pedro no puede elegir qué foto va con cada tipo.

Además, la sección "Imágenes del sitio" tiene 3 slots fijos (Aires de Ventana, Aires Split, Aires por Toneladas) que ya no tienen sentido porque los tipos son dinámicos.

## OBJETIVO
1. Cada tipo de equipo tiene su propia foto subida desde el panel admin
2. Al crear un tipo nuevo y subirle foto → aparece en Home y Catálogo con esa foto
3. Al desactivar un tipo → desaparece completo (título + foto + servicios) de Home y Catálogo
4. La sección "Imágenes del sitio" ya NO tiene los 3 slots fijos de tipos de equipo (quedan solo Hero y Técnico)
5. CERO cosas hardcodeadas: todo se controla desde el panel

---

## CAMBIO 1 — Campo `imageFilename` en EquipmentTypeOption (backend)

### Archivo: `backend/prisma/schema.prisma`

Buscar:
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

Reemplazar por:
```prisma
model EquipmentTypeOption {
  id             String   @id @default(uuid())
  slug           String   @unique
  label          String
  description    String?
  imageFilename  String?
  sortOrder      Int      @default(0)
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())

  @@map("equipment_type_options")
}
```

### Migración:
```bash
cd backend && pnpm prisma migrate dev --name add_image_to_equipment_type
```

---

## CAMBIO 2 — Endpoint para subir/eliminar imagen del tipo de equipo (backend)

### Archivo: `backend/src/services/services.controller.ts`

Agregar 2 endpoints nuevos (junto a los existentes de equipment-types):

```typescript
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, unlinkSync } from 'fs';

// ... (agregar estos imports arriba si no están)

  @Post('equipment-types/:id/image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: join(process.cwd(), 'uploads', 'equipment-types'),
      filename: (req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase() || '.jpg';
        cb(null, `${req.params.id}-${Date.now()}${ext}`);
      },
    }),
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.startsWith('image/')) {
        cb(new Error('Solo imágenes'), false);
      } else {
        cb(null, true);
      }
    },
  }))
  async uploadEquipmentTypeImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // Borrar imagen anterior si existe
    const existing = await this.prisma.equipmentTypeOption.findUnique({ where: { id } });
    if (existing?.imageFilename) {
      const oldPath = join(process.cwd(), 'uploads', 'equipment-types', existing.imageFilename);
      if (existsSync(oldPath)) unlinkSync(oldPath);
    }
    return this.prisma.equipmentTypeOption.update({
      where: { id },
      data: { imageFilename: file.filename },
    });
  }

  @Delete('equipment-types/:id/image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async deleteEquipmentTypeImage(@Param('id') id: string) {
    const existing = await this.prisma.equipmentTypeOption.findUnique({ where: { id } });
    if (existing?.imageFilename) {
      const filePath = join(process.cwd(), 'uploads', 'equipment-types', existing.imageFilename);
      if (existsSync(filePath)) unlinkSync(filePath);
    }
    return this.prisma.equipmentTypeOption.update({
      where: { id },
      data: { imageFilename: null },
    });
  }
```

**Importante:** asegurarse de que la carpeta `uploads/equipment-types/` exista. Crear con:
```bash
mkdir -p backend/uploads/equipment-types
```

También asegurarse de que el `GET /services/equipment-types` ya devuelve `imageFilename` (lo hace automáticamente porque devuelve todo el objeto).

**Importar** `UploadedFile` de `@nestjs/common` y `FileInterceptor` de `@nestjs/platform-express` si no están importados.

---

## CAMBIO 3 — Endpoint devuelve URL completa de imagen

### Archivo: `backend/src/services/services.controller.ts`

Modificar el `GET /services/equipment-types` existente para que devuelva `imageUrl` (la URL completa para el frontend):

En el `.map()` que ya devuelve `serviceCount` y `minPriceUsd`, agregar:

```typescript
return {
  ...t,
  serviceCount: matching.length,
  minPriceUsd: prices.length ? Math.min(...prices) : null,
  imageUrl: t.imageFilename ? `/uploads/equipment-types/${t.imageFilename}` : null,
};
```

---

## CAMBIO 4 — API frontend: métodos para imagen del tipo de equipo

### Archivo: `frontend-react/src/lib/api.js`

Agregar estos métodos al objeto de api (junto a los existentes de equipment-types):

```javascript
  uploadEquipmentTypeImage: (id, file) => {
    const form = new FormData();
    form.append('image', file);
    return request(`/services/equipment-types/${id}/image`, {
      method: 'POST',
      auth: true,
      raw: true,
      body: form,
    });
  },
  deleteEquipmentTypeImage: (id) =>
    request(`/services/equipment-types/${id}/image`, { method: 'DELETE', auth: true }),
```

**NOTA sobre `raw: true`:** la función `request` en `api.js` normalmente pone `Content-Type: application/json` y hace `JSON.stringify(body)`. Con `raw: true` debe enviar el `body` tal cual (FormData) y NO poner el header Content-Type (el navegador lo pone automáticamente con el boundary del multipart).

Buscar la función `request` en `api.js` y verificar que soporte `raw: true`. Si no lo soporta, modificarla:

```javascript
async function request(path, opts = {}) {
  const { method = 'GET', body, auth, raw } = opts;
  const headers = {};
  if (auth) {
    const token = localStorage.getItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const fetchOpts = { method, headers };
  if (body) {
    if (raw) {
      fetchOpts.body = body; // FormData: el navegador pone Content-Type
    } else {
      headers['Content-Type'] = 'application/json';
      fetchOpts.body = JSON.stringify(body);
    }
  }
  // ... rest stays the same
```

---

## CAMBIO 5 — Panel admin: subir foto por tipo de equipo

### Archivo: `frontend-react/src/pages/AdminDashboard.jsx`

En la sección donde se muestran los tipos de equipo (el modal o la lista de equipment types), agregar para CADA tipo de equipo:

1. **Preview de la imagen actual** (si tiene `imageUrl`, mostrar una miniatura)
2. **Botón "Subir foto"** con un input file oculto
3. **Botón "Quitar foto"** si ya tiene imagen

Ejemplo de UI para cada tipo de equipo en la lista:

```jsx
{/* Dentro de cada item de la lista de tipos de equipo */}
<div className="flex items-center gap-3">
  {item.imageUrl ? (
    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg">
      <img src={`${API_BASE}${item.imageUrl}`} alt={item.label} className="h-full w-full object-cover" />
      <button
        onClick={() => handleDeleteImage(item.id)}
        className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-rose-600 text-white text-xs"
        title="Quitar foto">×</button>
    </div>
  ) : (
    <label className="grid h-14 w-14 shrink-0 cursor-pointer place-items-center rounded-lg border-2 border-dashed border-slate-300 text-ink-400 hover:border-brand-400 hover:text-brand-500">
      <Camera size={20} />
      <input type="file" accept="image/*" className="hidden"
        onChange={(e) => handleUploadImage(item.id, e.target.files[0])} />
    </label>
  )}
  {/* ... rest of the item (label, description, buttons) */}
</div>
```

Las funciones:

```javascript
async function handleUploadImage(id, file) {
  if (!file) return;
  try {
    await api.uploadEquipmentTypeImage(id, file);
    // Recargar la lista de tipos de equipo
    loadEquipmentTypes();
  } catch { /* ignore */ }
}

async function handleDeleteImage(id) {
  try {
    await api.deleteEquipmentTypeImage(id);
    loadEquipmentTypes();
  } catch { /* ignore */ }
}
```

Importar `Camera` de lucide-react si no está importado.

Importar `API_BASE` de la lib de api para construir la URL de la imagen:
```javascript
import { api, API_BASE } from '../lib/api';
```

Si `API_BASE` no está exportado en `api.js`, exportarlo:
```javascript
export const API_BASE = '...'; // ya existe, solo agregar export si falta
```

---

## CAMBIO 6 — Home.jsx: usar la foto del tipo de equipo

### Archivo: `frontend-react/src/pages/Home.jsx`

Donde se construyen las cards dinámicas (el useEffect que lee `api.getEquipmentTypes()`), cambiar la asignación de imagen:

**Antes** (asigna por posición, hardcodeado):
```javascript
const imgMap = { maintenance: images.maintenance, install: images.install, repair: images.repair };
const imgKeys = Object.keys(imgMap);
const idx = validTypes.indexOf(t) % imgKeys.length;
// ...
img: imgMap[imgKeys[idx]] || images.maintenance,
```

**Después** (usa la foto del tipo de equipo):
```javascript
img: t.imageUrl ? `${API_BASE}${t.imageUrl}` : images.maintenance,
```

Importar `API_BASE`:
```javascript
import { api, API_BASE } from '../lib/api';
```

Si `API_BASE` ya estaba importado en otro lugar del archivo, no duplicar.

**Fallback:** si el tipo de equipo no tiene foto subida (`imageUrl` es null), usa la imagen default de mantenimiento. Así no se rompe nada.

---

## CAMBIO 7 — Catalogo.jsx: usar la foto del tipo de equipo

### Archivo: `frontend-react/src/pages/Catalogo.jsx`

Mismo cambio que Home. Donde se construyen las secciones dinámicas, cambiar la asignación de imagen:

**Antes:**
```javascript
imgKey: imgKeys[idx % imgKeys.length],
// y después: img: images[def.imgKey]
```

**Después:**
```javascript
img: t.imageUrl ? `${API_BASE}${t.imageUrl}` : images.maintenance,
```

Y donde se renderiza la imagen del acordeón, usar `section.img` directo en vez de `images[def.imgKey]`.

---

## CAMBIO 8 — Quitar slots fijos de tipos de equipo de "Imágenes del sitio"

### Archivo: `frontend-react/src/lib/images.js`

Buscar el array `SITE_IMAGE_SLOTS`:
```javascript
export const SITE_IMAGE_SLOTS = [
  { slot: 'hero', label: 'Hero principal', hint: '1920×800 px', defaultKey: 'heroTech' },
  { slot: 'service_ventana', label: 'Aires de Ventana', hint: '800×600 px', defaultKey: 'maintenance' },
  { slot: 'service_split', label: 'Aires Split', hint: '800×600 px', defaultKey: 'install' },
  { slot: 'service_toneladas', label: 'Aires por Toneladas', hint: '800×600 px', defaultKey: 'repair' },
  { slot: 'technician', label: 'Técnico', hint: '800×1000 px', defaultKey: 'technician' },
];
```

Reemplazar por (quitar los 3 slots de servicios):
```javascript
export const SITE_IMAGE_SLOTS = [
  { slot: 'hero', label: 'Hero principal', hint: '1920×800 px', defaultKey: 'heroTech' },
  { slot: 'technician', label: 'Técnico', hint: '800×1000 px', defaultKey: 'technician' },
];
```

También limpiar `SLOT_TO_KEY`:
```javascript
const SLOT_TO_KEY = {
  hero: 'heroTech',
  technician: 'technician',
};
```

**NO borrar** las imágenes físicas de `public/` (img-window-ac.png, img-split-ac.png, img-tonnage-ac.png) — siguen sirviendo como fallback si un tipo no tiene foto.

**NO borrar** las fotos que ya están en `uploads/site-images/` en el servidor (si las hay). Solo dejan de aparecer en el panel de "Imágenes del sitio".

---

## Build y deploy

```bash
mkdir -p backend/uploads/equipment-types
cd backend && pnpm prisma migrate deploy && pnpm run build && pm2 restart fresh-service
cd ../frontend-react && pnpm build && pm2 restart fresh-frontend
```

Backend Y frontend se reconstruyen.

---

## Verificación

1. **Panel → Servicios → Tipos de equipo:** cada tipo ahora muestra un cuadrado para subir foto. Al subirla, se ve la miniatura. Al quitarla, vuelve el cuadrado vacío.
2. **Home:** las cards muestran la foto que subiste para cada tipo. Si no tiene foto, muestra la imagen default.
3. **Catálogo:** los acordeones muestran la foto subida de cada tipo.
4. **Crear tipo nuevo:** crear "Lavadoras" → subirle foto → agregarle 1 servicio → aparece en Home y Catálogo con su foto.
5. **Desactivar tipo:** desactivar "Nevera" → desaparece de Home y Catálogo (foto + título + servicios).
6. **Imágenes del sitio:** solo muestra Hero principal y Técnico (ya no los 3 slots fijos de aires).

## NO TOCAR
- Solicitud.jsx
- Chat / Copito / Socket.IO
- Carrusel del hero (sección aparte)
- Ticker promocional
- Footer
- Tablas de servicios y categorías
- Las fotos existentes en `public/` (son fallback)
