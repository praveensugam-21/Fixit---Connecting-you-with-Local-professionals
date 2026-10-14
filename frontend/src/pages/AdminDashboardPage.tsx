import { useEffect, useState } from 'react'
import { techniciansApi } from '../api/technicians'
import type { TechnicianProfile } from '../types'

export function AdminDashboardPage() {
  const [pending, setPending] = useState<TechnicianProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  function load() {
    setLoading(true)
    techniciansApi
      .listPending()
      .then(setPending)
      .catch(() => setError('Could not load pending technicians'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function decide(id: string, status: 'approved' | 'rejected') {
    setBusyId(id)
    setError(null)
    try {
      await techniciansApi.setVerification(id, status)
      setPending((prev) => prev.filter((p) => p.id !== id))
    } catch {
      setError('Could not update that technician.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Admin — Technician verification</h1>
      <p className="mt-1 text-sm text-slate-500">
        Review and approve technicians before they appear in search.
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {loading && <p className="mt-6 text-sm text-slate-500">Loading...</p>}

      {!loading && pending.length === 0 && (
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          🎉 No technicians pending verification.
        </div>
      )}

      <ul className="mt-6 space-y-3">
        {pending.map((tech) => (
          <li
            key={tech.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-card"
          >
            <div>
              <p className="font-semibold text-slate-900">{tech.full_name}</p>
              <p className="mt-0.5 text-sm text-slate-500">
                {tech.address_label ?? 'No area set'} ·{' '}
                {tech.years_experience ?? 0} yrs experience
              </p>
              {tech.bio && <p className="mt-1 max-w-lg text-sm text-slate-500">{tech.bio}</p>}
              <span className="mt-2 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                Pending
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busyId === tech.id}
                onClick={() => decide(tech.id, 'approved')}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                Approve
              </button>
              <button
                type="button"
                disabled={busyId === tech.id}
                onClick={() => decide(tech.id, 'rejected')}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
