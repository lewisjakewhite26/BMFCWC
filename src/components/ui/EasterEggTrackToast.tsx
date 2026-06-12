import { AnimatePresence, motion } from 'framer-motion'

export interface EasterEggTrack {
  title: string
  artist: string
}

interface EasterEggTrackToastProps {
  track: EasterEggTrack | null
}

export function EasterEggTrackToast({ track }: EasterEggTrackToastProps) {
  return (
    <AnimatePresence>
      {track && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: -12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="fixed top-[calc(env(safe-area-inset-top)+4.25rem)] left-1/2 -translate-x-1/2 z-[300] pointer-events-none"
        >
          <div className="glass-card px-4 py-2.5 border border-brand-gold/25 shadow-glass-hover max-w-[min(90vw,20rem)]">
            <p className="text-[10px] uppercase tracking-widest text-brand-gold font-semibold mb-0.5">
              Now playing
            </p>
            <p className="text-sm font-medium text-brand-navy leading-snug">
              {track.title}
              <span className="text-gray-500 font-normal"> · {track.artist}</span>
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
