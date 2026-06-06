import { useEffect, useState, useCallback } from 'react'
import { useAuth } from './useAuth'
import { isDevBypassSession, MOCK_LEADERBOARD, MOCK_GAME_DAYS, MOCK_FIXTURES } from '../lib/devBypass'
import { supabase } from '../lib/supabase'
import { fetchGameDays, fetchAllFixtures } from '../lib/fixtures'
import type { GameDay, Fixture, AdminUserRow } from '../types'

export function useAdminData() {
  const { user } = useAuth()
  const [gameDays, setGameDays] = useState<GameDay[]>([])
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [loading, setLoading] = useState(true)

  const isDev = !!(user && isDevBypassSession(user))

  const load = useCallback(async () => {
    setLoading(true)
    try {
      if (user && isDevBypassSession(user)) {
        setGameDays(MOCK_GAME_DAYS)
        setFixtures(MOCK_FIXTURES)
        setUsers(
          MOCK_LEADERBOARD.map((e) => ({
            id: e.id,
            username: e.display_name.toLowerCase().replace(/\s/g, '_'),
            display_name: e.display_name,
            total_points: e.total_points,
            has_paid: false,
            created_at: new Date().toISOString(),
          }))
        )
        return
      }

      const [days, fixs] = await Promise.all([fetchGameDays(), fetchAllFixtures()])
      setGameDays(days)
      setFixtures(fixs)

      if (user) {
        const { data: userData } = await supabase.rpc('admin_list_users', {
          p_admin_id: user.id,
          p_session_token: user.session_token,
        })
        setUsers((userData as AdminUserRow[]) ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) load()
  }, [user, load])

  const openGameDay =
    gameDays.find((gd) => gd.status === 'open') ??
    gameDays.find((gd) => gd.status === 'locked') ??
    gameDays[gameDays.length - 1] ??
    null

  return {
    user,
    gameDays,
    fixtures,
    users,
    setUsers,
    loading,
    load,
    isDev,
    openGameDay,
  }
}
