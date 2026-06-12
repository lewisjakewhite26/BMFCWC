import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { isDevBypassSession, MOCK_LEADERBOARD } from '../lib/devBypass'
import { sortLeaderboardEntries } from '../lib/leaderboard'
import { useAuth } from './useAuth'
import type { LeaderboardEntry } from '../types'

export function useLeaderboard(limit?: number) {
  const { user } = useAuth()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (options?: { silent?: boolean }) => {
    const showLoading = !options?.silent
    if (showLoading) setLoading(true)
    setError(null)

    try {
      if (isDevBypassSession(user) || (!user && import.meta.env.DEV)) {
        const data = sortLeaderboardEntries(limit ? MOCK_LEADERBOARD.slice(0, limit) : MOCK_LEADERBOARD)
        setEntries(data)
        return
      }

      let query = supabase
        .from('leaderboard_stats')
        .select('*')
        .order('total_points', { ascending: false })
        .order('correct_scores', { ascending: false })

      if (limit) query = query.limit(limit)

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError
      setEntries(sortLeaderboardEntries(data ?? []))
    } catch (err) {
      if (import.meta.env.DEV) {
        const data = sortLeaderboardEntries(limit ? MOCK_LEADERBOARD.slice(0, limit) : MOCK_LEADERBOARD)
        setEntries(data)
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load leaderboard')
      }
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [limit, user])

  useEffect(() => {
    load()

    if (isDevBypassSession(user)) return

    const reloadSilent = () => {
      load({ silent: true })
    }

    const channel = supabase
      .channel('leaderboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, reloadSilent)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'predictions' }, reloadSilent)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'fixtures' }, reloadSilent)
      .subscribe()

    const pollId = window.setInterval(reloadSilent, 30_000)

    const onVisible = () => {
      if (document.visibilityState === 'visible') reloadSilent()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      window.clearInterval(pollId)
      document.removeEventListener('visibilitychange', onVisible)
      supabase.removeChannel(channel)
    }
  }, [load, user])

  return { entries, loading, error, reload: load }
}
