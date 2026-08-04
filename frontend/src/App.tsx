import { Navigate, Route, Routes } from 'react-router-dom'
import { Navbar } from './components/layout/Navbar'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { BookingCreatePage } from './pages/BookingCreatePage'
import { BookingDetailPage } from './pages/BookingDetailPage'
import { CustomerDashboardPage } from './pages/CustomerDashboardPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { TechnicianDashboardPage } from './pages/TechnicianDashboardPage'
import { TechnicianOnboardingPage } from './pages/TechnicianOnboardingPage'
import { TechnicianProfilePage } from './pages/TechnicianProfilePage'
import { TechnicianSearchPage } from './pages/TechnicianSearchPage'

function App() {
  return (
    <div className="flex min-h-full flex-col">
      <Navbar />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/search" element={<TechnicianSearchPage />} />
          <Route path="/technicians/:technicianId" element={<TechnicianProfilePage />} />

          <Route element={<ProtectedRoute allowedRoles={['customer', 'admin']} />}>
            <Route path="/book/:technicianId" element={<BookingCreatePage />} />
            <Route path="/dashboard" element={<CustomerDashboardPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['technician', 'admin']} />}>
            <Route path="/technician/onboarding" element={<TechnicianOnboardingPage />} />
            <Route path="/technician/dashboard" element={<TechnicianDashboardPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/bookings/:bookingId" element={<BookingDetailPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
