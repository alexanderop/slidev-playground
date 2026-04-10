import { parseSync } from '@slidev/parser'
describe('slide pipeline', () => {
  it('parses multi-slide markdown into correct slide count', () => {
    const md = '# Slide 1\n\n---\n\n## Slide 2\n\n---\n\n## Slide 3'
    const parsed = parseSync(md, 'slides.md')
    expect(parsed.slides).toHaveLength(3)
  })

  it('extracts frontmatter layout from slides', () => {
    const md = '---\nlayout: center\n---\n\n# Centered Slide'
    const parsed = parseSync(md, 'slides.md')
    expect(parsed.slides[0]?.frontmatter.layout).toBe('center')
  })

  it('extracts speaker notes from HTML comments', () => {
    const md = '# Title\n\n<!--\nSpeaker note content here\n-->'
    const parsed = parseSync(md, 'slides.md')
    expect(parsed.slides[0]?.note).toContain('Speaker note content here')
  })

  it('extracts transition from slide frontmatter', () => {
    const md = '# Slide 1\n\n---\ntransition: fade\n---\n\n## Slide 2'
    const parsed = parseSync(md, 'slides.md')
    expect(parsed.slides[1]?.frontmatter.transition).toBe('fade')
  })
})
