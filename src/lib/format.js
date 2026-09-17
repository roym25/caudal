/**
 * Formats a number as a currency string in MXN
 * @param {number} amount - The amount to format
 * @returns {string} The formatted currency string
 */
export function formatMoney(amount) {
  const num = typeof amount === "number" && !isNaN(amount) ? amount : 0
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Formats a date string or Date object into a readable date
 * @param {string|Date} date - The date to format
 * @returns {string} The formatted date string
 */
export function formatDate(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}
