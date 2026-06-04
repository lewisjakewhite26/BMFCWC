import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fetchGameDays } from '../lib/fixtures'
import { getDismissedRecaps, markRecapSeen } from '../lib/recapStorage'
import { getRecapTier } from '../lib/recapTier'
import {
  isDevBypassSession,
  getMockHistoryPredictions,
  MOCK_HISTORY_GAME_DAYS,
  MOCK_HISTORY_FIXTURES,
  MOCK_LEADERBOARD,
  DEV_USER,
} from '../lib/devBypass'
import { useAuth } from './useAuth'
import type { MatchdayRecap, RecapTier } from '../types'

function buildDevRecap(gameDay: number): MatchdayRecap {
  const gd = MOCK_HISTORY_GAME_DAYS.find((d) => d.game_day === gameDay)
  const fixtureIds = new Set(MOCK_HISTORY_FIXTURES.filter((f) => f.game_day === gameDay).map((f) => f.id))
  const dayPreds = getMockHistoryPredictions(DEV_USER.id).filter((p) => fixtureIds.has(p.fixture_id))

  const matchday_points = dayPreds.reduce((s, p) => s + p.points_awarded, 0)
  const correct_scores = dayPreds.filter((p) => p.points_awarded === 10).length
  const correct_results = dayPreds.filter((p) => p.points_awarded === 5).length

  const rankIndex = MOCK_LEADERBOARD.findIndex((e) => e.id === DEV_USER.id)

  return {
    game_day: gameDay,
    label: gd?.label ?? `Matchday ${gameDay}`,
    matchday_points,
    correct_scores,
    correct_results,
    predictions_count: dayPreds.length,
    matchday_rank: 2,
    matchday_total_players: MOCK_LEADERBOARD.length,
    overall_rank: rankIndex >= 0 ? rankIndex + 1 : 3,
    overall_total_players: MOCK_LEADERBOARD.length,
    total_points: DEV_USER.total_points,
  }
}

async function fetchRecap(
  userId: string,
  sessionToken: string,
  gameDay: number
): Promise<MatchdayRecap | null> {
  const { data, error } = await supabase.rpc('get_user_matchday_recap', {
    p_user_id: userId,
    p_session_token: sessionToken,
    p_game_day: gameDay,
  })
  if (error || !data) return null
  return data as MatchdayRecap
}

export function useMatchdayRecap() {
  const { user, loading: authLoading } = useAuth()
  const [queue, setQueue] = useState<MatchdayRecap[]>([])
  const [index, setIndex] = useState(0)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (authLoading || !user) {
      setQueue([])
      setIndex(0)
      setReady(false)
      return
    }

    const currentUser = user
    let cancelled = false

    async function load() {
      setReady(false)
      const dismissed = getDismissedRecaps()

      if (isDevBypassSession(currentUser)) {
        const pending = MOCK_HISTORY_GAME_DAYS.filter(
          (d) => d.status === 'completed' && !dismissed.includes(d.game_day)
        ).sort((a, b) => a.game_day - b.game_day)

        if (!cancelled) {
          setQueue(pending.map((d) => buildDevRecap(d.game_day)))
          setIndex(0)
          setReady(true)
        }
        return
      }

      const gameDays = await fetchGameDays()
      const pendingDays = gameDays
        .filter((d) => d.status === 'completed' && !dismissed.includes(d.game_day))
        .sort((a, b) => a.game_day - b.game_day)

      const recaps: MatchdayRecap[] = []
      for (const day of pendingDays) {
        const recap = await fetchRecap(currentUser.id, currentUser.session_token, day.game_day)
        if (recap) recaps.push(recap)
      }

      if (!cancelled) {
        setQueue(recaps)
        setIndex(0)
        setReady(true)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [user, authLoading])

  const current = queue[index] ?? null
  const visible = ready && current !== null
  const tier: RecapTier | null = current ? getRecapTier(current) : null

  const dismiss = useCallback(() => {
    if (!current) return
    markRecapSeen(current.game_day)
    if (index + 1 < queue.length) {
      setIndex((i) => i + 1)
    } else {
      setQueue([])
      setIndex(0)
    }
  }, [current, index, queue.length])

  return {
    visible,
    recap: current,
    tier,
    queuePosition: queue.length > 1 ? index + 1 : undefined,
    queueTotal: queue.length > 1 ? queue.length : undefined,
    dismiss,
  }
}
