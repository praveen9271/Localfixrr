import { useCallback, useEffect, useRef, useState } from 'react'
import { useFormik } from 'formik'
import { CheckCircle2, Star } from 'lucide-react'
import { useNavigate } from 'react-router'
import * as Yup from 'yup'
import {
  browseServices,
  cancelBooking,
  createBooking,
  getMyBookings,
  getUserStats,
  submitReview,
  getPublicServiceDetails,
} from '../services/dashboardService'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import DraggableGrid from '../components/ui/DraggableGrid'
import EmptyState from '../components/ui/EmptyState'
import LoadingGrid from '../components/ui/LoadingGrid'
import Modal from '../components/ui/Modal'
import StatCard from '../components/ui/StatCard'
import StatusBadge from '../components/ui/StatusBadge'
import Toast from '../components/ui/Toast'
import ServiceListingCard from '../components/services/ServiceListingCard'
import ProfileAvatar from '../components/profile/ProfileAvatar'
import { formatCurrency, formatDate, getLocalDateTimeInputValue } from '../utils/formatters'
import { SERVICE_CATEGORY_OPTIONS } from '../constants/serviceCategories'
import useDebounce from '../hooks/useDebounce'
import useProfilePhotoActions from '../hooks/useProfilePhotoActions'
import { getServiceItems, getStartingPrice } from '../utils/serviceItems'

const CATEGORIES = SERVICE_CATEGORY_OPTIONS
const getProviderPhone = (service) =>
  String(service?.provider?.user?.phone || service?.provider?.phone || '').replace(/\D/g, '').slice(-10)

const bookingSchema = Yup.object({
  date: Yup.string()
    .required('Preferred date and time is required.')
    .test('future-date', 'Please select today or a future date and time.', (value) => !value || new Date(value) >= new Date()),
  address: Yup.string().trim().min(5, 'Enter a complete service address.').required('Service address is required.'),
  notes: Yup.string().max(500, 'Notes must be 500 characters or less.'),
})

const reviewSchema = Yup.object({
  rating: Yup.number().min(1).max(5).required('Rating is required.'),
  comment: Yup.string().trim().min(5, 'Review must be at least 5 characters.').required('Comment is required.'),
})

function UserDashboardNew({ defaultTab = 'dashboard' }) {
  const navigate = useNavigate()
  const activeTab = defaultTab
  const [stats, setStats] = useState({})
  const [services, setServices] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [bookingService, setBookingService] = useState(null)
  const [reviewBooking, setReviewBooking] = useState(null)
  const [selectedService, setSelectedService] = useState(null)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [servicesLoading, setServicesLoading] = useState(false)
  const serviceRequestAbortRef = useRef(null)
  const debouncedSearchQuery = useDebounce(searchQuery.trim(), 500)
  
  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(''), 3000)
  }

  const {
    currentUser: user,
  } = useProfilePhotoActions()

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [statsData, bookingsData] = await Promise.all([
        getUserStats(),
        getMyBookings(),
      ])
      setStats(statsData.stats || {})
      setBookings(bookingsData.bookings || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadServices = useCallback(async (page = 1, filters = {}) => {
    serviceRequestAbortRef.current?.abort()
    const controller = new AbortController()
    serviceRequestAbortRef.current = controller
    if (page === 1) {
      setServices([])
      setCurrentPage(1)
    }
    setServicesLoading(true)
    try {
      const params = { page, limit: 12, ...filters }
      if (debouncedSearchQuery) params.search = debouncedSearchQuery
      if (selectedCategory !== 'All') params.category = selectedCategory
      if (priceRange.min) params.minPrice = priceRange.min
      if (priceRange.max) params.maxPrice = priceRange.max
      
      const data = await browseServices(params, { signal: controller.signal })
      setServices(data.services || [])
      setTotalPages(data.pagination?.pages || data.pagination?.totalPages || 1)
      setCurrentPage(page)
    } catch (err) {
      if (err.code === 'ERR_CANCELED' || err.name === 'CanceledError') return
      showToast(err.response?.data?.message || 'Failed to load services')
    } finally {
      if (!controller.signal.aborted) setServicesLoading(false)
    }
  }, [debouncedSearchQuery, priceRange.max, priceRange.min, selectedCategory])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDashboard()
    }, 0)
    return () => clearTimeout(timer)
  }, [activeTab, loadDashboard])

  useEffect(() => {
    if (activeTab === 'services') {
      const timer = setTimeout(() => {
        loadServices(1)
      }, 0)

      return () => {
        clearTimeout(timer)
        serviceRequestAbortRef.current?.abort()
      }
    }
  }, [activeTab, loadServices])

  const bookingFormik = useFormik({
    initialValues: { serviceItemId: '', date: '', address: user?.address || '', notes: '' },
    validationSchema: bookingSchema,
    onSubmit: async (values, { resetForm }) => {
      if (!bookingService) return
      setSaving(true)
      try {
        await createBooking({
          serviceId: bookingService._id,
          serviceItemId: values.serviceItemId,
          date: values.date,
          address: values.address || user?.address || '',
          notes: values.notes,
        })
        setBookingService(null)
        resetForm({ values: { serviceItemId: '', date: '', address: user?.address || '', notes: '' } })
        showToast('Booking request sent')
        await loadDashboard()
      } catch (err) {
        showToast(err.response?.data?.message || 'Booking failed')
      } finally {
        setSaving(false)
      }
    },
  })

  const handleCancel = async (id) => {
    setSaving(true)
    try {
      await cancelBooking(id)
      showToast('Booking cancelled')
      await loadDashboard()
    } catch (err) {
      showToast(err.response?.data?.message || 'Unable to cancel booking')
    } finally {
      setSaving(false)
    }
  }

  const reviewFormik = useFormik({
    initialValues: { rating: 5, comment: '' },
    validationSchema: reviewSchema,
    onSubmit: async (values, { resetForm }) => {
      setSaving(true)
      try {
        await submitReview({
          bookingId: reviewBooking._id,
          rating: values.rating,
          comment: values.comment,
        })
        setReviewBooking(null)
        resetForm()
        showToast('Review submitted')
        await loadDashboard()
      } catch (err) {
        showToast(err.response?.data?.message || 'Unable to submit review')
      } finally {
        setSaving(false)
      }
    },
  })

  const viewServiceDetails = async (service) => {
    try {
      const data = await getPublicServiceDetails(service._id)
      setSelectedService(data.service)
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load service details')
    }
  }

  const handleServiceMenuAction = async (action, service) => {
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

  const resetFilters = () => {
    setSearchQuery('')
    setSelectedCategory('All')
    setPriceRange({ min: '', max: '' })
    setCurrentPage(1)
  }

  const statCards = [
    { id: 'total-bookings', label: 'Total Bookings', value: stats.totalBookings || 0 },
    { id: 'pending', label: 'Pending', value: stats.pendingBookings || 0 },
    { id: 'completed', label: 'Completed', value: stats.completedBookings || 0 },
    { id: 'total-spent', label: 'Total Spent', value: formatCurrency(stats.totalSpent) },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 animate-pulse rounded bg-slate-200" />
        <LoadingGrid count={4} columns="md:grid-cols-4" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">LocalFixr Customer Panel</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">Customer Dashboard</h1>
          <p className="mt-1 text-slate-500">Book services, track requests, and review completed work.</p>
        </div>
      </div>

      <Alert>{error}</Alert>

      <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
        {[
          { key: 'dashboard', label: 'Dashboard', path: '/dashboard/user' },
          { key: 'services', label: 'Browse Services', path: '/dashboard/user/services' },
          { key: 'bookings', label: 'My Bookings', path: '/dashboard/user/bookings' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              navigate(tab.path)
            }}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab.key ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <>
          <DraggableGrid
            items={statCards}
            storageKey="localfixr-user-dashboard-card-order"
            className="grid gap-4 md:grid-cols-4"
            renderItem={(card) => <StatCard label={card.label} value={card.value} />}
          />

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-black text-slate-900">Recent Bookings</h2>
              <Button variant="secondary" onClick={() => navigate('/dashboard/user/bookings')}>View All</Button>
            </div>
            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="py-3 pr-4">Service</th>
                    <th className="py-3 pr-4">Provider</th>
                    <th className="py-3 pr-4">Date</th>
                    <th className="py-3 pr-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.slice(0, 5).map((booking) => (
                    <tr key={booking._id} className="border-b border-slate-100">
                      <td className="py-3 pr-4">
                        <p className="font-semibold text-slate-900">{booking.service?.title}</p>
                        {booking.serviceItem?.name && <p className="text-xs font-semibold text-slate-500">{booking.serviceItem.name}</p>}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">
                        <div className="flex min-w-0 items-center gap-3">
                          <ProfileAvatar
                            src={booking.provider?.user?.avatar}
                            name={booking.provider?.businessName || booking.provider?.user?.name}
                            email={booking.provider?.user?.email}
                            size="sm"
                          />
                          <span className="truncate">{booking.provider?.businessName || booking.provider?.user?.name}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-slate-600">{formatDate(booking.date)}</td>
                      <td className="py-3 pr-4"><StatusBadge status={booking.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {bookings.length === 0 && (
                <EmptyState title="No bookings yet" message="Book a service to start tracking requests here." />
              )}
            </div>
          </section>
        </>
      )}

      {activeTab === 'services' && (
        <section className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black text-slate-900 mb-4">Browse Services</h2>
            
            <div className="space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row">
                <input
                  type="text"
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 transition"
                />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 transition"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <Button variant="secondary" onClick={resetFilters}>Reset</Button>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-semibold text-slate-700">Price Range:</label>
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                    className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                  />
                  <span className="text-slate-500">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                    className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {servicesLoading && services.length === 0
              ? Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="min-h-[430px] rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="h-12 w-12 animate-pulse rounded-xl bg-slate-200" />
                  <div className="mt-5 h-5 w-2/3 animate-pulse rounded bg-slate-200" />
                  <div className="mt-4 h-20 animate-pulse rounded bg-slate-200" />
                </div>
              ))
              : services.map((service) => (
              <ServiceListingCard
                key={service._id}
                service={service}
                phone={getProviderPhone(service)}
                onBook={() => {
                  const items = getServiceItems(service)
                  bookingFormik.resetForm({ values: { serviceItemId: items[0]?._id || items[0]?.name || '', date: '', address: user?.address || '', notes: '' } })
                  setBookingService(service)
                }}
                onDetails={() => viewServiceDetails(service)}
                onContact={() => {
                  const phone = getProviderPhone(service)
                  if (phone) {
                    window.location.href = `tel:+91${phone}`
                  } else {
                    showToast('Provider phone number is not available yet')
                  }
                }}
                onMenuAction={handleServiceMenuAction}
              />
            ))}
            {!servicesLoading && services.length === 0 && (
              <div className="lg:col-span-3">
                <EmptyState 
                  title="No services found" 
                  message={searchQuery || selectedCategory !== 'All' ? 'Try adjusting your filters.' : 'Services will appear here once providers create them.'} 
                />
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="secondary"
                disabled={currentPage === 1}
                onClick={() => loadServices(currentPage - 1)}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm text-slate-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="secondary"
                disabled={currentPage === totalPages}
                onClick={() => loadServices(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </section>
      )}

      {activeTab === 'bookings' && (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-slate-900">My Bookings</h2>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="py-3 pr-4">Service</th>
                  <th className="py-3 pr-4">Provider</th>
                  <th className="py-3 pr-4">Date</th>
                  <th className="py-3 pr-4">Amount</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking._id} className="border-b border-slate-100">
                    <td className="py-3 pr-4">
                      <p className="font-semibold text-slate-900">{booking.service?.title}</p>
                      {booking.serviceItem?.name && <p className="text-xs font-semibold text-slate-500">{booking.serviceItem.name}</p>}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      <div className="flex min-w-0 items-center gap-3">
                        <ProfileAvatar
                          src={booking.provider?.user?.avatar}
                          name={booking.provider?.businessName || booking.provider?.user?.name}
                          email={booking.provider?.user?.email}
                          size="sm"
                        />
                        <span className="truncate">{booking.provider?.businessName || booking.provider?.user?.name}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{formatDate(booking.date)}</td>
                    <td className="py-3 pr-4 text-slate-600">{formatCurrency(booking.totalAmount)}</td>
                    <td className="py-3 pr-4"><StatusBadge status={booking.status} /></td>
                    <td className="py-3 pr-4">
                      {['pending', 'accepted', 'in_progress'].includes(booking.status) && (
                        <Button
                          variant="danger"
                          disabled={saving}
                          onClick={() => handleCancel(booking._id)}
                        >
                          Cancel
                        </Button>
                      )}
                      {booking.status === 'completed' && (
                        <Button
                          variant="secondary"
                          onClick={() => {
                            reviewFormik.resetForm()
                            setReviewBooking(booking)
                          }}
                        >
                          Review
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {bookings.length === 0 && (
              <EmptyState title="No bookings yet" message="Book a service to start tracking requests here." />
            )}
          </div>
        </section>
      )}

      <Modal isOpen={Boolean(bookingService)} title={bookingService ? `Book ${bookingService.title}` : ''} onClose={() => setBookingService(null)}>
        <form onSubmit={bookingFormik.handleSubmit}>
          {bookingService && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-black text-slate-900">Choose service package</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">Select one item. This exact service will be sent to the provider.</p>
              <div className="mt-3 grid gap-2">
                {getServiceItems(bookingService).map((item) => {
                  const itemKey = item._id || item.name
                  const active = bookingFormik.values.serviceItemId === itemKey
                  return (
                    <button
                      key={itemKey}
                      type="button"
                      onClick={() => bookingFormik.setFieldValue('serviceItemId', itemKey)}
                      className={`flex w-full items-start gap-3 rounded-xl border bg-white p-3 text-left transition ${active ? 'border-indigo-500 ring-4 ring-indigo-50' : 'border-slate-200 hover:border-indigo-200'}`}
                    >
                      <input
                        type="checkbox"
                        checked={active}
                        readOnly
                        tabIndex={-1}
                        className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 accent-indigo-600"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-bold text-slate-900">{item.name}</p>
                          <span className="shrink-0 font-black text-indigo-700">{formatCurrency(item.price)}</span>
                        </div>
                        {item.description && <p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p>}
                        {item.duration && <p className="mt-1 text-xs font-semibold text-slate-500">{item.duration}</p>}
                        {active && <p className="mt-2 text-xs font-black text-indigo-600">Selected for booking</p>}
                      </div>
                    </button>
                  )
                })}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm">
                <span className="font-bold text-slate-600">Final amount</span>
                <span className="font-black text-slate-950">
                  {formatCurrency(
                    getServiceItems(bookingService).find((item) => (item._id || item.name) === bookingFormik.values.serviceItemId)?.price
                      || getStartingPrice(bookingService),
                  )}
                </span>
              </div>
            </div>
          )}
          <label className="mt-5 block text-sm font-semibold text-slate-700">
            Preferred date and time <span className="text-rose-500">*</span>
            <input
              name="date"
              type="datetime-local"
              min={getLocalDateTimeInputValue()}
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
            Service address <span className="text-rose-500">*</span>
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

      <Modal isOpen={Boolean(reviewBooking)} title={reviewBooking ? `Review ${reviewBooking.service?.title}` : ''} onClose={() => setReviewBooking(null)}>
        <form onSubmit={reviewFormik.handleSubmit}>
          <label className="mt-5 block text-sm font-semibold text-slate-700">
            Rating <span className="text-rose-500">*</span>
            <select
              name="rating"
              value={reviewFormik.values.rating}
              onChange={(event) => reviewFormik.setFieldValue('rating', Number(event.target.value))}
              onBlur={reviewFormik.handleBlur}
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-indigo-400"
            >
              {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}
            </select>
          </label>
          <label className="mt-4 block text-sm font-semibold text-slate-700">
            Comment <span className="text-rose-500">*</span>
            <textarea
              name="comment"
              rows="4"
              value={reviewFormik.values.comment}
              onChange={reviewFormik.handleChange}
              onBlur={reviewFormik.handleBlur}
              className={`mt-2 w-full rounded-lg border px-4 py-3 outline-none focus:border-indigo-400 ${
                reviewFormik.touched.comment && reviewFormik.errors.comment ? 'border-rose-300 bg-rose-50' : 'border-slate-200'
              }`}
            />
            {reviewFormik.touched.comment && reviewFormik.errors.comment && (
              <span className="mt-2 block text-xs font-semibold text-rose-600">{reviewFormik.errors.comment}</span>
            )}
          </label>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setReviewBooking(null)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              Submit Review
            </Button>
          </div>
        </form>
      </Modal>

      {/* Service Details Modal */}
      <Modal isOpen={Boolean(selectedService)} title={selectedService?.title || ''} onClose={() => setSelectedService(null)}>
        {selectedService && (
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-slate-900">Description</h3>
              <p className="mt-2 text-sm text-slate-600">{selectedService.description}</p>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <h3 className="font-bold text-slate-900">Category</h3>
                <p className="mt-1 text-sm text-slate-600">{selectedService.category}</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Starting Price</h3>
                <p className="mt-1 text-sm text-slate-600">{formatCurrency(getStartingPrice(selectedService))}</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Location
                </h3>
                <p className="mt-1 text-sm text-slate-600">{selectedService.location || 'Location not provided'}</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Provider</h3>
                <p className="mt-1 text-sm text-slate-600">
                  {selectedService.provider?.businessName || selectedService.provider?.user?.name || 'Provider Not Available'}
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-bold text-slate-900">Included Services</h3>
              <div className="mt-3 space-y-2">
                {getServiceItems(selectedService).map((item) => (
                  <button
                    key={item._id || item.name}
                    type="button"
                    onClick={() => {
                      bookingFormik.resetForm({
                        values: {
                          serviceItemId: item._id || item.name || '',
                          date: '',
                          address: user?.address || '',
                          notes: '',
                        },
                      })
                      setBookingService(selectedService)
                      setSelectedService(null)
                    }}
                    className="flex w-full items-center justify-between gap-3 rounded-lg border border-transparent px-2 py-2 text-left text-sm transition hover:border-indigo-100 hover:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-50"
                  >
                    <span className="inline-flex min-w-0 items-center gap-2 font-semibold text-slate-700">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                      <span className="truncate">{item.name}</span>
                    </span>
                    <span className="shrink-0 font-black text-indigo-700">{formatCurrency(item.price)}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-2">
              <h3 className="font-bold text-slate-900">Rating</h3>
              <div className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                <span className="inline-flex text-amber-500">
                  {Array.from({ length: 5 }, (_, index) => (
                    <Star
                      key={index}
                      className={`h-4 w-4 ${index < Math.floor(selectedService.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                    />
                  ))}
                </span>
                <span>({selectedService.reviewsCount || 0} Reviews)</span>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={() => {
                const items = getServiceItems(selectedService)
                bookingFormik.resetForm({ values: { serviceItemId: items[0]?._id || items[0]?.name || '', date: '', address: user?.address || '', notes: '' } })
                setBookingService(selectedService)
                setSelectedService(null)
              }}>
                Book This Service
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Toast message={toast} />
    </div>
  )
}

export default UserDashboardNew
