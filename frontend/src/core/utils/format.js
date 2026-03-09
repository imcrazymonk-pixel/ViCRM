/**
 * Утилиты форматирования для ViCRM
 */

/**
 * Форматирование денежной суммы
 * @param {number} amount - Сумма
 * @param {string} currency - Валюта (по умолчанию RUB)
 * @returns {string} Отформатированная строка
 */
export const formatMoney = (amount, currency = 'RUB') => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: currency || 'RUB',
    minimumFractionDigits: 2
  }).format(amount)
}

/**
 * Форматирование даты
 * @param {string} dateStr - ISO строка даты
 * @returns {string} Отформатированная дата
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

/**
 * Форматирование даты и времени
 * @param {string} dateStr - ISO строка даты
 * @returns {string} Отформатированные дата и время
 */
export const formatDateTime = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Форматирование размера файла
 * @param {number} bytes - Размер в байтах
 * @returns {string} Отформатированный размер
 */
export const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}
