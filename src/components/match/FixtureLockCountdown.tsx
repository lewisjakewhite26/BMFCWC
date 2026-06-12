import { useEffect, useState } from 'react'
import {
  countdownContainerClass,
  countdownLabelClass,
  countdownValueClass,
  formatCountdownClock,
  getCountdownUrgency,
} from '../../lib/countdown'
import { getFixtureCutoff, shouldShowFixtureLockCountdown } from '../../lib/scoring'

interface FixtureLockCountdownProps {
  kickoffUtc: string
}

export function FixtureLockCountdown({ kickoffUtc }: FixtureLockCountdownProps) {
  const cutoffMs = getFixtureCutoff(kickoffUtc).getTime()

  const [remaining, setRemaining] = useState(() => cutoffMs - Date.now())

  useEffect(() => {
    const tick = () => setRemaining(cutoffMs - Date.now())
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [cutoffMs])

  if (!shouldShowFixtureLockCountdown(kickoffUtc)) return null

  const urgency = getCountdownUrgency(remaining)

  return (
    <div
      className={`mt-3 rounded-xl border px-3.5 py-3 transition-colors duration-300 ${countdownContainerClass(urgency)} ${
        urgency === 'critical' ? 'animate-pulse' : ''
      }`}
      role="timer"
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-3">
        <p className={`text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold ${countdownLabelClass(urgency)}`}>
          Predictions close in
        </p>
        <p className={`font-mono font-bold text-xl sm:text-2xl tabular-nums tracking-tight ${countdownValueClass(urgency)}`}>
          {formatCountdownClock(remaining)}
        </p>
      </div>
    </div>
  )
}
