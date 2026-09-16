# Caudal - Mapa de Archivos y Contexto

> Referencia rápida de cada archivo del proyecto con su propósito y relaciones.

## Archivos Raíz

| Archivo | Propósito |
|---------|-----------|
| `package.json` | Dependencias y scripts npm |
| `next.config.mjs` | Configuración de Next.js (vacía, defaults) |
| `postcss.config.mjs` | PostCSS con @tailwindcss/postcss |
| `eslint.config.mjs` | ESLint con next/core-web-vitals |
| `jsconfig.json` | Alias `@/*` → `src/*` para imports |
| `prisma.config.ts` | Configuración de Prisma (dotenv + schema path) |
| `.env` | `DATABASE_URL` para PostgreSQL local |
| `.gitignore` | Ignora node_modules, .next, .env*, generated |

## `prisma/`

| Archivo | Propósito |
|---------|-----------|
| `schema.prisma` | **Fuente de verdad** del modelo de datos |
| `migrations/` | SQL generado por `prisma migrate dev` |

## `src/app/` — Páginas (Frontend)

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `layout.js` | Server Component | Layout raíz: fonts Geist, Navbar, HTML wrapper |
| `page.js` | Client Component | **Dashboard** — 3 cards con totales (payroll, expenses, remaining) |
| `globals.css` | CSS | Tailwind import + variables CSS + dark mode |
| `payroll/page.js` | Client Component | **Nómina** — Form + tabla con agrupación por mes, inline edit |
| `fixed-expenses/page.js` | Client Component | **Gastos Fijos** — Form + matriz 12 meses con toggle de pagos |
| `variable-expenses/page.js` | Client Component | **Gastos Variables** — Form + tabla con inline edit |

## `src/app/api/` — API Routes (Backend)

| Archivo | Métodos | Descripción |
|---------|---------|-------------|
| `payroll/route.js` | GET, POST | Listar y crear nóminas |
| `payroll/[id]/route.js` | PUT, DELETE | Actualizar y eliminar nómina |
| `fixed-expenses/route.js` | GET, POST | Listar (con payments) y crear gastos fijos |
| `fixed-expenses/[id]/route.js` | PUT, DELETE | Actualizar y eliminar gasto fijo (cascade) |
| `fixed-payments/route.js` | POST | Upsert de pago mensual (toggle) |
| `variable-expenses/route.js` | GET, POST | Listar y crear gastos variables |
| `variable-expenses/[id]/route.js` | PUT, DELETE | Actualizar y eliminar gasto variable |

## `src/components/`

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `Navbar.js` | Server Component | Barra de navegación con 4 links (Dashboard, Payroll, Fixed, Variable) |

## `src/lib/`

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `prisma.js` | Utility | Singleton de PrismaClient con Pool de pg. Patrón anti hot-reload leak. |

## `src/generated/prisma/`

Auto-generado por `npx prisma generate`. **Gitignored.** No editar manualmente.

---

## Flujo de Datos

```
[Usuario en Browser]
       │
       ▼
  [Navbar.js] ──── Links ────► [page.js de cada sección]
       │                              │
       │                    useEffect + fetch()
       │                              │
       ▼                              ▼
  [layout.js]              [API Route (route.js)]
  (Server Component)              │
                                  ▼
                           [prisma.js singleton]
                                  │
                                  ▼
                           [PrismaClient + Pool]
                                  │
                                  ▼
                           [PostgreSQL DB]
```

## Dependencias Directas

```
caudal
├── next@16.2.2          ← Framework full-stack
├── react@19.2.4         ← UI library
├── react-dom@19.2.4     ← React DOM renderer
├── @prisma/client@7.7.0 ← ORM client
├── @prisma/adapter-pg@7.7.0 ← PostgreSQL adapter
├── pg@8.20.0            ← Node.js PostgreSQL driver
└── dotenv@17.4.1        ← Environment variables

devDependencies:
├── prisma@7.7.0         ← Prisma CLI
├── tailwindcss@4         ← CSS framework
├── @tailwindcss/postcss@4 ← Tailwind PostCSS plugin
├── eslint@9             ← Linter
└── eslint-config-next@16.2.2 ← Next.js ESLint rules
```
