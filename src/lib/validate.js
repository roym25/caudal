/**
 * Validates and sanitizes input data against schema constraints.
 * Returns { valid: true, data: sanitizedData } or { valid: false, errors: [...] }
 */

function parseDate(dateStr) {
  if (!dateStr) return null
  const str = String(dateStr)
  const formatted = str.includes('T') ? str : `${str}T12:00:00Z`
  const d = new Date(formatted)
  return isNaN(d.getTime()) ? null : d
}

export function validatePayroll(body) {
  const errors = []

  if (!body.date) errors.push('date is required')
  if (body.week === undefined || body.week === null || body.week === '') {
    errors.push('week is required')
  }
  if (body.amountReceived === undefined || body.amountReceived === null || body.amountReceived === '') {
    errors.push('amountReceived is required')
  }
  if (body.isr === undefined || body.isr === null || body.isr === '') {
    errors.push('isr is required')
  }

  const week = parseInt(body.week, 10)
  if (isNaN(week) || week < 1 || week > 5) {
    errors.push('week must be an integer between 1 and 5')
  }

  const amountReceived = parseFloat(body.amountReceived)
  if (isNaN(amountReceived) || amountReceived < 0) {
    errors.push('amountReceived must be a non-negative number')
  }

  const isr = parseFloat(body.isr)
  if (isNaN(isr) || isr < 0) {
    errors.push('isr must be a non-negative number')
  }

  const savingsFund = parseFloat(body.savingsFund || 0)
  if (isNaN(savingsFund) || savingsFund < 0) {
    errors.push('savingsFund must be a non-negative number')
  }

  const employerMatch = parseFloat(body.employerMatch || 0)
  if (isNaN(employerMatch) || employerMatch < 0) {
    errors.push('employerMatch must be a non-negative number')
  }

  const date = parseDate(body.date)
  if (!date) {
    errors.push('date is not a valid date')
  }

  if (errors.length > 0) return { valid: false, errors }

  return {
    valid: true,
    data: {
      date,
      week,
      amountReceived,
      isr,
      savingsFund,
      employerMatch,
      notes: body.notes ? String(body.notes).trim() : null,
    },
  }
}

export function validateFixedExpense(body) {
  const errors = []

  if (!body.name || String(body.name).trim() === '') {
    errors.push('name is required')
  }

  const cost = parseFloat(body.cost)
  if (isNaN(cost) || cost <= 0) {
    errors.push('cost must be a positive number')
  }

  const dueDay = parseInt(body.dueDay, 10)
  if (isNaN(dueDay) || dueDay < 1 || dueDay > 31) {
    errors.push('dueDay must be an integer between 1 and 31')
  }

  if (errors.length > 0) return { valid: false, errors }

  return {
    valid: true,
    data: {
      name: String(body.name).trim(),
      cost,
      dueDay,
    },
  }
}

export function validateVariableExpense(body) {
  const errors = []

  if (!body.description || String(body.description).trim() === '') {
    errors.push('description is required')
  }
  if (!body.date) {
    errors.push('date is required')
  }

  const amount = parseFloat(body.amount)
  if (isNaN(amount) || amount <= 0) {
    errors.push('amount must be a positive number')
  }

  const date = parseDate(body.date)
  if (!date) {
    errors.push('date is not a valid date')
  }

  if (errors.length > 0) return { valid: false, errors }

  return {
    valid: true,
    data: {
      description: String(body.description).trim(),
      date,
      amount,
    },
  }
}

export function validateFixedPayment(body) {
  const errors = []

  const fixedExpenseId = parseInt(body.fixedExpenseId, 10)
  if (isNaN(fixedExpenseId)) {
    errors.push('fixedExpenseId is required and must be an integer')
  }
  if (!body.date) {
    errors.push('date is required')
  }
  if (typeof body.paid !== 'boolean') {
    errors.push('paid must be a boolean')
  }

  const date = parseDate(body.date)
  if (!date) {
    errors.push('date is not a valid date')
  }

  if (errors.length > 0) return { valid: false, errors }

  return {
    valid: true,
    data: {
      fixedExpenseId,
      date,
      paid: body.paid,
    },
  }
}

