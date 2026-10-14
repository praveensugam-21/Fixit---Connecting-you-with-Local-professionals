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
  const [viewMode, setViewMode] = useState<'list' | 'compare'>('list')
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'distance'>('price')

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

  const estimateEta = (distanceKm: number) => Math.round(distanceKm * 2 + 5)

  const sortedForCompare = [...technicians].sort((a, b) => {
    if (sortBy === 'rating') return b.avg_rating - a.avg_rating
    if (sortBy === 'distance') return a.distance_km - b.distance_km
    // price: nulls last
    const pa = a.call_out_fee ?? Number.POSITIVE_INFINITY
    const pb = b.call_out_fee ?? Number.POSITIVE_INFINITY
    return pa - pb
  })

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

        <div className="mb-3 inline-flex rounded-md border border-slate-300 p-0.5 text-sm">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`rounded px-3 py-1 font-medium ${
              viewMode === 'list' ? 'bg-brand-600 text-white' : 'text-slate-600'
            }`}
          >
            List
          </button>
          <button
            type="button"
            onClick={() => setViewMode('compare')}
            className={`rounded px-3 py-1 font-medium ${
              viewMode === 'compare' ? 'bg-brand-600 text-white' : 'text-slate-600'
            }`}
          >
            Compare quotes
          </button>
        </div>

        {isSearching && <p className="text-sm text-slate-500">Searching...</p>}
        {searchError && <p className="text-sm text-red-600">{searchError}</p>}
        {!isSearching && technicians.length === 0 && (
          <p className="text-sm text-slate-500">No verified technicians found nearby yet.</p>
        )}

        {viewMode === 'list' && (
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
        )}

        {viewMode === 'compare' && technicians.length > 0 && (
          <div>
            {!categoryId && (
              <p className="mb-2 text-xs text-amber-600">
                Pick a category above to compare call-out quotes.
              </p>
            )}
            <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
              <span>Sort by:</span>
              {(['price', 'rating', 'distance'] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSortBy(key)}
                  className={`rounded px-2 py-0.5 ${
                    sortBy === key ? 'bg-slate-200 font-medium text-slate-800' : 'hover:bg-slate-100'
                  }`}
                >
                  {key === 'price' ? 'Price' : key === 'rating' ? 'Rating' : 'ETA'}
                </button>
              ))}
            </div>
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Technician</th>
                    <th className="px-3 py-2">Call-out</th>
                    <th className="px-3 py-2">Rating</th>
                    <th className="px-3 py-2">ETA</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedForCompare.map((tech) => (
                    <tr key={tech.id} className="bg-white">
                      <td className="px-3 py-2 font-medium text-slate-900">{tech.full_name}</td>
                      <td className="px-3 py-2 text-slate-700">
                        {tech.call_out_fee != null
                          ? `${tech.currency ?? '₹'} ${tech.call_out_fee}`
                          : '—'}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {tech.avg_rating.toFixed(1)} ★ ({tech.rating_count})
                      </td>
                      <td className="px-3 py-2 text-slate-700">~{estimateEta(tech.distance_km)} min</td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/technicians/${tech.id}`)}
                          className="rounded-md bg-brand-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-700"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
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
