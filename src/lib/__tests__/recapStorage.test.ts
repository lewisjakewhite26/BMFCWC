import { describe, it, expect, beforeEach } from 'vitest'
import { getDismissedRecaps, markRecapSeen } from '../recapStorage'

describe('recapStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts with no dismissed recaps', () => {
    expect(getDismissedRecaps()).toEqual([])
  })

  it('records a seen matchday once', () => {
    markRecapSeen(2)
    expect(getDismissedRecaps()).toEqual([2])
  })

  it('keeps dismissed matchdays sorted and deduplicated', () => {
    markRecapSeen(3)
    markRecapSeen(1)
    markRecapSeen(3)
    expect(getDismissedRecaps()).toEqual([1, 3])
  })

  it('ignores corrupt storage data', () => {
    localStorage.setItem('bmfc_recap_seen', '{not-json')
    expect(getDismissedRecaps()).toEqual([])

    localStorage.setItem('bmfc_recap_seen', JSON.stringify(['x', 2]))
    expect(getDismissedRecaps()).toEqual([2])
  })
})
