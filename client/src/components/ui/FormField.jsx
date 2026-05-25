function FormField({ label, as = 'input', className = '', children, ...props }) {
  const Control = as

  return (
    <label className={`block text-sm font-semibold text-slate-700 ${className}`}>
      {label}
      {children || (
        <Control
          className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-400"
          {...props}
        />
      )}
    </label>
  )
}

export default FormField
