import { MessageCircle, Phone } from 'lucide-react'

const normalizeIndianPhone = (value) => String(value || '').replace(/\D/g, '').slice(-10)

function WhatsAppIcon({ className = 'h-4 w-4' }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12.04 3.5a8.45 8.45 0 0 0-7.23 12.82L3.5 20.5l4.29-1.26a8.47 8.47 0 1 0 4.25-15.74Zm0 1.7a6.77 6.77 0 1 1 0 13.54 6.67 6.67 0 0 1-3.49-.98l-.33-.2-2.19.64.66-2.1-.22-.35A6.75 6.75 0 0 1 12.04 5.2Zm-2.3 3.33c-.16 0-.42.06-.65.32-.22.25-.86.84-.86 2.04 0 1.21.88 2.37 1 2.54.13.17 1.73 2.65 4.2 3.71 2.08.9 2.5.72 2.95.68.45-.04 1.46-.6 1.66-1.17.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.29-.25-.12-1.46-.72-1.69-.8-.23-.09-.39-.13-.56.12-.16.25-.64.8-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.48-1.38-1.73-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.43-.06-.13-.56-1.36-.77-1.86-.2-.49-.4-.42-.56-.43h-.46Z" />
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

function ProviderContactActions({ phone, className = '', buttonClassName = '', compact = false }) {
  const digits = normalizeIndianPhone(phone)
  const baseClass = `inline-flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-lg border px-2 text-xs font-bold transition sm:gap-2 sm:px-3 sm:text-sm ${buttonClassName}`
  const labelClass = compact ? 'truncate' : ''

  if (!digits) {
    return (
      <div className={`grid grid-cols-3 gap-2 ${className}`}>
        <DisabledContactButton><Phone className="h-4 w-4" /><span className={labelClass}>Call</span></DisabledContactButton>
        <DisabledContactButton><WhatsAppIcon /><span className={labelClass}>WhatsApp</span></DisabledContactButton>
        <DisabledContactButton><MessageCircle className="h-4 w-4" /><span className={labelClass}>Message</span></DisabledContactButton>
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-3 gap-2 ${className}`}>
      <a href={`tel:+91${digits}`} className={`${baseClass} border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}>
        <Phone className="h-4 w-4" />
        <span className={labelClass}>Call</span>
      </a>
      <a
        href={`https://wa.me/91${digits}`}
        target="_blank"
        rel="noreferrer"
        className={`${baseClass} border-green-200 bg-green-50 text-green-700 hover:bg-green-100`}
      >
        <WhatsAppIcon />
        <span className={labelClass}>WhatsApp</span>
      </a>
      <a href={`sms:+91${digits}`} className={`${baseClass} border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100`}>
        <MessageCircle className="h-4 w-4" />
        <span className={labelClass}>Message</span>
      </a>
    </div>
  )
}

export default ProviderContactActions
