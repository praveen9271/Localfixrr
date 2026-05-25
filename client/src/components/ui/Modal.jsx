function Modal({ isOpen, title, children, onClose }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Dialog'}
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          {title && <h2 className="text-2xl font-black text-slate-900">{title}</h2>}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  )
}

export default Modal
