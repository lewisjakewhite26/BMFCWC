import type { Fixture, GameDay } from '../types'
import { getGameDayCutoff, hasOpenFixturesForPredictions } from './scoring'

export const GROUP_STAGE_GAME_DAYS = [1, 2, 3] as const
export const FIRST_KNOCKOUT_GAME_DAY = 4

export type GroupStageGameDay = (typeof GROUP_STAGE_GAME_DAYS)[number]

export function isGroupStageGameDay(gameDay: number): gameDay is GroupStageGameDay {
  return gameDay >= 1 && gameDay <= 3
}

export function getGroupTabLabel(gameDay: number): string {
  return `Group Game ${gameDay}`
}

export type MatchdayTabState = 'predict' | 'closed' | 'complete' | 'locked'

export function getMatchdayTabState(gameDay: GameDay, fixtures: Fixture[]): MatchdayTabState {
  if (gameDay.status === 'completed') return 'complete'
  if (gameDay.status === 'locked') return 'locked'
  if (fixtures.length === 0) return 'locked'
  if (hasOpenFixturesForPredictions(fixtures, gameDay.status === 'open')) return 'predict'
  return 'closed'
}

export function getDefaultGroupTab(
  gameDays: GameDay[],
  fixturesByDay: Record<number, Fixture[]>
): number {
  const predictable = GROUP_STAGE_GAME_DAYS.find((day) => {
    const gd = gameDays.find((g) => g.game_day === day)
    const fixtures = fixturesByDay[day] ?? []
    return gd && getMatchdayTabState(gd, fixtures) === 'predict'
  })
  if (predictable) return predictable

  const open = GROUP_STAGE_GAME_DAYS.find((day) => {
    const gd = gameDays.find((g) => g.game_day === day)
    return gd?.status === 'open'
  })
  if (open) return open

  return 1
}

export function getMatchdayCutoff(fixtures: Fixture[]): Date | null {
  return getGameDayCutoff(fixtures)
}
