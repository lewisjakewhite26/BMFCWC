import { useEffect, useState, useRef } from 'react'
import { formatCutoffLocal } from '../../lib/scoring'

interface CutoffCountdownProps {
  cutoff: Date | null
  onExpired?: () => void
  variant?: 'inline' | 'banner'
}

const SIX_HOURS_MS = 6 * 60 * 60 * 1000
const TWO_HOURS_MS = 2 * 60 * 60 * 1000

type Urgency = 'expired' | 'critical' | 'warning' | 'normal'

function getUrgency(remainingMs: number): Urgency {
  if (remainingMs <= 0) return 'expired'
  if (remainingMs < TWO_HOURS_MS) return 'critical'
  if (remainingMs < SIX_HOURS_MS) return 'warning'
  return 'normal'
}

function urgencyBannerClass(urgency: Urgency): string {
  switch (urgency) {
    case 'expired':
      return 'bg-gray-100 border border-gray-200'
    case 'critical':
      return 'bg-red-50 border border-red-200/80'
    case 'warning':
      return 'bg-amber-50 border border-amber-200/80'
    default:
      return 'bg-brand-blue/[0.06] border border-brand-blue/15'
  }
}

function urgencyTextClass(urgency: Urgency): string {
  switch (urgency) {
    case 'expired':
      return 'text-gray-500'
    case 'critical':
      return 'text-red-600'
    case 'warning':
      return 'text-amber-600'
    default:
      return 'text-brand-blue'
  }
}

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

/** Always includes seconds so the display visibly ticks every second */
function formatCountdown(ms: number): string {
  if (ms <= 0) return 'Predictions closed'

  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const days = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60

  if (days > 0) {
    return `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  }
  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`
  }
  return `${minutes}:${pad(seconds)}`
}

export function CutoffCountdown({ cutoff, onExpired, variant = 'inline' }: CutoffCountdownProps) {
  const cutoffMs = cutoff?.getTime() ?? null
  const [remaining, setRemaining] = useState<number>(() =>
    cutoffMs !== null ? cutoffMs - Date.now() : 0
  )
  const expiredCalled = useRef(false)
  const onExpiredRef = useRef(onExpired)
  onExpiredRef.current = onExpired

  useEffect(() => {
    expiredCalled.current = false
  }, [cutoffMs])

  useEffect(() => {
    if (cutoffMs === null) return

    const tick = () => {
      const ms = cutoffMs - Date.now()
      setRemaining(ms)
      if (ms <= 0 && !expiredCalled.current) {
        expiredCalled.current = true
        onExpiredRef.current?.()
      }
    }

    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [cutoffMs])

  if (cutoff === null || cutoffMs === null) return null

  const urgency = getUrgency(remaining)
  const countdown = formatCountdown(remaining)

  if (variant === 'banner') {
    return (
      <div
        className={`rounded-2xl px-4 py-3 flex items-center justify-between gap-3 touch-manipulation ${urgencyBannerClass(urgency)}`}
        title={`Cutoff: ${formatCutoffLocal(cutoff)}`}
        role="timer"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-gray-500">
            {urgency === 'expired' ? 'Cutoff passed' : 'Time to predict'}
          </p>
          {urgency !== 'expired' && (
            <p className="text-[11px] text-gray-400 truncate">
              Closes {formatCutoffLocal(cutoff)}
            </p>
          )}
        </div>
        <p className={`font-mono font-bold text-xl sm:text-2xl tabular-nums shrink-0 tracking-tight ${urgencyTextClass(urgency)}`}>
          {countdown}
        </p>
      </div>
    )
  }

  return (
    <div
      className={`text-right ${urgency === 'expired' ? 'text-gray-500' : ''}`}
      title={`Cutoff: ${formatCutoffLocal(cutoff)}`}
      role="timer"
      aria-live="polite"
      aria-atomic="true"
    >
      <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
        {urgency === 'expired' ? 'Cutoff passed' : 'Time to predict'}
      </p>
      <p className={`font-mono font-bold text-lg tabular-nums tracking-tight ${urgencyTextClass(urgency)}`}>
        {countdown}
      </p>
      {urgency !== 'expired' && (
        <p className="text-xs text-gray-400 mt-0.5">
          Closes {formatCutoffLocal(cutoff)}
        </p>
      )}
    </div>
  )
}
