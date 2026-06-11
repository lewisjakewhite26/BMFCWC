import { getSupabaseAdmin } from './supabaseAdmin.js'
import { calculatePoints } from './calculatePoints.js'
import { checkAndAutoCompleteMatchdays } from './autoProgression.js'

const MAX_DAILY_REQUESTS = 80
const FINISHED_STATUSES = ['FT', 'AET', 'PEN']
interface ApiFootballScoreline {
  home: number | null
  away: number | null
}

interface ApiFootballFixture {
  fixture: { id: number; date: string; status: { short: string } }
  goals: { home: number | null; away: number | null }
  score?: {
    fulltime?: ApiFootballScoreline
    extratime?: ApiFootballScoreline
    penalty?: ApiFootballScoreline
  }
  teams: { home: { name: string }; away: { name: string } }
}

function extractFinishedScores(
  apiFix: ApiFootballFixture
): { home: number; away: number } | null {
  const status = apiFix.fixture.status.short
  if (!FINISHED_STATUSES.includes(status)) return null

  let home = apiFix.goals?.home
  let away = apiFix.goals?.away

  if (home === null || away === null) {
    const ft = apiFix.score?.fulltime
    if (ft?.home != null && ft?.away != null) {
      home = ft.home
      away = ft.away
    }
  }

  if (status === 'AET' && (home === null || away === null)) {
    const et = apiFix.score?.extratime
    if (et?.home != null && et?.away != null) {
      home = et.home
      away = et.away
    }
  }

  if (status === 'PEN' && (home === null || away === null)) {
    const pen = apiFix.score?.penalty
    if (pen?.home != null && pen?.away != null) {
      home = pen.home
      away = pen.away
    }
  }

  if (home === null || away === null) return null
  return { home, away }
}

const TEAM_ALIASES: Record<string, string> = {
  'cote divoire': 'ivory coast',
  'korea republic': 'south korea',
  'congo dr': 'dr congo',
  'democratic republic of the congo': 'dr congo',
  'united states': 'usa',
  'bosnia herzegovina': 'bosnia and herzegovina',
  'bosnia and herzegovina': 'bosnia herzegovina',
  'czechia': 'czech republic',
}

function normalizeTeamName(name: string): string {
  let normalized = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  normalized = TEAM_ALIASES[normalized] ?? normalized
  if (normalized.includes('ivory coast') || normalized === 'cote divoire') {
    normalized = 'ivory coast'
  }
  return normalized
}

function teamsMatch(dbHome: string, dbAway: string, apiHome: string, apiAway: string): boolean {
  const dh = normalizeTeamName(dbHome)
  const da = normalizeTeamName(dbAway)
  const ah = normalizeTeamName(apiHome)
  const aa = normalizeTeamName(apiAway)

  const homeOk = dh === ah || dh.includes(ah) || ah.includes(dh)
  const awayOk = da === aa || da.includes(aa) || aa.includes(da)
  if (homeOk && awayOk) return true

  // API home/away can differ from our seed — match on the same pair either way
  const homeFlipped = dh === aa || dh.includes(aa) || aa.includes(dh)
  const awayFlipped = da === ah || da.includes(ah) || ah.includes(da)
  return homeFlipped && awayFlipped
}

function findApiFixtureByTeams(
  dbHome: string,
  dbAway: string,
  apiFixtures: ApiFootballFixture[]
): ApiFootballFixture | null {
  let best: { fixture: ApiFootballFixture; delta: number } | null = null

  for (const apiFix of apiFixtures) {
    if (!teamsMatch(dbHome, dbAway, apiFix.teams.home.name, apiFix.teams.away.name)) {
      continue
    }
    const delta = Date.now() - new Date(apiFix.fixture.date).getTime()
    const recency = delta >= 0 ? delta : Number.MAX_SAFE_INTEGER
    if (!best || recency < best.delta) {
      best = { fixture: apiFix, delta: recency }
    }
  }

  return best?.fixture ?? null
}

export interface SyncResult {
  success: boolean
  skipped?: boolean
  reason?: string
  message?: string
  updated?: number
  finishedSeen?: number
  fetched?: number
  pendingDb?: number
  repaired?: number
  unmatched?: string[]
  requestCount?: number
}

function todayDateString(): string {
  return new Date().toISOString().split('T')[0]
}

async function getRequestCount(date: string): Promise<number> {
  const supabase = getSupabaseAdmin()
  const { data } = await supabase
    .from('api_request_log')
    .select('request_count')
    .eq('date', date)
    .maybeSingle()

  return data?.request_count ?? 0
}

async function hasActiveFixtures(now: Date): Promise<boolean> {
  const supabase = getSupabaseAdmin()
  const windowStart = new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString()
  const windowEnd = new Date(now.getTime() + 15 * 60 * 1000).toISOString()

  const { data: activeFixtures } = await supabase
    .from('fixtures')
    .select('id')
    .gte('kickoff_utc', windowStart)
    .lte('kickoff_utc', windowEnd)
    .neq('status', 'completed')

  const lookbackStart = new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString()

  const { data: recentIncomplete } = await supabase
    .from('fixtures')
    .select('id')
    .gte('kickoff_utc', lookbackStart)
    .lte('kickoff_utc', now.toISOString())
    .neq('status', 'completed')

  return (activeFixtures?.length ?? 0) > 0 || (recentIncomplete?.length ?? 0) > 0
}

function apiFootballHeaders(apiKey: string): Record<string, string> {
  return {
    'x-apisports-key': apiKey,
    'x-rapidapi-key': apiKey,
  }
}

function getApiFootballConfig(): { apiKey: string; baseUrl: string; league: string; season: string } {
  const apiKey = process.env.API_FOOTBALL_KEY
  const baseUrl = process.env.API_FOOTBALL_BASE_URL
  const league = process.env.API_FOOTBALL_LEAGUE
  const season = process.env.API_FOOTBALL_SEASON

  if (!apiKey || !baseUrl || !league || !season) {
    throw new Error('Missing API-Football environment variables')
  }

  return { apiKey, baseUrl, league, season }
}

async function fetchApiFootball(path: string): Promise<ApiFootballFixture[]> {
  const { apiKey, baseUrl } = getApiFootballConfig()
  const normalizedBase = baseUrl.replace(/\/$/, '')
  const response = await fetch(`${normalizedBase}${path}`, { headers: apiFootballHeaders(apiKey) })

  if (!response.ok) {
    throw new Error(`API-Football responded with ${response.status}`)
  }

  const data = (await response.json()) as {
    response?: ApiFootballFixture[]
    errors?: Record<string, string>
    message?: string
  }

  const apiErrors = data.errors ?? {}
  const errorText = Object.values(apiErrors).filter(Boolean).join('; ')
  if (errorText) {
    throw new Error(`API-Football error: ${errorText}`)
  }

  return data.response ?? []
}

async function fetchAllSeasonFixtures(): Promise<ApiFootballFixture[]> {
  const { league, season } = getApiFootballConfig()
  return fetchApiFootball(`/fixtures?league=${league}&season=${season}`)
}

interface DbFixtureRow {
  id: number
  home_team: string
  away_team: string
  kickoff_utc: string
  status: string
  home_score: number | null
  away_score: number | null
}

async function getDbFixturesNeedingScores(now: Date): Promise<DbFixtureRow[]> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('fixtures')
    .select('id, home_team, away_team, kickoff_utc, status, home_score, away_score')
    .lte('kickoff_utc', now.toISOString())
    .neq('status', 'completed')

  if (error) throw error
  return data ?? []
}

async function repairCompletedFixturePoints(): Promise<number> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('fixtures')
    .select('id, home_score, away_score')
    .eq('status', 'completed')
    .not('home_score', 'is', null)
    .not('away_score', 'is', null)

  if (error) throw error

  let repaired = 0
  for (const fixture of data ?? []) {
    const { count } = await supabase
      .from('predictions')
      .select('id', { count: 'exact', head: true })
      .eq('fixture_id', fixture.id)

    if (!count) continue

    const { count: scoredCount } = await supabase
      .from('predictions')
      .select('id', { count: 'exact', head: true })
      .eq('fixture_id', fixture.id)
      .gt('points_awarded', 0)

    if ((scoredCount ?? 0) > 0) continue

    await calculatePoints(fixture.id, fixture.home_score!, fixture.away_score!)
    repaired++
  }

  return repaired
}

async function applyScoresFromApiSnapshot(
  apiFixtures: ApiFootballFixture[],
  now: Date
): Promise<{
  updated: number
  finishedSeen: number
  pendingDb: number
  unmatched: string[]
  affectedGameDays: number[]
}> {
  const supabase = getSupabaseAdmin()
  const dbFixtures = await getDbFixturesNeedingScores(now)
  let updated = 0
  const unmatched: string[] = []
  const affectedGameDays: number[] = []

  const finishedApi = apiFixtures.filter((apiFix) => extractFinishedScores(apiFix) !== null)
  const finishedSeen = finishedApi.length

  for (const dbFixture of dbFixtures) {
    const apiFix = findApiFixtureByTeams(dbFixture.home_team, dbFixture.away_team, finishedApi)
    if (!apiFix) {
      unmatched.push(`${dbFixture.home_team} vs ${dbFixture.away_team}`)
      continue
    }

    const scores = extractFinishedScores(apiFix)!
    await supabase.from('fixture_api_mapping').upsert(
      { fixture_id: dbFixture.id, api_fixture_id: apiFix.fixture.id },
      { onConflict: 'api_fixture_id' }
    )

    const { data: row } = await supabase
      .from('fixtures')
      .select('game_day')
      .eq('id', dbFixture.id)
      .single()

    await calculatePoints(dbFixture.id, scores.home, scores.away)
    updated++
    if (row?.game_day != null) {
      affectedGameDays.push(row.game_day)
    }
    console.log(
      `Updated fixture ${dbFixture.id}: ${dbFixture.home_team} ${scores.home}-${scores.away} ${dbFixture.away_team}`
    )
  }

  return { updated, finishedSeen, pendingDb: dbFixtures.length, unmatched, affectedGameDays }
}

export async function runSyncResults(options?: { force?: boolean }): Promise<SyncResult> {
  const supabase = getSupabaseAdmin()
  const now = new Date()
  const today = todayDateString()
  const currentCount = await getRequestCount(today)

  if (currentCount >= MAX_DAILY_REQUESTS) {
    await supabase.rpc('update_api_sync_log', {
      p_date: today,
      p_status: 'skipped',
      p_message: `Daily limit reached (${currentCount}/${MAX_DAILY_REQUESTS})`,
    })
    return {
      success: true,
      skipped: true,
      reason: 'Daily limit reached',
      requestCount: currentCount,
    }
  }

  if (!options?.force) {
    const active = await hasActiveFixtures(now)
    if (!active) {
      await supabase.rpc('update_api_sync_log', {
        p_date: today,
        p_status: 'idle',
        p_message: 'No active fixtures in window',
      })
      return {
        success: true,
        skipped: true,
        reason: 'No active fixtures',
        requestCount: currentCount,
      }
    }
  }

  let requestCount = currentCount

  const trackApiRequest = async (): Promise<boolean> => {
    if (requestCount >= MAX_DAILY_REQUESTS) return false
    const { data: newCount, error: countError } = await supabase.rpc('increment_api_request_log', {
      p_date: today,
    })
    if (countError) throw countError
    requestCount = newCount as number
    return true
  }

  if (!(await trackApiRequest())) {
    return {
      success: true,
      skipped: true,
      reason: 'Daily limit reached',
      requestCount,
    }
  }

  const seasonFixtures = await fetchAllSeasonFixtures()
  const snapshot = await applyScoresFromApiSnapshot(seasonFixtures, now)

  let repaired = 0
  if (options?.force) {
    repaired = await repairCompletedFixturePoints()
  }

  await checkAndAutoCompleteMatchdays(snapshot.affectedGameDays)

  const updatedCount = snapshot.updated + repaired
  let message =
    updatedCount > 0
      ? `Updated ${updatedCount} fixture${updatedCount === 1 ? '' : 's'}`
      : 'No new results to apply'

  if (updatedCount === 0) {
    if (seasonFixtures.length === 0) {
      message = 'API returned 0 fixtures — check API_FOOTBALL_KEY, league and season env vars'
    } else if (snapshot.finishedSeen === 0) {
      message = `API has ${seasonFixtures.length} fixtures but none marked finished yet`
    } else if (snapshot.pendingDb === 0) {
      message = `${snapshot.finishedSeen} finished in API — all kicked-off fixtures already scored`
    } else if (snapshot.unmatched.length > 0) {
      message = `${snapshot.pendingDb} need scores, 0 matched API (e.g. ${snapshot.unmatched.slice(0, 2).join(', ')})`
    } else {
      message = `${snapshot.finishedSeen} finished in API, already scored`
    }
  }

  await supabase.rpc('update_api_sync_log', {
    p_date: today,
    p_status: 'success',
    p_message: message,
  })

  return {
    success: true,
    message,
    updated: updatedCount,
    fetched: seasonFixtures.length,
    finishedSeen: snapshot.finishedSeen,
    pendingDb: snapshot.pendingDb,
    repaired: repaired > 0 ? repaired : undefined,
    unmatched: snapshot.unmatched.length > 0 ? snapshot.unmatched : undefined,
    requestCount,
  }
}

export async function recordSyncError(error: unknown): Promise<void> {
  try {
    const supabase = getSupabaseAdmin()
    const today = todayDateString()
    const { error: rpcError } = await supabase.rpc('update_api_sync_log', {
      p_date: today,
      p_status: 'error',
      p_message: error instanceof Error ? error.message : String(error),
    })
    if (rpcError) {
      console.error('update_api_sync_log failed:', rpcError.message)
    }
  } catch (logError) {
    console.error('recordSyncError failed:', logError)
  }
}
