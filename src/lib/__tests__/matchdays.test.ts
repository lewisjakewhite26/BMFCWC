import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getDefaultGroupTab,
  getGroupTabLabel,
  getMatchdayTabState,
  isGroupStageComplete,
  isGroupStageGameDay,
} from '../matchdays'
import type { Fixture, GameDay } from '../../types'

const openDay = (gameDay: number): GameDay => ({
  id: gameDay,
  game_day: gameDay,
  label: `Group Stage, Matchday ${gameDay}`,
  status: 'open',
  opened_at: '2026-06-01T12:00:00.000Z',
  completed_at: null,
})

const fixtures = [
  { kickoff_utc: '2026-06-15T19:00:00.000Z', status: 'open', home_score: null, away_score: null },
] as Fixture[]

const multiFixtures = [
  { kickoff_utc: '2026-06-15T19:00:00.000Z', status: 'open', home_score: null, away_score: null },
  { kickoff_utc: '2026-06-15T22:00:00.000Z', status: 'open', home_score: null, away_score: null },
] as Fixture[]

describe('matchdays', () => {
  it('identifies group-stage matchdays', () => {
    expect(isGroupStageGameDay(1)).toBe(true)
    expect(isGroupStageGameDay(3)).toBe(true)
    expect(isGroupStageGameDay(4)).toBe(false)
  })

  it('formats group tab labels', () => {
    expect(getGroupTabLabel(2)).toBe('Group Game 2')
  })

  describe('getMatchdayTabState', () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => vi.useRealTimers())

    it('returns complete for completed matchdays', () => {
      expect(getMatchdayTabState({ ...openDay(1), status: 'completed' }, fixtures)).toBe('complete')
    })

    it('returns closed when every fixture has passed its cutoff', () => {
      vi.setSystemTime(new Date('2026-06-15T20:00:00.000Z'))
      expect(getMatchdayTabState(openDay(1), fixtures)).toBe('closed')
    })

    it('stays open while later fixtures are still editable', () => {
      vi.setSystemTime(new Date('2026-06-15T20:00:00.000Z'))
      expect(getMatchdayTabState(openDay(1), multiFixtures)).toBe('predict')
    })

    it('returns predict while open and before cutoff', () => {
      vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'))
      expect(getMatchdayTabState(openDay(1), fixtures)).toBe('predict')
    })
  })

  describe('getDefaultGroupTab', () => {
    beforeEach(() => vi.useFakeTimers())
    afterEach(() => vi.useRealTimers())

    it('prefers the first predictable tab', () => {
      vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'))
      const gameDays = [openDay(1), openDay(2), openDay(3)]
      const fixturesByDay = {
        1: [{ kickoff_utc: '2026-06-10T19:00:00.000Z', status: 'open', home_score: null, away_score: null }] as Fixture[],
        2: [{ kickoff_utc: '2026-06-18T19:00:00.000Z', status: 'open', home_score: null, away_score: null }] as Fixture[],
        3: [{ kickoff_utc: '2026-06-24T19:00:00.000Z', status: 'open', home_score: null, away_score: null }] as Fixture[],
      }
      expect(getDefaultGroupTab(gameDays, fixturesByDay)).toBe(2)
    })
  })

  describe('isGroupStageComplete', () => {
    it('returns true when all three group matchdays are completed', () => {
      const gameDays = [1, 2, 3].map((day) => ({ ...openDay(day), status: 'completed' as const }))
      expect(isGroupStageComplete(gameDays)).toBe(true)
    })

    it('returns false while any group matchday is still open', () => {
      const gameDays = [
        { ...openDay(1), status: 'completed' as const },
        openDay(2),
        { ...openDay(3), status: 'completed' as const },
      ]
      expect(isGroupStageComplete(gameDays)).toBe(false)
    })
  })
})
