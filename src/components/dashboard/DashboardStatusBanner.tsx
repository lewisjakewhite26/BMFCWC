import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { formatCutoffLocal } from '../../lib/scoring'
import { hapticCelebrate } from '../../lib/haptics'

interface DashboardStatusBannerProps {
  lockedCount: number
  total: number
  cutoff: Date | null
  hasOpenMatchday: boolean
  onExpired?: () => void
}

const SIX_HOURS_MS = 6 * 60 * 60 * 1000
const TWO_HOURS_MS = 2 * 60 * 60 * 1000

type Urgency = 'expired' | 'critical' | 'warning' | 'normal' | 'complete' | 'idle'

function getUrgency(remainingMs: number, allLocked: boolean): Urgency {
  if (remainingMs <= 0) return 'expired'
  if (allLocked) return 'complete'
  if (remainingMs < TWO_HOURS_MS) return 'critical'
  if (remainingMs < SIX_HOURS_MS) return 'warning'
  return 'normal'
}

function bannerClass(urgency: Urgency): string {
  switch (urgency) {
    case 'idle':
      return 'bg-gray-50/90 border border-gray-200/80'
    case 'expired':
      return 'bg-gray-100 border border-gray-200'
    case 'complete':
      return 'bg-emerald-50/90 border border-emerald-200/70'
    case 'critical':
      return 'bg-red-50 border border-red-200/80'
    case 'warning':
      return 'bg-amber-50 border border-amber-200/80'
    default:
      return 'bg-brand-blue/[0.06] border border-brand-blue/15'
  }
}

function countdownClass(urgency: Urgency): string {
  switch (urgency) {
    case 'expired':
    case 'idle':
      return 'text-gray-500'
    case 'complete':
      return 'text-emerald-700'
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

function formatCountdown(ms: number): string {
  if (ms <= 0) return 'Closed'

  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const days = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60

  if (days > 0) return `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`
  return `${minutes}:${pad(seconds)}`
}

export function DashboardStatusBanner({
  lockedCount,
  total,
  cutoff,
  hasOpenMatchday,
  onExpired,
}: DashboardStatusBannerProps) {
  const cutoffMs = cutoff?.getTime() ?? null
  const allLocked = total > 0 && lockedCount === total
  const progressPct = total > 0 ? Math.round((lockedCount / total) * 100) : 0

  const [remaining, setRemaining] = useState(() =>
    cutoffMs !== null ? cutoffMs - Date.now() : 0
  )
  const expiredCalled = useRef(false)
  const wasComplete = useRef(false)
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

  useEffect(() => {
    if (allLocked && hasOpenMatchday && total > 0 && !wasComplete.current) {
      wasComplete.current = true
      hapticCelebrate()
    }
    if (!allLocked) wasComplete.current = false
  }, [allLocked, hasOpenMatchday, total])

  if (!hasOpenMatchday) {
    return (
      <div className={`rounded-2xl px-4 py-4 ${bannerClass('idle')}`}>
        <p className="text-sm font-medium text-gray-600">No matchday is currently open. Check back later.</p>
      </div>
    )
  }

  const urgency = getUrgency(remaining, allLocked && remaining > 0)
  const showCountdown = cutoff !== null && cutoffMs !== null

  let statusLine: string
  if (remaining <= 0) {
    statusLine = 'Predictions closed for this matchday'
  } else if (allLocked) {
    statusLine = 'All predictions submitted'
  } else if (total === 0) {
    statusLine = 'Fixtures loading…'
  } else {
    statusLine = `${lockedCount} of ${total} predictions submitted`
  }

  return (
    <div
      className={`rounded-2xl px-4 py-3.5 space-y-3 ${bannerClass(urgency)}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-gray-500 mb-0.5">
            This matchday
          </p>
          <p className="text-sm sm:text-base font-medium text-brand-navy leading-snug">
            {statusLine}
          </p>
          {showCountdown && remaining > 0 && (
            <p className="text-[11px] text-gray-400 mt-1 truncate">
              Closes {formatCutoffLocal(cutoff!)}
            </p>
          )}
        </div>
        {showCountdown && (
          <div className="text-right shrink-0">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">
              {remaining <= 0 ? 'Cutoff' : 'Time left'}
            </p>
            <p className={`font-mono font-bold text-xl sm:text-2xl tabular-nums tracking-tight ${countdownClass(urgency)}`}>
              {formatCountdown(remaining)}
            </p>
          </div>
        )}
      </div>

      {total > 0 && remaining > 0 && (
        <div className={`h-1.5 rounded-full overflow-hidden ${allLocked ? 'bg-emerald-200/50' : 'bg-brand-blue/10'}`}>
          <motion.div
            className={`h-full rounded-full ${
              allLocked
                ? 'bg-gradient-to-r from-emerald-500 to-brand-gold'
                : 'bg-brand-blue'
            }`}
            initial={false}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      )}
    </div>
  )
}
