import { getSupabaseAdmin } from './supabaseAdmin.js'
import { calculatePoints } from './calculatePoints.js'
import { checkAndAutoCompleteMatchdays } from './autoProgression.js'

const MAX_DAILY_REQUESTS = 80
const FINISHED_STATUSES = ['FT', 'AET', 'PEN']
const KICKOFF_MATCH_MS = 48 * 60 * 60 * 1000

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
  return homeOk && awayOk
}

function shiftDateString(date: string, days: number): string {
  const shifted = new Date(`${date}T12:00:00.000Z`)
  shifted.setUTCDate(shifted.getUTCDate() + days)
  return shifted.toISOString().split('T')[0]
}

async function findOurFixtureId(
  apiFixtureId: number,
  homeTeam: string,
  awayTeam: string,
  apiKickoff: string
): Promise<number | null> {
  const supabase = getSupabaseAdmin()

  const { data: mapping } = await supabase
    .from('fixture_api_mapping')
    .select('fixture_id')
    .eq('api_fixture_id', apiFixtureId)
    .maybeSingle()

  if (mapping?.fixture_id) return mapping.fixture_id

  const apiTime = new Date(apiKickoff).getTime()
  const windowStart = new Date(apiTime - KICKOFF_MATCH_MS).toISOString()
  const windowEnd = new Date(apiTime + KICKOFF_MATCH_MS).toISOString()

  const { data: candidates } = await supabase
    .from('fixtures')
    .select('id, home_team, away_team, kickoff_utc, game_day')
    .neq('status', 'completed')
    .gte('kickoff_utc', windowStart)
    .lte('kickoff_utc', windowEnd)

  let best: { id: number; game_day: number; delta: number } | null = null
  let matchedByTeamPairing = false

  for (const fixture of candidates ?? []) {
    if (!teamsMatch(fixture.home_team, fixture.away_team, homeTeam, awayTeam)) {
      continue
    }

    const delta = Math.abs(new Date(fixture.kickoff_utc).getTime() - apiTime)
    if (!best || delta < best.delta) {
      best = { id: fixture.id, game_day: fixture.game_day, delta: delta }
    }
  }

  if (!best) {
    const { data: allIncomplete } = await supabase
      .from('fixtures')
      .select('id, home_team, away_team, kickoff_utc, game_day')
      .neq('status', 'completed')

    const teamMatches = (allIncomplete ?? []).filter((fixture) =>
      teamsMatch(fixture.home_team, fixture.away_team, homeTeam, awayTeam)
    )

    if (teamMatches.length === 1) {
      matchedByTeamPairing = true
      best = {
        id: teamMatches[0].id,
        game_day: teamMatches[0].game_day,
        delta: Math.abs(new Date(teamMatches[0].kickoff_utc).getTime() - apiTime),
      }
      console.log(`Matched ${homeTeam} vs ${awayTeam} by team pairing → fixture ${best.id}`)
    } else if (teamMatches.length > 1) {
      for (const fixture of teamMatches) {
        const delta = Math.abs(new Date(fixture.kickoff_utc).getTime() - apiTime)
        if (!best || delta < best.delta) {
          best = { id: fixture.id, game_day: fixture.game_day, delta }
        }
      }
    }
  }

  if (!best) return null

  if (!matchedByTeamPairing && best.delta > KICKOFF_MATCH_MS) {
    console.log(
      `Rejected ${homeTeam} vs ${awayTeam}: kickoff mismatch (${Math.round(best.delta / 3600000)}h)`
    )
    return null
  }

  await supabase.from('fixture_api_mapping').upsert(
    { fixture_id: best.id, api_fixture_id: apiFixtureId },
    { onConflict: 'api_fixture_id' }
  )

  console.log(`Mapped API ${apiFixtureId} → fixture ${best.id} (game_day ${best.game_day})`)
  return best.id
}

export interface SyncResult {
  success: boolean
  skipped?: boolean
  reason?: string
  updated?: number
  finishedSeen?: number
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

async function getSyncDates(now: Date): Promise<string[]> {
  const supabase = getSupabaseAdmin()
  const dates = new Set<string>([todayDateString()])
  const lookbackStart = new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString()

  const { data } = await supabase
    .from('fixtures')
    .select('kickoff_utc')
    .gte('kickoff_utc', lookbackStart)
    .lte('kickoff_utc', now.toISOString())
    .neq('status', 'completed')

  for (const row of data ?? []) {
    dates.add(row.kickoff_utc.split('T')[0])
  }

  return [...dates].sort()
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
  const response = await fetch(`${baseUrl}${path}`, { headers: apiFootballHeaders(apiKey) })

  if (!response.ok) {
    throw new Error(`API-Football responded with ${response.status}`)
  }

  const data = await response.json()
  return (data.response ?? []) as ApiFootballFixture[]
}

async function fetchApiFixtures(date: string): Promise<ApiFootballFixture[]> {
  const { league, season } = getApiFootballConfig()
  return fetchApiFootball(`/fixtures?league=${league}&season=${season}&date=${date}`)
}

async function fetchFinishedApiFixtures(from: string, to: string): Promise<ApiFootballFixture[]> {
  const { league, season } = getApiFootballConfig()
  return fetchApiFootball(
    `/fixtures?league=${league}&season=${season}&from=${from}&to=${to}&status=FT-AET-PEN`
  )
}

async function fetchRecentFinishedFixtures(limit = 15): Promise<ApiFootballFixture[]> {
  const { league, season } = getApiFootballConfig()
  return fetchApiFootball(
    `/fixtures?league=${league}&season=${season}&status=FT-AET-PEN&last=${limit}`
  )
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

  const syncDates = await getSyncDates(now)
  const apiFixturesById = new Map<number, ApiFootballFixture>()
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

  for (const syncDate of syncDates) {
    if (!(await trackApiRequest())) break
    const dayFixtures = await fetchApiFixtures(syncDate)
    for (const apiFix of dayFixtures) {
      apiFixturesById.set(apiFix.fixture.id, apiFix)
    }
  }

  const fromDate = shiftDateString(syncDates[0], -1)
  const toDate = shiftDateString(syncDates[syncDates.length - 1], 1)
  if (await trackApiRequest()) {
    const finishedFixtures = await fetchFinishedApiFixtures(fromDate, toDate)
    for (const apiFix of finishedFixtures) {
      apiFixturesById.set(apiFix.fixture.id, apiFix)
    }
  }

  if (options?.force && (await trackApiRequest())) {
    const recentFinished = await fetchRecentFinishedFixtures()
    for (const apiFix of recentFinished) {
      apiFixturesById.set(apiFix.fixture.id, apiFix)
    }
  }

  let updatedCount = 0
  let finishedSeen = 0
  const unmatched: string[] = []
  const affectedGameDays: number[] = []

  const sortedFixtures = [...apiFixturesById.values()].sort(
    (a, b) => new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime()
  )

  for (const apiFix of sortedFixtures) {
    const apiFixtureId = apiFix.fixture.id
    const homeTeam = apiFix.teams.home.name
    const awayTeam = apiFix.teams.away.name
    const scores = extractFinishedScores(apiFix)
    if (!scores) continue

    const { home: homeScore, away: awayScore } = scores
    finishedSeen++

    const ourFixtureId = await findOurFixtureId(
      apiFixtureId,
      homeTeam,
      awayTeam,
      apiFix.fixture.date
    )
    if (!ourFixtureId) {
      const label = `${homeTeam} vs ${awayTeam}`
      unmatched.push(label)
      console.log(`No match found for ${label} (${apiFix.fixture.date})`)
      continue
    }

    const { data: ourFixture } = await supabase
      .from('fixtures')
      .select('status, game_day')
      .eq('id', ourFixtureId)
      .single()

    if (ourFixture?.status === 'completed') continue

    await calculatePoints(ourFixtureId, homeScore, awayScore)
    updatedCount++
    if (ourFixture?.game_day != null) {
      affectedGameDays.push(ourFixture.game_day)
    }
    console.log(
      `Updated game_day ${ourFixture?.game_day}: ${homeTeam} ${homeScore}-${awayScore} ${awayTeam}`
    )
  }

  await checkAndAutoCompleteMatchdays(affectedGameDays)

  let message =
    updatedCount > 0
      ? `Updated ${updatedCount} fixture${updatedCount === 1 ? '' : 's'}`
      : 'No new results to apply'

  if (updatedCount === 0 && finishedSeen > 0 && unmatched.length > 0) {
    message = `${finishedSeen} finished in API, 0 matched (e.g. ${unmatched.slice(0, 2).join(', ')})`
  } else if (updatedCount === 0 && finishedSeen > 0) {
    message = `${finishedSeen} finished in API, already scored`
  }

  await supabase.rpc('update_api_sync_log', {
    p_date: today,
    p_status: 'success',
    p_message: message,
  })

  return {
    success: true,
    updated: updatedCount,
    finishedSeen,
    unmatched: unmatched.length > 0 ? unmatched : undefined,
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
