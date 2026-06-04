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

/** Matchday recap — legendary / great performance */
export function hapticRecapGreat() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate([18, 32, 24, 32, 36, 40, 28])
  }
}

/** Matchday recap — solid performance */
export function hapticRecapSolid() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate([16, 28, 20])
  }
}

/** Matchday recap — poor / rough performance */
export function hapticRecapPoor() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate([90, 40, 90, 40, 120])
  }
}

/** Matchday recap — legendary finale burst */
export function hapticRecapLegendary() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate([12, 24, 18, 24, 30, 24, 40, 30, 50, 40, 60])
  }
}
