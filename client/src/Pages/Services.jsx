import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { createBooking, getPublicServices } from '../services/dashboardService'
import { getCurrentUser, isAuthenticated, isUser } from '../services/authService'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import Modal from '../components/ui/Modal'
import StatusBadge from '../components/ui/StatusBadge'
import Toast from '../components/ui/Toast'
import { formatCurrency } from '../utils/formatters'
import { SERVICE_AREA_FULL, isSupportedLocation, unsupportedLocationMessage } from '../utils/serviceArea'
import { SERVICE_CATEGORIES } from '../constants/serviceCategories'

const CATEGORY_OPTIONS = SERVICE_CATEGORIES

const CATEGORY_ALIASES = {
  plumber: 'Plumbing',
  plumbing: 'Plumbing',
  electrician: 'Electrical',
  electrical: 'Electrical',
  carpenter: 'Carpentry',
  carpentry: 'Carpentry',
  painter: 'Painting',
  painting: 'Painting',
  'ac repair': 'Appliance Repair',
  ac: 'Appliance Repair',
  hvac: 'Appliance Repair',
  appliance: 'Appliance Repair',
  'appliance repair': 'Appliance Repair',
  cleaning: 'Cleaning',
  cleaner: 'Cleaning',
  maintenance: 'Home Maintenance',
  'home maintenance': 'Home Maintenance',
  parcel: '',
}

const normalizeCategory = (value) => {
  const normalized = String(value || '').trim().toLowerCase()
  const alias = CATEGORY_ALIASES[normalized]
  if (alias !== undefined) return alias
  return CATEGORY_OPTIONS.find((category) => category.toLowerCase() === normalized) || ''
}

const getProviderPhone = (service) =>
  String(service?.provider?.user?.phone || service?.provider?.phone || '').replace(/\D/g, '').slice(-10)

function ServiceSkeleton() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="h-5 w-2/3 animate-pulse rounded bg-slate-200" />
      <div className="mt-3 h-4 w-1/3 animate-pulse rounded bg-slate-200" />
      <div className="mt-5 h-16 animate-pulse rounded bg-slate-200" />
    </div>
  )
}

function Services() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [bookingService, setBookingService] = useState(null)
  const [bookingForm, setBookingForm] = useState({ date: '', address: getCurrentUser()?.address || '', notes: '' })
  const [visiblePhoneIds, setVisiblePhoneIds] = useState([])
  const [saving, setSaving] = useState(false)

  const selectedCategory = normalizeCategory(searchParams.get('service') || searchParams.get('category') || '')
  const selectedLocation = searchParams.get('location') || ''
  const search = searchParams.get('search') || ''

  const categories = useMemo(
    () =>
      Array.from(
        new Set([...CATEGORY_OPTIONS, ...services.map((service) => normalizeCategory(service.category)).filter(Boolean)]),
      ).sort(),
    [services],
  )

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(''), 3000)
  }

  const loadServices = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getPublicServices({
        category: selectedCategory,
        search,
      })
      setServices(data.services || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load services')
    } finally {
      setLoading(false)
    }
  }, [search, selectedCategory])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadServices()
    }, 0)
    return () => clearTimeout(timer)
  }, [loadServices])

  const filteredServices = useMemo(() => {
    if (!isSupportedLocation(selectedLocation)) return []
    return services
  }, [selectedLocation, services])

  const updateParam = (key, value) => {
    const nextParams = new URLSearchParams(searchParams)
    if (value) nextParams.set(key, key === 'category' ? normalizeCategory(value) : value)
    else nextParams.delete(key)
    if (key === 'category') nextParams.delete('service')
    setSearchParams(nextParams)
  }

  const handleBooking = async (event) => {
    event.preventDefault()
    if (!isAuthenticated()) {
      showToast('Please log in as a customer to book a service')
      return
    }
    if (!isUser()) {
      showToast('Only customer accounts can book services')
      return
    }
    setSaving(true)
    try {
      await createBooking({
        serviceId: bookingService._id,
        date: bookingForm.date,
        address: bookingForm.address,
        notes: bookingForm.notes,
      })
      setBookingService(null)
      setBookingForm({ date: '', address: getCurrentUser()?.address || '', notes: '' })
      showToast('Booking request sent')
    } catch (err) {
      showToast(err.response?.data?.message || 'Booking failed')
    } finally {
      setSaving(false)
    }
  }

  const togglePhone = (serviceId) => {
    setVisiblePhoneIds((current) =>
      current.includes(serviceId)
        ? current.filter((id) => id !== serviceId)
        : [...current, serviceId],
    )
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-500">LocalFixr services</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
            {selectedCategory ? `${selectedCategory} providers near you` : 'Book a verified local service'}
          </h1>
          <p className="mt-4 max-w-2xl text-slate-500">
            {selectedCategory
              ? `Showing available ${selectedCategory.toLowerCase()} service providers in ${SERVICE_AREA_FULL}.`
              : 'LocalFixr is currently serving Phagwara, Punjab only. Browse available local providers and send a service request.'}
          </p>
          {(selectedCategory || selectedLocation || search) && (
            <div className="mt-5 flex flex-wrap gap-2">
              {selectedCategory && (
                <span className="rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 ring-1 ring-indigo-100">
                  {selectedCategory}
                </span>
              )}
              {selectedLocation && (
                <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-100">
                  {selectedLocation}
                </span>
              )}
              {search && (
                <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
                  Search: {search}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            value={search}
            onChange={(event) => updateParam('search', event.target.value)}
            placeholder="Search"
            className="rounded-lg border border-slate-200 bg-white px-4 py-3 outline-none focus:border-indigo-400"
          />
          <input
            value={selectedLocation}
            onChange={(event) => updateParam('location', event.target.value)}
            placeholder={SERVICE_AREA_FULL}
            className="rounded-lg border border-slate-200 bg-white px-4 py-3 outline-none focus:border-indigo-400"
          />
          <select
            value={selectedCategory}
            onChange={(event) => updateParam('category', event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-3 outline-none focus:border-indigo-400"
          >
            <option value="">All categories</option>
            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </div>
      </div>

      <div className="mt-8">
        <Alert>{error}</Alert>
      </div>

      <div className="mt-10 flex items-center justify-between">
        <p className="font-semibold text-slate-700">
          {loading
            ? 'Loading services...'
            : `${filteredServices.length} provider${filteredServices.length === 1 ? '' : 's'} found`}
        </p>
        {(selectedCategory || selectedLocation || search) && (
          <Button onClick={() => setSearchParams({})} variant="secondary">
            Clear filters
          </Button>
        )}
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, index) => <ServiceSkeleton key={index} />)
          : filteredServices.map((service) => (
            <article key={service._id} className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_22px_55px_rgba(79,70,229,0.14)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900">{service.title}</h2>
                  <p className="mt-1 text-sm font-semibold text-indigo-600">{normalizeCategory(service.category) || service.category}</p>
                </div>
                <StatusBadge status={service.provider?.available ? 'active' : 'inactive'} />
              </div>
              <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">{service.description}</p>
              <div className="mt-5 rounded-xl bg-gradient-to-br from-indigo-50 to-sky-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-500">Service Provider</p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-sm font-black text-indigo-600 shadow-sm">
                    {(service.provider?.businessName || service.provider?.user?.name || 'P').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-black text-slate-900">
                      {service.provider?.businessName || service.provider?.user?.name || 'Provider'}
                    </p>
                    <p className="truncate text-sm text-slate-500">
                      {service.provider?.user?.name || 'Verified LocalFixr professional'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-slate-500">Price</p>
                  <p className="font-black text-slate-900">{formatCurrency(service.price)}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-slate-500">Rating</p>
                  <p className="font-black text-slate-900">{service.rating || 0}/5</p>
                </div>
              </div>
              <p className="mt-1 text-sm text-slate-500">{service.location || service.provider?.user?.address}</p>
              {visiblePhoneIds.includes(service._id) && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">Provider phone</p>
                  {getProviderPhone(service) ? (
                    <a href={`tel:${getProviderPhone(service)}`} className="mt-1 block text-lg font-black text-emerald-800">
                      {getProviderPhone(service)}
                    </a>
                  ) : (
                    <p className="mt-1 text-sm font-semibold text-emerald-800">Phone number not available</p>
                  )}
                </div>
              )}
              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!getProviderPhone(service)) {
                      showToast('Provider phone number is not available yet')
                    }
                    togglePhone(service._id)
                  }}
                  className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
                >
                  {visiblePhoneIds.includes(service._id) ? 'Hide number' : 'Call'}
                </button>
                <Link to={`/provider/${service._id}`} className="rounded-lg border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50">
                  Details
                </Link>
                <Button
                  onClick={() => setBookingService(service)}
                >
                  Book now
                </Button>
              </div>
            </article>
          ))}
      </div>

      {!loading && filteredServices.length === 0 && (
        <div className="mt-8">
          <EmptyState
            title="No services found"
            message={!isSupportedLocation(selectedLocation) ? unsupportedLocationMessage : 'Try a different category or search term.'}
          />
        </div>
      )}

      <Modal isOpen={Boolean(bookingService)} title={bookingService ? `Book ${bookingService.title}` : ''} onClose={() => setBookingService(null)}>
          <form onSubmit={handleBooking}>
            <label className="mt-5 block text-sm font-semibold text-slate-700">
              Preferred date and time
              <input
                type="datetime-local"
                required
                value={bookingForm.date}
                onChange={(event) => setBookingForm((current) => ({ ...current, date: event.target.value }))}
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-indigo-400"
              />
            </label>
            <label className="mt-4 block text-sm font-semibold text-slate-700">
              Address
              <textarea
                required
                rows="2"
                value={bookingForm.address}
                onChange={(event) => setBookingForm((current) => ({ ...current, address: event.target.value }))}
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-indigo-400"
              />
            </label>
            <label className="mt-4 block text-sm font-semibold text-slate-700">
              Notes
              <textarea
                rows="3"
                value={bookingForm.notes}
                onChange={(event) => setBookingForm((current) => ({ ...current, notes: event.target.value }))}
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-indigo-400"
              />
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setBookingService(null)}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Sending...' : 'Confirm booking'}
              </Button>
            </div>
          </form>
      </Modal>

      <Toast message={toast} />
    </main>
  )
}

export default Services
