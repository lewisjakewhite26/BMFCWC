import { useState } from 'react'
import toast from 'react-hot-toast'
import { Navbar } from '../components/ui/Navbar'
import { PageShell } from '../components/ui/PageBackground'
import { AdminNav } from '../components/admin/AdminNav'
import { AdminSection } from '../components/admin/AdminSection'
import { AdminPaymentList } from '../components/admin/AdminPaymentList'
import { AdminMissingPredictions } from '../components/admin/AdminMissingPredictions'
import { AdminPredictionsAudit } from '../components/admin/AdminPredictionsAudit'
import { TableSkeleton } from '../components/ui/Skeleton'
import { ErrorBoundary } from '../components/ui/ErrorBoundary'
import { useAdminData } from '../hooks/useAdminData'
import { toggleUserPaid } from '../lib/adminPayments'

export default function AdminOperations() {
  const { user, gameDays, fixtures, users, setUsers, loading, isDev, openGameDay } = useAdminData()
  const [togglingPaidId, setTogglingPaidId] = useState<string | null>(null)

  const handleTogglePaid = async (userId: string, hasPaid: boolean) => {
    if (!user) return

    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, has_paid: hasPaid } : u)))
    setTogglingPaidId(userId)

    try {
      await toggleUserPaid(user.id, user.session_token, userId, hasPaid, isDev)
    } catch (err) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, has_paid: !hasPaid } : u)))
      toast.error(err instanceof Error ? err.message : 'Failed to update payment status')
    } finally {
      setTogglingPaidId(null)
    }
  }

  return (
    <PageShell>
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-5 sm:py-8 overflow-x-hidden">
        <div className="mb-6">
          <h1 className="font-display text-2xl sm:text-3xl text-brand-navy">Admin</h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">
            Tick payments, chase missing predictions, and look up what people picked.
          </p>
        </div>

        <AdminNav />

        <AdminSection
          title="Entry fees"
          description="Tick each player when their £10 has landed in the account."
        >
          {loading ? (
            <TableSkeleton rows={4} />
          ) : (
            <AdminPaymentList
              users={users}
              devMode={isDev}
              onTogglePaid={handleTogglePaid}
              togglingId={togglingPaidId}
            />
          )}
        </AdminSection>

        <AdminSection
          title="Who still needs to predict"
          description="Players missing picks for the selected matchday. Chase them before the cutoff."
        >
          <ErrorBoundary>
            {loading ? (
              <div className="p-8 text-center text-gray-500 text-sm animate-pulse">Loading…</div>
            ) : (
              <AdminMissingPredictions
                gameDays={gameDays}
                fixtures={fixtures}
                users={users}
                defaultGameDay={openGameDay?.game_day ?? null}
                devMode={isDev}
              />
            )}
          </ErrorBoundary>
        </AdminSection>

        <AdminSection
          title="View predictions"
          description="See what everyone guessed. Filter by matchday or player."
        >
          <ErrorBoundary>
            {loading ? (
              <TableSkeleton rows={5} />
            ) : (
              <AdminPredictionsAudit
                gameDays={gameDays}
                users={users}
                devMode={isDev}
                friendly
                defaultGameDay={openGameDay?.game_day ?? null}
              />
            )}
          </ErrorBoundary>
        </AdminSection>
      </div>
    </PageShell>
  )
}
