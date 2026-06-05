import { ENTRY_FEE_GBP, PRIZE_POT_SHARE, formatPrizePotGbp } from '../../lib/prizePot'
import type { PrizePotStats } from '../../hooks/usePrizePot'
import { PrizePotPaymentBar } from './PrizePotPaymentBar'

interface PrizePotBannerProps {
  stats: PrizePotStats | null
  loading?: boolean
  variant?: 'hero' | 'card' | 'inline'
}

export function PrizePotBanner({ stats, loading = false, variant = 'card' }: PrizePotBannerProps) {
  if (loading) {
    if (variant === 'inline') return null
    return (
      <div
        className={`animate-pulse rounded-2xl bg-brand-gold/10 border border-brand-gold/20 ${
          variant === 'hero' ? 'h-28 w-full max-w-md mx-auto' : 'h-24'
        }`}
        aria-hidden
      />
    )
  }

  if (!stats) return null

  const potLabel = formatPrizePotGbp(stats.prizePotGbp)
  const potentialLabel = formatPrizePotGbp(stats.potentialPrizePotGbp)
  const sharePct = Math.round(PRIZE_POT_SHARE * 100)
  const hasUnpaid = stats.unpaidEntrants > 0

  if (variant === 'hero') {
    return (
      <div className="rounded-2xl border border-brand-gold/30 bg-brand-gold/10 px-5 py-4 text-center max-w-md mx-auto w-full">
        <p className="text-[11px] uppercase tracking-widest font-semibold text-brand-gold mb-1">
          Prize pot
        </p>
        <p className="font-display text-3xl sm:text-4xl text-brand-navy tabular-nums">{potLabel}</p>
        {hasUnpaid && (
          <p className="text-xs text-gray-500 mt-1">
            Up to <span className="font-semibold text-brand-navy tabular-nums">{potentialLabel}</span> if everyone pays
          </p>
        )}
        <p className="text-xs text-gray-500 mt-1.5 mb-3">
          {sharePct}% of £{ENTRY_FEE_GBP} entry fees
        </p>
        <PrizePotPaymentBar
          paidEntrants={stats.paidEntrants}
          totalEntrants={stats.totalEntrants}
        />
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <div className="rounded-xl border border-brand-gold/20 bg-brand-gold/5 px-4 py-3 space-y-2">
        <p className="text-sm text-gray-600 text-center">
          Prize pot:{' '}
          <span className="font-bold text-brand-gold tabular-nums">{potLabel}</span>
          {hasUnpaid && (
            <span className="text-gray-400">
              {' '}
              / {potentialLabel} potential
            </span>
          )}
        </p>
        <PrizePotPaymentBar
          paidEntrants={stats.paidEntrants}
          totalEntrants={stats.totalEntrants}
          compact
        />
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-brand-gold/25 bg-gradient-to-br from-brand-gold/15 to-brand-gold/5 px-4 sm:px-5 py-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-widest font-semibold text-brand-gold mb-0.5">
            Prize pot
          </p>
          <p className="text-xs text-gray-500">
            {sharePct}% of £{ENTRY_FEE_GBP} entry fees · {stats.totalEntrants} signed up
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-display text-2xl sm:text-3xl text-brand-navy tabular-nums leading-none">
            {potLabel}
          </p>
          {hasUnpaid && (
            <p className="text-[11px] text-gray-400 mt-1">
              Up to {potentialLabel}
            </p>
          )}
        </div>
      </div>
      <PrizePotPaymentBar
        paidEntrants={stats.paidEntrants}
        totalEntrants={stats.totalEntrants}
      />
    </div>
  )
}
