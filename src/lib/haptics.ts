export type HapticId =
  | 'saveSuccess'
  | 'matchdayLocked'
  | 'vindaloo'
  | 'worldInMotion'
  | 'tomHark'
  | 'threeLions'
  | 'freedFromDesire'
  | 'heyJude'
  | 'liquidator'
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
  // Vindaloo — Fat Les
  vindaloo: [190, 170, 130, 90, 840, 610, 210, 180, 120, 110, 810, 630, 190, 190, 100, 110, 420, 200, 180, 190, 120, 100, 440, 190, 430, 210, 980],
  // World in Motion — New Order / ENGLANDneworder
  worldInMotion: [120, 150, 130, 190, 130, 170, 450, 160, 150, 160, 380, 240, 140, 150, 150, 120, 130, 180, 140, 110, 130, 120, 100, 170, 360, 270, 140, 150, 140, 120, 120, 160, 420, 150, 120, 210, 380, 250, 150, 150, 140, 140, 120, 180, 130, 130, 140, 110, 120, 210, 360, 320, 150, 130, 140, 130, 90, 170, 230, 80, 140, 160, 130, 130, 110, 120, 290, 490, 170, 120, 150, 130, 150, 120, 130, 140, 280, 310, 130, 150, 140, 130, 110, 170, 230, 80, 140, 100, 120, 180, 250, 100, 210, 500, 150, 140, 420, 140, 160, 160, 200],
  // Tom Hark — The Piranhas
  tomHark: [110, 80, 340, 140, 140, 150, 310, 640, 110, 60, 380, 130, 130, 150, 290, 590, 100, 50, 160, 190, 110, 50, 130, 190, 260, 580, 100, 90, 410, 90, 120, 190, 400],
  // Three Lions — "Three Lions on a shirt" (Baddiel, Skinner & Lightning Seeds)
  threeLions: [360, 230, 390, 250, 520, 140, 120, 280, 660, 980, 420, 220, 140, 170, 530, 220, 140, 170, 380, 180, 470],
  // Freed from Desire — Gala
  freedFromDesire: [230, 230, 230, 230, 150, 190, 630, 390, 150, 80, 150, 130, 140, 140, 120, 150, 90, 70, 180, 170, 280, 310, 260, 160, 160, 180, 130, 160, 380, 80, 130],
  // Hey Jude — The Beatles
  heyJude: [540, 550, 400, 190, 430, 280, 110, 120, 100, 90, 130, 310, 1070, 810, 130, 110, 100, 120, 120, 330, 880, 400, 860, 210, 740],
  // Liquidator — Harry J Allstars
  liquidator: [110, 140, 130, 170, 100, 150, 90, 190, 150, 90, 120, 180, 100, 180, 70, 190, 140, 170, 80, 160, 100, 180, 90, 160, 150, 160, 100, 200, 80, 160, 70, 190, 130, 360, 120, 380, 120, 340, 120, 830, 240, 220, 280],
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

export function cancelHaptic(): void {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return
  navigator.vibrate(0)
  navigator.vibrate([])
}

let easterEggCancelHandler: (() => void) | null = null
let easterEggCleanup: (() => void)[] = []

export function registerEasterEggCancelHandler(handler: (() => void) | null): void {
  easterEggCancelHandler = handler
}

function disarmEasterEggCancel(): void {
  for (const cleanup of easterEggCleanup) cleanup()
  easterEggCleanup = []
}

function cancelEasterEggPlayback(): void {
  cancelHaptic()
  disarmEasterEggCancel()
  easterEggCancelHandler?.()
}

function armEasterEggCancel(): void {
  disarmEasterEggCancel()
  const armedAt = performance.now()
  const GRACE_MS = 150

  const tryCancel = () => {
    if (performance.now() - armedAt < GRACE_MS) return
    cancelEasterEggPlayback()
  }

  const opts: AddEventListenerOptions = { capture: true, passive: true }
  const events = ['touchstart', 'touchmove', 'pointerdown', 'pointermove', 'scroll', 'wheel'] as const

  for (const target of [document, window]) {
    for (const event of events) {
      target.addEventListener(event, tryCancel, opts)
      easterEggCleanup.push(() => target.removeEventListener(event, tryCancel, opts))
    }
  }

  if (window.visualViewport) {
    window.visualViewport.addEventListener('scroll', tryCancel, opts)
    easterEggCleanup.push(() => window.visualViewport?.removeEventListener('scroll', tryCancel, opts))
  }

  let lastX = window.scrollX
  let lastY = window.scrollY
  const scrollPoll = window.setInterval(() => {
    const x = window.scrollX
    const y = window.scrollY
    if (Math.abs(x - lastX) > 2 || Math.abs(y - lastY) > 2) {
      tryCancel()
    }
    lastX = x
    lastY = y
  }, 48)
  easterEggCleanup.push(() => window.clearInterval(scrollPoll))

  const maxDuration = window.setTimeout(disarmEasterEggCancel, 16_000)
  easterEggCleanup.push(() => window.clearTimeout(maxDuration))
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

export type EasterEggHapticId =
  | 'vindaloo'
  | 'worldInMotion'
  | 'tomHark'
  | 'threeLions'
  | 'freedFromDesire'
  | 'heyJude'
  | 'liquidator'

const EASTER_EGG_IDS: EasterEggHapticId[] = [
  'vindaloo',
  'worldInMotion',
  'tomHark',
  'threeLions',
  'freedFromDesire',
  'heyJude',
  'liquidator',
]

export const EASTER_EGG_TRACKS: Record<EasterEggHapticId, { title: string; artist: string }> = {
  vindaloo: { title: 'Vindaloo', artist: 'Fat Les' },
  worldInMotion: { title: 'World in Motion', artist: 'New Order' },
  tomHark: { title: 'Tom Hark', artist: 'The Piranhas' },
  threeLions: { title: 'Three Lions', artist: 'Baddiel, Skinner & Lightning Seeds' },
  freedFromDesire: { title: 'Freed from Desire', artist: 'Gala' },
  heyJude: { title: 'Hey Jude', artist: 'The Beatles' },
  liquidator: { title: 'Liquidator', artist: 'Harry J Allstars' },
}

export function playRandomEasterEgg(): EasterEggHapticId {
  const id = EASTER_EGG_IDS[Math.floor(Math.random() * EASTER_EGG_IDS.length)]
  if (!canUseHaptics()) return id

  cancelHaptic()
  armEasterEggCancel()
  navigator.vibrate(PATTERNS[id])
  return id
}

export function hapticRandomEasterEgg(): EasterEggHapticId {
  return playRandomEasterEgg()
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
