import toast from 'react-hot-toast'
import type { AdminUserRow } from '../../types'

interface AdminPaymentListProps {
  users: AdminUserRow[]
  devMode?: boolean
  onTogglePaid: (userId: string, hasPaid: boolean) => Promise<void>
  togglingId: string | null
}

export function AdminPaymentList({
  users,
  devMode = false,
  onTogglePaid,
  togglingId,
}: AdminPaymentListProps) {
  const paidCount = users.filter((u) => u.has_paid).length

  return (
    <div className="glass-card overflow-hidden">
      <div className="px-4 sm:px-5 py-4 border-b border-brand-blue/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className="text-sm text-gray-600">
          <span className="font-mono font-bold text-brand-navy">{paidCount}</span>
          {' '}of{' '}
          <span className="font-mono font-bold text-brand-navy">{users.length}</span>
          {' '}paid
        </p>
        <p className="text-xs text-gray-400">Tick when cash received</p>
      </div>

      {users.length === 0 ? (
        <div className="p-8 text-center text-gray-500 text-sm">No sign-ups yet</div>
      ) : (
        <ul className="divide-y divide-brand-blue/5 max-h-[480px] overflow-y-auto">
          {users.map((u) => {
            const busy = togglingId === u.id
            return (
              <li
                key={u.id}
                className={`flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-white/40 transition-colors ${
                  u.has_paid ? 'bg-emerald-50/30' : ''
                }`}
              >
                <label className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={u.has_paid}
                    disabled={busy || devMode}
                    onChange={(e) => onTogglePaid(u.id, e.target.checked)}
                    className="h-5 w-5 shrink-0 rounded border-brand-blue/30 text-brand-blue focus:ring-brand-blue/30 disabled:opacity-50"
                    aria-label={`${u.display_name} paid`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-brand-navy truncate">{u.display_name}</span>
                    <span className="block text-[11px] text-gray-400 font-mono truncate">@{u.username}</span>
                  </span>
                </label>
                {u.has_paid && (
                  <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-pill">
                    Paid
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {devMode && (
        <p className="px-4 py-3 text-xs text-gray-400 border-t border-brand-blue/10">
          Preview mode — payment ticks are disabled
        </p>
      )}
    </div>
  )
}

export async function toggleUserPaid(
  adminId: string,
  sessionToken: string,
  userId: string,
  hasPaid: boolean,
  devMode: boolean
): Promise<void> {
  if (devMode) {
    toast.success(hasPaid ? 'Marked paid (preview)' : 'Marked unpaid (preview)')
    return
  }

  const { supabase } = await import('../../lib/supabase')
  const { error } = await supabase.rpc('admin_set_user_paid', {
    p_admin_id: adminId,
    p_session_token: sessionToken,
    p_target_user_id: userId,
    p_has_paid: hasPaid,
  })

  if (error) throw error
}
