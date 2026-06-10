import type { User, GameDay, Fixture, Prediction, LeaderboardEntry } from '../types'

export const DEV_BYPASS_TOKEN = 'dev-bypass-token'

export const DEV_USER: User = {
  id: '00000000-0000-0000-0000-000000000001',
  username: 'preview_user',
  display_name: 'Preview Player',
  is_admin: false,
  total_points: 45,
  has_paid: false,
  session_token: DEV_BYPASS_TOKEN,
}

export const DEV_ADMIN: User = {
  id: '00000000-0000-0000-0000-000000000002',
  username: 'preview_admin',
  display_name: 'Preview Admin',
  is_admin: true,
  total_points: 120,
  has_paid: true,
  session_token: DEV_BYPASS_TOKEN,
}

export function isDevBypassEnabled(): boolean {
  return import.meta.env.DEV
}

export function isDevBypassSession(user: User | null | undefined): boolean {
  return user?.session_token === DEV_BYPASS_TOKEN
}

export const MOCK_GAME_DAYS: GameDay[] = [
  { id: 1, game_day: 1, label: 'Group Stage — Matchday 1', status: 'open', opened_at: '2026-06-01T12:00:00.000Z', completed_at: null },
  { id: 2, game_day: 2, label: 'Group Stage — Matchday 2', status: 'open', opened_at: new Date().toISOString(), completed_at: null },
  { id: 3, game_day: 3, label: 'Group Stage — Matchday 3', status: 'open', opened_at: new Date().toISOString(), completed_at: null },
]

export const MOCK_FIXTURES: Fixture[] = [
  {
    id: 101, game_day: 1, stage: 'group', group_name: 'A',
    home_team: 'Mexico', away_team: 'South Africa', home_flag: '🇲🇽', away_flag: '🇿🇦',
    kickoff_utc: '2026-06-11T19:00:00.000Z', venue: 'Estadio Azteca', city: 'Mexico City', country: 'Mexico',
    status: 'open', home_score: null, away_score: null,
  },
  {
    id: 102, game_day: 1, stage: 'group', group_name: 'C',
    home_team: 'Brazil', away_team: 'Morocco', home_flag: '🇧🇷', away_flag: '🇲🇦',
    kickoff_utc: '2026-06-13T22:00:00.000Z', venue: 'MetLife Stadium', city: 'New Jersey', country: 'USA',
    status: 'open', home_score: null, away_score: null,
  },
  {
    id: 1, game_day: 2, stage: 'group', group_name: 'A',
    home_team: 'Mexico', away_team: 'South Africa', home_flag: '🇲🇽', away_flag: '🇿🇦',
    kickoff_utc: '2026-06-11T19:00:00.000Z', venue: 'Estadio Azteca', city: 'Mexico City', country: 'Mexico',
    status: 'open', home_score: null, away_score: null,
  },
  {
    id: 2, game_day: 2, stage: 'group', group_name: 'B',
    home_team: 'Canada', away_team: 'Bosnia & Herzegovina', home_flag: '🇨🇦', away_flag: '🇧🇦',
    kickoff_utc: '2026-06-12T19:00:00.000Z', venue: 'BMO Field', city: 'Toronto', country: 'Canada',
    status: 'open', home_score: null, away_score: null,
  },
  {
    id: 3, game_day: 2, stage: 'group', group_name: 'C',
    home_team: 'Brazil', away_team: 'Morocco', home_flag: '🇧🇷', away_flag: '🇲🇦',
    kickoff_utc: '2026-06-13T22:00:00.000Z', venue: 'MetLife Stadium', city: 'New Jersey', country: 'USA',
    status: 'open', home_score: null, away_score: null,
  },
  {
    id: 4, game_day: 2, stage: 'group', group_name: 'D',
    home_team: 'USA', away_team: 'Paraguay', home_flag: '🇺🇸', away_flag: '🇵🇾',
    kickoff_utc: '2026-06-13T01:00:00.000Z', venue: 'SoFi Stadium', city: 'Los Angeles', country: 'USA',
    status: 'open', home_score: null, away_score: null,
  },
  {
    id: 5, game_day: 2, stage: 'group', group_name: 'E',
    home_team: 'Germany', away_team: 'Curaçao', home_flag: '🇩🇪', away_flag: '🇨🇼',
    kickoff_utc: '2026-06-14T17:00:00.000Z', venue: 'NRG Stadium', city: 'Houston', country: 'USA',
    status: 'open', home_score: null, away_score: null,
  },
  {
    id: 6, game_day: 2, stage: 'group', group_name: 'L',
    home_team: 'England', away_team: 'Croatia', home_flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', away_flag: '🇭🇷',
    kickoff_utc: '2026-06-15T19:00:00.000Z', venue: 'AT&T Stadium', city: 'Dallas', country: 'USA',
    status: 'open', home_score: null, away_score: null,
  },
  {
    id: 301, game_day: 3, stage: 'group', group_name: 'B',
    home_team: 'Switzerland', away_team: 'Canada', home_flag: '🇨🇭', away_flag: '🇨🇦',
    kickoff_utc: '2026-06-24T19:00:00.000Z', venue: 'BC Place', city: 'Vancouver', country: 'Canada',
    status: 'open', home_score: null, away_score: null,
  },
  {
    id: 302, game_day: 3, stage: 'group', group_name: 'L',
    home_team: 'England', away_team: 'Croatia', home_flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', away_flag: '🇭🇷',
    kickoff_utc: '2026-06-27T19:00:00.000Z', venue: 'Gillette Stadium', city: 'Boston', country: 'USA',
    status: 'open', home_score: null, away_score: null,
  },
]

export const MOCK_PREDICTIONS: Prediction[] = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    user_id: DEV_USER.id,
    fixture_id: 1,
    predicted_home: 2,
    predicted_away: 1,
    points_awarded: 0,
    created_at: new Date().toISOString(),
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    user_id: DEV_USER.id,
    fixture_id: 3,
    predicted_home: 1,
    predicted_away: 1,
    points_awarded: 0,
    created_at: new Date().toISOString(),
  },
]

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { id: '1', display_name: 'Alex Morgan', total_points: 85, correct_scores: 4, correct_results: 9 },
  { id: '2', display_name: 'Jamie Smith', total_points: 72, correct_scores: 3, correct_results: 8 },
  { id: DEV_USER.id, display_name: DEV_USER.display_name, total_points: 45, correct_scores: 2, correct_results: 5 },
  { id: '4', display_name: 'Chris Lee', total_points: 38, correct_scores: 1, correct_results: 6 },
  { id: '5', display_name: 'Sam Patel', total_points: 30, correct_scores: 1, correct_results: 4 },
]

// In-memory store for dev prediction edits
const devPredictions = [...MOCK_PREDICTIONS]

export function getDevPredictions(): Prediction[] {
  return devPredictions
}

export function upsertDevPrediction(fixtureId: number, home: number, away: number, userId: string) {
  const existing = devPredictions.find((p) => p.fixture_id === fixtureId && p.user_id === userId)
  if (existing) {
    existing.predicted_home = home
    existing.predicted_away = away
  } else {
    devPredictions.push({
      id: crypto.randomUUID(),
      user_id: userId,
      fixture_id: fixtureId,
      predicted_home: home,
      predicted_away: away,
      points_awarded: 0,
      created_at: new Date().toISOString(),
    })
  }
}

export function getMockFixturesByGameDay(gameDay: number): Fixture[] {
  return MOCK_FIXTURES.filter((f) => f.game_day === gameDay)
}

export function getMockOpenGameDay(): GameDay | null {
  return MOCK_GAME_DAYS.find((g) => g.status === 'open') ?? null
}

export const MOCK_HISTORY_GAME_DAYS: GameDay[] = [
  {
    id: 1,
    game_day: 1,
    label: 'Group Stage — Matchday 1',
    status: 'completed',
    opened_at: '2026-06-01T12:00:00.000Z',
    completed_at: '2026-06-03T23:00:00.000Z',
  },
]

export const MOCK_HISTORY_FIXTURES: Fixture[] = [
  {
    id: 101, game_day: 1, stage: 'group', group_name: 'A',
    home_team: 'Mexico', away_team: 'South Africa', home_flag: '🇲🇽', away_flag: '🇿🇦',
    kickoff_utc: '2026-06-01T19:00:00.000Z', venue: 'Estadio Azteca', city: 'Mexico City', country: 'Mexico',
    status: 'completed', home_score: 2, away_score: 1,
  },
  {
    id: 102, game_day: 1, stage: 'group', group_name: 'C',
    home_team: 'Brazil', away_team: 'Morocco', home_flag: '🇧🇷', away_flag: '🇲🇦',
    kickoff_utc: '2026-06-02T22:00:00.000Z', venue: 'MetLife Stadium', city: 'New Jersey', country: 'USA',
    status: 'completed', home_score: 1, away_score: 1,
  },
  {
    id: 103, game_day: 1, stage: 'group', group_name: 'E',
    home_team: 'Germany', away_team: 'Curaçao', home_flag: '🇩🇪', away_flag: '🇨🇼',
    kickoff_utc: '2026-06-02T17:00:00.000Z', venue: 'NRG Stadium', city: 'Houston', country: 'USA',
    status: 'completed', home_score: 3, away_score: 0,
  },
  {
    id: 104, game_day: 1, stage: 'group', group_name: 'L',
    home_team: 'England', away_team: 'Croatia', home_flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', away_flag: '🇭🇷',
    kickoff_utc: '2026-06-03T19:00:00.000Z', venue: 'AT&T Stadium', city: 'Dallas', country: 'USA',
    status: 'completed', home_score: 1, away_score: 0,
  },
]

export const MOCK_HISTORY_PREDICTIONS: Prediction[] = [
  {
    id: '20000000-0000-0000-0000-000000000001',
    user_id: DEV_USER.id,
    fixture_id: 101,
    predicted_home: 2,
    predicted_away: 1,
    points_awarded: 10,
    created_at: '2026-06-01T10:00:00.000Z',
  },
  {
    id: '20000000-0000-0000-0000-000000000002',
    user_id: DEV_USER.id,
    fixture_id: 102,
    predicted_home: 1,
    predicted_away: 1,
    points_awarded: 10,
    created_at: '2026-06-01T10:00:00.000Z',
  },
  {
    id: '20000000-0000-0000-0000-000000000003',
    user_id: DEV_USER.id,
    fixture_id: 103,
    predicted_home: 2,
    predicted_away: 0,
    points_awarded: 5,
    created_at: '2026-06-01T10:00:00.000Z',
  },
  {
    id: '20000000-0000-0000-0000-000000000004',
    user_id: DEV_USER.id,
    fixture_id: 104,
    predicted_home: 0,
    predicted_away: 1,
    points_awarded: 0,
    created_at: '2026-06-01T10:00:00.000Z',
  },
]

export function getMockHistoryGameDays(): GameDay[] {
  return [...MOCK_HISTORY_GAME_DAYS].reverse()
}

export function getMockHistoryFixtures(gameDay: number): Fixture[] {
  return MOCK_HISTORY_FIXTURES.filter((f) => f.game_day === gameDay)
}

export function getMockHistoryPredictions(userId: string): Prediction[] {
  return MOCK_HISTORY_PREDICTIONS.filter((p) => p.user_id === userId)
}
