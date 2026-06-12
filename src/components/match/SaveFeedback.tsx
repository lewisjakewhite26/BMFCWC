import Lottie from 'lottie-react'
import saveCheckAnimation from '../../assets/lottie/save-check.json'

export type SavePhase = 'idle' | 'loading' | 'success' | 'error'

/** Matches slowed Lottie duration (~2.2s) plus a brief hold */
export const SAVE_SUCCESS_MS = 2400

function SaveCheckLottie() {
  return (
    <Lottie
      key="save-check"
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
  if (phase === 'idle' || phase === 'loading') return null

  if (phase === 'error') {
    return (
      <span className="text-[10px] sm:text-xs font-medium text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-pill whitespace-nowrap">
        Save failed
      </span>
    )
  }

  return (
    <span
      className="inline-flex items-center justify-center w-7 h-7 shrink-0"
      aria-live="polite"
      aria-label="Prediction saved"
    >
      <SaveCheckLottie />
    </span>
  )
}
