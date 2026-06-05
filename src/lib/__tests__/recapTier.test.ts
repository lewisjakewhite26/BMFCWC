import { describe, it, expect } from 'vitest'
import { getRecapTier, ordinal, tierHeadline } from '../recapTier'
import type { MatchdayRecap } from '../../types'

function recap(overrides: Partial<MatchdayRecap>): MatchdayRecap {
  return {
    game_day: 1,
    label: 'Matchday 1',
    matchday_points: 10,
    correct_scores: 1,
    correct_results: 1,
    predictions_count: 4,
    matchday_rank: 5,
    matchday_total_players: 10,
    overall_rank: 5,
    overall_total_players: 10,
    total_points: 45,
    ...overrides,
  }
}

describe('getRecapTier', () => {
  it('returns rough when no points were scored', () => {
    expect(getRecapTier(recap({ matchday_points: 0 }))).toBe('rough')
  })

  it('returns legendary for first place', () => {
    expect(getRecapTier(recap({ matchday_rank: 1, matchday_points: 15 }))).toBe('legendary')
  })

  it('returns legendary for high exact-score hauls', () => {
    expect(
      getRecapTier(recap({ matchday_rank: 3, correct_scores: 3, matchday_points: 25 }))
    ).toBe('legendary')
  })

  it('returns great for strong point totals or top-quartile rank', () => {
    expect(getRecapTier(recap({ matchday_points: 20, matchday_rank: 8 }))).toBe('great')
    expect(getRecapTier(recap({ matchday_points: 12, matchday_rank: 2, matchday_total_players: 10 }))).toBe(
      'great'
    )
  })

  it('returns solid for mid-table or decent points', () => {
    expect(getRecapTier(recap({ matchday_points: 10, matchday_rank: 5, matchday_total_players: 10 }))).toBe(
      'solid'
    )
  })

  it('returns poor before rough for low ranks with some points', () => {
    expect(getRecapTier(recap({ matchday_points: 5, matchday_rank: 8, matchday_total_players: 10 }))).toBe(
      'poor'
    )
    expect(getRecapTier(recap({ matchday_points: 5, matchday_rank: 9, matchday_total_players: 10 }))).toBe(
      'rough'
    )
  })
})

describe('ordinal', () => {
  it('formats standard ordinals', () => {
    expect(ordinal(1)).toBe('1st')
    expect(ordinal(2)).toBe('2nd')
    expect(ordinal(3)).toBe('3rd')
    expect(ordinal(4)).toBe('4th')
  })

  it('handles teens correctly', () => {
    expect(ordinal(11)).toBe('11th')
    expect(ordinal(12)).toBe('12th')
    expect(ordinal(13)).toBe('13th')
    expect(ordinal(21)).toBe('21st')
  })
})

describe('tierHeadline', () => {
  it('returns a headline for every tier', () => {
    expect(tierHeadline('legendary')).toBe('Outstanding round')
    expect(tierHeadline('great')).toBe('Strong round')
    expect(tierHeadline('solid')).toBe('Decent round')
    expect(tierHeadline('poor')).toBe('Tough round')
    expect(tierHeadline('rough')).toBe('Rough round')
  })
})
