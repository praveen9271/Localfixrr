export const formatCurrency = (value) =>
  `Rs. ${Number(value || 0).toLocaleString('en-IN')}`

export const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString() : '-'

export const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString() : '-'

export const formatStatus = (status = '') => String(status).replace('_', ' ')
