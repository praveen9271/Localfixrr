import { MessageCircle, Phone } from 'lucide-react'

const normalizeIndianPhone = (value) => String(value || '').replace(/\D/g, '').slice(-10)

function WhatsAppIcon({ className = 'h-5 w-5' }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.05 1.02-1.05 2.5s1.07 2.9 1.22 3.1c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.19 1.87.12.57-.08 1.76-.72 2-1.41.25-.69.25-1.28.18-1.41-.08-.13-.28-.2-.58-.35M12.04 2a10 10 0 0 0-8.58 15.15L2 22l4.98-1.31A10 10 0 1 0 12.04 2m0 1.69a8.31 8.31 0 1 1-.01 16.62 8.3 8.3 0 0 1-4.23-1.16l-.3-.18-2.95.77.79-2.87-.2-.31a8.31 8.31 0 0 1 6.9-12.87" />
    </svg>
  )
}

function DisabledContactButton({ children }) {
  return (
    <button
      type="button"
      disabled
      className="inline-flex h-10 min-w-0 cursor-not-allowed items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs font-bold text-slate-400 sm:gap-2 sm:px-3 sm:text-sm"
    >
      {children}
    </button>
  )
}

function ProviderContactActions({ phone, className = '', buttonClassName = '', compact = false, iconOnly = false }) {
  const digits = normalizeIndianPhone(phone)
  const iconClass = 'h-5 w-5 shrink-0'
  const baseClass = `inline-flex h-10 min-w-0 items-center justify-center rounded-lg border text-xs font-bold transition sm:text-sm ${
    iconOnly ? 'px-2' : 'gap-1.5 px-2 sm:gap-2 sm:px-3'
  } ${buttonClassName}`
  const labelClass = iconOnly ? 'sr-only' : compact ? 'truncate' : ''

  if (!digits) {
    return (
      <div className={`grid grid-cols-3 gap-2 ${className}`} onClick={(event) => event.stopPropagation()}>
        <DisabledContactButton><Phone className={iconClass} /><span className={labelClass}>Call</span></DisabledContactButton>
        <DisabledContactButton><WhatsAppIcon className="h-6 w-6 shrink-0" /><span className={labelClass}>WhatsApp</span></DisabledContactButton>
        <DisabledContactButton><MessageCircle className={iconClass} /><span className={labelClass}>Message</span></DisabledContactButton>
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-3 gap-2 ${className}`} onClick={(event) => event.stopPropagation()}>
      <a href={`tel:+91${digits}`} className={`${baseClass} border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100`} aria-label="Call provider" title="Call provider">
        <Phone className={iconClass} />
        <span className={labelClass}>Call</span>
      </a>
      <a
        href={`https://wa.me/91${digits}`}
        target="_blank"
        rel="noreferrer"
        className={`${baseClass} border-green-200 bg-green-50 text-green-700 hover:bg-green-100`}
        aria-label="WhatsApp provider"
        title="WhatsApp provider"
      >
        <WhatsAppIcon className="h-6 w-6 shrink-0" />
        <span className={labelClass}>WhatsApp</span>
      </a>
      <a href={`sms:+91${digits}`} className={`${baseClass} border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100`} aria-label="Message provider" title="Message provider">
        <MessageCircle className={iconClass} />
        <span className={labelClass}>Message</span>
      </a>
    </div>
  )
}

export default ProviderContactActions
