/** Light tap — single pick locked in */
export function hapticTap() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(12)
  }
}

/** Gentle double pulse — all picks complete */
export function hapticCelebrate() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate([14, 36, 18])
  }
}
