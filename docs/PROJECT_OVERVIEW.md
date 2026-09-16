# Caudal - Project Overview

## ¿Qué es Caudal?

**Caudal** es una aplicación web de finanzas personales construida con **Next.js 16** (App Router) y **PostgreSQL** (vía **Prisma ORM**). Permite al usuario rastrear sus ingresos por nómina, gastos fijos recurrentes y gastos variables, mostrando un dashboard con resumen financiero.

El nombre "Caudal" hace referencia al flujo de dinero — como el caudal de un río.

## Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Framework** | Next.js (App Router) | 16.2.2 |
| **Frontend** | React | 19.2.4 |
| **Estilos** | Tailwind CSS | v4 |
| **ORM** | Prisma Client | 7.7.0 |
| **Base de Datos** | PostgreSQL | (local, puerto 5432) |
| **Adaptador DB** | @prisma/adapter-pg + pg | Pool nativo |
| **Lenguaje** | JavaScript (JSX) | ES2024 |
| **Build Tool** | PostCSS + @tailwindcss/postcss | v4 |
| **Linting** | ESLint + eslint-config-next | v9 |
| **Fuentes** | Geist / Geist Mono (next/font) | — |

## Funcionalidades Principales

### 1. Dashboard (Página Principal)
- Muestra 3 tarjetas: **Total Nómina**, **Total Gastos**, **Restante**
- Calcula en tiempo real sumando todos los registros de las 3 APIs
- Componente client-side con `useEffect` para fetching

### 2. Nómina (Payroll)
- CRUD completo de registros de nómina
- Campos: fecha, semana, monto recibido, ISR, fondo de ahorro, notas
- Agrupación visual por mes con ordenamiento por semana
- Navegación por Enter entre campos (refs)
- Inline editing en tabla

### 3. Gastos Fijos (Fixed Expenses)
- CRUD de gastos recurrentes mensuales
- Campos: nombre, costo, día de vencimiento
- **Matriz de pagos anual**: 12 columnas (Ene-Dic) con botones toggle ✓ para marcar como pagado
- Registro de pagos via `FixedPayment` (upsert por `fixedExpenseId + date`)
- Total pagado anual por gasto y total global

### 4. Gastos Variables (Variable Expenses)
- CRUD de gastos no recurrentes
- Campos: descripción, fecha, monto
- Inline editing en tabla

## Arquitectura de la Aplicación

```
caudal/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.js               # Layout raíz (Geist fonts + Navbar)
│   │   ├── page.js                 # Dashboard (resumen financiero)
│   │   ├── globals.css             # Tailwind + variables CSS (dark mode)
│   │   ├── payroll/page.js         # Página de nóminas
│   │   ├── fixed-expenses/page.js  # Página de gastos fijos
│   │   ├── variable-expenses/page.js # Página de gastos variables
│   │   └── api/                    # API Routes (REST)
│   │       ├── payroll/
│   │       │   ├── route.js        # GET (list) + POST (create)
│   │       │   └── [id]/route.js   # PUT (update) + DELETE
│   │       ├── fixed-expenses/
│   │       │   ├── route.js        # GET (list with payments) + POST
│   │       │   └── [id]/route.js   # PUT + DELETE (cascade payments)
│   │       ├── fixed-payments/
│   │       │   └── route.js        # POST (upsert payment toggle)
│   │       └── variable-expenses/
│   │           ├── route.js        # GET (list) + POST
│   │           └── [id]/route.js   # PUT + DELETE
│   ├── components/
│   │   └── Navbar.js               # Barra de navegación (links a todas las secciones)
│   ├── lib/
│   │   └── prisma.js               # Singleton de PrismaClient con Pool de pg
│   └── generated/
│       └── prisma/                 # Cliente Prisma generado (gitignored)
├── prisma/
│   ├── schema.prisma               # Schema de base de datos
│   └── migrations/                 # Historial de migraciones
├── prisma.config.ts                # Configuración de Prisma (dotenv)
├── package.json                    # Dependencias y scripts
├── next.config.mjs                 # Configuración de Next.js
├── postcss.config.mjs              # PostCSS + Tailwind
├── eslint.config.mjs               # ESLint config
└── .env                            # Variables de entorno (DATABASE_URL)
```

## Modelo de Datos

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Payroll       │     │  FixedExpense    │     │ VariableExpense │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK, auto)   │     │ id (PK, auto)   │     │ id (PK, auto)   │
│ date (DateTime)  │     │ name (String)   │     │ description     │
│ week (Int)       │     │ cost (Float)    │     │ date (DateTime)  │
│ amountReceived   │     │ dueDay (Int)    │     │ amount (Float)   │
│ isr (Float)      │     │ payments[]  ────┼──┐  │ createdAt        │
│ savingsFund      │     │ createdAt       │  │  └─────────────────┘
│ notes (String?)  │     └─────────────────┘  │
│ createdAt        │                           │
└─────────────────┘     ┌─────────────────┐   │
                        │  FixedPayment    │   │
                        ├─────────────────┤   │
                        │ id (PK, auto)   │   │
                        │ fixedExpenseId ──┼───┘ FK → FixedExpense
                        │ date (DateTime)  │
                        │ paid (Boolean)   │
                        │ createdAt        │
                        └─────────────────┘
                        @@unique(fixedExpenseId, date)
```

### Relaciones:
- **FixedExpense → FixedPayment**: 1:N — Un gasto fijo tiene múltiples pagos (uno por mes)
- **Constraint único**: `(fixedExpenseId, date)` — Solo un pago por gasto por fecha

## API REST Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/payroll` | Lista todas las nóminas |
| `POST` | `/api/payroll` | Crea nueva nómina |
| `PUT` | `/api/payroll/:id` | Actualiza nómina |
| `DELETE` | `/api/payroll/:id` | Elimina nómina |
| `GET` | `/api/fixed-expenses` | Lista gastos fijos (con pagos incluidos) |
| `POST` | `/api/fixed-expenses` | Crea gasto fijo |
| `PUT` | `/api/fixed-expenses/:id` | Actualiza gasto fijo |
| `DELETE` | `/api/fixed-expenses/:id` | Elimina gasto fijo (cascade en payments) |
| `POST` | `/api/fixed-payments` | Toggle de pago mensual (upsert) |
| `GET` | `/api/variable-expenses` | Lista gastos variables |
| `POST` | `/api/variable-expenses` | Crea gasto variable |
| `PUT` | `/api/variable-expenses/:id` | Actualiza gasto variable |
| `DELETE` | `/api/variable-expenses/:id` | Elimina gasto variable |

## Historial de Migraciones

1. **`20260409_init`**: Schema inicial — Payroll, FixedExpense, FixedPayment, VariableExpense
2. **`20260514_add_unique_fixed_payment`**: Índice único compuesto en FixedPayment (fixedExpenseId + date)
3. **`20260625_add_savings_fund_to_payroll`**: Campo `savingsFund` agregado a Payroll (default 0)
