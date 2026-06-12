import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useOpenMatchdayNumber } from '../../hooks/useOpenMatchdayNumber'
import { PaymentStatusIndicator } from './PaymentStatusIndicator'

function NavIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  )
}

const tabs = [
  {
    path: '/dashboard',
    label: 'My Predictions',
    match: (p: string) => p === '/dashboard' || p === '/predictions',
    icon: (
      <NavIcon>
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 12h6M9 16h4" />
      </NavIcon>
    ),
  },
  {
    path: '/history',
    label: 'History',
    match: (p: string) => p === '/history',
    icon: (
      <NavIcon>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </NavIcon>
    ),
  },
  {
    path: '/leaderboard',
    label: 'Table',
    match: (p: string) => p === '/leaderboard',
    icon: (
      <NavIcon>
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
      </NavIcon>
    ),
  },
]

export function MobileBottomNav() {
  const location = useLocation()
  const { user, logout } = useAuth()
  const openMatchday = useOpenMatchdayNumber()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!menuOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [menuOpen])

  if (!user) return null

  return (
    <>
      {menuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[100] bg-brand-navy/45 backdrop-blur-sm md:hidden"
          aria-label="Close account menu"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <div
        className={`fixed inset-x-0 z-[101] md:hidden px-3 transition-all duration-200 ease-out ${
          menuOpen
            ? 'bottom-[calc(3.75rem+env(safe-area-inset-bottom))] opacity-100 pointer-events-auto'
            : 'bottom-[calc(3.75rem+env(safe-area-inset-bottom))] opacity-0 pointer-events-none translate-y-2'
        }`}
        role="dialog"
        aria-modal={menuOpen}
        aria-hidden={!menuOpen}
      >
        <div className="glass-card p-4 space-y-1 shadow-glass-hover border border-brand-blue/15">
          <div className="px-2 pb-3 mb-2 border-b border-brand-blue/10">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-brand-navy">{user.display_name}</p>
              <PaymentStatusIndicator
                hasPaid={user.has_paid ?? false}
                matchdayNumber={openMatchday}
                username={user.username}
              />
            </div>
            <p className="text-sm font-mono text-brand-blue font-bold mt-0.5">{user.total_points} pts</p>
          </div>
          {user.is_admin && (
            <Link
              to="/admin/ops"
              onClick={() => setMenuOpen(false)}
              className="flex items-center min-h-[48px] px-3 rounded-xl text-brand-navy font-medium active:bg-brand-blue/5"
            >
              Admin
            </Link>
          )}
          <Link
            to="/profile"
            onClick={() => setMenuOpen(false)}
            className="flex items-center min-h-[48px] px-3 rounded-xl text-brand-navy font-medium active:bg-brand-blue/5"
          >
            Profile
          </Link>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false)
              logout()
            }}
            className="w-full flex items-center min-h-[48px] px-3 rounded-xl text-red-600 font-medium active:bg-red-50"
          >
            Log out
          </button>
        </div>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-[90] md:hidden glass-nav border-t border-brand-blue/12 pb-[env(safe-area-inset-bottom)]"
        aria-label="Main navigation"
      >
        <div className="flex items-stretch justify-around px-1">
          {tabs.map((tab) => {
            const active = tab.match(location.pathname)
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={`flex flex-1 flex-col items-center justify-center gap-0.5 min-h-[56px] py-2 touch-manipulation transition-colors ${
                  active ? 'text-brand-blue' : 'text-gray-500 active:text-brand-blue'
                }`}
              >
                {tab.icon}
                <span className={`text-[10px] font-semibold tracking-wide text-center leading-tight max-w-[4.5rem] ${active ? 'text-brand-blue' : ''}`}>
                  {tab.label}
                </span>
              </Link>
            )
          })}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 min-h-[56px] py-2 touch-manipulation transition-colors ${
              menuOpen ? 'text-brand-blue' : 'text-gray-500 active:text-brand-blue'
            }`}
            aria-expanded={menuOpen}
            aria-label="Account menu"
          >
            <NavIcon>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </NavIcon>
            <span className={`text-[10px] font-semibold tracking-wide ${menuOpen ? 'text-brand-blue' : ''}`}>
              Account
            </span>
          </button>
        </div>
      </nav>
    </>
  )
}
