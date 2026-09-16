# Caudal - Referencia de Base de Datos

## Conexión

```
DATABASE_URL="postgresql://postgres:<password>@localhost:5432/caudal?schema=public"
```

- **Host**: localhost
- **Puerto**: 5432
- **Database**: caudal
- **Schema**: public
- **Adapter**: @prisma/adapter-pg (Pool nativo de Node.js `pg`)

## Schema Prisma

### Payroll (Nómina)
Registra cada pago de nómina recibido.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | Int | PK, autoincrement | Identificador único |
| `date` | DateTime | required | Fecha del pago |
| `week` | Int | required | Número de semana (1-4 aprox.) |
| `amountReceived` | Float | required | Monto neto recibido |
| `isr` | Float | required | Impuesto Sobre la Renta retenido |
| `savingsFund` | Float | default(0) | Aporte a fondo de ahorro |
| `notes` | String? | optional | Notas adicionales |
| `createdAt` | DateTime | default(now()) | Timestamp de creación |

### FixedExpense (Gasto Fijo)
Define gastos recurrentes mensuales (renta, servicios, etc.).

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | Int | PK, autoincrement | Identificador único |
| `name` | String | required | Nombre del gasto (ej. "Renta", "Internet") |
| `cost` | Float | required | Costo mensual |
| `dueDay` | Int | required | Día del mes en que vence (1-31) |
| `payments` | FixedPayment[] | relación 1:N | Historial de pagos |
| `createdAt` | DateTime | default(now()) | Timestamp de creación |

### FixedPayment (Pago de Gasto Fijo)
Registra si un gasto fijo fue pagado en un mes específico.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | Int | PK, autoincrement | Identificador único |
| `fixedExpenseId` | Int | FK → FixedExpense | Referencia al gasto fijo |
| `date` | DateTime | required | Primer día del mes (para identificar el mes) |
| `paid` | Boolean | default(false) | Si está pagado o no |
| `createdAt` | DateTime | default(now()) | Timestamp de creación |

**Constraints:**
- `@@unique([fixedExpenseId, date])` — Solo un registro de pago por gasto por mes

### VariableExpense (Gasto Variable)
Registra gastos no recurrentes individuales.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | Int | PK, autoincrement | Identificador único |
| `description` | String | required | Descripción del gasto |
| `date` | DateTime | required | Fecha del gasto |
| `amount` | Float | required | Monto del gasto |
| `createdAt` | DateTime | default(now()) | Timestamp de creación |

## Diagrama ER

```
Payroll                    FixedExpense                VariableExpense
┌──────────────┐          ┌──────────────┐            ┌──────────────┐
│ id (PK)      │          │ id (PK)      │            │ id (PK)      │
│ date         │          │ name         │            │ description  │
│ week         │          │ cost         │            │ date         │
│ amountReceived│         │ dueDay       │            │ amount       │
│ isr          │          │ createdAt    │            │ createdAt    │
│ savingsFund  │          └──────┬───────┘            └──────────────┘
│ notes        │                 │ 1
│ createdAt    │                 │
└──────────────┘                 │ N
                          ┌──────┴───────┐
                          │ FixedPayment │
                          ├──────────────┤
                          │ id (PK)      │
                          │ fixedExpenseId│ (FK)
                          │ date         │
                          │ paid         │
                          │ createdAt    │
                          └──────────────┘
                          UNIQUE(fixedExpenseId, date)
```

## Historial de Migraciones

| # | Nombre | Fecha | Cambios |
|---|--------|-------|---------|
| 1 | `init` | 2026-04-09 | Schema inicial con las 4 tablas |
| 2 | `add_unique_fixed_payment` | 2026-05-14 | Índice único en FixedPayment(fixedExpenseId, date) |
| 3 | `add_savings_fund_to_payroll` | 2026-06-25 | Campo savingsFund en Payroll (default 0) |

## Queries Comunes (Prisma)

```javascript
// Listar nóminas ordenadas por fecha
await prisma.payroll.findMany({ orderBy: { date: 'desc' } })

// Listar gastos fijos CON sus pagos
await prisma.fixedExpense.findMany({ include: { payments: true } })

// Upsert de pago (toggle paid)
await prisma.fixedPayment.upsert({
  where: { fixedExpenseId_date: { fixedExpenseId: id, date: date } },
  update: { paid: newValue },
  create: { fixedExpenseId: id, date: date, paid: newValue }
})

// Eliminar gasto fijo con cascade manual
await prisma.fixedPayment.deleteMany({ where: { fixedExpenseId: id } })
await prisma.fixedExpense.delete({ where: { id: id } })
```

## Notas sobre el Adapter

El proyecto usa `@prisma/adapter-pg` en lugar del driver default de Prisma:

```javascript
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })
```

**Razón**: Control directo sobre el Pool de conexiones de PostgreSQL, mejor manejo de conexiones en desarrollo con hot-reload de Next.js.
