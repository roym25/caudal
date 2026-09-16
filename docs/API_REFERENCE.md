# Caudal - Referencia de API

## Base URL

```
http://localhost:3000/api
```

Todas las API routes son **REST** implementadas con Next.js App Router Route Handlers.

---

## Payroll (Nómina)

### `GET /api/payroll`
Lista todas las nóminas.

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "date": "2026-04-15T12:00:00.000Z",
    "week": 2,
    "amountReceived": 15000.00,
    "isr": 2100.00,
    "savingsFund": 500.00,
    "notes": "Quincena normal",
    "createdAt": "2026-04-15T18:30:00.000Z"
  }
]
```

### `POST /api/payroll`
Crea una nueva nómina.

**Body:**
```json
{
  "date": "2026-04-15",
  "week": 2,
  "amountReceived": 15000.00,
  "isr": 2100.00,
  "savingsFund": 500.00,
  "notes": "Quincena normal"
}
```

**Response:** `200 OK` (el objeto creado)

**Notas:**
- `date` se convierte a `new Date(body.date + 'T12:00:00Z')` para evitar problemas de timezone
- `savingsFund` es opcional (default 0)
- `notes` es opcional (default null)

### `PUT /api/payroll/:id`
Actualiza una nómina existente.

**Body:** Mismo formato que POST

**Response:** `200 OK` (el objeto actualizado)

### `DELETE /api/payroll/:id`
Elimina una nómina.

**Response:** `200 OK`
```json
{ "message": "Deleted successfully" }
```

---

## Fixed Expenses (Gastos Fijos)

### `GET /api/fixed-expenses`
Lista todos los gastos fijos **con sus pagos incluidos**.

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "Renta",
    "cost": 8000.00,
    "dueDay": 5,
    "createdAt": "2026-04-01T00:00:00.000Z",
    "payments": [
      {
        "id": 1,
        "fixedExpenseId": 1,
        "date": "2026-04-01T00:00:00.000Z",
        "paid": true,
        "createdAt": "2026-04-05T10:00:00.000Z"
      }
    ]
  }
]
```

**Nota:** La query incluye `include: { payments: true }` para traer los pagos de cada gasto.

### `POST /api/fixed-expenses`
Crea un nuevo gasto fijo.

**Body:**
```json
{
  "name": "Internet",
  "cost": 599.00,
  "dueDay": 15
}
```

**Response:** `200 OK`

### `PUT /api/fixed-expenses/:id`
Actualiza un gasto fijo.

**Body:** Mismo formato que POST

**Response:** `200 OK`

### `DELETE /api/fixed-expenses/:id`
Elimina un gasto fijo **y todos sus pagos asociados**.

**Comportamiento:** Primero elimina todos los `FixedPayment` asociados (cascade manual), luego elimina el `FixedExpense`.

**Response:** `200 OK`
```json
{ "message": "Deleted successfully" }
```

---

## Fixed Payments (Pagos de Gastos Fijos)

### `POST /api/fixed-payments`
Toggle de pago mensual. Crea o actualiza un registro de pago.

**Body:**
```json
{
  "fixedExpenseId": 1,
  "date": "2026-04-01T00:00:00.000Z",
  "paid": true
}
```

**Comportamiento:**
1. Busca si ya existe un pago para ese `fixedExpenseId` + `date`
2. Si existe → actualiza el campo `paid`
3. Si no existe → crea nuevo registro

**Response:** `200 OK` (el objeto creado/actualizado)

**Nota:** La fecha siempre debe ser el primer día del mes para identificar el mes del pago.

---

## Variable Expenses (Gastos Variables)

### `GET /api/variable-expenses`
Lista todos los gastos variables.

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "description": "Cena con amigos",
    "date": "2026-04-10T00:00:00.000Z",
    "amount": 450.00,
    "createdAt": "2026-04-10T20:00:00.000Z"
  }
]
```

### `POST /api/variable-expenses`
Crea un nuevo gasto variable.

**Body:**
```json
{
  "description": "Uber al trabajo",
  "date": "2026-04-10",
  "amount": 85.50
}
```

**Response:** `200 OK`

### `PUT /api/variable-expenses/:id`
Actualiza un gasto variable.

**Body:** Mismo formato que POST

**Response:** `200 OK`

### `DELETE /api/variable-expenses/:id`
Elimina un gasto variable.

**Response:** `200 OK`
```json
{ "message": "Deleted successfully" }
```

---

## Consideraciones

### Manejo de Errores
⚠️ **Actualmente las API routes NO tienen try/catch.** Si Prisma lanza un error (ej. violación de constraint), la respuesta será un 500 genérico de Next.js.

### Fechas
- **Payroll**: Las fechas se guardan como `date + 'T12:00:00Z'` para evitar que el timezone las mueva al día anterior
- **Variable Expenses**: Las fechas se guardan como `new Date(body.date)` directamente
- **Fixed Payments**: La fecha es siempre el primer día del mes (`YYYY-MM-01T00:00:00Z`)

### Autenticación
⚠️ **No hay autenticación.** Todas las rutas son públicas. Esto es aceptable para uso personal local.
