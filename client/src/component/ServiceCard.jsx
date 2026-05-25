import Icon from './Icon'

function ServiceCard({ icon, title, description, accent, iconColor = 'text-indigo-700', centered = true, onClick }) {
  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onClick?.()
        }
      }}
      className={`group flex min-h-[320px] flex-col justify-center rounded-[1.75rem] border border-slate-200 bg-white px-7 py-8 shadow-[0_22px_50px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-2 hover:scale-105 hover:border-indigo-100 hover:shadow-[0_30px_70px_rgba(79,70,229,0.16)] active:translate-y-1 active:scale-[0.99] ${
        centered ? 'text-center' : 'text-left'
      }`}
    >
      <div
        className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br ${accent} shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_12px_24px_rgba(15,23,42,0.08)] transition duration-300 group-hover:-translate-y-1 ${
          centered ? '' : 'mx-0'
        }`}
      >
        <Icon name={icon} className={`h-9 w-9 ${iconColor}`} />
      </div>
      <h3 className="mt-6 text-2xl font-bold leading-tight text-slate-950">{title}</h3>
      {description && (
        <p className="mt-4 text-sm leading-7 text-slate-600">{description}</p>
      )}
    </article>
  )
}

export default ServiceCard
