import { describe, it, expect } from 'vitest'
import {
  calculatePrizePotGbp,
  calculateTotalCollectedGbp,
  formatPrizePotGbp,
  getPaymentBarSegments,
  ENTRY_FEE_GBP,
  PRIZE_POT_SHARE,
} from '../prizePot'

describe('prizePot', () => {
  it('uses £10 entry fee and 75% prize share', () => {
    expect(ENTRY_FEE_GBP).toBe(10)
    expect(PRIZE_POT_SHARE).toBe(0.75)
  })

  it('calculates £750 pot for 100 paid entrants', () => {
    expect(calculateTotalCollectedGbp(100)).toBe(1000)
    expect(calculatePrizePotGbp(100)).toBe(750)
  })

  it('formats whole-pound amounts without decimals', () => {
    expect(formatPrizePotGbp(750)).toBe('£750')
  })

  it('formats fractional pots with pence', () => {
    expect(formatPrizePotGbp(7.5)).toBe('£7.50')
  })

  it('splits the payment bar between paid and unpaid entrants', () => {
    expect(getPaymentBarSegments(60, 100)).toEqual({
      paidPct: 60,
      unpaidPct: 40,
      unpaidEntrants: 40,
    })
  })
})
