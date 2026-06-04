import { useEffect, useState } from 'react'
import { fetchOpenGameDay } from '../lib/fixtures'
import { useAuth } from './useAuth'

/** Current open matchday number, or null if none is open. */
export function useOpenMatchdayNumber(): number | null {
  const { user } = useAuth()
  const [matchday, setMatchday] = useState<number | null>(null)

  useEffect(() => {
    if (!user) {
      setMatchday(null)
      return
    }

    let cancelled = false

    fetchOpenGameDay()
      .then((gameDay) => {
        if (!cancelled) setMatchday(gameDay?.game_day ?? null)
      })
      .catch(() => {
        if (!cancelled) setMatchday(null)
      })

    return () => {
      cancelled = true
    }
  }, [user])

  return matchday
}
