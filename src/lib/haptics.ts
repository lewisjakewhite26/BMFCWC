export type HapticId =
  | 'saveSuccess'
  | 'celebrate'
  | 'recapSolid'
  | 'recapGreat'
  | 'recapPoor'
  | 'recapLegendary'

export interface HapticFeedbackOption {
  id: HapticId
  label: string
  description: string
  when: string
}

const STORAGE_KEY = 'bmfc_haptics_enabled'
export const HAPTICS_CHANGE_EVENT = 'bmfc-haptics-change'

const PATTERNS: Record<HapticId, number | number[]> = {
  /** Crisp double-tick when a prediction auto-saves */
  saveSuccess: [8, 48, 14, 36, 20],
  /** Gentle double pulse when every fixture on the matchday is picked */
  celebrate: [12, 40, 16, 44, 22],
  /** Matchday recap — solid performance */
  recapSolid: [14, 32, 18, 36, 24],
  /** Matchday recap — great performance */
  recapGreat: [16, 28, 22, 32, 28, 36, 32],
  /** Matchday recap — poor / rough performance */
  recapPoor: [80, 36, 80, 36, 100],
  /** Matchday recap — legendary finale */
  recapLegendary: [10, 22, 16, 22, 28, 22, 38, 28, 48, 36, 64],
}

/** All haptic patterns used in the app — shown on Profile */
export const HAPTIC_FEEDBACK_OPTIONS: HapticFeedbackOption[] = [
  {
    id: 'saveSuccess',
    label: 'Prediction saved',
    description: 'Short double-tick confirmation',
    when: 'Each time a score auto-saves',
  },
  {
    id: 'celebrate',
    label: 'Matchday complete',
    description: 'Soft double pulse',
    when: 'All fixtures on the open matchday are picked',
  },
  {
    id: 'recapSolid',
    label: 'Recap — solid',
    description: 'Steady triple pulse',
    when: 'Matchday recap for a decent return',
  },
  {
    id: 'recapGreat',
    label: 'Recap — great',
    description: 'Rising rhythm',
    when: 'Matchday recap for a strong return',
  },
  {
    id: 'recapPoor',
    label: 'Recap — rough',
    description: 'Long buzzes',
    when: 'Matchday recap for a poor return',
  },
  {
    id: 'recapLegendary',
    label: 'Recap — legendary',
    description: 'Celebratory burst',
    when: 'Matchday recap for a top-tier return',
  },
]

export function isHapticsEnabled(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === null) return true
    return stored === 'true'
  } catch {
    return true
  }
}

export function setHapticsEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(enabled))
    window.dispatchEvent(new CustomEvent(HAPTICS_CHANGE_EVENT, { detail: enabled }))
  } catch {
    // ignore storage errors
  }
}

export function canUseHaptics(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator
}

export function triggerHaptic(id: HapticId, { force = false } = {}): void {
  if (!force && !isHapticsEnabled()) return
  if (!canUseHaptics()) return
  navigator.vibrate(PATTERNS[id])
}

export function previewHaptic(id: HapticId): void {
  triggerHaptic(id, { force: true })
}

export function hapticSaveSuccess() {
  triggerHaptic('saveSuccess')
}

export function hapticCelebrate() {
  triggerHaptic('celebrate')
}

export function hapticRecapSolid() {
  triggerHaptic('recapSolid')
}

export function hapticRecapGreat() {
  triggerHaptic('recapGreat')
}

export function hapticRecapPoor() {
  triggerHaptic('recapPoor')
}

export function hapticRecapLegendary() {
  triggerHaptic('recapLegendary')
}

/** @deprecated Use hapticSaveSuccess */
export function hapticTap() {
  hapticSaveSuccess()
}
