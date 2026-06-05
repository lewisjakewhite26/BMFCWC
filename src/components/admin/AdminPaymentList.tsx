import { PrizePotPaymentBar } from '../ui/PrizePotPaymentBar'
import { calculatePrizePotGbp, calculateTotalCollectedGbp, formatPrizePotGbp, ENTRY_FEE_GBP, PRIZE_POT_SHARE } from '../../lib/prizePot'
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
  const totalCount = users.length
  const prizePot = calculatePrizePotGbp(paidCount)
  const potentialPot = calculatePrizePotGbp(totalCount)
  const totalCollected = calculateTotalCollectedGbp(paidCount)
  const sharePct = Math.round(PRIZE_POT_SHARE * 100)
  const hasUnpaid = totalCount > paidCount

  return (
    <div className="overflow-hidden min-w-0">
      <div className="px-4 sm:px-5 py-4 border-b border-brand-blue/10 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-sm text-gray-600">
            <span className="font-mono font-bold text-brand-navy">{paidCount}</span>
            {' '}of{' '}
            <span className="font-mono font-bold text-brand-navy">{totalCount}</span>
            {' '}paid
          </p>
          <p className="text-xs text-gray-400">Tick when cash received</p>
        </div>
        <div className="rounded-xl bg-brand-gold/10 border border-brand-gold/20 px-3 py-3 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-1">
            <p className="text-xs text-gray-500">
              {formatPrizePotGbp(totalCollected)} collected · {sharePct}% to winners
            </p>
            <p className="text-sm font-semibold text-brand-navy">
              Prize pot{' '}
              <span className="font-display text-lg text-brand-gold tabular-nums">{formatPrizePotGbp(prizePot)}</span>
              {hasUnpaid && (
                <span className="text-gray-400 font-normal text-xs ml-1">
                  / {formatPrizePotGbp(potentialPot)} potential
                </span>
              )}
              <span className="text-gray-400 font-normal text-xs ml-1">(£{ENTRY_FEE_GBP}/player)</span>
            </p>
          </div>
          <PrizePotPaymentBar paidEntrants={paidCount} totalEntrants={totalCount} compact />
        </div>
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
