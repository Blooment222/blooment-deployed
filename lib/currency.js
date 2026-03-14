/**
 * Utilidades para formateo de moneda en Pesos Mexicanos
 */

/**
 * Formatea un número como moneda mexicana (MXN)
 * @param {number} amount - La cantidad a formatear
 * @param {boolean} includeSymbol - Si incluir el símbolo MXN (default: true)
 * @returns {string} - Cantidad formateada
 * 
 * Ejemplos:
 * formatCurrency(1250) => "MXN $1,250.00"
 * formatCurrency(1250, false) => "$1,250.00"
 */
export function formatCurrency(amount, includeSymbol = true) {
  const formatted = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)

  // Intl.NumberFormat retorna "$1,250.00"
  // Si queremos el prefijo MXN, lo agregamos
  if (includeSymbol) {
    return `MXN ${formatted}`
  }
  
  return formatted
}

/**
 * Formatea un número simple con separadores de miles
 * @param {number} amount - La cantidad a formatear
 * @returns {string} - Cantidad formateada sin símbolo de moneda
 * 
 * Ejemplo:
 * formatNumber(1250.50) => "1,250.50"
 */
export function formatNumber(amount) {
  return new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

/**
 * Constantes de moneda
 */
export const CURRENCY = {
  CODE: 'MXN',
  SYMBOL: '$',
  NAME: 'Peso Mexicano',
  LOCALE: 'es-MX'
}
