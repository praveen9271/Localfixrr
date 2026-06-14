import { useCallback, useEffect, useRef, useState } from 'react'
import { useFormik } from 'formik'
import { BriefcaseBusiness, Clock, PackageCheck, Plus, Sparkles, Trash2, Wrench } from 'lucide-react'
import { useNavigate } from 'react-router'
import * as Yup from 'yup'
import { syncCurrentUser } from '../services/authService'
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
import useProfilePhotoActions from '../hooks/useProfilePhotoActions'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import DeleteAccountPanel from '../components/account/DeleteAccountPanel'
import ConfirmModal from '../components/ui/ConfirmModal'
import DraggableGrid from '../components/ui/DraggableGrid'
import EmptyState from '../components/ui/EmptyState'
import FormField from '../components/ui/FormField'
import LoadingGrid from '../components/ui/LoadingGrid'
import StatCard from '../components/ui/StatCard'
import StatusBadge from '../components/ui/StatusBadge'
import Toast from '../components/ui/Toast'
import ProfileAvatar from '../components/profile/ProfileAvatar'
import ProfilePhotoPanel from '../components/profile/ProfilePhotoPanel'
import { formatCurrency, formatDateTime, formatStatus } from '../utils/formatters'
import { SERVICE_CATEGORIES } from '../constants/serviceCategories'
import { SERVICE_ITEM_TEMPLATES, getServiceItems, makeBlankServiceItem } from '../utils/serviceItems'

const blankService = {
  title: '',
  category: '',
  price: '',
  location: '',
  description: '',
  image: '',
  status: 'active',
  serviceItems: [
    { name: '', price: '', description: '', duration: '' },
  ],
}

const serviceSchema = Yup.object({
  title: Yup.string().trim().min(3, 'Provider name must be at least 3 characters.').required('Provider name is required.'),
  category: Yup.string().required('Category is required.'),
  price: Yup.number().typeError('Enter a valid price.').min(0, 'Price cannot be negative.').required('Price is required.'),
  location: Yup.string().trim().max(120, 'Location is too long.'),
  description: Yup.string().trim().min(10, 'Description must be at least 10 characters.').required('Description is required.'),
  image: Yup.string().url('Image must be a valid URL.'),
  status: Yup.string().oneOf(['active', 'inactive']).required('Status is required.'),
  serviceItems: Yup.array().of(Yup.object({
    name: Yup.string().trim().required('Item name is required.'),
    price: Yup.number().typeError('Enter price.').min(0, 'Price cannot be negative.').required('Price is required.'),
    description: Yup.string().trim().max(180, 'Description is too long.'),
    duration: Yup.string().trim().max(40, 'Duration is too long.'),
  })).min(1, 'Add at least one service item.'),
})

const providerProfileSchema = Yup.object({
  businessName: Yup.string().trim().min(2, 'Business name is required.').required('Business name is required.'),
  bio: Yup.string().trim().max(600, 'Bio must be 600 characters or less.'),
  serviceAreas: Yup.string().trim().required('Service areas are required.'),
  skills: Yup.string().required('Service work is required.'),
  available: Yup.boolean(),
})

const normalizeServiceIdentity = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const normalizeServiceItems = (items) => {
  const seen = new Set()
  return items.filter((item) => {
    const key = String(item.name || '').trim().toLowerCase()
    if (!key) return true
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

const toDisplayText = (value, fallback = '') => {
  if (value === null || value === undefined) return fallback
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return fallback
}

const cloneServiceItems = (items) => items.map((item) => ({ ...item }))

const getProviderListingTitle = (sourceProfile) =>
  toDisplayText(sourceProfile?.businessName || sourceProfile?.user?.name, '').trim()

function ProviderDashboardNew({ defaultTab = 'bookings' }) {
  const navigate = useNavigate()
  const activeTab = defaultTab
  const [stats, setStats] = useState({})
  const [services, setServices] = useState([])
  const [bookings, setBookings] = useState([])
  const [reviews, setReviews] = useState([])
  const [profile, setProfile] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null })
  const serviceFormRef = useRef(null)

  const showToast = useCallback((message) => {
    setToast(message)
    setTimeout(() => setToast(''), 3000)
  }, [])

  const {
    currentUser: user,
    saveProfilePhoto,
    removeCurrentProfilePhoto,
  } = useProfilePhotoActions({
    onSuccess: (message, updatedUser) => {
      setError('')
      setProfile((current) => current
        ? { ...current, user: { ...(current.user || {}), ...updatedUser } }
        : current)
      showToast(message)
    },
    onError: setError,
  })

  const providerServiceCategories = (profile?.skills || []).filter((category) => SERVICE_CATEGORIES.includes(category))
  const lockedServiceCategory = providerServiceCategories[0] || ''
  const serviceCategoryOptions = providerServiceCategories.length ? providerServiceCategories : SERVICE_CATEGORIES
  const getServiceFormDefaults = (category = lockedServiceCategory) => {
    const defaultCategory = category || ''
    const template = SERVICE_ITEM_TEMPLATES[defaultCategory]
    const serviceItems = template?.length ? cloneServiceItems(template) : [makeBlankServiceItem()]
    const prices = serviceItems.map((item) => Number(item.price)).filter((price) => Number.isFinite(price))

    return {
      ...blankService,
      title: getProviderListingTitle(profile),
      category: defaultCategory,
      price: prices.length ? Math.min(...prices) : '',
      serviceItems,
    }
  }

  const serviceFormik = useFormik({
    initialValues: blankService,
    validationSchema: serviceSchema,
    onSubmit: async (values, { resetForm }) => {
      if (lockedServiceCategory && values.category !== lockedServiceCategory) {
        showToast(`You can only add ${lockedServiceCategory} services`)
        return
      }

      const duplicateService = services.find((service) =>
        service._id !== editingId &&
        normalizeServiceIdentity(service.title) === normalizeServiceIdentity(values.title) &&
        service.category === values.category,
      )

      if (duplicateService) {
        showToast('You already have this service listed in the same category')
        return
      }

      setSaving(true)
      try {
        const serviceItems = normalizeServiceItems(values.serviceItems).map((item) => ({
          ...item,
          price: Number(item.price),
        }))
        const payload = {
          ...values,
          price: Number(values.price),
          serviceItems,
        }
        if (editingId) {
          await updateService(editingId, payload)
          showToast('Service updated')
        } else {
          await createService(payload)
          showToast('Service created')
        }
        resetForm({ values: getServiceFormDefaults(lockedServiceCategory || values.category) })
        setEditingId(null)
        await loadDashboard()
      } catch (err) {
        showToast(err.response?.data?.message || 'Unable to save service')
      } finally {
        setSaving(false)
      }
    },
  })

  const currentTemplateItems = SERVICE_ITEM_TEMPLATES[serviceFormik.values.category] || []
  const currentServiceItems = serviceFormik.values.serviceItems || []
  const defaultItemNames = new Set(currentTemplateItems.map((item) => item.name.trim().toLowerCase()))
  const defaultPackageCount = currentServiceItems.filter((item) => defaultItemNames.has(String(item.name || '').trim().toLowerCase())).length
  const serviceItemPrices = currentServiceItems
    .map((item) => Number(item.price))
    .filter((price) => Number.isFinite(price) && price >= 0)
  const startingPrice = serviceItemPrices.length ? Math.min(...serviceItemPrices) : 0
  const selectedServiceCategory = serviceFormik.values.category || lockedServiceCategory || 'Not selected'

  const profileFormik = useFormik({
    initialValues: { businessName: '', bio: '', serviceAreas: '', skills: '', available: true },
    validationSchema: providerProfileSchema,
    onSubmit: async (values) => {
      setSaving(true)
      setError('')
      try {
        const response = await updateProviderProfile({
          businessName: values.businessName,
          bio: values.bio,
          serviceAreas: values.serviceAreas.split(',').map((item) => item.trim()).filter(Boolean),
          skills: values.skills ? [values.skills] : [],
          available: values.available,
        })
        const updatedProvider = response.provider
        const providerUser = updatedProvider?.user
        if (user) {
          syncCurrentUser({
            ...user,
            name: providerUser?.name || user.name,
            email: providerUser?.email || user.email,
            phone: providerUser?.phone || user.phone,
            address: providerUser?.address || user.address,
            avatar: providerUser?.avatar || user.avatar || '',
          })
        }
        if (updatedProvider) {
          setProfile(updatedProvider)
          providerProfileSetValuesRef.current({
            businessName: updatedProvider.businessName || '',
            bio: updatedProvider.bio || '',
            serviceAreas: (updatedProvider.serviceAreas || []).join(', '),
            skills: (updatedProvider.skills || []).join(', '),
            available: Boolean(updatedProvider.available),
          })
        }
        showToast('Profile updated')
        await loadDashboard()
      } catch (err) {
        showToast(err.response?.data?.message || 'Unable to update profile')
      } finally {
        setSaving(false)
      }
    },
  })
  const providerProfileSetValuesRef = useRef(profileFormik.setValues)
  const serviceFormikRef = useRef(serviceFormik)

  useEffect(() => {
    providerProfileSetValuesRef.current = profileFormik.setValues
  }, [profileFormik.setValues])

  useEffect(() => {
    serviceFormikRef.current = serviceFormik
  }, [serviceFormik])

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
      providerProfileSetValuesRef.current({
        businessName: nextProfile?.businessName || '',
        bio: nextProfile?.bio || '',
        serviceAreas: (nextProfile?.serviceAreas || []).join(', '),
        skills: (nextProfile?.skills || []).join(', '),
        available: Boolean(nextProfile?.available),
      })
      const registeredCategory = (nextProfile?.skills || []).find((category) => SERVICE_CATEGORIES.includes(category))
      const providerTitle = getProviderListingTitle(nextProfile)
      if (providerTitle && !serviceFormikRef.current.values.title.trim()) {
        serviceFormikRef.current.setFieldValue('title', providerTitle)
      }
      if (registeredCategory && !serviceFormikRef.current.values.category) {
        const template = SERVICE_ITEM_TEMPLATES[registeredCategory]
        const nextItems = template?.length ? cloneServiceItems(template) : [makeBlankServiceItem()]
        const prices = nextItems.map((item) => Number(item.price)).filter((price) => Number.isFinite(price))
        serviceFormikRef.current.setFieldValue('category', registeredCategory)
        serviceFormikRef.current.setFieldValue('serviceItems', nextItems)
        serviceFormikRef.current.setFieldValue('price', prices.length ? Math.min(...prices) : '')
      }
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
  }, [showToast])

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
    serviceFormik.resetForm({ values: getServiceFormDefaults() })
    setEditingId(null)
  }

  const setServiceItemsAndPrice = (items) => {
    const nextItems = normalizeServiceItems(items)
    serviceFormik.setFieldValue('serviceItems', nextItems.length ? nextItems : [makeBlankServiceItem()])
    const prices = nextItems.map((item) => Number(item.price)).filter((price) => Number.isFinite(price))
    serviceFormik.setFieldValue('price', prices.length ? Math.min(...prices) : '')
  }

  const setServiceItemField = (index, field, value) => {
    const nextItems = [...serviceFormik.values.serviceItems]
    nextItems[index] = { ...nextItems[index], [field]: value }
    if (field === 'name') {
      const duplicate = nextItems.some((item, itemIndex) =>
        itemIndex !== index &&
        item.name?.trim().toLowerCase() &&
        item.name.trim().toLowerCase() === value.trim().toLowerCase(),
      )
      if (duplicate) showToast('This item is already added')
    }
    serviceFormik.setFieldValue('serviceItems', nextItems)
    if (field === 'price') {
      const prices = nextItems.map((item) => Number(item.price)).filter((price) => Number.isFinite(price))
      if (prices.length) serviceFormik.setFieldValue('price', Math.min(...prices))
    }
  }

  const addServiceItem = () => {
    setServiceItemsAndPrice([...serviceFormik.values.serviceItems, makeBlankServiceItem()])
  }

  const removeServiceItem = (index) => {
    const nextItems = serviceFormik.values.serviceItems.filter((_, itemIndex) => itemIndex !== index)
    setServiceItemsAndPrice(nextItems)
  }

  const removeServiceImage = async (serviceId = editingId) => {
    serviceFormik.setFieldValue('image', '')
    if (!serviceId) return

    setSaving(true)
    try {
      await updateService(serviceId, { image: '' })
      showToast('Service image removed')
      await loadDashboard()
    } catch (err) {
      showToast(err.response?.data?.message || 'Unable to remove image')
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (service) => {
    setEditingId(service._id)
    serviceFormik.resetForm({ values: {
      title: service.title || '',
      category: service.category || '',
      price: service.price || '',
      location: service.location || '',
      description: service.description || '',
      image: service.image || '',
      status: service.status || 'active',
      serviceItems: getServiceItems(service).map((item) => ({
        name: item.name || '',
        price: item.price || '',
        description: item.description || '',
        duration: item.duration || '',
      })),
    } })
    navigate('/dashboard/provider/services')
    requestAnimationFrame(() => {
      serviceFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
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
      showToast(`Booking ${formatStatus(status)}`)
      await loadDashboard()
    } catch (err) {
      showToast(err.response?.data?.message || 'Unable to update booking')
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

  const statCards = [
    { id: 'services', label: 'Services', value: stats.totalServices || 0 },
    { id: 'active', label: 'Active', value: stats.activeServices || 0 },
    { id: 'pending', label: 'Pending', value: stats.pendingBookings || 0 },
    { id: 'completed', label: 'Completed', value: stats.completedBookings || 0 },
    { id: 'earnings', label: 'Earnings', value: formatCurrency(stats.totalEarnings) },
  ]

  return (
    <div className="space-y-8">
      <div>
        {activeTab === 'services' ? (
          <>
            <h1 className="text-3xl font-black text-slate-900">{editingId ? 'Edit Service' : 'Add Service'}</h1>
            <p className="mt-1 text-slate-500">Add service details and manage packages.</p>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">LocalFixr Provider Panel</p>
            <h1 className="mt-2 text-3xl font-black text-slate-900">Service Provider Dashboard</h1>
            <p className="mt-1 text-slate-500">Manage services, booking requests, earnings, and reviews.</p>
          </>
        )}
      </div>

      <Alert>{error}</Alert>

      {activeTab !== 'services' && (
        <DraggableGrid
          items={statCards}
          storageKey="localfixr-provider-dashboard-card-order"
          className="grid gap-4 md:grid-cols-5"
          renderItem={(card) => <StatCard label={card.label} value={card.value} />}
        />
      )}

      {activeTab === 'bookings' && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-black text-slate-900">Booking Requests</h2>
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-slate-500">
                {bookings.filter(b => b.status === 'pending').length} Pending
              </span>
              <span className="text-sm font-semibold text-slate-500">
                {bookings.filter(b => b.status === 'in_progress').length} In Progress
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
                      <div className="flex min-w-0 items-center gap-3">
                        <ProfileAvatar src={booking.customer?.avatar} name={booking.customer?.name} email={booking.customer?.email} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">{booking.customer?.name}</p>
                          <p className="truncate text-xs text-slate-500">{booking.customer?.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      <p className="font-semibold text-slate-900">{booking.service?.title}</p>
                      {booking.serviceItem?.name && (
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold">
                          <span className="text-indigo-600">Booked: {booking.serviceItem.name}</span>
                          {booking.serviceItem.price !== undefined && (
                            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-indigo-700">
                              {formatCurrency(booking.serviceItem.price)}
                            </span>
                          )}
                          {booking.serviceItem.duration && <span className="text-slate-500">{booking.serviceItem.duration}</span>}
                        </div>
                      )}
                    </td>
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
        <section className="space-y-6">
          <form ref={serviceFormRef} onSubmit={serviceFormik.handleSubmit} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="space-y-6 p-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="grid gap-4 lg:grid-cols-[1fr_12rem_2fr]">
                  <div>
                    <FormField
                      name="title"
                      label={<>Provider Name<span className="text-rose-500"> *</span></>}
                      type="text"
                      placeholder="Enter provider name"
                      value={serviceFormik.values.title}
                      onChange={serviceFormik.handleChange}
                      onBlur={serviceFormik.handleBlur}
                    />
                    {serviceFormik.touched.title && serviceFormik.errors.title && (
                      <span className="mt-2 block text-xs font-semibold text-rose-600">{serviceFormik.errors.title}</span>
                    )}
                  </div>

                  <label className="block text-sm font-semibold text-slate-700">
                    Status
                    <select
                      name="status"
                      value={serviceFormik.values.status}
                      onChange={serviceFormik.handleChange}
                      onBlur={serviceFormik.handleBlur}
                      className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-indigo-400"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </label>
                  <label className="block text-sm font-semibold text-slate-700">
                    Description <span className="text-rose-500">*</span>
                    <textarea
                      name="description"
                      rows="1"
                      value={serviceFormik.values.description}
                      onChange={serviceFormik.handleChange}
                      onBlur={serviceFormik.handleBlur}
                      className={`mt-2 w-full rounded-lg border px-4 py-3 outline-none focus:border-indigo-400 ${
                        serviceFormik.touched.description && serviceFormik.errors.description ? 'border-rose-300 bg-rose-50' : 'border-slate-200'
                      }`}
                    />
                    {serviceFormik.touched.description && serviceFormik.errors.description && (
                      <span className="mt-2 block text-xs font-semibold text-rose-600">{serviceFormik.errors.description}</span>
                    )}
                  </label>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-4">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-indigo-50 text-indigo-700">
                      <BriefcaseBusiness className="h-6 w-6" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-slate-500">Total Packages</p>
                      <p className="mt-1 text-2xl font-black text-slate-950">{currentServiceItems.length}</p>
                      <p className="mt-1 text-xs font-bold text-indigo-600">{defaultPackageCount} default packages</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-4">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-emerald-700">
                      <Sparkles className="h-6 w-6" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-slate-500">Starting From</p>
                      <p className="mt-1 text-2xl font-black text-slate-950">{formatCurrency(startingPrice)}</p>
                      <p className="mt-1 text-xs font-bold text-slate-500">Minimum package price</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-4">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-sky-50 text-sky-700">
                      <Wrench className="h-6 w-6" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-500">Work Type</p>
                      <p className="mt-1 truncate text-2xl font-black text-indigo-700">{selectedServiceCategory}</p>
                      <p className="mt-1 text-xs font-bold text-slate-500">Current category</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="space-y-3 p-5">
                  {currentServiceItems.map((item, index) => {
                    const isDefaultPackage = defaultItemNames.has(String(item.name || '').trim().toLowerCase())
                    return (
                      <div key={`service-package-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="grid gap-4 lg:grid-cols-[auto_1.1fr_0.45fr_0.55fr_auto] lg:items-center">
                          <div className="flex items-center">
                            <span className="grid h-12 w-12 place-items-center rounded-full bg-indigo-50 text-indigo-700">
                              {isDefaultPackage ? <PackageCheck className="h-6 w-6" /> : <BriefcaseBusiness className="h-6 w-6" />}
                            </span>
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <input
                                value={item.name}
                                onChange={(event) => setServiceItemField(index, 'name', event.target.value)}
                                placeholder="Package name"
                                className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-0 py-1 text-base font-black text-slate-950 outline-none transition focus:border-indigo-200 focus:bg-white focus:px-3"
                              />
                              <span className={`rounded-full px-2.5 py-1 text-xs font-black ${isDefaultPackage ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                {isDefaultPackage ? 'Default' : 'Custom'}
                              </span>
                            </div>
                            <input
                              value={item.description}
                              onChange={(event) => setServiceItemField(index, 'description', event.target.value)}
                              placeholder="Package description"
                              className="mt-1 w-full rounded-lg border border-transparent bg-transparent px-0 py-1 text-sm font-medium text-slate-500 outline-none transition focus:border-indigo-200 focus:bg-white focus:px-3"
                            />
                          </div>

                          <label className="block">
                            <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">Price</span>
                            <input
                              value={item.price}
                              onChange={(event) => setServiceItemField(index, 'price', event.target.value)}
                              placeholder="499"
                              type="number"
                              min="0"
                              className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-black text-slate-950 outline-none focus:border-indigo-400 focus:bg-white"
                            />
                          </label>

                          <label className="block">
                            <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                              <Clock className="h-3.5 w-3.5" />
                              Duration
                            </span>
                            <input
                              value={item.duration}
                              onChange={(event) => setServiceItemField(index, 'duration', event.target.value)}
                              placeholder="60 min"
                              className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-black text-slate-950 outline-none focus:border-indigo-400 focus:bg-white"
                            />
                          </label>

                          <button
                            type="button"
                            onClick={() => removeServiceItem(index)}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-rose-100 bg-rose-50 px-3 text-xs font-black text-rose-600 transition hover:bg-rose-100"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {serviceFormik.touched.serviceItems && typeof serviceFormik.errors.serviceItems === 'string' && (
                  <span className="block px-5 pb-5 text-xs font-semibold text-rose-600">{serviceFormik.errors.serviceItems}</span>
                )}
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-5">
                {editingId && <Button variant="secondary" onClick={resetServiceForm}>Cancel</Button>}
                <button
                  type="button"
                  onClick={addServiceItem}
                  className="inline-flex h-11 min-w-36 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4" />
                  Add Package
                </button>
                <Button type="submit" disabled={saving} className="h-11 min-w-36 rounded-xl px-5 text-sm font-semibold">
                  {editingId ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </form>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-black text-slate-900">My Services</h2>
              <span className="text-sm font-semibold text-slate-500">{services.length} Services</span>
            </div>
            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              {services.map((service) => (
                <article key={service._id} className="rounded-lg border border-slate-200 p-4 transition hover:shadow-md">
                  {service.image && (
                    <div className="mb-4 overflow-hidden rounded-lg border border-slate-200">
                      <img
                        src={service.image}
                        alt={service.title}
                        className="h-32 w-full object-cover"
                        loading="lazy"
                      />
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => removeServiceImage(service._id)}
                        className="w-full bg-slate-50 px-3 py-2 text-left text-xs font-bold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
                      >
                        Remove image
                      </button>
                    </div>
                  )}
                  <div className="flex justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-slate-900">{toDisplayText(service.title, 'Untitled service')}</h3>
                      <p className="mt-1 text-sm text-slate-500">{toDisplayText(service.category, 'General')}</p>
                    </div>
                    <StatusBadge status={service.status} />
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-slate-600">
                    {toDisplayText(service.description, 'No description available.')}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-black text-indigo-700">From {formatCurrency(service.price)}</span>
                    {toDisplayText(service.location) && <span className="text-xs text-slate-500">{toDisplayText(service.location)}</span>}
                  </div>
                  <div className="mt-3 rounded-lg bg-slate-50 p-3">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Packages</p>
                    <div className="mt-2 space-y-1.5">
                      {getServiceItems(service).slice(0, 3).map((item, index) => (
                        <div key={`${service._id}-${item.name || index}`} className="flex items-center justify-between gap-3 text-xs">
                          <span className="truncate font-semibold text-slate-700">{item.name}</span>
                          <span className="shrink-0 font-black text-slate-900">{formatCurrency(item.price)}</span>
                        </div>
                      ))}
                    </div>
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
                Average: {profile?.rating ? `${profile.rating.toFixed(1)} / 5` : 'No ratings yet'}
              </span>
              <span className="text-sm font-semibold text-slate-500">
                {reviews.length} Total
              </span>
            </div>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {reviews.map((review) => (
              <article key={review._id} className="rounded-lg border border-slate-200 p-4 hover:shadow-md transition">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-slate-900">{review.service?.title}</h3>
                    <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                      <ProfileAvatar src={review.user?.avatar} name={review.user?.name} email={review.user?.email} size="xs" />
                      <span>By {review.user?.name}</span>
                    </div>
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
        <div className="max-w-3xl space-y-6">
          <ProfilePhotoPanel
            user={{ ...user, avatar: profile?.user?.avatar || user?.avatar }}
            onSavePhoto={saveProfilePhoto}
            onRemovePhoto={removeCurrentProfilePhoto}
            disabled={saving}
            compact
          />

          <form onSubmit={profileFormik.handleSubmit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black text-slate-900">Provider Profile</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <FormField
                name="businessName"
                label={<>Business name <span className="text-rose-500">*</span></>}
                value={profileFormik.values.businessName}
                onChange={profileFormik.handleChange}
                onBlur={profileFormik.handleBlur}
              />
              <div className="flex items-center gap-3">
                <FormField
                  label="Available for new bookings"
                  type="checkbox"
                  name="available"
                  checked={profileFormik.values.available}
                  onChange={profileFormik.handleChange}
                />
              </div>
            </div>
            {profileFormik.touched.businessName && profileFormik.errors.businessName && (
              <span className="mt-2 block text-xs font-semibold text-rose-600">{profileFormik.errors.businessName}</span>
            )}
            <label className="mt-5 block text-sm font-semibold text-slate-700">
              Bio
              <textarea
                name="bio"
                rows="4"
                value={profileFormik.values.bio}
                onChange={profileFormik.handleChange}
                onBlur={profileFormik.handleBlur}
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-indigo-400"
                placeholder="Describe your business and services..."
              />
              {profileFormik.touched.bio && profileFormik.errors.bio && (
                <span className="mt-2 block text-xs font-semibold text-rose-600">{profileFormik.errors.bio}</span>
              )}
            </label>
            <label className="mt-5 block text-sm font-semibold text-slate-700">
              Service work <span className="text-rose-500">*</span>
              <select
                name="skills"
                value={profileFormik.values.skills}
                onChange={profileFormik.handleChange}
                onBlur={profileFormik.handleBlur}
                disabled={Boolean(lockedServiceCategory)}
                className={`mt-2 w-full rounded-lg border px-4 py-3 outline-none transition focus:border-indigo-400 ${
                  profileFormik.touched.skills && profileFormik.errors.skills ? 'border-rose-300 bg-rose-50' : 'border-slate-200'
                }`}
              >
                {!lockedServiceCategory && <option value="">Select your work type</option>}
                {serviceCategoryOptions.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              {lockedServiceCategory && (
                <span className="mt-2 block text-xs font-semibold text-slate-500">
                  Service work cannot be changed after registration.
                </span>
              )}
              {profileFormik.touched.skills && profileFormik.errors.skills && (
                <span className="mt-2 block text-xs font-semibold text-rose-600">{profileFormik.errors.skills}</span>
              )}
            </label>
            <FormField
              name="serviceAreas"
              label={<>Service areas (comma separated) <span className="text-rose-500">*</span></>}
              value={profileFormik.values.serviceAreas}
              onChange={profileFormik.handleChange}
              onBlur={profileFormik.handleBlur}
              placeholder="Enter service areas separated by commas"
            />
            {profileFormik.touched.serviceAreas && profileFormik.errors.serviceAreas && (
              <span className="mt-2 block text-xs font-semibold text-rose-600">{profileFormik.errors.serviceAreas}</span>
            )}
            <Button type="submit" disabled={saving} className="mt-5">Save Profile</Button>
          </form>

          <DeleteAccountPanel userRole="service_provider" onError={setError} />
        </div>
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
