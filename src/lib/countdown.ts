const HOUR_MS = 60 * 60 * 1000
const SIX_HOURS_MS = 6 * HOUR_MS
const TWO_HOURS_MS = 2 * HOUR_MS

export type CountdownUrgency = 'normal' | 'warning' | 'critical'

export function getCountdownUrgency(remainingMs: number): CountdownUrgency {
  if (remainingMs <= 0) return 'critical'
  if (remainingMs < TWO_HOURS_MS) return 'critical'
  if (remainingMs < SIX_HOURS_MS) return 'warning'
  return 'normal'
}

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

export function formatCountdownClock(ms: number): string {
  if (ms <= 0) return '0:00'

  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const days = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60

  if (days > 0) return `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`
  return `${minutes}:${pad(seconds)}`
}

export function countdownContainerClass(urgency: CountdownUrgency): string {
  switch (urgency) {
    case 'critical':
      return 'bg-red-50 border-red-200/80'
    case 'warning':
      return 'bg-amber-50 border-amber-200/80'
    default:
      return 'bg-brand-blue/[0.06] border-brand-blue/15'
  }
}

export function countdownLabelClass(urgency: CountdownUrgency): string {
  switch (urgency) {
    case 'critical':
      return 'text-red-700'
    case 'warning':
      return 'text-amber-700'
    default:
      return 'text-gray-500'
  }
}

export function countdownValueClass(urgency: CountdownUrgency): string {
  switch (urgency) {
    case 'critical':
      return 'text-red-600'
    case 'warning':
      return 'text-amber-600'
    default:
      return 'text-brand-blue'
  }
}
