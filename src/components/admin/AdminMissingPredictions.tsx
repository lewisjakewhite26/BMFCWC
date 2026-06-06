import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import type { AdminUserRow, Fixture, GameDay } from '../../types'

interface AdminMissingPredictionsProps {
  gameDays: GameDay[]
  fixtures: Fixture[]
  users: AdminUserRow[]
  defaultGameDay?: number | null
  devMode?: boolean
}

interface UserPredictionStatus {
  user: AdminUserRow
  predicted: number
  total: number
  status: 'complete' | 'partial' | 'none'
}

function defaultGameDayNumber(gameDays: GameDay[]): number | null {
  const open = gameDays.find((gd) => gd.status === 'open')
  if (open) return open.game_day
  const locked = gameDays.find((gd) => gd.status === 'locked')
  if (locked) return locked.game_day
  return gameDays[gameDays.length - 1]?.game_day ?? null
}

export function AdminMissingPredictions({
  gameDays,
  fixtures,
  users,
  defaultGameDay,
  devMode = false,
}: AdminMissingPredictionsProps) {
  const { user } = useAuth()
  const [gameDay, setGameDay] = useState<number | null>(
    defaultGameDay ?? defaultGameDayNumber(gameDays)
  )
  const [predictionCounts, setPredictionCounts] = useState<Map<string, number>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const next = defaultGameDay ?? defaultGameDayNumber(gameDays)
    setGameDay((prev) => prev ?? next)
  }, [gameDays, defaultGameDay])

  const fixtureCount = useMemo(
    () => (gameDay === null ? 0 : fixtures.filter((f) => f.game_day === gameDay).length),
    [fixtures, gameDay]
  )

  const load = useCallback(async () => {
    if (gameDay === null) {
      setPredictionCounts(new Map())
      setLoading(false)
      return
    }

    if (devMode) {
      setPredictionCounts(new Map())
      setLoading(false)
      return
    }

    if (!user) return

    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('admin_get_predictions_audit', {
        p_admin_id: user.id,
        p_session_token: user.session_token,
        p_game_day: gameDay,
        p_filter_user_id: null,
      })

      if (error) throw error

      const counts = new Map<string, number>()
      for (const row of (data as { user_id: string }[]) ?? []) {
        counts.set(row.user_id, (counts.get(row.user_id) ?? 0) + 1)
      }
      setPredictionCounts(counts)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load prediction status')
      setPredictionCounts(new Map())
    } finally {
      setLoading(false)
    }
  }, [user, devMode, gameDay])

  useEffect(() => {
    load()
  }, [load])

  const statuses = useMemo((): UserPredictionStatus[] => {
    if (fixtureCount === 0) return []

    return users.map((u) => {
      const predicted = predictionCounts.get(u.id) ?? 0
      let status: UserPredictionStatus['status'] = 'partial'
      if (predicted >= fixtureCount) status = 'complete'
      else if (predicted === 0) status = 'none'

      return { user: u, predicted, total: fixtureCount, status }
    })
  }, [users, predictionCounts, fixtureCount])

  const incomplete = statuses.filter((s) => s.status !== 'complete')
  const completeCount = statuses.length - incomplete.length
  const selectedLabel =
    gameDays.find((gd) => gd.game_day === gameDay)?.label.replace(/Game Day/gi, 'Matchday') ??
    (gameDay !== null ? `Matchday ${gameDay}` : '')

  return (
    <div className="overflow-hidden min-w-0">
      <div className="px-4 sm:px-5 py-4 border-b border-brand-blue/10 space-y-3">
        <div>
          <label htmlFor="missing-predictions-matchday" className="block text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">
            Matchday
          </label>
          <select
            id="missing-predictions-matchday"
            value={gameDay ?? ''}
            onChange={(e) => setGameDay(Number(e.target.value))}
            className="input-field w-full sm:max-w-xs text-sm py-2"
          >
            {gameDays.map((gd) => (
              <option key={gd.id} value={gd.game_day}>
                {gd.label.replace(/Game Day/gi, 'Matchday')}
                {gd.status === 'open' ? ' (open)' : gd.status === 'completed' ? ' (done)' : ''}
              </option>
            ))}
          </select>
        </div>

        {fixtureCount > 0 && (
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-brand-navy tabular-nums">{completeCount}</span>
            {' '}of{' '}
            <span className="font-semibold text-brand-navy tabular-nums">{users.length}</span>
            {' '}players have all{' '}
            <span className="font-semibold text-brand-navy tabular-nums">{fixtureCount}</span>
            {' '}predictions in for {selectedLabel}.
          </p>
        )}
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500 text-sm animate-pulse">Checking predictions…</div>
      ) : fixtureCount === 0 ? (
        <div className="p-8 text-center text-gray-500 text-sm">No fixtures on this matchday yet.</div>
      ) : devMode ? (
        <div className="p-8 text-center text-gray-500 text-sm">Preview mode — no live data.</div>
      ) : incomplete.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-emerald-700 font-medium">Everyone has submitted for this matchday.</p>
        </div>
      ) : (
        <ul className="divide-y divide-brand-blue/5 max-h-[420px] overflow-y-auto">
          {incomplete.map(({ user: u, predicted, total, status }) => (
            <li
              key={u.id}
              className={`flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 ${
                status === 'none' ? 'bg-amber-50/40' : 'bg-orange-50/30'
              }`}
            >
              <div className="min-w-0">
                <p className="font-medium text-brand-navy truncate">{u.display_name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {status === 'none'
                    ? 'No predictions entered yet'
                    : `${predicted} of ${total} matches predicted`}
                </p>
              </div>
              <span
                className={`shrink-0 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-pill border ${
                  status === 'none'
                    ? 'text-amber-800 bg-amber-50 border-amber-200'
                    : 'text-orange-800 bg-orange-50 border-orange-200'
                }`}
              >
                {status === 'none' ? 'Not started' : 'Incomplete'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
