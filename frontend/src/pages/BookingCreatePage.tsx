import { useState, type FormEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { bookingsApi } from '../api/bookings'
import { useGeolocation } from '../hooks/useGeolocation'

export function BookingCreatePage() {
  const { technicianId } = useParams<{ technicianId: string }>()
  const [searchParams] = useSearchParams()
  const categoryId = searchParams.get('category')
  const navigate = useNavigate()
  const { location, isLoading: geoLoading, error: geoError } = useGeolocation()

  const [description, setDescription] = useState('')
  const [addressLabel, setAddressLabel] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!technicianId || !categoryId || !location) return

    setError(null)
    setIsSubmitting(true)
    try {
      const booking = await bookingsApi.create({
        technician_id: technicianId,
        category_id: categoryId,
        description,
        address_label: addressLabel,
        location,
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      })
      navigate(`/bookings/${booking.id}`)
    } catch {
      setError('Could not create booking. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!categoryId) {
    return <div className="p-8 text-center text-red-600">Missing service category — go back and pick one.</div>
  }
  if (geoLoading) {
    return <div className="p-8 text-center text-slate-500">Getting your location...</div>
  }
  if (geoError || !location) {
    return <div className="p-8 text-center text-slate-500">Location access is required to book a technician.</div>
  }

  return (
    <div className="mx-auto mt-10 max-w-lg px-4">
      <h1 className="text-2xl font-semibold text-slate-900">Describe the job</h1>
      <p className="mt-1 text-sm text-slate-500">
        The technician will review this and send you a quote before starting any work.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-700">
            What needs fixing?
          </label>
          <textarea
            id="description"
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-slate-700">
            Address
          </label>
          <input
            id="address"
            required
            value={addressLabel}
            onChange={(e) => setAddressLabel(e.target.value)}
            placeholder="e.g. 4th Floor, Sunrise Apartments, MG Road"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="scheduled_at" className="block text-sm font-medium text-slate-700">
            Preferred time (optional)
          </label>
          <input
            id="scheduled_at"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-brand-600 py-2 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Sending request...' : 'Request booking'}
        </button>
      </form>
    </div>
  )
}
