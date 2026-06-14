import { useEffect, useState } from 'react'
import { useFormik } from 'formik'
import { CheckCircle2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router'
import * as Yup from 'yup'
import { createBooking, getPublicServiceDetails, getServiceReviews } from '../services/dashboardService'
import { getCurrentUser, isAuthenticated, isUser } from '../services/authService'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import ProfileAvatar from '../components/profile/ProfileAvatar'
import useProtectedBooking from '../hooks/useProtectedBooking'
import { getServiceItems, getStartingPrice } from '../utils/serviceItems'
import { formatCurrency, getLocalDateTimeInputValue } from '../utils/formatters'

const bookingSchema = Yup.object({
  date: Yup.string()
    .required('Preferred date and time is required.')
    .test('future-date', 'Please select today or a future date and time.', (value) => !value || new Date(value) >= new Date()),
  address: Yup.string().trim().min(5, 'Enter a complete service address.').required('Address is required.'),
  notes: Yup.string().max(500, 'Notes must be 500 characters or less.'),
})

function ProviderDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [service, setService] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [bookingOpen, setBookingOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(''), 3000)
  }

  const {
    closeLoginPrompt,
    goToLogin,
    loginPromptOpen,
    requestBooking,
  } = useProtectedBooking({ onToast: showToast })

  useEffect(() => {
    const loadDetails = async () => {
      setLoading(true)
      setError('')
      try {
        const [serviceData, reviewsData] = await Promise.all([
          getPublicServiceDetails(id),
          getServiceReviews(id, { page: 1, limit: 10 }),
        ])
        setService(serviceData.service)
        setReviews(reviewsData.reviews || [])
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load service')
      } finally {
        setLoading(false)
      }
    }

    loadDetails()
  }, [id])

  const bookingFormik = useFormik({
    initialValues: { serviceItemId: '', date: '', address: getCurrentUser()?.address || '', notes: '' },
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
          serviceId: service._id,
          serviceItemId: values.serviceItemId,
          date: values.date,
          address: values.address,
          notes: values.notes,
        })
        setBookingOpen(false)
        resetForm({ values: { serviceItemId: '', date: '', address: getCurrentUser()?.address || '', notes: '' } })
        showToast('Booking request sent')
      } catch (err) {
        showToast(err.response?.data?.message || 'Booking failed')
      } finally {
        setSaving(false)
      }
    },
  })

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="h-8 w-40 animate-pulse rounded bg-slate-200" />
        <div className="mt-8 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="h-96 animate-pulse rounded-lg bg-slate-200" />
          <div className="space-y-4">
            <div className="h-12 animate-pulse rounded bg-slate-200" />
            <div className="h-24 animate-pulse rounded bg-slate-200" />
          </div>
        </div>
      </main>
    )
  }

  if (error || !service) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="text-4xl font-black text-slate-900">Service not found</h1>
        <p className="mt-3 text-slate-500">{error}</p>
        <button onClick={() => navigate('/services')} className="mt-6 rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white">
          Browse services
        </button>
      </main>
    )
  }

  const provider = service.provider
  const phone = provider?.user?.phone
  const serviceItems = getServiceItems(service)
  const startingPrice = getStartingPrice(service)
  const selectedItem = serviceItems.find((item) => (item._id || item.name) === bookingFormik.values.serviceItemId) || serviceItems[0]
  const openBookingWithItem = (item = serviceItems[0]) => {
    requestBooking(() => {
      bookingFormik.resetForm({
        values: {
          serviceItemId: item?._id || item?.name || '',
          date: '',
          address: getCurrentUser()?.address || '',
          notes: '',
        },
      })
      setBookingOpen(true)
    })
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <Link to="/services" className="inline-flex rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-700">
        Back to services
      </Link>

      <section className="mt-8 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          {service.image ? (
            <img
              src={service.image}
              alt={service.title}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="h-96 w-full rounded-lg object-cover"
            />
          ) : (
            <div className="grid h-96 place-items-center rounded-lg bg-indigo-50 text-6xl font-black text-indigo-600">
              {service.title?.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        <div className="self-center">
          <span className={`rounded-full px-4 py-2 text-sm font-semibold ${provider?.available ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
            {provider?.available ? 'Available' : 'Busy'}
          </span>
          <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">{service.title}</h1>
          <p className="mt-3 text-xl font-semibold text-indigo-600">{service.category}</p>
          <p className="mt-4 inline-flex rounded-full bg-indigo-50 px-4 py-2 text-lg font-black text-indigo-700">
            Starting From {formatCurrency(startingPrice)}
          </p>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-500">{service.description}</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-4">
            {[
              ['Starting Price', formatCurrency(startingPrice)],
              ['Rating', `${service.rating || 0}/5`],
              ['Reviews', service.reviewsCount || 0],
              ['Location', service.location || provider?.user?.address || 'Local'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-2 text-lg font-black text-slate-900">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-slate-900">Included Services</h2>
                <p className="mt-1 text-sm text-slate-500">Select the exact service item before booking.</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-700">
                {serviceItems[0]?.duration || `${service.duration || 60} min`}
              </span>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {serviceItems.map((item, index) => (
                <button
                  key={item._id || item.name}
                  type="button"
                  onClick={() => openBookingWithItem(item)}
                  className="group rounded-xl border border-slate-100 bg-slate-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-white hover:shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="inline-flex items-start gap-2 font-black text-slate-900">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        <span>{item.name}</span>
                      </p>
                      {item.description && <p className="mt-1 text-sm leading-6 text-slate-500">{item.description}</p>}
                      {item.duration && <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{item.duration}</p>}
                      <p className="mt-3 text-xs font-black text-indigo-600 opacity-0 transition group-hover:opacity-100">Click to book this item</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-black ${index === 0 ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-700 ring-1 ring-indigo-100'}`}>
                      {formatCurrency(item.price)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-black text-slate-900">{provider?.businessName || provider?.user?.name || 'Provider'}</h2>
            <p className="mt-2 text-sm text-slate-600">{provider?.bio || 'This provider has not added a bio yet.'}</p>
            <p className="mt-3 text-sm text-slate-500">{provider?.user?.email} {phone ? `- ${phone}` : ''}</p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {phone && (
              <a href={`tel:${phone}`} className="rounded-lg border border-emerald-200 bg-emerald-50 px-6 py-3 font-semibold text-emerald-700">
                Call provider
              </a>
            )}
            <button
              type="button"
              onClick={() => openBookingWithItem(serviceItems[0])}
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
            >
              Book service
            </button>
          </div>
        </div>
      </section>

      <Modal isOpen={loginPromptOpen} title="Login Required" onClose={closeLoginPrompt}>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Please sign in before booking a service. You can continue booking after login.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={closeLoginPrompt}>Cancel</Button>
          <Button onClick={goToLogin}>Login</Button>
        </div>
      </Modal>

      <section className="mt-10 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black text-slate-900">Reviews</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {reviews.map((review) => (
            <article key={review._id} className="rounded-lg bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <ProfileAvatar src={review.user?.avatar} name={review.user?.name} size="sm" />
                  <p className="truncate font-bold text-slate-900">{review.user?.name || 'Customer'}</p>
                </div>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-bold text-amber-700">{review.rating}/5</span>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-600">{review.comment}</p>
            </article>
          ))}
          {reviews.length === 0 && <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500 md:col-span-2">No reviews yet.</div>}
        </div>
      </section>

      {bookingOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 px-4">
          <form onSubmit={bookingFormik.handleSubmit} className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-2xl font-black text-slate-900">Book {service.title}</h2>
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-black text-slate-900">Select service item</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">Select one item. This exact service will be sent to the provider.</p>
              <div className="mt-3 grid gap-2">
                {serviceItems.map((item) => {
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
                <span className="font-black text-slate-950">{formatCurrency(selectedItem?.price || startingPrice)}</span>
              </div>
            </div>
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
              <button type="button" onClick={() => setBookingOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 font-semibold">Close</button>
              <button disabled={saving} className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white disabled:opacity-60">
                {saving && <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white align-[-0.125em]" />}
                {saving ? 'Sending...' : 'Confirm Booking'}
              </button>
            </div>
          </form>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}
    </main>
  )
}

export default ProviderDetails
