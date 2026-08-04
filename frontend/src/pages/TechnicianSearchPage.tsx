import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { categoriesApi } from '../api/categories'
import { techniciansApi } from '../api/technicians'
import { TechnicianMap } from '../components/map/TechnicianMap'
import { RatingStars } from '../components/common/RatingStars'
import { useGeolocation } from '../hooks/useGeolocation'
import type { ServiceCategory, TechnicianNearby } from '../types'

export function TechnicianSearchPage() {
  const { location, error: geoError, isLoading: geoLoading } = useGeolocation()
  const navigate = useNavigate()

  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [categoryId, setCategoryId] = useState<string>('')
  const [radiusKm, setRadiusKm] = useState(10)
  const [technicians, setTechnicians] = useState<TechnicianNearby[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  useEffect(() => {
    categoriesApi.list().then(setCategories).catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    if (!location) return

    setIsSearching(true)
    setSearchError(null)
    techniciansApi
      .nearby({
        lat: location.lat,
        lng: location.lng,
        radius_km: radiusKm,
        category_id: categoryId || undefined,
      })
      .then(setTechnicians)
      .catch(() => setSearchError('Could not load nearby technicians'))
      .finally(() => setIsSearching(false))
  }, [location, categoryId, radiusKm])

  if (geoLoading) {
    return <div className="p-8 text-center text-slate-500">Getting your location...</div>
  }

  if (geoError || !location) {
    return (
      <div className="p-8 text-center text-slate-500">
        We need your location to find nearby technicians. Please allow location access and reload.
      </div>
    )
  }

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <div className="mb-4 flex flex-wrap gap-3">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {[5, 10, 20, 50].map((km) => (
              <option key={km} value={km}>
                Within {km} km
              </option>
            ))}
          </select>
        </div>

        {isSearching && <p className="text-sm text-slate-500">Searching...</p>}
        {searchError && <p className="text-sm text-red-600">{searchError}</p>}
        {!isSearching && technicians.length === 0 && (
          <p className="text-sm text-slate-500">No verified technicians found nearby yet.</p>
        )}

        <ul className="space-y-3">
          {technicians.map((tech) => (
            <li key={tech.id}>
              <button
                type="button"
                onClick={() => navigate(`/technicians/${tech.id}`)}
                className="w-full rounded-lg border border-slate-200 bg-white p-4 text-left hover:border-brand-400"
              >
                <p className="font-medium text-slate-900">{tech.full_name}</p>
                <RatingStars rating={tech.avg_rating} count={tech.rating_count} />
                <p className="mt-1 text-xs text-slate-500">{tech.distance_km.toFixed(1)} km away</p>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="h-[70vh] lg:col-span-3">
        <TechnicianMap
          center={location}
          technicians={technicians}
          onSelect={(id) => navigate(`/technicians/${id}`)}
        />
      </div>
    </div>
  )
}
