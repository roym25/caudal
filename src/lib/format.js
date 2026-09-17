/**
 * Formats a number as currency string.
 * @param {number} amount
 * @returns {string} e.g. "$15,000.00"
 */
export function formatMoney(amount) {
  const num = typeof amount === "number" && !isNaN(amount) ? amount : 0
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num)
}

/**
 * Formats a date string for display in English.
 * @param {string|Date} dateStr - ISO date string or Date object
 * @returns {string} e.g. "04/15/2026"
 */
export function formatDate(dateStr) {
  if (!dateStr) return ""
  return new Date(dateStr).toLocaleDateString("en-US")
}
