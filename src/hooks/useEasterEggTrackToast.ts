import { useCallback, useEffect, useRef, useState } from 'react'
import type { EasterEggTrack } from '../components/ui/EasterEggTrackToast'
import {
  cancelHaptic,
  canUseHaptics,
  EASTER_EGG_TRACKS,
  hapticRandomEasterEgg,
  type EasterEggHapticId,
} from '../lib/haptics'

const TOAST_MS = 4200
const LISTENER_OPTS: AddEventListenerOptions = { passive: true, capture: true }

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

  const stop = useCallback(() => {
    cancelHaptic()
    dismiss()
  }, [dismiss])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    }
  }, [])

  useEffect(() => {
    if (!track) return

    let armed = false
    const armId = window.setTimeout(() => {
      armed = true
    }, 80)

    const onStop = () => {
      if (!armed) return
      stop()
    }

    window.addEventListener('touchstart', onStop, LISTENER_OPTS)
    window.addEventListener('touchmove', onStop, LISTENER_OPTS)
    window.addEventListener('pointerdown', onStop, LISTENER_OPTS)
    window.addEventListener('scroll', onStop, LISTENER_OPTS)
    window.addEventListener('wheel', onStop, LISTENER_OPTS)

    return () => {
      window.clearTimeout(armId)
      window.removeEventListener('touchstart', onStop, LISTENER_OPTS)
      window.removeEventListener('touchmove', onStop, LISTENER_OPTS)
      window.removeEventListener('pointerdown', onStop, LISTENER_OPTS)
      window.removeEventListener('scroll', onStop, LISTENER_OPTS)
      window.removeEventListener('wheel', onStop, LISTENER_OPTS)
    }
  }, [track, stop])

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
