import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  browseServices,
  cancelBooking,
  createBooking,
  getMyBookings,
  getUserStats,
  submitReview,
  getPublicServiceDetails,
} from '../services/dashboardService'
import { getCurrentUser } from '../services/authService'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import LoadingGrid from '../components/ui/LoadingGrid'
import Modal from '../components/ui/Modal'
import StatCard from '../components/ui/StatCard'
import StatusBadge from '../components/ui/StatusBadge'
import Toast from '../components/ui/Toast'
import { formatCurrency, formatDate } from '../utils/formatters'
import { SERVICE_CATEGORY_OPTIONS } from '../constants/serviceCategories'

const CATEGORIES = SERVICE_CATEGORY_OPTIONS

function UserDashboardNew({ defaultTab = 'dashboard' }) {
  const navigate = useNavigate()
  const [user] = useState(getCurrentUser())
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
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  const [bookingForm, setBookingForm] = useState({ 
    date: '', 
    address: user?.address || '', 
    notes: '' 
  })
  const [reviewForm, setReviewForm] = useState({ 
    rating: 5, 
    comment: '' 
  })

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(''), 3000)
  }

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
    try {
      const params = { page, limit: 12, ...filters }
      if (searchQuery.trim()) params.search = searchQuery.trim()
      if (selectedCategory !== 'All') params.category = selectedCategory
      if (priceRange.min) params.minPrice = priceRange.min
      if (priceRange.max) params.maxPrice = priceRange.max
      
      const data = await browseServices(params)
      setServices(data.services || [])
      setTotalPages(data.pagination?.totalPages || 1)
      setCurrentPage(page)
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load services')
    }
  }, [priceRange.max, priceRange.min, searchQuery, selectedCategory])

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
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [activeTab, loadServices, priceRange, searchQuery, selectedCategory])

  const handleBook = async (event) => {
    event.preventDefault()
    if (!bookingService) return
    setSaving(true)
    try {
      await createBooking({
        serviceId: bookingService._id,
        date: bookingForm.date,
        address: bookingForm.address || user?.address || '',
        notes: bookingForm.notes,
      })
      setBookingService(null)
      setBookingForm({ date: '', address: user?.address || '', notes: '' })
      showToast('Booking request sent')
      await loadDashboard()
    } catch (err) {
      showToast(err.response?.data?.message || 'Booking failed')
    } finally {
      setSaving(false)
    }
  }

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

  const handleReview = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      await submitReview({
        bookingId: reviewBooking._id,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      })
      setReviewBooking(null)
      setReviewForm({ rating: 5, comment: '' })
      showToast('Review submitted')
      await loadDashboard()
    } catch (err) {
      showToast(err.response?.data?.message || 'Unable to submit review')
    } finally {
      setSaving(false)
    }
  }

  const viewServiceDetails = async (service) => {
    try {
      const data = await getPublicServiceDetails(service._id)
      setSelectedService(data.service)
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load service details')
    }
  }

  const resetFilters = () => {
    setSearchQuery('')
    setSelectedCategory('All')
    setPriceRange({ min: '', max: '' })
    setCurrentPage(1)
  }

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
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">Customer</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">Welcome, {user?.name}</h1>
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
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard label="Total bookings" value={stats.totalBookings || 0} />
            <StatCard label="Pending" value={stats.pendingBookings || 0} />
            <StatCard label="Completed" value={stats.completedBookings || 0} />
            <StatCard label="Total spent" value={formatCurrency(stats.totalSpent)} />
          </div>

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
                      <td className="py-3 pr-4 font-semibold text-slate-900">{booking.service?.title}</td>
                      <td className="py-3 pr-4 text-slate-600">{booking.provider?.businessName || booking.provider?.user?.name}</td>
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
            
            {/* Search and Filters */}
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

          {/* Services Grid */}
          <div className="grid gap-4 lg:grid-cols-3">
            {services.map((service) => {
              const providerName = service.provider?.businessName || service.provider?.user?.name || 'Unknown Provider'
              return (
              <article key={service._id} className="rounded-lg border border-slate-200 p-4 hover:shadow-md transition-all duration-200 ease-in-out hover:border-indigo-300">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 truncate">{service.title || 'Service Title'}</h3>
                    <p className="mt-1 text-sm text-slate-500 flex items-center gap-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-indigo-400"></span>
                      {service.category || 'Category'}
                    </p>
                  </div>
                  <span className="font-black text-indigo-700 whitespace-nowrap">{formatCurrency(service.price || 0)}</span>
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-slate-600">{service.description || 'Service description'}</p>
                <div className="mt-3 flex items-center gap-1 text-sm text-slate-500">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {service.location || 'All Areas'}
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {providerName}
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <span className="text-amber-500">{'★'.repeat(Math.floor(service.rating || 0))}{'☆'.repeat(5 - Math.floor(service.rating || 0))}</span>
                  <span className="text-slate-500">({service.reviewsCount || 0} reviews)</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    onClick={() => setBookingService(service)}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Book Now
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => viewServiceDetails(service)}
                  >
                    Details
                  </Button>
                </div>
              </article>
              )
            })}
            {services.length === 0 && (
              <div className="lg:col-span-3">
                <EmptyState 
                  title="No services found" 
                  message={searchQuery || selectedCategory !== 'All' ? 'Try adjusting your filters.' : 'Services will appear here once providers create them.'} 
                />
              </div>
            )}
          </div>

          {/* Pagination */}
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
                    <td className="py-3 pr-4 font-semibold text-slate-900">{booking.service?.title}</td>
                    <td className="py-3 pr-4 text-slate-600">{booking.provider?.businessName || booking.provider?.user?.name}</td>
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
                          onClick={() => setReviewBooking(booking)}
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

      {/* Booking Modal */}
      <Modal isOpen={Boolean(bookingService)} title={bookingService ? `Book ${bookingService.title}` : ''} onClose={() => setBookingService(null)}>
        <form onSubmit={handleBook}>
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
            Service address
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

      {/* Review Modal */}
      <Modal isOpen={Boolean(reviewBooking)} title={reviewBooking ? `Review ${reviewBooking.service?.title}` : ''} onClose={() => setReviewBooking(null)}>
        <form onSubmit={handleReview}>
          <label className="mt-5 block text-sm font-semibold text-slate-700">
            Rating
            <select
              value={reviewForm.rating}
              onChange={(event) => setReviewForm((current) => ({ ...current, rating: Number(event.target.value) }))}
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-indigo-400"
            >
              {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}
            </select>
          </label>
          <label className="mt-4 block text-sm font-semibold text-slate-700">
            Comment
            <textarea
              required
              rows="4"
              value={reviewForm.comment}
              onChange={(event) => setReviewForm((current) => ({ ...current, comment: event.target.value }))}
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-indigo-400"
            />
          </label>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setReviewBooking(null)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              Submit review
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
                <h3 className="font-bold text-slate-900">Price</h3>
                <p className="mt-1 text-sm text-slate-600">{formatCurrency(selectedService.price)}</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Location
                </h3>
                <p className="mt-1 text-sm text-slate-600">{selectedService.location || 'All Areas'}</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Provider</h3>
                <p className="mt-1 text-sm text-slate-600">
                  {selectedService.provider?.businessName || selectedService.provider?.user?.name || 'Unknown Provider'}
                </p>
              </div>
            </div>
            <div className="mt-2">
              <h3 className="font-bold text-slate-900">Rating</h3>
              <div className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                <span className="text-amber-500">{'★'.repeat(Math.floor(selectedService.rating || 0))}{'☆'.repeat(5 - Math.floor(selectedService.rating || 0))}</span>
                <span>({selectedService.reviewsCount || 0} reviews)</span>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={() => { setBookingService(selectedService); setSelectedService(null); }}>
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
