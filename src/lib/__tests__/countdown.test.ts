import { describe, it, expect } from 'vitest'
import { formatCountdownClock, getCountdownUrgency } from '../countdown'

describe('countdown', () => {
  it('escalates urgency as time runs down', () => {
    expect(getCountdownUrgency(7 * 60 * 60 * 1000)).toBe('normal')
    expect(getCountdownUrgency(5 * 60 * 60 * 1000)).toBe('warning')
    expect(getCountdownUrgency(90 * 60 * 1000)).toBe('critical')
  })

  it('formats a live countdown clock', () => {
    expect(formatCountdownClock(90 * 60 * 1000 + 15 * 1000)).toBe('1:30:15')
    expect(formatCountdownClock(45 * 1000)).toBe('0:45')
  })
})
