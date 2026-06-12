import type { LeaderboardEntry } from '../types'

export const LEADERBOARD_TIEBREAKER_RULE =
  'If two or more players finish level on points at the end of the tournament, the tiebreaker is the most exact scores predicted across all matchdays. If that is also level, those players are declared joint winners.'

export function areLeaderboardEntriesTied(a: LeaderboardEntry, b: LeaderboardEntry): boolean {
  return a.total_points === b.total_points && a.correct_scores === b.correct_scores
}

export function compareLeaderboardEntries(a: LeaderboardEntry, b: LeaderboardEntry): number {
  if (b.total_points !== a.total_points) return b.total_points - a.total_points
  return b.correct_scores - a.correct_scores
}

export function sortLeaderboardEntries(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...entries].sort(compareLeaderboardEntries)
}

export function getLeaderboardRanks(entries: LeaderboardEntry[]): Map<string, number> {
  const sorted = sortLeaderboardEntries(entries)
  const ranks = new Map<string, number>()
  let rank = 0

  for (let i = 0; i < sorted.length; i++) {
    if (i === 0 || !areLeaderboardEntriesTied(sorted[i], sorted[i - 1])) {
      rank = i + 1
    }
    ranks.set(sorted[i].id, rank)
  }

  return ranks
}

export function getLeaderboardRank(entries: LeaderboardEntry[], entryId: string): number | null {
  const ranks = getLeaderboardRanks(entries)
  return ranks.get(entryId) ?? null
}
