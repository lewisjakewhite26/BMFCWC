import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

type SubmitPhase = 'idle' | 'loading' | 'success' | 'error'

interface SubmitPredictionButtonProps {
  onSubmit: () => Promise<void>
  onComplete?: () => void
  disabled?: boolean
}

function BouncingDots({ className = 'bg-white' }: { className?: string }) {
  return (
    <span className="inline-flex items-end justify-center gap-1 h-6" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${className}`}
          animate={{ y: [0, -6, 0] }}
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

function SuccessTick() {
  return (
    <motion.span
      className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/20"
      initial={{ scale: 0, rotate: -45 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 18 }}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={3}>
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

const SUCCESS_HOLD_MS = 750

export function SubmitPredictionButton({ onSubmit, onComplete, disabled }: SubmitPredictionButtonProps) {
  const [phase, setPhase] = useState<SubmitPhase>('idle')

  const handleClick = async () => {
    if (phase === 'loading' || disabled) return

    setPhase('loading')
    try {
      await onSubmit()
      setPhase('success')
      window.setTimeout(() => {
        onComplete?.()
        setPhase('idle')
      }, SUCCESS_HOLD_MS)
    } catch {
      setPhase('error')
      window.setTimeout(() => setPhase('idle'), 2200)
    }
  }

  const isLoading = phase === 'loading'
  const isSuccess = phase === 'success'
  const isError = phase === 'error'

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isLoading || isSuccess}
      aria-busy={isLoading}
      aria-live="polite"
      className={`
        mt-4 w-full min-h-[48px] rounded-pill font-semibold text-white
        shadow-[0_4px_16px_rgba(43,95,192,0.25)] active:scale-[0.98]
        transition-[background-color,box-shadow,transform] duration-300 touch-manipulation
        disabled:active:scale-100 flex items-center justify-center
        ${isSuccess
          ? 'bg-emerald-500 shadow-[0_4px_16px_rgba(16,185,129,0.35)]'
          : isError
            ? 'bg-red-500 shadow-[0_4px_16px_rgba(239,68,68,0.25)]'
            : 'bg-brand-blue disabled:opacity-60'
        }
      `}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isLoading && (
          <motion.span
            key="loading"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.2 }}
          >
            <BouncingDots />
          </motion.span>
        )}
        {isSuccess && (
          <motion.span
            key="success"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          >
            <SuccessTick />
          </motion.span>
        )}
        {isError && (
          <motion.span
            key="error"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-sm"
          >
            Couldn&apos;t save — tap to retry
          </motion.span>
        )}
        {phase === 'idle' && (
          <motion.span
            key="idle"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            Submit prediction
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}
