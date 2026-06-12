import { AnimatePresence, motion } from 'framer-motion'

export type SavePhase = 'idle' | 'loading' | 'success' | 'error'

export function BouncingDots({ className = 'bg-brand-blue' }: { className?: string }) {
  return (
    <span className="inline-flex items-end justify-center gap-1 h-5" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${className}`}
          animate={{ y: [0, -5, 0] }}
          transition={{
            duration: 0.55,
            repeat: Infinity,
            delay: i * 0.14,
            ease: 'easeInOut',
          }}
        />
      ))}
    </span>
  )
}

export function SuccessTick({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const box = size === 'sm' ? 'w-5 h-5' : 'w-6 h-6'
  const icon = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'

  return (
    <motion.span
      className={`inline-flex items-center justify-center ${box} rounded-full bg-emerald-500 shadow-sm`}
      initial={{ scale: 0, rotate: -45 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 18 }}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className={`${icon} text-white`} fill="none" stroke="currentColor" strokeWidth={3}>
        <motion.path
          d="M5 13l4 4L19 7"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.08, ease: 'easeOut' }}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </motion.span>
  )
}

interface SaveStatusBadgeProps {
  phase: SavePhase
}

export function SaveStatusBadge({ phase }: SaveStatusBadgeProps) {
  if (phase === 'idle') return null

  return (
    <AnimatePresence mode="wait" initial={false}>
      {phase === 'loading' && (
        <motion.span
          key="loading"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85 }}
          className="inline-flex items-center justify-center min-w-[2.75rem] h-7 px-2.5 rounded-pill bg-brand-blue/10 border border-brand-blue/20"
          aria-busy="true"
          aria-label="Saving prediction"
        >
          <BouncingDots />
        </motion.span>
      )}
      {phase === 'success' && (
        <motion.span
          key="success"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          aria-label="Prediction saved"
        >
          <SuccessTick size="sm" />
        </motion.span>
      )}
      {phase === 'error' && (
        <motion.span
          key="error"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="text-[10px] sm:text-xs font-medium text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-pill whitespace-nowrap"
        >
          Save failed
        </motion.span>
      )}
    </AnimatePresence>
  )
}

export const SAVE_SUCCESS_MS = 750
