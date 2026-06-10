import { useEffect, useState, useMemo, useCallback } from 'react'
import { Navbar } from '../components/ui/Navbar'
import { PageShell } from '../components/ui/PageBackground'
import { GameDayPanel } from '../components/match/GameDayPanel'
import { UserStatsGrid } from '../components/match/UserStatsGrid'
import { DashboardStatusBanner } from '../components/dashboard/DashboardStatusBanner'
import { GroupMatchdayTabs } from '../components/dashboard/GroupMatchdayTabs'
import { EmptyDashboardCard } from '../components/dashboard/EmptyDashboardCard'
import { MatchCardSkeleton } from '../components/ui/Skeleton'
import { ErrorBoundary } from '../components/ui/ErrorBoundary'
import { useAuth } from '../hooks/useAuth'
import { usePredictions } from '../hooks/usePredictions'
import { fetchGroupStageGameDays, fetchOpenGameDay, fetchFixturesByGameDay } from '../lib/fixtures'
import { getDefaultGroupTab, getMatchdayTabState } from '../lib/matchdays'
import { getGameDayCutoff } from '../lib/scoring'
import { getTimeGreeting } from '../lib/greeting'
import { isDevBypassSession, MOCK_GAME_DAYS, getMockFixturesByGameDay } from '../lib/devBypass'
import { useMatchdayRecap } from '../hooks/useMatchdayRecap'
import { MatchdayRecapModal } from '../components/dashboard/MatchdayRecapModal'
import { PrizePotBanner } from '../components/ui/PrizePotBanner'
import { usePrizePot } from '../hooks/usePrizePot'
import type { Fixture, GameDay } from '../types'

export default function Dashboard() {
  const { user } = useAuth()
  const { visible, recap, tier, queuePosition, queueTotal, dismiss } = useMatchdayRecap()
  const { stats: prizePot, loading: prizePotLoading } = usePrizePot()
  const [groupGameDays, setGroupGameDays] = useState<GameDay[]>([])
  const [knockoutGameDay, setKnockoutGameDay] = useState<GameDay | null>(null)
  const [fixturesByDay, setFixturesByDay] = useState<Record<number, Fixture[]>>({})
  const [selectedGroupDay, setSelectedGroupDay] = useState(1)
  const [loadingDays, setLoadingDays] = useState(true)
  const [lockedFixtures, setLockedFixtures] = useState<Set<number>>(new Set())

  const selectedGameDay = groupGameDays.find((g) => g.game_day === selectedGroupDay) ?? null

  const { fixtures, predictions, loading: loadingFixtures, submitPrediction, reload } = usePredictions(
    selectedGroupDay
  )

  const knockoutPredictions = usePredictions(knockoutGameDay?.game_day ?? null)

  useEffect(() => {
    async function load() {
      setLoadingDays(true)
      try {
        if (user && isDevBypassSession(user)) {
          const days = MOCK_GAME_DAYS.filter((g) => g.game_day <= 3)
          const byDay: Record<number, Fixture[]> = {}
          for (const day of [1, 2, 3]) {
            byDay[day] = getMockFixturesByGameDay(day)
          }
          setGroupGameDays(days)
          setFixturesByDay(byDay)
          setSelectedGroupDay(getDefaultGroupTab(days, byDay))
          setKnockoutGameDay(MOCK_GAME_DAYS.find((g) => g.status === 'open' && g.game_day > 3) ?? null)
        } else {
          const [groupDays, knockout] = await Promise.all([
            fetchGroupStageGameDays(),
            fetchOpenGameDay(),
          ])
          const byDay: Record<number, Fixture[]> = {}
          await Promise.all(
            [1, 2, 3].map(async (day) => {
              byDay[day] = await fetchFixturesByGameDay(day)
            })
          )
          setGroupGameDays(groupDays)
          setFixturesByDay(byDay)
          setSelectedGroupDay(getDefaultGroupTab(groupDays, byDay))
          setKnockoutGameDay(knockout)
        }
      } finally {
        setLoadingDays(false)
      }
    }
    load()
  }, [user])

  useEffect(() => {
    if (!loadingFixtures) {
      setLockedFixtures(new Set(predictions.keys()))
    }
  }, [loadingFixtures, predictions, selectedGroupDay])

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
  const loading = loadingDays || (loadingFixtures && fixtures.length === 0)
  const cutoff = useMemo(() => getGameDayCutoff(fixtures), [fixtures])
  const tabState = selectedGameDay
    ? getMatchdayTabState(selectedGameDay, fixtures)
    : 'locked'
  const canPredict = tabState === 'predict'
  const hasOpenGroupMatchday = groupGameDays.some((g) => g.status === 'open')
  const hasAnyContent = hasOpenGroupMatchday || knockoutGameDay !== null || groupGameDays.some((g) => g.status === 'completed')

  const hasNoActiveGames = !loading && !hasAnyContent

  return (
    <PageShell>
      {visible && recap && tier && (
        <MatchdayRecapModal
          recap={recap}
          tier={tier}
          queuePosition={queuePosition}
          queueTotal={queueTotal}
          onDismiss={dismiss}
        />
      )}

      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-5 sm:py-8 space-y-5 sm:space-y-8">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl text-brand-navy mb-0.5">
            {getTimeGreeting()}, {user?.display_name?.split(' ')[0] ?? 'there'}
          </h1>
          <p className="text-sm sm:text-base text-gray-500">
            Pick your scores for each group game — every matchday closes one hour before its first kickoff
          </p>
        </div>

        <UserStatsGrid />

        <PrizePotBanner stats={prizePot} loading={prizePotLoading} variant="inline" />

        {!loading && (
          hasNoActiveGames ? (
            <EmptyDashboardCard />
          ) : (
            <>
              <GroupMatchdayTabs
                gameDays={groupGameDays}
                fixturesByDay={fixturesByDay}
                selectedDay={selectedGroupDay}
                onSelect={setSelectedGroupDay}
              />

              <DashboardStatusBanner
                lockedCount={lockedCount}
                total={fixtures.length}
                cutoff={canPredict || tabState === 'closed' ? cutoff : null}
                hasOpenMatchday={canPredict || tabState === 'closed'}
                tabState={tabState}
                onExpired={() => reload({ silent: true })}
              />
            </>
          )
        )}

        <ErrorBoundary>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <MatchCardSkeleton key={i} />
              ))}
            </div>
          ) : selectedGameDay ? (
            <GameDayPanel
              gameDay={selectedGameDay}
              fixtures={fixtures}
              predictions={predictions}
              onSave={canPredict ? handleSave : undefined}
              isCurrent
              isHistory={tabState === 'complete'}
              onConfirmChange={canPredict ? handleConfirmChange : undefined}
            />
          ) : null}

          {knockoutGameDay && (
            <div className="space-y-4 pt-2">
              <h2 className="font-display text-lg text-brand-navy">Knockout stage</h2>
              <DashboardStatusBanner
                lockedCount={knockoutPredictions.fixtures.filter((f) =>
                  knockoutPredictions.predictions.has(f.id)
                ).length}
                total={knockoutPredictions.fixtures.length}
                cutoff={
                  knockoutGameDay.status === 'open' && knockoutPredictions.fixtures.length > 0
                    ? getGameDayCutoff(knockoutPredictions.fixtures)
                    : null
                }
                hasOpenMatchday={knockoutGameDay.status === 'open'}
                onExpired={() => knockoutPredictions.reload({ silent: true })}
              />
              <GameDayPanel
                gameDay={knockoutGameDay}
                fixtures={knockoutPredictions.fixtures}
                predictions={knockoutPredictions.predictions}
                onSave={async (fixtureId, home, away) => {
                  await knockoutPredictions.submitPrediction(fixtureId, home, away)
                }}
                isCurrent
              />
            </div>
          )}
        </ErrorBoundary>
      </div>
    </PageShell>
  )
}
