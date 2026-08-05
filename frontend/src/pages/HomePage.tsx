import { Link } from 'react-router-dom'

export function HomePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-20 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
        Verified local technicians, on your schedule.
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
        Plumbing, electrical, AC servicing and more — find nearby, verified technicians with
        transparent pricing and a trust-based rating system.
      </p>
      <div className="mt-8 flex justify-center gap-4">
        <Link
          to="/search"
          className="rounded-md bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700"
        >
          Find a technician
        </Link>
        <Link
          to="/signup?role=technician"
          className="rounded-md border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-100"
        >
          Join as a technician
        </Link>
      </div>
    </div>
  )
}
