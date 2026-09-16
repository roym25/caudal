# Caudal - Reglas de Desarrollo para IA

> Este documento establece las convenciones, restricciones y patrones que cualquier modelo de IA debe seguir al trabajar en este proyecto.

## 🏗️ Arquitectura Obligatoria

### Framework & Routing
- **Next.js 16 con App Router** — No usar Pages Router
- Todas las rutas están en `src/app/`
- API Routes usan la convención `route.js` con exportaciones nombradas (`GET`, `POST`, `PUT`, `DELETE`)
- Parámetros dinámicos via `[id]/route.js`

### Base de Datos
- **Prisma ORM v7** con PostgreSQL
- El schema vive en `prisma/schema.prisma`
- El cliente generado va a `src/generated/prisma/` (gitignored)
- Conexión via **@prisma/adapter-pg** con Pool nativo de `pg` (no el driver default de Prisma)
- Singleton pattern en `src/lib/prisma.js` para evitar múltiples instancias en desarrollo

### Estilos
- **Tailwind CSS v4** via PostCSS (`@tailwindcss/postcss`)
- NO hay archivo `tailwind.config.js` — Tailwind v4 usa CSS-first config
- Variables CSS en `globals.css` con soporte dark mode via `prefers-color-scheme`
- Fuentes: **Geist** y **Geist Mono** via `next/font/google`

## 📏 Convenciones de Código

### Lenguaje
- **JavaScript puro** (no TypeScript) — El proyecto usa `.js` y `.mjs`
- `jsconfig.json` con paths `@/*` mapeando a `src/*`
- Imports con `@/` para rutas absolutas desde src

### Componentes React
- **Client Components** (`'use client'`) para todas las páginas con interactividad
- Hooks: `useState`, `useEffect`, `useRef`
- Patrón de estado: `form` + `editingId` + `editForm` para inline editing
- Patrón fetch: función `fetchX()` llamada en `useEffect` y después de cada mutación
- NO se usa React Server Components actualmente (las páginas son todas client)

### API Routes
- Import singleton: `import prisma from "@/lib/prisma"`
- Response: `Response.json(data)` (Web API nativa, no NextResponse)
- Los params dinámicos se desestructuran con `await`: `const { id } = await params`
- Los datos se parsean del body: `const body = await request.json()`
- Las fechas se crean como: `new Date(body.date + 'T12:00:00Z')` (para payroll) o `new Date(body.date)` (para expenses)

### Naming Conventions
- **Archivos**: kebab-case para rutas (`fixed-expenses/`), PascalCase para componentes (`Navbar.js`)
- **Modelos Prisma**: PascalCase (`FixedExpense`, `FixedPayment`)
- **Campos Prisma**: camelCase (`amountReceived`, `fixedExpenseId`, `dueDay`)
- **API Routes**: kebab-case matching carpetas (`/api/fixed-expenses`)

## 🚫 Restricciones

### NO hacer:
1. **No convertir a TypeScript** — El proyecto es JavaScript deliberadamente
2. **No agregar librerías de UI** (shadcn, MUI, Chakra) — Todo es Tailwind puro
3. **No agregar autenticación** sin aprobación explícita
4. **No modificar el adapter de Prisma** — Usa `@prisma/adapter-pg` con Pool, no el driver default
5. **No crear archivos en `src/generated/`** — Es auto-generado por Prisma
6. **No exponer el `.env`** — Contiene la DATABASE_URL con credenciales
7. **No usar `getServerSideProps` o `getStaticProps`** — Son de Pages Router (obsoleto en Next 16)
8. **No agregar `"use server"` a las API routes** — Solo se usa en Server Actions

### SÍ hacer:
1. **Siempre usar el singleton de Prisma** — `import prisma from "@/lib/prisma"`
2. **Siempre correr migraciones** después de cambios al schema: `npx prisma migrate dev`
3. **Siempre regenerar el cliente** después de cambios: `npx prisma generate`
4. **Mantener consistencia** en el patrón CRUD de las API routes
5. **Mantener el inline editing pattern** en las tablas
6. **Usar `parseInt()` y `parseFloat()`** al recibir datos del body
7. **Confirmar antes de eliminar** (`confirm()` en el frontend)

## 🔄 Patrones Establecidos

### Patrón CRUD de API Routes
```javascript
// route.js — GET (list) + POST (create)
import prisma from "@/lib/prisma"

export async function GET() {
  const items = await prisma.model.findMany({ orderBy: ... })
  return Response.json(items)
}

export async function POST(request) {
  const body = await request.json()
  const item = await prisma.model.create({ data: { ... } })
  return Response.json(item)
}
```

```javascript
// [id]/route.js — PUT (update) + DELETE
export async function PUT(request, { params }) {
  const { id } = await params
  const body = await request.json()
  const item = await prisma.model.update({
    where: { id: parseInt(id) },
    data: { ... }
  })
  return Response.json(item)
}

export async function DELETE(request, { params }) {
  const { id } = await params
  await prisma.model.delete({ where: { id: parseInt(id) } })
  return Response.json({ message: 'Deleted successfully' })
}
```

### Patrón de Página con Inline Editing
```javascript
'use client'
import { useState, useEffect } from "react"

export default function PageName() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ ... })        // Para crear nuevo
  const [editingId, setEditingId] = useState(null)  // ID en edición
  const [editForm, setEditForm] = useState({ ... }) // Datos en edición

  const fetchItems = async () => { /* fetch + setItems */ }
  useEffect(() => { fetchItems() }, [])

  const handleSubmit = async () => { /* POST + reset + refetch */ }
  const handleEdit = (item) => { /* setEditingId + setEditForm */ }
  const handleUpdate = async (id) => { /* PUT + reset + refetch */ }
  const handleDelete = async (id) => { /* confirm + DELETE + refetch */ }

  return ( /* Tabla con conditional rendering basado en editingId */ )
}
```

## 🗄️ Comandos Útiles

```bash
# Desarrollo
npm run dev          # Inicia el servidor de desarrollo (localhost:3000)
npm run build        # Build de producción
npm run start        # Inicia servidor de producción

# Base de datos
npx prisma migrate dev      # Crear y aplicar nueva migración
npx prisma generate         # Regenerar el cliente Prisma
npx prisma studio           # UI visual para la base de datos
npx prisma db push          # Push schema sin migración (dev rápido)

# Linting
npm run lint         # ESLint
```

## 🌐 Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | Connection string de PostgreSQL | `postgresql://user:pass@localhost:5432/caudal?schema=public` |

## 📋 Checklist para Nuevas Features

Cuando agregues una nueva entidad/feature:

1. [ ] Agregar modelo en `prisma/schema.prisma`
2. [ ] Correr `npx prisma migrate dev --name nombre_migration`
3. [ ] Correr `npx prisma generate`
4. [ ] Crear `src/app/api/nombre/route.js` (GET + POST)
5. [ ] Crear `src/app/api/nombre/[id]/route.js` (PUT + DELETE)
6. [ ] Crear `src/app/nombre/page.js` (con patrón de inline editing)
7. [ ] Agregar link en `src/components/Navbar.js`
8. [ ] Actualizar el dashboard en `src/app/page.js` si aplica
9. [ ] Actualizar esta documentación
