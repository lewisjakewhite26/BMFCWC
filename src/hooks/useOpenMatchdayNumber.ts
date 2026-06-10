import { useEffect, useState } from 'react'
import { fetchOpenGameDayNumbers } from '../lib/fixtures'
import { useAuth } from './useAuth'

/** Highest open matchday number (group + knockout), or null if none are open. */
export function useOpenMatchdayNumber(): number | null {
  const { user } = useAuth()
  const [matchday, setMatchday] = useState<number | null>(null)

  useEffect(() => {
    if (!user) {
      setMatchday(null)
      return
    }

    let cancelled = false

    fetchOpenGameDayNumbers()
      .then((openDays) => {
        if (!cancelled) {
          setMatchday(openDays.length > 0 ? Math.max(...openDays) : null)
        }
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
