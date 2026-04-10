import { resolveSlidesFromMarkdown, resolveSnippetImports } from './imports'

describe('slide imports', () => {
  it('resolves src imports and merges importing frontmatter', () => {
    const slides = resolveSlidesFromMarkdown(
      `---
layout: two-cols
class: imported-slide
src: ./src/test-fixtures/imported-slides.md
---`,
      'slides.md',
    )

    expect(slides).toHaveLength(1)
    expect(slides[0]?.filepath).toBe('/src/test-fixtures/imported-slides.md')
    expect(slides[0]?.frontmatter.layout).toBe('two-cols')
    expect(slides[0]?.frontmatter.class).toBe('imported-slide')
    expect(slides[0]?.content).toContain('Imported aside')
  })

  it('supports importing a selected slide range', () => {
    const slides = resolveSlidesFromMarkdown(
      `---
layout: end
src: ./src/test-fixtures/import-range-slides.md#2-3
---`,
      'slides.md',
    )

    expect(slides).toHaveLength(2)
    expect(slides.map((slide) => slide.content)).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Imported middle'),
        expect.stringContaining('Imported end'),
      ]),
    )
    expect(slides.every((slide) => slide.frontmatter.layout === 'end')).toBe(true)
  })

  it('resolves snippet imports and named regions', () => {
    const content = resolveSnippetImports(
      '<<< ./src/test-fixtures/snippet-example.ts#demo ts {1}',
      'slides.md',
    )

    expect(content).toContain('```ts {1}')
    expect(content).toContain('export const answer = 42')
    expect(content).not.toContain('export function sum')
  })
})
