import { useCallback, useEffect, useRef, useState } from 'react'
import type { EasterEggTrack } from '../components/ui/EasterEggTrackToast'
import {
  canUseHaptics,
  EASTER_EGG_TRACKS,
  hapticRandomEasterEgg,
  type EasterEggHapticId,
} from '../lib/haptics'

const TOAST_MS = 4200

export function useEasterEggTrackToast() {
  const [track, setTrack] = useState<EasterEggTrack | null>(null)
  const timeoutRef = useRef<number>()

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    }
  }, [])

  const trigger = useCallback((): EasterEggHapticId | null => {
    if (!canUseHaptics()) return null

    const id = hapticRandomEasterEgg()
    setTrack(EASTER_EGG_TRACKS[id])
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    timeoutRef.current = window.setTimeout(() => setTrack(null), TOAST_MS)
    return id
  }, [])

  return { track, trigger, hapticsSupported: canUseHaptics() }
}
