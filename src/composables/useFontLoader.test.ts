import type { ResolvedFontOptions } from './useFontLoader'
import { buildGoogleFontsUrl } from './useFontLoader'

const baseFont: ResolvedFontOptions = {
  sans: ['Roboto', 'sans-serif'],
  serif: ['Georgia', 'serif'],
  mono: ['Fira Code', 'monospace'],
  webfonts: [],
  provider: 'google',
  local: [],
  italic: false,
  weights: ['200', '400', '600'],
}

describe('buildGoogleFontsUrl', () => {
  it('returns null when webfonts is empty', () => {
    expect(buildGoogleFontsUrl({ ...baseFont, webfonts: [] })).toBeNull()
  })

  it('builds URL for a single font with default weights', () => {
    const url = buildGoogleFontsUrl({ ...baseFont, webfonts: ['Roboto'] })
    expect(url).toContain('family=Roboto:wght@')
    expect(url).toContain('0,200')
    expect(url).toContain('0,400')
    expect(url).toContain('0,600')
    expect(url).toContain('display=swap')
  })

  it('builds URL for multiple fonts', () => {
    const url = buildGoogleFontsUrl({
      ...baseFont,
      webfonts: ['Roboto', 'Fira Code'],
    })
    expect(url).toContain('family=Roboto')
    expect(url).toContain('family=Fira+Code')
  })

  it('includes italic axis when italic is true', () => {
    const url = buildGoogleFontsUrl({
      ...baseFont,
      webfonts: ['Roboto'],
      italic: true,
    })
    expect(url).toContain('ital,wght@')
    expect(url).toContain('1,400')
  })

  it('encodes font names with spaces', () => {
    const url = buildGoogleFontsUrl({
      ...baseFont,
      webfonts: ['JetBrains Mono'],
    })
    expect(url).toContain('family=JetBrains+Mono')
  })
})
