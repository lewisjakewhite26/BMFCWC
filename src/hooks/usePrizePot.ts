import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { isDevBypassSession } from '../lib/devBypass'
import { useAuth } from './useAuth'

export interface PrizePotStats {
  totalEntrants: number
  paidEntrants: number
  unpaidEntrants: number
  totalCollectedGbp: number
  prizePotGbp: number
  potentialPrizePotGbp: number
}

export function usePrizePot() {
  const { user } = useAuth()
  const [stats, setStats] = useState<PrizePotStats | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      if (isDevBypassSession(user)) {
        setStats({
          totalEntrants: 5,
          paidEntrants: 2,
          unpaidEntrants: 3,
          totalCollectedGbp: 20,
          prizePotGbp: 15,
          potentialPrizePotGbp: 37.5,
        })
        return
      }

      const { data, error } = await supabase.rpc('get_prize_pot_stats')
      if (error) throw error

      const row = data as {
        total_entrants: number
        paid_entrants: number
        unpaid_entrants: number
        total_collected_gbp: number
        prize_pot_gbp: number
        potential_prize_pot_gbp: number
      }

      setStats({
        totalEntrants: row.total_entrants,
        paidEntrants: row.paid_entrants,
        unpaidEntrants: row.unpaid_entrants,
        totalCollectedGbp: row.total_collected_gbp,
        prizePotGbp: Number(row.prize_pot_gbp),
        potentialPrizePotGbp: Number(row.potential_prize_pot_gbp),
      })
    } catch {
      setStats(null)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    load()

    if (isDevBypassSession(user)) return

    const channel = supabase
      .channel('prize-pot-stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        load()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [load, user])

  return { stats, loading, reload: load }
}
