import { Star } from 'lucide-react'

const sizeClasses = {
  xs: 'h-3.5 w-3.5',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
}

function StarRating({ value = 0, size = 'sm', className = '' }) {
  const rating = Math.min(5, Math.max(0, Number(value) || 0))
  const iconClassName = sizeClasses[size] || sizeClasses.sm
  const ratingLabel = Number.isInteger(rating) ? rating : rating.toFixed(1)

  return (
    <div
      className={`inline-flex shrink-0 items-center gap-0.5 ${className}`}
      role="img"
      aria-label={`${ratingLabel} out of 5 stars`}
      title={`${ratingLabel} out of 5 stars`}
    >
      {[0, 1, 2, 3, 4].map((index) => {
        const fillPercentage = Math.min(100, Math.max(0, (rating - index) * 100))

        return (
          <span key={index} className={`relative block ${iconClassName}`}>
            <Star className={`absolute inset-0 ${iconClassName} text-slate-300`} />
            <span
              className="absolute inset-y-0 left-0 overflow-hidden"
              style={{ width: `${fillPercentage}%` }}
            >
              <Star className={`${iconClassName} fill-amber-400 text-amber-400`} />
            </span>
          </span>
        )
      })}
    </div>
  )
}

export default StarRating
