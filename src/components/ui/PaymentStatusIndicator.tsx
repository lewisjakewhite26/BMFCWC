import { useCallback, useEffect, useRef, useState } from 'react'
import { ENTRY_FEE_GBP } from '../../lib/prizePot'

type UrgencyTier = 1 | 2 | 3 | 4

function getUrgencyTier(matchdayNumber: number | null): UrgencyTier {
  const md = matchdayNumber ?? 1
  if (md <= 2) return 1
  if (md <= 4) return 2
  if (md <= 6) return 3
  return 4
}

const TIER_CLASS: Record<UrgencyTier, string> = {
  1: 'payment-indicator-subtle',
  2: 'payment-indicator-moderate',
  3: 'payment-indicator-urgent',
  4: 'payment-indicator-critical',
}

interface PaymentStatusIndicatorProps {
  hasPaid: boolean
  matchdayNumber: number | null
  username: string
}

export function PaymentStatusIndicator({
  hasPaid,
  matchdayNumber,
  username,
}: PaymentStatusIndicatorProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const tier = getUrgencyTier(matchdayNumber)

  useEffect(() => {
    if (!open) return

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
    }
  }, [open])

  const handleTap = useCallback(() => {
    setOpen((prev) => !prev)
  }, [])

  const handleMouseEnter = useCallback(() => {
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      setOpen(true)
    }
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      setOpen(false)
    }
  }, [])

  if (hasPaid) return null

  const tierClass = TIER_CLASS[tier]

  return (
    <div
      ref={containerRef}
      className="relative shrink-0"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={handleTap}
        className={`${tierClass} inline-flex items-center justify-center rounded-full touch-manipulation select-none cursor-pointer border-0 bg-transparent p-0 leading-none`}
        aria-label="Entry fee outstanding"
        aria-expanded={open}
      >
        {tier === 4 ? (
          <span className="payment-indicator-critical-label">£ PAY NOW</span>
        ) : tier === 3 ? (
          <span aria-hidden>⚠️£</span>
        ) : (
          <span aria-hidden>£</span>
        )}
      </button>

      {open && (
        <div
          role="tooltip"
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-[200] w-[min(18rem,calc(100vw-2rem))] px-3.5 py-3 text-xs text-brand-navy leading-relaxed glass-card shadow-glass border border-brand-blue/15 pointer-events-none md:pointer-events-auto"
        >
          <p className="mb-2.5">
            Entry fee outstanding. Please pay £{ENTRY_FEE_GBP} to join the predictor.
          </p>
          <p className="font-semibold text-brand-navy mb-1">Bank transfer to:</p>
          <p className="mb-2.5 space-y-0.5">
            <span className="block">Bishop Middleham FC</span>
            <span className="block">Sort code: 30-98-97</span>
            <span className="block">Account: 58226562</span>
            <span className="block font-mono">
              Reference: {username}
            </span>
          </p>
          <p className="text-gray-600">
            Once received, your entry will be confirmed by the admin.
          </p>
        </div>
      )}
    </div>
  )
}
