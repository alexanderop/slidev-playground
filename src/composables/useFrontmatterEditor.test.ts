import { effectScope, ref } from 'vue'
import { useFrontmatterEditor } from './useFrontmatterEditor'

describe('useFrontmatterEditor', () => {
  it('creates frontmatter when missing', () => {
    const scope = effectScope()
    scope.run(() => {
      const markdown = ref('# Hello')
      const { updateProperty } = useFrontmatterEditor(markdown)

      updateProperty('title', 'Deck title')

      expect(markdown.value).toBe('---\ntitle: Deck title\n---\n\n# Hello')
    })
    scope.stop()
  })

  it('updates only the value portion of an existing top-level line', () => {
    const scope = effectScope()
    scope.run(() => {
      const markdown = ref(`---
title: Old title # keep this
---

# Hello`)
      const { updateProperty } = useFrontmatterEditor(markdown)

      updateProperty('title', 'New title')

      expect(markdown.value).toBe(`---
title: New title # keep this
---

# Hello`)
    })
    scope.stop()
  })

  it('quotes hex values and preserves nested comments', () => {
    const scope = effectScope()
    scope.run(() => {
      const markdown = ref(`---
themeConfig:
  primary: '#4fc08d' # brand
---

# Hello`)
      const { updateProperty } = useFrontmatterEditor(markdown)

      updateProperty('themeConfig.primary', '#ff0000')

      expect(markdown.value).toBe(`---
themeConfig:
  primary: '#ff0000' # brand
---

# Hello`)
    })
    scope.stop()
  })

  it('adds nested keys inside an existing parent block', () => {
    const scope = effectScope()
    scope.run(() => {
      const markdown = ref(`---
fonts:
  sans: Inter
title: Demo
---

# Hello`)
      const { updateProperty } = useFrontmatterEditor(markdown)

      updateProperty('fonts.mono', 'Fira Code')

      expect(markdown.value).toBe(`---
fonts:
  sans: Inter
  mono: Fira Code
title: Demo
---

# Hello`)
    })
    scope.stop()
  })

  it('updates numeric values without quoting them', () => {
    const scope = effectScope()
    scope.run(() => {
      const markdown = ref(`---
title: Demo
---

# Hello`)
      const { updateProperty } = useFrontmatterEditor(markdown)

      updateProperty('canvasWidth', 1200)

      expect(markdown.value).toBe(`---
title: Demo
canvasWidth: 1200
---

# Hello`)
    })
    scope.stop()
  })

  it('supports deeply nested values', () => {
    const scope = effectScope()
    scope.run(() => {
      const markdown = ref(`---
themeConfig:
  panel:
    color: teal
---

# Hello`)
      const { updateProperty } = useFrontmatterEditor(markdown)

      updateProperty('themeConfig.panel.accent', '#ff0000')

      expect(markdown.value).toBe(`---
themeConfig:
  panel:
    color: teal
    accent: '#ff0000'
---

# Hello`)
    })
    scope.stop()
  })

  it('serializes string arrays inline', () => {
    const scope = effectScope()
    scope.run(() => {
      const markdown = ref(`---
title: Demo
---

# Hello`)
      const { updateProperty } = useFrontmatterEditor(markdown)

      updateProperty('fonts.local', ['Inter', 'Fira Code'])

      expect(markdown.value).toBe(`---
title: Demo
fonts:
  local: [Inter, Fira Code]
---

# Hello`)
    })
    scope.stop()
  })

  it('removes empty ancestor blocks recursively', () => {
    const scope = effectScope()
    scope.run(() => {
      const markdown = ref(`---
themeConfig:
  panel:
    accent: '#4fc08d'
title: Demo
---

# Hello`)
      const { removeProperty } = useFrontmatterEditor(markdown)

      removeProperty('themeConfig.panel.accent')

      expect(markdown.value).toBe(`---
title: Demo
---

# Hello`)
    })
    scope.stop()
  })

  it('removes empty parent blocks when the last nested property is removed', () => {
    const scope = effectScope()
    scope.run(() => {
      const markdown = ref(`---
fonts:
  mono: Fira Code
title: Demo
---

# Hello`)
      const { removeProperty } = useFrontmatterEditor(markdown)

      removeProperty('fonts.mono')

      expect(markdown.value).toBe(`---
title: Demo
---

# Hello`)
    })
    scope.stop()
  })

  it('removes the frontmatter block entirely when it becomes empty', () => {
    const scope = effectScope()
    scope.run(() => {
      const markdown = ref(`---
title: Demo
---

# Hello`)
      const { removeProperty } = useFrontmatterEditor(markdown)

      removeProperty('title')

      expect(markdown.value).toBe('# Hello')
    })
    scope.stop()
  })
})
