export interface AdminUserRow {
  id: string
  username: string
  display_name: string
  total_points: number
  has_paid: boolean
  created_at: string
}

export interface User {
  id: string
  username: string
  display_name: string
  is_admin: boolean
  total_points: number
  has_paid: boolean
  session_token: string
}

export interface GameDay {
  id: number
  game_day: number
  label: string
  status: 'locked' | 'open' | 'completed'
  opened_at: string | null
  completed_at: string | null
}

export interface Fixture {
  id: number
  game_day: number
  stage: string
  group_name: string | null
  home_team: string
  away_team: string
  home_flag: string | null
  away_flag: string | null
  kickoff_utc: string
  venue: string
  city: string
  country: string
  status: 'upcoming' | 'open' | 'locked' | 'completed'
  home_score: number | null
  away_score: number | null
}

export interface Prediction {
  id: string
  user_id: string
  fixture_id: number
  predicted_home: number
  predicted_away: number
  points_awarded: number
  created_at: string
}

export interface LeaderboardEntry {
  id: string
  display_name: string
  total_points: number
  correct_scores: number
  correct_results: number
}

export interface UserStats {
  total_points: number
  correct_scores: number
  correct_results: number
  total_predictions: number
  accuracy: number
}

export interface ApiSyncStatus {
  date: string
  request_count: number
  max_requests: number
  last_request_at: string | null
  last_sync_at: string | null
  last_sync_status: string
  last_sync_message: string | null
}

export interface ProgressionLogEntry {
  id: number
  game_day: number
  event: 'all_scored' | 'wait_started' | 'teams_discovered' | 'matchday_opened' | string
  triggered_at: string
  details: Record<string, unknown> | null
}

export interface ProgressionQueueEntry {
  id: number
  game_day: number
  scheduled_for: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  created_at: string
  processed_at: string | null
}

export interface ProgressionStatus {
  log: ProgressionLogEntry[]
  queue: ProgressionQueueEntry[]
}

export interface MatchdayRecap {
  game_day: number
  label: string
  matchday_points: number
  correct_scores: number
  correct_results: number
  predictions_count: number
  matchday_rank: number
  matchday_total_players: number
  overall_rank: number
  overall_total_players: number
  total_points: number
}

export type RecapTier = 'legendary' | 'great' | 'solid' | 'poor' | 'rough'

export type FixtureWithPrediction = Fixture & {
  prediction?: Prediction
}
