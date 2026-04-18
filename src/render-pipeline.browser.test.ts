import { resolveConfig } from '@slidev/parser'
import { resolveSlidesFromMarkdown } from './features/slides/imports'
import { renderSlidesOnce } from './features/slides/render'

const KITCHEN_SINK = `---
theme: default
lineNumbers: true
---

# Title

<style>
.slidev-markdown h1 {
  color: red;
}
</style>

<ul v-clicks>
  <li>one</li>
  <li>two</li>
</ul>

---
layout: two-cols
---

::left::

\`\`\`ts {1|2}
const a = 1
const b = 2
\`\`\`

::right::

\`\`\`mermaid
graph TD
  A --> B
\`\`\`
`

it('Given a kitchen-sink deck When rendered Then the pipeline produces correct slots, clicks, styles, and layout', () => {
  const slides = resolveSlidesFromMarkdown(KITCHEN_SINK, 'slides.md')
  const config = resolveConfig(slides[0]?.frontmatter ?? {})
  const rendered = renderSlidesOnce({
    slides,
    config,
    defaults: {},
  })

  expect(rendered.length).toBe(2)

  const slide0 = rendered[0]
  expect(slide0.layout).toBe('cover')
  expect(slide0.totalClicks).toBe(2)
  expect(slide0.scopedStyles).toContain('#slidev-scope-0 .slidev-markdown h1')

  const slide1 = rendered[1]
  expect(slide1.layout).toBe('two-cols')
  expect(slide1.totalClicks).toBe(1)
  const slotNames = Object.keys(slide1.slotComponents)
  expect(slotNames).toContain('left')
  expect(slotNames).toContain('right')
})
