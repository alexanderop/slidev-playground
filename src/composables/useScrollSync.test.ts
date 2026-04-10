import { getScrollableHeight, getScrollProgress, getScrollTopForProgress } from './useScrollSync'

describe('useScrollSync helpers', () => {
  it('calculates scrollable height', () => {
    expect(getScrollableHeight({ clientHeight: 250, scrollHeight: 1000 })).toBe(750)
  })

  it('returns zero progress when the container cannot scroll', () => {
    expect(getScrollProgress({ clientHeight: 400, scrollHeight: 400 }, 80)).toBe(0)
  })

  it('maps scroll position to clamped progress', () => {
    const element = { clientHeight: 200, scrollHeight: 1000 }

    expect(getScrollProgress(element, 400)).toBe(0.5)
    expect(getScrollProgress(element, -50)).toBe(0)
    expect(getScrollProgress(element, 900)).toBe(1)
  })

  it('maps progress back to scroll position', () => {
    const element = { clientHeight: 250, scrollHeight: 1250 }

    expect(getScrollTopForProgress(element, 0.25)).toBe(250)
    expect(getScrollTopForProgress(element, -1)).toBe(0)
    expect(getScrollTopForProgress(element, 2)).toBe(1000)
  })
})
