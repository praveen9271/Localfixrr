export const formatCurrency = (value) =>
  `Rs. ${Number(value || 0).toLocaleString('en-IN')}`

export const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString() : '-'

export const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString() : '-'

export const getLocalDateTimeInputValue = (date = new Date()) => {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return localDate.toISOString().slice(0, 16)
}

export const formatStatus = (status = '') =>
  String(status)
    .replace(/_/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
