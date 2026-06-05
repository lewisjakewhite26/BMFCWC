import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getResultDirection,
  calculatePoints,
  getEarliestKickoff,
  getGameDayCutoff,
  isGameDayPredictionsLocked,
  getStageLabel,
} from '../scoring'

describe('getResultDirection', () => {
  it('returns home when home team scores more', () => {
    expect(getResultDirection(2, 1)).toBe('home')
  })

  it('returns away when away team scores more', () => {
    expect(getResultDirection(0, 3)).toBe('away')
  })

  it('returns draw on equal scores', () => {
    expect(getResultDirection(1, 1)).toBe('draw')
  })
})

describe('BMFC Scoring Logic Rules', () => {
  it('should award 10 points for an exact score match', () => {
    expect(calculatePoints(2, 1, 2, 1)).toBe(10)
  })

  it('should award 5 points for correct outcome but incorrect score line', () => {
    expect(calculatePoints(3, 0, 1, 0)).toBe(5)
  })

  it('should award 5 points for predicting a draw correctly with different numbers', () => {
    expect(calculatePoints(1, 1, 2, 2)).toBe(5)
  })

  it('should award 0 points for an incorrect outcome prediction', () => {
    expect(calculatePoints(0, 2, 2, 1)).toBe(0)
  })
})

describe('matchday cutoff', () => {
  const fixtures = [
    { kickoff_utc: '2026-06-15T19:00:00.000Z' },
    { kickoff_utc: '2026-06-15T22:00:00.000Z' },
  ]

  it('finds the earliest kickoff', () => {
    expect(getEarliestKickoff(fixtures)?.toISOString()).toBe('2026-06-15T19:00:00.000Z')
  })

  it('returns null when there are no fixtures', () => {
    expect(getEarliestKickoff([])).toBeNull()
    expect(getGameDayCutoff([])).toBeNull()
  })

  it('locks predictions one hour before the earliest kickoff', () => {
    const cutoff = getGameDayCutoff(fixtures)
    expect(cutoff?.toISOString()).toBe('2026-06-15T18:00:00.000Z')
  })

  describe('isGameDayPredictionsLocked', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('is locked when the matchday is not open', () => {
      vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'))
      expect(isGameDayPredictionsLocked(fixtures, false)).toBe(true)
    })

    it('is open before the cutoff when matchday is open', () => {
      vi.setSystemTime(new Date('2026-06-15T17:59:00.000Z'))
      expect(isGameDayPredictionsLocked(fixtures, true)).toBe(false)
    })

    it('is locked at the cutoff and after', () => {
      vi.setSystemTime(new Date('2026-06-15T18:00:00.000Z'))
      expect(isGameDayPredictionsLocked(fixtures, true)).toBe(true)

      vi.setSystemTime(new Date('2026-06-15T20:00:00.000Z'))
      expect(isGameDayPredictionsLocked(fixtures, true)).toBe(true)
    })
  })
})

describe('getStageLabel', () => {
  it('maps known knockout stages', () => {
    expect(getStageLabel('quarter_final')).toBe('Quarter-final')
    expect(getStageLabel('final')).toBe('Final')
  })

  it('falls back to the raw stage key', () => {
    expect(getStageLabel('unknown_stage')).toBe('unknown_stage')
  })
})
