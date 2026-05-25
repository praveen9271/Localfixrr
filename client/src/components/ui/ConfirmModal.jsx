import Button from './Button'

function ConfirmModal({ isOpen, title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onClose, variant = 'danger' }) {
  if (!isOpen) return null

  const handleConfirm = async () => {
    await onConfirm()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 px-4 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-black text-slate-900">{title}</h2>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>{cancelText}</Button>
          <Button variant={variant} onClick={handleConfirm}>{confirmText}</Button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
