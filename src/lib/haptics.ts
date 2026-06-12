export type HapticId =
  | 'saveSuccess'
  | 'matchdayLocked'
  | 'recapSpotOn'
  | 'recapGreat'
  | 'recapSolid'
  | 'recapPoor'
  | 'recapNightmare'

export interface HapticFeedbackOption {
  id: HapticId
  label: string
  description: string
  when: string
}

const STORAGE_KEY = 'bmfc_haptics_enabled'
export const HAPTICS_CHANGE_EVENT = 'bmfc-haptics-change'

const PATTERNS: Record<HapticId, number | number[]> = {
  saveSuccess: [60],
  matchdayLocked: [100, 80, 100, 50, 100, 80, 100, 50, 400],
  recapSpotOn: [40, 30, 40, 30, 40, 30, 40, 30, 200],
  recapGreat: [80, 60, 80, 60, 250],
  recapSolid: [120, 100, 120],
  recapPoor: [300],
  recapNightmare: [600],
}

export const HAPTIC_FEEDBACK_OPTIONS: HapticFeedbackOption[] = [
  {
    id: 'saveSuccess',
    label: 'Prediction saved',
    description: 'Single crisp tap',
    when: 'Each time a score auto-saves',
  },
  {
    id: 'matchdayLocked',
    label: 'Matchday locked',
    description: "Football's Coming Home hook",
    when: 'All fixtures on the open matchday are picked',
  },
  {
    id: 'recapSpotOn',
    label: 'Recap: Spot on 🥇',
    description: 'Rapid flutter then punch',
    when: 'Matchday recap when you finish 1st',
  },
  {
    id: 'recapGreat',
    label: 'Recap: Great ⭐',
    description: 'Quick-quick-long',
    when: 'Matchday recap in the top 25%',
  },
  {
    id: 'recapSolid',
    label: 'Recap: Solid 🎯',
    description: 'Two medium taps',
    when: 'Matchday recap in the top 55%',
  },
  {
    id: 'recapPoor',
    label: 'Recap: Poor 😬',
    description: 'Slow deflating buzz',
    when: 'Matchday recap in the bottom 45%',
  },
  {
    id: 'recapNightmare',
    label: 'Recap: Nightmare 💩',
    description: 'Single long flat drone',
    when: 'Matchday recap in the bottom 20%',
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

export function hapticMatchdayLocked() {
  triggerHaptic('matchdayLocked')
}

export function hapticRecapSpotOn() {
  triggerHaptic('recapSpotOn')
}

export function hapticRecapGreat() {
  triggerHaptic('recapGreat')
}

export function hapticRecapSolid() {
  triggerHaptic('recapSolid')
}

export function hapticRecapPoor() {
  triggerHaptic('recapPoor')
}

export function hapticRecapNightmare() {
  triggerHaptic('recapNightmare')
}

export function triggerRecapTierHaptic(tier: import('../types').RecapTier): void {
  switch (tier) {
    case 'spotOn':
      hapticRecapSpotOn()
      break
    case 'great':
      hapticRecapGreat()
      break
    case 'solid':
      hapticRecapSolid()
      break
    case 'poor':
      hapticRecapPoor()
      break
    case 'nightmare':
      hapticRecapNightmare()
      break
  }
}
