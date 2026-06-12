import { describe, it, expect } from 'vitest'
import { getRecapTier, ordinal, tierHeadline, tierEmoji } from '../recapTier'
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
  it('returns spotOn for first place regardless of points', () => {
    expect(getRecapTier(recap({ matchday_rank: 1, matchday_points: 0 }))).toBe('spotOn')
    expect(getRecapTier(recap({ matchday_rank: 1, matchday_points: 15 }))).toBe('spotOn')
  })

  it('returns great for top quartile (excluding 1st)', () => {
    expect(getRecapTier(recap({ matchday_rank: 2, matchday_total_players: 10 }))).toBe('great')
    expect(getRecapTier(recap({ matchday_rank: 3, matchday_total_players: 12 }))).toBe('great')
  })

  it('returns solid for ranks up to 55th percentile', () => {
    expect(getRecapTier(recap({ matchday_rank: 5, matchday_total_players: 10 }))).toBe('solid')
    expect(getRecapTier(recap({ matchday_rank: 6, matchday_total_players: 10 }))).toBe('solid')
  })

  it('returns poor for ranks up to 80th percentile', () => {
    expect(getRecapTier(recap({ matchday_rank: 8, matchday_total_players: 10 }))).toBe('poor')
  })

  it('returns nightmare for bottom 20% regardless of points', () => {
    expect(getRecapTier(recap({ matchday_rank: 9, matchday_total_players: 10, matchday_points: 0 }))).toBe(
      'nightmare'
    )
    expect(getRecapTier(recap({ matchday_rank: 10, matchday_total_players: 10, matchday_points: 25 }))).toBe(
      'nightmare'
    )
  })

  it('ignores points and exact scores for tier assignment', () => {
    expect(
      getRecapTier(recap({ matchday_rank: 3, correct_scores: 5, matchday_points: 30, matchday_total_players: 10 }))
    ).toBe('great')
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
    expect(tierHeadline('spotOn')).toBe('Spot on')
    expect(tierHeadline('great')).toBe('Strong round')
    expect(tierHeadline('solid')).toBe('Decent round')
    expect(tierHeadline('poor')).toBe('Tough round')
    expect(tierHeadline('nightmare')).toBe('Nightmare round')
  })
})

describe('tierEmoji', () => {
  it('returns an emoji for every tier', () => {
    expect(tierEmoji('spotOn')).toBe('🥇')
    expect(tierEmoji('great')).toBe('⭐')
    expect(tierEmoji('solid')).toBe('🎯')
    expect(tierEmoji('poor')).toBe('😬')
    expect(tierEmoji('nightmare')).toBe('💩')
  })
})
