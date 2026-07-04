import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
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
import { getDefaultGroupTab, getMatchdayTabState, isGroupStageComplete } from '../lib/matchdays'
import { getEarliestKickoff } from '../lib/scoring'
import { getTimeGreeting } from '../lib/greeting'
import { hapticMatchdayLocked } from '../lib/haptics'
import { EasterEggTrackToast } from '../components/ui/EasterEggTrackToast'
import { useEasterEggTrackToast } from '../hooks/useEasterEggTrackToast'
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
  const { track: easterEggTrack, trigger: triggerEasterEgg } = useEasterEggTrackToast()
  const groupPrevPredictionCount = useRef<number | null>(null)
  const groupHapticReady = useRef(false)
  const knockoutPrevCount = useRef<number | null>(null)
  const knockoutHapticReady = useRef(false)

  const selectedGameDay = groupGameDays.find((g) => g.game_day === selectedGroupDay) ?? null
  const matchdayOpen = selectedGameDay?.status === 'open'

  const { fixtures, predictions, loading: loadingFixtures, submitPrediction, reload } = usePredictions(
    selectedGroupDay
  )

  const knockoutPredictions = usePredictions(knockoutGameDay?.game_day ?? null)

  const userId = user?.id

  useEffect(() => {
    if (!userId || !user) return

    async function load() {
      setLoadingDays(true)
      try {
        if (isDevBypassSession(user)) {
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
    // Only re-run when the signed-in user changes, not on session refresh (points update).
  }, [userId])

  useEffect(() => {
    groupHapticReady.current = false
    groupPrevPredictionCount.current = null
  }, [selectedGroupDay])

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

  const predictionCount = predictions.size

  useEffect(() => {
    if (!matchdayOpen || loadingFixtures || fixtures.length === 0) {
      groupHapticReady.current = false
      groupPrevPredictionCount.current = null
      return
    }

    if (!groupHapticReady.current) {
      groupPrevPredictionCount.current = predictionCount
      groupHapticReady.current = true
      return
    }

    const prev = groupPrevPredictionCount.current
    groupPrevPredictionCount.current = predictionCount
    if (prev !== null && prev < fixtures.length && predictionCount === fixtures.length) {
      hapticMatchdayLocked()
    }
  }, [predictionCount, fixtures.length, matchdayOpen, loadingFixtures, selectedGroupDay])

  const lockedCount = fixtures.filter((f) => lockedFixtures.has(f.id)).length

  const knockoutLockedCount = knockoutPredictions.predictions.size
  const knockoutTotal = knockoutPredictions.fixtures.length
  const knockoutOpen = knockoutGameDay?.status === 'open'

  useEffect(() => {
    knockoutHapticReady.current = false
    knockoutPrevCount.current = null
  }, [knockoutGameDay?.game_day])

  useEffect(() => {
    if (!knockoutOpen || knockoutTotal === 0 || knockoutPredictions.loading) {
      knockoutHapticReady.current = false
      knockoutPrevCount.current = null
      return
    }

    if (!knockoutHapticReady.current) {
      knockoutPrevCount.current = knockoutLockedCount
      knockoutHapticReady.current = true
      return
    }

    const prev = knockoutPrevCount.current
    knockoutPrevCount.current = knockoutLockedCount
    if (prev !== null && prev < knockoutTotal && knockoutLockedCount === knockoutTotal) {
      hapticMatchdayLocked()
    }
  }, [knockoutLockedCount, knockoutTotal, knockoutOpen, knockoutPredictions.loading])

  const hasOpenGroupMatchday = groupGameDays.some((g) => g.status === 'open')
  const groupStageComplete = isGroupStageComplete(groupGameDays)
  const showGroupStage = !groupStageComplete || !knockoutGameDay
  const loading = loadingDays || (showGroupStage && loadingFixtures && fixtures.length === 0)
  const knockoutLoading =
    knockoutGameDay && knockoutPredictions.loading && knockoutPredictions.fixtures.length === 0
  const firstKickoff = useMemo(
    () => (selectedGameDay?.status === 'open' ? getEarliestKickoff(fixtures) : null),
    [fixtures, selectedGameDay?.status]
  )
  const tabState = selectedGameDay
    ? getMatchdayTabState(selectedGameDay, fixtures)
    : 'locked'
  const hasAnyContent = hasOpenGroupMatchday || knockoutGameDay !== null || groupGameDays.some((g) => g.status === 'completed')

  const hasNoActiveGames = !loading && !hasAnyContent
  const firstName = user?.display_name?.split(' ')[0] ?? 'there'

  const handleNameClick = () => {
    triggerEasterEgg()
  }

  return (
    <PageShell>
      <EasterEggTrackToast track={easterEggTrack} />
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
            {getTimeGreeting()},{' '}
            <button
              type="button"
              onClick={handleNameClick}
              className="underline decoration-brand-gold/50 decoration-2 underline-offset-[6px] hover:text-brand-blue transition-colors touch-manipulation"
            >
              {firstName}
            </button>
          </h1>
          <p className="text-sm sm:text-base text-gray-500">
            {showGroupStage
              ? 'Pick your scores for each group game. Each fixture locks one minute before kickoff.'
              : 'Pick your scores for each knockout fixture. Each fixture locks one minute before kickoff.'}
          </p>
          {!showGroupStage && (
            <p className="text-sm mt-1">
              <Link to="/history" className="text-brand-blue font-medium hover:underline">
                View previous matchdays →
              </Link>
            </p>
          )}
        </div>

        <UserStatsGrid />

        <PrizePotBanner stats={prizePot} loading={prizePotLoading} variant="inline" />

        {!loading && (
          hasNoActiveGames ? (
            <EmptyDashboardCard />
          ) : (
            showGroupStage && (
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
                  firstKickoff={matchdayOpen ? firstKickoff : null}
                  hasOpenMatchday={matchdayOpen}
                  tabState={tabState}
                  onKickoffReached={() => reload({ silent: true })}
                />
              </>
            )
          )
        )}

        <ErrorBoundary>
          {loading || knockoutLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <MatchCardSkeleton key={i} />
              ))}
            </div>
          ) : showGroupStage && selectedGameDay ? (
            <GameDayPanel
              gameDay={selectedGameDay}
              fixtures={fixtures}
              predictions={predictions}
              onSave={matchdayOpen ? handleSave : undefined}
              isCurrent
              isHistory={tabState === 'complete'}
              onConfirmChange={matchdayOpen ? handleConfirmChange : undefined}
            />
          ) : null}

          {knockoutGameDay && (
            <div className={`space-y-4 ${showGroupStage ? 'pt-2' : ''}`}>
              {showGroupStage && (
                <h2 className="font-display text-lg text-brand-navy">Knockout stage</h2>
              )}
              <DashboardStatusBanner
                lockedCount={knockoutPredictions.fixtures.filter((f) =>
                  knockoutPredictions.predictions.has(f.id)
                ).length}
                total={knockoutPredictions.fixtures.length}
                firstKickoff={
                  knockoutGameDay.status === 'open' && knockoutPredictions.fixtures.length > 0
                    ? getEarliestKickoff(knockoutPredictions.fixtures)
                    : null
                }
                hasOpenMatchday={knockoutGameDay.status === 'open'}
                onKickoffReached={() => knockoutPredictions.reload({ silent: true })}
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
