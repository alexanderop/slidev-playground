import { effectScope } from 'vue'
import type { SlideInfo } from './usePresentation'
import { usePresentation } from './usePresentation'

describe('usePresentation', () => {
  const slides: SlideInfo[] = [
    { totalClicks: 0 },
    { totalClicks: 3, transition: 'fade' },
    { totalClicks: 1 },
  ]

  let scope: ReturnType<typeof effectScope>
  let p: ReturnType<typeof usePresentation>

  beforeEach(() => {
    scope = effectScope()
    scope.run(() => {
      p = usePresentation(() => slides)
    })
  })

  afterEach(() => {
    scope.stop()
  })

  it('starts not presenting', () => {
    expect(p.presenting.value).toBe(false)
  })

  it('start() enters presentation at slide 0', () => {
    p.start()
    expect(p.presenting.value).toBe(true)
    expect(p.currentSlide.value).toBe(0)
    expect(p.currentClick.value).toBe(0)
  })

  it('start(index) enters presentation at given slide', () => {
    p.start(2)
    expect(p.currentSlide.value).toBe(2)
    expect(p.currentClick.value).toBe(0)
  })

  it('next() increments click before advancing slide', () => {
    // Slide 1 has 3 clicks
    p.start(1)
    p.next()
    expect(p.currentSlide.value).toBe(1)
    expect(p.currentClick.value).toBe(1)

    p.next()
    expect(p.currentClick.value).toBe(2)

    p.next()
    expect(p.currentClick.value).toBe(3)
  })

  it('next() advances to next slide when clicks exhausted', () => {
    // Slide 0 has 0 clicks
    p.start(0)
    p.next()
    expect(p.currentSlide.value).toBe(1)
    expect(p.currentClick.value).toBe(0)
  })

  it('next() does nothing at last slide with no remaining clicks', () => {
    // Slide 2 (last) has 1 click
    p.start(2)
    p.next()
    p.next()
    expect(p.currentSlide.value).toBe(2)
    expect(p.currentClick.value).toBe(1)
  })

  it('prev() decrements click before going back', () => {
    p.start(1)
    p.next()
    p.next()
    p.prev()
    expect(p.currentSlide.value).toBe(1)
    expect(p.currentClick.value).toBe(1)
  })

  it('prev() goes to previous slide with click set to its totalClicks', () => {
    p.start(1)
    p.prev()
    expect(p.currentSlide.value).toBe(0)
    // Slide 0 has 0 totalClicks
    expect(p.currentClick.value).toBe(0)
  })

  it('prev() does nothing at slide 0 click 0', () => {
    p.start(0)
    p.prev()
    expect(p.currentSlide.value).toBe(0)
    expect(p.currentClick.value).toBe(0)
  })

  it('goToSlide() jumps to slide and resets click', () => {
    p.start(0)
    p.showOverview.value = true
    p.goToSlide(2)
    expect(p.currentSlide.value).toBe(2)
    expect(p.currentClick.value).toBe(0)
    expect(p.showOverview.value).toBe(false)
  })

  it('tracks navDirection on next/prev', () => {
    p.start(0)
    // Advance to slide 1
    p.next()
    expect(p.navDirection.value).toBe('forward')

    // Back to slide 0
    p.prev()
    expect(p.navDirection.value).toBe('backward')
  })

  it('resolves transitionName from slide data', () => {
    p.start(0)
    // Forward: transition comes from the "from" slide (slide 0), which has no transition
    p.next()
    expect(p.transitionName.value).toBe('slide-left')
  })

  it('stop() resets presentation state', () => {
    p.start(1)
    p.showOverview.value = true
    p.showNotes.value = true
    p.stop()
    expect(p.presenting.value).toBe(false)
    expect(p.showOverview.value).toBe(false)
    expect(p.showNotes.value).toBe(false)
  })
})
