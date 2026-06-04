import { useMemo } from 'react'
import type { RecapTier } from '../../types'

const POSITIVE_PARTICLES: Record<RecapTier, string[]> = {
  legendary: ['🎉', '🏆', '⚽', '✨', '🥇', '💫'],
  great: ['🎉', '⚽', '✨', '👏'],
  solid: ['⚽', '✨', '👍'],
  poor: [],
  rough: [],
}

const NEGATIVE_PARTICLES = ['👎', '😬', '💀', '👎', '📉']

interface RecapParticleEffectsProps {
  tier: RecapTier
  active: boolean
}

export function RecapParticleEffects({ tier, active }: RecapParticleEffectsProps) {
  const particles = useMemo(() => {
    if (!active) return []

    const emojis =
      tier === 'rough' || tier === 'poor'
        ? NEGATIVE_PARTICLES
        : POSITIVE_PARTICLES[tier]

    const count = tier === 'legendary' ? 36 : tier === 'great' ? 24 : tier === 'solid' ? 14 : tier === 'poor' ? 16 : 28

    return Array.from({ length: count }, (_, i) => ({
      id: i,
      emoji: emojis[i % emojis.length],
      left: `${(i * 17 + 7) % 100}%`,
      delay: `${(i * 0.13) % 2.5}s`,
      duration: `${2.2 + (i % 5) * 0.35}s`,
      size: tier === 'legendary' ? '1.35rem' : tier === 'rough' ? '1.25rem' : '1.1rem',
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
