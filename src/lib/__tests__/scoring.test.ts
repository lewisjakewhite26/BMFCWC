import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getResultDirection,
  calculatePoints,
  getEarliestKickoff,
  getGameDayCutoff,
  getFixtureCutoff,
  getFixtureLockCountdownText,
  getNextFixtureCutoff,
  isFixturePredictionsLocked,
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

  it('locks predictions one minute before the earliest kickoff', () => {
    const cutoff = getGameDayCutoff(fixtures)
    expect(cutoff?.toISOString()).toBe('2026-06-15T18:59:00.000Z')
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
      vi.setSystemTime(new Date('2026-06-15T18:58:00.000Z'))
      expect(isGameDayPredictionsLocked(fixtures, true)).toBe(false)
    })

    it('is locked at the cutoff and after', () => {
      vi.setSystemTime(new Date('2026-06-15T18:59:00.000Z'))
      expect(isGameDayPredictionsLocked(fixtures, true)).toBe(true)

      vi.setSystemTime(new Date('2026-06-15T20:00:00.000Z'))
      expect(isGameDayPredictionsLocked(fixtures, true)).toBe(true)
    })
  })
})

describe('fixture cutoff', () => {
  const fixture = {
    kickoff_utc: '2026-06-15T19:00:00.000Z',
    status: 'open',
    home_score: null,
    away_score: null,
  }

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('locks one minute before kickoff', () => {
    expect(getFixtureCutoff(fixture.kickoff_utc).toISOString()).toBe('2026-06-15T18:59:00.000Z')
  })

  it('is editable before the fixture cutoff', () => {
    vi.setSystemTime(new Date('2026-06-15T18:58:00.000Z'))
    expect(isFixturePredictionsLocked(fixture, true)).toBe(false)
  })

  it('is locked at and after the fixture cutoff', () => {
    vi.setSystemTime(new Date('2026-06-15T18:59:00.000Z'))
    expect(isFixturePredictionsLocked(fixture, true)).toBe(true)
  })

  it('ignores stale locked status before the fixture cutoff', () => {
    vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'))
    expect(isFixturePredictionsLocked({ ...fixture, status: 'locked' }, true)).toBe(false)
  })

  it('finds the next open fixture cutoff', () => {
    vi.setSystemTime(new Date('2026-06-15T20:00:00.000Z'))
    const cutoffs = getNextFixtureCutoff(
      [
        fixture,
        {
          kickoff_utc: '2026-06-15T22:00:00.000Z',
          status: 'open',
          home_score: null,
          away_score: null,
        },
      ],
      true
    )
    expect(cutoffs?.toISOString()).toBe('2026-06-15T21:59:00.000Z')
  })

  it('shows a countdown within 24 hours of locking', () => {
    vi.setSystemTime(new Date('2026-06-15T16:45:00.000Z'))
    expect(getFixtureLockCountdownText(fixture.kickoff_utc)).toBe('locks in 2h 14m')
  })

  it('hides the countdown more than 24 hours before locking', () => {
    vi.setSystemTime(new Date('2026-06-14T12:00:00.000Z'))
    expect(getFixtureLockCountdownText(fixture.kickoff_utc)).toBeNull()
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
