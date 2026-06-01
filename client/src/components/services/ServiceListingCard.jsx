import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  Brush,
  ExternalLink,
  Flag,
  Hammer,
  Home,
  MessageCircle,
  MoreVertical,
  Share2,
  Snowflake,
  Sparkles,
  Star,
  Wrench,
  Zap,
} from 'lucide-react'
import StatusBadge from '../ui/StatusBadge'
import { formatCurrency } from '../../utils/formatters'
import ProviderContactActions from './ProviderContactActions'

const categoryIcons = [
  { match: ['electrical', 'electrician'], icon: Zap, color: 'bg-amber-50 text-amber-600 ring-amber-100' },
  { match: ['carpentry', 'carpenter'], icon: Hammer, color: 'bg-orange-50 text-orange-600 ring-orange-100' },
  { match: ['painting', 'painter'], icon: Brush, color: 'bg-fuchsia-50 text-fuchsia-600 ring-fuchsia-100' },
  { match: ['cleaning'], icon: Sparkles, color: 'bg-emerald-50 text-emerald-600 ring-emerald-100' },
  { match: ['appliance', 'ac', 'hvac'], icon: Snowflake, color: 'bg-sky-50 text-sky-600 ring-sky-100' },
  { match: ['maintenance'], icon: Home, color: 'bg-teal-50 text-teal-600 ring-teal-100' },
]

const getProviderName = (service) =>
  service?.provider?.businessName || service?.provider?.user?.name || 'Verified provider'

const getProviderPerson = (service) =>
  service?.provider?.user?.name || 'LocalFixr professional'

const getCategoryIcon = (category) => {
  const value = String(category || '').toLowerCase()
  return categoryIcons.find((item) => item.match.some((match) => value.includes(match))) || {
    icon: Wrench,
    color: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
  }
}

function ServiceListingCard({
  service,
  onBook,
  onDetails,
  onContact,
  onMenuAction,
  contactVisible = false,
  phone = '',
  primaryLabel = 'Book now',
  compact = false,
  showMenuDetails = false,
  showActionsMenu = true,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const category = service?.category || 'Service'
  const providerName = getProviderName(service)
  const providerInitial = providerName.charAt(0).toUpperCase()
  const providerPerson = getProviderPerson(service)
  const { icon: ServiceIcon, color } = getCategoryIcon(category)

  useEffect(() => {
    if (!menuOpen) return undefined

    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [menuOpen])

  const handleMenuAction = (action) => {
    setMenuOpen(false)
    if (action === 'contact') {
      onContact?.(service)
      return
    }
    onMenuAction?.(action, service)
  }

  return (
    <article className={`group flex h-full cursor-pointer flex-col rounded-xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_22px_55px_rgba(79,70,229,0.14)] ${compact ? 'min-h-[320px] p-4' : 'min-h-[430px] p-5'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <span className={`grid shrink-0 place-items-center rounded-xl ring-1 ${compact ? 'h-11 w-11' : 'h-12 w-12'} ${color}`}>
            <ServiceIcon className={compact ? 'h-5 w-5' : 'h-6 w-6'} />
          </span>
          <div className="min-w-0">
            <h2 className={`${compact ? 'text-base leading-6' : 'text-lg leading-6'} line-clamp-2 font-black text-slate-900`}>{service?.title || 'Service'}</h2>
            <p className="mt-1 text-sm font-semibold text-indigo-600">{category}</p>
          </div>
        </div>

        {showActionsMenu && (
          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((current) => !current)}
              className="grid h-10 w-10 cursor-pointer place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
              aria-label="Open service actions"
              aria-expanded={menuOpen}
            >
              <MoreVertical className="h-5 w-5" />
            </button>
            {menuOpen && (
              <div className={`absolute right-0 top-12 z-30 rounded-xl border border-slate-200 bg-white p-2 shadow-[0_20px_50px_rgba(15,23,42,0.18)] ${compact ? 'max-h-72 w-64 overflow-y-auto' : 'w-72'}`}>
                {showMenuDetails && (
                  <div className={`mb-2 overflow-y-auto rounded-lg bg-slate-50 p-3 text-sm ${compact ? 'max-h-36' : 'max-h-56'}`}>
                    <p className="font-black text-slate-900">{service?.title || 'Service'}</p>
                    <p className="mt-1 font-semibold text-indigo-600">{category}</p>
                    <p className="mt-3 leading-6 text-slate-600">
                      {service?.description || 'No service description available.'}
                    </p>
                    <div className="mt-3 space-y-1 text-xs font-semibold text-slate-500">
                      <p>Provider: <span className="text-slate-800">{providerName}</span></p>
                      <p>Location: <span className="text-slate-800">{service?.location || service?.provider?.user?.address || 'Service area available on request'}</span></p>
                      <p>Price: <span className="text-slate-800">{formatCurrency(service?.price || 0)}</span></p>
                    </div>
                  </div>
                )}
                {[
                  ['share', Share2, 'Share'],
                  ['report', Flag, 'Report'],
                  ['contact', MessageCircle, 'Contact Provider'],
                ].map(([action, Icon, label]) => (
                  <button
                    key={action}
                    type="button"
                    onClick={() => handleMenuAction(action)}
                    className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-indigo-700"
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <p className={`${compact ? 'mt-4 line-clamp-3 min-h-[4.5rem]' : 'mt-4 line-clamp-3 min-h-[4.5rem]'} text-sm leading-6 text-slate-600`}>
        {service?.description || 'Professional local service with transparent pricing and reliable support.'}
      </p>

      {!compact && (
      <div className="mt-5 rounded-xl bg-gradient-to-br from-indigo-50 to-sky-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-500">Service Provider</p>
        <div className="mt-3 flex items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-sm font-black text-indigo-600 shadow-sm">
            {providerInitial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-black text-slate-900">{providerName}</p>
            <p className="truncate text-sm text-slate-500">{providerPerson}</p>
          </div>
          <StatusBadge status={service?.provider?.available === false ? 'inactive' : 'active'} />
        </div>
      </div>
      )}

      {compact && (
        <p className="mt-4 line-clamp-1 text-sm text-slate-500">
          Provider: <span className="font-semibold text-slate-800">{providerName}</span>
        </p>
      )}

      {!compact && (
      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-slate-500">Price</p>
          <p className="mt-1 font-black text-slate-900">{formatCurrency(service?.price || 0)}</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-slate-500">Rating</p>
          <p className="mt-1 inline-flex items-center gap-1 font-black text-slate-900">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            {Number(service?.rating || 0).toFixed(1)}
          </p>
        </div>
      </div>
      )}

      {!compact && (
      <p className="mt-3 line-clamp-1 text-sm text-slate-500">
        {service?.location || service?.provider?.user?.address || 'Service area available on request'}
      </p>
      )}

      {contactVisible && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">Provider phone</p>
          {phone ? (
            <a href={`tel:+91${phone}`} className="mt-1 inline-flex items-center gap-2 text-lg font-black text-emerald-800">
              +91 {phone}
            </a>
          ) : (
            <p className="mt-1 text-sm font-semibold text-emerald-800">Phone number not available</p>
          )}
        </div>
      )}

      {!compact && <ProviderContactActions phone={phone} className="mt-4" compact />}

      <div className={`${compact ? 'mt-auto grid-cols-1 pt-4' : 'mt-auto grid-cols-2 pt-5'} grid gap-3`}>
        <button
          type="button"
          onClick={() => onDetails?.(service)}
          className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-indigo-200 px-4 text-sm font-bold text-indigo-700 transition hover:bg-indigo-50"
        >
          View Details
          <ExternalLink className="h-4 w-4" />
        </button>
        {!compact && (
          <button
          type="button"
          onClick={() => onBook?.(service)}
          className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-bold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700"
        >
          {primaryLabel}
          <ArrowRight className="h-4 w-4" />
        </button>
        )}
      </div>
    </article>
  )
}

export default ServiceListingCard
