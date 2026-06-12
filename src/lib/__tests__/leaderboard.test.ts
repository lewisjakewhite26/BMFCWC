import { describe, expect, it } from 'vitest'
import type { LeaderboardEntry } from '../../types'
import {
  getLeaderboardRank,
  getLeaderboardRanks,
  sortLeaderboardEntries,
} from '../leaderboard'

function entry(
  id: string,
  total_points: number,
  correct_scores: number
): LeaderboardEntry {
  return {
    id,
    display_name: id,
    total_points,
    correct_scores,
    correct_results: 0,
  }
}

describe('sortLeaderboardEntries', () => {
  it('sorts by total points descending', () => {
    const sorted = sortLeaderboardEntries([
      entry('a', 10, 1),
      entry('b', 30, 0),
      entry('c', 20, 2),
    ])

    expect(sorted.map((e) => e.id)).toEqual(['b', 'c', 'a'])
  })

  it('uses exact scores as the secondary sort when points are tied', () => {
    const sorted = sortLeaderboardEntries([
      entry('a', 50, 2),
      entry('b', 50, 5),
      entry('c', 50, 3),
    ])

    expect(sorted.map((e) => e.id)).toEqual(['b', 'c', 'a'])
  })
})

describe('getLeaderboardRanks', () => {
  it('assigns joint ranks when points and exact scores are tied', () => {
    const entries = [
      entry('a', 50, 5),
      entry('b', 50, 5),
      entry('c', 40, 4),
    ]

    const ranks = getLeaderboardRanks(entries)

    expect(ranks.get('a')).toBe(1)
    expect(ranks.get('b')).toBe(1)
    expect(ranks.get('c')).toBe(3)
  })
})

describe('getLeaderboardRank', () => {
  it('returns the rank for a specific player', () => {
    const entries = [
      entry('a', 50, 5),
      entry('b', 40, 4),
      entry('c', 40, 4),
    ]

    expect(getLeaderboardRank(entries, 'a')).toBe(1)
    expect(getLeaderboardRank(entries, 'b')).toBe(2)
    expect(getLeaderboardRank(entries, 'c')).toBe(2)
  })
})
