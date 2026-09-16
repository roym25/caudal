/**
 * Formats a number as Mexican Peso currency.
 * @param {number} amount
 * @returns {string} e.g. "$15,000.00"
 */
export function formatMoney(amount) {
  const num = typeof amount === "number" && !isNaN(amount) ? amount : 0
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(num)
}

/**
 * Formats a date string for display.
 * @param {string|Date} dateStr - ISO date string or Date object
 * @returns {string} e.g. "15/04/2026"
 */
export function formatDate(dateStr) {
  if (!dateStr) return ""
  return new Date(dateStr).toLocaleDateString("es-MX")
}

