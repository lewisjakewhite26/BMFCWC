import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import {
  isDevBypassSession,
  MOCK_FIXTURES,
  MOCK_HISTORY_FIXTURES,
  getMockHistoryPredictions,
} from '../lib/devBypass'
import { useAuth } from './useAuth'
import { useLeaderboard } from './useLeaderboard'
import { useUserPredictions } from './usePredictions'

export interface DashboardStats {
  total_points: number
  league_position: number | null
  best_matchday_points: number | null
  points_off_top: number
}

function buildDevFixtureDays(): Map<number, number> {
  const map = new Map<number, number>()
  for (const f of [...MOCK_FIXTURES, ...MOCK_HISTORY_FIXTURES]) {
    map.set(f.id, f.game_day)
  }
  return map
}

function computeBestMatchday(
  predictions: { fixture_id: number; points_awarded: number }[],
  fixtureDays: Map<number, number>
): number | null {
  const byDay = new Map<number, number>()
  for (const p of predictions) {
    const day = fixtureDays.get(p.fixture_id)
    if (day === undefined) continue
    byDay.set(day, (byDay.get(day) ?? 0) + p.points_awarded)
  }
  if (byDay.size === 0) return null
  const max = Math.max(...byDay.values())
  return max > 0 ? max : null
}

export function useDashboardStats() {
  const { user } = useAuth()
  const { entries, loading: leaderboardLoading } = useLeaderboard()
  const { predictions, loading: predictionsLoading } = useUserPredictions(user?.id)
  const [fixtureDays, setFixtureDays] = useState<Map<number, number>>(new Map())
  const [fixtureDaysLoading, setFixtureDaysLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setFixtureDays(new Map())
      setFixtureDaysLoading(false)
      return
    }

    const fixtureIds = predictions.map((p) => p.fixture_id)
    if (fixtureIds.length === 0) {
      setFixtureDays(new Map())
      setFixtureDaysLoading(false)
      return
    }

    if (isDevBypassSession(user)) {
      setFixtureDays(buildDevFixtureDays())
      setFixtureDaysLoading(false)
      return
    }

    setFixtureDaysLoading(true)
    supabase
      .from('fixtures')
      .select('id, game_day')
      .in('id', fixtureIds)
      .then(({ data, error }) => {
        if (!error && data) {
          setFixtureDays(new Map(data.map((f) => [f.id, f.game_day])))
        }
        setFixtureDaysLoading(false)
      })
  }, [user, predictions])

  const stats = useMemo((): DashboardStats => {
    const totalPoints = user?.total_points ?? 0

    if (!user) {
      return {
        total_points: 0,
        league_position: null,
        best_matchday_points: null,
        points_off_top: 0,
      }
    }

    const rankIndex = entries.findIndex((e) => e.id === user.id)
    const leaguePosition = entries.length > 0 && rankIndex >= 0 ? rankIndex + 1 : null
    const leaderPoints = entries[0]?.total_points ?? totalPoints
    const pointsOffTop =
      leaguePosition === 1 ? 0 : Math.max(0, leaderPoints - totalPoints)

    const predsForBest = isDevBypassSession(user)
      ? [...getMockHistoryPredictions(user.id), ...predictions]
      : predictions

    const bestMatchdayPoints = computeBestMatchday(predsForBest, fixtureDays)

    return {
      total_points: totalPoints,
      league_position: leaguePosition,
      best_matchday_points: bestMatchdayPoints,
      points_off_top: pointsOffTop,
    }
  }, [user, entries, predictions, fixtureDays])

  const loading = leaderboardLoading || predictionsLoading || fixtureDaysLoading

  return { stats, loading }
}
