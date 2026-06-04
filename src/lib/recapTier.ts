import type { MatchdayRecap, RecapTier } from '../types'

export function getRecapTier(recap: MatchdayRecap): RecapTier {
  const { matchday_points, matchday_rank, matchday_total_players, correct_scores } = recap

  if (matchday_points === 0) return 'rough'

  const percentile = matchday_rank / Math.max(matchday_total_players, 1)

  if (matchday_rank === 1 || (correct_scores >= 3 && matchday_points >= 25)) {
    return 'legendary'
  }
  if (percentile <= 0.25 || matchday_points >= 20) return 'great'
  if (percentile <= 0.55 || matchday_points >= 10) return 'solid'
  if (percentile <= 0.8) return 'poor'
  return 'rough'
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
    case 'legendary': return 'Outstanding round'
    case 'great': return 'Strong round'
    case 'solid': return 'Decent round'
    case 'poor': return 'Tough round'
    case 'rough': return 'Rough round'
  }
}
