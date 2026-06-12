import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  countdownContainerClass,
  countdownValueClass,
  formatCountdownClock,
  getCountdownUrgency,
} from '../../lib/countdown'
import type { MatchdayTabState } from '../../lib/matchdays'

interface DashboardStatusBannerProps {
  lockedCount: number
  total: number
  firstKickoff: Date | null
  hasOpenMatchday: boolean
  tabState?: MatchdayTabState
  onKickoffReached?: () => void
}

type BannerTone = 'complete' | 'idle'

function bannerClass(tone: BannerTone): string {
  switch (tone) {
    case 'idle':
      return 'bg-gray-50/90 border border-gray-200/80'
    case 'complete':
      return 'bg-emerald-50/90 border border-emerald-200/70'
    default:
      return 'bg-brand-blue/[0.06] border border-brand-blue/15'
  }
}

export function DashboardStatusBanner({
  lockedCount,
  total,
  firstKickoff,
  hasOpenMatchday,
  tabState,
  onKickoffReached,
}: DashboardStatusBannerProps) {
  const kickoffMs = firstKickoff?.getTime() ?? null
  const allSubmitted = total > 0 && lockedCount === total
  const progressPct = total > 0 ? Math.round((lockedCount / total) * 100) : 0
  const showKickoffCountdown = kickoffMs !== null && kickoffMs > Date.now()

  const [kickoffRemaining, setKickoffRemaining] = useState(() =>
    kickoffMs !== null ? kickoffMs - Date.now() : 0
  )
  const kickoffReachedCalled = useRef(false)
  const onKickoffReachedRef = useRef(onKickoffReached)
  onKickoffReachedRef.current = onKickoffReached

  useEffect(() => {
    kickoffReachedCalled.current = false
  }, [kickoffMs])

  useEffect(() => {
    if (kickoffMs === null || !showKickoffCountdown) return

    const tick = () => {
      const ms = kickoffMs - Date.now()
      setKickoffRemaining(ms)
      if (ms <= 0 && !kickoffReachedCalled.current) {
        kickoffReachedCalled.current = true
        onKickoffReachedRef.current?.()
      }
    }

    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [kickoffMs, showKickoffCountdown])

  if (tabState === 'complete') {
    return (
      <div className={`rounded-2xl px-4 py-4 ${bannerClass('complete')}`}>
        <p className="text-sm font-medium text-emerald-700">This matchday is complete. View your results below.</p>
      </div>
    )
  }

  if (tabState === 'locked' || !hasOpenMatchday) {
    return (
      <div className={`rounded-2xl px-4 py-4 ${bannerClass('idle')}`}>
        <p className="text-sm font-medium text-gray-600">
          {tabState === 'locked'
            ? 'This matchday is not open yet. Check back later.'
            : 'No matchday is currently open. Check back later.'}
        </p>
      </div>
    )
  }

  const kickoffUrgency = getCountdownUrgency(kickoffRemaining)

  let statusLine: string
  if (tabState === 'closed') {
    statusLine = 'All fixtures closed for predictions'
  } else if (allSubmitted) {
    statusLine = 'All predictions submitted'
  } else if (total === 0) {
    statusLine = 'Fixtures loading…'
  } else {
    statusLine = `${lockedCount} of ${total} predictions submitted`
  }

  return (
    <div
      className="rounded-2xl px-4 py-3.5 space-y-3 bg-white/60 border border-brand-blue/10"
      role="status"
      aria-live="polite"
    >
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wider font-semibold text-gray-500 mb-0.5">
          This matchday
        </p>
        <p className="text-sm sm:text-base font-medium text-brand-navy leading-snug">
          {statusLine}
        </p>
      </div>

      {showKickoffCountdown && (
        <div className={`rounded-xl border px-3.5 py-3 ${countdownContainerClass(kickoffUrgency)}`}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold text-gray-500">
              First game begins in
            </p>
            <p className={`font-mono font-bold text-xl sm:text-2xl tabular-nums tracking-tight ${countdownValueClass(kickoffUrgency)}`}>
              {formatCountdownClock(kickoffRemaining)}
            </p>
          </div>
        </div>
      )}

      {total > 0 && (
        <div className={`h-1.5 rounded-full overflow-hidden ${allSubmitted ? 'bg-emerald-200/50' : 'bg-brand-blue/10'}`}>
          <motion.div
            className={`h-full rounded-full ${
              allSubmitted
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
