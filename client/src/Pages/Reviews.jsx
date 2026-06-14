import { useEffect, useState } from 'react'
import { getPublicServices, getServiceReviews } from '../services/dashboardService'
import LoadingGrid from '../components/ui/LoadingGrid'
import EmptyState from '../components/ui/EmptyState'
import ProfileAvatar from '../components/profile/ProfileAvatar'
import StarRating from '../components/ui/StarRating'

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
      const data = await getPublicServices({ page: 1, limit: 6 })
      const reviewGroups = await Promise.all(
        (data.services || []).map(async (service) => {
          try {
            const response = await getServiceReviews(service._id, { page: 1, limit: 3 })
            return (response.reviews || []).map((review) => ({
              ...review,
              service,
              provider: service.provider,
            }))
          } catch {
            return []
          }
        }),
      )
      setReviews(reviewGroups.flat())
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
                <ProfileAvatar src={review.user?.avatar} name={review.user?.name} size="sm" />
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {review.user?.name || 'Anonymous'}
                  </h3>
                  <p className="text-xs text-slate-500">{formatDate(review.createdAt)}</p>
                </div>
              </div>
              <div className="rounded-full bg-amber-50 px-3 py-1.5">
                <StarRating value={review.rating} />
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              {review.comment}
            </p>

            {(review.service?.title ||
              review.service?.category ||
              review.provider?.businessName) && (
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                {review.service?.title && (
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                    {review.service.title}
                  </span>
                )}
                {review.service?.category && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {review.service.category}
                  </span>
                )}
                {review.provider?.businessName && (
                  <span className="text-xs text-slate-400">
                    by {review.provider.businessName}
                  </span>
                )}
              </div>
            )}
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
