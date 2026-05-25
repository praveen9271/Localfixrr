import Button from './Button'

function EmptyState({ title, message, action, actionText }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center">
      <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-slate-100 ring-8 ring-slate-50" />
      <h3 className="mb-2 text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mx-auto mb-6 max-w-md text-slate-500">{message}</p>
      {action && (
        <Button onClick={action} variant="secondary">
          {actionText || 'Take Action'}
        </Button>
      )}
    </div>
  )
}

export default EmptyState
