import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-lg font-extrabold text-brand-700">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-brand-800 text-white">
            🔧
          </span>
          FixIt
        </Link>

        <div className="flex items-center gap-4 text-sm">
          <Link to="/search" className="font-medium text-slate-600 transition hover:text-brand-600">
            Find a technician
          </Link>

          {user ? (
            <>
              <Link
                to={user.role === 'technician' ? '/technician/dashboard' : '/dashboard'}
                className="font-medium text-slate-600 transition hover:text-brand-600"
              >
                Dashboard
              </Link>
              <span className="hidden text-slate-400 sm:inline">{user.full_name}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg bg-slate-100 px-3 py-1.5 font-medium text-slate-700 transition hover:bg-slate-200"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="font-medium text-slate-600 transition hover:text-brand-600">
                Log in
              </Link>
              <Link
                to="/signup"
                className="rounded-lg bg-brand-600 px-4 py-1.5 font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-700"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}
