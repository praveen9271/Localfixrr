function Toast({ message, variant = 'success' }) {
  if (!message) return null

  const variantStyles = {
    success: 'bg-emerald-600',
    error: 'bg-rose-600',
    warning: 'bg-amber-600',
    info: 'bg-blue-600',
  }

  const labels = {
    success: 'OK',
    error: 'X',
    warning: '!',
    info: 'i',
  }

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 max-w-sm rounded-xl px-5 py-3 text-white shadow-xl transition ${variantStyles[variant] || variantStyles.info}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/20 text-xs font-black">
          {labels[variant] || labels.info}
        </span>
        <span className="text-sm font-semibold">{message}</span>
      </div>
    </div>
  )
}

export default Toast
