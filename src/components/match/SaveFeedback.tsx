import { AnimatePresence, motion } from 'framer-motion'
import Lottie from 'lottie-react'
import saveCheckAnimation from '../../assets/lottie/save-check.json'

export type SavePhase = 'idle' | 'loading' | 'success' | 'error'

export const SAVE_SUCCESS_MS = 1500

function SaveSpinner() {
  return (
    <span
      className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-brand-blue/[0.06] border border-brand-blue/15"
      aria-hidden
    >
      <span className="w-4 h-4 rounded-full border-2 border-brand-blue/15 border-t-brand-blue animate-spin" />
    </span>
  )
}

function SaveCheckLottie() {
  return (
    <Lottie
      animationData={saveCheckAnimation}
      loop={false}
      autoplay
      className="w-7 h-7"
      aria-hidden
    />
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
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="inline-flex items-center justify-center"
          aria-busy="true"
          aria-label="Saving prediction"
        >
          <SaveSpinner />
        </motion.span>
      )}
      {phase === 'success' && (
        <motion.span
          key="success"
          initial={{ opacity: 0, scale: 0.75 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 380, damping: 24 }}
          className="inline-flex items-center justify-center"
          aria-label="Prediction saved"
        >
          <SaveCheckLottie />
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
