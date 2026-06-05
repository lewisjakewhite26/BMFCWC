export const ENTRY_FEE_GBP = 10
export const PRIZE_POT_SHARE = 0.75

export function calculatePrizePotGbp(paidEntrants: number): number {
  return paidEntrants * ENTRY_FEE_GBP * PRIZE_POT_SHARE
}

export function calculateTotalCollectedGbp(paidEntrants: number): number {
  return paidEntrants * ENTRY_FEE_GBP
}

export function getPaymentBarSegments(paidEntrants: number, totalEntrants: number) {
  if (totalEntrants <= 0) {
    return { paidPct: 0, unpaidPct: 0, unpaidEntrants: 0 }
  }

  const unpaidEntrants = Math.max(totalEntrants - paidEntrants, 0)
  const paidPct = (paidEntrants / totalEntrants) * 100
  const unpaidPct = (unpaidEntrants / totalEntrants) * 100

  return { paidPct, unpaidPct, unpaidEntrants }
}

export function formatPrizePotGbp(amount: number): string {
  const hasPence = Math.round(amount * 100) % 100 !== 0
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: hasPence ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount)
}
