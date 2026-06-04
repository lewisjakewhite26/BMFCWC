import { useEffect, useState, useMemo, useCallback } from 'react'
import { Navbar } from '../components/ui/Navbar'
import { PageShell } from '../components/ui/PageBackground'
import { GameDayPanel } from '../components/match/GameDayPanel'
import { UserStatsGrid } from '../components/match/UserStatsGrid'
import { DashboardStatusBanner } from '../components/dashboard/DashboardStatusBanner'
import { MatchCardSkeleton } from '../components/ui/Skeleton'
import { ErrorBoundary } from '../components/ui/ErrorBoundary'
import { useAuth } from '../hooks/useAuth'
import { usePredictions } from '../hooks/usePredictions'
import { fetchOpenGameDay } from '../lib/fixtures'
import { getGameDayCutoff } from '../lib/scoring'
import { getTimeGreeting } from '../lib/greeting'
import { isDevBypassSession, getMockOpenGameDay } from '../lib/devBypass'
import type { GameDay } from '../types'

export default function Dashboard() {
  const { user } = useAuth()
  const [openGameDay, setOpenGameDay] = useState<GameDay | null>(null)
  const [loadingDay, setLoadingDay] = useState(true)
  const [lockedFixtures, setLockedFixtures] = useState<Set<number>>(new Set())

  const { fixtures, predictions, loading: loadingFixtures, submitPrediction, reload } = usePredictions(
    openGameDay?.game_day ?? null
  )

  useEffect(() => {
    async function load() {
      setLoadingDay(true)
      try {
        if (user && isDevBypassSession(user)) {
          setOpenGameDay(getMockOpenGameDay())
        } else {
          setOpenGameDay(await fetchOpenGameDay())
        }
      } finally {
        setLoadingDay(false)
      }
    }
    load()
  }, [user])

  useEffect(() => {
    if (!loadingFixtures) {
      setLockedFixtures(new Set(predictions.keys()))
    }
  }, [loadingFixtures, predictions])

  const handleConfirmChange = useCallback((fixtureId: number, confirmed: boolean) => {
    setLockedFixtures((prev) => {
      const next = new Set(prev)
      if (confirmed) next.add(fixtureId)
      else next.delete(fixtureId)
      return next
    })
  }, [])

  const handleSave = async (fixtureId: number, home: number, away: number) => {
    await submitPrediction(fixtureId, home, away)
  }

  const lockedCount = fixtures.filter((f) => lockedFixtures.has(f.id)).length
  const loading = loadingDay || loadingFixtures
  const cutoff = useMemo(() => getGameDayCutoff(fixtures), [fixtures])
  const hasOpenMatchday = !!openGameDay && openGameDay.status === 'open'

  return (
    <PageShell>
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-5 sm:py-8 space-y-5 sm:space-y-8">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl text-brand-navy mb-0.5">
            {getTimeGreeting()}, {user?.display_name?.split(' ')[0] ?? 'there'}
          </h1>
          <p className="text-sm sm:text-base text-gray-500">
            Enter your predictions before each match kicks off
          </p>
        </div>

        <UserStatsGrid />

        {!loading && (
          <DashboardStatusBanner
            lockedCount={lockedCount}
            total={fixtures.length}
            cutoff={hasOpenMatchday && fixtures.length > 0 ? cutoff : null}
            hasOpenMatchday={hasOpenMatchday}
            onExpired={reload}
          />
        )}

        <ErrorBoundary>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <MatchCardSkeleton key={i} />
              ))}
            </div>
          ) : openGameDay ? (
            <GameDayPanel
              gameDay={openGameDay}
              fixtures={fixtures}
              predictions={predictions}
              onSave={handleSave}
              isCurrent
              onCutoffExpired={reload}
              onConfirmChange={handleConfirmChange}
            />
          ) : (
            <div className="glass-card p-8 text-center">
              <p className="text-gray-500">No matchday is currently open. Check back later.</p>
            </div>
          )}
        </ErrorBoundary>
      </div>
    </PageShell>
  )
}
