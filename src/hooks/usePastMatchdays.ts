import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { fetchGameDays } from '../lib/fixtures'
import {
  isDevBypassSession,
  getMockHistoryGameDays,
  getMockHistoryFixtures,
  getMockHistoryPredictions,
} from '../lib/devBypass'
import { useAuth } from './useAuth'
import type { GameDay, Fixture, Prediction } from '../types'

export function usePastMatchdays() {
  const { user } = useAuth()
  const [gameDays, setGameDays] = useState<GameDay[]>([])
  const [fixturesByDay, setFixturesByDay] = useState<Map<number, Fixture[]>>(new Map())
  const [predictions, setPredictions] = useState<Map<number, Prediction>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!user) {
        setGameDays([])
        setFixturesByDay(new Map())
        setPredictions(new Map())
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        if (isDevBypassSession(user)) {
          const days = getMockHistoryGameDays()
          const fixtureMap = new Map<number, Fixture[]>()
          for (const day of days) {
            fixtureMap.set(day.game_day, getMockHistoryFixtures(day.game_day))
          }
          const predMap = new Map<number, Prediction>()
          getMockHistoryPredictions(user.id).forEach((p) => predMap.set(p.fixture_id, p))
          setGameDays(days)
          setFixturesByDay(fixtureMap)
          setPredictions(predMap)
          return
        }

        const allDays = await fetchGameDays()
        const pastDays = allDays.filter((d) => d.status === 'completed').reverse()
        setGameDays(pastDays)

        if (pastDays.length === 0) {
          setFixturesByDay(new Map())
          setPredictions(new Map())
          return
        }

        const fixtureMap = new Map<number, Fixture[]>()
        for (const day of pastDays) {
          const { data } = await supabase
            .from('fixtures')
            .select('*')
            .eq('game_day', day.game_day)
            .order('kickoff_utc')
          fixtureMap.set(day.game_day, data ?? [])
        }
        setFixturesByDay(fixtureMap)

        const allFixtureIds = Array.from(fixtureMap.values()).flat().map((f) => f.id)
        if (allFixtureIds.length > 0) {
          const { data: preds } = await supabase
            .from('predictions')
            .select('*')
            .eq('user_id', user.id)
            .in('fixture_id', allFixtureIds)

          const predMap = new Map<number, Prediction>()
          preds?.forEach((p) => predMap.set(p.fixture_id, p))
          setPredictions(predMap)
        } else {
          setPredictions(new Map())
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const totalPoints = useMemo(() => {
    let sum = 0
    predictions.forEach((p) => { sum += p.points_awarded })
    return sum
  }, [predictions])

  return { gameDays, fixturesByDay, predictions, loading, totalPoints }
}
