import type { Fixture } from '../types'

export function isKnockoutPlaceholderName(name: string): boolean {
  return /winner|runner-up|runner up|place team|r32|r16|sf loser|sf winner|qf winner|3rd place/i.test(
    name
  )
}

export function fixtureHasPlaceholderTeams(fixture: Fixture): boolean {
  if (fixture.game_day < 4) return false
  return (
    isKnockoutPlaceholderName(fixture.home_team) ||
    isKnockoutPlaceholderName(fixture.away_team)
  )
}

export function isEditableKnockoutFixture(fixture: Fixture): boolean {
  return fixture.game_day >= 4 && fixture.status === 'upcoming'
}
