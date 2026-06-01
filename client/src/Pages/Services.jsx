import { useCallback, useEffect, useMemo, useState } from 'react'
import { useFormik } from 'formik'
import { useNavigate, useSearchParams } from 'react-router'
import * as Yup from 'yup'
import { createBooking, getPublicServices } from '../services/dashboardService'
import { getCurrentUser, isAuthenticated, isUser } from '../services/authService'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import Modal from '../components/ui/Modal'
import Toast from '../components/ui/Toast'
import ServiceListingCard from '../components/services/ServiceListingCard'
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

const bookingSchema = Yup.object({
  date: Yup.string().required('Preferred date and time is required.'),
  address: Yup.string().trim().min(5, 'Enter a complete service address.').required('Address is required.'),
  notes: Yup.string().max(500, 'Notes must be 500 characters or less.'),
})

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
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [bookingService, setBookingService] = useState(null)
  const [visiblePhoneIds, setVisiblePhoneIds] = useState([])
  const [saving, setSaving] = useState(false)

  const selectedCategory = normalizeCategory(searchParams.get('service') || searchParams.get('category') || '')
  const selectedLocation = searchParams.get('location') || SERVICE_AREA_FULL
  const search = searchParams.get('search') || ''
  const hasSearchFilters = Boolean(selectedCategory || search)

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

  const bookingFormik = useFormik({
    initialValues: { date: '', address: getCurrentUser()?.address || '', notes: '' },
    validationSchema: bookingSchema,
    onSubmit: async (values, { resetForm }) => {
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
          date: values.date,
          address: values.address,
          notes: values.notes,
        })
        setBookingService(null)
        resetForm({ values: { date: '', address: getCurrentUser()?.address || '', notes: '' } })
        showToast('Booking request sent')
      } catch (err) {
        showToast(err.response?.data?.message || 'Booking failed')
      } finally {
        setSaving(false)
      }
    },
  })

  const togglePhone = (serviceId) => {
    setVisiblePhoneIds((current) =>
      current.includes(serviceId)
        ? current.filter((id) => id !== serviceId)
        : [...current, serviceId],
    )
  }

  const handleMenuAction = async (action, service) => {
    if (action === 'share') {
      const shareUrl = `${window.location.origin}/provider/${service._id}`
      try {
        if (navigator.share) {
          await navigator.share({ title: service.title, url: shareUrl })
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(shareUrl)
          showToast('Service link copied')
        }
      } catch {
        showToast('Share cancelled')
      }
      return
    }

    if (action === 'report') {
      showToast('Report received. Our team will review this service.')
    }
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
          {hasSearchFilters && (
            <div className="mt-5 flex flex-wrap gap-2">
              {selectedCategory && (
                <span className="rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 ring-1 ring-indigo-100">
                  {selectedCategory}
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
            readOnly
            placeholder={SERVICE_AREA_FULL}
            className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-700 outline-none"
          />
          <select
            value={selectedCategory}
            onChange={(event) => updateParam('category', event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-3 outline-none focus:border-indigo-400"
          >
            <option value="">All Categories</option>
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
            : `${filteredServices.length} Provider${filteredServices.length === 1 ? '' : 's'} Found`}
        </p>
        {hasSearchFilters && (
          <Button onClick={() => setSearchParams({})} variant="secondary">
            Clear Filters
          </Button>
        )}
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, index) => <ServiceSkeleton key={index} />)
          : filteredServices.map((service) => (
            <ServiceListingCard
              key={service._id}
              service={{ ...service, category: normalizeCategory(service.category) || service.category }}
              contactVisible={visiblePhoneIds.includes(service._id)}
              phone={getProviderPhone(service)}
              onBook={() => {
                bookingFormik.resetForm({ values: { date: '', address: getCurrentUser()?.address || '', notes: '' } })
                setBookingService(service)
              }}
              onDetails={() => navigate(`/provider/${service._id}`)}
              onContact={() => {
                if (!getProviderPhone(service)) showToast('Provider phone number is not available yet')
                togglePhone(service._id)
              }}
              onMenuAction={handleMenuAction}
            />
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
          <form onSubmit={bookingFormik.handleSubmit}>
            <label className="mt-5 block text-sm font-semibold text-slate-700">
              Preferred date and time <span className="text-rose-500">*</span>
              <input
                name="date"
                type="datetime-local"
                value={bookingFormik.values.date}
                onChange={bookingFormik.handleChange}
                onBlur={bookingFormik.handleBlur}
                className={`mt-2 w-full rounded-lg border px-4 py-3 outline-none focus:border-indigo-400 ${
                  bookingFormik.touched.date && bookingFormik.errors.date ? 'border-rose-300 bg-rose-50' : 'border-slate-200'
                }`}
              />
              {bookingFormik.touched.date && bookingFormik.errors.date && (
                <span className="mt-2 block text-xs font-semibold text-rose-600">{bookingFormik.errors.date}</span>
              )}
            </label>
            <label className="mt-4 block text-sm font-semibold text-slate-700">
              Address <span className="text-rose-500">*</span>
              <textarea
                name="address"
                rows="2"
                value={bookingFormik.values.address}
                onChange={bookingFormik.handleChange}
                onBlur={bookingFormik.handleBlur}
                className={`mt-2 w-full rounded-lg border px-4 py-3 outline-none focus:border-indigo-400 ${
                  bookingFormik.touched.address && bookingFormik.errors.address ? 'border-rose-300 bg-rose-50' : 'border-slate-200'
                }`}
              />
              {bookingFormik.touched.address && bookingFormik.errors.address && (
                <span className="mt-2 block text-xs font-semibold text-rose-600">{bookingFormik.errors.address}</span>
              )}
            </label>
            <label className="mt-4 block text-sm font-semibold text-slate-700">
              Notes
              <textarea
                name="notes"
                rows="3"
                value={bookingFormik.values.notes}
                onChange={bookingFormik.handleChange}
                onBlur={bookingFormik.handleBlur}
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-indigo-400"
              />
              {bookingFormik.touched.notes && bookingFormik.errors.notes && (
                <span className="mt-2 block text-xs font-semibold text-rose-600">{bookingFormik.errors.notes}</span>
              )}
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setBookingService(null)}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Sending...' : 'Confirm Booking'}
              </Button>
            </div>
          </form>
      </Modal>

      <Toast message={toast} />
    </main>
  )
}

export default Services
