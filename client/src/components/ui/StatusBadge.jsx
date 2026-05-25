function StatusBadge({ status = 'unknown', size = 'sm' }) {
  const normalizedStatus = String(status || 'unknown').toLowerCase()
  const label = normalizedStatus
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  const statusStyles = {
    active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    inactive: 'bg-slate-100 text-slate-700 ring-slate-200',
    pending: 'bg-amber-50 text-amber-700 ring-amber-200',
    accepted: 'bg-blue-50 text-blue-700 ring-blue-200',
    rejected: 'bg-rose-50 text-rose-700 ring-rose-200',
    in_progress: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
    completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    blocked: 'bg-rose-50 text-rose-700 ring-rose-200',
    cancelled: 'bg-slate-100 text-slate-700 ring-slate-200',
    verified: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    unverified: 'bg-amber-50 text-amber-700 ring-amber-200',
    unknown: 'bg-slate-100 text-slate-700 ring-slate-200',
  }

  const sizeStyles = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ring-1 ring-inset ${statusStyles[normalizedStatus] || statusStyles.unknown} ${sizeStyles[size] || sizeStyles.sm}`}
      role="status"
    >
      {label}
    </span>
  )
}

export default StatusBadge
