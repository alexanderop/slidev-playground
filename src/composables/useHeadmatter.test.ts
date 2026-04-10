import { parseSync } from '@slidev/parser'
import { computed, effectScope } from 'vue'
import { useHeadmatter } from './useHeadmatter'

function createParsed(markdown: string) {
  return computed(() => parseSync(markdown, 'test.md'))
}

describe('useHeadmatter', () => {
  it('returns default config when no headmatter', () => {
    const scope = effectScope()
    scope.run(() => {
      const { config } = useHeadmatter(createParsed('# Hello'))
      expect(config.value.canvasWidth).toBe(980)
      expect(config.value.aspectRatio).toBeCloseTo(16 / 9)
      expect(config.value.colorSchema).toBe('auto')
    })
    scope.stop()
  })

  it('extracts themeConfig.primary', () => {
    const scope = effectScope()
    scope.run(() => {
      const { config } = useHeadmatter(
        createParsed('---\nthemeConfig:\n  primary: "#e11d48"\n---\n\n# Hello'),
      )
      expect(config.value.themeConfig.primary).toBe('#e11d48')
    })
    scope.stop()
  })

  it('resolves fonts config', () => {
    const scope = effectScope()
    scope.run(() => {
      const { config } = useHeadmatter(createParsed('---\nfonts:\n  sans: Roboto\n---\n\n# Hello'))
      expect(config.value.fonts.webfonts).toContain('Roboto')
      expect(config.value.fonts.sans[0]).toContain('Roboto')
    })
    scope.stop()
  })

  it('extracts canvasWidth and aspectRatio', () => {
    const scope = effectScope()
    scope.run(() => {
      const { config } = useHeadmatter(createParsed('---\ncanvasWidth: 1200\n---\n\n# Hello'))
      expect(config.value.canvasWidth).toBe(1200)
    })
    scope.stop()
  })

  it('extracts colorSchema', () => {
    const scope = effectScope()
    scope.run(() => {
      const { config } = useHeadmatter(createParsed('---\ncolorSchema: dark\n---\n\n# Hello'))
      expect(config.value.colorSchema).toBe('dark')
    })
    scope.stop()
  })

  it('recomputes when parsed input changes', () => {
    const scope = effectScope()
    scope.run(() => {
      const md = computed(() => parseSync('---\ncanvasWidth: 800\n---\n\n# Hello', 'test.md'))
      const { config } = useHeadmatter(md)
      expect(config.value.canvasWidth).toBe(800)
    })
    scope.stop()
  })
})
