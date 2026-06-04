import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { hapticCelebrate } from '../../lib/haptics'

interface PicksProgressBarProps {
  lockedCount: number
  total: number
}

export function PicksProgressBar({ lockedCount, total }: PicksProgressBarProps) {
  const progressPct = total > 0 ? Math.round((lockedCount / total) * 100) : 0
  const allComplete = total > 0 && lockedCount === total
  const [celebrate, setCelebrate] = useState(false)
  const wasComplete = useRef(false)

  useEffect(() => {
    if (allComplete && !wasComplete.current) {
      wasComplete.current = true
      hapticCelebrate()
      setCelebrate(true)
      const timer = window.setTimeout(() => setCelebrate(false), 4500)
      return () => window.clearTimeout(timer)
    }
    if (!allComplete) {
      wasComplete.current = false
      setCelebrate(false)
    }
  }, [allComplete])

  return (
    <div className="space-y-2 px-1">
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>Submitted</span>
        <span className="font-mono font-medium text-brand-navy">
          {lockedCount}/{total}
        </span>
      </div>

      <div
        className={`relative h-2 rounded-full overflow-hidden transition-colors duration-700 ${
          allComplete ? 'bg-brand-gold/15' : 'bg-brand-blue/10'
        }`}
      >
        <motion.div
          className={`h-full rounded-full ${
            allComplete
              ? 'bg-gradient-to-r from-brand-blue via-brand-blue to-brand-gold'
              : 'bg-brand-blue'
          } ${celebrate ? 'picks-progress-shimmer' : ''}`}
          initial={false}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      <AnimatePresence>
        {celebrate && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -2 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="text-center text-xs sm:text-sm text-emerald-700/90 font-medium tracking-wide"
            role="status"
            aria-live="polite"
          >
            All predictions submitted for this matchday
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
