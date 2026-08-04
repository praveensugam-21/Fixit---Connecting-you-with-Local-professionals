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
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-semibold text-brand-700">
          FixIt
        </Link>

        <div className="flex items-center gap-4 text-sm">
          <Link to="/search" className="text-slate-600 hover:text-brand-600">
            Find a technician
          </Link>

          {user ? (
            <>
              <Link
                to={user.role === 'technician' ? '/technician/dashboard' : '/dashboard'}
                className="text-slate-600 hover:text-brand-600"
              >
                Dashboard
              </Link>
              <span className="text-slate-400">{user.full_name}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-md bg-slate-100 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-200"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-slate-600 hover:text-brand-600">
                Log in
              </Link>
              <Link
                to="/signup"
                className="rounded-md bg-brand-600 px-3 py-1.5 font-medium text-white hover:bg-brand-700"
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
