import { useEffect } from 'react'
import { motion } from 'framer-motion'
import type { MatchdayRecap, RecapTier } from '../../types'
import { ordinal, tierEmoji, tierHeadline } from '../../lib/recapTier'
import { triggerRecapTierHaptic } from '../../lib/haptics'
import { RecapParticleEffects } from './RecapParticleEffects'

const TIER_MODAL_CLASS: Record<RecapTier, string> = {
  spotOn: 'recap-modal-spotOn',
  great: 'recap-modal-great',
  solid: 'recap-modal-solid',
  poor: 'recap-modal-poor',
  nightmare: 'recap-modal-nightmare',
}

interface MatchdayRecapModalProps {
  recap: MatchdayRecap
  tier: RecapTier
  queuePosition?: number
  queueTotal?: number
  onDismiss: () => void
}

export function MatchdayRecapModal({
  recap,
  tier,
  queuePosition,
  queueTotal,
  onDismiss,
}: MatchdayRecapModalProps) {
  useEffect(() => {
    triggerRecapTierHaptic(tier)
  }, [tier, recap.game_day])

  const label = recap.label.replace(/Game Day/gi, 'Matchday')
  const emoji = tierEmoji(tier)

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      <button
        type="button"
        className={`absolute inset-0 recap-backdrop ${TIER_MODAL_CLASS[tier]}`}
        aria-label="Close recap"
        onClick={onDismiss}
      />

      <RecapParticleEffects tier={tier} active />

      <motion.div
        role="dialog"
        aria-modal
        aria-labelledby="recap-title"
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        className={`relative w-full max-w-md glass-card p-6 sm:p-8 border shadow-glass-hover recap-modal-card ${TIER_MODAL_CLASS[tier]}`}
      >
        {queueTotal && queueTotal > 1 && (
          <p className="text-[11px] uppercase tracking-wider text-gray-400 text-center mb-3">
            Round {queuePosition} of {queueTotal}
          </p>
        )}

        <p className="text-center text-xs uppercase tracking-widest text-gray-500 mb-1">
          {label}
        </p>
        <h2 id="recap-title" className="font-display text-2xl sm:text-3xl text-brand-navy text-center mb-1">
          <span className="mr-2" aria-hidden>{emoji}</span>
          {tierHeadline(tier)}
        </h2>
        <p className="text-center text-gray-500 text-sm mb-6">Your results are in</p>

        <div className="text-center mb-6">
          <p className="text-5xl sm:text-6xl font-display font-bold text-brand-navy tabular-nums">
            +{recap.matchday_points}
          </p>
          <p className="text-sm text-gray-500 mt-1">points this round</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="admin-inner-card p-3 text-center">
            <p className="text-2xl font-mono font-bold text-brand-gold">{recap.correct_scores}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Exact scores</p>
          </div>
          <div className="admin-inner-card p-3 text-center">
            <p className="text-2xl font-mono font-bold text-brand-blue">{recap.correct_results}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Correct results</p>
          </div>
        </div>

        <div className="space-y-3 mb-8">
          <div className="flex items-center justify-between px-1 py-2 border-b border-brand-blue/10">
            <span className="text-sm text-gray-600">This matchday</span>
            <span className="text-sm font-semibold text-brand-navy">
              {ordinal(recap.matchday_rank)} of {recap.matchday_total_players}
            </span>
          </div>
          <div className="flex items-center justify-between px-1 py-2 border-b border-brand-blue/10">
            <span className="text-sm text-gray-600">Overall table</span>
            <span className="text-sm font-semibold text-brand-navy">
              {ordinal(recap.overall_rank)} · {recap.total_points} pts
            </span>
          </div>
        </div>

        <button type="button" onClick={onDismiss} className="btn-primary w-full">
          Continue
        </button>
      </motion.div>
    </div>
  )
}
