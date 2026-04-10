import { getDefaultConfig } from '@slidev/parser'
import type { SlidevConfig } from './useHeadmatter'

// Test the dimension math directly without provide/inject
function computeDimensions(overrides: Partial<SlidevConfig> = {}) {
  const defaults = getDefaultConfig()
  const config = { ...defaults, ...overrides }
  const width = config.canvasWidth || 960
  const ratio = config.aspectRatio || 16 / 9
  const height = Math.round(width / ratio)
  return { width, height }
}

describe('slide dimensions', () => {
  it('returns default 980x551 from parser defaults', () => {
    const { width, height } = computeDimensions()
    expect(width).toBe(980)
    expect(height).toBe(551)
  })

  it('computes height from custom canvasWidth at 16:9', () => {
    const { width, height } = computeDimensions({ canvasWidth: 1200 })
    expect(width).toBe(1200)
    expect(height).toBe(675)
  })

  it('handles 4:3 aspect ratio', () => {
    const { width, height } = computeDimensions({
      canvasWidth: 960,
      aspectRatio: 4 / 3,
    })
    expect(width).toBe(960)
    expect(height).toBe(720)
  })

  it('handles custom width and custom ratio together', () => {
    const { width, height } = computeDimensions({
      canvasWidth: 1920,
      aspectRatio: 16 / 9,
    })
    expect(width).toBe(1920)
    expect(height).toBe(1080)
  })
})
