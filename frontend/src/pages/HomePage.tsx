import { Link } from 'react-router-dom'

const FEATURES = [
  {
    icon: '📍',
    title: 'Location-based matching',
    desc: 'Find verified technicians near you with live distance and ETA — no more endless WhatsApp groups.',
  },
  {
    icon: '💰',
    title: 'Transparent pricing',
    desc: 'Compare call-out fees, rates and ratings side by side before you book. No surprise bills.',
  },
  {
    icon: '✅',
    title: 'Verified professionals',
    desc: 'Every technician is verified by admin with ID proof, so you always know who you’re hiring.',
  },
  {
    icon: '⭐',
    title: 'Trust-based ratings',
    desc: 'Real reviews from completed jobs help you choose the right professional with confidence.',
  },
]

const STEPS = [
  { n: '1', title: 'Request a service', desc: 'Describe the problem, add photos and your location.' },
  { n: '2', title: 'Compare quotes', desc: 'See multiple technicians ranked by price, rating and ETA.' },
  { n: '3', title: 'Book & chat', desc: 'Pick your professional, chat in-app and confirm the booking.' },
  { n: '4', title: 'Get it fixed', desc: 'Job done, pay securely and leave a rating.' },
]

const CATEGORIES = ['Plumbing', 'Electrical', 'AC Servicing', 'Carpentry', 'Painting', 'Cleaning']

export function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="relative mx-auto max-w-5xl px-4 py-24 text-center text-white">
          <span className="inline-flex animate-fade-up items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium backdrop-blur">
            🔧 Connecting you with verified local professionals
          </span>
          <h1 className="mt-6 animate-fade-up text-4xl font-extrabold tracking-tight sm:text-6xl">
            Home repairs,
            <span className="bg-gradient-to-r from-accent-400 to-accent-500 bg-clip-text text-transparent">
              {' '}
              done right.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl animate-fade-up text-lg text-brand-100">
            Plumbing, electrical, AC servicing and more — find nearby verified technicians with
            transparent pricing and a trust-based rating system.
          </p>
          <div className="mt-9 flex animate-fade-up flex-wrap justify-center gap-4">
            <Link
              to="/search"
              className="rounded-xl bg-white px-7 py-3.5 font-semibold text-brand-700 shadow-card transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              Find a technician →
            </Link>
            <Link
              to="/signup?role=technician"
              className="rounded-xl border border-white/40 px-7 py-3.5 font-semibold text-white transition hover:bg-white/10"
            >
              Join as a technician
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-2">
            {CATEGORIES.map((c) => (
              <span
                key={c}
                className="rounded-full border border-white/25 bg-white/5 px-3 py-1 text-sm text-brand-50"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 px-4 py-10 sm:grid-cols-4">
          {[
            ['500+', 'Verified technicians'],
            ['8', 'Service categories'],
            ['4.8★', 'Average rating'],
            ['24/7', 'Book anytime'],
          ].map(([stat, label]) => (
            <div key={label} className="text-center">
              <p className="text-3xl font-extrabold text-brand-700">{stat}</p>
              <p className="mt-1 text-sm text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-3xl font-bold text-slate-900">Why FixIt?</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-slate-500">
          Everything you need to get home repairs done safely, fairly and fast.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card transition hover:-translate-y-1 hover:border-brand-300"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-2xl">
                {f.icon}
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-100">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-center text-3xl font-bold text-slate-900">How it works</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.n} className="relative rounded-2xl bg-white p-6 shadow-card">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 font-bold text-white">
                  {s.n}
                </div>
                <h3 className="mt-4 font-semibold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <div className="rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 px-8 py-14 text-center text-white shadow-card">
          <h2 className="text-3xl font-bold">Ready to get started?</h2>
          <p className="mx-auto mt-3 max-w-xl text-brand-100">
            Join thousands of homeowners who found trusted local professionals through FixIt.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/search"
              className="rounded-xl bg-white px-7 py-3.5 font-semibold text-brand-700 transition hover:-translate-y-0.5"
            >
              Find a technician
            </Link>
            <Link
              to="/signup"
              className="rounded-xl border border-white/40 px-7 py-3.5 font-semibold text-white transition hover:bg-white/10"
            >
              Create an account
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
