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

  const load = useCallback(async () => {
    if (gameDay === null) {
      setFixtures([])
      setPredictions(new Map())
      setLoading(false)
      return
    }

    setLoading(true)
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
      setLoading(false)
    }
  }, [gameDay, user])

  useEffect(() => {
    load()
  }, [load])

  const submitPrediction = async (fixtureId: number, home: number, away: number) => {
    if (!user) throw new Error('You need to be signed in to view predictions')

    if (isDevBypassSession(user)) {
      upsertDevPrediction(fixtureId, home, away, user.id)
      await load()
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
    await load()
  }

  return { fixtures, predictions, loading, error, submitPrediction, reload: load }
}

export function useUserPredictions(userId: string | undefined) {
  const { user } = useAuth()
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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

    supabase
      .rpc('get_user_predictions', {
        p_user_id: user.id,
        p_session_token: user.session_token,
        p_fixture_ids: null,
      })
      .then(({ data, error }) => {
        if (!error) setPredictions((data as Prediction[]) ?? [])
        setLoading(false)
      })
  }, [userId, user])

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
