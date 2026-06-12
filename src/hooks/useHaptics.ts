import { useCallback, useEffect, useState } from 'react'
import {
  HAPTICS_CHANGE_EVENT,
  isHapticsEnabled,
  setHapticsEnabled,
  canUseHaptics,
} from '../lib/haptics'

export function useHaptics() {
  const [enabled, setEnabled] = useState(isHapticsEnabled)
  const [supported] = useState(canUseHaptics)

  useEffect(() => {
    const sync = () => setEnabled(isHapticsEnabled())

    window.addEventListener(HAPTICS_CHANGE_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(HAPTICS_CHANGE_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const setEnabledAndPersist = useCallback((next: boolean) => {
    setHapticsEnabled(next)
    setEnabled(next)
  }, [])

  return { enabled, supported, setEnabled: setEnabledAndPersist }
}
