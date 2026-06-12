import { useCallback, useEffect, useRef, useState } from 'react'
import type { EasterEggTrack } from '../components/ui/EasterEggTrackToast'
import {
  canUseHaptics,
  EASTER_EGG_TRACKS,
  getHapticPatternDuration,
  playRandomEasterEgg,
  registerEasterEggCancelHandler,
  type EasterEggHapticId,
} from '../lib/haptics'

export function useEasterEggTrackToast() {
  const [track, setTrack] = useState<EasterEggTrack | null>(null)
  const timeoutRef = useRef<number>()

  const dismiss = useCallback(() => {
    setTrack(null)
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = undefined
    }
  }, [])

  useEffect(() => {
    registerEasterEggCancelHandler(dismiss)
    return () => registerEasterEggCancelHandler(null)
  }, [dismiss])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    }
  }, [])

  const trigger = useCallback((): EasterEggHapticId | null => {
    if (!canUseHaptics()) return null

    const id = playRandomEasterEgg()
    const durationMs = getHapticPatternDuration(id)
    setTrack(EASTER_EGG_TRACKS[id])
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    timeoutRef.current = window.setTimeout(() => setTrack(null), durationMs)
    return id
  }, [])

  return { track, trigger }
}
