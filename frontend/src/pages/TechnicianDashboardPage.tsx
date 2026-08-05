import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { bookingsApi } from '../api/bookings'
import { categoriesApi } from '../api/categories'
import { techniciansApi } from '../api/technicians'
import { BookingStatusBadge } from '../components/common/BookingStatusBadge'
import type { Booking, ServiceCategory, TechnicianProfile } from '../types'

export function TechnicianDashboardPage() {
  const [profile, setProfile] = useState<TechnicianProfile | null>(null)
  const [profileMissing, setProfileMissing] = useState(false)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [categories, setCategories] = useState<ServiceCategory[]>([])

  const [categoryId, setCategoryId] = useState('')
  const [callOutFee, setCallOutFee] = useState('')
  const [hourlyRate, setHourlyRate] = useState('')
  const [rateCardError, setRateCardError] = useState<string | null>(null)

  function reload() {
    techniciansApi
      .getMyProfile()
      .then(setProfile)
      .catch(() => setProfileMissing(true))
    bookingsApi.listMine().then(setBookings)
    categoriesApi.list().then(setCategories)
  }

  useEffect(reload, [])

  async function handleAddRateCard(event: FormEvent) {
    event.preventDefault()
    if (!categoryId || !callOutFee || !hourlyRate) return
    setRateCardError(null)
    try {
      await techniciansApi.addRateCard({
        category_id: categoryId,
        call_out_fee: Number(callOutFee),
        hourly_rate: Number(hourlyRate),
      })
      setCategoryId('')
      setCallOutFee('')
      setHourlyRate('')
      reload()
    } catch {
      setRateCardError('Could not add that rate card.')
    }
  }

  if (profileMissing) {
    return (
      <div className="p-8 text-center text-slate-600">
        <p>You haven't set up your technician profile yet.</p>
        <Link to="/technician/onboarding" className="mt-2 inline-block font-medium text-brand-600">
          Set up profile
        </Link>
      </div>
    )
  }

  if (!profile) {
    return <div className="p-8 text-center text-slate-500">Loading...</div>
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">Technician dashboard</h1>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 text-sm">
        <p>
          Verification status: <span className="font-medium">{profile.verification_status}</span>
        </p>
        {profile.verification_status === 'pending' && (
          <p className="mt-1 text-slate-500">
            You won't appear in customer search until an admin approves your profile.
          </p>
        )}
      </div>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-slate-900">Your rate cards</h2>
        <ul className="mt-2 space-y-2">
          {profile.rate_cards.map((rc) => (
            <li key={rc.id} className="flex justify-between rounded-md border border-slate-100 px-3 py-2 text-sm">
              <span>{rc.category.name}</span>
              <span className="text-slate-600">
                {rc.currency} {rc.call_out_fee} + {rc.currency} {rc.hourly_rate}/hr
              </span>
            </li>
          ))}
        </ul>

        <form onSubmit={handleAddRateCard} className="mt-3 flex flex-wrap gap-2">
          <select
            required
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="">Category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={0}
            step="0.01"
            required
            placeholder="Call-out fee"
            value={callOutFee}
            onChange={(e) => setCallOutFee(e.target.value)}
            className="w-32 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
          <input
            type="number"
            min={0}
            step="0.01"
            required
            placeholder="Hourly rate"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
            className="w-32 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
          <button
            type="submit"
            className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            Add
          </button>
        </form>
        {rateCardError && <p className="mt-1 text-sm text-red-600">{rateCardError}</p>}
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-slate-900">Job requests</h2>
        <ul className="mt-2 space-y-3">
          {bookings.length === 0 && <p className="text-sm text-slate-500">No bookings yet.</p>}
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
      </section>
    </div>
  )
}
