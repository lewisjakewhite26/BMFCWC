export function getResultDirection(homeScore: number, awayScore: number): 'home' | 'away' | 'draw' {
  if (homeScore > awayScore) return 'home'
  if (awayScore > homeScore) return 'away'
  return 'draw'
}

export function calculatePoints(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number
): 0 | 5 | 10 {
  if (predictedHome === actualHome && predictedAway === actualAway) return 10
  if (getResultDirection(predictedHome, predictedAway) === getResultDirection(actualHome, actualAway)) return 5
  return 0
}

export function isFixtureLocked(
  fixture: { kickoff_utc: string; status: string; home_score: number | null; away_score?: number | null },
  gameDayFixtures?: { kickoff_utc: string }[],
  gameDayOpen?: boolean
): boolean {
  if (fixture.status === 'completed') return true
  if (fixture.home_score !== null && fixture.away_score != null) return true

  if (gameDayFixtures && gameDayFixtures.length > 0) {
    return isGameDayPredictionsLocked(gameDayFixtures, gameDayOpen ?? false)
  }

  if (fixture.status === 'locked') return true
  return new Date(fixture.kickoff_utc) <= new Date()
}

/** Earliest kickoff across a matchday's fixtures */
export function getEarliestKickoff(fixtures: { kickoff_utc: string }[]): Date | null {
  if (fixtures.length === 0) return null
  const times = fixtures.map((f) => new Date(f.kickoff_utc).getTime())
  return new Date(Math.min(...times))
}

/** Predictions lock 1 hour before the first kickoff of the matchday */
export function getGameDayCutoff(fixtures: { kickoff_utc: string }[]): Date | null {
  const earliest = getEarliestKickoff(fixtures)
  if (!earliest) return null
  return new Date(earliest.getTime() - 60 * 60 * 1000)
}

export function isGameDayPredictionsLocked(
  fixtures: { kickoff_utc: string }[],
  gameDayOpen: boolean
): boolean {
  if (!gameDayOpen) return true
  const cutoff = getGameDayCutoff(fixtures)
  if (!cutoff) return false
  return Date.now() >= cutoff.getTime()
}

export function formatCutoffLocal(cutoff: Date): string {
  return cutoff.toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatKickoffLocal(utcString: string): string {
  const date = new Date(utcString)
  return date.toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getStageLabel(stage: string): string {
  const labels: Record<string, string> = {
    group: 'Group Stage',
    round_of_32: 'Round of 32',
    round_of_16: 'Round of 16',
    quarter_final: 'Quarter-final',
    semi_final: 'Semi-final',
    third_place: 'Third Place',
    final: 'Final',
  }
  return labels[stage] || stage
}
