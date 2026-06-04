import { useEffect, useState } from 'react'
import { useFormik } from 'formik'
import { Link, useNavigate, useParams } from 'react-router'
import * as Yup from 'yup'
import { createBooking, getPublicServiceDetails, getServiceReviews } from '../services/dashboardService'
import { getCurrentUser, isAuthenticated, isUser } from '../services/authService'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import ProfileAvatar from '../components/profile/ProfileAvatar'
import useProtectedBooking from '../hooks/useProtectedBooking'

const money = (value) => `Rs. ${Number(value || 0).toLocaleString('en-IN')}`

const bookingSchema = Yup.object({
  date: Yup.string().required('Preferred date and time is required.'),
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
          serviceId: service._id,
          date: values.date,
          address: values.address,
          notes: values.notes,
        })
        setBookingOpen(false)
        resetForm({ values: { date: '', address: getCurrentUser()?.address || '', notes: '' } })
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
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-500">{service.description}</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-4">
            {[
              ['Price', money(service.price)],
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
              onClick={() => {
                requestBooking(() => {
                  bookingFormik.resetForm({ values: { date: '', address: getCurrentUser()?.address || '', notes: '' } })
                  setBookingOpen(true)
                })
              }}
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
