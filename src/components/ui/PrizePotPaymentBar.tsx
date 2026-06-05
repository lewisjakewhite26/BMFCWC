import { getPaymentBarSegments } from '../../lib/prizePot'

interface PrizePotPaymentBarProps {
  paidEntrants: number
  totalEntrants: number
  compact?: boolean
}

export function PrizePotPaymentBar({ paidEntrants, totalEntrants, compact = false }: PrizePotPaymentBarProps) {
  const { paidPct, unpaidPct, unpaidEntrants } = getPaymentBarSegments(paidEntrants, totalEntrants)

  if (totalEntrants <= 0) return null

  return (
    <div className={compact ? 'space-y-1.5' : 'space-y-2'}>
      <div
        className={`rounded-full overflow-hidden bg-gray-200/80 flex ${compact ? 'h-2' : 'h-2.5'}`}
        role="img"
        aria-label={`${paidEntrants} of ${totalEntrants} entrants have paid`}
      >
        {paidPct > 0 && (
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${paidPct}%` }}
            title={`${paidEntrants} paid`}
          />
        )}
        {unpaidPct > 0 && (
          <div
            className="h-full bg-amber-400 transition-all duration-500"
            style={{ width: `${unpaidPct}%` }}
            title={`${unpaidEntrants} awaiting payment`}
          />
        )}
      </div>
      <div className={`flex flex-wrap items-center gap-x-3 gap-y-0.5 ${compact ? 'text-[10px]' : 'text-[11px]'} text-gray-500`}>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 shrink-0" aria-hidden />
          <span>
            <span className="font-semibold text-emerald-700 tabular-nums">{paidEntrants}</span> paid
          </span>
        </span>
        {unpaidEntrants > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-400 shrink-0" aria-hidden />
            <span>
              <span className="font-semibold text-amber-700 tabular-nums">{unpaidEntrants}</span> yet to pay
            </span>
          </span>
        )}
        <span className="text-gray-400">
          <span className="font-semibold text-brand-navy tabular-nums">{totalEntrants}</span> signed up
        </span>
      </div>
    </div>
  )
}
