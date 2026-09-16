# Caudal - Plan de Implementación Completo

> Este documento es un plan paso a paso para que un modelo de IA implemente todas las mejoras pendientes del proyecto Caudal.
> Cada fase es independiente y debe completarse en orden. Cada fase usa su propia branch de Git y se deja lista para merge.

---

## Pre-requisitos

Antes de empezar, leer estos documentos para contexto completo:
- `docs/PROJECT_OVERVIEW.md` — Arquitectura y stack
- `docs/AI_RULES.md` — Convenciones y restricciones del proyecto
- `docs/API_REFERENCE.md` — Endpoints existentes
- `docs/DATABASE.md` — Schema y relaciones
- `docs/FILE_MAP.md` — Mapa de archivos
- `docs/GIT_HISTORY.md` — Workflow de Git

### Stack (NO cambiar):
- JavaScript (NO TypeScript)
- Next.js 16 App Router
- Tailwind CSS v4 (CSS-first, sin tailwind.config.js)
- Prisma 7 con @prisma/adapter-pg
- PostgreSQL local

### Cómo ejecutar:
```bash
npm run dev          # Dev server en localhost:3000
npx prisma studio    # UI visual de la DB
npx prisma migrate dev --name <nombre>  # Nueva migración
npx prisma generate  # Regenerar cliente
```

---

## Workflow de Git (OBLIGATORIO en cada fase)

El proyecto usa **feature branches con merge a main**. El otro modelo DEBE seguir este flujo exacto en cada fase:

### Al INICIO de cada fase:
```bash
# 1. Asegurarse de estar en main actualizado
git checkout main
git pull origin main

# 2. Crear la branch de feature (nombre indicado en cada fase)
git checkout -b feat/<nombre-de-la-fase>
```

### DURANTE cada fase — commits atómicos:
NO hacer un solo commit gigante por fase. Cada cambio lógico es un commit separado:

```bash
# Ejemplo para Fase 1:
git add src/lib/validate.js
git commit -m "feat: add input validation helpers"

git add src/lib/api-response.js
git commit -m "feat: add API response helpers"

git add src/app/api/payroll/route.js src/app/api/payroll/\[id\]/route.js
git commit -m "feat: add error handling and validation to payroll API"

git add src/app/api/fixed-expenses/ src/app/api/fixed-payments/
git commit -m "feat: add error handling and validation to fixed expenses API"

git add src/app/api/variable-expenses/
git commit -m "feat: add error handling and validation to variable expenses API"
```

### Al FINAL de cada fase:
```bash
# 1. Verificar que todo compila
npm run build
npm run lint

# 2. Push de la branch
git push -u origin feat/<nombre-de-la-fase>

# 3. Merge a main
git checkout main
git merge feat/<nombre-de-la-fase>
git push origin main
```

### Convención de commits:
- `feat: <descripción>` — Nueva funcionalidad
- `fix: <descripción>` — Corrección de bug
- `refactor: <descripción>` — Reestructuración sin cambio funcional
- `docs: <descripción>` — Solo cambios en documentación
- Siempre en **inglés**, en **presente imperativo** (`add`, no `added`)

### Reglas estrictas:
- **NUNCA commitear directo a main** — siempre crear branch primero
- **Un commit por cambio lógico** — no un solo commit gigante por fase
- **Verificar `npm run build` y `npm run lint`** antes de push
- Si una fase modifica el schema de Prisma, incluir la migración en el commit
- Si `npm run build` falla, arreglar antes de continuar a la siguiente fase

## Fase 1 — Error Handling y Validación (Branch: `feat/error-handling`)

### 1.1 Crear helper de validación: `src/lib/validate.js`

```javascript
/**
 * Validates and sanitizes input data against a schema.
 * Returns { valid: true, data: sanitizedData } or { valid: false, errors: [...] }
 */

export function validatePayroll(body) {
  const errors = []
  
  if (!body.date) errors.push('date is required')
  if (!body.week && body.week !== 0) errors.push('week is required')
  if (!body.amountReceived && body.amountReceived !== 0) errors.push('amountReceived is required')
  if (!body.isr && body.isr !== 0) errors.push('isr is required')

  const week = parseInt(body.week)
  if (isNaN(week) || week < 1 || week > 5) errors.push('week must be between 1 and 5')

  const amountReceived = parseFloat(body.amountReceived)
  if (isNaN(amountReceived) || amountReceived < 0) errors.push('amountReceived must be a positive number')

  const isr = parseFloat(body.isr)
  if (isNaN(isr) || isr < 0) errors.push('isr must be a positive number')

  const savingsFund = parseFloat(body.savingsFund || 0)
  if (isNaN(savingsFund) || savingsFund < 0) errors.push('savingsFund must be a positive number')

  const date = new Date(body.date + 'T12:00:00Z')
  if (isNaN(date.getTime())) errors.push('date is not a valid date')

  if (errors.length > 0) return { valid: false, errors }

  return {
    valid: true,
    data: {
      date,
      week,
      amountReceived,
      isr,
      savingsFund,
      notes: body.notes || null,
    }
  }
}

export function validateFixedExpense(body) {
  const errors = []

  if (!body.name || body.name.trim() === '') errors.push('name is required')
  
  const cost = parseFloat(body.cost)
  if (isNaN(cost) || cost <= 0) errors.push('cost must be a positive number')

  const dueDay = parseInt(body.dueDay)
  if (isNaN(dueDay) || dueDay < 1 || dueDay > 31) errors.push('dueDay must be between 1 and 31')

  if (errors.length > 0) return { valid: false, errors }

  return {
    valid: true,
    data: {
      name: body.name.trim(),
      cost,
      dueDay,
    }
  }
}

export function validateVariableExpense(body) {
  const errors = []

  if (!body.description || body.description.trim() === '') errors.push('description is required')
  if (!body.date) errors.push('date is required')

  const amount = parseFloat(body.amount)
  if (isNaN(amount) || amount <= 0) errors.push('amount must be a positive number')

  const date = new Date(body.date)
  if (isNaN(date.getTime())) errors.push('date is not a valid date')

  if (errors.length > 0) return { valid: false, errors }

  return {
    valid: true,
    data: {
      description: body.description.trim(),
      date,
      amount,
    }
  }
}

export function validateFixedPayment(body) {
  const errors = []

  const fixedExpenseId = parseInt(body.fixedExpenseId)
  if (isNaN(fixedExpenseId)) errors.push('fixedExpenseId is required')
  if (!body.date) errors.push('date is required')
  if (typeof body.paid !== 'boolean') errors.push('paid must be a boolean')

  const date = new Date(body.date)
  if (isNaN(date.getTime())) errors.push('date is not a valid date')

  if (errors.length > 0) return { valid: false, errors }

  return {
    valid: true,
    data: { fixedExpenseId, date, paid: body.paid }
  }
}
```

### 1.2 Crear helper de respuesta API: `src/lib/api-response.js`

```javascript
export function success(data, status = 200) {
  return Response.json(data, { status })
}

export function created(data) {
  return Response.json(data, { status: 201 })
}

export function badRequest(errors) {
  return Response.json({ error: 'Validation failed', errors }, { status: 400 })
}

export function notFound(message = 'Resource not found') {
  return Response.json({ error: message }, { status: 404 })
}

export function serverError(message = 'Internal server error') {
  console.error('[API Error]', message)
  return Response.json({ error: message }, { status: 500 })
}
```

### 1.3 Refactorizar TODAS las API routes

Aplicar el mismo patrón a cada archivo. Ejemplo para `src/app/api/payroll/route.js`:

```javascript
import prisma from "@/lib/prisma"
import { validatePayroll } from "@/lib/validate"
import { success, created, badRequest, serverError } from "@/lib/api-response"

export async function GET() {
  try {
    const payrolls = await prisma.payroll.findMany({
      orderBy: { date: 'desc' }
    })
    return success(payrolls)
  } catch (error) {
    return serverError(error.message)
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const validation = validatePayroll(body)
    if (!validation.valid) return badRequest(validation.errors)

    const payroll = await prisma.payroll.create({ data: validation.data })
    return created(payroll)
  } catch (error) {
    return serverError(error.message)
  }
}
```

Ejemplo para `src/app/api/payroll/[id]/route.js`:

```javascript
import prisma from "@/lib/prisma"
import { validatePayroll } from "@/lib/validate"
import { success, badRequest, notFound, serverError } from "@/lib/api-response"

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const parsedId = parseInt(id)
    if (isNaN(parsedId)) return badRequest(['Invalid ID'])

    const body = await request.json()
    const validation = validatePayroll(body)
    if (!validation.valid) return badRequest(validation.errors)

    const payroll = await prisma.payroll.update({
      where: { id: parsedId },
      data: validation.data,
    })
    return success(payroll)
  } catch (error) {
    if (error.code === 'P2025') return notFound('Payroll not found')
    return serverError(error.message)
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    const parsedId = parseInt(id)
    if (isNaN(parsedId)) return badRequest(['Invalid ID'])

    await prisma.payroll.delete({ where: { id: parsedId } })
    return success({ message: 'Deleted successfully' })
  } catch (error) {
    if (error.code === 'P2025') return notFound('Payroll not found')
    return serverError(error.message)
  }
}
```

**Repetir este patrón para los 7 archivos de API routes restantes:**
- `src/app/api/fixed-expenses/route.js` — usar `validateFixedExpense`
- `src/app/api/fixed-expenses/[id]/route.js` — usar `validateFixedExpense`, mantener cascade delete de payments
- `src/app/api/fixed-payments/route.js` — usar `validateFixedPayment`
- `src/app/api/variable-expenses/route.js` — usar `validateVariableExpense`
- `src/app/api/variable-expenses/[id]/route.js` — usar `validateVariableExpense`

### 1.4 Estandarizar manejo de fechas

**Todas** las fechas que vienen del frontend como `"2026-04-15"` (solo fecha, sin hora) deben convertirse de la misma forma para evitar que el timezone las corra un día:

```javascript
// SIEMPRE usar esto para convertir fechas de input date HTML:
new Date(body.date + 'T12:00:00Z')
```

Aplicar esto en `validateVariableExpense` y `validateFixedPayment` también (actualmente usan `new Date(body.date)` sin el hack de timezone).

---

## Fase 2 — Dashboard con Filtro por Mes (Branch: `feat/dashboard-filter`)

### 2.1 Modificar `src/app/api/payroll/route.js`

Agregar soporte para query params de filtrado:

```javascript
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') // formato: "2026-04"
    
    let where = {}
    if (month) {
      const [year, m] = month.split('-').map(Number)
      const start = new Date(year, m - 1, 1)
      const end = new Date(year, m, 1)
      where = { date: { gte: start, lt: end } }
    }

    const payrolls = await prisma.payroll.findMany({
      where,
      orderBy: { date: 'desc' },
    })
    return success(payrolls)
  } catch (error) {
    return serverError(error.message)
  }
}
```

### 2.2 Modificar `src/app/api/variable-expenses/route.js`

Mismo patrón de filtrado por query param `month`:

```javascript
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    
    let where = {}
    if (month) {
      const [year, m] = month.split('-').map(Number)
      const start = new Date(year, m - 1, 1)
      const end = new Date(year, m, 1)
      where = { date: { gte: start, lt: end } }
    }

    const expenses = await prisma.variableExpense.findMany({
      where,
      orderBy: { date: 'desc' },
    })
    return success(expenses)
  } catch (error) {
    return serverError(error.message)
  }
}
```

### 2.3 Reescribir `src/app/page.js` (Dashboard)

```javascript
'use client'

import { useState, useEffect } from "react"

export default function Home() {
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  )
  const [summary, setSummary] = useState({
    totalPayroll: 0,
    totalFixedExpenses: 0,
    totalVariableExpenses: 0,
    totalExpenses: 0,
    remaining: 0,
    loading: true,
  })

  useEffect(() => {
    const fetchSummary = async () => {
      setSummary(prev => ({ ...prev, loading: true }))

      const [payrollRes, fixedRes, variableRes] = await Promise.all([
        fetch(`/api/payroll?month=${selectedMonth}`),
        fetch('/api/fixed-expenses'),
        fetch(`/api/variable-expenses?month=${selectedMonth}`),
      ])

      const payrolls = await payrollRes.json()
      const fixedExpenses = await fixedRes.json()
      const variableExpenses = await variableRes.json()

      const totalPayroll = payrolls.reduce((acc, p) => acc + p.amountReceived, 0)
      
      // Para gastos fijos: contar solo los pagados en el mes seleccionado
      const [year, month] = selectedMonth.split('-').map(Number)
      const totalFixed = fixedExpenses.reduce((acc, e) => {
        const payment = e.payments?.find(p => {
          const d = new Date(p.date)
          return d.getMonth() === month - 1 && d.getFullYear() === year
        })
        return acc + (payment?.paid ? e.cost : 0)
      }, 0)
      
      const totalVariable = variableExpenses.reduce((acc, e) => acc + e.amount, 0)
      const totalExpenses = totalFixed + totalVariable

      setSummary({
        totalPayroll,
        totalFixedExpenses: totalFixed,
        totalVariableExpenses: totalVariable,
        totalExpenses,
        remaining: totalPayroll - totalExpenses,
        loading: false,
      })
    }

    fetchSummary()
  }, [selectedMonth])

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount)
  }

  const monthLabel = new Date(selectedMonth + '-15').toLocaleString('es-MX', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <main className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="border p-2 rounded"
        />
      </div>

      <p className="text-gray-500 mb-4 capitalize">{monthLabel}</p>

      {summary.loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-100 p-6 rounded-lg animate-pulse h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-green-100 p-6 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Total Nómina</p>
            <p className="text-3xl font-bold text-green-700">
              {formatMoney(summary.totalPayroll)}
            </p>
          </div>
          <div className="bg-red-100 p-6 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Total Gastos</p>
            <p className="text-3xl font-bold text-red-700">
              {formatMoney(summary.totalExpenses)}
            </p>
            <div className="text-xs text-gray-500 mt-1">
              Fijos: {formatMoney(summary.totalFixedExpenses)} · 
              Variables: {formatMoney(summary.totalVariableExpenses)}
            </div>
          </div>
          <div className={`p-6 rounded-lg ${summary.remaining >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
            <p className="text-sm text-gray-600 mb-2">Restante</p>
            <p className={`text-3xl font-bold ${summary.remaining >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
              {formatMoney(summary.remaining)}
            </p>
          </div>
        </div>
      )}
    </main>
  )
}
```

**Puntos clave:**
- Selector `<input type="month">` para filtrar por mes
- Default al mes actual
- Loading skeleton mientras carga
- Gastos fijos filtrados por pagos del mes seleccionado
- Restante se pone naranja si es negativo
- `Intl.NumberFormat` para formateo de moneda

---

## Fase 3 — Formateo de Moneda Global (Branch: `feat/currency-format`)

### 3.1 Crear helper: `src/lib/format.js`

```javascript
/**
 * Formats a number as Mexican Peso currency.
 * @param {number} amount
 * @returns {string} e.g. "$15,000.00"
 */
export function formatMoney(amount) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount)
}

/**
 * Formats a date string for display.
 * @param {string} dateStr - ISO date string
 * @returns {string} e.g. "15/04/2026"
 */
export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('es-MX')
}
```

### 3.2 Aplicar en todas las páginas

Reemplazar cada instancia de `` `$${value}` `` por `formatMoney(value)` en:
- `src/app/payroll/page.js` — columnas Amount, ISR, Savings Fund
- `src/app/fixed-expenses/page.js` — columnas Cost, Total Paid, Annual Total
- `src/app/variable-expenses/page.js` — columna Amount
- `src/app/page.js` — ya incluido en Fase 2

Import en cada archivo:
```javascript
import { formatMoney, formatDate } from "@/lib/format"
```

---

## Fase 4 — UX: Navbar Activa, Loading, Empty States, Toasts (Branch: `feat/ux-improvements`)

### 4.1 Navbar con ruta activa: reescribir `src/components/Navbar.js`

```javascript
'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/payroll', label: 'Payroll' },
  { href: '/fixed-expenses', label: 'Fixed Expenses' },
  { href: '/variable-expenses', label: 'Variable Expenses' },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="bg-blue-600 px-6 py-4 flex gap-6">
      {links.map(link => (
        <Link
          key={link.href}
          href={link.href}
          className={`text-white ${
            pathname === link.href ? 'font-bold underline underline-offset-4' : 'opacity-80 hover:opacity-100'
          }`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
}
```

**Nota:** Esto convierte Navbar de Server Component a Client Component (`'use client'`). Eso está bien — `usePathname` lo requiere.

### 4.2 Crear componente Toast: `src/components/Toast.js`

```javascript
'use client'

import { useState, useEffect } from "react"

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  }

  return (
    <div className={`fixed bottom-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in`}>
      {message}
    </div>
  )
}
```

### 4.3 Agregar animación de fade-in en `src/app/globals.css`

Agregar al final del archivo:

```css
@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}
```

### 4.4 Crear componente EmptyState: `src/components/EmptyState.js`

```javascript
export default function EmptyState({ message = "No data yet", action }) {
  return (
    <div className="text-center py-12 text-gray-400">
      <p className="text-lg">{message}</p>
      {action && <p className="text-sm mt-2">{action}</p>}
    </div>
  )
}
```

### 4.5 Crear componente LoadingTable: `src/components/LoadingTable.js`

```javascript
export default function LoadingTable({ columns = 4, rows = 5 }) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="bg-gray-100">
          {Array.from({ length: columns }).map((_, i) => (
            <th key={i} className="border p-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, row) => (
          <tr key={row}>
            {Array.from({ length: columns }).map((_, col) => (
              <td key={col} className="border p-2">
                <div className="h-4 bg-gray-100 rounded animate-pulse" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

### 4.6 Integrar Toast, EmptyState y LoadingTable en las 3 páginas

En cada página (`payroll`, `fixed-expenses`, `variable-expenses`):

1. Agregar estado `loading` y `toast`:
```javascript
const [loading, setLoading] = useState(true)
const [toast, setToast] = useState(null)
```

2. Modificar las funciones fetch para manejar loading:
```javascript
const fetchPayrolls = async () => {
  setLoading(true)
  const response = await fetch('/api/payroll')
  const data = await response.json()
  setPayrolls(data)
  setLoading(false)
}
```

3. Agregar toast después de acciones exitosas:
```javascript
const handleSubmit = async () => {
  // ... POST/PUT ...
  setToast({ message: 'Saved successfully', type: 'success' })
  fetchPayrolls()
}

const handleDelete = async (id) => {
  if (!confirm('Are you sure?')) return
  await fetch(`/api/payroll/${id}`, { method: 'DELETE' })
  setToast({ message: 'Deleted successfully', type: 'success' })
  fetchPayrolls()
}
```

4. Mostrar loading o empty state:
```javascript
{loading ? (
  <LoadingTable columns={7} rows={3} />
) : payrolls.length === 0 ? (
  <EmptyState message="No payrolls yet" action="Add your first payroll using the form above" />
) : (
  <table>...</table>
)}

{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
```

### 4.7 Manejar errores de fetch en el frontend

En cada función que hace fetch, agregar manejo de errores:
```javascript
const handleSubmit = async () => {
  try {
    const res = await fetch('/api/payroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ... })
    })
    if (!res.ok) {
      const err = await res.json()
      setToast({ message: err.errors?.join(', ') || 'Error saving', type: 'error' })
      return
    }
    setToast({ message: 'Saved successfully', type: 'success' })
    setForm({ ... }) // reset
    fetchPayrolls()
  } catch {
    setToast({ message: 'Network error', type: 'error' })
  }
}
```

---

## Fase 5 — Responsive Design (Branch: `feat/responsive`)

### 5.1 Dashboard (`src/app/page.js`)

Cambiar `grid-cols-3` a responsive:
```html
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
```
(Ya incluido en Fase 2)

### 5.2 Payroll (`src/app/payroll/page.js`)

Envolver la tabla en un contenedor scrollable:
```html
<div className="overflow-x-auto">
  <table className="w-full border-collapse min-w-[700px]">
    ...
  </table>
</div>
```

El form vertical ya es responsive. Solo verificar que funcione en pantallas pequeñas.

### 5.3 Fixed Expenses (`src/app/fixed-expenses/page.js`)

Esta es la tabla más crítica (16+ columnas). Opciones:

**Para la tabla de 12 meses:** Envolver en scroll horizontal:
```html
<div className="overflow-x-auto">
  <table className="w-full border-collapse min-w-[1000px] text-sm">
    ...
  </table>
</div>
```

**Para el form:** Cambiar a columna en mobile:
```html
<div className="flex flex-col sm:flex-row gap-3 flex-wrap">
```

### 5.4 Variable Expenses (`src/app/variable-expenses/page.js`)

Misma estrategia que payroll: overflow scroll en la tabla.

### 5.5 Navbar responsive

Agregar hamburger menu para mobile (opcional, puede dejarse como scroll horizontal):
```html
<nav className="bg-blue-600 px-6 py-4 flex gap-6 overflow-x-auto">
```

---

## Fase 6 — Navegación de Años en Gastos Fijos (Branch: `feat/fixed-expenses-year-nav`)

### 6.1 Modificar `src/app/fixed-expenses/page.js`

Cambiar `currentYear` de constante a estado con controles de navegación:

```javascript
const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

// En el JSX, agregar controles de navegación:
<div className="flex items-center gap-4 mb-6">
  <h1 className="text-2xl font-bold">Fixed Expenses</h1>
  <div className="flex items-center gap-2">
    <button
      onClick={() => setCurrentYear(y => y - 1)}
      className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
    >
      ←
    </button>
    <span className="text-lg font-semibold min-w-[4rem] text-center">
      {currentYear}
    </span>
    <button
      onClick={() => setCurrentYear(y => y + 1)}
      className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
    >
      →
    </button>
  </div>
</div>
```

---

## Fase 7 — Limpieza y README (Branch: `feat/cleanup`)

### 7.1 Crear `.env.example`

Crear archivo `.env.example` en la raíz:
```env
# PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/caudal?schema=public"
```

### 7.2 Reescribir `README.md`

Reemplazar el boilerplate de Next.js con un README real:

```markdown
# Caudal 💰

Personal finance tracker built with Next.js, PostgreSQL, and Prisma.

Track your payroll income, fixed monthly expenses, and variable spending in one place.

## Features

- 📊 **Dashboard** — Monthly summary of income vs. expenses
- 💵 **Payroll** — Track salary payments, ISR, savings fund
- 📋 **Fixed Expenses** — Monthly bills with annual payment matrix
- 🛒 **Variable Expenses** — One-off purchases and spending

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** PostgreSQL + Prisma ORM
- **Styling:** Tailwind CSS v4
- **Language:** JavaScript

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL running on localhost:5432

### Setup

1. Clone the repo:
   ```bash
   git clone https://github.com/roym25/caudal.git
   cd caudal
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create your `.env` from the example:
   ```bash
   cp .env.example .env
   # Edit .env with your PostgreSQL credentials
   ```

4. Setup the database:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. Start the dev server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Documentation

See the `docs/` folder for detailed documentation:

- `PROJECT_OVERVIEW.md` — Architecture and stack details
- `API_REFERENCE.md` — REST API endpoints
- `DATABASE.md` — Database schema and relations
- `AI_RULES.md` — Development conventions
- `GOALS.md` — Roadmap and future plans
```

### 7.3 Actualizar `.gitignore`

Agregar al final:
```
# graphify
graphify-out/
```

### 7.4 Limpiar branches mergeadas (hacer manualmente en terminal)

```bash
# Eliminar branches locales ya mergeadas
git branch --merged main | findstr /v "main" | ForEach-Object { git branch -d $_.Trim() }

# Limpiar referencias remotas
git remote prune origin
```

---

## Fase 8 — Dark Mode Funcional (Branch: `feat/dark-mode`)

### 8.1 Estrategia

El proyecto ya tiene variables CSS para dark mode en `globals.css`. El problema es que los componentes usan clases Tailwind hardcodeadas como `bg-blue-600`, `bg-gray-100`, `bg-green-100` que **no** responden al dark mode.

### 8.2 Modificar `src/app/globals.css`

Agregar variables CSS para todos los colores semánticos usados en la app:

```css
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #171717;
  --card-green: #dcfce7;
  --card-green-text: #15803d;
  --card-red: #fee2e2;
  --card-red-text: #b91c1c;
  --card-blue: #dbeafe;
  --card-blue-text: #1d4ed8;
  --card-orange: #ffedd5;
  --card-orange-text: #c2410c;
  --nav-bg: #2563eb;
  --table-header: #f3f4f6;
  --table-border: #e5e7eb;
  --input-border: #d1d5db;
  --btn-primary: #2563eb;
  --btn-danger: #ef4444;
  --btn-warning: #eab308;
  --btn-success: #22c55e;
  --text-muted: #6b7280;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
    --card-green: #14532d;
    --card-green-text: #86efac;
    --card-red: #450a0a;
    --card-red-text: #fca5a5;
    --card-blue: #1e3a5f;
    --card-blue-text: #93c5fd;
    --card-orange: #431407;
    --card-orange-text: #fdba74;
    --nav-bg: #1e3a5f;
    --table-header: #1f2937;
    --table-border: #374151;
    --input-border: #4b5563;
    --btn-primary: #3b82f6;
    --btn-danger: #f87171;
    --btn-warning: #facc15;
    --btn-success: #4ade80;
    --text-muted: #9ca3af;
  }
}
```

### 8.3 Reemplazar clases hardcodeadas

En todos los componentes, reemplazar las clases de Tailwind por las variables CSS usando estilos inline o clases custom. Ejemplo:

**Antes:**
```html
<div className="bg-green-100">
  <p className="text-green-700">...</p>
</div>
```

**Después:**
```html
<div style={{ background: 'var(--card-green)' }}>
  <p style={{ color: 'var(--card-green-text)' }}>...</p>
</div>
```

**O mejor, crear clases utilitarias en globals.css:**
```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card-green: var(--card-green);
  --color-card-green-text: var(--card-green-text);
  --color-card-red: var(--card-red);
  --color-card-red-text: var(--card-red-text);
  --color-card-blue: var(--card-blue);
  --color-card-blue-text: var(--card-blue-text);
  --color-nav-bg: var(--nav-bg);
  --color-table-header: var(--table-header);
  --color-table-border: var(--table-border);
  --color-text-muted: var(--text-muted);
}
```

Y luego usar: `bg-card-green text-card-green-text`, `bg-nav-bg`, `bg-table-header`, etc.

**Archivos a modificar:**
- `src/components/Navbar.js` — `bg-blue-600` → `bg-nav-bg`
- `src/app/page.js` — cards de dashboard
- `src/app/payroll/page.js` — `bg-gray-100` → `bg-table-header`, colores de botones
- `src/app/fixed-expenses/page.js` — header, botones toggle
- `src/app/variable-expenses/page.js` — header, botones
- `src/app/globals.css` — input borders

---

## Orden de Ejecución

| Fase | Branch | Prioridad | Dependencias |
|------|--------|-----------|--------------|
| 1 | `feat/error-handling` | 🔴 Crítica | Ninguna |
| 2 | `feat/dashboard-filter` | 🔴 Crítica | Fase 1 (usa api-response) |
| 3 | `feat/currency-format` | 🟡 Alta | Ninguna |
| 4 | `feat/ux-improvements` | 🟡 Alta | Fase 1 (manejo errores frontend) |
| 5 | `feat/responsive` | 🟡 Alta | Ninguna |
| 6 | `feat/fixed-year-nav` | 🟠 Media | Ninguna |
| 7 | `feat/cleanup` | 🟠 Media | Ninguna |
| 8 | `feat/dark-mode` | 🔵 Baja | Ninguna |

**Fases 3, 5, 6, 7 pueden hacerse en paralelo.** Fases 1→2 y 1→4 son secuenciales.

---

## Verificación Post-Implementación

Después de cada fase, verificar:

1. [ ] `npm run dev` inicia sin errores
2. [ ] `npm run build` compila exitosamente
3. [ ] `npm run lint` pasa sin errores
4. [ ] La funcionalidad anterior sigue funcionando (no hay regresiones)
5. [ ] Probar en el browser: crear, editar, eliminar registros
6. [ ] Verificar en Prisma Studio (`npx prisma studio`) que los datos se guardaron correctamente

### Tests manuales por fase:

**Fase 1:** Enviar datos inválidos a cada endpoint (strings vacíos, números negativos, IDs inexistentes) y verificar que retorna 400/404 con mensaje de error claro.

**Fase 2:** Cambiar el selector de mes y verificar que los totales cambian. Crear registros en meses distintos y confirmar el filtrado.

**Fase 3:** Verificar que todos los montos se muestran como `$15,000.00` en lugar de `$15000`.

**Fase 4:** Verificar que la Navbar marca la página activa. Probar con tablas vacías (empty state). Crear/editar/eliminar un registro y ver el toast.

**Fase 5:** Reducir el ancho del browser a 375px (iPhone) y verificar que todo es usable con scroll horizontal.

**Fase 6:** Navegar entre años en gastos fijos y verificar que los checkmarks de pagos cambian.

**Fase 7:** Clonar el repo en otra carpeta, seguir el README y verificar que funciona.

**Fase 8:** Activar dark mode en el OS y verificar que la app cambia de tema.

