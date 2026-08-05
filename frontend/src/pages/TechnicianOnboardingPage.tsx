import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { techniciansApi } from '../api/technicians'
import { useGeolocation } from '../hooks/useGeolocation'

export function TechnicianOnboardingPage() {
  const navigate = useNavigate()
  const { location, isLoading: geoLoading, error: geoError } = useGeolocation()

  const [bio, setBio] = useState('')
  const [yearsExperience, setYearsExperience] = useState('')
  const [serviceRadiusKm, setServiceRadiusKm] = useState('10')
  const [addressLabel, setAddressLabel] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!location) return

    setError(null)
    setIsSubmitting(true)
    try {
      await techniciansApi.createMyProfile({
        bio: bio || undefined,
        years_experience: yearsExperience ? Number(yearsExperience) : undefined,
        service_radius_km: Number(serviceRadiusKm),
        address_label: addressLabel || undefined,
        location,
      })
      navigate('/technician/dashboard')
    } catch {
      setError('Could not create your technician profile. It may already exist.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (geoLoading) {
    return <div className="p-8 text-center text-slate-500">Getting your location...</div>
  }
  if (geoError || !location) {
    return (
      <div className="p-8 text-center text-slate-500">
        We need your service location to list you for nearby customers. Please allow location access.
      </div>
    )
  }

  return (
    <div className="mx-auto mt-10 max-w-lg px-4">
      <h1 className="text-2xl font-semibold text-slate-900">Set up your technician profile</h1>
      <p className="mt-1 text-sm text-slate-500">
        An admin will review and verify your profile before you appear in customer search results.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-slate-700">
            About you
          </label>
          <textarea
            id="bio"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="years" className="block text-sm font-medium text-slate-700">
            Years of experience
          </label>
          <input
            id="years"
            type="number"
            min={0}
            value={yearsExperience}
            onChange={(e) => setYearsExperience(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="radius" className="block text-sm font-medium text-slate-700">
            Service radius (km)
          </label>
          <input
            id="radius"
            type="number"
            min={1}
            max={200}
            required
            value={serviceRadiusKm}
            onChange={(e) => setServiceRadiusKm(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-slate-700">
            Base address (shown approximately)
          </label>
          <input
            id="address"
            value={addressLabel}
            onChange={(e) => setAddressLabel(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-brand-600 py-2 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Create profile'}
        </button>
      </form>
    </div>
  )
}
