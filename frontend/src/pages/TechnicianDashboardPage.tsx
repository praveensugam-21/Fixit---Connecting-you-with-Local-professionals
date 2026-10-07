import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { bookingsApi } from '../api/bookings'
import { categoriesApi } from '../api/categories'
import { techniciansApi } from '../api/technicians'
import { BookingStatusBadge } from '../components/common/BookingStatusBadge'
import type { Booking, EarningsSummary, ServiceCategory, TechnicianProfile } from '../types'

export function TechnicianDashboardPage() {
  const [profile, setProfile] = useState<TechnicianProfile | null>(null)
  const [profileMissing, setProfileMissing] = useState(false)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null)

  const [categoryId, setCategoryId] = useState('')
  const [callOutFee, setCallOutFee] = useState('')
  const [hourlyRate, setHourlyRate] = useState('')
  const [rateCardError, setRateCardError] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editCallOut, setEditCallOut] = useState('')
  const [editHourly, setEditHourly] = useState('')

  function reload() {
    techniciansApi
      .getMyProfile()
      .then(setProfile)
      .catch(() => setProfileMissing(true))
    bookingsApi.listMine().then(setBookings)
    categoriesApi.list().then(setCategories)
    techniciansApi.myEarnings().then(setEarnings).catch(() => setEarnings(null))
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

  function startEdit(id: string, callOut: number, hourly: number) {
    setEditingId(id)
    setEditCallOut(String(callOut))
    setEditHourly(String(hourly))
    setRateCardError(null)
  }

  async function handleSaveEdit(id: string) {
    setRateCardError(null)
    try {
      await techniciansApi.updateRateCard(id, {
        call_out_fee: Number(editCallOut),
        hourly_rate: Number(editHourly),
      })
      setEditingId(null)
      reload()
    } catch {
      setRateCardError('Could not update that rate card.')
    }
  }

  async function handleDeleteRateCard(id: string) {
    setRateCardError(null)
    try {
      await techniciansApi.deleteRateCard(id)
      reload()
    } catch {
      setRateCardError('Could not delete that rate card.')
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

      {earnings && (
        <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            [`${earnings.currency} ${earnings.total_earned.toLocaleString()}`, 'Total earned'],
            [String(earnings.completed_jobs), 'Completed jobs'],
            [String(earnings.active_jobs), 'Active jobs'],
            [
              earnings.rating_count > 0 ? `${earnings.avg_rating.toFixed(1)} ★` : '—',
              `Rating (${earnings.rating_count})`,
            ],
          ].map(([value, label]) => (
            <div
              key={label}
              className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-card"
            >
              <p className="text-xl font-extrabold text-brand-700">{value}</p>
              <p className="mt-1 text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </section>
      )}

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4 text-sm">
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
          {profile.rate_cards.length === 0 && (
            <p className="text-sm text-slate-500">No rate cards yet. Add one below.</p>
          )}
          {profile.rate_cards.map((rc) => (
            <li
              key={rc.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-100 px-3 py-2 text-sm"
            >
              <span className="font-medium text-slate-800">{rc.category.name}</span>

              {editingId === rc.id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    value={editCallOut}
                    onChange={(e) => setEditCallOut(e.target.value)}
                    placeholder="Call-out"
                    className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm"
                  />
                  <input
                    type="number"
                    min={0}
                    value={editHourly}
                    onChange={(e) => setEditHourly(e.target.value)}
                    placeholder="Hourly"
                    className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveEdit(rc.id)}
                    className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-slate-600">
                    {rc.currency} {rc.call_out_fee} + {rc.currency} {rc.hourly_rate}/hr
                  </span>
                  <button
                    type="button"
                    onClick={() => startEdit(rc.id, rc.call_out_fee, rc.hourly_rate)}
                    className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteRateCard(rc.id)}
                    className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              )}
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
