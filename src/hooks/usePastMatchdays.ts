import { useState, useEffect, useMemo, useCallback } from 'react'
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

function hasConfirmedResult(fixture: Fixture): boolean {
  return fixture.home_score !== null && fixture.away_score !== null
}

function groupScoredFixtures(fixtures: Fixture[]): Map<number, Fixture[]> {
  const byDay = new Map<number, Fixture[]>()
  for (const fixture of fixtures) {
    if (!hasConfirmedResult(fixture)) continue
    const list = byDay.get(fixture.game_day) ?? []
    list.push(fixture)
    byDay.set(fixture.game_day, list)
  }
  for (const list of byDay.values()) {
    list.sort((a, b) => a.kickoff_utc.localeCompare(b.kickoff_utc))
  }
  return byDay
}

export function usePastMatchdays() {
  const { user } = useAuth()
  const [gameDays, setGameDays] = useState<GameDay[]>([])
  const [fixturesByDay, setFixturesByDay] = useState<Map<number, Fixture[]>>(new Map())
  const [predictions, setPredictions] = useState<Map<number, Prediction>>(new Map())
  const [loading, setLoading] = useState(true)

  const load = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!user) {
        setGameDays([])
        setFixturesByDay(new Map())
        setPredictions(new Map())
        setLoading(false)
        return
      }

      const showLoading = !options?.silent
      if (showLoading) setLoading(true)

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

        const { data: scoredFixtures, error: fixtureError } = await supabase
          .from('fixtures')
          .select('*')
          .not('home_score', 'is', null)
          .not('away_score', 'is', null)
          .order('kickoff_utc')

        if (fixtureError) throw fixtureError

        const fixtureMap = groupScoredFixtures(scoredFixtures ?? [])
        const daysWithResults = allDays
          .filter((day) => fixtureMap.has(day.game_day))
          .sort((a, b) => b.game_day - a.game_day)

        setGameDays(daysWithResults)
        setFixturesByDay(fixtureMap)

        const allFixtureIds = Array.from(fixtureMap.values())
          .flat()
          .map((f) => f.id)

        if (allFixtureIds.length > 0) {
          const { data: preds, error: predError } = await supabase.rpc('get_user_predictions', {
            p_user_id: user.id,
            p_session_token: user.session_token,
            p_fixture_ids: allFixtureIds,
          })

          if (predError) throw predError

          const predMap = new Map<number, Prediction>()
          ;(preds as Prediction[] | null)?.forEach((p) => predMap.set(p.fixture_id, p))
          setPredictions(predMap)
        } else {
          setPredictions(new Map())
        }
      } finally {
        if (showLoading) setLoading(false)
      }
    },
    [user]
  )

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!user || isDevBypassSession(user)) return

    const reloadSilent = () => {
      load({ silent: true })
    }

    const channel = supabase
      .channel('past-matchdays-live')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'fixtures' },
        reloadSilent
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'predictions', filter: `user_id=eq.${user.id}` },
        reloadSilent
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'game_days' },
        reloadSilent
      )
      .subscribe()

    const pollId = window.setInterval(reloadSilent, 60_000)

    return () => {
      window.clearInterval(pollId)
      supabase.removeChannel(channel)
    }
  }, [user, load])

  const totalPoints = useMemo(() => {
    let sum = 0
    predictions.forEach((p) => {
      sum += p.points_awarded
    })
    return sum
  }, [predictions])

  return { gameDays, fixturesByDay, predictions, loading, totalPoints }
}
