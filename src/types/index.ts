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

export type RecapTier = 'spotOn' | 'great' | 'solid' | 'poor' | 'nightmare'

export type FixtureWithPrediction = Fixture & {
  prediction?: Prediction
}
