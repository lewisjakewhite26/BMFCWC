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

/** Earliest kickoff across a matchday's fixtures */
export function getEarliestKickoff(fixtures: { kickoff_utc: string }[]): Date | null {
  if (fixtures.length === 0) return null
  const times = fixtures.map((f) => new Date(f.kickoff_utc).getTime())
  return new Date(Math.min(...times))
}

const PREDICTION_LOCK_MS = 60 * 1000

/** Predictions lock 1 minute before the first kickoff of the matchday */
export function getGameDayCutoff(fixtures: { kickoff_utc: string }[]): Date | null {
  const earliest = getEarliestKickoff(fixtures)
  if (!earliest) return null
  return new Date(earliest.getTime() - PREDICTION_LOCK_MS)
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

const HOUR_MS = 60 * 60 * 1000
const LOCK_COUNTDOWN_WINDOW_MS = 24 * HOUR_MS

type FixtureLockFields = {
  kickoff_utc: string
  status: string
  home_score: number | null
  away_score: number | null
}

/** Predictions lock 1 minute before this fixture's kickoff */
export function getFixtureCutoff(kickoffUtc: string): Date {
  return new Date(new Date(kickoffUtc).getTime() - PREDICTION_LOCK_MS)
}

export function isFixturePredictionsLocked(
  fixture: FixtureLockFields,
  gameDayOpen: boolean
): boolean {
  if (!gameDayOpen) return true
  if (fixture.status === 'completed') return true
  if (fixture.home_score !== null && fixture.away_score !== null) return true
  return Date.now() >= getFixtureCutoff(fixture.kickoff_utc).getTime()
}

export function hasOpenFixturesForPredictions(
  fixtures: FixtureLockFields[],
  gameDayOpen: boolean
): boolean {
  return fixtures.some((fixture) => !isFixturePredictionsLocked(fixture, gameDayOpen))
}

/** Earliest upcoming fixture cutoff among fixtures still accepting predictions */
export function getNextFixtureCutoff(
  fixtures: FixtureLockFields[],
  gameDayOpen: boolean
): Date | null {
  const cutoffs = fixtures
    .filter((fixture) => !isFixturePredictionsLocked(fixture, gameDayOpen))
    .map((fixture) => getFixtureCutoff(fixture.kickoff_utc).getTime())

  if (cutoffs.length === 0) return null
  return new Date(Math.min(...cutoffs))
}

/** True when within 24 hours of the fixture prediction cutoff */
export function shouldShowFixtureLockCountdown(kickoffUtc: string, now = Date.now()): boolean {
  const remaining = getFixtureCutoff(kickoffUtc).getTime() - now
  return remaining > 0 && remaining <= LOCK_COUNTDOWN_WINDOW_MS
}

/** Returns "locks in 2h 15m" when within 24 hours of the fixture cutoff, otherwise null */
export function getFixtureLockCountdownText(kickoffUtc: string, now = Date.now()): string | null {
  if (!shouldShowFixtureLockCountdown(kickoffUtc, now)) return null

  const remaining = getFixtureCutoff(kickoffUtc).getTime() - now
  const totalMinutes = Math.ceil(remaining / 60_000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours > 0 && minutes > 0) return `locks in ${hours}h ${minutes}m`
  if (hours > 0) return `locks in ${hours}h`
  return `locks in ${minutes}m`
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
