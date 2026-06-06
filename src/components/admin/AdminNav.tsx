import { Link, useLocation } from 'react-router-dom'

const links = [
  {
    to: '/admin/ops',
    label: 'Day-to-day',
    description: 'Payments & predictions',
  },
  {
    to: '/admin/technical',
    label: 'Technical',
    description: 'Sync, matchdays & users',
  },
] as const

export function AdminNav() {
  const { pathname } = useLocation()

  return (
    <nav
      className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8"
      aria-label="Admin sections"
    >
      {links.map((link) => {
        const active = pathname === link.to || (link.to === '/admin/ops' && pathname === '/admin')
        return (
          <Link
            key={link.to}
            to={link.to}
            className={`rounded-2xl border px-4 py-3.5 transition-colors touch-manipulation ${
              active
                ? 'border-brand-blue/30 bg-brand-blue/[0.08] ring-1 ring-brand-blue/15'
                : 'border-brand-blue/10 bg-white/50 hover:bg-white/70 active:bg-white/80'
            }`}
          >
            <p className={`font-semibold ${active ? 'text-brand-blue' : 'text-brand-navy'}`}>
              {link.label}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{link.description}</p>
          </Link>
        )
      })}
    </nav>
  )
}
