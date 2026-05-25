function Alert({ children, tone = 'error' }) {
  const styles = {
    error: 'border-rose-200 bg-rose-50 text-rose-700',
    info: 'border-blue-200 bg-blue-50 text-blue-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  }

  if (!children) return null

  return (
    <div className={`rounded-lg border p-4 text-sm font-semibold ${styles[tone] || styles.info}`}>
      {children}
    </div>
  )
}

export default Alert
