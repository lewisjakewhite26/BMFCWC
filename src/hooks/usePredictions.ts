import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { fetchFixturesByGameDay, lockExpiredFixtures } from '../lib/fixtures'
import { isDevBypassSession, getDevPredictions, upsertDevPrediction } from '../lib/devBypass'
import { useAuth } from './useAuth'
import type { Fixture, Prediction } from '../types'

export function usePredictions(gameDay: number | null) {
  const { user } = useAuth()
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [predictions, setPredictions] = useState<Map<number, Prediction>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (options?: { silent?: boolean }) => {
    if (gameDay === null) {
      setFixtures([])
      setPredictions(new Map())
      setLoading(false)
      return
    }

    const showLoading = !options?.silent
    if (showLoading) setLoading(true)
    setError(null)

    try {
      await lockExpiredFixtures()
      const fixtureData = await fetchFixturesByGameDay(gameDay)
      setFixtures(fixtureData)

      if (user) {
        if (isDevBypassSession(user)) {
          const predMap = new Map<number, Prediction>()
          getDevPredictions()
            .filter((p) => p.user_id === user.id && fixtureData.some((f) => f.id === p.fixture_id))
            .forEach((p) => predMap.set(p.fixture_id, p))
          setPredictions(predMap)
        } else {
          const fixtureIds = fixtureData.map((f) => f.id)
          const { data, error: predError } = await supabase.rpc('get_user_predictions', {
            p_user_id: user.id,
            p_session_token: user.session_token,
            p_fixture_ids: fixtureIds.length > 0 ? fixtureIds : null,
          })

          if (predError) throw predError

          const predMap = new Map<number, Prediction>()
          ;(data as Prediction[] | null)?.forEach((p) => predMap.set(p.fixture_id, p))
          setPredictions(predMap)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load predictions')
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [gameDay, user])

  useEffect(() => {
    load()
  }, [load])

  // Live updates when individual fixtures finish (results + points per match)
  useEffect(() => {
    if (!user || gameDay === null || isDevBypassSession(user)) return

    const reloadSilent = () => {
      load({ silent: true })
    }

    const channel = supabase
      .channel(`matchday-${gameDay}-live`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'fixtures', filter: `game_day=eq.${gameDay}` },
        reloadSilent
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'predictions', filter: `user_id=eq.${user.id}` },
        reloadSilent
      )
      .subscribe()

    const pollId = window.setInterval(reloadSilent, 60_000)

    return () => {
      window.clearInterval(pollId)
      supabase.removeChannel(channel)
    }
  }, [gameDay, user, load])

  const submitPrediction = async (fixtureId: number, home: number, away: number) => {
    if (!user) throw new Error('You need to be signed in to view predictions')

    const upsertLocal = () => {
      setPredictions((prev) => {
        const next = new Map(prev)
        const existing = next.get(fixtureId)
        next.set(fixtureId, {
          id: existing?.id ?? crypto.randomUUID(),
          user_id: user.id,
          fixture_id: fixtureId,
          predicted_home: home,
          predicted_away: away,
          points_awarded: existing?.points_awarded ?? 0,
          created_at: existing?.created_at ?? new Date().toISOString(),
        })
        return next
      })
    }

    if (isDevBypassSession(user)) {
      upsertDevPrediction(fixtureId, home, away, user.id)
      upsertLocal()
      await load({ silent: true })
      return
    }

    const { error } = await supabase.rpc('submit_prediction', {
      p_user_id: user.id,
      p_session_token: user.session_token,
      p_fixture_id: fixtureId,
      p_predicted_home: home,
      p_predicted_away: away,
    })

    if (error) throw error
    upsertLocal()
    await load({ silent: true })
  }

  return { fixtures, predictions, loading, error, submitPrediction, reload: load }
}

export function useUserPredictions(userId: string | undefined) {
  const { user } = useAuth()
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!userId) {
      setPredictions([])
      setLoading(false)
      return
    }

    if (isDevBypassSession(user)) {
      setPredictions(getDevPredictions().filter((p) => p.user_id === userId))
      setLoading(false)
      return
    }

    if (!user || userId !== user.id) {
      setPredictions([])
      setLoading(false)
      return
    }

    const { data, error } = await supabase.rpc('get_user_predictions', {
      p_user_id: user.id,
      p_session_token: user.session_token,
      p_fixture_ids: null,
    })

    if (!error) setPredictions((data as Prediction[]) ?? [])
    setLoading(false)
  }, [userId, user])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  useEffect(() => {
    if (!user || !userId || userId !== user.id || isDevBypassSession(user)) return

    const channel = supabase
      .channel('user-predictions-live')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'predictions', filter: `user_id=eq.${user.id}` },
        () => load()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, userId, load])

  return { predictions, loading }
}

export function useUserStats(userId: string | undefined) {
  const { user } = useAuth()
  const { predictions, loading } = useUserPredictions(userId)

  const correctScores = isDevBypassSession(user) ? 2 : predictions.filter((p) => p.points_awarded === 10).length
  const correctResults = isDevBypassSession(user) ? 5 : predictions.filter((p) => p.points_awarded === 5).length
  const scoredPredictions = predictions.filter((p) => p.points_awarded > 0).length
  const completedPredictions = predictions.filter((p) => p.points_awarded !== 0 || predictions.length > 0).length

  const totalPoints = predictions.reduce((sum, p) => sum + p.points_awarded, 0)
  const displayPoints = isDevBypassSession(user) && user ? user.total_points : totalPoints
  const accuracy = completedPredictions > 0
    ? Math.round((scoredPredictions / completedPredictions) * 100)
    : isDevBypassSession(user) ? 58 : 0

  return {
    stats: {
      total_points: displayPoints,
      correct_scores: correctScores,
      correct_results: correctResults,
      total_predictions: predictions.length,
      accuracy,
    },
    loading,
  }
}
