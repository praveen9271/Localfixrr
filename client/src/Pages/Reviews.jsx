import { useEffect, useState } from 'react'
import { getPublicServices } from '../services/dashboardService'
import LoadingGrid from '../components/ui/LoadingGrid'
import EmptyState from '../components/ui/EmptyState'

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function Reviews() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadReviews = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getPublicServices()
      const serviceReviews = (data.services || [])
        .filter((service) => Number(service.rating || 0) > 0 || Number(service.reviewsCount || 0) > 0)
        .map((service) => ({
          _id: service._id,
          rating: Math.round(Number(service.rating || 0)),
          comment: `${service.provider?.businessName || service.provider?.user?.name || 'A local provider'} is rated highly for ${service.title}.`,
          createdAt: service.updatedAt || service.createdAt,
          user: { name: 'LocalFixr customer' },
          service,
          provider: service.provider,
        }))
      setReviews(serviceReviews)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadReviews()
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-black text-slate-900">Customer Reviews</h1>
          <p className="mt-2 text-slate-500">Loading reviews...</p>
        </div>
        <div className="mt-8">
          <LoadingGrid count={6} columns="lg:grid-cols-2" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-3xl font-black text-slate-900">Customer Reviews</h1>
        <p className="mt-2 text-slate-500">
          {reviews.length > 0
            ? `See what ${reviews.length} customers are saying about our services`
            : 'No reviews yet. Be the first to share your experience!'}
        </p>
      </div>

      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {reviews.map((review) => (
          <article
            key={review._id}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-indigo-100 text-indigo-600 font-bold">
                  {(review.user?.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {review.user?.name || 'Anonymous'}
                  </h3>
                  <p className="text-xs text-slate-500">{formatDate(review.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                <span className="ml-1 text-sm font-semibold text-amber-600">
                  {review.rating}/5
                </span>
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              {review.comment}
            </p>

            <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4">
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                {review.service?.title || 'Service'}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {review.service?.category || 'General'}
              </span>
              <span className="text-xs text-slate-400">
                by {review.provider?.businessName || 'Provider'}
              </span>
            </div>
          </article>
        ))}
      </div>

      {reviews.length === 0 && !error && (
        <div className="mt-8">
          <EmptyState
            title="No reviews yet"
            message="Reviews will appear here once customers start sharing their experiences."
          />
        </div>
      )}
    </div>
  )
}

export default Reviews
