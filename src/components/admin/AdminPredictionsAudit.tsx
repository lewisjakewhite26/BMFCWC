import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { formatKickoffLocal } from '../../lib/scoring'
import type { AdminUserRow, GameDay } from '../../types'

export interface PredictionAuditRow {
  prediction_id: string
  user_id: string
  display_name: string
  username: string
  total_points: number
  fixture_id: number
  game_day: number
  home_team: string
  away_team: string
  kickoff_utc: string
  predicted_home: number
  predicted_away: number
  actual_home: number | null
  actual_away: number | null
  points_awarded: number
  created_at: string
}

interface AdminPredictionsAuditProps {
  gameDays: GameDay[]
  users: AdminUserRow[]
  devMode?: boolean
  friendly?: boolean
  defaultGameDay?: number | null
}

function pointsBadgeClass(points: number): string {
  if (points === 10) return 'bg-brand-gold/15 text-brand-gold border-brand-gold/30'
  if (points === 5) return 'bg-brand-blue/10 text-brand-blue border-brand-blue/25'
  return 'bg-gray-100 text-gray-500 border-gray-200'
}

export function AdminPredictionsAudit({
  gameDays,
  users,
  devMode = false,
  friendly = false,
  defaultGameDay = null,
}: AdminPredictionsAuditProps) {
  const { user } = useAuth()
  const [rows, setRows] = useState<PredictionAuditRow[]>([])
  const [loading, setLoading] = useState(true)
  const [gameDayFilter, setGameDayFilter] = useState<number | 'all'>(() =>
    defaultGameDay !== null ? defaultGameDay : 'all'
  )
  const [userFilter, setUserFilter] = useState<string>('all')

  useEffect(() => {
    if (defaultGameDay !== null) {
      setGameDayFilter(defaultGameDay)
    }
  }, [defaultGameDay])

  const load = useCallback(async () => {
    if (devMode) {
      setRows([])
      setLoading(false)
      return
    }

    if (!user) return

    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('admin_get_predictions_audit', {
        p_admin_id: user.id,
        p_session_token: user.session_token,
        p_game_day: gameDayFilter === 'all' ? null : gameDayFilter,
        p_filter_user_id: userFilter === 'all' ? null : userFilter,
      })

      if (error) throw error
      setRows((data as PredictionAuditRow[]) ?? [])
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : 'Failed to load predictions')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [user, devMode, gameDayFilter, userFilter])

  useEffect(() => {
    load()
  }, [load])

  const summary = useMemo(() => {
    const totalPts = rows.reduce((sum, r) => sum + r.points_awarded, 0)
    const scored = rows.filter((r) => r.actual_home !== null && r.actual_away !== null).length
    return { count: rows.length, totalPts, scored }
  }, [rows])

  return (
    <div className="overflow-hidden min-w-0">
      <div className="p-4 sm:p-5 border-b border-brand-blue/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">
              Matchday
            </label>
            <select
              value={gameDayFilter}
              onChange={(e) =>
                setGameDayFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
              }
              className="input-field w-full text-sm py-2"
            >
              <option value="all">All matchdays</option>
              {gameDays.map((gd) => (
                <option key={gd.id} value={gd.game_day}>
                  {gd.label.replace(/Game Day/gi, 'Matchday')}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">
              Player
            </label>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="input-field w-full text-sm py-2"
            >
              <option value="all">All players</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.display_name} ({u.total_points} pts)
                </option>
              ))}
            </select>
          </div>
        </div>

        {!friendly && (
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="rounded-xl bg-white/50 border border-brand-blue/10 px-3 py-1.5 text-gray-600">
              <span className="font-mono font-bold text-brand-navy">{summary.count}</span> predictions
            </span>
            <span className="rounded-xl bg-white/50 border border-brand-blue/10 px-3 py-1.5 text-gray-600">
              <span className="font-mono font-bold text-brand-navy">{summary.scored}</span> scored
            </span>
            <span className="rounded-xl bg-white/50 border border-brand-blue/10 px-3 py-1.5 text-gray-600">
              <span className="font-mono font-bold text-brand-gold">{summary.totalPts}</span> pts in view
            </span>
          </div>
        )}
        {friendly && rows.length > 0 && (
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold text-brand-navy tabular-nums">{summary.count}</span> predictions
          </p>
        )}
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500 text-sm animate-pulse">Loading predictions…</div>
      ) : rows.length === 0 ? (
        <div className="p-8 text-center text-gray-500 text-sm">
          {devMode ? 'Predictions audit (preview only, no data in dev bypass)' : 'No predictions match these filters'}
        </div>
      ) : (
        <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-brand-blue/10">
              <tr className="text-gray-500 uppercase text-[11px]">
                <th className="text-left p-3 font-medium">{friendly ? 'Name' : 'Player'}</th>
                {!friendly && <th className="text-left p-3 font-medium">MD</th>}
                <th className="text-left p-3 font-medium">Match</th>
                <th className="text-center p-3 font-medium">{friendly ? 'Guess' : 'Prediction'}</th>
                <th className="text-center p-3 font-medium">{friendly ? 'Actual' : 'Actual'}</th>
                <th className="text-center p-3 font-medium">Pts</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const hasResult = row.actual_home !== null && row.actual_away !== null
                return (
                  <tr
                    key={row.prediction_id}
                    className="border-b border-brand-blue/5 hover:bg-white/40"
                  >
                    <td className="p-3">
                      <p className="font-medium text-brand-navy">{row.display_name}</p>
                      {!friendly && (
                        <p className="text-[11px] text-gray-400 font-mono">@{row.username}</p>
                      )}
                    </td>
                    {!friendly && <td className="p-3 font-mono text-gray-600">{row.game_day}</td>}
                    <td className="p-3 min-w-[140px]">
                      <p className="text-brand-navy leading-snug">
                        {row.home_team} vs {row.away_team}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {formatKickoffLocal(row.kickoff_utc)}
                      </p>
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-brand-navy tabular-nums">
                      {row.predicted_home}–{row.predicted_away}
                    </td>
                    <td className="p-3 text-center font-mono tabular-nums text-gray-600">
                      {hasResult ? `${row.actual_home}–${row.actual_away}` : '-'}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block min-w-[2rem] text-xs font-bold font-mono px-2 py-0.5 rounded-pill border ${pointsBadgeClass(row.points_awarded)}`}
                      >
                        {hasResult ? row.points_awarded : '-'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
