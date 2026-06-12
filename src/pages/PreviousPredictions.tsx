import { Navbar } from '../components/ui/Navbar'
import { PageShell } from '../components/ui/PageBackground'
import { GameDayPanel } from '../components/match/GameDayPanel'
import { MatchCardSkeleton } from '../components/ui/Skeleton'
import { ErrorBoundary } from '../components/ui/ErrorBoundary'
import { useAuth } from '../hooks/useAuth'
import { usePastMatchdays } from '../hooks/usePastMatchdays'

function ScoreLegend() {
  return (
    <div className="glass-card p-3 sm:p-4 -mx-0 overflow-x-auto scrollbar-hide">
      <div className="flex gap-4 sm:flex-wrap sm:gap-x-6 sm:gap-y-2 text-xs sm:text-sm text-gray-600 w-max sm:w-auto">
        <span className="flex items-center gap-2 whitespace-nowrap">
          <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" aria-hidden />
          Exact, 10 pts
        </span>
        <span className="flex items-center gap-2 whitespace-nowrap">
          <span className="w-3 h-3 rounded-full bg-brand-blue/45 shrink-0" aria-hidden />
          Result, 5 pts
        </span>
        <span className="flex items-center gap-2 whitespace-nowrap">
          <span className="w-3 h-3 rounded-full bg-gray-300/60 shrink-0" aria-hidden />
          No points
        </span>
      </div>
    </div>
  )
}

export default function PreviousPredictions() {
  const { user } = useAuth()
  const { gameDays, fixturesByDay, predictions, loading, totalPoints } = usePastMatchdays()

  return (
    <PageShell>
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-5 sm:py-8 space-y-5 sm:space-y-8">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl text-brand-navy mb-0.5">Previous Matchdays</h1>
          <p className="text-sm sm:text-base text-gray-500">
            {user?.display_name}
            {gameDays.length > 0 && (
              <span className="font-mono text-brand-navy"> · {totalPoints} points</span>
            )}
          </p>
        </div>

        <ScoreLegend />

        <ErrorBoundary>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <MatchCardSkeleton key={i} />
              ))}
            </div>
          ) : gameDays.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <p className="text-gray-500">No results yet. Your scored predictions will appear here as each fixture is confirmed.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {gameDays.map((day, index) => (
                <GameDayPanel
                  key={day.id}
                  gameDay={day}
                  fixtures={fixturesByDay.get(day.game_day) ?? []}
                  predictions={predictions}
                  isHistory
                  defaultOpen={index === 0}
                />
              ))}
            </div>
          )}
        </ErrorBoundary>
      </div>
    </PageShell>
  )
}
