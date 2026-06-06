import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useOpenMatchdayNumber } from '../../hooks/useOpenMatchdayNumber'
import { PointsTotal } from './PointsTotal'
import { PaymentStatusIndicator } from './PaymentStatusIndicator'

interface NavbarProps {
  displayName?: string
  totalPoints?: number
}

export function Navbar({ displayName: propDisplayName, totalPoints: propPoints }: NavbarProps) {
  const location = useLocation()
  let authUser = null
  let logout = () => {}

  try {
    const auth = useAuth()
    authUser = auth.user
    logout = auth.logout
  } catch {
    // Not in AuthProvider context
  }

  const displayName = propDisplayName ?? authUser?.display_name
  const totalPoints = propPoints ?? authUser?.total_points
  const openMatchday = useOpenMatchdayNumber()

  const isActive = (path: string) => location.pathname === path
  const isAdminActive = location.pathname.startsWith('/admin')

  return (
    <nav className="sticky top-0 z-50 glass-nav pt-[env(safe-area-inset-top)]">
      <div className="max-w-6xl mx-auto px-4 py-2.5 sm:py-3 flex items-center justify-between gap-3">
        <Link to={displayName ? '/dashboard' : '/'} className="flex items-center gap-2.5 shrink-0 touch-manipulation">
          <img
            src="/logo.png"
            alt="BMFC"
            className="h-10 w-10 sm:h-11 sm:w-11 object-contain drop-shadow-sm"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/logo.svg'
            }}
          />
          <span className="font-display text-sm sm:text-lg text-brand-navy hidden sm:block tracking-tight">
            BMFC Predictor
          </span>
        </Link>

        {displayName ? (
          <>
            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-6">
              <Link
                to="/leaderboard"
                className={`nav-link ${isActive('/leaderboard') ? 'nav-link-active' : ''}`}
              >
                The Table
              </Link>
              <Link
                to="/history"
                className={`nav-link ${isActive('/history') ? 'nav-link-active' : ''}`}
              >
                History
              </Link>
              <div className="flex items-center gap-2.5">
                <span className="text-sm text-gray-600">{displayName}</span>
                <PointsTotal points={totalPoints ?? 0} />
                {authUser && (
                  <PaymentStatusIndicator
                    hasPaid={authUser.has_paid ?? false}
                    matchdayNumber={openMatchday}
                    username={authUser.username}
                  />
                )}
              </div>
              {authUser?.is_admin && (
                <Link
                  to="/admin/ops"
                  className={`nav-link ${isAdminActive ? 'nav-link-active' : ''}`}
                >
                  Admin
                </Link>
              )}
              <button
                onClick={logout}
                className="text-sm text-gray-500 hover:text-red-500 transition-colors min-h-[44px] px-2"
              >
                Logout
              </button>
            </div>

            {/* Mobile: points pill only — main nav is bottom tabs */}
            <div className="md:hidden flex items-center">
              <PointsTotal points={totalPoints ?? 0} />
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/leaderboard" className="nav-link text-sm min-h-[44px] flex items-center">
              The Table
            </Link>
            <Link to="/login" className="nav-link text-sm min-h-[44px] flex items-center">
              Login
            </Link>
            <Link to="/signup" className="btn-primary text-sm py-2.5 px-5 min-h-[44px]">
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
