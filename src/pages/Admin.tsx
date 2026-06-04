import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Navbar } from '../components/ui/Navbar'
import { PageShell } from '../components/ui/PageBackground'
import { GameDayManager } from '../components/admin/GameDayManager'
import { AdminFixtureRow } from '../components/admin/AdminFixtureRow'
import { SyncStatusCard } from '../components/admin/SyncStatusCard'
import { ProgressionStatusCard } from '../components/admin/ProgressionStatusCard'
import { AdminPredictionsAudit } from '../components/admin/AdminPredictionsAudit'
import { AdminPaymentList, toggleUserPaid } from '../components/admin/AdminPaymentList'
import { KnockoutFixtureEditor } from '../components/admin/KnockoutFixtureEditor'
import { TableSkeleton } from '../components/ui/Skeleton'
import { ErrorBoundary } from '../components/ui/ErrorBoundary'
import { useAuth } from '../hooks/useAuth'
import { isDevBypassSession, MOCK_LEADERBOARD, MOCK_GAME_DAYS, MOCK_FIXTURES } from '../lib/devBypass'
import { supabase } from '../lib/supabase'
import { fetchGameDays, fetchAllFixtures } from '../lib/fixtures'
import type { GameDay, Fixture, AdminUserRow } from '../types'

export default function Admin() {
  const { user } = useAuth()
  const [gameDays, setGameDays] = useState<GameDay[]>([])
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [selectedGameDay, setSelectedGameDay] = useState<number | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [resetUserId, setResetUserId] = useState('')
  const [newPasscode, setNewPasscode] = useState('')
  const [togglingPaidId, setTogglingPaidId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      if (user && isDevBypassSession(user)) {
        setGameDays(MOCK_GAME_DAYS)
        setFixtures(MOCK_FIXTURES)
        setUsers(MOCK_LEADERBOARD.map((e) => ({
          id: e.id,
          username: e.display_name.toLowerCase().replace(/\s/g, '_'),
          display_name: e.display_name,
          total_points: e.total_points,
          has_paid: false,
          created_at: new Date().toISOString(),
        })))
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
        setUsers((userData as typeof users) ?? [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) load()
  }, [user])

  const incompleteFixtures = gameDays.reduce<Record<number, number>>((acc, gd) => {
    acc[gd.game_day] = fixtures.filter(
      (f) => f.game_day === gd.game_day && (f.home_score === null || f.away_score === null)
    ).length
    return acc
  }, {})

  const filteredFixtures = selectedGameDay === 'all'
    ? fixtures.filter((f) => f.home_score === null || f.away_score === null)
    : fixtures.filter((f) => f.game_day === selectedGameDay)

  const handleOpenGameDay = async (gameDay: number) => {
    if (!user) return
    if (isDevBypassSession(user)) {
      toast.success(`Matchday ${gameDay} opened (preview only)`)
      return
    }
    const { error } = await supabase.rpc('open_game_day', {
      p_user_id: user.id,
      p_session_token: user.session_token,
      p_game_day: gameDay,
    })
    if (error) throw error
    await load()
  }

  const handleCompleteGameDay = async (gameDay: number) => {
    if (!user) return
    if (isDevBypassSession(user)) {
      toast.success(`Matchday ${gameDay} completed (preview only)`)
      return
    }
    const { error } = await supabase.rpc('complete_game_day', {
      p_user_id: user.id,
      p_session_token: user.session_token,
      p_game_day: gameDay,
    })
    if (error) throw error
    await load()
  }

  const handleSubmitResult = async (fixtureId: number, home: number, away: number) => {
    if (!user) return
    if (isDevBypassSession(user)) {
      toast.success('Score confirmed (preview only)')
      return
    }
    const { error } = await supabase.rpc('submit_fixture_result', {
      p_user_id: user.id,
      p_session_token: user.session_token,
      p_fixture_id: fixtureId,
      p_home_score: home,
      p_away_score: away,
    })
    if (error) throw error
    await load()
  }

  const handleResetPasscode = async () => {
    if (!user || !resetUserId || newPasscode.length !== 4) {
      toast.error('Select a user and enter a 4-digit passcode')
      return
    }

    const { error } = await supabase.rpc('reset_user_passcode', {
      p_admin_id: user.id,
      p_session_token: user.session_token,
      p_target_user_id: resetUserId,
      p_new_passcode: newPasscode,
    })

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success('Passcode reset successfully')
    setNewPasscode('')
  }

  const handleTogglePaid = async (userId: string, hasPaid: boolean) => {
    if (!user) return

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, has_paid: hasPaid } : u))
    )
    setTogglingPaidId(userId)

    try {
      await toggleUserPaid(user.id, user.session_token, userId, hasPaid, !!isDevBypassSession(user))
    } catch (err) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, has_paid: !hasPaid } : u))
      )
      toast.error(err instanceof Error ? err.message : 'Failed to update payment status')
    } finally {
      setTogglingPaidId(null)
    }
  }

  const isDev = user && isDevBypassSession(user)

  return (
    <PageShell>
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-5 sm:py-8 space-y-8 sm:space-y-10">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl text-brand-navy">Admin</h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">Manage matchdays, sync results, and users</p>
        </div>

        <section>
          <h2 className="font-display text-xl text-brand-navy mb-4">API Sync</h2>
          <SyncStatusCard devMode={!!isDev} />
        </section>

        <section>
          <h2 className="font-display text-xl text-brand-navy mb-4">Auto Progression</h2>
          <ProgressionStatusCard devMode={!!isDev} />
        </section>

        <section>
          <h2 className="font-display text-xl text-brand-navy mb-1">Knockout Fixture Editor</h2>
          <p className="text-sm text-gray-500 mb-4">
            Update placeholder team names once knockout opponents are confirmed (Matchdays 4–8).
          </p>
          <ErrorBoundary>
            {loading ? (
              <TableSkeleton rows={3} />
            ) : (
              <KnockoutFixtureEditor fixtures={fixtures} devMode={!!isDev} onSaved={load} />
            )}
          </ErrorBoundary>
        </section>

        <section>
          <h2 className="font-display text-xl text-brand-navy mb-4">Matchday Manager</h2>
          <ErrorBoundary>
            {loading ? (
              <TableSkeleton rows={4} />
            ) : (
              <GameDayManager
                gameDays={gameDays}
                onOpen={handleOpenGameDay}
                onComplete={handleCompleteGameDay}
                incompleteFixtures={incompleteFixtures}
              />
            )}
          </ErrorBoundary>
        </section>

        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 className="font-display text-xl text-brand-navy">Manual Result Entry</h2>
            <select
              value={selectedGameDay}
              onChange={(e) => setSelectedGameDay(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="input-field w-full sm:w-auto text-sm py-2"
            >
              <option value="all">All pending</option>
              {gameDays.map((gd) => (
                <option key={gd.id} value={gd.game_day}>{gd.label.replace(/Game Day/gi, 'Matchday')}</option>
              ))}
            </select>
          </div>

          <ErrorBoundary>
            {loading ? (
              <TableSkeleton rows={5} />
            ) : filteredFixtures.length === 0 ? (
              <div className="glass-card p-6 text-center text-gray-500">
                All fixtures have results entered
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {filteredFixtures.map((fixture) => (
                  <AdminFixtureRow
                    key={fixture.id}
                    fixture={fixture}
                    onSubmitResult={handleSubmitResult}
                  />
                ))}
              </div>
            )}
          </ErrorBoundary>
        </section>

        <section>
          <h2 className="font-display text-xl text-brand-navy mb-1">Predictions Audit</h2>
          <p className="text-sm text-gray-500 mb-4">
            Every player&apos;s predictions, actual results, and points — filter by matchday or player.
          </p>
          <ErrorBoundary>
            <AdminPredictionsAudit
              gameDays={gameDays}
              users={users}
              devMode={!!isDev}
            />
          </ErrorBoundary>
        </section>

        <section>
          <h2 className="font-display text-xl text-brand-navy mb-1">Entry Fees</h2>
          <p className="text-sm text-gray-500 mb-4">
            All sign-ups — tick each player when you&apos;ve received their cash payment.
          </p>
          <AdminPaymentList
            users={users}
            devMode={!!isDev}
            onTogglePaid={handleTogglePaid}
            togglingId={togglingPaidId}
          />
        </section>

        <section>
          <h2 className="font-display text-xl text-brand-navy mb-4">User Manager</h2>
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-blue/10 text-gray-500 uppercase text-xs">
                    <th className="text-left p-4 font-medium">Username</th>
                    <th className="text-left p-4 font-medium">Display Name</th>
                    <th className="text-right p-4 font-medium">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-brand-blue/5 hover:bg-white/40">
                      <td className="p-4 font-mono text-gray-500 text-xs">{u.username}</td>
                      <td className="p-4 text-brand-navy font-medium">{u.display_name}</td>
                      <td className="p-4 text-right text-brand-blue font-mono font-bold">{u.total_points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-brand-blue/10 flex flex-col sm:flex-row gap-3">
              <select
                value={resetUserId}
                onChange={(e) => setResetUserId(e.target.value)}
                className="input-field flex-1 text-sm py-2"
              >
                <option value="">Select user to reset passcode</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.display_name} (@{u.username})</option>
                ))}
              </select>
              <input
                type="text"
                maxLength={4}
                value={newPasscode}
                onChange={(e) => setNewPasscode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="New 4-digit PIN"
                className="input-field w-full sm:w-36 text-sm py-2 text-center font-mono"
              />
              <button onClick={handleResetPasscode} className="btn-danger text-sm py-2 px-5 shrink-0">
                Reset Passcode
              </button>
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  )
}
