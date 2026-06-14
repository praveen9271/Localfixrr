import { memo, useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  Brush,
  CheckCircle2,
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
import { formatCurrency } from '../../utils/formatters'
import ProviderContactActions from './ProviderContactActions'
import { getServiceItems, getStartingPrice } from '../../utils/serviceItems'

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

const getCategoryIcon = (category) => {
  const value = String(category || '').toLowerCase()
  return categoryIcons.find((item) => item.match.some((match) => value.includes(match))) || {
    icon: Wrench,
    color: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
  }
}

const normalizeCardText = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

function ServiceListingCard({
  service,
  onBook,
  onDetails,
  onContact,
  onMenuAction,
  contactVisible = false,
  phone = '',
  primaryLabel = 'Book now',
  showMenuDetails = false,
  bookingDisabled = false,
  bookingLoading = false,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const category = service?.category || 'Service'
  const providerName = getProviderName(service)
  const { icon: ServiceIcon, color } = getCategoryIcon(category)
  const serviceItems = getServiceItems(service)
  const startingPrice = getStartingPrice(service)
  const titleMatchesProvider = normalizeCardText(service?.title) === normalizeCardText(providerName)
  const cardTitle = titleMatchesProvider ? providerName : service?.title || providerName || 'Service'
  const cardSubtitle = titleMatchesProvider ? `${category} Specialist` : category
  const isAvailable = service?.provider?.available !== false

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

  const handleMenuAction = (action, event) => {
    event?.stopPropagation()
    setMenuOpen(false)
    if (action === 'contact') {
      onContact?.(service)
      return
    }
    onMenuAction?.(action, service)
  }

  return (
    <article
      onClick={() => onDetails?.(service)}
      className="group flex h-full min-h-[520px] cursor-pointer flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_22px_55px_rgba(79,70,229,0.14)]"
    >
      <div className="flex h-14 items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 gap-3">
          <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ring-1 ${color}`}>
            <ServiceIcon className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-black leading-6 text-slate-900" title={cardTitle}>{cardTitle}</h2>
            <div className="mt-1 flex min-w-0 items-center gap-2">
              <p className="min-w-0 truncate text-sm font-semibold text-indigo-600" title={cardSubtitle}>{cardSubtitle}</p>
              <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black ring-1 ${isAvailable ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-rose-50 text-rose-700 ring-rose-200'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${isAvailable ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                {isAvailable ? 'Active' : 'Busy'}
              </span>
            </div>
          </div>
        </div>

        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              setMenuOpen((current) => !current)
            }}
            className="grid h-10 w-10 cursor-pointer place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
            aria-label="Open service actions"
            aria-expanded={menuOpen}
          >
            <MoreVertical className="h-5 w-5" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-12 z-30 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-[0_20px_50px_rgba(15,23,42,0.18)]" onClick={(event) => event.stopPropagation()}>
              {showMenuDetails && (
                <div className="mb-2 max-h-56 overflow-y-auto rounded-lg bg-slate-50 p-3 text-sm">
                  <p className="font-black text-slate-900">{cardTitle}</p>
                  <p className="mt-1 font-semibold text-indigo-600">{category}</p>
                  <p className="mt-3 leading-6 text-slate-600">
                    {service?.description || 'No service description available.'}
                  </p>
                  <div className="mt-3 space-y-1 text-xs font-semibold text-slate-500">
                    <p>Provider: <span className="text-slate-800">{providerName}</span></p>
                    <p>Location: <span className="text-slate-800">{service?.location || service?.provider?.user?.address || 'Service area available on request'}</span></p>
                    <p>Starting price: <span className="text-slate-800">{formatCurrency(startingPrice)}</span></p>
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
                  onClick={(event) => handleMenuAction(action, event)}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-indigo-700"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="mt-4 h-12 line-clamp-2 text-sm leading-6 text-slate-600">
        {service?.description || 'Professional local service with transparent pricing and reliable support.'}
      </p>

      <div className="mt-4 h-[130px] rounded-xl border border-slate-100 bg-slate-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Included Services</p>
          <span className="shrink-0 whitespace-nowrap rounded-full bg-white px-2.5 py-1 text-xs font-black text-indigo-700 ring-1 ring-indigo-100">
            From {formatCurrency(startingPrice)}
          </span>
        </div>
        <div className="mt-3 space-y-2">
          {serviceItems.slice(0, 3).map((item) => (
            <div key={`${service?._id}-${item.name}`} className="flex items-center justify-between gap-3 text-sm">
              <span className="inline-flex min-w-0 items-center gap-2 font-semibold text-slate-700">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                <span className="truncate">{item.name}</span>
              </span>
              <span className="shrink-0 whitespace-nowrap font-black text-slate-900">{formatCurrency(item.price)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="h-16 rounded-lg bg-slate-50 p-3">
          <p className="text-slate-500">Starting Price</p>
          <p className="mt-1 font-black text-slate-900">{formatCurrency(startingPrice)}</p>
        </div>
        <div className="h-16 rounded-lg bg-slate-50 p-3">
          <p className="text-slate-500">Rating</p>
          <p className="mt-1 inline-flex items-center gap-1 font-black text-slate-900">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            {Number(service?.rating || 0).toFixed(1)}
          </p>
        </div>
      </div>

      <p className="mt-3 h-5 truncate text-sm text-slate-500" title={service?.location || service?.provider?.user?.address || 'Service area available on request'}>
        {service?.location || service?.provider?.user?.address || 'Service area available on request'}
      </p>

      {contactVisible && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">Provider phone</p>
          {phone ? (
            <a href={`tel:+91${phone}`} onClick={(event) => event.stopPropagation()} className="mt-1 inline-flex items-center gap-2 text-lg font-black text-emerald-800">
              +91 {phone}
            </a>
          ) : (
            <p className="mt-1 text-sm font-semibold text-emerald-800">Phone number not available</p>
          )}
        </div>
      )}

      <ProviderContactActions phone={phone} className="mt-3" compact iconOnly />

      <div className="mt-auto grid grid-cols-2 gap-3 pt-4">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onDetails?.(service)
          }}
          className="inline-flex h-11 min-w-0 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-indigo-200 px-3 text-sm font-bold text-indigo-700 transition hover:bg-indigo-50"
        >
          View Details
          <ExternalLink className="h-4 w-4 shrink-0" />
        </button>
        <button
          type="button"
          disabled={bookingDisabled}
          onClick={(event) => {
            event.stopPropagation()
            onBook?.(service)
          }}
          className="inline-flex h-11 min-w-0 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-indigo-600 px-3 text-sm font-bold text-white shadow-sm shadow-indigo-600/20 transition duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-indigo-600/30 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
        >
          {bookingLoading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
          {bookingLoading ? 'Booking...' : primaryLabel}
          {!bookingLoading && <ArrowRight className="h-4 w-4 shrink-0" />}
        </button>
      </div>
    </article>
  )
}

export default memo(ServiceListingCard)
