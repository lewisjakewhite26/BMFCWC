import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { isDevBypassSession, MOCK_LEADERBOARD } from '../lib/devBypass'
import { useAuth } from './useAuth'
import type { LeaderboardEntry } from '../types'

export function useLeaderboard(limit?: number) {
  const { user } = useAuth()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      if (isDevBypassSession(user) || (!user && import.meta.env.DEV)) {
        const data = limit ? MOCK_LEADERBOARD.slice(0, limit) : MOCK_LEADERBOARD
        setEntries(data)
        return
      }

      let query = supabase
        .from('leaderboard_stats')
        .select('*')
        .order('total_points', { ascending: false })

      if (limit) query = query.limit(limit)

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError
      setEntries(data ?? [])
    } catch (err) {
      // Fall back to mock data in dev when Supabase isn't configured
      if (import.meta.env.DEV) {
        const data = limit ? MOCK_LEADERBOARD.slice(0, limit) : MOCK_LEADERBOARD
        setEntries(data)
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load leaderboard')
      }
    } finally {
      setLoading(false)
    }
  }, [limit, user])

  useEffect(() => {
    load()

    if (isDevBypassSession(user)) return

    const channel = supabase
      .channel('leaderboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        load()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'predictions' }, () => {
        load()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [load, user])

  return { entries, loading, error, reload: load }
}
