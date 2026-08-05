import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { bookingsApi } from '../api/bookings'
import { BookingStatusBadge } from '../components/common/BookingStatusBadge'
import type { Booking } from '../types'

export function CustomerDashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    bookingsApi
      .listMine()
      .then(setBookings)
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">Your bookings</h1>

      {isLoading && <p className="mt-4 text-sm text-slate-500">Loading...</p>}
      {!isLoading && bookings.length === 0 && (
        <p className="mt-4 text-sm text-slate-500">
          No bookings yet.{' '}
          <Link to="/search" className="font-medium text-brand-600">
            Find a technician
          </Link>
        </p>
      )}

      <ul className="mt-6 space-y-3">
        {bookings.map((booking) => (
          <li key={booking.id}>
            <Link
              to={`/bookings/${booking.id}`}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 hover:border-brand-400"
            >
              <div>
                <p className="line-clamp-1 font-medium text-slate-900">{booking.description}</p>
                <p className="text-xs text-slate-500">{booking.address_label}</p>
              </div>
              <BookingStatusBadge status={booking.status} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
