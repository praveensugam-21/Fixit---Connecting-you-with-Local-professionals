interface RatingStarsProps {
  rating: number
  count?: number
}

export function RatingStars({ rating, count }: RatingStarsProps) {
  const rounded = Math.round(rating)

  return (
    <span className="inline-flex items-center gap-1 text-sm text-slate-600">
      <span className="text-amber-500" aria-hidden="true">
        {'★'.repeat(rounded)}
        {'☆'.repeat(5 - rounded)}
      </span>
      <span>
        {rating > 0 ? rating.toFixed(1) : 'New'}
        {typeof count === 'number' ? ` (${count})` : ''}
      </span>
    </span>
  )
}
