import { useMemo } from 'react'
import type { RecapTier } from '../../types'
import { tierEmoji } from '../../lib/recapTier'

const PARTICLE_COUNTS: Record<RecapTier, number> = {
  spotOn: 36,
  great: 24,
  solid: 14,
  poor: 16,
  nightmare: 28,
}

interface RecapParticleEffectsProps {
  tier: RecapTier
  active: boolean
}

export function RecapParticleEffects({ tier, active }: RecapParticleEffectsProps) {
  const particles = useMemo(() => {
    if (!active) return []

    const emoji = tierEmoji(tier)
    const count = PARTICLE_COUNTS[tier]

    return Array.from({ length: count }, (_, i) => ({
      id: i,
      emoji,
      left: `${(i * 17 + 7) % 100}%`,
      delay: `${(i * 0.13) % 2.5}s`,
      duration: `${2.2 + (i % 5) * 0.35}s`,
      size: tier === 'spotOn' ? '1.35rem' : tier === 'nightmare' ? '1.25rem' : '1.1rem',
    }))
  }, [tier, active])

  if (!active || particles.length === 0) return null

  return (
    <div className="recap-particles pointer-events-none" aria-hidden>
      {particles.map((p) => (
        <span
          key={p.id}
          className="recap-particle"
          style={{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
            fontSize: p.size,
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  )
}
