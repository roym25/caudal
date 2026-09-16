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

