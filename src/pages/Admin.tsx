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
import { AdminSection } from '../components/admin/AdminSection'
import { KnockoutFixtureEditor } from '../components/admin/KnockoutFixtureEditor'
import { TableSkeleton } from '../components/ui/Skeleton'
import { ErrorBoundary } from '../components/ui/ErrorBoundary'
import { useAuth } from '../hooks/useAuth'
import { isDevBypassSession, MOCK_LEADERBOARD, MOCK_GAME_DAYS, MOCK_FIXTURES } from '../lib/devBypass'
import { supabase } from '../lib/supabase'
import { fetchGameDays, fetchAllFixtures } from '../lib/fixtures'
import type { GameDay, Fixture, AdminUserRow } from '../types'

function formatSignupDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function Admin() {
  const { user } = useAuth()
  const [gameDays, setGameDays] = useState<GameDay[]>([])
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [selectedGameDay, setSelectedGameDay] = useState<number | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [passcodeResetUserId, setPasscodeResetUserId] = useState<string | null>(null)
  const [newPasscode, setNewPasscode] = useState('')
  const [resettingPasscodeUserId, setResettingPasscodeUserId] = useState<string | null>(null)
  const [togglingPaidId, setTogglingPaidId] = useState<string | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)

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

  const handleResetPasscode = async (targetUserId: string) => {
    if (!user || newPasscode.length !== 4) {
      toast.error('Enter a 4-digit passcode')
      return
    }

    setResettingPasscodeUserId(targetUserId)

    try {
      if (isDevBypassSession(user)) {
        toast.success('Passcode reset (preview only)')
        setPasscodeResetUserId(null)
        setNewPasscode('')
        return
      }

      const { error } = await supabase.rpc('reset_user_passcode', {
        p_admin_id: user.id,
        p_session_token: user.session_token,
        p_target_user_id: targetUserId,
        p_new_passcode: newPasscode,
      })

      if (error) throw error

      toast.success('Passcode reset successfully')
      setPasscodeResetUserId(null)
      setNewPasscode('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reset passcode')
    } finally {
      setResettingPasscodeUserId(null)
    }
  }

  const handleDeleteUser = async (target: AdminUserRow) => {
    if (!user) return

    const confirmed = window.confirm(
      `Are you sure you want to delete ${target.display_name}? This cannot be undone.`
    )
    if (!confirmed) return

    setDeletingUserId(target.id)

    try {
      if (isDevBypassSession(user)) {
        setUsers((prev) => prev.filter((u) => u.id !== target.id))
        if (passcodeResetUserId === target.id) {
          setPasscodeResetUserId(null)
          setNewPasscode('')
        }
        toast.success(`${target.display_name} deleted (preview only)`)
        return
      }

      const { error } = await supabase.rpc('admin_delete_user', {
        p_admin_id: user.id,
        p_session_token: user.session_token,
        p_target_user_id: target.id,
      })

      if (error) throw error

      setUsers((prev) => prev.filter((u) => u.id !== target.id))
      if (passcodeResetUserId === target.id) {
        setPasscodeResetUserId(null)
        setNewPasscode('')
      }
      toast.success(`${target.display_name} deleted`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete user')
    } finally {
      setDeletingUserId(null)
    }
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

      <div className="max-w-4xl mx-auto px-4 py-5 sm:py-8 overflow-x-hidden">
        <div className="mb-8">
          <h1 className="font-display text-2xl sm:text-3xl text-brand-navy">Admin</h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">Manage matchdays, sync results, and users</p>
        </div>

        <AdminSection title="API Sync">
          <SyncStatusCard devMode={!!isDev} />
        </AdminSection>

        <AdminSection title="Auto Progression">
          <ProgressionStatusCard devMode={!!isDev} />
        </AdminSection>

        <AdminSection
          title="Knockout Fixture Editor"
          description="Update placeholder team names once knockout opponents are confirmed (Matchdays 4–8)."
        >
          <ErrorBoundary>
            {loading ? (
              <TableSkeleton rows={3} />
            ) : (
              <KnockoutFixtureEditor fixtures={fixtures} devMode={!!isDev} onSaved={load} />
            )}
          </ErrorBoundary>
        </AdminSection>

        <AdminSection title="Matchday Manager">
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
        </AdminSection>

        <AdminSection
          title="Manual Result Entry"
          headerExtra={
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
          }
        >
          <ErrorBoundary>
            {loading ? (
              <TableSkeleton rows={5} />
            ) : filteredFixtures.length === 0 ? (
              <div className="admin-inner-card p-6 text-center text-gray-500">
                All fixtures have results entered
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto overflow-x-hidden pr-1">
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
        </AdminSection>

        <AdminSection
          title="Predictions Audit"
          description="Every player's predictions, actual results, and points — filter by matchday or player."
        >
          <ErrorBoundary>
            <AdminPredictionsAudit
              gameDays={gameDays}
              users={users}
              devMode={!!isDev}
            />
          </ErrorBoundary>
        </AdminSection>

        <AdminSection
          title="Entry Fees"
          description="All sign-ups — tick each player when you've received their cash payment."
        >
          <AdminPaymentList
            users={users}
            devMode={!!isDev}
            onTogglePaid={handleTogglePaid}
            togglingId={togglingPaidId}
          />
        </AdminSection>

        <AdminSection
          title="User Manager"
          description="Compare signup dates to spot duplicate accounts with similar names."
        >
          <div className="overflow-hidden min-w-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b border-brand-blue/10 text-gray-500 uppercase text-xs">
                    <th className="text-left p-4 font-medium">Username</th>
                    <th className="text-left p-4 font-medium">Display Name</th>
                    <th className="text-left p-4 font-medium">Signed Up</th>
                    <th className="text-right p-4 font-medium">Points</th>
                    <th className="text-right p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-brand-blue/5 hover:bg-white/40">
                      <td className="p-4 font-mono text-gray-500 text-xs">{u.username}</td>
                      <td className="p-4 text-brand-navy font-medium">{u.display_name}</td>
                      <td className="p-4 text-gray-500 text-xs whitespace-nowrap">
                        {formatSignupDate(u.created_at)}
                      </td>
                      <td className="p-4 text-right text-brand-blue font-mono font-bold">{u.total_points}</td>
                      <td className="p-4 text-right">
                        {passcodeResetUserId === u.id ? (
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            <input
                              type="text"
                              maxLength={4}
                              value={newPasscode}
                              onChange={(e) => setNewPasscode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                              placeholder="4-digit PIN"
                              autoFocus
                              className="input-field w-24 text-sm py-1.5 text-center font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => handleResetPasscode(u.id)}
                              disabled={resettingPasscodeUserId === u.id || newPasscode.length !== 4}
                              className="text-sm font-medium text-brand-blue hover:text-brand-navy disabled:opacity-50"
                            >
                              {resettingPasscodeUserId === u.id ? 'Saving…' : 'Confirm'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setPasscodeResetUserId(null)
                                setNewPasscode('')
                              }}
                              disabled={resettingPasscodeUserId === u.id}
                              className="text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                setPasscodeResetUserId(u.id)
                                setNewPasscode('')
                              }}
                              className="text-sm font-medium text-brand-blue hover:text-brand-navy"
                            >
                              Reset Passcode
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u)}
                              disabled={deletingUserId === u.id || u.id === user?.id}
                              className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {deletingUserId === u.id ? 'Deleting…' : 'Delete User'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </AdminSection>
      </div>
    </PageShell>
  )
}
