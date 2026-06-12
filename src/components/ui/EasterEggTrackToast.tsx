import { AnimatePresence, motion } from 'framer-motion'

export interface EasterEggTrack {
  title: string
  artist: string
}

interface EasterEggTrackToastProps {
  track: EasterEggTrack | null
}

function EqualizerBars() {
  return (
    <div className="flex items-end gap-0.5 h-4 shrink-0" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="easter-egg-eq-bar w-1 rounded-full bg-brand-gold"
          style={{ animationDelay: `${i * 0.12}s` }}
        />
      ))}
    </div>
  )
}

export function EasterEggTrackToast({ track }: EasterEggTrackToastProps) {
  return (
    <AnimatePresence mode="wait">
      {track && (
        <motion.div
          key={`${track.title}-${track.artist}`}
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: -20, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.97 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="fixed top-[calc(env(safe-area-inset-top)+3.5rem)] inset-x-0 z-[300] flex justify-center px-4 pointer-events-none"
        >
          <div className="flex items-center gap-3 w-full max-w-md rounded-2xl border border-brand-gold/30 bg-brand-navy/92 backdrop-blur-md px-4 py-3 shadow-[0_12px_40px_rgba(13,27,75,0.35)]">
            <EqualizerBars />
            <div className="min-w-0 flex-1 text-left">
              <p className="text-[10px] uppercase tracking-[0.2em] text-brand-gold font-semibold mb-0.5">
                Now playing
              </p>
              <p className="font-display text-base sm:text-lg text-brand-navy font-semibold leading-tight truncate">
                {track.title}
              </p>
              <p className="text-xs text-gray-700 truncate mt-0.5">{track.artist}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
