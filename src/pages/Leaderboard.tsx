import { Link } from 'react-router-dom'
import { Navbar } from '../components/ui/Navbar'
import { PageShell } from '../components/ui/PageBackground'
import { Leaderboard } from '../components/leaderboard/Leaderboard'
import { TableSkeleton } from '../components/ui/Skeleton'
import { ErrorBoundary } from '../components/ui/ErrorBoundary'
import { PrizePotBanner } from '../components/ui/PrizePotBanner'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { usePrizePot } from '../hooks/usePrizePot'
import { useAuth } from '../hooks/useAuth'
import { ClubLogo } from '../components/ui/ClubLogo'

export default function LeaderboardPage() {
  const { entries, loading } = useLeaderboard()
  const { stats: prizePot, loading: prizePotLoading } = usePrizePot()
  const { user } = useAuth()

  return (
    <PageShell>
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-5 sm:py-8 relative">
        <ClubLogo
          aria-hidden
          className="hidden sm:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 opacity-[0.04] pointer-events-none object-contain"
        />

        <div className="relative z-10">
          <h1 className="font-display text-2xl sm:text-4xl text-brand-navy text-center mb-2">
            The Table
          </h1>
          <p className="text-gray-500 text-center mb-5">Updated after every result</p>

          <div className="mb-5 sm:mb-8">
            <PrizePotBanner stats={prizePot} loading={prizePotLoading} />
          </div>

          <div className="glass-card p-4 sm:p-6">
            <ErrorBoundary>
              {loading ? (
                <TableSkeleton rows={10} />
              ) : (
                <>
                  <Leaderboard entries={entries} loading={false} currentUserId={user?.id} />
                  {!user && (
                    <div className="mt-5 pt-5 border-t border-brand-blue/10 text-center">
                      <p className="text-sm text-gray-500 mb-3">Sign up to take part</p>
                      <Link to="/signup" className="btn-primary text-sm py-2.5 px-6 min-h-[44px]">
                        Sign up to join The Table
                      </Link>
                    </div>
                  )}
                </>
              )}
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
