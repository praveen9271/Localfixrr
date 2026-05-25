import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { createBooking, getPublicServiceDetails, getServiceReviews } from '../services/dashboardService'
import { getCurrentUser, isAuthenticated, isUser } from '../services/authService'

const money = (value) => `Rs. ${Number(value || 0).toLocaleString('en-IN')}`

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
  const [bookingForm, setBookingForm] = useState({ date: '', address: getCurrentUser()?.address || '', notes: '' })

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(''), 3000)
  }

  useEffect(() => {
    const loadDetails = async () => {
      setLoading(true)
      setError('')
      try {
        const [serviceData, reviewsData] = await Promise.all([
          getPublicServiceDetails(id),
          getServiceReviews(id),
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
        serviceId: service._id,
        date: bookingForm.date,
        address: bookingForm.address,
        notes: bookingForm.notes,
      })
      setBookingOpen(false)
      setBookingForm({ date: '', address: getCurrentUser()?.address || '', notes: '' })
      showToast('Booking request sent')
    } catch (err) {
      showToast(err.response?.data?.message || 'Booking failed')
    } finally {
      setSaving(false)
    }
  }

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
            <img src={service.image} alt={service.title} className="h-96 w-full rounded-lg object-cover" />
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
            <button type="button" onClick={() => setBookingOpen(true)} className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white">
              Book service
            </button>
          </div>
        </div>
      </section>

      <section className="mt-10 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black text-slate-900">Reviews</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {reviews.map((review) => (
            <article key={review._id} className="rounded-lg bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-4">
                <p className="font-bold text-slate-900">{review.user?.name || 'Customer'}</p>
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
          <form onSubmit={handleBooking} className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-2xl font-black text-slate-900">Book {service.title}</h2>
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
              <button type="button" onClick={() => setBookingOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 font-semibold">Close</button>
              <button disabled={saving} className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white disabled:opacity-60">
                {saving ? 'Sending...' : 'Confirm booking'}
              </button>
            </div>
          </form>
        </div>
      )}

      {toast && <div className="fixed bottom-5 right-5 z-50 rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-lg">{toast}</div>}
    </main>
  )
}

export default ProviderDetails
