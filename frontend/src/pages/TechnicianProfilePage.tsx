import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { techniciansApi } from '../api/technicians'
import { RatingStars } from '../components/common/RatingStars'
import type { Review, TechnicianProfile } from '../types'

export function TechnicianProfilePage() {
  const { technicianId } = useParams<{ technicianId: string }>()
  const [profile, setProfile] = useState<TechnicianProfile | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!technicianId) return
    techniciansApi
      .getById(technicianId)
      .then(setProfile)
      .catch(() => setError('Technician not found'))
    techniciansApi.reviews(technicianId).then(setReviews).catch(() => setReviews([]))
  }, [technicianId])

  if (error) {
    return <div className="p-8 text-center text-red-600">{error}</div>
  }
  if (!profile) {
    return <div className="p-8 text-center text-slate-500">Loading...</div>
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{profile.full_name}</h1>
            <RatingStars rating={profile.avg_rating} count={profile.rating_count} />
            {profile.verification_status === 'approved' && (
              <span className="mt-2 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                Verified technician
              </span>
            )}
          </div>
        </div>

        {profile.bio && <p className="mt-4 text-sm text-slate-600">{profile.bio}</p>}
        {profile.years_experience != null && (
          <p className="mt-1 text-sm text-slate-500">{profile.years_experience} years experience</p>
        )}

        <h2 className="mt-6 text-sm font-semibold text-slate-900">Rates</h2>
        <ul className="mt-2 space-y-2">
          {profile.rate_cards.length === 0 && (
            <p className="text-sm text-slate-500">No published rates yet.</p>
          )}
          {profile.rate_cards.map((rc) => (
            <li
              key={rc.id}
              className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2 text-sm"
            >
              <span>{rc.category.name}</span>
              <span className="text-slate-600">
                {rc.currency} {rc.call_out_fee} call-out + {rc.currency} {rc.hourly_rate}/hr
              </span>
              <Link
                to={`/book/${profile.id}?category=${rc.category_id}`}
                className="rounded-md bg-brand-600 px-3 py-1 font-medium text-white hover:bg-brand-700"
              >
                Book
              </Link>
            </li>
          ))}
        </ul>

        <h2 className="mt-6 text-sm font-semibold text-slate-900">Reviews</h2>
        <ul className="mt-2 space-y-3">
          {reviews.length === 0 && <p className="text-sm text-slate-500">No reviews yet.</p>}
          {reviews.map((review) => (
            <li key={review.id} className="rounded-md border border-slate-100 px-3 py-2">
              <RatingStars rating={review.rating} />
              {review.comment && <p className="mt-1 text-sm text-slate-600">{review.comment}</p>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
