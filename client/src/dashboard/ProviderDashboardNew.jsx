import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { getCurrentUser } from '../services/authService'
import {
  createService,
  deleteService,
  getMyServices,
  getProviderBookings,
  getProviderProfile,
  getProviderStats,
  updateBookingStatus,
  updateProviderProfile,
  updateService,
  getProviderReviews,
} from '../services/dashboardService'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import ConfirmModal from '../components/ui/ConfirmModal'
import EmptyState from '../components/ui/EmptyState'
import FormField from '../components/ui/FormField'
import LoadingGrid from '../components/ui/LoadingGrid'
import StatCard from '../components/ui/StatCard'
import StatusBadge from '../components/ui/StatusBadge'
import Toast from '../components/ui/Toast'
import { formatCurrency, formatDateTime } from '../utils/formatters'
import { SERVICE_CATEGORIES } from '../constants/serviceCategories'

const blankService = {
  title: '',
  category: '',
  price: '',
  location: '',
  description: '',
  status: 'active',
}

function ProviderDashboardNew({ defaultTab = 'bookings' }) {
  const navigate = useNavigate()
  const [user] = useState(getCurrentUser())
  const activeTab = defaultTab
  const [stats, setStats] = useState({})
  const [services, setServices] = useState([])
  const [bookings, setBookings] = useState([])
  const [reviews, setReviews] = useState([])
  const [profile, setProfile] = useState(null)
  const [serviceForm, setServiceForm] = useState(blankService)
  const [editingId, setEditingId] = useState(null)
  const [profileForm, setProfileForm] = useState({ businessName: '', bio: '', serviceAreas: '', skills: '', available: true })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null })

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(''), 3000)
  }

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [statsData, servicesData, bookingsData, profileData] = await Promise.all([
        getProviderStats(),
        getMyServices(),
        getProviderBookings(),
        getProviderProfile(),
      ])
      setStats(statsData.stats || {})
      setServices(servicesData.services || [])
      setBookings(bookingsData.bookings || [])
      const nextProfile = profileData.provider
      setProfile(nextProfile)
      setProfileForm({
        businessName: nextProfile?.businessName || '',
        bio: nextProfile?.bio || '',
        serviceAreas: (nextProfile?.serviceAreas || []).join(', '),
        skills: (nextProfile?.skills || []).join(', '),
        available: Boolean(nextProfile?.available),
      })
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load provider dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadReviews = useCallback(async () => {
    try {
      const data = await getProviderReviews()
      setReviews(data.reviews || [])
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load reviews')
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDashboard()
      if (activeTab === 'reviews') {
        loadReviews()
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [activeTab, loadDashboard, loadReviews])

  const resetServiceForm = () => {
    setServiceForm(blankService)
    setEditingId(null)
  }

  const handleServiceSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      const payload = { ...serviceForm, price: Number(serviceForm.price) }
      if (editingId) {
        await updateService(editingId, payload)
        showToast('Service updated')
      } else {
        await createService(payload)
        showToast('Service created')
      }
      resetServiceForm()
      await loadDashboard()
    } catch (err) {
      showToast(err.response?.data?.message || 'Unable to save service')
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (service) => {
    setEditingId(service._id)
    setServiceForm({
      title: service.title || '',
      category: service.category || '',
      price: service.price || '',
      location: service.location || '',
      description: service.description || '',
      status: service.status || 'active',
    })
    navigate('/dashboard/provider/services')
  }

  const confirmDeleteService = (service) => {
    setConfirmModal({
      open: true,
      title: 'Delete Service',
      message: `Delete "${service.title}"? This will remove all associated bookings and reviews.`,
      variant: 'danger',
      onConfirm: async () => {
        setSaving(true)
        try {
          await deleteService(service._id)
          showToast('Service deleted')
          await loadDashboard()
        } catch (err) {
          showToast(err.response?.data?.message || 'Unable to delete service')
        } finally {
          setSaving(false)
        }
      },
    })
  }

  const handleStatus = async (bookingId, status) => {
    setSaving(true)
    try {
      await updateBookingStatus(bookingId, status)
      showToast(`Booking ${status.replace('_', ' ')}`)
      await loadDashboard()
    } catch (err) {
      showToast(err.response?.data?.message || 'Unable to update booking')
    } finally {
      setSaving(false)
    }
  }

  const handleProfile = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      await updateProviderProfile({
        businessName: profileForm.businessName,
        bio: profileForm.bio,
        serviceAreas: profileForm.serviceAreas.split(',').map((item) => item.trim()).filter(Boolean),
        skills: profileForm.skills ? [profileForm.skills] : [],
        available: profileForm.available,
      })
      showToast('Profile updated')
      await loadDashboard()
    } catch (err) {
      showToast(err.response?.data?.message || 'Unable to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-80 animate-pulse rounded bg-slate-200" />
        <LoadingGrid count={5} columns="md:grid-cols-5" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">Provider</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">{profile?.businessName || user?.name}</h1>
        <p className="mt-1 text-slate-500">Manage services, booking requests, earnings, and reviews.</p>
      </div>

      <Alert>{error}</Alert>

      <div className="grid gap-4 md:grid-cols-5">
        <StatCard label="Services" value={stats.totalServices || 0} />
        <StatCard label="Active" value={stats.activeServices || 0} />
        <StatCard label="Pending" value={stats.pendingBookings || 0} />
        <StatCard label="Completed" value={stats.completedBookings || 0} />
        <StatCard label="Earnings" value={formatCurrency(stats.totalEarnings)} />
      </div>

      <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
        {[
          { key: 'bookings', label: 'Bookings', path: '/dashboard/provider/bookings' },
          { key: 'services', label: 'Services', path: '/dashboard/provider/services' },
          { key: 'reviews', label: 'Reviews', path: '/dashboard/provider/reviews' },
          { key: 'profile', label: 'Profile', path: '/dashboard/provider/profile' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              navigate(tab.path)
            }}
            className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize transition ${
              activeTab === tab.key ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'bookings' && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-black text-slate-900">Booking Requests</h2>
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-slate-500">
                {bookings.filter(b => b.status === 'pending').length} pending
              </span>
              <span className="text-sm font-semibold text-slate-500">
                {bookings.filter(b => b.status === 'in_progress').length} in progress
              </span>
            </div>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="py-3 pr-4 font-semibold">Customer</th>
                  <th className="py-3 pr-4 font-semibold">Service</th>
                  <th className="py-3 pr-4 font-semibold">Date</th>
                  <th className="py-3 pr-4 font-semibold">Amount</th>
                  <th className="py-3 pr-4 font-semibold">Status</th>
                  <th className="py-3 pr-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking._id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="py-3 pr-4">
                      <p className="font-semibold text-slate-900">{booking.customer?.name}</p>
                      <p className="text-xs text-slate-500">{booking.customer?.phone}</p>
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{booking.service?.title}</td>
                    <td className="py-3 pr-4 text-slate-600">{formatDateTime(booking.date)}</td>
                    <td className="py-3 pr-4 text-slate-600">{formatCurrency(booking.totalAmount)}</td>
                    <td className="py-3 pr-4"><StatusBadge status={booking.status} /></td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-wrap gap-2">
                        {booking.status === 'pending' && (
                          <>
                            <Button disabled={saving} onClick={() => handleStatus(booking._id, 'accepted')} variant="success" size="sm">Accept</Button>
                            <Button disabled={saving} onClick={() => handleStatus(booking._id, 'rejected')} variant="danger" size="sm">Reject</Button>
                          </>
                        )}
                        {booking.status === 'accepted' && (
                          <Button disabled={saving} onClick={() => handleStatus(booking._id, 'in_progress')} size="sm">Start</Button>
                        )}
                        {booking.status === 'in_progress' && (
                          <Button disabled={saving} onClick={() => handleStatus(booking._id, 'completed')} variant="dark" size="sm">Complete</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {bookings.length === 0 && <EmptyState title="No booking requests" message="New customer requests will appear here." />}
          </div>
        </section>
      )}

      {activeTab === 'services' && (
        <section className="grid gap-6 lg:grid-cols-[400px_1fr]">
          <form onSubmit={handleServiceSubmit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black text-slate-900">{editingId ? 'Edit Service' : 'Add Service'}</h2>
            {[
              ['title', 'Title'],
              ['price', 'Price'],
              ['location', 'Location'],
            ].map(([name, label]) => (
              <FormField
                key={name}
                label={label}
                className="mt-4"
                required={name !== 'location'}
                type={name === 'price' ? 'number' : 'text'}
                value={serviceForm[name]}
                onChange={(event) => setServiceForm((current) => ({ ...current, [name]: event.target.value }))}
              />
            ))}
            <label className="mt-4 block text-sm font-semibold text-slate-700">
              Category
              <select
                required
                value={serviceForm.category}
                onChange={(event) => setServiceForm((current) => ({ ...current, category: event.target.value }))}
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-indigo-400"
              >
                <option value="">Select a category</option>
                {SERVICE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </label>
            
            <label className="mt-4 block text-sm font-semibold text-slate-700">
              Status
              <select
                value={serviceForm.status}
                onChange={(event) => setServiceForm((current) => ({ ...current, status: event.target.value }))}
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-indigo-400"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
            <label className="mt-4 block text-sm font-semibold text-slate-700">
              Description
              <textarea
                required
                rows="4"
                value={serviceForm.description}
                onChange={(event) => setServiceForm((current) => ({ ...current, description: event.target.value }))}
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-indigo-400"
              />
            </label>
            <div className="mt-5 flex gap-3">
              <Button type="submit" disabled={saving}>
                {editingId ? 'Update' : 'Create'}
              </Button>
              {editingId && <Button variant="secondary" onClick={resetServiceForm}>Cancel</Button>}
            </div>
          </form>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-black text-slate-900">My Services</h2>
              <span className="text-sm font-semibold text-slate-500">{services.length} services</span>
            </div>
            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              {services.map((service) => (
                <article key={service._id} className="rounded-lg border border-slate-200 p-4 hover:shadow-md transition">
                  <div className="flex justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-slate-900">{service.title}</h3>
                      <p className="mt-1 text-sm text-slate-500">{service.category}</p>
                    </div>
                    <StatusBadge status={service.status} />
                  </div>
                  <p className="mt-3 text-sm text-slate-600 line-clamp-2">{service.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-black text-indigo-700">{formatCurrency(service.price)}</span>
                    <span className="text-xs text-slate-500">{service.location || 'No location'}</span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button variant="secondary" onClick={() => startEdit(service)} size="sm">Edit</Button>
                    <Button variant="danger" disabled={saving} onClick={() => confirmDeleteService(service)} size="sm">Delete</Button>
                  </div>
                </article>
              ))}
              {services.length === 0 && <div className="xl:col-span-2"><EmptyState title="No services yet" message="Create your first service listing." /></div>}
            </div>
          </div>
        </section>
      )}

      {activeTab === 'reviews' && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-black text-slate-900">Customer Reviews</h2>
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-slate-500">
                Average: {profile?.rating?.toFixed(1) || '0.0'} ⭐
              </span>
              <span className="text-sm font-semibold text-slate-500">
                {reviews.length} total
              </span>
            </div>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {reviews.map((review) => (
              <article key={review._id} className="rounded-lg border border-slate-200 p-4 hover:shadow-md transition">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-slate-900">{review.service?.title}</h3>
                    <p className="mt-1 text-sm text-slate-500">By {review.user?.name}</p>
                  </div>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-bold text-amber-700">{review.rating}/5</span>
                </div>
                <p className="mt-3 text-sm text-slate-600">{review.comment}</p>
                <p className="mt-3 text-xs text-slate-500">{formatDateTime(review.createdAt)}</p>
              </article>
            ))}
            {reviews.length === 0 && (
              <div className="lg:col-span-2">
                <EmptyState title="No reviews yet" message="Customer reviews will appear here after completed bookings." />
              </div>
            )}
          </div>
        </section>
      )}

      {activeTab === 'profile' && (
        <form onSubmit={handleProfile} className="max-w-3xl rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-slate-900">Provider Profile</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <FormField
              label="Business name"
              value={profileForm.businessName}
              onChange={(event) => setProfileForm((current) => ({ ...current, businessName: event.target.value }))}
            />
            <div className="flex items-center gap-3">
              <FormField
                label="Available for new bookings"
                type="checkbox"
                checked={profileForm.available}
                onChange={(event) => setProfileForm((current) => ({ ...current, available: event.target.checked }))}
              />
            </div>
          </div>
          <label className="mt-5 block text-sm font-semibold text-slate-700">
            Bio
            <textarea
              rows="4"
              value={profileForm.bio}
              onChange={(event) => setProfileForm((current) => ({ ...current, bio: event.target.value }))}
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-indigo-400"
              placeholder="Describe your business and services..."
            />
          </label>
          <label className="mt-5 block text-sm font-semibold text-slate-700">
            Service work
            <select
              value={profileForm.skills}
              onChange={(event) => setProfileForm((current) => ({ ...current, skills: event.target.value }))}
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-400"
            >
              <option value="">Select your work type</option>
              {SERVICE_CATEGORIES.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </label>
          <FormField
            label="Service areas (comma separated)"
            value={profileForm.serviceAreas}
            onChange={(event) => setProfileForm((current) => ({ ...current, serviceAreas: event.target.value }))}
            placeholder="e.g., Downtown, Suburbs, North Side"
          />
          <Button type="submit" disabled={saving} className="mt-5">Save profile</Button>
        </form>
      )}

      <ConfirmModal
        isOpen={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        onConfirm={confirmModal.onConfirm || (() => {})}
        onClose={() => setConfirmModal({ ...confirmModal, open: false })}
      />

      <Toast message={toast} />
    </div>
  )
}

export default ProviderDashboardNew
