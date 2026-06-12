import type { MatchdayRecap, RecapTier } from '../types'

export function getRecapTier(recap: MatchdayRecap): RecapTier {
  const { matchday_rank, matchday_total_players } = recap
  const total = Math.max(matchday_total_players, 1)

  if (matchday_rank === 1) return 'spotOn'
  if (matchday_rank <= Math.ceil(total * 0.25)) return 'great'
  if (matchday_rank <= Math.ceil(total * 0.55)) return 'solid'
  if (matchday_rank <= Math.ceil(total * 0.8)) return 'poor'
  return 'nightmare'
}

export function ordinal(n: number): string {
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`
  switch (n % 10) {
    case 1: return `${n}st`
    case 2: return `${n}nd`
    case 3: return `${n}rd`
    default: return `${n}th`
  }
}

export function tierHeadline(tier: RecapTier): string {
  switch (tier) {
    case 'spotOn': return 'Spot on'
    case 'great': return 'Strong round'
    case 'solid': return 'Decent round'
    case 'poor': return 'Tough round'
    case 'nightmare': return 'Nightmare round'
  }
}

export function tierEmoji(tier: RecapTier): string {
  switch (tier) {
    case 'spotOn': return '🥇'
    case 'great': return '⭐'
    case 'solid': return '🎯'
    case 'poor': return '😬'
    case 'nightmare': return '💩'
  }
}
