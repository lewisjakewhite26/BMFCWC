import { useState, type ReactNode } from 'react'

interface AdminSectionProps {
  title: string
  description?: string
  headerExtra?: ReactNode
  children: ReactNode
  defaultOpen?: boolean
  badge?: ReactNode
}

export function AdminSection({
  title,
  description,
  headerExtra,
  children,
  defaultOpen = false,
  badge,
}: AdminSectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  const panelId = `admin-section-${title.replace(/\s+/g, '-').toLowerCase()}`

  return (
    <section className="admin-section min-w-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="w-full text-left flex items-start gap-3 group touch-manipulation"
      >
        <span className="admin-section-heading flex-1 min-w-0">
          <span className="admin-section-heading-accent" aria-hidden />
          <span className="flex items-center gap-2 min-h-[1.25rem] flex-wrap">
            <span>{title}</span>
            {badge}
          </span>
        </span>
        <span
          className={`shrink-0 mt-0.5 w-8 h-8 flex items-center justify-center rounded-full border border-brand-blue/15 bg-white/60 text-brand-navy transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="opacity-70">
            <path
              d="M4 6l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {open && (
        <div id={panelId} className="mt-4 min-w-0">
          {description && <p className="text-sm text-gray-500 mb-4 ml-4">{description}</p>}
          {headerExtra && (
            <div className="mb-4 ml-4" onClick={(e) => e.stopPropagation()}>
              {headerExtra}
            </div>
          )}
          <div className="min-w-0">{children}</div>
        </div>
      )}
    </section>
  )
}
